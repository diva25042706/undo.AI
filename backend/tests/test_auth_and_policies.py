import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_and_policy_lifecycle(client: AsyncClient):
    """
    Test user registration, login, token authentication, and policy management.
    """
    # 1. Register User
    reg_payload = {
        "email": "test_engineer@undo.ai",
        "password": "SecurePassword123!",
        "name": "Test Engineer",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()["data"]
    assert user_data["email"] == "test_engineer@undo.ai"

    # 2. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_engineer@undo.ai", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    tokens = login_res.json()["data"]
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    assert access_token is not None

    # 3. Authenticated /me
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    me_res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "test_engineer@undo.ai"

    # 4. Token Refresh
    refresh_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()["data"]

    # 5. List Policies seeded for user
    policies_res = await client.get("/api/v1/policies", headers=auth_headers)
    assert policies_res.status_code == 200
    policies = policies_res.json()["data"]
    assert len(policies) > 0

    # 6. Update Policy
    policy_id = policies[0]["id"]
    update_res = await client.patch(
        f"/api/v1/policies/{policy_id}",
        json={"requires_approval": True, "description": "Strict review required"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["requires_approval"] is True
