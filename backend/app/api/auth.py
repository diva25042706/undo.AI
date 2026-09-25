from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.exceptions import UndoAIException, UnauthorizedAction
from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from backend.app.models.user import User
from backend.app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from backend.app.schemas.common import APIResponse
from backend.app.services.policy_service import PolicyService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    res = await db.execute(select(User).where(User.email == req.email))
    if res.scalar_one_or_none():
        raise UndoAIException(
            code="USER_EXISTS",
            message=f"User with email '{req.email}' already exists.",
            status_code=status.HTTP_409_CONFLICT,
        )

    user = User(
        email=req.email,
        password_hash=get_password_hash(req.password),
        name=req.name or req.email.split("@")[0],
    )
    db.add(user)
    await db.flush()

    # Seed default policies for the new user
    await PolicyService.seed_default_policies(db=db, user_id=user.id)

    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User registered successfully.",
    )


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT access + refresh tokens."""
    res = await db.execute(select(User).where(User.email == req.email))
    user = res.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise UnauthorizedAction("Invalid email or password.")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=60 * 24 * 60,
        ),
        message="Authentication successful.",
    )


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Generate a new access token from refresh token."""
    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise UnauthorizedAction("Invalid token type for refresh.")

    user_id = payload.get("sub")
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise UnauthorizedAction("User no longer exists.")

    new_access = create_access_token(subject=user.id)
    new_refresh = create_refresh_token(subject=user.id)

    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=60 * 24 * 60,
        ),
        message="Token refreshed successfully.",
    )


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_me(user: User = Depends(get_current_user)):
    """Retrieve profile of authenticated user."""
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User profile retrieved.",
    )
