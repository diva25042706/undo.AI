import copy
from typing import Any, Dict, List, Optional, Tuple
from backend.app.core.exceptions import RollbackConflict, ActionNotReversible
from backend.app.engines.action_engine import ActionEngine
from backend.app.models.action import Action


class RollbackEngine:
    """
    Executes conflict-aware rollbacks using inverse operations without erasing audit history.
    """

    @staticmethod
    def detect_conflicts(
        target_action: Action,
        subsequent_actions: List[Action],
        current_state: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Inspects whether any actions executed AFTER this action have mutated or depended
        on the same target resource.
        """
        conflicts = []
        files = current_state.get("files", {})
        target_path = target_action.target
        dest_path = (target_action.after_state or {}).get("destination") or target_path

        # If action was a MOVE/RENAME, the file is currently expected at dest_path
        if target_action.action_type.upper() in ["MOVE", "RENAME"]:
            if dest_path not in files:
                conflicts.append({
                    "type": "RESOURCE_MISSING",
                    "resource": dest_path,
                    "message": f"Expected resource '{dest_path}' does not exist in current workspace state.",
                })

        for subsequent in subsequent_actions:
            if subsequent.status == "COMPLETED":
                # Check if subsequent touched target_path or dest_path
                sub_target = subsequent.target
                sub_dest = (subsequent.after_state or {}).get("destination") or sub_target

                if sub_target in [target_path, dest_path] or sub_dest in [target_path, dest_path]:
                    conflicts.append({
                        "type": "DEPENDENT_ACTION_MUTATION",
                        "conflicting_action_id": subsequent.action_id,
                        "conflicting_action_type": subsequent.action_type,
                        "target": sub_target,
                        "timestamp": subsequent.completed_at.isoformat() if subsequent.completed_at else None,
                        "message": f"Action '{subsequent.action_id}' ({subsequent.action_type}) subsequently modified '{sub_target}'.",
                    })

        return conflicts

    @staticmethod
    def execute_inverse(
        current_state: Dict[str, Any],
        inverse_operation: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Applies stored inverse operation onto the workspace state.
        """
        if not inverse_operation:
            raise ActionNotReversible("No inverse operation found for this action.")

        op_type = inverse_operation.get("type", "").upper()
        target = inverse_operation.get("target") or inverse_operation.get("source")
        destination = inverse_operation.get("destination")
        content = inverse_operation.get("content")
        metadata = inverse_operation.get("metadata")
        data = inverse_operation.get("data")

        new_state = copy.deepcopy(current_state)
        files = new_state.setdefault("files", {})
        directories = new_state.setdefault("directories", ["/project"])

        if op_type == "DELETE":
            if target in files:
                del files[target]
            if target in directories:
                directories.remove(target)

        elif op_type == "RESTORE":
            if data:
                files[target] = data
            else:
                files[target] = {"type": "file", "content": content or ""}

        elif op_type in ["MOVE", "RENAME"]:
            source = inverse_operation.get("source", target)
            dest = inverse_operation.get("destination", destination)
            source_data = files.get(source, {"type": "file", "content": ""})
            if source in files:
                del files[source]
            files[dest] = source_data

        elif op_type == "UPDATE":
            files[target] = {
                "type": "file",
                "content": content or "",
                "size": len((content or "").encode("utf-8")),
            }

        elif op_type == "METADATA_UPDATE":
            new_state["metadata"] = metadata or {}

        return new_state
