import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from backend.app.core.config import settings

logger = logging.getLogger("undo_ai")


class AIProvider(ABC):
    @abstractmethod
    async def generate_plan(self, instruction: str, workspace_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        pass


class MockProvider(AIProvider):
    """
    Deterministic mock provider ensuring zero-dependency, flawless hackathon demo execution.
    """
    async def generate_plan(self, instruction: str, workspace_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        inst = instruction.lower()

        # Hackathon demo scenario: "organize" / "clean"
        if "organize" in inst or "clean" in inst or "doc" in inst:
            return [
                {
                    "type": "CREATE",
                    "target": "/project/docs",
                    "reason": "Create unified documentation directory",
                    "risk": "LOW",
                    "is_reversible": True,
                },
                {
                    "type": "MOVE",
                    "target": "/project/README.md",
                    "destination": "/project/docs/README.md",
                    "reason": "Relocate root readme into documentation hub",
                    "risk": "LOW",
                    "is_reversible": True,
                },
                {
                    "type": "MOVE",
                    "target": "/project/architecture.pdf",
                    "destination": "/project/docs/architecture.pdf",
                    "reason": "Consolidate architectural specification diagrams",
                    "risk": "LOW",
                    "is_reversible": True,
                },
                {
                    "type": "RENAME",
                    "target": "/project/report.pdf",
                    "destination": "/project/final_report_v2.pdf",
                    "reason": "Standardize team file versioning convention",
                    "risk": "LOW",
                    "is_reversible": True,
                },
                {
                    "type": "DELETE",
                    "target": "/project/duplicate_cache.tmp",
                    "reason": "Purge stale build cache duplicate files",
                    "risk": "HIGH",
                    "is_reversible": False,  # Triggers explicit human approval gate!
                },
            ]
        elif "refactor" in inst or "code" in inst:
            return [
                {
                    "type": "UPDATE",
                    "target": "/project/app.py",
                    "content": "# Refactored with async error handlers\nimport asyncio\nprint('Production Undo Engine Ready')\n",
                    "reason": "Optimize asynchronous execution loop",
                    "risk": "MEDIUM",
                    "is_reversible": True,
                },
                {
                    "type": "CREATE",
                    "target": "/project/CHANGELOG.md",
                    "content": "# Changelog\n\n## v1.0.0\n- Initial release with Undo Engine.\n",
                    "reason": "Draft automated changelog",
                    "risk": "LOW",
                    "is_reversible": True,
                },
            ]
        else:
            # Generic fallback plan
            return [
                {
                    "type": "CREATE",
                    "target": f"/project/output_{instruction[:10].strip().replace(' ', '_')}.txt",
                    "content": f"Automated output for request: {instruction}",
                    "reason": f"Executed agent goal: {instruction}",
                    "risk": "LOW",
                    "is_reversible": True,
                }
            ]


class GeminiProvider(AIProvider):
    async def generate_plan(self, instruction: str, workspace_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not configured. Falling back to MockProvider.")
            return await MockProvider().generate_plan(instruction, workspace_state)

        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            prompt = f"""You are UNDO.AI Autonomous Planning Engine.
Given the current virtual workspace state:
{json.dumps(workspace_state, indent=2)}

And user instruction: "{instruction}"

Generate a structured JSON array of proposed atomic actions.
Each action must have:
- type: (CREATE, MOVE, RENAME, UPDATE, DELETE)
- target: (file or directory path)
- destination: (optional, for MOVE/RENAME)
- content: (optional, for CREATE/UPDATE)
- reason: (concise explanation)
- risk: (LOW, MEDIUM, HIGH, CRITICAL)
- is_reversible: (true/false)

Return ONLY valid JSON array with no markdown formatting.
"""
            response = client.models.generate_content(
                model=settings.AI_MODEL_NAME or "gemini-2.0-flash",
                contents=prompt,
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            return json.loads(raw_text.strip())
        except Exception as e:
            logger.error(f"Gemini API error: {e}. Falling back to MockProvider.")
            return await MockProvider().generate_plan(instruction, workspace_state)


class OpenAIProvider(AIProvider):
    async def generate_plan(self, instruction: str, workspace_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not configured. Falling back to MockProvider.")
            return await MockProvider().generate_plan(instruction, workspace_state)

        try:
            import openai
            client = openai.AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
            prompt = f"""You are UNDO.AI Autonomous Planning Engine.
Given workspace: {json.dumps(workspace_state)}
And instruction: "{instruction}"

Generate JSON array of actions with type, target, destination, reason, risk, is_reversible.
"""
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            parsed = json.loads(content)
            return parsed.get("actions", parsed) if isinstance(parsed, dict) else parsed
        except Exception as e:
            logger.error(f"OpenAI API error: {e}. Falling back to MockProvider.")
            return await MockProvider().generate_plan(instruction, workspace_state)


def get_ai_service() -> AIProvider:
    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider()
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIProvider()
    return MockProvider()
