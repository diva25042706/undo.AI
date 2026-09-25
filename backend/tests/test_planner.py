import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ai_planner_and_approval_gate(client: AsyncClient):
    """
    Test AI Planner structured proposals and approval gate on high-risk actions.
    """
    # 1. Seed demo
    seed_res = await client.post("/api/v1/demo/seed")
    workspace_id = seed_res.json()["data"]["workspace_id"]

    # 2. Get Agent
    agents_res = await client.get("/api/v1/agents")
    agent_id = agents_res.json()["data"][0]["id"]

    # 3. Request Plan for "Organize documentation"
    plan_res = await client.post(
        f"/api/v1/agents/{agent_id}/plan",
        json={"workspace_id": workspace_id, "instruction": "Organize my project documentation and clean files"},
    )
    assert plan_res.status_code == 200
    plan = plan_res.json()["data"]
    assert plan["total_actions"] >= 4
    assert plan["safe_actions_count"] >= 3
    assert plan["requires_approval_count"] >= 1

    # 4. Attempt to execute DELETE action requiring approval
    high_risk_action = next(a for a in plan["actions"] if a["requires_approval"])
    del_payload = {
        "workspace_id": workspace_id,
        "actions": [high_risk_action],
        "auto_approve_safe": False,  # Should raise 403 ApprovalRequired
    }
    exec_res = await client.post(f"/api/v1/agents/{agent_id}/execute", json=del_payload)
    assert exec_res.status_code == 403
    err = exec_res.json()["error"]
    assert err["code"] == "APPROVAL_REQUIRED"
    pending_action_id = err["details"]["action_id"]

    # 5. User approves the pending action
    approve_res = await client.post(f"/api/v1/actions/{pending_action_id}/approve")
    assert approve_res.status_code == 200
    approved_action = approve_res.json()["data"]
    assert approved_action["status"] == "COMPLETED"
