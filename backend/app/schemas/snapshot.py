from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SnapshotCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None


class SnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    snapshot_id: str
    workspace_id: str
    user_id: str
    name: str
    description: Optional[str] = None
    state_hash: str
    action_count: int
    is_current: bool
    created_at: datetime


class SnapshotDetailResponse(SnapshotResponse):
    state: Dict[str, Any]


class SnapshotRestoreResponse(BaseModel):
    success: bool
    snapshot_id: str
    restored: bool
    safety_checkpoint_id: str
    message: str
