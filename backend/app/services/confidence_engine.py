from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ConfidenceReport(BaseModel):
    intent_confidence: float = 0.95
    plan_confidence: float = 0.90
    verification_confidence: float = 0.98
    overall_confidence: float = 0.94
    human_review_recommended: bool = False
    warning_message: Optional[str] = None
    breakdown_notes: List[str] = Field(default_factory=list)


class ConfidenceEngine:
    """
    Computes transparent confidence metrics across Intent, Planning, and Verification stages.
    Provides clear feedback when human oversight is recommended.
    """

    @staticmethod
    def evaluate_confidence(
        intent_ambiguity: float = 0.05,
        plan_complexity_score: int = 4,
        verification_match_ratio: float = 1.0,
        risk_score: int = 20,
    ) -> ConfidenceReport:
        intent_conf = round(max(0.60, min(0.99, 1.0 - intent_ambiguity)), 2)
        
        # Plan confidence reduces slightly with higher action complexity
        plan_penalty = min(0.15, plan_complexity_score * 0.02)
        plan_conf = round(max(0.65, min(0.98, 0.95 - plan_penalty)), 2)

        # Verification confidence is high if deterministic checks pass
        verif_conf = round(max(0.70, min(0.99, 0.90 + (verification_match_ratio * 0.09))), 2)

        # Overall composite confidence
        overall = round((intent_conf * 0.3) + (plan_conf * 0.3) + (verif_conf * 0.4), 2)

        notes: List[str] = [
            f"Intent parse clarity: {int(intent_conf * 100)}%",
            f"Plan step feasibility: {int(plan_conf * 100)}%",
            f"Ground truth verification certainty: {int(verif_conf * 100)}%",
        ]

        human_review = False
        warning = None

        if overall < 0.85 or risk_score >= 80:
            human_review = True
            warning = "LOW CONFIDENCE or HIGH RISK: Human review is recommended before committing changes."
            notes.append("Flagged for human auditor review.")

        return ConfidenceReport(
            intent_confidence=intent_conf,
            plan_confidence=plan_conf,
            verification_confidence=verif_conf,
            overall_confidence=overall,
            human_review_recommended=human_review,
            warning_message=warning,
            breakdown_notes=notes,
        )
