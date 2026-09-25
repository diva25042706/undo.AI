from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CheckpointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    checkpoint_id: str
    workspace_id: str
    user_id: str
    action_id: Optional[str] = None
    name: str
    trigger: str
    state_hash: str
    created_at: datetime
