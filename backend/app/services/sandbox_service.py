import hashlib
import json
import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional


SANDBOX_DIR = Path(__file__).resolve().parent.parent.parent / "demo_workspace"


INITIAL_SANDBOX_FILES = {
    "README.md": "# AI Project Documentation\n\nWelcome to the autonomous workspace.\nOrganized by UNDO.AI Engine.",
    "app.py": "import fastapi\nprint('Starting AI Agent Controller')\n",
    "config.json": '{\n  "version": "2.3",\n  "environment": "staging",\n  "strict_safety": true\n}',
    "architecture.pdf": "%PDF-1.4 [Architecture Specification Diagram Binary Content]",
    "report.pdf": "%PDF-1.4 [Executive Summary Q3 Report Binary Content]",
    "duplicate_cache.tmp": "[Uncompressed Build Cache Temp Log — Safe to Purge]",
}


class SandboxService:
    """
    Manages safe real physical disk operations in `./demo_workspace`.
    Provides guaranteed isolation, real file mutations, SHA-256 state captures,
    and physical rollback restores.
    """

    @classmethod
    def get_sandbox_path(cls) -> Path:
        SANDBOX_DIR.mkdir(parents=True, exist_ok=True)
        return SANDBOX_DIR

    @classmethod
    def resolve_safe_path(cls, relative_path: str) -> Path:
        """
        Safely resolves a workspace relative or /project path strictly inside SANDBOX_DIR.
        Prevents directory traversal attacks.
        """
        clean_rel = relative_path.replace("\\", "/").strip()
        if clean_rel.startswith("/project/"):
            clean_rel = clean_rel[len("/project/"):]
        elif clean_rel.startswith("/project"):
            clean_rel = clean_rel[len("/project"):]
        elif clean_rel.startswith("/"):
            clean_rel = clean_rel[1:]

        target_path = (cls.get_sandbox_path() / clean_rel).resolve()
        # Verify it is strictly inside sandbox
        if not str(target_path).startswith(str(cls.get_sandbox_path().resolve())):
            raise ValueError(f"Security violation: path '{relative_path}' attempts to escape sandbox.")
        return target_path

    @classmethod
    def reset_sandbox(cls) -> Dict[str, Any]:
        """
        Resets physical `./demo_workspace` to pristine known safe baseline state.
        """
        sb_path = cls.get_sandbox_path()
        if sb_path.exists():
            shutil.rmtree(sb_path, ignore_errors=True)
        sb_path.mkdir(parents=True, exist_ok=True)

        # Write initial baseline files
        for filename, content in INITIAL_SANDBOX_FILES.items():
            file_path = sb_path / filename
            file_path.write_text(content, encoding="utf-8")

        return cls.get_current_manifest()

    @classmethod
    def get_current_manifest(cls) -> Dict[str, Any]:
        """
        Scans physical disk directory and returns manifest with file paths, sizes, and SHA-256 hashes.
        """
        sb_path = cls.get_sandbox_path()
        manifest: Dict[str, Any] = {"files": {}, "directories": ["/project"]}

        if not sb_path.exists():
            return manifest

        for root, dirs, files in os.walk(sb_path):
            rel_dir = os.path.relpath(root, sb_path).replace("\\", "/")
            virtual_dir = "/project" if rel_dir == "." else f"/project/{rel_dir}"
            if virtual_dir not in manifest["directories"]:
                manifest["directories"].append(virtual_dir)

            for f in files:
                full_path = Path(root) / f
                rel_file = os.path.relpath(full_path, sb_path).replace("\\", "/")
                virtual_file = f"/project/{rel_file}"

                try:
                    content = full_path.read_text(encoding="utf-8")
                except Exception:
                    content = "[Binary data]"

                manifest["files"][virtual_file] = {
                    "type": "file",
                    "content": content,
                    "size": full_path.stat().st_size,
                    "sha256": hashlib.sha256(content.encode("utf-8")).hexdigest()[:16],
                }

        return manifest

    @classmethod
    def execute_physical_operation(
        cls,
        action_type: str,
        target: str,
        destination: Optional[str] = None,
        content: Optional[str] = None,
    ) -> None:
        """
        Executes real physical filesystem operation.
        """
        action_type = action_type.upper()
        target_path = cls.resolve_safe_path(target)

        if action_type == "CREATE":
            if destination or target.endswith("/") or "." not in target_path.name:
                # Directory creation
                target_path.mkdir(parents=True, exist_ok=True)
            else:
                target_path.parent.mkdir(parents=True, exist_ok=True)
                target_path.write_text(content or "", encoding="utf-8")

        elif action_type in ["MOVE", "RENAME"]:
            if not destination:
                raise ValueError("Destination path required for MOVE/RENAME")
            dest_path = cls.resolve_safe_path(destination)
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            if target_path.exists():
                shutil.move(str(target_path), str(dest_path))

        elif action_type == "UPDATE":
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(content or "", encoding="utf-8")

        elif action_type == "DELETE":
            if target_path.is_dir():
                shutil.rmtree(target_path, ignore_errors=True)
            elif target_path.is_file():
                target_path.unlink(missing_ok=True)

    @classmethod
    def restore_physical_manifest(cls, manifest_files: Dict[str, Any]) -> None:
        """
        Restores physical files in `./demo_workspace` directly from a snapshot/checkpoint manifest.
        """
        sb_path = cls.get_sandbox_path()
        if sb_path.exists():
            shutil.rmtree(sb_path, ignore_errors=True)
        sb_path.mkdir(parents=True, exist_ok=True)

        for virtual_path, file_data in manifest_files.items():
            dest_path = cls.resolve_safe_path(virtual_path)
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            content = file_data.get("content", "")
            dest_path.write_text(content, encoding="utf-8")
