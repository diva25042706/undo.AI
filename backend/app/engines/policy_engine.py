from typing import List, Optional, Tuple
from backend.app.models.policy import Policy


class PolicyEngine:
    """
    Evaluates governance policies to verify if an action is allowed
    or requires explicit human authorization.
    """

    @staticmethod
    def check_policy(
        action_type: str,
        risk_level: str,
        user_policies: List[Policy],
        master_require_approval_for_irreversible: bool = True,
        is_reversible: bool = True,
    ) -> Tuple[bool, bool, str]:
        """
        Returns: (is_allowed, requires_approval, reason)
        """
        action_type = action_type.upper()

        # Check explicit policy matches
        matching_policy = next(
            (p for p in user_policies if p.action_type.upper() == action_type),
            None,
        )

        if matching_policy:
            if not matching_policy.allowed:
                return False, False, f"Policy explicitly forbids '{action_type}' actions."

            if matching_policy.requires_approval:
                return True, True, f"Policy mandates human approval for '{action_type}'."

        # Master rule for irreversible actions
        if master_require_approval_for_irreversible and not is_reversible:
            return True, True, "Irreversible safety gate: Action cannot be undone and requires human approval."

        # High risk threshold
        if risk_level in ["HIGH", "CRITICAL"]:
            return True, True, f"High risk level ({risk_level}) requires explicit administrator authorization."

        return True, False, "Action permitted for automated execution."
