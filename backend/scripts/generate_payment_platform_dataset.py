import csv
import json
import random
import sys
from datetime import datetime, timedelta, timezone

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Fixed seed for deterministic dataset generation
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

MERCHANTS = [
    {"id": "MERCHANT_1001", "name": "QuickBites Cloud Kitchen"},
    {"id": "MERCHANT_1002", "name": "FreshMart Groceries"},
    {"id": "MERCHANT_1003", "name": "UrbanStyle Apparel"},
    {"id": "MERCHANT_1004", "name": "AeroTravel Flights & Stays"},
    {"id": "MERCHANT_1005", "name": "NextGen Electronics"},
    {"id": "MERCHANT_1006", "name": "FitLife Supplements"},
    {"id": "MERCHANT_1007", "name": "BookWorm Media"},
    {"id": "MERCHANT_1008", "name": "EcoRide Mobility"},
    {"id": "MERCHANT_1009", "name": "Zenith Cloud Hosting"},
    {"id": "MERCHANT_1010", "name": "PrimeCinema Tickets"},
    {"id": "MERCHANT_1099", "name": "Unauthorized Rogue Vendor"}  # For mismatch testing
]

PAYMENT_METHODS = [
    "WALLET",
    "CARD_SIMULATION",
    "UPI_SIMULATION",
    "NET_BANKING_SIMULATION",
    "PAYMENT_GATEWAY_SIMULATION"
]

AMOUNTS = [199.0, 499.0, 999.0, 1499.0, 2499.0, 4999.0, 9999.0, 14999.0, 24999.0, 49999.0]
AMOUNT_WEIGHTS = [0.20, 0.22, 0.18, 0.14, 0.10, 0.08, 0.04, 0.02, 0.01, 0.01]

