import json
import logging
from typing import Any, Dict, List
from fastapi import WebSocket

logger = logging.getLogger("undo_ai")


class WebSocketManager:
    def __init__(self):
        # Maps workspace_id to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, workspace_id: str, websocket: WebSocket):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)
        logger.info(f"WebSocket connected for workspace: {workspace_id}")

    def disconnect(self, workspace_id: str, websocket: WebSocket):
        if workspace_id in self.active_connections:
            if websocket in self.active_connections[workspace_id]:
                self.active_connections[workspace_id].remove(websocket)
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]
        logger.info(f"WebSocket disconnected for workspace: {workspace_id}")

    async def broadcast(self, workspace_id: str, event_type: str, data: Dict[str, Any]):
        if workspace_id not in self.active_connections:
            return

        payload = {
            "event": event_type,
            "data": data,
        }
        message = json.dumps(payload)
        dead_connections = []

        for connection in self.active_connections[workspace_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to WebSocket: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(workspace_id, dead)


ws_manager = WebSocketManager()
