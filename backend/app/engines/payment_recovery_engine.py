from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.engines.payment_verifier import PaymentVerificationResult
from backend.app.services.payment_simulator import PaymentSimulator


class PaymentRecoveryPlan(BaseModel):
    strategy: str  # CANCEL | COMPENSATE | HUMAN_ESCALATION
    reason: str
    transaction_id: str
    target_checkpoint_id: str
    estimated_recovery_time_sec: float = 0.6
    recovery_confidence: float = 0.99
    requires_human_approval: bool = False
    action_label: str
    action_description: str


class PaymentRecoveryDecisionEngine:
    """
    Action-Aware FinTech Recovery Engine.
    Evaluates live transaction state rather than blindly pressing 'Undo':
    - PENDING Payment: CANCEL (Safe, releases reserved funds immediately)
    - COMPLETED Payment: COMPENSATE (Executes reverse refund transaction)
    - UNSAFE / IRREVERSIBLE: HUMAN_ESCALATION (Halts automated reversal and asks human auditor)
    """

    @staticmethod
    def evaluate_recovery(
        verification: PaymentVerificationResult,
        transaction: Dict[str, Any],
    ) -> PaymentRecoveryPlan:
        status = transaction.get("status", "PENDING").upper()
        txn_id = transaction.get("transaction_id", "TXN-UNKNOWN")
        cp_id = transaction.get("checkpoint_id", "CP-PAY-001")

        # Case 1: Pending transaction
        if status in ["PENDING", "PROCESSING", "CREATED"]:
            return PaymentRecoveryPlan(
                strategy="CANCEL",
                reason=f"Payment is currently {status}. Mismatch detected before ledger settlement. Can safely be cancelled.",
                transaction_id=txn_id,
                target_checkpoint_id=cp_id,
                estimated_recovery_time_sec=0.5,
                recovery_confidence=0.99,
                requires_human_approval=False,
                action_label="Cancel Payment & Restore Balance",
                action_description="Cancels the in-flight simulated payment and restores reserved funds from checkpoint.",
            )

        # Case 2: Completed transaction
        elif status == "COMPLETED":
            return PaymentRecoveryPlan(
                strategy="COMPENSATE",
                reason="Payment was already completed. Direct deletion/undo is invalid on immutable ledgers. Initiating compensating refund transaction.",
                transaction_id=txn_id,
                target_checkpoint_id=cp_id,
                estimated_recovery_time_sec=0.8,
                recovery_confidence=0.97,
                requires_human_approval=False,
                action_label="Issue Compensating Refund",
                action_description="Credits sender account and debits incorrect recipient via linked refund TXN.",
            )

        # Case 3: Blocked / Irreversible / Ambiguous
        else:
            return PaymentRecoveryPlan(
                strategy="HUMAN_ESCALATION",
                reason="Transaction state is ambiguous or irreversible. Automated reversal blocked to prevent financial loss.",
                transaction_id=txn_id,
                target_checkpoint_id=cp_id,
                estimated_recovery_time_sec=1.5,
                recovery_confidence=0.85,
                requires_human_approval=True,
                action_label="Escalate to Human Auditor",
                action_description="Halts automated recovery and routes transaction to compliance reviewer.",
            )
