from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user_optional
from backend.app.core.database import get_db
from backend.app.engines.expected_state_engine import ExpectedStateEngine, ExpectedStateModel
from backend.app.engines.independent_verifier import IndependentVerifier, VerificationResult
from backend.app.engines.recovery_engine import RecoveryEngine, RecoveryPlan
from backend.app.models.action import Action
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.user import User
from backend.app.models.workspace import Workspace
from backend.app.schemas.common import APIResponse
from backend.app.schemas.recovery import (
    ExpectedStateRequest,
    RecoveryExecuteRequest,
    RecoveryStatusResponse,
    VerifyStateRequest,
)
from backend.app.services.audit_service import AuditService
from backend.app.services.checkpoint_service import CheckpointService
from backend.app.services.confidence_engine import ConfidenceEngine
from backend.app.services.sandbox_service import SandboxService
from backend.app.services.undo_service import UndoService
from backend.app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/recovery", tags=["Agent Recovery & Verification Engine"])


@router.post("/expected-state", response_model=APIResponse[ExpectedStateModel])
async def get_expected_state(
    payload: ExpectedStateRequest,
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Computes Expected State specification, constraints, and success criteria for a user goal.
    """
    workspace = None
    if payload.workspace_id:
        ws_res = await db.execute(select(Workspace).where(Workspace.id == payload.workspace_id))
        workspace = ws_res.scalar_one_or_none()

    current_state = workspace.state if workspace else SandboxService.get_current_manifest()
    expected_model = ExpectedStateEngine.generate_expected_state(
        goal=payload.goal,
        current_state=current_state,
    )

    return APIResponse(
        success=True,
        data=expected_model,
        message="Expected state specification generated successfully.",
    )


@router.post("/verify", response_model=APIResponse[VerificationResult])
async def verify_system_state(
    payload: VerifyStateRequest,
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Deterministically compares Expected State against Actual Ground Truth System State.
    """
    ws_res = await db.execute(select(Workspace).where(Workspace.id == payload.workspace_id))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    expected_contract = payload.expected_state
    if not expected_contract and payload.goal:
        exp_model = ExpectedStateEngine.generate_expected_state(payload.goal, workspace.state)
        expected_contract = exp_model.expected_state

    if not expected_contract:
        exp_model = ExpectedStateEngine.generate_expected_state("Organize documentation", workspace.state)
        expected_contract = exp_model.expected_state

    # Actual state from DB or Physical sandbox
    actual_state = workspace.state

    # If simulate failure requested for demo
    if payload.simulate_failure:
        actual_copy = {
            "files": dict(actual_state.get("files", {})),
            "directories": list(actual_state.get("directories", [])),
        }
        # Inject controlled failure: architecture.md was left in root instead of /docs
        if "/project/docs/architecture.pdf" in actual_copy["files"]:
            del actual_copy["files"]["/project/docs/architecture.pdf"]
            actual_copy["files"]["/project/architecture.pdf"] = {
                "type": "file",
                "content": "%PDF-1.4 [Architecture Specification Diagram]",
            }
        actual_state = actual_copy

    verification_result = IndependentVerifier.verify_state(
        expected_state_contract=expected_contract,
        actual_state=actual_state,
    )

    # Log verification outcome in Audit Trail
    await AuditService.log_event(
        db=db,
        event_type="INDEPENDENT_VERIFICATION",
        message=verification_result.summary,
        user_id=user.id,
        metadata={
            "status": verification_result.status,
            "differences_count": len(verification_result.differences),
            "confidence": verification_result.confidence,
        },
    )

    await ws_manager.broadcast(
        workspace_id=workspace.id,
        event_type="verification.completed",
        data={
            "status": verification_result.status,
            "summary": verification_result.summary,
            "differences": verification_result.differences,
        },
    )

    return APIResponse(
        success=True,
        data=verification_result,
        message=verification_result.summary,
    )


@router.post("/execute", response_model=APIResponse[Dict[str, Any]])
async def execute_recovery(
    payload: RecoveryExecuteRequest,
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Executes automated recovery (Rollback / Restore Checkpoint / Cascade Reverse).
    """
    ws_res = await db.execute(select(Workspace).where(Workspace.id == payload.workspace_id))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    # 1. If target checkpoint specified, restore it directly
    if payload.target_checkpoint_id:
        restore_info = await CheckpointService.restore_checkpoint(
            db=db,
            checkpoint_id=payload.target_checkpoint_id,
            workspace_id=workspace.id,
        )

        await AuditService.log_event(
            db=db,
            event_type="CHECKPOINT_RESTORED",
            message=f"Workspace restored to safe checkpoint '{payload.target_checkpoint_id}'. All physical files reverted.",
            user_id=user.id,
            metadata=restore_info,
        )

        await ws_manager.broadcast(
            workspace_id=workspace.id,
            event_type="recovery.completed",
            data={"checkpoint_id": payload.target_checkpoint_id, "strategy": "ROLLBACK"},
        )

        return APIResponse(
            success=True,
            data={
                "strategy": "ROLLBACK",
                "checkpoint_id": payload.target_checkpoint_id,
                "status": "RECOVERED",
                "message": f"Successfully restored to safe checkpoint {payload.target_checkpoint_id}.",
                "restored_files": restore_info["restored_files_count"],
            },
            message="Recovery successfully completed. Safe baseline restored.",
        )

    # 2. Otherwise undo latest action
    undo_res = await UndoService.undo_last_action(
        db=db,
        workspace_id=workspace.id,
        user_id=user.id,
    )

    return APIResponse(
        success=True,
        data={
            "strategy": "ROLLBACK",
            "action_id": undo_res.action_id,
            "undone_actions": undo_res.undone_actions,
            "status": "RECOVERED",
        },
        message="Last agent action safely undone.",
    )


@router.get("/status/{workspace_id}", response_model=APIResponse[RecoveryStatusResponse])
async def get_recovery_status(
    workspace_id: str,
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Provides comprehensive live status of agent recovery layer, latest checkpoint, and confidence scores.
    """
    ws_res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    # Fetch latest checkpoint
    chk_res = await db.execute(
        select(Checkpoint)
        .where(Checkpoint.workspace_id == workspace.id)
        .order_by(Checkpoint.created_at.desc())
        .limit(1)
    )
    latest_chk = chk_res.scalar_one_or_none()

    confidence = ConfidenceEngine.evaluate_confidence()
    file_count = len(workspace.state.get("files", {}))

    return APIResponse(
        success=True,
        data=RecoveryStatusResponse(
            recovery_status="SAFE",
            latest_checkpoint_id=latest_chk.checkpoint_id if latest_chk else "CP-001",
            confidence=confidence,
            workspace_file_count=file_count,
        ),
        message="Recovery status fetched.",
    )
