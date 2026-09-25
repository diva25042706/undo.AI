from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.models.user import User
from backend.app.schemas.audit import AuditLogResponse
from backend.app.schemas.common import APIResponse

router = APIRouter(prefix="/audit", tags=["Audit Log"])


@router.get("", response_model=APIResponse[List[AuditLogResponse]])
async def list_audit_logs(
    event_type: Optional[str] = Query(None, description="Filter by event type, e.g. ACTION_COMPLETED, ROLLBACK_COMPLETED"),
    action_id: Optional[str] = Query(None, description="Filter by action identifier"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve immutable audit trail records."""
    stmt = select(AuditLog)
    if user:
        stmt = stmt.where((AuditLog.user_id == user.id) | (AuditLog.user_id.is_(None)))

    if event_type:
        stmt = stmt.where(AuditLog.event_type == event_type.upper())
    if action_id:
        stmt = stmt.where(AuditLog.action_id == action_id)

    stmt = stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    return APIResponse(
        success=True,
        data=[AuditLogResponse.model_validate(l) for l in logs],
        message=f"Retrieved {len(logs)} audit entries.",
    )


@router.get("/{action_id}", response_model=APIResponse[List[AuditLogResponse]])
async def get_action_audit_trail(
    action_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complete lifecycle audit history for a specific action (planned -> executed -> rolled back)."""
    res = await db.execute(
        select(AuditLog)
        .where(AuditLog.action_id == action_id)
        .order_by(AuditLog.created_at.asc())
    )
    logs = res.scalars().all()

    return APIResponse(
        success=True,
        data=[AuditLogResponse.model_validate(l) for l in logs],
        message=f"Retrieved {len(logs)} audit lifecycle entries for action '{action_id}'.",
    )
