import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.utils.timestamps import utc_now


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    audit_id: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )  # e.g. AUD-9021
    
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    agent_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True,
    )
    
    event_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )  # AGENT_CREATED, PLAN_CREATED, APPROVAL_REQUESTED, ACTION_STARTED, ACTION_COMPLETED, UNDO_REQUESTED, ROLLBACK_STARTED, ROLLBACK_COMPLETED, ROLLBACK_FAILED, SNAPSHOT_CREATED, SNAPSHOT_RESTORED, POLICY_BLOCKED
    
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
