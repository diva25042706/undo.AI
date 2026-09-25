from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.exceptions import WorkspaceLocked
from backend.app.models.user import User
from backend.app.models.workspace import Workspace
from backend.app.schemas.common import APIResponse
from backend.app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceStateResponse,
)
from backend.app.utils.hashing import compute_state_hash

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("", response_model=APIResponse[List[WorkspaceResponse]])
async def list_workspaces(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces belonging to the current user."""
    res = await db.execute(select(Workspace).where(Workspace.user_id == user.id))
    workspaces = res.scalars().all()

    return APIResponse(
        success=True,
        data=[WorkspaceResponse.model_validate(w) for w in workspaces],
        message=f"Retrieved {len(workspaces)} workspaces.",
    )


@router.post("", response_model=APIResponse[WorkspaceResponse], status_code=status.HTTP_201_CREATED)
async def create_workspace(
    req: WorkspaceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new virtual workspace."""
    workspace = Workspace(
        user_id=user.id,
        name=req.name,
        root_path=req.root_path,
        state={"files": {}, "directories": [req.root_path]},
    )
    db.add(workspace)
    await db.flush()

    return APIResponse(
        success=True,
        data=WorkspaceResponse.model_validate(workspace),
        message=f"Workspace '{workspace.name}' initialized.",
    )


@router.get("/{workspace_id}", response_model=APIResponse[WorkspaceResponse])
async def get_workspace(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get metadata for a specific workspace."""
    res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise WorkspaceLocked(workspace_id)

    return APIResponse(
        success=True,
        data=WorkspaceResponse.model_validate(workspace),
        message="Workspace retrieved.",
    )


@router.get("/{workspace_id}/state", response_model=APIResponse[WorkspaceStateResponse])
async def get_workspace_state(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get live virtual file system state with SHA-256 state hash and file counters.
    """
    res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise WorkspaceLocked(workspace_id)

    state = workspace.state or {}
    files = state.get("files", {})
    directories = state.get("directories", [])

    return APIResponse(
        success=True,
        data=WorkspaceStateResponse(
            workspace_id=workspace.id,
            version=workspace.version,
            state_hash=compute_state_hash(state),
            state=state,
            total_files=len(files),
            total_directories=len(directories),
        ),
        message="Workspace virtual file tree retrieved.",
    )
