import uuid
from datetime import datetime
from typing import Any, Dict
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.utils.timestamps import utc_now


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    root_path: Mapped[str] = mapped_column(String(255), default="/project")
    
    # JSONB or JSON virtual file system state
    state: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {"files": {}, "directories": ["/project"]},
        nullable=False,
    )
    
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    locked_by: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="workspaces")
    actions: Mapped[list["Action"]] = relationship("Action", back_populates="workspace", cascade="all, delete-orphan")
    checkpoints: Mapped[list["Checkpoint"]] = relationship("Checkpoint", back_populates="workspace", cascade="all, delete-orphan")
    snapshots: Mapped[list["Snapshot"]] = relationship("Snapshot", back_populates="workspace", cascade="all, delete-orphan")
