from typing import Any, Dict, List, Tuple


class RiskEngine:
    """
    Calculates operational risk scores (0-100) and risk level categories
    (LOW, MEDIUM, HIGH, CRITICAL) for planned AI agent actions.
    """

    @staticmethod
    def evaluate_risk(
        action_type: str,
        target: str,
        destination: str = None,
        is_reversible: bool = True,
        affects_system: bool = False,
    ) -> Tuple[str, int, List[str]]:
        """
        Evaluates risk.
        Returns: (risk_level, score, reasons)
        """
        action_type = action_type.upper()
        score = 10
        reasons = []

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
            score = 80
            reasons.append("Destructive data removal; requires explicit policy check.")
        elif action_type in ["SYSTEM_MODIFY", "TRANSACTION", "FINANCE"]:
            score = 95
            reasons.append("External or system-level configuration impact.")

        # Reversibility penalty
        if not is_reversible:
            score += 25
            reasons.append("Action is marked as irreversible.")

        # Target sensitivity check
        sensitive_keywords = ["config", ".env", "passwd", "secret", "auth", "key", "cert", "database"]
        if any(keyword in target.lower() for keyword in sensitive_keywords):
            score += 20
            reasons.append(f"Target '{target}' contains sensitive configuration tokens.")

        # Critical system paths
        if affects_system or target.startswith("/etc") or target.startswith("/sys") or target.startswith("/var"):
            score = max(score, 90)
            reasons.append("Action targets protected root system path.")

        score = min(score, 100)

        # Categorize
        if score < 30:
            level = "LOW"
        elif score < 60:
            level = "MEDIUM"
        elif score < 85:
            level = "HIGH"
        else:
            level = "CRITICAL"

        return level, score, reasons
