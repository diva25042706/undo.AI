import pytest
from backend.app.engines.dependency_graph import DependencyGraph
from backend.app.engines.expected_state_engine import ExpectedStateEngine
from backend.app.engines.independent_verifier import IndependentVerifier
from backend.app.engines.recovery_engine import RecoveryEngine
from backend.app.engines.risk_engine import RiskEngine
from backend.app.services.checkpoint_service import CheckpointService
from backend.app.services.confidence_engine import ConfidenceEngine
from backend.app.services.execution_service import ExecutionService
from backend.app.services.sandbox_service import SandboxService
from backend.app.services.undo_service import UndoService


@pytest.mark.asyncio
async def test_risk_engine_quantitative_scoring():
    # 1. Low risk move
    lvl, score, reasons, policy = RiskEngine.evaluate_risk("MOVE", "/project/README.md")
    assert score <= 30
    assert lvl == "LOW"
    assert policy == "AUTO_EXECUTE"

    # 2. High risk deletion
    lvl, score, reasons, policy = RiskEngine.evaluate_risk("DELETE", "/project/data.json", is_reversible=False)
    assert score >= 75
    assert policy in ["REQUIRE_STRONG_VERIFICATION", "HUMAN_APPROVAL_REQUIRED"]

    # 3. Financial external side effect
    lvl, score, reasons, policy = RiskEngine.evaluate_risk("TRANSACTION", "bank_account", is_financial=True)
    assert score >= 90
    assert lvl == "CRITICAL"
    assert policy == "HUMAN_APPROVAL_REQUIRED"


@pytest.mark.asyncio
async def test_expected_state_engine_generation():
    manifest = SandboxService.reset_sandbox()
    expected = ExpectedStateEngine.generate_expected_state("Organize my project documentation", manifest)
    assert expected.goal == "Organize my project documentation"
    assert "/project/docs/README.md" in expected.expected_state
    assert len(expected.constraints) > 0
    assert len(expected.success_criteria) > 0
    assert expected.confidence_scores["overall_confidence"] > 0.8


@pytest.mark.asyncio
async def test_independent_verifier_success_and_failure():
    contract = {
        "/project/docs/README.md": {"presence": "EXISTS"},
        "/project/app.py": {"presence": "EXISTS"},
        "/project/README.md": {"presence": "ABSENT"},
    }

    # Case 1: Valid State
    valid_state = {
        "files": {
            "/project/docs/README.md": {"content": "Docs"},
            "/project/app.py": {"content": "print('hello')"},
        }
    }
    result_valid = IndependentVerifier.verify_state(contract, valid_state)
    assert result_valid.is_valid is True
    assert result_valid.status == "PASSED"
    assert len(result_valid.differences) == 0

    # Case 2: Mismatched State (architecture left in root, docs missing)
    mismatched_state = {
        "files": {
            "/project/README.md": {"content": "Still in root"},
            "/project/app.py": {"content": "print('hello')"},
        }
    }
    result_fail = IndependentVerifier.verify_state(contract, mismatched_state)
    assert result_fail.is_valid is False
    assert result_fail.status == "FAILED"
    assert len(result_fail.differences) >= 2


@pytest.mark.asyncio
async def test_recovery_engine_strategy_selection():
    # When verification fails and checkpoint is present -> ROLLBACK
    verification_fail = IndependentVerifier.verify_state(
        expected_state_contract={"/project/docs/README.md": {"presence": "EXISTS"}},
        actual_state={"files": {}},
    )
    plan = RecoveryEngine.select_recovery_strategy(
        verification_result=verification_fail,
        actions_history=[{"action_id": "ACT-101", "is_reversible": True}],
        available_checkpoints=[{"checkpoint_id": "CP-101"}],
        latest_checkpoint_id="CP-101",
    )
    assert plan.recovery_strategy == "ROLLBACK"
    assert plan.target_checkpoint_id == "CP-101"
    assert plan.recovery_confidence >= 0.95


@pytest.mark.asyncio
async def test_dependency_graph_cascade_order():
    actions = [
        {"id": "A1", "type": "CREATE", "target": "/project/docs"},
        {"id": "A2", "type": "MOVE", "target": "/project/README.md", "destination": "/project/docs/README.md"},
        {"id": "A3", "type": "UPDATE", "target": "/project/docs/README.md"},
    ]
    graph = DependencyGraph.build_graph(actions)
    assert "A1" in graph["A2"].depends_on
    assert "A2" in graph["A3"].depends_on

    # Cascade rollback of A1 must reverse A3, then A2, then A1
    cascade_order = DependencyGraph.get_cascade_rollback_order("A1", graph)
    assert cascade_order == ["A3", "A2", "A1"]


@pytest.mark.asyncio
async def test_physical_sandbox_operations_and_rollback():
    manifest = SandboxService.reset_sandbox()
    assert "/project/README.md" in manifest["files"]

    # Execute physical move
    SandboxService.execute_physical_operation(
        action_type="MOVE",
        target="/project/README.md",
        destination="/project/docs/README.md",
    )
    after_move = SandboxService.get_current_manifest()
    assert "/project/docs/README.md" in after_move["files"]
    assert "/project/README.md" not in after_move["files"]

    # Restore from initial baseline manifest
    SandboxService.restore_physical_manifest(manifest["files"])
    restored = SandboxService.get_current_manifest()
    assert "/project/README.md" in restored["files"]
    assert "/project/docs/README.md" not in restored["files"]


@pytest.mark.asyncio
async def test_confidence_engine():
    report = ConfidenceEngine.evaluate_confidence(intent_ambiguity=0.04, risk_score=20)
    assert report.intent_confidence > 0.90
    assert report.overall_confidence > 0.90
    assert report.human_review_recommended is False
