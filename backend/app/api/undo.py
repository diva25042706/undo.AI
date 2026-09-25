from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.action import UndoResultResponse
from backend.app.schemas.common import APIResponse
from backend.app.services.undo_service import UndoService
from backend.app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/workspaces", tags=["Undo Engine"])


@router.post("/{workspace_id}/undo-last", response_model=APIResponse[UndoResultResponse])
async def undo_last_action(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Global 1-Click Undo: Finds the most recent reversible action in the workspace
    and rolls it back without erasing audit history.
    """
    await ws_manager.broadcast(
        workspace_id=workspace_id,
        event_type="action.undo_started",
        data={"workspace_id": workspace_id, "trigger": "undo_last"},
    )

    result = await UndoService.undo_last_action(
        db=db,
        workspace_id=workspace_id,
        user_id=user.id,
    )

    await ws_manager.broadcast(
        workspace_id=workspace_id,
        event_type="action.undo_completed",
        data={
            "action_id": result.action_id,
            "status": "UNDONE",
            "workspace_id": workspace_id,
        },
    )

    return APIResponse(
        success=True,
        data=result,
        message=f"Last action '{result.action_id}' successfully undone.",
    )
