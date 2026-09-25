from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class ActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    action_id: str  # ACT-92831
    agent_id: Optional[str] = None
    workspace_id: str
    user_id: str
    action_type: str
    target: str
    description: Optional[str] = None
    reason: Optional[str] = None
    status: str  # PLANNED, PENDING_APPROVAL, APPROVED, EXECUTING, COMPLETED, ROLLING_BACK, UNDONE, FAILED, ROLLBACK_FAILED
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    is_reversible: bool
    rollback_available: bool
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    inverse_operation: Optional[Dict[str, Any]] = None
    workspace_version_before: int
    workspace_version_after: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    undone_at: Optional[datetime] = None
    version: int


class ActionApprovalRequest(BaseModel):
    reason: Optional[str] = "Approved by user administrator"


class ActionUndoRequest(BaseModel):
    cascade: bool = False
    reason: Optional[str] = "User requested rollback"


class UndoResultResponse(BaseModel):
    success: bool
    action_id: str
    status: str
    message: str
    undone_actions: List[str] = []
    restored_resources: List[str] = []
    checkpoint_created: Optional[str] = None
