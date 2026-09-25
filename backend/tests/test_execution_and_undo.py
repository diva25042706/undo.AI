import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complete_undo_lifecycle(client: AsyncClient):
    """
    Core Verification Test:
    1. Seed demo workspace with /project/README.md
    2. Execute MOVE /project/README.md -> /project/docs/README.md
    3. Verify new state (/project/docs/README.md exists, /project/README.md does not)
    4. Execute UNDO
    5. Verify state restored (/project/README.md exists, /project/docs/README.md does not)
    6. Verify action status is UNDONE
    7. Verify audit log contains both ACTION_COMPLETED and ROLLBACK_COMPLETED
    """
    # 1. Seed demo workspace
    seed_res = await client.post("/api/v1/demo/seed")
    assert seed_res.status_code == 201
    seed_data = seed_res.json()["data"]
    workspace_id = seed_data["workspace_id"]

    # Check initial state
    state_res = await client.get(f"/api/v1/workspaces/{workspace_id}/state")
    assert state_res.status_code == 200
    files = state_res.json()["data"]["state"]["files"]
    assert "/project/README.md" in files

    # 2. Execute MOVE operation
    move_payload = {
        "workspace_id": workspace_id,
        "actions": [
            {
                "type": "MOVE",
                "target": "/project/README.md",
                "destination": "/project/docs/README.md",
                "reason": "Organize documentation",
                "risk": "LOW",
                "is_reversible": True,
                "requires_approval": False,
            }
        ],
        "auto_approve_safe": True,
    }
    exec_res = await client.post("/api/v1/agents/demo-agent/execute", json=move_payload)
    assert exec_res.status_code == 200
    executed_actions = exec_res.json()["data"]
    assert len(executed_actions) == 1
    action_id = executed_actions[0]["action_id"]

    # 3. Verify state after MOVE
    state_after_move = await client.get(f"/api/v1/workspaces/{workspace_id}/state")
    files_after = state_after_move.json()["data"]["state"]["files"]
    assert "/project/docs/README.md" in files_after
    assert "/project/README.md" not in files_after

    # 4. Execute UNDO on the move action
    undo_res = await client.post(f"/api/v1/actions/{action_id}/undo")
    assert undo_res.status_code == 200
    undo_data = undo_res.json()["data"]
    assert undo_data["success"] is True
    assert undo_data["status"] == "UNDONE"

    # 5. Verify restored state
    state_after_undo = await client.get(f"/api/v1/workspaces/{workspace_id}/state")
    files_restored = state_after_undo.json()["data"]["state"]["files"]
    assert "/project/README.md" in files_restored
    assert "/project/docs/README.md" not in files_restored

    # 6. Verify action record status is UNDONE
    action_detail = await client.get(f"/api/v1/actions/{action_id}")
    assert action_detail.status_code == 200
    assert action_detail.json()["data"]["status"] == "UNDONE"
    assert action_detail.json()["data"]["rollback_available"] is False

    # 7. Verify immutable audit trail
    audit_res = await client.get(f"/api/v1/audit/{action_id}")
    assert audit_res.status_code == 200
    logs = audit_res.json()["data"]
    event_types = [l["event_type"] for l in logs]
    assert "ACTION_COMPLETED" in event_types
    assert "ROLLBACK_STARTED" in event_types
    assert "ROLLBACK_COMPLETED" in event_types
