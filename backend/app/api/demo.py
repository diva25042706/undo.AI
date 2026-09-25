import copy
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user_optional
from backend.app.core.database import get_db
from backend.app.models.action import Action
from backend.app.models.agent import Agent
from backend.app.models.audit import AuditLog
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.policy import Policy
from backend.app.models.snapshot import Snapshot
from backend.app.models.user import User
from backend.app.models.workspace import Workspace
from backend.app.schemas.common import APIResponse
from backend.app.services.execution_service import ExecutionService
from backend.app.services.policy_service import PolicyService
from backend.app.services.snapshot_service import SnapshotService
from backend.app.services.websocket_manager import ws_manager
from backend.app.utils.ids import generate_action_id

router = APIRouter(prefix="/demo", tags=["Hackathon Demo"])


INITIAL_DEMO_FILES = {
    "/project/README.md": {
        "type": "file",
        "content": "# AI Project Documentation\n\nWelcome to the autonomous workspace.",
        "size": 72,
    },
    "/project/app.py": {
        "type": "file",
        "content": "import fastapi\nprint('Starting AI Agent Controller')\n",
        "size": 52,
    },
    "/project/config.json": {
        "type": "file",
        "content": '{"version": "2.3", "environment": "staging", "strict_safety": true}',
        "size": 68,
    },
    "/project/architecture.pdf": {
        "type": "file",
        "content": "%PDF-1.4 [Architecture Diagram Specification Binary Mock]",
        "size": 5600,
    },
    "/project/report.pdf": {
        "type": "file",
        "content": "%PDF-1.4 [Executive Summary Q3 Report Binary Mock]",
        "size": 4200,
    },
    "/project/duplicate_cache.tmp": {
        "type": "file",
        "content": "[Uncompressed Build Cache Temp Log]",
        "size": 240,
    },
}


@router.post("/seed", response_model=APIResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def seed_demo(
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Seeds initial demo data (User, Workspace with virtual files, Agents, Policies, Initial Baseline Snapshot).
    """
    # 1. Seed Policies
    await PolicyService.seed_default_policies(db=db, user_id=user.id)

    # 2. Find or create demo workspace
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
            state={
                "files": copy.deepcopy(INITIAL_DEMO_FILES),
                "directories": ["/project"],
            },
            version=1,
        )
        db.add(workspace)
        await db.flush()

    # 3. Seed Agents
    agents_data = [
        {"name": "Workspace Agent", "role": "Documentation & File Organizer", "avatar": "🤖"},
        {"name": "Research Agent", "role": "Code Hygiene & Architecture Analyst", "avatar": "🔍"},
        {"name": "Cleanup Agent", "role": "Cache Pruner & Temp Optimizer", "avatar": "🧹"},
    ]

    created_agents = []
    for ad in agents_data:
        res = await db.execute(
            select(Agent).where((Agent.user_id == user.id) & (Agent.name == ad["name"]))
        )
        ag = res.scalar_one_or_none()
        if not ag:
            ag = Agent(user_id=user.id, status="ONLINE", **ad)
            db.add(ag)
            created_agents.append(ag)

    await db.flush()

    # 4. Create Initial Baseline Snapshot
    snap = await SnapshotService.create_snapshot(
        db=db,
        workspace_id=workspace.id,
        user_id=user.id,
        name="Snapshot #01 (Baseline)",
        description="Initial clean workspace state before agent execution.",
    )

    return APIResponse(
        success=True,
        data={
            "workspace_id": workspace.id,
            "workspace_name": workspace.name,
            "total_files": len(workspace.state.get("files", {})),
            "baseline_snapshot_id": snap.snapshot_id,
            "user_email": user.email,
        },
        message="Demo environment seeded successfully.",
    )


@router.post("/run", response_model=APIResponse[Dict[str, Any]])
async def run_demo_scenario(
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Executes the 5-step Hackathon Demo Scenario:
    1. CREATE /project/docs
    2. MOVE README.md -> /project/docs/README.md
    3. MOVE architecture.pdf -> /project/docs/architecture.pdf
    4. RENAME report.pdf -> final_report_v2.pdf
    5. Creates Checkpoint & Snapshot
    """
    # Ensure workspace exists
    ws_res = await db.execute(
        select(Workspace).where(
            (Workspace.user_id == user.id) & (Workspace.name == "AI Project Organizer")
        )
    )
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        await seed_demo(user=user, db=db)
        ws_res = await db.execute(select(Workspace).where(Workspace.user_id == user.id))
        workspace = ws_res.scalar_one_or_none()

    # Find Workspace Agent
    ag_res = await db.execute(select(Agent).where(Agent.user_id == user.id).order_by(Agent.created_at.asc()))
    agent = ag_res.scalars().first()
    agent_id = agent.id if agent else None


    # Execute safe demo steps
    actions_to_execute = [
        {"type": "CREATE", "target": "/project/docs", "reason": "Initialize documentation folder structure"},
        {"type": "MOVE", "target": "/project/README.md", "destination": "/project/docs/README.md", "reason": "Move README to docs"},
        {"type": "MOVE", "target": "/project/architecture.pdf", "destination": "/project/docs/architecture.pdf", "reason": "Centralize architecture spec"},
        {"type": "RENAME", "target": "/project/report.pdf", "destination": "/project/final_report_v2.pdf", "reason": "Standardize version naming"},
    ]

    executed_action_ids = []

    for step in actions_to_execute:
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
        executed_action_ids.append(act.action_id)

        await ws_manager.broadcast(
            workspace_id=workspace.id,
            event_type="action.completed",
            data={"action_id": act.action_id, "action_type": act.action_type, "target": act.target},
        )

    # Create Snapshot #04 post-organization
    snap = await SnapshotService.create_snapshot(
        db=db,
        workspace_id=workspace.id,
        user_id=user.id,
        name="Snapshot #04 (Organized Docs)",
        description="Created after moving README and centralizing architecture specs.",
        action_count=len(executed_action_ids),
    )

    return APIResponse(
        success=True,
        data={
            "scenario": "AI Project Organizer",
            "executed_actions_count": len(executed_action_ids),
            "action_ids": executed_action_ids,
            "snapshot_id": snap.snapshot_id,
            "workspace_version": workspace.version,
            "next_step": "User can now click UNDO LAST ACTION or RESTORE SNAPSHOT.",
        },
        message="Demo scenario completed. Actions are ready for 1-click rollback.",
    )


@router.post("/reset", response_model=APIResponse[Dict[str, Any]])
async def reset_demo(
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Completely resets demo workspace state back to default baseline files.
    """
    ws_res = await db.execute(select(Workspace).where(Workspace.user_id == user.id))
    workspace = ws_res.scalar_one_or_none()
    if workspace:
        workspace.state = {
            "files": copy.deepcopy(INITIAL_DEMO_FILES),
            "directories": ["/project"],
        }
        workspace.version = 1
        workspace.is_locked = False
        workspace.locked_by = None
        await db.flush()

    return APIResponse(
        success=True,
        data={"workspace_id": workspace.id if workspace else None},
        message="Demo state reset to initial baseline.",
    )
