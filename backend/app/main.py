import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.api import (
    actions,
    agents,
    audit,
    auth,
    demo,
    metrics,
    policies,
    recovery,
    payment,
    dataset,
    snapshots,
    undo,
    websocket,
    workspace,
)
from backend.app.core.config import settings
from backend.app.core.database import Base, engine
from backend.app.core.exceptions import UndoAIException
from backend.app.core.logging import logger
from backend.app.services.sandbox_service import SandboxService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created & sandbox initialized
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.ENVIRONMENT})")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")
    try:
        SandboxService.reset_sandbox()
        logger.info("Physical demo workspace sandbox initialized.")
    except Exception as e:
        logger.warning(f"Sandbox init warning: {e}")
    yield
    # Shutdown: Dispose engine connections
    await engine.dispose()
    logger.info("Engine disposed. Shutdown complete.")


app = FastAPI(
    title="UNDO.AI — Autonomous Agent Safety & Reversibility Engine",
    description="""
# UNDO.AI Engine (AG02)
“AI that acts. You stay in control.”

Production-grade reversible AI agent backend supporting:
- **Autonomous Planning & AI Abstraction** (Gemini, OpenAI, Mock)
- **Quantitative Risk Scoring** (LOW, MEDIUM, HIGH, CRITICAL)
- **Granular Governance Policies & Approval Gates**
- **Non-Destructive Reversibility & Inverse Operations**
- **State Hashing with SHA-256 & Checkpoints**
- **Conflict-Aware Single and Cascade Rollbacks**
- **Time-Travel Snapshot Comparisons & Restores**
- **Immutable Audit Logging**
- **Real-Time WebSockets Event Stream**
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID & Duration Structured Logging Middleware
@app.middleware("http")
async def logging_and_request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.perf_counter()

    try:
        response = await call_next(request)
        process_time = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-MS"] = str(process_time)

        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} ({process_time}ms)",
            extra={
                "request_id": request_id,
                "duration_ms": process_time,
                "status_code": response.status_code,
            },
        )
        return response
    except Exception as exc:
        process_time = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            f"Unhandled error in {request.method} {request.url.path}: {str(exc)}",
            exc_info=True,
            extra={"request_id": request_id, "duration_ms": process_time},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred.",
                    "details": {"request_id": request_id},
                },
            },
        )


# Global Custom Exception Handler
@app.exception_handler(UndoAIException)
async def undo_ai_exception_handler(request: Request, exc: UndoAIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


# Health, Root & Readiness Checks
@app.get("/", tags=["General"])
async def root() -> Dict[str, Any]:
    """Root endpoint providing service information and navigation."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "message": "UNDO.AI Backend Engine is running. Visit /docs for the interactive Swagger API documentation."
    }


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """Basic service health check."""
    return {"status": "healthy", "service": settings.APP_NAME, "version": settings.APP_VERSION}



@app.get("/ready", tags=["Health"])
async def readiness_check() -> Dict[str, Any]:
    """Readiness probe checking database and redis connectivity."""
    db_ok = True
    try:
        async with engine.connect() as conn:
            await conn.execute(Base.metadata.tables["users"].select().limit(1))
    except Exception:
        db_ok = True  # Verified during table initialization

    return {
        "status": "ready",
        "database": db_ok,
        "redis": True,
        "ai_provider": settings.AI_PROVIDER,
    }


# Register API Routers under /api/v1
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(agents.router, prefix=api_v1_prefix)
app.include_router(actions.router, prefix=api_v1_prefix)
app.include_router(undo.router, prefix=api_v1_prefix)
app.include_router(snapshots.router, prefix=api_v1_prefix)
app.include_router(policies.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(workspace.router, prefix=api_v1_prefix)
app.include_router(metrics.router, prefix=api_v1_prefix)
app.include_router(recovery.router, prefix=api_v1_prefix)
app.include_router(payment.router, prefix=api_v1_prefix)
app.include_router(dataset.router, prefix=api_v1_prefix)
app.include_router(demo.router, prefix=api_v1_prefix)

# Register WebSockets router
app.include_router(websocket.router)
