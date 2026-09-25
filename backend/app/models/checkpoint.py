import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.utils.timestamps import utc_now


class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    checkpoint_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )  # e.g. CHK-41029
    
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
    
    action_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    name: Mapped[str] = mapped_column(String(255), default="Automated Checkpoint")
    trigger: Mapped[str] = mapped_column(
        String(50),
        default="BEFORE_ACTION",
        index=True,
    )  # BEFORE_ACTION, AFTER_ACTION, MANUAL, AUTO, SNAPSHOT, ROLLBACK
    
    state: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    state_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="checkpoints")
