from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.engines.payment_recovery_engine import PaymentRecoveryPlan
from backend.app.engines.payment_verifier import PaymentVerificationResult
from backend.app.services.payment_simulator import SimulatedAccount, SimulatedTransaction


class PaymentIntentRequest(BaseModel):
    prompt: str = "Pay ₹10,000 to Sam."
    intended_recipient: Optional[str] = "Sam"
    intended_amount: Optional[float] = 10000.0
    currency: Optional[str] = "INR"


class PaymentInitiateRequest(BaseModel):
    intended_recipient: str = "Sam"
    intended_amount: float = 10000.0
    actual_recipient: Optional[str] = None
    actual_amount: Optional[float] = None
    fault_injection: Optional[str] = "WRONG_RECIPIENT"  # NONE | WRONG_RECIPIENT | WRONG_AMOUNT | DUPLICATE | COMPLETED_COMPENSATE | IRREVERSIBLE
    force_status: Optional[str] = "PENDING"


class PaymentVerifyRequest(BaseModel):
    transaction_id: str
    intended_recipient: str = "Sam"
    intended_amount: float = 10000.0


class PaymentRecoveryExecuteRequest(BaseModel):
    transaction_id: str
    strategy: Optional[str] = "CANCEL"


class PaymentDemoRunResponse(BaseModel):
    scenario: str
    step_1_intent: Dict[str, Any]
    step_2_expected_state: Dict[str, Any]
    step_3_risk_score: int
    step_4_checkpoint_id: str
    step_5_transaction_initiated: Dict[str, Any]
    step_6_fault_injected: str
    step_7_verifier_result: PaymentVerificationResult
    step_8_recovery_plan: PaymentRecoveryPlan
    step_9_recovery_execution: Dict[str, Any]
    step_10_post_recovery_verification: PaymentVerificationResult
    final_sender_balance: float
    final_status: str
