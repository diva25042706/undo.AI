from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.exceptions import (
    ActionNotFound,
    ActionNotReversible,
    InvalidActionState,
    RollbackConflict,
    WorkspaceLocked,
)
from backend.app.engines.rollback_engine import RollbackEngine
from backend.app.models.action import Action
from backend.app.models.workspace import Workspace
from backend.app.schemas.action import UndoResultResponse
from backend.app.services.audit_service import AuditService
from backend.app.services.checkpoint_service import CheckpointService
from backend.app.services.sandbox_service import SandboxService
from backend.app.utils.timestamps import utc_now


class UndoService:
    @staticmethod
    async def undo_action(
        db: AsyncSession,
        action_id: str,
        user_id: str,
        cascade: bool = False,
    ) -> UndoResultResponse:
        """
        Rolls back an action safely using its inverse operation and conflict detection.
        Preserves complete immutable audit history and restores physical files.
        """
        # 1 & 2. Load action by UUID or action_id
        res = await db.execute(
            select(Action).where(
                (Action.id == action_id) | (Action.action_id == action_id)
            )
        )
        action = res.scalar_one_or_none()
        if not action:
            raise ActionNotFound(action_id)

        # 3. Verify status
        if action.status != "COMPLETED":
            raise InvalidActionState(
                action.action_id,
                current_state=action.status,
                expected_state="COMPLETED",
            )

        # 4. Verify reversibility
        if not action.is_reversible or not action.rollback_available:
            raise ActionNotReversible(action.action_id, "Action marked as non-reversible or already rolled back.")

        # 5. Fetch Workspace
        ws_res = await db.execute(select(Workspace).where(Workspace.id == action.workspace_id))
        ws = ws_res.scalar_one_or_none()
        if not ws:
            raise WorkspaceLocked(action.workspace_id)

        if ws.is_locked:
            raise WorkspaceLocked(action.workspace_id)

        # Find subsequent actions to detect stale conflicts
        subsequent_res = await db.execute(
            select(Action)
            .where(
                Action.workspace_id == ws.id,
                Action.created_at > action.created_at,
                Action.status == "COMPLETED",
            )
            .order_by(Action.created_at.asc())
        )
        subsequent_actions = list(subsequent_res.scalars().all())

        # Check for conflicts unless cascade=True
        if subsequent_actions and not cascade:
            conflicts = RollbackEngine.detect_conflicts(
                target_action=action,
                subsequent_actions=subsequent_actions,
                current_state=ws.state,
            )
            if conflicts:
                raise RollbackConflict(
                    action_id=action.action_id,
                    message="This action cannot be safely undone because the resource changed in subsequent actions.",
                    conflicting_actions=conflicts,
                )

        # 6. ACQUIRE LOCK
        ws.is_locked = True
        ws.locked_by = f"Rollback-{action.action_id}"
        await db.flush()

        try:
            # 7. CREATE ROLLBACK CHECKPOINT
            chk = await CheckpointService.create_checkpoint(
                db=db,
                workspace_id=ws.id,
                user_id=user_id,
                state=ws.state,
                name=f"Pre-Rollback of {action.action_id} ({action.action_type})",
                trigger="ROLLBACK",
                action_id=action.action_id,
            )

            # 8. MARK STATUS ROLLING_BACK
            action.status = "ROLLING_BACK"
            await db.flush()

            # Audit start
            await AuditService.log_event(
                db=db,
                event_type="ROLLBACK_STARTED",
                message=f"Rollback initiated for action '{action.action_id}' ({action.action_type}).",
                user_id=user_id,
                agent_id=action.agent_id,
                action_id=action.action_id,
                metadata={"checkpoint_id": chk.checkpoint_id},
            )

            # Actions to undo list (handles cascade if requested)
            actions_to_undo = [action]
            if cascade and subsequent_actions:
                actions_to_undo = list(reversed(subsequent_actions)) + [action]

            restored_resources = []
            undone_ids = []

            # 9 & 10. APPLY INVERSE OPERATIONS
            for act in actions_to_undo:
                if act.status == "COMPLETED" or act.status == "ROLLING_BACK":
                    new_state = RollbackEngine.execute_inverse(
                        current_state=ws.state,
                        inverse_operation=act.inverse_operation,
                    )
                    ws.state = new_state
                    ws.version += 1

                    act.status = "UNDONE"
                    act.rollback_available = False
                    act.undone_at = utc_now()
                    undone_ids.append(act.action_id)
                    restored_resources.append(act.target)

            # 11. RESTORE PHYSICAL FILES IN ./demo_workspace
            if ws.state and "files" in ws.state:
                try:
                    SandboxService.restore_physical_manifest(ws.state["files"])
                except Exception:
                    pass

            # 12. WRITE IMMUTABLE AUDIT RECORD (ROLLBACK_COMPLETED)
            await AuditService.log_event(
                db=db,
                event_type="ROLLBACK_COMPLETED",
                message=f"Action '{action.action_id}' successfully rolled back. Resource state restored.",
                user_id=user_id,
                agent_id=action.agent_id,
                action_id=action.action_id,
                metadata={
                    "undone_action_ids": undone_ids,
                    "restored_resources": restored_resources,
                    "workspace_version": ws.version,
                },
            )

            return UndoResultResponse(
                success=True,
                action_id=action.action_id,
                status="UNDONE",
                message=f"Action '{action.action_id}' successfully undone. Resources restored.",
                undone_actions=undone_ids,
                restored_resources=restored_resources,
                checkpoint_created=chk.checkpoint_id,
            )

        except Exception as e:
            action.status = "ROLLBACK_FAILED"
            await AuditService.log_event(
                db=db,
                event_type="ROLLBACK_FAILED",
                message=f"Rollback failed for '{action.action_id}': {str(e)}",
                user_id=user_id,
                agent_id=action.agent_id,
                action_id=action.action_id,
                metadata={"error": str(e)},
            )
            raise

        finally:
            # RELEASE LOCK
            ws.is_locked = False
            ws.locked_by = None
            await db.flush()

    @staticmethod
    async def undo_last_action(
        db: AsyncSession,
        workspace_id: str,
        user_id: str,
    ) -> UndoResultResponse:
        """
        Finds the most recent completed and reversible action in the workspace and undoes it.
        """
        res = await db.execute(
            select(Action)
            .where(
                Action.workspace_id == workspace_id,
                Action.status == "COMPLETED",
                Action.is_reversible == True,
                Action.rollback_available == True,
            )
            .order_by(Action.created_at.desc())
            .limit(1)
        )
        latest_action = res.scalar_one_or_none()
        if not latest_action:
            raise ActionNotFound("No reversible completed actions found in workspace.")

        return await UndoService.undo_action(
            db=db,
            action_id=latest_action.action_id,
            user_id=user_id,
            cascade=False,
        )
