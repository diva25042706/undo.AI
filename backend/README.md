# UNDO.AI — Production Backend Engine (AG02)

> **“AI that acts. You stay in control.”**  
> *Autonomous AI Agent Execution Engine with Granular Checkpoints, Quantitative Risk Scoring, and Conflict-Aware 1-Click Rollbacks.*

---

## 🚀 Overview

**UNDO.AI** is a production-grade FastAPI backend for autonomous AI agents. Unlike standard AI wrappers that blindly execute irreversible side-effects, UNDO.AI guarantees that every action is:
1. **Planned & Risk-Scored**: Evaluated quantitatively before execution (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
2. **Policy-Gated**: High-risk or irreversible mutations halt for explicit human authorization.
3. **Atomic & Checkpointed**: Virtual state captured with SHA-256 state hashes before and after execution.
4. **100% Reversible**: Generates deterministic `inverse_operation` descriptors.
5. **Conflict-Aware**: Prevents stale rollbacks if dependent resources changed subsequently.
6. **Immutably Audited**: Rollbacks record `ROLLBACK_COMPLETED` events without erasing execution history.

---

## 📐 Architecture & Execution Lifecycle

```
User Request
    │
    ▼
[AI Planner Service] ──► (Gemini / OpenAI / Mock Provider)
    │
    ▼
[Risk Engine] ──► Calculates score (0-100) & risk tier
    │
    ▼
[Policy Engine] ──► Passes safe actions / Gating high-risk actions
    │
    ▼
[Execution Engine]
    ├── 1. Acquire Workspace Lock
    ├── 2. Capture Before-State & SHA-256 Checkpoint
    ├── 3. Mutate Virtual Filesystem
    ├── 4. Generate Inverse Operation
    ├── 5. Capture After-State & Checkpoint
    ├── 6. Append Immutable Audit Event
    └── 7. Broadcast WebSocket Event (action.completed)
    │
    ▼
[Undo / Rollback Engine]
    ├── 1. Conflict Check (stale subsequent mutations)
    ├── 2. Apply Inverse Operation
    ├── 3. Reconcile Version & Checkpoint
    └── 4. Append Immutable Audit Event (ROLLBACK_COMPLETED)
```

---

## 🛠️ Tech Stack

- **Framework**: Python 3.12+ / FastAPI (Async)
- **Validation**: Pydantic v2
- **ORM & Database**: SQLAlchemy 2 (Async) + PostgreSQL (with SQLite zero-dependency fallback)
- **Migrations**: Alembic
- **Caching & Locks**: Redis 7
- **Authentication**: JWT (Access + Refresh Tokens) & Bcrypt
- **AI Providers**: Google Gemini API, OpenAI-compatible API, and Mock Engine
- **Streaming**: WebSockets (`/ws/workspaces/{workspace_id}`)
- **Testing**: Pytest + Pytest-Asyncio + HTTPX
- **Containerization**: Docker & Docker Compose

---

## 🔌 API Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register user account and seed default policies
- `POST /api/v1/auth/login` — Authenticate and receive JWT access & refresh tokens
- `POST /api/v1/auth/refresh` — Refresh access token
- `GET  /api/v1/auth/me` — Current authenticated user profile

### Autonomous Agents (`/api/v1/agents`)
- `GET  /api/v1/agents` — List user's active agents
- `POST /api/v1/agents` — Create a new agent
- `POST /api/v1/agents/{agent_id}/plan` — **AI Planner**: Generate risk-scored structured action plan
- `POST /api/v1/agents/{agent_id}/execute` — Execute planned actions through safety policy gates

### Actions & Approvals (`/api/v1/actions`)
- `GET  /api/v1/actions` — Filterable action history (`status`, `risk`, `agent_id`, `reversible`)
- `GET  /api/v1/actions/{action_id}` — Deep inspect action (before/after states, inverse operation)
- `POST /api/v1/actions/{action_id}/approve` — Approve action paused in `PENDING_APPROVAL`
- `POST /api/v1/actions/{action_id}/reject` — Reject a proposed action
- `POST /api/v1/actions/{action_id}/undo` — **Rollback specific action** (supports `?cascade=true`)

### Undo Engine (`/api/v1/workspaces`)
- `POST /api/v1/workspaces/{workspace_id}/undo-last` — **1-Click Global Undo** on most recent reversible action

### Snapshots & Time Travel (`/api/v1/snapshots`)
- `POST /api/v1/workspaces/{workspace_id}/snapshots` — Create checkpoint snapshot
- `GET  /api/v1/workspaces/{workspace_id}/snapshots` — List snapshots
- `GET  /api/v1/snapshots/{snapshot_id}` — Compare snapshot file tree diffs
- `POST /api/v1/snapshots/{snapshot_id}/restore` — **Time-travel restoration** with pre-restore safety checkpoint

### Governance Policies (`/api/v1/policies`)
- `GET   /api/v1/policies` — List operational policies
- `POST  /api/v1/policies` — Create custom policy rule
- `PATCH /api/v1/policies/{policy_id}` — Update policy toggles (e.g. `requires_approval`, `allowed`)

### Audit Log (`/api/v1/audit`)
- `GET /api/v1/audit` — Query immutable compliance audit stream
- `GET /api/v1/audit/{action_id}` — Lifecycle history for specific action

### Metrics & Observability (`/api/v1/metrics`)
- `GET /api/v1/metrics` — Dashboard counters (Active agents, reversible actions, rollback latency)

### Hackathon Demo Controller (`/api/v1/demo`)
- `POST /api/v1/demo/seed` — Initialize demo workspace and sample files
- `POST /api/v1/demo/run` — Run complete 5-step automated reorganization flow
- `POST /api/v1/demo/reset` — Reset workspace back to clean baseline

### WebSockets (`/ws/workspaces/{workspace_id}`)
- Broadcasts real-time events: `agent.planning`, `action.started`, `action.completed`, `action.undo_started`, `action.undo_completed`, `snapshot.created`.

---

## 🏃 Getting Started

### Option A: Local Development (Quick Start)

```bash
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# 3. Start server
uvicorn backend.app.main:app --reload --port 8000
```

Open:
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### Option B: Docker Compose (Production Deployment)

```bash
# From the project root:
docker compose up --build
```

---

## 🧪 Running Automated Tests

Run the full pytest suite:

```bash
cd backend
.venv\Scripts\pytest -v
```

All tests verify:
- Complete reversible lifecycle (`CREATE` $\rightarrow$ `MOVE` $\rightarrow$ `UNDO` $\rightarrow$ state restored)
- Stale edit conflict prevention (`ROLLBACK_CONFLICT`)
- Snapshot time travel and safety checkpointing
- User registration and JWT authentication
- Policy gating and high-risk approval flows