def generate_platform_dataset():
    total_records = 10000
    batch_size = 250
    total_batches = total_records // batch_size

    # Exact requested distribution:
    # 93% NORMAL = 9300
    # 2% WRONG_MERCHANT = 200
    # 1.5% WRONG_AMOUNT = 150
    # 1% DUPLICATE_CHARGE = 100
    # 1% REFUND_MISMATCH = 100
    # 0.5% UNKNOWN_PAYMENT_STATE = 50
    # 1% TIMEOUT = 100
    # Sum: 9300 + 200 + 150 + 100 + 100 + 50 + 100 = 10000
    anomaly_plan = (
        ["NORMAL"] * 9300 +
        ["WRONG_MERCHANT"] * 200 +
        ["WRONG_AMOUNT"] * 150 +
        ["DUPLICATE_CHARGE"] * 100 +
        ["REFUND_MISMATCH"] * 100 +
        ["UNKNOWN_PAYMENT_STATE"] * 50 +
        ["TIMEOUT"] * 100
    )
    random.shuffle(anomaly_plan)

    base_time = datetime(2026, 3, 1, 8, 0, 0, tzinfo=timezone.utc)
    records = []
    recent_records = []

    for i in range(total_records):
        idx = i + 1
        txn_id = f"TXN_WAL_{idx:08d}"
        cust_id = f"CUS_{random.randint(2000001, 2010000)}"
        cust_phone = f"+91-90000{random.randint(10000, 99999)}"
        method = random.choice(PAYMENT_METHODS)
        order_id = f"ORD_{random.randint(9000001, 9999999)}"

        merchant_obj = random.choice(MERCHANTS[:10])  # Pick legit merchant by default
        merchant_id = merchant_obj["id"]
        merchant_name = merchant_obj["name"]

        amount = float(random.choices(AMOUNTS, weights=AMOUNT_WEIGHTS)[0])
        currency = "INR"
        checkpoint_id = f"CP-WAL-{idx:06d}"
        batch_id = f"BATCH-WAL-2026-{(i // batch_size) + 1:03d}"
        timestamp = (base_time + timedelta(seconds=i * 18)).isoformat()

        anomaly_type = anomaly_plan[i]

        expected_merchant = merchant_id
        actual_merchant = merchant_id

        expected_amount = amount
        actual_amount = amount

        expected_order_id = order_id
        actual_order_id = order_id

        if anomaly_type == "NORMAL":
            payment_status = "COMPLETED" if random.random() < 0.88 else "PENDING"
            risk_score = random.randint(10, 35)
            verification_status = "VERIFIED"
            anomaly_type_val = "NONE"
            recovery_strategy = "NONE"

        elif anomaly_type == "WRONG_MERCHANT":
            # Target rogue merchant or different merchant
            alt_merchant = random.choice([m for m in MERCHANTS if m["id"] != expected_merchant])
            actual_merchant = alt_merchant["id"]
            actual_merchant_name = alt_merchant["name"]
            merchant_name = actual_merchant_name
            verification_status = "FAILED"
            anomaly_type_val = "WRONG_MERCHANT"
            risk_score = random.randint(85, 98)

            if random.random() < 0.60:
                payment_status = "PENDING"
                recovery_strategy = "CANCEL"
            elif random.random() < 0.90:
                payment_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"
            else:
                payment_status = "PROCESSING"
                recovery_strategy = "HUMAN_REVIEW"

        elif anomaly_type == "WRONG_AMOUNT":
            # Inadvertent charge multiplier or surcharge
            diff = random.choice([500.0, 1000.0, 5000.0, 10000.0])
            actual_amount = expected_amount + diff
            amount = actual_amount
            verification_status = "FAILED"
            anomaly_type_val = "WRONG_AMOUNT"
            risk_score = random.randint(82, 95)

            if random.random() < 0.60:
                payment_status = "PENDING"
                recovery_strategy = "CANCEL"
            else:
                payment_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "DUPLICATE_CHARGE":
            if recent_records:
                ref = random.choice(recent_records[-15:])
                cust_id = ref["customer_id"]
                cust_phone = ref["customer_phone"]
                merchant_id = ref["merchant_id"]
                merchant_name = ref["merchant_name"]
                order_id = ref["order_id"]
                amount = float(ref["amount"])
                expected_merchant = merchant_id
                actual_merchant = merchant_id
                expected_amount = amount
                actual_amount = amount
                expected_order_id = order_id
                actual_order_id = order_id

            verification_status = "FAILED"
            anomaly_type_val = "DUPLICATE_CHARGE"
            risk_score = random.randint(88, 97)

            if random.random() < 0.55:
                payment_status = "PENDING"
                recovery_strategy = "CANCEL_DUPLICATE"
            else:
                payment_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "REFUND_MISMATCH":
            # Refund intended e.g. ₹2000 vs actual ₹1000
            expected_amount = amount
            actual_amount = max(100.0, round(amount * 0.5, 2))
            amount = actual_amount
            payment_status = "REFUNDED"
            verification_status = "FAILED"
            anomaly_type_val = "REFUND_MISMATCH"
            risk_score = random.randint(75, 90)
            recovery_strategy = "COMPENSATE"

        elif anomaly_type == "TIMEOUT":
            payment_status = "UNKNOWN"
            verification_status = "FAILED"
            anomaly_type_val = "TIMEOUT"
            risk_score = random.randint(70, 85)
            recovery_strategy = "VERIFY_BEFORE_RETRY"

        elif anomaly_type == "UNKNOWN_PAYMENT_STATE":
            payment_status = "UNKNOWN"
            verification_status = "FAILED"
            anomaly_type_val = "UNKNOWN_PAYMENT_STATE"
            risk_score = random.randint(85, 96)
            recovery_strategy = "HUMAN_REVIEW"

        row = {
            "transaction_id": txn_id,
            "merchant_id": merchant_id,
            "merchant_name": merchant_name,
            "customer_id": cust_id,
            "customer_phone": cust_phone,
            "payment_method": method,
            "order_id": order_id,
            "amount": f"{amount:.2f}",
            "currency": currency,
            "payment_status": payment_status,
            "expected_merchant": expected_merchant,
            "actual_merchant": actual_merchant,
            "expected_amount": f"{expected_amount:.2f}",
            "actual_amount": f"{actual_amount:.2f}",
            "expected_order_id": expected_order_id,
            "actual_order_id": actual_order_id,
            "transaction_timestamp": timestamp,
            "risk_score": risk_score,
            "verification_status": verification_status,
            "anomaly_type": anomaly_type_val,
            "recovery_strategy": recovery_strategy,
            "checkpoint_id": checkpoint_id,
            "batch_id": batch_id
        }

        records.append(row)
        recent_records.append(row)

    # Write 10k CSV
    csv_path = "data/payment_platform_10000.csv"
    fieldnames = list(records[0].keys())
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"✓ Generated {len(records)} records in {csv_path}")

    # Compute anomaly counts & metadata
    anomaly_counts = {}
    recovery_counts = {}
    for r in records:
        a = r["anomaly_type"]
        s = r["recovery_strategy"]
        anomaly_counts[a] = anomaly_counts.get(a, 0) + 1
        recovery_counts[s] = recovery_counts.get(s, 0) + 1

    normal_count = anomaly_counts.get("NONE", 0)
    anomaly_total = total_records - normal_count

    metadata = {
        "dataset_name": "UNDO.AI Payment Processor & Digital Wallet Anomaly Benchmark",
        "scenario": "Payment Processor / Digital Wallet / Merchant Settlement",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": RANDOM_SEED,
        "total_records": total_records,
        "normal_records": normal_count,
        "anomaly_records": anomaly_total,
        "anomaly_distribution": {
            "NONE (NORMAL)": {"count": anomaly_counts.get("NONE", 0), "percentage": f"{(anomaly_counts.get('NONE', 0)/total_records)*100:.1f}%"},
            "WRONG_MERCHANT": {"count": anomaly_counts.get("WRONG_MERCHANT", 0), "percentage": f"{(anomaly_counts.get('WRONG_MERCHANT', 0)/total_records)*100:.1f}%"},
            "WRONG_AMOUNT": {"count": anomaly_counts.get("WRONG_AMOUNT", 0), "percentage": f"{(anomaly_counts.get('WRONG_AMOUNT', 0)/total_records)*100:.1f}%"},
            "DUPLICATE_CHARGE": {"count": anomaly_counts.get("DUPLICATE_CHARGE", 0), "percentage": f"{(anomaly_counts.get('DUPLICATE_CHARGE', 0)/total_records)*100:.1f}%"},
            "REFUND_MISMATCH": {"count": anomaly_counts.get("REFUND_MISMATCH", 0), "percentage": f"{(anomaly_counts.get('REFUND_MISMATCH', 0)/total_records)*100:.1f}%"},
            "UNKNOWN_PAYMENT_STATE": {"count": anomaly_counts.get("UNKNOWN_PAYMENT_STATE", 0), "percentage": f"{(anomaly_counts.get('UNKNOWN_PAYMENT_STATE', 0)/total_records)*100:.1f}%"},
            "TIMEOUT": {"count": anomaly_counts.get("TIMEOUT", 0), "percentage": f"{(anomaly_counts.get('TIMEOUT', 0)/total_records)*100:.1f}%"}
        },
        "total_batches": total_batches,
        "records_per_batch": batch_size,
        "supported_payment_methods": PAYMENT_METHODS,
        "supported_recovery_strategies": [
            "NONE",
            "CANCEL",
            "CANCEL_DUPLICATE",
            "COMPENSATE",
            "VERIFY_BEFORE_RETRY",
            "HUMAN_REVIEW"
        ],
        "recovery_strategy_distribution": recovery_counts
    }

    meta_path = "data/payment_platform_metadata.json"
    with open(meta_path, mode="w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Generated metadata in {meta_path}")

    # Generate data/payment_platform_demo_subset.csv with 20 curated records covering all anomaly types:
    demo_records = []
    
    # 8 Normal
    demo_records.extend([r for r in records if r["anomaly_type"] == "NONE"][:8])
    # 2 Wrong Merchant
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_MERCHANT"][:2])
    # 2 Wrong Amount
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_AMOUNT"][:2])
    # 2 Duplicate Charge (1 Pending -> CANCEL_DUPLICATE, 1 Completed -> COMPENSATE)
    demo_records.extend([r for r in records if r["anomaly_type"] == "DUPLICATE_CHARGE"][:2])
    # 2 Refund Mismatch
    demo_records.extend([r for r in records if r["anomaly_type"] == "REFUND_MISMATCH"][:2])
    # 2 Timeout
    demo_records.extend([r for r in records if r["anomaly_type"] == "TIMEOUT"][:2])
    # 2 Unknown Payment State (HUMAN_REVIEW)
    demo_records.extend([r for r in records if r["anomaly_type"] == "UNKNOWN_PAYMENT_STATE"][:2])

    demo_path = "data/payment_platform_demo_subset.csv"
    with open(demo_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(demo_records)

    print(f"✓ Generated demo subset with {len(demo_records)} records in {demo_path}")

if __name__ == "__main__":
    generate_platform_dataset()
