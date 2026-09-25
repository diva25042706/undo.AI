from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.exceptions import UndoAIException
from backend.app.models.policy import Policy
from backend.app.models.user import User
from backend.app.schemas.common import APIResponse
from backend.app.schemas.policy import PolicyCreate, PolicyResponse, PolicyUpdate

router = APIRouter(prefix="/policies", tags=["Policies & Governance"])


@router.get("", response_model=APIResponse[List[PolicyResponse]])
async def list_policies(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active agent governance policies."""
    res = await db.execute(select(Policy).where(Policy.user_id == user.id))
    policies = res.scalars().all()

    return APIResponse(
        success=True,
        data=[PolicyResponse.model_validate(p) for p in policies],
        message=f"Retrieved {len(policies)} policies.",
    )


@router.post("", response_model=APIResponse[PolicyResponse], status_code=status.HTTP_201_CREATED)
async def create_policy(
    req: PolicyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new operational policy rule."""
    policy = Policy(
        user_id=user.id,
        agent_id=req.agent_id,
        action_type=req.action_type.upper(),
        category=req.category,
        allowed=req.allowed,
        requires_approval=req.requires_approval,
        max_risk_level=req.max_risk_level,
        description=req.description,
    )
    db.add(policy)
    await db.flush()

    return APIResponse(
        success=True,
        data=PolicyResponse.model_validate(policy),
        message=f"Policy for '{policy.action_type}' created.",
    )


@router.patch("/{policy_id}", response_model=APIResponse[PolicyResponse])
async def update_policy(
    policy_id: str,
    req: PolicyUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing policy rule (e.g. toggle requires_approval or allowed)."""
    res = await db.execute(
        select(Policy).where(
            (Policy.id == policy_id) & (Policy.user_id == user.id)
        )
    )
    policy = res.scalar_one_or_none()
    if not policy:
        raise UndoAIException(
            code="POLICY_NOT_FOUND",
            message=f"Policy '{policy_id}' not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    if req.allowed is not None:
        policy.allowed = req.allowed
    if req.requires_approval is not None:
        policy.requires_approval = req.requires_approval
    if req.max_risk_level is not None:
        policy.max_risk_level = req.max_risk_level
    if req.description is not None:
        policy.description = req.description

    await db.flush()

    return APIResponse(
        success=True,
        data=PolicyResponse.model_validate(policy),
        message=f"Policy '{policy.action_type}' updated.",
    )
