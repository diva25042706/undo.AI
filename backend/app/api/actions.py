from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.exceptions import ActionNotFound, InvalidActionState
from backend.app.models.action import Action
from backend.app.models.user import User
from backend.app.schemas.action import (
    ActionApprovalRequest,
    ActionResponse,
    ActionUndoRequest,
    UndoResultResponse,
)
from backend.app.schemas.common import APIResponse
from backend.app.services.audit_service import AuditService
from backend.app.services.execution_service import ExecutionService
from backend.app.services.undo_service import UndoService
from backend.app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/actions", tags=["Actions"])


@router.get("", response_model=APIResponse[List[ActionResponse]])
async def list_actions(
    status: Optional[str] = Query(None, description="Filter by status, e.g. COMPLETED, UNDONE, PENDING_APPROVAL"),
    risk: Optional[str] = Query(None, description="Filter by risk level, e.g. LOW, MEDIUM, HIGH, CRITICAL"),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    reversible: Optional[bool] = Query(None, description="Filter by reversibility"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query actions with comprehensive filtering and pagination."""
    stmt = select(Action).where(Action.user_id == user.id)

    if status:
        stmt = stmt.where(Action.status == status.upper())
    if risk:
        stmt = stmt.where(Action.risk_level == risk.upper())
    if agent_id:
        stmt = stmt.where(Action.agent_id == agent_id)
    if reversible is not None:
        stmt = stmt.where(Action.is_reversible == reversible)

    stmt = stmt.order_by(Action.created_at.desc()).offset((page - 1) * limit).limit(limit)
    res = await db.execute(stmt)
    actions = res.scalars().all()

    return APIResponse(
        success=True,
        data=[ActionResponse.model_validate(a) for a in actions],
        message=f"Retrieved {len(actions)} actions.",
    )


@router.get("/{action_id}", response_model=APIResponse[ActionResponse])
async def get_action(
    action_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full details of an action including before/after state and inverse operation."""
    res = await db.execute(
        select(Action).where(
            (Action.id == action_id) | (Action.action_id == action_id)
        )
    )
    action = res.scalar_one_or_none()
    if not action:
        raise ActionNotFound(action_id)

    return APIResponse(
        success=True,
        data=ActionResponse.model_validate(action),
        message="Action retrieved.",
    )


@router.post("/{action_id}/approve", response_model=APIResponse[ActionResponse])
async def approve_action(
    action_id: str,
    req: ActionApprovalRequest = ActionApprovalRequest(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve an action that was paused in PENDING_APPROVAL state, allowing it to execute.
    """
    res = await db.execute(
        select(Action).where(
            (Action.id == action_id) | (Action.action_id == action_id)
        )
    )
    action = res.scalar_one_or_none()
    if not action:
        raise ActionNotFound(action_id)

    if action.status != "PENDING_APPROVAL":
        raise InvalidActionState(action.action_id, action.status, "PENDING_APPROVAL")

    # Execute approved action
    executed = await ExecutionService.execute_action(
        db=db,
        workspace_id=action.workspace_id,
        user_id=user.id,
        action_type=action.action_type,
        target=action.target,
        destination=(action.after_state or {}).get("destination"),
        reason=f"Approved: {req.reason}",
        agent_id=action.agent_id,
        force_approved=True,
    )

    # Mark old pending record as approved/superseded
    action.status = "APPROVED"
    await db.flush()

    await AuditService.log_event(
        db=db,
        event_type="APPROVAL_GRANTED",
        message=f"Action '{action.action_id}' approved and executed as '{executed.action_id}'.",
        user_id=user.id,
        action_id=executed.action_id,
    )

    return APIResponse(
        success=True,
        data=ActionResponse.model_validate(executed),
        message="Action approved and executed successfully.",
    )


@router.post("/{action_id}/reject", response_model=APIResponse[ActionResponse])
async def reject_action(
    action_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending action."""
    res = await db.execute(
        select(Action).where(
            (Action.id == action_id) | (Action.action_id == action_id)
        )
    )
    action = res.scalar_one_or_none()
    if not action:
        raise ActionNotFound(action_id)

    action.status = "REJECTED"
    await db.flush()

    await AuditService.log_event(
        db=db,
        event_type="POLICY_BLOCKED",
        message=f"Action '{action.action_id}' was rejected by administrator.",
        user_id=user.id,
        action_id=action.action_id,
    )

    return APIResponse(
        success=True,
        data=ActionResponse.model_validate(action),
        message="Action rejected.",
    )


@router.post("/{action_id}/undo", response_model=APIResponse[UndoResultResponse])
async def undo_action(
    action_id: str,
    req: ActionUndoRequest = ActionUndoRequest(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Roll back an action using its stored inverse operation.
    Validates state integrity and prevents stale conflicts.
    """
    # Broadcast start
    res = await db.execute(
        select(Action).where(
            (Action.id == action_id) | (Action.action_id == action_id)
        )
    )
    action = res.scalar_one_or_none()
    if action:
        await ws_manager.broadcast(
            workspace_id=action.workspace_id,
            event_type="action.undo_started",
            data={"action_id": action.action_id, "status": "ROLLING_BACK"},
        )

    result = await UndoService.undo_action(
        db=db,
        action_id=action_id,
        user_id=user.id,
        cascade=req.cascade,
    )

    if action:
        await ws_manager.broadcast(
            workspace_id=action.workspace_id,
            event_type="action.undo_completed",
            data={"action_id": action.action_id, "status": "UNDONE"},
        )

    return APIResponse(
        success=True,
        data=result,
        message=result.message,
    )
