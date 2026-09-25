from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.policy import Policy


class PolicyService:
    @staticmethod
    async def seed_default_policies(db: AsyncSession, user_id: str) -> List[Policy]:
        """Seeds standard governance policies for a new user."""
        defaults = [
            # File Operations
            {"action_type": "CREATE", "category": "file_ops", "allowed": True, "requires_approval": False, "max_risk_level": "LOW", "description": "Create new files and folders"},
            {"action_type": "MOVE", "category": "file_ops", "allowed": True, "requires_approval": False, "max_risk_level": "LOW", "description": "Move and reorganize files"},
            {"action_type": "RENAME", "category": "file_ops", "allowed": True, "requires_approval": False, "max_risk_level": "LOW", "description": "Rename files"},
            {"action_type": "UPDATE", "category": "file_ops", "allowed": True, "requires_approval": False, "max_risk_level": "MEDIUM", "description": "Update existing file contents"},
            {"action_type": "DELETE", "category": "file_ops", "allowed": True, "requires_approval": True, "max_risk_level": "HIGH", "description": "Permanently delete files"},
            
            # Communication & Finance
            {"action_type": "EMAIL_DRAFT", "category": "communication", "allowed": True, "requires_approval": False, "max_risk_level": "LOW", "description": "Draft emails"},
            {"action_type": "EMAIL_SEND", "category": "communication", "allowed": False, "requires_approval": True, "max_risk_level": "HIGH", "description": "Send external emails"},
            {"action_type": "TRANSACTION", "category": "finance", "allowed": False, "requires_approval": True, "max_risk_level": "CRITICAL", "description": "Financial purchases and payments"},
            
            # System
            {"action_type": "SYSTEM_MODIFY", "category": "system", "allowed": False, "requires_approval": True, "max_risk_level": "CRITICAL", "description": "Modify system settings and environment"},
        ]

        # Check existing
        res = await db.execute(select(Policy).where(Policy.user_id == user_id))
        existing = res.scalars().all()
        if existing:
            return list(existing)

        created_policies = []
        for d in defaults:
            p = Policy(user_id=user_id, **d)
            db.add(p)
            created_policies.append(p)

        await db.flush()
        return created_policies
