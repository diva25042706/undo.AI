from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AgentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None
    avatar: str = "🤖"
    role: str = "Autonomous Task Agent"


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    status: str
    avatar: str
    role: str
    current_task: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PlannedActionSchema(BaseModel):
    type: str = Field(description="CREATE, UPDATE, DELETE, MOVE, RENAME, COPY, METADATA_UPDATE")
    target: str = Field(description="Target file path or identifier, e.g. /project/README.md")
    destination: Optional[str] = Field(default=None, description="Destination path for MOVE/RENAME/COPY")
    content: Optional[str] = Field(default=None, description="Content for CREATE or UPDATE")
    reason: str = Field(description="Reason explaining why this action is necessary")
    risk: str = Field(default="LOW", description="LOW, MEDIUM, HIGH, CRITICAL")
    risk_score: Optional[int] = Field(default=10)
    risk_reasons: Optional[List[str]] = Field(default_factory=list)
    requires_approval: bool = False
    is_reversible: bool = True


class AgentPlanRequest(BaseModel):
    workspace_id: str
    instruction: str = Field(min_length=3, description="User instruction to the AI agent")


class AgentPlanResponse(BaseModel):
    execution_id: str
    agent_id: str
    workspace_id: str
    instruction: str
    summary: str
    total_actions: int
    safe_actions_count: int
    requires_approval_count: int
    actions: List[PlannedActionSchema]


class AgentExecuteRequest(BaseModel):
    workspace_id: str
    instruction: Optional[str] = None
    actions: Optional[List[PlannedActionSchema]] = None
    auto_approve_safe: bool = True
