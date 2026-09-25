import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.services.websocket_manager import ws_manager

logger = logging.getLogger("undo_ai")
router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/workspaces/{workspace_id}")
async def websocket_workspace_stream(websocket: WebSocket, workspace_id: str):
    """
    Real-time event stream for workspace action lifecycles, live rollbacks, and agent planning events.
    """
    await ws_manager.connect(workspace_id, websocket)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"event":"pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(workspace_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error on workspace {workspace_id}: {e}")
        ws_manager.disconnect(workspace_id, websocket)
