import copy
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.checkpoint import Checkpoint
from backend.app.utils.hashing import compute_state_hash
from backend.app.utils.ids import generate_checkpoint_id


class CheckpointService:
    @staticmethod
    async def create_checkpoint(
        db: AsyncSession,
        workspace_id: str,
        user_id: str,
        state: Dict[str, Any],
        name: str = "Automated Checkpoint",
        trigger: str = "BEFORE_ACTION",
        action_id: Optional[str] = None,
    ) -> Checkpoint:
        """
        Creates an immutable checkpoint with SHA-256 state hash.
        """
        state_copy = copy.deepcopy(state)
        state_hash = compute_state_hash(state_copy)

        checkpoint = Checkpoint(
            checkpoint_id=generate_checkpoint_id(),
            workspace_id=workspace_id,
            user_id=user_id,
            action_id=action_id,
            name=name,
            trigger=trigger,
            state=state_copy,
            state_hash=state_hash,
        )
        db.add(checkpoint)
        await db.flush()
        return checkpoint
