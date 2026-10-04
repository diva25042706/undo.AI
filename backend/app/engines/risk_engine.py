from typing import Any, Dict, List, Tuple


class RiskEngine:
    """
    Quantitative Risk Engine evaluating 0-100 risk score and governance policy tier:
    - 0-30:   AUTO_EXECUTE (Low risk, fully reversible)
    - 31-70:  CHECKPOINT_AND_VERIFY (Medium risk, requires snapshot + deterministic verification)
    - 71-89:  REQUIRE_STRONG_VERIFICATION (High risk, requires multi-invariant verification)
    - 90-100: HUMAN_APPROVAL_REQUIRED (Critical risk / external side effect / irreversible deletion)
    """

    @staticmethod
    def evaluate_risk(
        action_type: str,
        target: str,
        destination: str = None,
        is_reversible: bool = True,
        affects_system: bool = False,
        affected_resources_count: int = 1,
        is_financial: bool = False,
        uncertainty: float = 0.0,
    ) -> Tuple[str, int, List[str], str]:
        """
        Evaluates risk score (0-100), risk tier, reasons, and governance policy action.
        Returns: (risk_level, score, reasons, policy_action)
        """
        action_type = (action_type or "").upper()
        target = target or ""
        score = 10
        reasons = []

        # 1. Base operation risk
        if action_type in ["CREATE", "COPY"]:
            score = 10
            reasons.append("Non-destructive additive operation.")
        elif action_type in ["MOVE", "RENAME"]:
            score = 20
            reasons.append("Relocates existing file; guaranteed reversible via inverse path.")
        elif action_type == "UPDATE":
            score = 45
            reasons.append("Modifies file content; previous state retained in diff buffer.")
        elif action_type == "DELETE":
            score = 75
            reasons.append("Destructive data removal; potential data loss.")
        elif action_type in ["SYSTEM_MODIFY", "CONFIG_WRITE", "DEPLOY"]:
            score = 85
            reasons.append("System-level configuration or deployment change.")
        elif action_type in ["TRANSACTION", "FINANCE", "PAYMENT"]:
            score = 95
            reasons.append("External financial transaction with irreversible side effects.")
        else:
            score = 30
            reasons.append(f"Standard agent action: {action_type}.")

        # 2. Reversibility modifier
        if not is_reversible:
            score += 20
            reasons.append("Action marked as non-reversible.")

        # 3. Target sensitivity modifier
        sensitive_keywords = [
            "config", ".env", "passwd", "secret", "auth", "key", "cert", 
            "database", "production", "prod", "credentials", "token"
        ]
        if any(keyword in target.lower() for keyword in sensitive_keywords):
            score += 20
            reasons.append(f"Target '{target}' contains sensitive configuration or security tokens.")

        # 4. System root / protected paths
        if affects_system or target.startswith("/etc") or target.startswith("/sys") or target.startswith("/var"):
            score = max(score, 90)
            reasons.append("Action targets protected root system path.")

        # 5. Financial simulation flag
        if is_financial:
            score = max(score, 95)
            reasons.append("Financial external side effect: requires explicit human authorization.")

        # 6. Blast radius / Affected resources multiplier
        if affected_resources_count > 3:
            multiplier_add = min(15, (affected_resources_count - 3) * 3)
            score += multiplier_add
            reasons.append(f"High blast radius: affects {affected_resources_count} resources (+{multiplier_add} risk).")

        # 7. Model uncertainty penalty
        if uncertainty > 0.4:
            penalty = int(uncertainty * 20)
            score += penalty
            reasons.append(f"High model uncertainty ({int(uncertainty * 100)}%) adds safety penalty.")

        score = max(0, min(100, score))

        # Categorize into 4 standard tiers & policy actions
        if score <= 30:
            level = "LOW"
            policy_action = "AUTO_EXECUTE"
        elif score <= 70:
            level = "MEDIUM"
            policy_action = "CHECKPOINT_AND_VERIFY"
        elif score <= 89:
            level = "HIGH"
            policy_action = "REQUIRE_STRONG_VERIFICATION"
        else:
            level = "CRITICAL"
            policy_action = "HUMAN_APPROVAL_REQUIRED"

        return level, score, reasons, policy_action
