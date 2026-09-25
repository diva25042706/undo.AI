import uuid
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.exceptions import AgentNotFound, WorkspaceLocked
from backend.app.engines.policy_engine import PolicyEngine
from backend.app.engines.risk_engine import RiskEngine
from backend.app.models.agent import Agent
from backend.app.models.policy import Policy
from backend.app.models.workspace import Workspace
from backend.app.schemas.agent import AgentPlanResponse, PlannedActionSchema
from backend.app.services.ai_service import get_ai_service
from backend.app.services.audit_service import AuditService


class PlannerService:
    @staticmethod
    async def create_plan(
        db: AsyncSession,
        agent_id: str,
        workspace_id: str,
        user_id: str,
        instruction: str,
    ) -> AgentPlanResponse:
        # Verify Agent
        agent_res = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = agent_res.scalar_one_or_none()
        if not agent:
            raise AgentNotFound(agent_id)

        # Verify Workspace
        ws_res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = ws_res.scalar_one_or_none()
        if not ws:
            raise WorkspaceLocked(workspace_id)

        # Fetch active policies
        pol_res = await db.execute(select(Policy).where(Policy.user_id == user_id))
        user_policies = list(pol_res.scalars().all())

        # 1. AI PROPOSAL
        ai_service = get_ai_service()
        raw_actions = await ai_service.generate_plan(instruction, ws.state)

        planned_actions: List[PlannedActionSchema] = []
        safe_count = 0
        approval_count = 0

        # 2. EVALUATE EACH PROPOSED ACTION THROUGH RISK & POLICY ENGINES
        for raw in raw_actions:
            action_type = raw.get("type", "CREATE").upper()
            target = raw.get("target", "/project/untitled")
            destination = raw.get("destination")
            content = raw.get("content")
            reason = raw.get("reason", "Automated reorganization step")
            is_reversible = raw.get("is_reversible", True)

            # Evaluate Risk
            risk_level, risk_score, risk_reasons = RiskEngine.evaluate_risk(
                action_type=action_type,
                target=target,
                destination=destination,
                is_reversible=is_reversible,
            )

            # Check Policy & Approval
            is_allowed, requires_approval, policy_reason = PolicyEngine.check_policy(
                action_type=action_type,
                risk_level=risk_level,
                user_policies=user_policies,
                is_reversible=is_reversible,
            )

            if requires_approval or not is_allowed:
                approval_count += 1
            else:
                safe_count += 1

            planned_actions.append(
                PlannedActionSchema(
                    type=action_type,
                    target=target,
                    destination=destination,
                    content=content,
                    reason=reason,
                    risk=risk_level,
                    risk_score=risk_score,
                    risk_reasons=risk_reasons,
                    requires_approval=requires_approval or not is_allowed,
                    is_reversible=is_reversible,
                )
            )

        execution_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"

        # Audit Event
        await AuditService.log_event(
            db=db,
            event_type="PLAN_CREATED",
            message=f"Agent '{agent.name}' generated plan with {len(planned_actions)} actions for instruction: '{instruction}'.",
            user_id=user_id,
            agent_id=agent.id,
            metadata={
                "execution_id": execution_id,
                "total_actions": len(planned_actions),
                "safe_count": safe_count,
                "approval_count": approval_count,
            },
        )

        return AgentPlanResponse(
            execution_id=execution_id,
            agent_id=agent.id,
            workspace_id=ws.id,
            instruction=instruction,
            summary=f"Found {len(planned_actions)} actions ({safe_count} safe, {approval_count} require approval).",
            total_actions=len(planned_actions),
            safe_actions_count=safe_count,
            requires_approval_count=approval_count,
            actions=planned_actions,
        )
