from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.exceptions import AgentNotFound
from backend.app.models.action import Action
from backend.app.models.agent import Agent
from backend.app.models.user import User
from backend.app.schemas.action import ActionResponse
from backend.app.schemas.agent import (
    AgentCreate,
    AgentExecuteRequest,
    AgentPlanRequest,
    AgentPlanResponse,
    AgentResponse,
)
from backend.app.schemas.common import APIResponse
from backend.app.services.execution_service import ExecutionService
from backend.app.services.planner_service import PlannerService
from backend.app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("", response_model=APIResponse[List[AgentResponse]])
async def list_agents(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all agents for the current user."""
    res = await db.execute(select(Agent).where(Agent.user_id == user.id))
    agents = res.scalars().all()
    return APIResponse(
        success=True,
        data=[AgentResponse.model_validate(a) for a in agents],
        message=f"Retrieved {len(agents)} agents.",
    )


@router.post("", response_model=APIResponse[AgentResponse], status_code=status.HTTP_201_CREATED)
async def create_agent(
    req: AgentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new autonomous task agent."""
    agent = Agent(
        user_id=user.id,
        name=req.name,
        description=req.description,
        avatar=req.avatar,
        role=req.role,
        status="ONLINE",
    )
    db.add(agent)
    await db.flush()

    return APIResponse(
        success=True,
        data=AgentResponse.model_validate(agent),
        message=f"Agent '{agent.name}' created successfully.",
    )


@router.get("/{agent_id}", response_model=APIResponse[AgentResponse])
async def get_agent(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific agent."""
    res = await db.execute(
        select(Agent).where((Agent.id == agent_id) | (Agent.name == agent_id))
    )
    agent = res.scalar_one_or_none()
    if not agent:
        raise AgentNotFound(agent_id)

    return APIResponse(
        success=True,
        data=AgentResponse.model_validate(agent),
        message="Agent retrieved.",
    )


@router.post("/{agent_id}/plan", response_model=APIResponse[AgentPlanResponse])
async def create_agent_plan(
    agent_id: str,
    req: AgentPlanRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AI Planner: Evaluates user instruction against workspace files and generates
    a structured, risk-scored action plan without modifying the state.
    """
    plan = await PlannerService.create_plan(
        db=db,
        agent_id=agent_id,
        workspace_id=req.workspace_id,
        user_id=user.id,
        instruction=req.instruction,
    )

    # Broadcast event via WebSocket
    await ws_manager.broadcast(
        workspace_id=req.workspace_id,
        event_type="agent.planning",
        data={
            "agent_id": agent_id,
            "instruction": req.instruction,
            "total_actions": plan.total_actions,
            "safe_count": plan.safe_actions_count,
            "approval_count": plan.requires_approval_count,
        },
    )

    return APIResponse(
        success=True,
        data=plan,
        message="Structured action plan proposed with risk scoring.",
    )


@router.post("/{agent_id}/execute", response_model=APIResponse[List[ActionResponse]])
async def execute_agent_plan(
    agent_id: str,
    req: AgentExecuteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Executes planned safe actions while halting high-risk ones for explicit approval.
    """
    # If explicit actions provided, execute them; otherwise plan and execute
    actions_to_run = req.actions
    if not actions_to_run and req.instruction:
        plan = await PlannerService.create_plan(
            db=db,
            agent_id=agent_id,
            workspace_id=req.workspace_id,
            user_id=user.id,
            instruction=req.instruction,
        )
        actions_to_run = plan.actions

    executed_records: List[Action] = []

    for item in (actions_to_run or []):
        # Skip if requiring approval unless auto_approve_safe
        if item.requires_approval and req.auto_approve_safe:
            # Action remains gated/pending approval
            continue

        action = await ExecutionService.execute_action(
            db=db,
            workspace_id=req.workspace_id,
            user_id=user.id,
            action_type=item.type,
            target=item.target,
            destination=item.destination,
            content=item.content,
            reason=item.reason,
            agent_id=agent_id,
            force_approved=not item.requires_approval,
        )
        executed_records.append(action)

        # Broadcast event
        await ws_manager.broadcast(
            workspace_id=req.workspace_id,
            event_type="action.completed",
            data={
                "action_id": action.action_id,
                "action_type": action.action_type,
                "target": action.target,
                "status": action.status,
            },
        )

    return APIResponse(
        success=True,
        data=[ActionResponse.model_validate(a) for a in executed_records],
        message=f"Executed {len(executed_records)} actions with atomic checkpoints.",
    )
