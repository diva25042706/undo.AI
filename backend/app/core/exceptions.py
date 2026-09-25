from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class UndoAIException(HTTPException):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(
            status_code=status_code,
            detail={
                "success": False,
                "error": {
                    "code": self.code,
                    "message": self.message,
                    "details": self.details,
                },
            },
        )


class ActionNotFound(UndoAIException):
    def __init__(self, action_id: str):
        super().__init__(
            code="ACTION_NOT_FOUND",
            message=f"Action '{action_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"action_id": action_id},
        )


class ActionNotReversible(UndoAIException):
    def __init__(self, action_id: str, reason: str = "Action marked as irreversible."):
        super().__init__(
            code="ACTION_NOT_REVERSIBLE",
            message=f"Action '{action_id}' cannot be safely undone: {reason}",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"action_id": action_id, "reason": reason},
        )


class InvalidActionState(UndoAIException):
    def __init__(self, action_id: str, current_state: str, expected_state: str):
        super().__init__(
            code="INVALID_ACTION_STATE",
            message=f"Action '{action_id}' is in state '{current_state}', expected '{expected_state}'.",
            status_code=status.HTTP_409_CONFLICT,
            details={
                "action_id": action_id,
                "current_state": current_state,
                "expected_state": expected_state,
            },
        )


class RollbackConflict(UndoAIException):
    def __init__(self, action_id: str, message: str, conflicting_actions: Optional[list] = None):
        super().__init__(
            code="ROLLBACK_CONFLICT",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details={
                "action_id": action_id,
                "conflicting_actions": conflicting_actions or [],
                "recommendation": "Create restore point or perform a cascade rollback instead.",
            },
        )


class PolicyViolation(UndoAIException):
    def __init__(self, action_type: str, reason: str):
        super().__init__(
            code="POLICY_VIOLATION",
            message=f"Operation '{action_type}' is prohibited by active governance policy: {reason}",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"action_type": action_type, "reason": reason},
        )


class ApprovalRequired(UndoAIException):
    def __init__(self, action_id: str, risk_level: str, reason: str):
        super().__init__(
            code="APPROVAL_REQUIRED",
            message=f"Action '{action_id}' requires explicit human administrator approval before execution.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={
                "action_id": action_id,
                "risk_level": risk_level,
                "reason": reason,
            },
        )


class WorkspaceLocked(UndoAIException):
    def __init__(self, workspace_id: str):
        super().__init__(
            code="WORKSPACE_LOCKED",
            message=f"Workspace '{workspace_id}' is currently executing another atomic operation.",
            status_code=status.HTTP_423_LOCKED,
            details={"workspace_id": workspace_id},
        )


class SnapshotNotFound(UndoAIException):
    def __init__(self, snapshot_id: str):
        super().__init__(
            code="SNAPSHOT_NOT_FOUND",
            message=f"Snapshot '{snapshot_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"snapshot_id": snapshot_id},
        )


class AgentNotFound(UndoAIException):
    def __init__(self, agent_id: str):
        super().__init__(
            code="AGENT_NOT_FOUND",
            message=f"Agent '{agent_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"agent_id": agent_id},
        )


class UnauthorizedAction(UndoAIException):
    def __init__(self, message: str = "Unauthorized to perform this operation."):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
