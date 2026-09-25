from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PolicyCreate(BaseModel):
    action_type: str = Field(description="CREATE, MOVE, RENAME, UPDATE, DELETE, SYSTEM_MODIFY, EMAIL_SEND, TRANSACTION")
    category: str = "file_ops"
    allowed: bool = True
    requires_approval: bool = False
    max_risk_level: str = "HIGH"
    description: Optional[str] = None
    agent_id: Optional[str] = None


class PolicyUpdate(BaseModel):
    allowed: Optional[bool] = None
    requires_approval: Optional[bool] = None
    max_risk_level: Optional[str] = None
    description: Optional[str] = None


class PolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    agent_id: Optional[str] = None
    action_type: str
    category: str
    allowed: bool
    requires_approval: bool
    max_risk_level: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
