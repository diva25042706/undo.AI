import copy
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SimulatedAccount(BaseModel):
    account_id: str
    name: str
    balance: float
    currency: str = "INR"
    status: str = "ACTIVE"
    avatar: str = "👤"


class SimulatedTransaction(BaseModel):
    transaction_id: str
    sender_id: str
    sender_name: str
    recipient_id: str
    recipient_name: str
    intended_recipient_name: str
    amount: float
    intended_amount: float
    currency: str = "INR"
    status: str  # CREATED | PENDING | PROCESSING | COMPLETED | CANCELLED | REFUNDED | FAILED | REQUIRES_HUMAN_REVIEW
    risk_score: int = 95
    checkpoint_id: str = "CP-PAY-001"
    timestamp: str
    failure_reason: Optional[str] = None
    recovery_strategy: Optional[str] = None
    compensated_by_id: Optional[str] = None
    is_simulation: bool = True


INITIAL_ACCOUNTS: Dict[str, Dict[str, Any]] = {
    "ACC-SENDER": {
        "account_id": "ACC-SENDER",
        "name": "User (JD / Sender)",
        "balance": 100000.0,
        "currency": "INR",
        "status": "ACTIVE",
        "avatar": "💳",
    },
    "ACC-SAM": {
        "account_id": "ACC-SAM",
        "name": "Sam",
        "balance": 50000.0,
        "currency": "INR",
        "status": "ACTIVE",
        "avatar": "👨‍💼",
    },
    "ACC-RAHUL": {
        "account_id": "ACC-RAHUL",
        "name": "Rahul",
        "balance": 50000.0,
        "currency": "INR",
        "status": "ACTIVE",
        "avatar": "🧑‍💻",
    },
    "ACC-RAHUL-K": {
        "account_id": "ACC-RAHUL-K",
        "name": "Rahul K",
        "balance": 25000.0,
        "currency": "INR",
        "status": "ACTIVE",
        "avatar": "👨‍🎓",
    },
    "ACC-RAKESH": {
        "account_id": "ACC-RAKESH",
        "name": "Rakesh",
        "balance": 30000.0,
        "currency": "INR",
        "status": "ACTIVE",
        "avatar": "🧔",
    },
    "ACC-MERCHANT": {
        "account_id": "ACC-MERCHANT",
        "name": "Merchant A (Tech Store)",
        "balance": 15000.0,
        "currency": "INR",
        "status": "ACTIVE",
        "avatar": "🏪",
    },
    "ACC-INVEST": {
        "account_id": "ACC-INVEST",
        "name": "Investment Treasury Account",
        "balance": 200000.0,
        "currency": "INR",
        "status": "ACTIVE",
        "avatar": "📈",
    },
}


