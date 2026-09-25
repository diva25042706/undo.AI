from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.exceptions import SnapshotNotFound
from backend.app.models.snapshot import Snapshot
from backend.app.models.user import User
from backend.app.schemas.common import APIResponse
from backend.app.schemas.snapshot import (
    SnapshotCreate,
    SnapshotDetailResponse,
    SnapshotResponse,
    SnapshotRestoreResponse,
)
from backend.app.services.snapshot_service import SnapshotService
from backend.app.services.websocket_manager import ws_manager

router = APIRouter(tags=["Snapshots & Time Travel"])


@router.post("/workspaces/{workspace_id}/snapshots", response_model=APIResponse[SnapshotResponse], status_code=status.HTTP_201_CREATED)
async def create_snapshot(
    workspace_id: str,
    req: SnapshotCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a manual checkpoint snapshot of the workspace."""
    snap = await SnapshotService.create_snapshot(
        db=db,
        workspace_id=workspace_id,
        user_id=user.id,
        name=req.name,
        description=req.description,
    )

    await ws_manager.broadcast(
        workspace_id=workspace_id,
        event_type="snapshot.created",
        data={"snapshot_id": snap.snapshot_id, "name": snap.name},
    )

    return APIResponse(
        success=True,
        data=SnapshotResponse.model_validate(snap),
        message=f"Snapshot '{snap.name}' created.",
    )


@router.get("/workspaces/{workspace_id}/snapshots", response_model=APIResponse[List[SnapshotResponse]])
async def list_workspace_snapshots(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all snapshots for a workspace in reverse chronological order."""
    res = await db.execute(
        select(Snapshot)
        .where(Snapshot.workspace_id == workspace_id)
        .order_by(Snapshot.created_at.desc())
    )
    snapshots = res.scalars().all()

    return APIResponse(
        success=True,
        data=[SnapshotResponse.model_validate(s) for s in snapshots],
        message=f"Retrieved {len(snapshots)} snapshots.",
    )


@router.get("/snapshots/{snapshot_id}", response_model=APIResponse[SnapshotDetailResponse])
async def get_snapshot_detail(
    snapshot_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full state tree for snapshot before/after comparison."""
    res = await db.execute(
        select(Snapshot).where(
            (Snapshot.id == snapshot_id) | (Snapshot.snapshot_id == snapshot_id)
        )
    )
    snap = res.scalar_one_or_none()
    if not snap:
        raise SnapshotNotFound(snapshot_id)

    return APIResponse(
        success=True,
        data=SnapshotDetailResponse.model_validate(snap),
        message="Snapshot detail retrieved.",
    )


@router.post("/snapshots/{snapshot_id}/restore", response_model=APIResponse[SnapshotRestoreResponse])
async def restore_snapshot(
    snapshot_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Time Travel: Reverts workspace state to snapshot checkpoint with pre-restore safety checkpoint.
    """
    result = await SnapshotService.restore_snapshot(
        db=db,
        snapshot_id=snapshot_id,
        user_id=user.id,
    )

    return APIResponse(
        success=True,
        data=SnapshotRestoreResponse(**result),
        message=result["message"],
    )
