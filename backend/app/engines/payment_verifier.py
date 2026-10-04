from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PaymentVerificationResult(BaseModel):
    status: str  # "PASSED" | "FAILED"
    is_valid: bool
    mismatch_type: str = "NONE"  # DESTINATION_MISMATCH | AMOUNT_MISMATCH | DUPLICATE_TRANSACTION | NONE
    summary: str
    expected_recipient: str
    actual_recipient: str
    expected_amount: float
    actual_amount: float
    differences: List[str] = Field(default_factory=list)
    confidence: float = 0.99
    risk_level: str = "CRITICAL"
    risk_score: int = 95
    recommended_recovery: str = "CANCEL"


class PaymentVerifier:
    """
    Independent Deterministic Payment Verifier.
    Core Rule: 'Never ask the agent if payment succeeded. Independently compare
    the user's intended payment contract with the live simulated transaction state.'
    """

    @staticmethod
    def verify_transaction(
        expected_recipient: str,
        expected_amount: float,
        actual_transaction: Dict[str, Any],
        transaction_count: int = 1,
    ) -> PaymentVerificationResult:
        actual_recipient = actual_transaction.get("recipient_name", "")
        actual_amount = float(actual_transaction.get("amount", 0.0))
        actual_status = actual_transaction.get("status", "UNKNOWN")

        differences: List[str] = []
        mismatch_type = "NONE"

        # 1. Recipient Mismatch Check
        exp_rec_clean = expected_recipient.strip().lower()
        act_rec_clean = actual_recipient.strip().lower()

        if exp_rec_clean not in act_rec_clean and act_rec_clean not in exp_rec_clean:
            mismatch_type = "DESTINATION_MISMATCH"
            differences.append(
                f"Destination Mismatch: Intended recipient was '{expected_recipient}', but transaction was directed to '{actual_recipient}'."
            )

        # 2. Amount Mismatch Check
        if abs(actual_amount - expected_amount) > 0.01:
            if mismatch_type == "NONE":
                mismatch_type = "AMOUNT_MISMATCH"
            differences.append(
                f"Amount Mismatch: Intended amount was ₹{expected_amount:,.2f}, but actual transaction amount was ₹{actual_amount:,.2f}."
            )

        # 3. Duplicate Transaction Check
        if transaction_count > 1:
            mismatch_type = "DUPLICATE_TRANSACTION"
            differences.append(
                f"Duplicate Transaction Detected: Expected 1 transaction, found {transaction_count} simultaneous submissions."
            )

        is_passed = len(differences) == 0
        status = "PASSED" if is_passed else "FAILED"

        # Recommend recovery strategy based on live transaction state
        if is_passed:
            recommended = "COMMIT"
            summary = f"Payment verified successfully: ₹{actual_amount:,.2f} to {actual_recipient}."
        else:
            if actual_status in ["PENDING", "PROCESSING", "CREATED"]:
                recommended = "CANCEL"
            elif actual_status == "COMPLETED":
                recommended = "COMPENSATE"
            else:
                recommended = "HUMAN_ESCALATION"

            summary = f"VERIFICATION FAILED: {differences[0]}"

        return PaymentVerificationResult(
            status=status,
            is_valid=is_passed,
            mismatch_type=mismatch_type,
            summary=summary,
            expected_recipient=expected_recipient,
            actual_recipient=actual_recipient,
            expected_amount=expected_amount,
            actual_amount=actual_amount,
            differences=differences,
            confidence=0.99,
            risk_level="CRITICAL",
            risk_score=95,
            recommended_recovery=recommended,
        )
