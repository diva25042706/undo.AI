from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.engines.expected_state_engine import ExpectedStateModel
from backend.app.engines.independent_verifier import VerificationDifference, VerificationResult
from backend.app.engines.recovery_engine import RecoveryPlan
from backend.app.services.confidence_engine import ConfidenceReport


class ExpectedStateRequest(BaseModel):
    goal: str
    workspace_id: Optional[str] = None


class VerifyStateRequest(BaseModel):
    workspace_id: str
    expected_state: Optional[Dict[str, Any]] = None
    goal: Optional[str] = None
    simulate_failure: bool = False


class RecoveryExecuteRequest(BaseModel):
    workspace_id: str
    strategy: Optional[str] = "ROLLBACK"
    target_checkpoint_id: Optional[str] = None
    action_ids: Optional[List[str]] = None
    force_override: bool = False


class RecoveryStatusResponse(BaseModel):
    recovery_status: str  # SAFE | WARNING | FAILED | RECOVERED
    latest_checkpoint_id: Optional[str] = None
    latest_verification: Optional[VerificationResult] = None
    active_recovery_plan: Optional[RecoveryPlan] = None
    confidence: Optional[ConfidenceReport] = None
    workspace_file_count: int = 0
