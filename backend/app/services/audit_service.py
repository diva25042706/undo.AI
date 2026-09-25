import logging
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.audit import AuditLog
from backend.app.utils.ids import generate_audit_id

logger = logging.getLogger("undo_ai")


class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_type: str,
        message: str,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        action_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Appends an immutable audit event into the registry.
        Audit records must never be purged or deleted during rollbacks.
        """
        audit_entry = AuditLog(
            audit_id=generate_audit_id(),
            user_id=user_id,
            agent_id=agent_id,
            action_id=action_id,
            event_type=event_type,
            message=message,
            metadata_json=metadata or {},
            ip_address=ip_address,
        )
        db.add(audit_entry)
        await db.flush()
        
        logger.info(
            f"[AUDIT] {event_type} | Action: {action_id} | Msg: {message}",
            extra={
                "event": event_type,
                "action_id": action_id,
                "user_id": user_id,
            }
        )
        return audit_entry
