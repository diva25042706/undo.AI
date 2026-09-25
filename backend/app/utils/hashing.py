import hashlib
import json
from typing import Any, Dict


def canonical_json(data: Any) -> str:
    """Produces deterministic canonical JSON sorted by keys."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def compute_state_hash(state: Dict[str, Any]) -> str:
    """Computes SHA-256 hash of a workspace state dict."""
    canonical_str = canonical_json(state)
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