class PaymentSimulator:
    """
    Completely safe, in-memory simulated FinTech payment environment.
    Strictly isolated: NO real bank connections, NO real money.
    """

    _accounts: Dict[str, Dict[str, Any]] = copy.deepcopy(INITIAL_ACCOUNTS)
    _transactions: List[Dict[str, Any]] = []
    _checkpoints: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def reset_sandbox(cls) -> Dict[str, Any]:
        """Resets all simulated balances, transaction ledgers, and checkpoints to known pristine baseline."""
        cls._accounts = copy.deepcopy(INITIAL_ACCOUNTS)
        cls._transactions.clear()
        cls._checkpoints.clear()

        # Capture baseline checkpoint
        cls.create_checkpoint("CP-PAY-001", "Baseline FinTech State")
        return {
            "status": "RESET_COMPLETED",
            "accounts_count": len(cls._accounts),
            "baseline_checkpoint": "CP-PAY-001",
            "sender_balance": cls._accounts["ACC-SENDER"]["balance"],
        }

    @classmethod
    def get_accounts(cls) -> List[SimulatedAccount]:
        return [SimulatedAccount(**acc) for acc in cls._accounts.values()]

    @classmethod
    def get_account_by_name(cls, name: str) -> Optional[Dict[str, Any]]:
        name_clean = name.strip().lower()
        for acc in cls._accounts.values():
            if acc["name"].lower() == name_clean or name_clean in acc["name"].lower():
                return acc
        return None

    @classmethod
    def create_checkpoint(cls, checkpoint_id: str, label: str = "Pre-Payment Snapshot") -> Dict[str, Any]:
        """Captures atomic state snapshot of all simulated account balances."""
        snapshot = copy.deepcopy(cls._accounts)
        state_hash = hashlib.sha256(str(sorted(snapshot.items())).encode("utf-8")).hexdigest()[:16]
        cp_data = {
            "checkpoint_id": checkpoint_id,
            "label": label,
            "accounts": snapshot,
            "state_hash": state_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        cls._checkpoints[checkpoint_id] = cp_data
        return cp_data

    @classmethod
    def restore_checkpoint(cls, checkpoint_id: str) -> Dict[str, Any]:
        """Restores account balances directly from financial checkpoint snapshot."""
        if checkpoint_id not in cls._checkpoints:
            checkpoint_id = "CP-PAY-001"
            if checkpoint_id not in cls._checkpoints:
                cls.reset_sandbox()

        cp_data = cls._checkpoints.get(checkpoint_id, {})
        if "accounts" in cp_data:
            cls._accounts = copy.deepcopy(cp_data["accounts"])

        return {
            "checkpoint_id": checkpoint_id,
            "restored_accounts_count": len(cls._accounts),
            "sender_balance": cls._accounts["ACC-SENDER"]["balance"],
            "state_hash": cp_data.get("state_hash", "restored"),
        }

    @classmethod
    def initiate_payment(
        cls,
        intended_recipient: str,
        amount: float,
        actual_recipient_override: Optional[str] = None,
        actual_amount_override: Optional[float] = None,
        force_status: str = "PENDING",
    ) -> Dict[str, Any]:
        """
        Initiates a simulated payment with support for controlled fault injection.
        """
        txn_id = f"TXN-{uuid.uuid4().hex[:6].upper()}"
        checkpoint_id = f"CP-PAY-{datetime.now().strftime('%M%S')}"
        cls.create_checkpoint(checkpoint_id, f"Pre-{txn_id} Checkpoint")

        sender = cls._accounts["ACC-SENDER"]
        actual_recipient_name = actual_recipient_override or intended_recipient
        actual_amount = actual_amount_override if actual_amount_override is not None else amount

        recipient_acc = cls.get_account_by_name(actual_recipient_name)
        if not recipient_acc:
            recipient_acc = cls._accounts["ACC-RAKESH"]

        # Reserve or deduct sender balance if processing/completed
        if force_status in ["PENDING", "PROCESSING", "COMPLETED"]:
            sender["balance"] -= actual_amount

        if force_status == "COMPLETED":
            recipient_acc["balance"] += actual_amount

        txn_record = {
            "transaction_id": txn_id,
            "sender_id": sender["account_id"],
            "sender_name": sender["name"],
            "recipient_id": recipient_acc["account_id"],
            "recipient_name": recipient_acc["name"],
            "intended_recipient_name": intended_recipient,
            "amount": actual_amount,
            "intended_amount": amount,
            "currency": "INR",
            "status": force_status,
            "risk_score": 95,
            "checkpoint_id": checkpoint_id,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "is_simulation": True,
        }

        cls._transactions.insert(0, txn_record)
        return txn_record

    @classmethod
    def cancel_transaction(cls, transaction_id: str) -> Dict[str, Any]:
        """Cancels pending transaction and restores reserved sender balance."""
        txn = next((t for t in cls._transactions if t["transaction_id"] == transaction_id), None)
        if not txn:
            raise ValueError(f"Transaction '{transaction_id}' not found.")

        if txn["status"] not in ["PENDING", "PROCESSING", "CREATED"]:
            raise ValueError(f"Cannot directly cancel transaction in status '{txn['status']}'.")

        # Restore reserved sender amount
        sender = cls._accounts["ACC-SENDER"]
        sender["balance"] += txn["amount"]
        txn["status"] = "CANCELLED"
        txn["recovery_strategy"] = "CANCEL"

        # Restore checkpoint state to ensure complete ground-truth verification
        if txn.get("checkpoint_id"):
            cls.restore_checkpoint(txn["checkpoint_id"])

        return {
            "transaction_id": txn["transaction_id"],
            "status": "CANCELLED",
            "sender_balance": cls._accounts["ACC-SENDER"]["balance"],
            "message": "Transaction safely cancelled. Reserved funds returned to sender.",
        }

    @classmethod
    def compensate_transaction(cls, transaction_id: str) -> Dict[str, Any]:
        """Applies compensating refund transaction for completed incorrect payment."""
        txn = next((t for t in cls._transactions if t["transaction_id"] == transaction_id), None)
        if not txn:
            raise ValueError(f"Transaction '{transaction_id}' not found.")

        comp_id = f"REF-{uuid.uuid4().hex[:6].upper()}"

        # Debit recipient and credit sender
        recipient_acc = cls._accounts.get(txn["recipient_id"])
        sender = cls._accounts["ACC-SENDER"]

        if recipient_acc and recipient_acc["balance"] >= txn["amount"]:
            recipient_acc["balance"] -= txn["amount"]
        sender["balance"] += txn["amount"]

        txn["status"] = "REFUNDED"
        txn["compensated_by_id"] = comp_id
        txn["recovery_strategy"] = "COMPENSATE"

        return {
            "original_transaction_id": transaction_id,
            "compensating_transaction_id": comp_id,
            "status": "REFUNDED",
            "sender_balance": sender["balance"],
            "recipient_balance": recipient_acc["balance"] if recipient_acc else 0.0,
            "message": f"Compensating transaction {comp_id} issued. Source balance restored.",
        }

    @classmethod
    def get_latest_transaction(cls) -> Optional[Dict[str, Any]]:
        return cls._transactions[0] if cls._transactions else None

    @classmethod
    def get_all_transactions(cls) -> List[Dict[str, Any]]:
        return cls._transactions
