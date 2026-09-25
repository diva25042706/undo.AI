import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.utils.timestamps import utc_now


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    action_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )  # e.g. ACT-92831
    
    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    action_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # CREATE, UPDATE, DELETE, MOVE, RENAME, COPY, METADATA_UPDATE
    
    target: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    
    status: Mapped[str] = mapped_column(
        String(50),
        default="PLANNED",
        index=True,
    )  # PLANNED, PENDING_APPROVAL, APPROVED, EXECUTING, COMPLETED, ROLLING_BACK, UNDONE, FAILED, ROLLBACK_FAILED
    
    risk_level: Mapped[str] = mapped_column(
        String(50),
        default="LOW",
        index=True,
    )  # LOW, MEDIUM, HIGH, CRITICAL
    
    is_reversible: Mapped[bool] = mapped_column(Boolean, default=True)
    rollback_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    before_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    after_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    inverse_operation: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    parent_action_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    workspace_version_before: Mapped[int] = mapped_column(Integer, default=1)
    workspace_version_after: Mapped[int] = mapped_column(Integer, default=1)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    undone_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    version: Mapped[int] = mapped_column(Integer, default=1)

    # Relationships
    agent: Mapped[Optional["Agent"]] = relationship("Agent", back_populates="actions")
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="actions")
