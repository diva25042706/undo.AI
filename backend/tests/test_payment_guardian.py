import pytest
from backend.app.engines.payment_recovery_engine import PaymentRecoveryDecisionEngine
from backend.app.engines.payment_verifier import PaymentVerifier
from backend.app.services.payment_simulator import PaymentSimulator


@pytest.mark.asyncio
async def test_payment_sandbox_initialization_and_checkpoint():
    reset_data = PaymentSimulator.reset_sandbox()
    assert reset_data["sender_balance"] == 100000.0
    assert reset_data["baseline_checkpoint"] == "CP-PAY-001"

    accounts = PaymentSimulator.get_accounts()
    assert len(accounts) >= 6
    sender = next(a for a in accounts if a.account_id == "ACC-SENDER")
    sam = next(a for a in accounts if a.account_id == "ACC-SAM")
    assert sender.balance == 100000.0
    assert sam.balance == 50000.0


@pytest.mark.asyncio
async def test_independent_verifier_destination_mismatch():
    expected_rec = "Sam"
    expected_amt = 10000.0

    # Fault injected: recipient is Rakesh
    actual_txn = {
        "transaction_id": "TXN-TEST01",
        "recipient_name": "Rakesh",
        "amount": 10000.0,
        "status": "PENDING",
    }

    verif = PaymentVerifier.verify_transaction(
        expected_recipient=expected_rec,
        expected_amount=expected_amt,
        actual_transaction=actual_txn,
    )

    assert verif.is_valid is False
    assert verif.status == "FAILED"
    assert verif.mismatch_type == "DESTINATION_MISMATCH"
    assert verif.recommended_recovery == "CANCEL"
    assert "Destination Mismatch" in verif.differences[0]


@pytest.mark.asyncio
async def test_independent_verifier_amount_and_duplicate():
    # Amount mismatch
    verif_amt = PaymentVerifier.verify_transaction(
        expected_recipient="Sam",
        expected_amount=10000.0,
        actual_transaction={"recipient_name": "Sam", "amount": 15000.0, "status": "PENDING"},
    )
    assert verif_amt.is_valid is False
    assert verif_amt.mismatch_type == "AMOUNT_MISMATCH"

    # Duplicate transaction
    verif_dup = PaymentVerifier.verify_transaction(
        expected_recipient="Sam",
        expected_amount=10000.0,
        actual_transaction={"recipient_name": "Sam", "amount": 10000.0, "status": "PENDING"},
        transaction_count=2,
    )
    assert verif_dup.is_valid is False
    assert verif_dup.mismatch_type == "DUPLICATE_TRANSACTION"


@pytest.mark.asyncio
async def test_recovery_engine_decisions():
    # Case 1: Pending transaction -> CANCEL
    verif_pending = PaymentVerifier.verify_transaction(
        expected_recipient="Sam",
        expected_amount=10000.0,
        actual_transaction={"recipient_name": "Rakesh", "amount": 10000.0, "status": "PENDING"},
    )
    plan_cancel = PaymentRecoveryDecisionEngine.evaluate_recovery(
        verification=verif_pending,
        transaction={"transaction_id": "TXN-01", "status": "PENDING", "checkpoint_id": "CP-PAY-001"},
    )
    assert plan_cancel.strategy == "CANCEL"
    assert plan_cancel.requires_human_approval is False

    # Case 2: Completed transaction -> COMPENSATE
    plan_comp = PaymentRecoveryDecisionEngine.evaluate_recovery(
        verification=verif_pending,
        transaction={"transaction_id": "TXN-02", "status": "COMPLETED", "checkpoint_id": "CP-PAY-001"},
    )
    assert plan_comp.strategy == "COMPENSATE"

    # Case 3: Ambiguous / Irreversible -> HUMAN_ESCALATION
    plan_esc = PaymentRecoveryDecisionEngine.evaluate_recovery(
        verification=verif_pending,
        transaction={"transaction_id": "TXN-03", "status": "BLOCKED_IRREVERSIBLE", "checkpoint_id": "CP-PAY-001"},
    )
    assert plan_esc.strategy == "HUMAN_ESCALATION"
    assert plan_esc.requires_human_approval is True


@pytest.mark.asyncio
async def test_flagship_demo_loop_five_times():
    """
    Executes the exact flagship demo flow 5 consecutive times:
    ₹10,000 to Sam -> inject Rakesh -> independent verifier detects mismatch ->
    recovery engine cancels transaction -> balance restored -> final state verified.
    """
    for iteration in range(1, 6):
        # 1. Reset
        PaymentSimulator.reset_sandbox()
        assert PaymentSimulator._accounts["ACC-SENDER"]["balance"] == 100000.0

        # 2. Checkpoint
        cp = PaymentSimulator.create_checkpoint(f"CP-LOOP-{iteration}", "Pre-Payment Snapshot")

        # 3. Initiate payment to Sam with injected fault (Rakesh)
        txn = PaymentSimulator.initiate_payment(
            intended_recipient="Sam",
            amount=10000.0,
            actual_recipient_override="Rakesh",
            force_status="PENDING",
        )
        assert txn["status"] == "PENDING"
        assert PaymentSimulator._accounts["ACC-SENDER"]["balance"] == 90000.0

        # 4. Independent Verifier
        verif = PaymentVerifier.verify_transaction(
            expected_recipient="Sam",
            expected_amount=10000.0,
            actual_transaction=txn,
        )
        assert verif.is_valid is False
        assert verif.mismatch_type == "DESTINATION_MISMATCH"

        # 5. Recovery Decision Engine
        plan = PaymentRecoveryDecisionEngine.evaluate_recovery(verification=verif, transaction=txn)
        assert plan.strategy == "CANCEL"

        # 6. Execute Cancellation & Restore Checkpoint
        cancel_res = PaymentSimulator.cancel_transaction(txn["transaction_id"])
        assert cancel_res["status"] == "CANCELLED"
        assert cancel_res["sender_balance"] == 100000.0
        assert PaymentSimulator._accounts["ACC-SENDER"]["balance"] == 100000.0

        # 7. Post-Recovery Verification
        verif_post = PaymentVerifier.verify_transaction(
            expected_recipient="Sam",
            expected_amount=10000.0,
            actual_transaction={"recipient_name": "Sam", "amount": 10000.0, "status": "CANCELLED"},
        )
        assert verif_post.is_valid is True
