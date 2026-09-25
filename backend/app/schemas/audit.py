from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_id: str
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    action_id: Optional[str] = None
    event_type: str
    message: str
    metadata_json: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: datetime
