import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_snapshot_restore_and_metrics(client: AsyncClient):
    """
    Test Snapshot Creation, Restoration with safety checkpoint, and Metrics Endpoint.
    """
    # 1. Seed demo
    seed_res = await client.post("/api/v1/demo/seed")
    workspace_id = seed_res.json()["data"]["workspace_id"]

    # 2. Create Snapshot #01
    snap_res = await client.post(
        f"/api/v1/workspaces/{workspace_id}/snapshots",
        json={"name": "Pre-Sweep Snapshot", "description": "Safe checkpoint before experiments"},
    )
    assert snap_res.status_code == 201
    snap_id = snap_res.json()["data"]["snapshot_id"]

    # 3. Add a temporary file
    create_payload = {
        "workspace_id": workspace_id,
        "actions": [
            {
                "type": "CREATE",
                "target": "/project/temp_experiment.txt",
                "content": "Temporary experimental data",
                "reason": "Test file",
                "risk": "LOW",
                "is_reversible": True,
                "requires_approval": False,
            }
        ],
    }
    await client.post("/api/v1/agents/demo-agent/execute", json=create_payload)

    # Verify file is there
    state_after_create = await client.get(f"/api/v1/workspaces/{workspace_id}/state")
    assert "/project/temp_experiment.txt" in state_after_create.json()["data"]["state"]["files"]

    # 4. Restore Snapshot
    restore_res = await client.post(f"/api/v1/snapshots/{snap_id}/restore")
    assert restore_res.status_code == 200
    assert restore_res.json()["data"]["restored"] is True

    # Verify temporary file is gone
    state_after_restore = await client.get(f"/api/v1/workspaces/{workspace_id}/state")
    assert "/project/temp_experiment.txt" not in state_after_restore.json()["data"]["state"]["files"]

    # 5. Verify Metrics Endpoint
    metrics_res = await client.get("/api/v1/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()["data"]
    assert "active_agents" in metrics
    assert "rollback_success_rate" in metrics
    assert "average_rollback_ms" in metrics
