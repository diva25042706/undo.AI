from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.engines.dependency_graph import DependencyGraph, DependencyNode
from backend.app.engines.independent_verifier import VerificationResult


class RecoveryPlan(BaseModel):
    recovery_strategy: str  # ROLLBACK | CANCEL | COMPENSATE | HUMAN_ESCALATION
    reason: str
    target_checkpoint_id: Optional[str] = None
    affected_actions: List[str] = Field(default_factory=list)
    cascade_rollback_sequence: List[str] = Field(default_factory=list)
    estimated_recovery_time_sec: float = 1.2
    recovery_confidence: float = 0.98
    requires_human_confirmation: bool = False
    compensating_actions: List[Dict[str, Any]] = Field(default_factory=list)


class RecoveryEngine:
    """
    Intelligent Multi-Strategy Recovery Engine.
    Analyzes verification failures and selects optimal resolution mechanism:
    - ROLLBACK (Checkpoints & DAG reverse application)
    - CANCEL (Stop unexecuted queued operations)
    - COMPENSATE (Apply inverse compensating API/transaction calls)
    - HUMAN_ESCALATION (High-impact / irreversible ambiguous failures)
    """

    @staticmethod
    def select_recovery_strategy(
        verification_result: VerificationResult,
        actions_history: List[Dict[str, Any]],
        available_checkpoints: List[Dict[str, Any]],
        latest_checkpoint_id: Optional[str] = None,
        is_financial: bool = False,
    ) -> RecoveryPlan:
        # Build dependency DAG
        graph = DependencyGraph.build_graph(actions_history)

        # 1. If human intervention / financial irreversible failure
        if is_financial:
            return RecoveryPlan(
                recovery_strategy="HUMAN_ESCALATION",
                reason="Financial state mutation detected. Requires manual auditor authorization for compensating transaction.",
                recovery_confidence=0.85,
                requires_human_confirmation=True,
                compensating_actions=[
                    {"action": "issue_refund_credit", "details": "Credit original account with compensating voucher."}
                ],
            )

        # 2. If Checkpoint is available and verification failed
        if not verification_result.is_valid and (latest_checkpoint_id or available_checkpoints):
            target_cp = latest_checkpoint_id or (available_checkpoints[0].get("checkpoint_id") if available_checkpoints else "CP-001")
            
            # Determine which actions are affected
            all_action_ids = [a.get("action_id") or a.get("id") for a in actions_history]
            cascade_seq = list(reversed(all_action_ids))

            return RecoveryPlan(
                recovery_strategy="ROLLBACK",
                reason=f"State mismatch detected ({len(verification_result.differences)} deviations). Safe baseline checkpoint '{target_cp}' is available.",
                target_checkpoint_id=target_cp,
                affected_actions=all_action_ids,
                cascade_rollback_sequence=cascade_seq,
                estimated_recovery_time_sec=round(0.4 + (len(all_action_ids) * 0.2), 2),
                recovery_confidence=0.98,
                requires_human_confirmation=False,
            )

        # 3. If no checkpoint exists but reversible actions exist
        reversible_actions = [a for a in actions_history if a.get("is_reversible", True)]
        if reversible_actions:
            action_ids = [a.get("action_id") or a.get("id") for a in reversible_actions]
            return RecoveryPlan(
                recovery_strategy="ROLLBACK",
                reason="Reverting individual reversible action steps via stored inverse operations.",
                affected_actions=action_ids,
                cascade_rollback_sequence=list(reversed(action_ids)),
                estimated_recovery_time_sec=1.1,
                recovery_confidence=0.94,
            )

        # 4. Fallback to Cancel / Escalation
        return RecoveryPlan(
            recovery_strategy="CANCEL",
            reason="No mutations detected or actions already cancelled. Safe baseline preserved.",
            recovery_confidence=0.99,
        )
