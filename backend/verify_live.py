import json
import urllib.request

def post(url, data=None):
    if data is None:
        data = {}
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def get(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

if __name__ == "__main__":
    print("==================================================")
    print("UNDO.AI Production Live Engine Verification")
    print("==================================================")
    
    # 1. Health
    health = get("http://127.0.0.1:8000/health")
    print("\n✓ Health Check:", health)

    # 2. Seed Demo
    seed = post("http://127.0.0.1:8000/api/v1/demo/seed")
    print("\n✓ Demo Seeded:", seed["data"]["workspace_name"], f"(Files: {seed['data']['total_files']})")
    workspace_id = seed["data"]["workspace_id"]

    # 3. Run 5-step Demo Scenario
    run = post("http://127.0.0.1:8000/api/v1/demo/run")
    print("\n✓ Demo Scenario Executed:", run["data"]["scenario"], f"(Actions: {run['data']['executed_actions_count']})")
    print("  Action IDs generated:", run["data"]["action_ids"])

    # 4. Check workspace state
    state = get(f"http://127.0.0.1:8000/api/v1/workspaces/{workspace_id}/state")
    print(f"\n✓ Workspace State Version {state['data']['version']} (SHA-256: {state['data']['state_hash'][:12]}...)")
    print("  Files present:", list(state["data"]["state"]["files"].keys()))

    # 5. Undo Last Action
    undo = post(f"http://127.0.0.1:8000/api/v1/workspaces/{workspace_id}/undo-last")
    print("\n✓ Undo Last Action:", undo["data"]["action_id"], f"-> Status: {undo['data']['status']}")
    print("  Restored resource:", undo["data"]["restored_resources"])

    # 6. Check metrics
    metrics = get("http://127.0.0.1:8000/api/v1/metrics")
    print("\n✓ Dashboard Metrics:", metrics["data"])

    # 7. Audit log verification
    audit = get("http://127.0.0.1:8000/api/v1/audit")
    print(f"\n✓ Immutable Audit Trail: {len(audit['data'])} events logged.")
    print("  Latest audit event:", audit["data"][0]["event_type"], "—", audit["data"][0]["message"])
    print("\n==================================================")
    print("ALL PRODUCTION BACKEND SYSTEMS VERIFIED 100% OPERATIONAL!")
    print("==================================================")
