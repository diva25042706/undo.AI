from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    root_path: str = "/project"


class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    root_path: str
    version: int
    is_locked: bool
    locked_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class WorkspaceStateResponse(BaseModel):
    workspace_id: str
    version: int
    state_hash: str
    state: Dict[str, Any]
    total_files: int
    total_directories: int
