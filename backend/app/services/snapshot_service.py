import copy
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.exceptions import SnapshotNotFound
from backend.app.models.snapshot import Snapshot
from backend.app.models.workspace import Workspace
from backend.app.services.audit_service import AuditService
from backend.app.services.checkpoint_service import CheckpointService
from backend.app.utils.hashing import compute_state_hash
from backend.app.utils.ids import generate_snapshot_id


class SnapshotService:
    @staticmethod
    async def create_snapshot(
        db: AsyncSession,
        workspace_id: str,
        user_id: str,
        name: str,
        description: Optional[str] = None,
        action_count: int = 0,
    ) -> Snapshot:
        # Fetch workspace
        res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = res.scalar_one_or_none()
        if not ws:
            raise SnapshotNotFound(f"Workspace '{workspace_id}' not found.")

        state_copy = copy.deepcopy(ws.state)
        state_hash = compute_state_hash(state_copy)

        # Unset previous is_current
        await db.execute(
            update(Snapshot)
            .where(Snapshot.workspace_id == workspace_id)
            .values(is_current=False)
        )

        snapshot = Snapshot(
            snapshot_id=generate_snapshot_id(),
            workspace_id=workspace_id,
            user_id=user_id,
            name=name,
            description=description,
            state=state_copy,
            state_hash=state_hash,
            action_count=action_count,
            is_current=True,
        )
        db.add(snapshot)
        await db.flush()

        await AuditService.log_event(
            db=db,
            event_type="SNAPSHOT_CREATED",
            message=f"Created snapshot '{name}' ({snapshot.snapshot_id}) with {action_count} actions.",
            user_id=user_id,
            metadata={"snapshot_id": snapshot.snapshot_id, "state_hash": state_hash},
        )
        return snapshot

    @staticmethod
    async def restore_snapshot(
        db: AsyncSession,
        snapshot_id: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Restores workspace state to a snapshot.
        Creates a safety checkpoint before restoration to guarantee zero data loss.
        """
        # Find snapshot by UUID or snapshot_id
        res = await db.execute(
            select(Snapshot).where(
                (Snapshot.id == snapshot_id) | (Snapshot.snapshot_id == snapshot_id)
            )
        )
        snap = res.scalar_one_or_none()
        if not snap:
            raise SnapshotNotFound(snapshot_id)

        # Fetch workspace
        ws_res = await db.execute(select(Workspace).where(Workspace.id == snap.workspace_id))
        ws = ws_res.scalar_one_or_none()
        if not ws:
            raise SnapshotNotFound(f"Workspace '{snap.workspace_id}' not found.")

        # 1. CREATE PRE-RESTORE SAFETY CHECKPOINT
        safety_chk = await CheckpointService.create_checkpoint(
            db=db,
            workspace_id=ws.id,
            user_id=user_id,
            state=ws.state,
            name=f"Pre-Restore Safety Checkpoint before {snap.name}",
            trigger="BEFORE_RESTORE",
        )

        # 2. RESTORE WORKSPACE STATE
        ws.state = copy.deepcopy(snap.state)
        ws.version += 1
        await db.flush()

        # 3. SET AS CURRENT SNAPSHOT
        await db.execute(
            update(Snapshot)
            .where(Snapshot.workspace_id == ws.id)
            .values(is_current=False)
        )
        snap.is_current = True

        # 4. LOG AUDIT EVENT
        await AuditService.log_event(
            db=db,
            event_type="SNAPSHOT_RESTORED",
            message=f"Restored workspace state to snapshot '{snap.name}' ({snap.snapshot_id}).",
            user_id=user_id,
            metadata={
                "snapshot_id": snap.snapshot_id,
                "safety_checkpoint_id": safety_chk.checkpoint_id,
                "restored_version": ws.version,
            },
        )

        return {
            "success": True,
            "snapshot_id": snap.snapshot_id,
            "restored": True,
            "safety_checkpoint_id": safety_chk.checkpoint_id,
            "message": f"Successfully restored to {snap.name}. Safety checkpoint created.",
        }
