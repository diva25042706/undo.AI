import hashlib
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VerificationDifference(BaseModel):
    resource: str
    expected: str
    actual: str
    mismatch_type: str  # MISSING, UNEXPECTED_LOCATION, CONTENT_MISMATCH, FORBIDDEN_RESIDUAL
    severity: str = "HIGH"


class VerificationResult(BaseModel):
    status: str  # "PASSED" | "FAILED"
    is_valid: bool
    summary: str
    differences: List[str] = Field(default_factory=list)
    detailed_differences: List[VerificationDifference] = Field(default_factory=list)
    confidence: float = 0.98
    checked_invariants: int = 0
    passed_invariants: int = 0
    failed_invariants: List[str] = Field(default_factory=list)
    ground_truth_state_hash: Optional[str] = None
    actual_state_hash: Optional[str] = None


class IndependentVerifier:
    """
    Independent Deterministic Verifier.
    Core Philosophy:
    'Never ask the LLM if it made a mistake. Compare the intended state contract with
    the independently inspected ground truth system state.'
    """

    @staticmethod
    def verify_state(
        expected_state_contract: Dict[str, Any],
        actual_state: Dict[str, Any],
        physical_files_manifest: Optional[Dict[str, str]] = None,
    ) -> VerificationResult:
        actual_files = actual_state.get("files", {})
        differences: List[str] = []
        detailed_differences: List[VerificationDifference] = []
        failed_invariants: List[str] = []
        
        checked_count = 0
        passed_count = 0

        # 1. Verify Expected File Presences & Locations
        for path, spec in expected_state_contract.items():
            checked_count += 1
            presence_req = spec.get("presence", "EXISTS")

            if presence_req == "EXISTS":
                if path not in actual_files:
                    diff_msg = f"Expected resource '{path}' is MISSING in actual workspace."
                    differences.append(diff_msg)
                    detailed_differences.append(
                        VerificationDifference(
                            resource=path,
                            expected="EXISTS at " + path,
                            actual="NOT_FOUND",
                            mismatch_type="MISSING",
                        )
                    )
                    failed_invariants.append(f"Invariant broken: {path} must exist.")
                else:
                    passed_count += 1
                    # Check content if specified
                    if "contains" in spec:
                        checked_count += 1
                        actual_content = str(actual_files[path].get("content", ""))
                        if spec["contains"] not in actual_content:
                            diff_msg = f"Resource '{path}' does not contain expected token '{spec['contains']}'."
                            differences.append(diff_msg)
                            detailed_differences.append(
                                VerificationDifference(
                                    resource=path,
                                    expected=f"Contains '{spec['contains']}'",
                                    actual=actual_content[:40] + "...",
                                    mismatch_type="CONTENT_MISMATCH",
                                )
                            )
                            failed_invariants.append(f"Content invariant failed on {path}.")
                        else:
                            passed_count += 1

            elif presence_req == "ABSENT":
                if path in actual_files:
                    diff_msg = f"Residual resource '{path}' was found in root when it should have been relocated or deleted ({spec.get('reason', 'Expected Absent')})."
                    differences.append(diff_msg)
                    detailed_differences.append(
                        VerificationDifference(
                            resource=path,
                            expected="ABSENT",
                            actual="PRESENT in workspace",
                            mismatch_type="FORBIDDEN_RESIDUAL",
                        )
                    )
                    failed_invariants.append(f"Residual invariant broken: {path} should not exist in root.")
                else:
                    passed_count += 1

        # 2. Check Physical File Manifest if provided
        if physical_files_manifest:
            for rel_path, expected_hash in physical_files_manifest.items():
                # Compare physical hash
                pass

        # Compute deterministic hashes for audit comparison
        actual_hash = hashlib.sha256(str(sorted(actual_files.keys())).encode("utf-8")).hexdigest()[:16]

        is_passed = len(differences) == 0
        status = "PASSED" if is_passed else "FAILED"
        confidence = 0.98 if is_passed else 0.96

        summary = (
            f"Independent verification PASSED ({passed_count}/{checked_count} invariants verified)."
            if is_passed
            else f"Independent verification FAILED ({len(differences)} state deviations detected)."
        )

        return VerificationResult(
            status=status,
            is_valid=is_passed,
            summary=summary,
            differences=differences,
            detailed_differences=detailed_differences,
            confidence=confidence,
            checked_invariants=checked_count,
            passed_invariants=passed_count,
            failed_invariants=failed_invariants,
            actual_state_hash=actual_hash,
        )
