import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_rollback_conflict_detection(client: AsyncClient):
    """
    Conflict Detection Test:
    Action A: MOVE /project/README.md -> /project/docs/README.md
    Action B: RENAME /project/docs/README.md -> /project/docs/README_FINAL.md
    Attempt UNDO Action A
    Expected: ROLLBACK_CONFLICT error (HTTP 409) preventing stale state corruption.
    """
    # 1. Seed demo
    seed_res = await client.post("/api/v1/demo/seed")
    workspace_id = seed_res.json()["data"]["workspace_id"]

    # 2. Action A: Move README.md -> /project/docs/README.md
    move_payload = {
        "workspace_id": workspace_id,
        "actions": [
            {
                "type": "MOVE",
                "target": "/project/README.md",
                "destination": "/project/docs/README.md",
                "reason": "Move README",
                "risk": "LOW",
                "is_reversible": True,
                "requires_approval": False,
            }
        ],
    }
    res_a = await client.post("/api/v1/agents/demo-agent/execute", json=move_payload)
    action_a_id = res_a.json()["data"][0]["action_id"]

    # 3. Action B: Rename /project/docs/README.md -> /project/docs/README_FINAL.md
    rename_payload = {
        "workspace_id": workspace_id,
        "actions": [
            {
                "type": "RENAME",
                "target": "/project/docs/README.md",
                "destination": "/project/docs/README_FINAL.md",
                "reason": "Rename to final",
                "risk": "LOW",
                "is_reversible": True,
                "requires_approval": False,
            }
        ],
    }
    res_b = await client.post("/api/v1/agents/demo-agent/execute", json=rename_payload)
    assert res_b.status_code == 200

    # 4. Attempt to undo Action A (stale action modified by Action B)
    undo_res = await client.post(f"/api/v1/actions/{action_a_id}/undo")
    assert undo_res.status_code == 409
    error_data = undo_res.json()["error"]
    assert error_data["code"] == "ROLLBACK_CONFLICT"

    # Verify README_FINAL.md was NOT corrupted
    state_res = await client.get(f"/api/v1/workspaces/{workspace_id}/state")
    files = state_res.json()["data"]["state"]["files"]
    assert "/project/docs/README_FINAL.md" in files
