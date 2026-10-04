import copy
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.workspace import Workspace
from backend.app.services.sandbox_service import SandboxService
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
        Creates an immutable checkpoint with SHA-256 state hash and captures physical manifest.
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

    @staticmethod
    async def restore_checkpoint(
        db: AsyncSession,
        checkpoint_id: str,
        workspace_id: str,
    ) -> Dict[str, Any]:
        """
        Restores workspace state in DB and restores physical files in ./demo_workspace.
        """
        chk_res = await db.execute(
            select(Checkpoint).where(
                (Checkpoint.checkpoint_id == checkpoint_id) | (Checkpoint.id == checkpoint_id)
            )
        )
        checkpoint = chk_res.scalar_one_or_none()
        if not checkpoint:
            raise ValueError(f"Checkpoint '{checkpoint_id}' not found.")

        ws_res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        workspace = ws_res.scalar_one_or_none()
        if not workspace:
            raise ValueError(f"Workspace '{workspace_id}' not found.")

        # Restore virtual state
        workspace.state = copy.deepcopy(checkpoint.state)
        workspace.version += 1
        await db.flush()

        # Restore physical files in ./demo_workspace
        if checkpoint.state and "files" in checkpoint.state:
            SandboxService.restore_physical_manifest(checkpoint.state["files"])

        return {
            "checkpoint_id": checkpoint.checkpoint_id,
            "workspace_version": workspace.version,
            "restored_files_count": len(workspace.state.get("files", {})),
            "state_hash": checkpoint.state_hash,
        }

    @staticmethod
    async def get_checkpoints_for_workspace(
        db: AsyncSession,
        workspace_id: str,
    ) -> List[Checkpoint]:
        res = await db.execute(
            select(Checkpoint)
            .where(Checkpoint.workspace_id == workspace_id)
            .order_by(Checkpoint.created_at.desc())
        )
        return list(res.scalars().all())
