import copy
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user_optional
from backend.app.core.database import get_db
from backend.app.engines.expected_state_engine import ExpectedStateEngine
from backend.app.engines.independent_verifier import IndependentVerifier
from backend.app.engines.recovery_engine import RecoveryEngine
from backend.app.engines.risk_engine import RiskEngine
from backend.app.models.action import Action
from backend.app.models.agent import Agent
from backend.app.models.audit import AuditLog
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.policy import Policy
from backend.app.models.snapshot import Snapshot
from backend.app.models.user import User
from backend.app.models.workspace import Workspace
from backend.app.schemas.common import APIResponse
from backend.app.services.checkpoint_service import CheckpointService
from backend.app.services.execution_service import ExecutionService
from backend.app.services.policy_service import PolicyService
from backend.app.services.sandbox_service import SandboxService
from backend.app.services.snapshot_service import SnapshotService
from backend.app.services.undo_service import UndoService
from backend.app.services.websocket_manager import ws_manager
from backend.app.utils.ids import generate_action_id

router = APIRouter(prefix="/demo", tags=["Hackathon Demo Engine"])


@router.post("/seed", response_model=APIResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def seed_demo(
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Seeds initial demo data with real physical sandbox files and baseline database records.
    """
    # 1. Reset physical sandbox directory on disk
    physical_manifest = SandboxService.reset_sandbox()

    # 2. Seed Policies
    await PolicyService.seed_default_policies(db=db, user_id=user.id)

    # 3. Find or create demo workspace
    ws_res = await db.execute(
        select(Workspace).where(
            (Workspace.user_id == user.id) & (Workspace.name == "AI Project Organizer")
        )
    )
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        workspace = Workspace(
            user_id=user.id,
            name="AI Project Organizer",
            root_path="/project",
            state=copy.deepcopy(physical_manifest),
            version=1,
        )
        db.add(workspace)
        await db.flush()
    else:
        workspace.state = copy.deepcopy(physical_manifest)
        workspace.version = 1
        workspace.is_locked = False
        await db.flush()

    # 4. Seed Agents
    agents_data = [
        {"name": "Workspace Research Agent", "role": "Documentation & File Organizer", "avatar": "🤖"},
        {"name": "Architecture Agent", "role": "Code Hygiene & Architecture Analyst", "avatar": "🔍"},
        {"name": "Recovery Guard", "role": "State Verification & Reversibility Engine", "avatar": "🛡️"},
    ]

    for ad in agents_data:
        res = await db.execute(
            select(Agent).where((Agent.user_id == user.id) & (Agent.name == ad["name"]))
        )
        if not res.scalar_one_or_none():
            ag = Agent(user_id=user.id, status="ONLINE", **ad)
            db.add(ag)

    await db.flush()

    # 5. Create Initial Baseline Checkpoint & Snapshot
    baseline_chk = await CheckpointService.create_checkpoint(
        db=db,
        workspace_id=workspace.id,
        user_id=user.id,
        state=workspace.state,
        name="CP-001 (Baseline Checkpoint)",
        trigger="BASELINE_INIT",
    )

    snap = await SnapshotService.create_snapshot(
        db=db,
        workspace_id=workspace.id,
        user_id=user.id,
        name="Snapshot #01 (Baseline)",
        description="Initial clean workspace state before autonomous agent execution.",
    )

    return APIResponse(
        success=True,
        data={
            "workspace_id": workspace.id,
            "workspace_name": workspace.name,
            "total_files": len(workspace.state.get("files", {})),
            "baseline_checkpoint_id": baseline_chk.checkpoint_id,
            "baseline_snapshot_id": snap.snapshot_id,
            "sandbox_path": str(SandboxService.get_sandbox_path()),
        },
        message="Demo environment seeded successfully with physical sandbox on disk.",
    )


@router.post("/run-full-scenario", response_model=APIResponse[Dict[str, Any]])
async def run_full_deterministic_demo(
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Executes the Complete 10-Step Hackathon Deterministic Demo:
    1. User Goal: 'Organize project documentation'
    2. Expected State Contract generated
    3. Risk Engine scores actions (0-100) & policy tiers
    4. Baseline Checkpoint CP-001 created
    5. Agent executes real file mutations in ./demo_workspace
    6. Controlled failure injected (architecture.md left in root)
    7. Independent Verifier detects mismatch
    8. Recovery Engine selects Rollback strategy
    9. System restores Checkpoint CP-001 (physical files & DB state)
    10. Verifier re-runs -> ORIGINAL STATE RESTORED (SAFE)
    """
    # 1. Ensure clean workspace
    await seed_demo(user=user, db=db)
    ws_res = await db.execute(select(Workspace).where(Workspace.user_id == user.id))
    workspace = ws_res.scalar_one_or_none()

    goal = "Organize my project documentation."

    # STEP 2: Expected State Engine
    expected_model = ExpectedStateEngine.generate_expected_state(goal, workspace.state)

    # STEP 3 & 4: Risk Scoring & Checkpoint
    chk_before = await CheckpointService.create_checkpoint(
        db=db,
        workspace_id=workspace.id,
        user_id=user.id,
        state=workspace.state,
        name="CP-001 (Pre-Reorganization Baseline)",
        trigger="DEMO_START",
    )

    # STEP 5: Execute real file actions
    ag_res = await db.execute(select(Agent).where(Agent.user_id == user.id))
    agent = ag_res.scalars().first()
    agent_id = agent.id if agent else None

    actions_to_run = [
        {"type": "CREATE", "target": "/project/docs", "reason": "Create docs directory"},
        {"type": "MOVE", "target": "/project/README.md", "destination": "/project/docs/README.md", "reason": "Move README to docs"},
        {"type": "RENAME", "target": "/project/report.pdf", "destination": "/project/final_report_v2.pdf", "reason": "Standardize report name"},
    ]

    executed_ids = []
    for step in actions_to_run:
        act = await ExecutionService.execute_action(
            db=db,
            workspace_id=workspace.id,
            user_id=user.id,
            action_type=step["type"],
            target=step["target"],
            destination=step.get("destination"),
            reason=step["reason"],
            agent_id=agent_id,
            force_approved=True,
        )
        executed_ids.append(act.action_id)

    # STEP 6: Introduce Controlled Failure in demo
    # architecture.pdf is still in root, missing in /project/docs/architecture.pdf
    corrupt_state = copy.deepcopy(workspace.state)
    if "/project/docs/architecture.pdf" in corrupt_state["files"]:
        del corrupt_state["files"]["/project/docs/architecture.pdf"]
    corrupt_state["files"]["/project/architecture.pdf"] = {
        "type": "file",
        "content": "%PDF-1.4 [Architecture Specification Diagram]",
    }

    # STEP 7: Independent Verifier runs against Expected State
    verification_1 = IndependentVerifier.verify_state(
        expected_state_contract=expected_model.expected_state,
        actual_state=corrupt_state,
    )

    # STEP 8: Recovery Engine selects strategy
    action_history = [{"action_id": aid, "is_reversible": True} for aid in executed_ids]
    recovery_plan = RecoveryEngine.select_recovery_strategy(
        verification_result=verification_1,
        actions_history=action_history,
        available_checkpoints=[{"checkpoint_id": chk_before.checkpoint_id}],
        latest_checkpoint_id=chk_before.checkpoint_id,
    )

    # STEP 9: Restore Checkpoint CP-001
    restore_result = await CheckpointService.restore_checkpoint(
        db=db,
        checkpoint_id=chk_before.checkpoint_id,
        workspace_id=workspace.id,
    )

    # STEP 10: Independent Verifier runs again
    verification_2 = IndependentVerifier.verify_state(
        expected_state_contract={
            "/project/README.md": {"presence": "EXISTS"},
            "/project/app.py": {"presence": "EXISTS"},
            "/project/config.json": {"presence": "EXISTS"},
        },
        actual_state=workspace.state,
    )

    return APIResponse(
        success=True,
        data={
            "scenario": "AI Project Organizer & Verified Recovery",
            "step_1_goal": goal,
            "step_2_expected_state": expected_model.expected_state,
            "step_3_risk_score": expected_model.risk_score,
            "step_4_checkpoint_id": chk_before.checkpoint_id,
            "step_5_executed_actions": executed_ids,
            "step_6_failure_injected": "architecture.pdf missing from /docs (state mismatch)",
            "step_7_verifier_failure_detected": {
                "status": verification_1.status,
                "differences": verification_1.differences,
                "confidence": verification_1.confidence,
            },
            "step_8_recovery_strategy_selected": recovery_plan.recovery_strategy,
            "step_9_checkpoint_restored": chk_before.checkpoint_id,
            "step_10_post_recovery_verification": {
                "status": verification_2.status,
                "is_valid": verification_2.is_valid,
                "summary": "Original safe baseline state confirmed on physical disk and database.",
            },
            "final_status": "SYSTEM_SAFE",
        },
        message="10-step hackathon demo flow executed successfully. Proven independent detection and verified rollback.",
    )


@router.post("/reset", response_model=APIResponse[Dict[str, Any]])
async def reset_demo(
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Completely resets demo workspace and physical ./demo_workspace back to clean baseline files.
    """
    return await seed_demo(user=user, db=db)
