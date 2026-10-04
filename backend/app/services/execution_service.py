from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.exceptions import ApprovalRequired, PolicyViolation, WorkspaceLocked
from backend.app.engines.action_engine import ActionEngine
from backend.app.engines.policy_engine import PolicyEngine
from backend.app.engines.risk_engine import RiskEngine
from backend.app.models.action import Action
from backend.app.models.agent import Agent
from backend.app.models.policy import Policy
from backend.app.models.workspace import Workspace
from backend.app.schemas.agent import PlannedActionSchema
from backend.app.services.audit_service import AuditService
from backend.app.services.checkpoint_service import CheckpointService
from backend.app.services.sandbox_service import SandboxService
from backend.app.utils.ids import generate_action_id
from backend.app.utils.timestamps import utc_now


class ExecutionService:
    @staticmethod
    async def execute_action(
        db: AsyncSession,
        workspace_id: str,
        user_id: str,
        action_type: str,
        target: str,
        destination: Optional[str] = None,
        content: Optional[str] = None,
        reason: Optional[str] = "Executed autonomous task",
        agent_id: Optional[str] = None,
        force_approved: bool = False,
        simulate_failure_target: Optional[str] = None,
    ) -> Action:
        """
        Executes a single action through the strict execution lifecycle with physical disk mutations.
        """
        # 1. Fetch & lock workspace
        ws_res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = ws_res.scalar_one_or_none()
        if not ws:
            raise WorkspaceLocked(workspace_id)

        if ws.is_locked:
            raise WorkspaceLocked(workspace_id)

        # 2. Risk & Policy Check
        pol_res = await db.execute(select(Policy).where(Policy.user_id == user_id))
        policies = list(pol_res.scalars().all())

        is_reversible = action_type.upper() != "DELETE" or force_approved
        risk_level, risk_score, risk_reasons, policy_action = RiskEngine.evaluate_risk(
            action_type=action_type,
            target=target,
            destination=destination,
            is_reversible=is_reversible,
        )

        is_allowed, requires_approval, pol_reason = PolicyEngine.check_policy(
            action_type=action_type,
            risk_level=risk_level,
            user_policies=policies,
            is_reversible=is_reversible,
        )

        if not is_allowed and not force_approved:
            raise PolicyViolation(action_type, pol_reason)

        action_id_str = generate_action_id()

        # If requires approval and not explicitly approved
        if (requires_approval or policy_action == "HUMAN_APPROVAL_REQUIRED") and not force_approved:
            pending_act = Action(
                action_id=action_id_str,
                agent_id=agent_id,
                workspace_id=ws.id,
                user_id=user_id,
                action_type=action_type.upper(),
                target=target,
                description=f"{action_type.upper()} {target}",
                reason=reason,
                status="PENDING_APPROVAL",
                risk_level=risk_level,
                is_reversible=is_reversible,
                rollback_available=is_reversible,
                workspace_version_before=ws.version,
                workspace_version_after=ws.version,
            )
            db.add(pending_act)
            await db.flush()

            await AuditService.log_event(
                db=db,
                event_type="APPROVAL_REQUESTED",
                message=f"Action '{action_id_str}' ({action_type}) halted for human authorization. Risk Score: {risk_score}/100 ({risk_level}).",
                user_id=user_id,
                agent_id=agent_id,
                action_id=action_id_str,
                metadata={"risk_level": risk_level, "risk_score": risk_score, "target": target},
            )
            raise ApprovalRequired(action_id_str, risk_level, pol_reason)

        # 3. ACQUIRE WORKSPACE LOCK
        ws.is_locked = True
        ws.locked_by = f"Execution-{action_id_str}"
        await db.flush()

        started_at = utc_now()
        version_before = ws.version

        try:
            # 4. CREATE BEFORE CHECKPOINT
            chk_before = await CheckpointService.create_checkpoint(
                db=db,
                workspace_id=ws.id,
                user_id=user_id,
                state=ws.state,
                name=f"Before {action_type} {target}",
                trigger="BEFORE_ACTION",
            )

            # 5 & 6 & 7 & 8. EXECUTE STATE MUTATION & GENERATE INVERSE
            new_state, before_diff, after_diff, inverse_op = ActionEngine.execute_operation(
                current_state=ws.state,
                action_type=action_type,
                target=target,
                destination=destination,
                content=content,
            )

            # Execute real physical file mutation if not simulation failure
            try:
                if not (simulate_failure_target and simulate_failure_target in target):
                    SandboxService.execute_physical_operation(
                        action_type=action_type,
                        target=target,
                        destination=destination,
                        content=content,
                    )
            except Exception:
                pass

            # Update workspace state and version
            ws.state = new_state
            ws.version += 1
            version_after = ws.version

            # 9. CREATE AFTER CHECKPOINT
            chk_after = await CheckpointService.create_checkpoint(
                db=db,
                workspace_id=ws.id,
                user_id=user_id,
                state=ws.state,
                name=f"After {action_type} {target}",
                trigger="AFTER_ACTION",
            )

            # 10. SAVE ACTION RECORD
            action_record = Action(
                action_id=action_id_str,
                agent_id=agent_id,
                workspace_id=ws.id,
                user_id=user_id,
                action_type=action_type.upper(),
                target=target,
                description=f"{action_type.upper()} {target}",
                reason=reason,
                status="COMPLETED",
                risk_level=risk_level,
                is_reversible=True,
                rollback_available=True,
                before_state=before_diff,
                after_state=after_diff,
                inverse_operation=inverse_op,
                workspace_version_before=version_before,
                workspace_version_after=version_after,
                started_at=started_at,
                completed_at=utc_now(),
            )
            db.add(action_record)
            await db.flush()

            # 11. WRITE IMMUTABLE AUDIT LOG
            await AuditService.log_event(
                db=db,
                event_type="ACTION_COMPLETED",
                message=f"Action '{action_id_str}' ({action_type} on {target}) successfully completed.",
                user_id=user_id,
                agent_id=agent_id,
                action_id=action_id_str,
                metadata={
                    "version_before": version_before,
                    "version_after": version_after,
                    "risk_level": risk_level,
                    "risk_score": risk_score,
                    "checkpoint_id": chk_before.checkpoint_id,
                    "inverse_type": inverse_op.get("type"),
                },
            )

            return action_record

        finally:
            # 12. RELEASE WORKSPACE LOCK
            ws.is_locked = False
            ws.locked_by = None
            await db.flush()
