# UNDO.AI — The Agent With An Undo Button
> **Buildathon 2026 AG02 Flagship Solution**  
> *"AI That Acts. You Stay In Control."*

---

## 🌟 Overview

**UNDO.AI** is a transactional execution and recovery layer for tool-calling AI agents, built in the spirit of the distributed Saga pattern.

When autonomous agents execute side-effecting actions in the real world—such as booking hotel rooms, charging credit cards, reserving warehouse inventory, or dispatching carrier manifests—failures halfway through execution can leave downstream systems corrupted in inconsistent, partially completed states.

UNDO.AI transforms agent actions from **"EXECUTE & HOPE"** into:
$$\text{PLAN} \longrightarrow \text{ORDER} \longrightarrow \text{CHECKPOINT} \longrightarrow \text{EXECUTE} \longrightarrow \text{DURABLE LOG} \longrightarrow \text{FAILURE?} \longrightarrow \text{COMPENSATE} \longrightarrow \text{VERIFY} \longrightarrow \text{REAL NOTIFICATION}$$

---

## 📧 Real Email Notification Configuration

When a workflow failure is detected and the user or operator triggers **UNDO / Rollback**, the system performs reverse topological compensation ($S_n^{-1} \to S_{n-1}^{-1} \dots \to S_1^{-1}$), verifies world state invariants, and dispatches a **real transactional recovery email** to the customer.

### 1. Environment Setup

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Configure your credentials:

```env
# ============================================================================
# UNDO.AI — TRANSACTIONAL RECOVERY ENGINE ENVIRONMENT CONFIGURATION
# ============================================================================

# Real Transactional Email Provider (Resend)
# Obtain your free API key at https://resend.com/api-keys
RESEND_API_KEY=re_your_actual_api_key_here

# Sender Address
# For development/testing, Resend provides 'onboarding@resend.dev'
# For custom domain, verify your domain in Resend dashboard
EMAIL_FROM=UNDO.AI Recovery <onboarding@resend.dev>

# Recipient Email (Whitelisted for security)
RECOVERY_NOTIFICATION_EMAIL=divakaranperumal27@gmail.com
RECOVERY_NOTIFICATION_NAME=Divakaran
```

> **Security Note**: Never commit `.env` or secret API keys to GitHub. `.env` is already included in `.gitignore`. All email operations execute strictly server-side via `POST /api/workflows/{workflowId}/undo`.

---

## ⚡ Backend Endpoints

### 1. Execute Saga Rollback & Send Email
`POST /api/workflows/{workflowId}/undo`

**Request Body:**
```json
{
  "customerName": "Divakaran",
  "email": "divakaranperumal27@gmail.com",
  "idempotencyKey": "UNDO-WF-HOTEL-001",
  "workflowName": "Hotel Booking",
  "refundAmount": 750.0,
  "transactionId": "TXN-CHN-4491",
  "compensatedSteps": ["charge_card", "reserve_room"]
}
```

**Response:**
```json
{
  "success": true,
  "workflow_id": "WF-HOTEL-001",
  "idempotency_key": "UNDO-WF-HOTEL-001",
  "status": "FULLY_RESTORED",
  "refund_amount": 750.0,
  "compensated_steps": ["charge_card", "reserve_room"],
  "world_state": {
    "hotel_room": "AVAILABLE",
    "payment": "NOT_CHARGED",
    "booking": "CANCELLED",
    "refund_settled": "$750.00"
  },
  "email": {
    "recipient": "divakaranperumal27@gmail.com",
    "customer_name": "Divakaran",
    "status": "SENT",
    "message_id": "msg_01J8...",
    "timestamp": "2026-10-05T05:00:00.000Z"
  }
}
```

### 2. Retry Email Notification ONLY
`POST /api/workflows/{workflowId}/notify-retry`

Retries ONLY the outbound email dispatch without re-executing compensation actions or double-refunding.

---

## 🛡️ Idempotency & Crash Recovery Guarantees

1. **Double-Click Protection**: If an operator clicks **UNDO** multiple times, the backend checks the idempotency store (`UNDO-{workflowId}`). Completed rollbacks return the cached result immediately, preventing double refunds or redundant cancel calls.
2. **Notification Idempotency**: Outbound emails are guarded by `RECOVERY-{workflowId}-V1`. Subsequent triggers will not duplicate emails.
3. **Decoupled Notification Resilience**: If rollback succeeds but email delivery fails (e.g., rate limit or network error), the system state remains `FULLY_RESTORED` and the UI shows `EMAIL_FAILED` with a dedicated **Retry Notification** button.

---

## 🚀 Running the Application

```bash
# Install dependencies
npm install

# Start development server with embedded API backend
npm run dev

# Build for production verification
npm run build
```

The application will be accessible at: `http://localhost:5173/`
