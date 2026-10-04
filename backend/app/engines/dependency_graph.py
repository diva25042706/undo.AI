from typing import Any, Dict, List, Set, Tuple
from pydantic import BaseModel, Field


class DependencyNode(BaseModel):
    action_id: str
    action_type: str
    target: str
    destination: str = None
    depends_on: List[str] = Field(default_factory=list)
    impacted_by: List[str] = Field(default_factory=list)


class DependencyGraph:
    """
    Action Dependency Graph Engine.
    Tracks causality and resource overlaps between actions to enable
    topologically safe cascade rollbacks without leaving corrupt dangling states.
    """

    @staticmethod
    def build_graph(actions: List[Dict[str, Any]]) -> Dict[str, DependencyNode]:
        """
        Builds DAG from ordered action history by inspecting target & destination overlap.
        """
        graph: Dict[str, DependencyNode] = {}
        resource_last_touched: Dict[str, str] = {}

        for act in actions:
            act_id = act.get("action_id") or act.get("id")
            act_type = act.get("action_type") or act.get("type", "UNKNOWN")
            target = act.get("target") or ""
            dest = act.get("destination") or (act.get("after_state") or {}).get("destination") or ""

            depends_on: List[str] = []

            # If target was touched previously by an earlier action
            if target and target in resource_last_touched:
                prior = resource_last_touched[target]
                if prior != act_id and prior not in depends_on:
                    depends_on.append(prior)

            # If destination was touched previously
            if dest and dest in resource_last_touched:
                prior = resource_last_touched[dest]
                if prior != act_id and prior not in depends_on:
                    depends_on.append(prior)

            # Folder dependency check (e.g. creating /project/docs prior to moving /project/docs/README.md)
            for res, prior_act in resource_last_touched.items():
                if target.startswith(res + "/") or (dest and dest.startswith(res + "/")):
                    if prior_act != act_id and prior_act not in depends_on:
                        depends_on.append(prior_act)

            node = DependencyNode(
                action_id=act_id,
                action_type=act_type,
                target=target,
                destination=dest,
                depends_on=depends_on,
                impacted_by=[],
            )
            graph[act_id] = node

            # Update reverse mapping
            for dep_id in depends_on:
                if dep_id in graph:
                    graph[dep_id].impacted_by.append(act_id)

            # Record latest touch
            if target:
                resource_last_touched[target] = act_id
            if dest:
                resource_last_touched[dest] = act_id

        return graph

    @staticmethod
    def get_cascade_rollback_order(
        target_action_id: str,
        graph: Dict[str, DependencyNode],
    ) -> List[str]:
        """
        Returns list of action IDs that must be rolled back in reverse topological order
        when rolling back `target_action_id`.
        """
        if target_action_id not in graph:
            return [target_action_id]

        # BFS/DFS to find all descendants (actions that depend on target_action_id)
        to_rollback: Set[str] = set()
        stack = [target_action_id]

        while stack:
            curr = stack.pop()
            if curr not in to_rollback:
                to_rollback.add(curr)
                if curr in graph:
                    for child in graph[curr].impacted_by:
                        stack.append(child)

        # Order them in reverse execution order
        action_order = list(graph.keys())
        sorted_cascade = [aid for aid in reversed(action_order) if aid in to_rollback]
        return sorted_cascade
