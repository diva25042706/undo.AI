import copy
from typing import Any, Dict, Optional, Tuple


class ActionEngine:
    """
    Executes virtual filesystem transformations safely in memory and
    generates deterministic before/after states and inverse operations.
    """

    @staticmethod
    def execute_operation(
        current_state: Dict[str, Any],
        action_type: str,
        target: str,
        destination: Optional[str] = None,
        content: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
        """
        Executes action on state copy.
        Returns: (new_state, before_state_diff, after_state_diff, inverse_operation)
        """
        new_state = copy.deepcopy(current_state)
        files = new_state.setdefault("files", {})
        directories = new_state.setdefault("directories", ["/project"])

        action_type = action_type.upper()
        before_state = {}
        after_state = {}
        inverse_operation = {}

        if action_type == "CREATE":
            # Target can be a folder or a file
            if content is None and (target.endswith("/") or target.split("/")[-1].find(".") == -1):
                # Directory create
                if target not in directories:
                    directories.append(target)
                before_state = {"exists": False, "type": "directory", "path": target}
                after_state = {"exists": True, "type": "directory", "path": target}
                inverse_operation = {
                    "type": "DELETE",
                    "target": target,
                    "resource_type": "directory",
                }
            else:
                # File create
                file_content = content if content is not None else ""
                before_state = {"exists": target in files, "content": files.get(target, {}).get("content")}
                files[target] = {
                    "type": "file",
                    "content": file_content,
                    "size": len(file_content.encode("utf-8")),
                }
                after_state = {"exists": True, "type": "file", "path": target, "content": file_content}
                inverse_operation = {
                    "type": "DELETE",
                    "target": target,
                    "resource_type": "file",
                }

        elif action_type == "MOVE":
            dest = destination or target
            source_data = files.get(target, {"type": "file", "content": "", "size": 0})
            before_state = {
                "source": target,
                "destination": dest,
                "source_data": copy.deepcopy(source_data),
            }
            # Remove from source, add to destination
            if target in files:
                del files[target]
            files[dest] = source_data
            after_state = {
                "source": None,
                "destination": dest,
                "dest_data": copy.deepcopy(source_data),
            }
            inverse_operation = {
                "type": "MOVE",
                "source": dest,
                "destination": target,
                "target": dest,
            }

        elif action_type == "RENAME":
            dest = destination or target
            source_data = files.get(target, {"type": "file", "content": "", "size": 0})
            before_state = {"old_name": target, "new_name": dest, "data": copy.deepcopy(source_data)}
            if target in files:
                del files[target]
            files[dest] = source_data
            after_state = {"old_name": None, "new_name": dest, "data": copy.deepcopy(source_data)}
            inverse_operation = {
                "type": "RENAME",
                "source": dest,
                "destination": target,
                "target": dest,
            }

        elif action_type == "UPDATE":
            old_data = files.get(target, {"type": "file", "content": "", "size": 0})
            new_content = content if content is not None else old_data.get("content", "")
            before_state = {"target": target, "previous_content": old_data.get("content", "")}
            files[target] = {
                "type": "file",
                "content": new_content,
                "size": len(new_content.encode("utf-8")),
            }
            after_state = {"target": target, "new_content": new_content}
            inverse_operation = {
                "type": "UPDATE",
                "target": target,
                "content": old_data.get("content", ""),
            }

        elif action_type == "DELETE":
            old_data = files.get(target)
            before_state = {"target": target, "data": copy.deepcopy(old_data)}
            if target in files:
                del files[target]
            if target in directories:
                directories.remove(target)
            after_state = {"target": target, "deleted": True}
            inverse_operation = {
                "type": "RESTORE",
                "target": target,
                "data": old_data or {"type": "file", "content": ""},
            }

        elif action_type == "COPY":
            dest = destination or f"{target}_copy"
            source_data = files.get(target, {"type": "file", "content": "", "size": 0})
            before_state = {"source": target, "copy_destination": dest}
            files[dest] = copy.deepcopy(source_data)
            after_state = {"source": target, "copy_destination": dest, "data": copy.deepcopy(source_data)}
            inverse_operation = {
                "type": "DELETE",
                "target": dest,
                "resource_type": "file",
            }

        elif action_type == "METADATA_UPDATE":
            prev_meta = new_state.get("metadata", {})
            before_state = {"metadata": copy.deepcopy(prev_meta)}
            merged_meta = copy.deepcopy(prev_meta)
            if metadata:
                merged_meta.update(metadata)
            new_state["metadata"] = merged_meta
            after_state = {"metadata": copy.deepcopy(merged_meta)}
            inverse_operation = {
                "type": "METADATA_UPDATE",
                "metadata": prev_meta,
            }

        return new_state, before_state, after_state, inverse_operation
