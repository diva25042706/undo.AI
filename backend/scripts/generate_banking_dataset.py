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

# Set fixed random seed for 100% deterministic dataset generation
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

FIRST_NAMES = [
    "Aarav", "Aditi", "Amit", "Ananya", "Deepak", "Divya", "Gaurav", "Harsh",
    "Ishaan", "Kavya", "Manish", "Neha", "Nikhil", "Pooja", "Pranav", "Priya",
    "Rahul", "Rakesh", "Riya", "Rohan", "Sam", "Sanjay", "Shreya", "Sneha",
    "Suresh", "Tanvi", "Varun", "Vikram", "Yash", "Zoya"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Iyer", "Rao", "Singh", "Nair", "Gupta",
    "Kapoor", "Mehta", "Sen", "Joshi", "Reddy", "Kumar", "Chopra", "Das",
    "Bhat", "Deshmukh", "Menon", "Agarwal", "Banerjee", "Pillai", "Malhotra"
]

PAYMENT_AMOUNTS = [500.0, 1000.0, 2500.0, 5000.0, 10000.0, 25000.0, 50000.0, 100000.0]
AMOUNT_WEIGHTS = [0.15, 0.20, 0.20, 0.18, 0.14, 0.08, 0.03, 0.02]

PAYMENT_TYPES = [
    "BANK_TRANSFER",
    "IMPS_SIMULATION",
    "NEFT_SIMULATION",
    "INTERNAL_TRANSFER",
    "VENDOR_PAYMENT"
]

def generate_full_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def generate_datasets():
    total_records = 10000
    batch_size = 250
    total_batches = total_records // batch_size

    # Target anomaly counts matching exact requested distribution:
    # 92% NORMAL = 9200
    # 2% WRONG_RECIPIENT = 200
    # 2% WRONG_ACCOUNT = 200
    # 1% WRONG_AMOUNT = 100
    # 1% DUPLICATE_PAYMENT = 100
    # 1% PAYMENT_TIMEOUT = 100
    # 1% UNKNOWN_STATE = 100
    anomaly_plan = (
        ["NORMAL"] * 9200 +
        ["WRONG_RECIPIENT"] * 200 +
        ["WRONG_ACCOUNT"] * 200 +
        ["WRONG_AMOUNT"] * 100 +
        ["DUPLICATE_PAYMENT"] * 100 +
        ["PAYMENT_TIMEOUT"] * 100 +
        ["UNKNOWN_STATE"] * 100
    )
    random.shuffle(anomaly_plan)

    base_time = datetime(2026, 3, 1, 9, 0, 0, tzinfo=timezone.utc)
    records = []

    # Keep a pool of generated transactions to reference for DUPLICATE_PAYMENT
    recent_transactions = []

    for i in range(total_records):
        idx = i + 1
        txn_id = f"TXN{idx:08d}"
        cust_id = f"CUS{random.randint(1000001, 1005000)}"
        cust_name = generate_full_name()
        phone_num = f"+91-90000{random.randint(10000, 99999)}"
        src_account = f"ACC{random.randint(1000001, 1003000)}"

        ben_id = f"BEN{random.randint(1000001, 1005000)}"
        ben_name = generate_full_name()
        ben_phone = f"+91-90000{random.randint(10000, 99999)}"
        dest_account = f"ACC{random.randint(1003001, 1009999)}"

        amount = float(random.choices(PAYMENT_AMOUNTS, weights=AMOUNT_WEIGHTS)[0])
        currency = "INR"
        payment_type = random.choice(PAYMENT_TYPES)
        checkpoint_id = f"CP-PAY-{idx:06d}"
        batch_id = f"BATCH-2026-{(i // batch_size) + 1:03d}"
        created_at = (base_time + timedelta(seconds=i * 24)).isoformat()

        anomaly_type = anomaly_plan[i]
        duplicate_of = ""

        # Default: Expected equals Intended Target Contract
        expected_recipient = ben_name
        expected_amount = amount
        expected_account = dest_account

        actual_recipient = expected_recipient
        actual_amount = expected_amount
        actual_account = expected_account

        if anomaly_type == "NORMAL":
            verification_status = "VERIFIED"
            anomaly_type_val = "NONE"
            recovery_strategy = "NONE"
            # 85% completed, 15% pending
            transaction_status = "COMPLETED" if random.random() < 0.85 else "PENDING"
            risk_score = random.randint(10, 40)

        elif anomaly_type == "WRONG_RECIPIENT":
            # Recipient differs, amount & account remain or mismatch
            wrong_person = generate_full_name()
            while wrong_person == expected_recipient:
                wrong_person = generate_full_name()
            actual_recipient = wrong_person
            verification_status = "FAILED"
            anomaly_type_val = "WRONG_RECIPIENT"
            risk_score = random.randint(85, 98)

            # Assign status & recovery
            r = random.random()
            if r < 0.60:
                transaction_status = "PENDING"
                recovery_strategy = "CANCEL"
            elif r < 0.90:
                transaction_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"
            else:
                transaction_status = "PROCESSING"
                recovery_strategy = "HUMAN_ESCALATION"

        elif anomaly_type == "WRONG_ACCOUNT":
            wrong_acc = f"ACC{random.randint(2000000, 2099999)}"
            while wrong_acc == expected_account:
                wrong_acc = f"ACC{random.randint(2000000, 2099999)}"
            actual_account = wrong_acc
            verification_status = "FAILED"
            anomaly_type_val = "WRONG_ACCOUNT"
            risk_score = random.randint(80, 95)

            r = random.random()
            if r < 0.60:
                transaction_status = "PENDING"
                recovery_strategy = "CANCEL"
            elif r < 0.90:
                transaction_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"
            else:
                transaction_status = "PROCESSING"
                recovery_strategy = "HUMAN_ESCALATION"

        elif anomaly_type == "WRONG_AMOUNT":
            # Amount changed (e.g. +5000 or 10x slip)
            delta = random.choice([500.0, 2000.0, 5000.0, 10000.0])
            actual_amount = expected_amount + delta
            verification_status = "FAILED"
            anomaly_type_val = "WRONG_AMOUNT"
            risk_score = random.randint(85, 96)

            r = random.random()
            if r < 0.60:
                transaction_status = "PENDING"
                recovery_strategy = "CANCEL"
            elif r < 0.90:
                transaction_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"
            else:
                transaction_status = "PROCESSING"
                recovery_strategy = "HUMAN_ESCALATION"

        elif anomaly_type == "DUPLICATE_PAYMENT":
            if recent_transactions:
                ref_txn = random.choice(recent_transactions[-20:])
                duplicate_of = ref_txn["transaction_id"]
                cust_id = ref_txn["customer_id"]
                cust_name = ref_txn["customer_name"]
                src_account = ref_txn["source_account"]
                ben_id = ref_txn["beneficiary_id"]
                ben_name = ref_txn["beneficiary_name"]
                dest_account = ref_txn["destination_account"]
                amount = float(ref_txn["amount"])
                expected_recipient = ben_name
                expected_amount = amount
                expected_account = dest_account
                actual_recipient = ben_name
                actual_amount = amount
                actual_account = dest_account

            verification_status = "FAILED"
            anomaly_type_val = "DUPLICATE_PAYMENT"
            risk_score = random.randint(88, 97)

            if random.random() < 0.70:
                transaction_status = "PENDING"
                recovery_strategy = "CANCEL"
            else:
                transaction_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "PAYMENT_TIMEOUT":
            transaction_status = "UNKNOWN"
            verification_status = "FAILED"
            anomaly_type_val = "PAYMENT_TIMEOUT"
            risk_score = random.randint(70, 85)
            recovery_strategy = "VERIFY_BEFORE_RETRY"

        elif anomaly_type == "UNKNOWN_STATE":
            transaction_status = "UNKNOWN"
            verification_status = "FAILED"
            anomaly_type_val = "UNKNOWN_STATE"
            risk_score = random.randint(75, 90)
            recovery_strategy = "VERIFY_BEFORE_RETRY"

        row = {
            "transaction_id": txn_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "phone_number": phone_num,
            "source_account": src_account,
            "beneficiary_id": ben_id,
            "beneficiary_name": ben_name,
            "beneficiary_phone": ben_phone,
            "destination_account": dest_account,
            "amount": f"{amount:.2f}",
            "currency": currency,
            "payment_type": payment_type,
            "transaction_status": transaction_status,
            "created_at": created_at,
            "expected_recipient": expected_recipient,
            "expected_amount": f"{expected_amount:.2f}",
            "expected_account": expected_account,
            "actual_recipient": actual_recipient,
            "actual_amount": f"{actual_amount:.2f}",
            "actual_account": actual_account,
            "risk_score": risk_score,
            "verification_status": verification_status,
            "anomaly_type": anomaly_type_val,
            "recovery_strategy": recovery_strategy,
            "checkpoint_id": checkpoint_id,
            "batch_id": batch_id,
            "duplicate_of": duplicate_of
        }

        records.append(row)
        recent_transactions.append(row)

    # Write data/banking_payments_10000.csv
    csv_file_path = "data/banking_payments_10000.csv"
    fieldnames = list(records[0].keys())
    with open(csv_file_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"✓ Generated {len(records)} records in {csv_file_path}")

    # Calculate exact distribution metrics
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
        "dataset_name": "UNDO.AI Synthetic FinTech Autonomous Payment Dataset",
        "description": "Deterministic benchmark dataset for AI Payment Guardian anomaly detection, independent verification, and intelligent recovery.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": RANDOM_SEED,
        "total_records": total_records,
        "normal_records": normal_count,
        "anomaly_records": anomaly_total,
        "anomaly_distribution": {
            "NONE (NORMAL)": {"count": anomaly_counts.get("NONE", 0), "percentage": f"{(anomaly_counts.get('NONE', 0)/total_records)*100:.1f}%"},
            "WRONG_RECIPIENT": {"count": anomaly_counts.get("WRONG_RECIPIENT", 0), "percentage": f"{(anomaly_counts.get('WRONG_RECIPIENT', 0)/total_records)*100:.1f}%"},
            "WRONG_ACCOUNT": {"count": anomaly_counts.get("WRONG_ACCOUNT", 0), "percentage": f"{(anomaly_counts.get('WRONG_ACCOUNT', 0)/total_records)*100:.1f}%"},
            "WRONG_AMOUNT": {"count": anomaly_counts.get("WRONG_AMOUNT", 0), "percentage": f"{(anomaly_counts.get('WRONG_AMOUNT', 0)/total_records)*100:.1f}%"},
            "DUPLICATE_PAYMENT": {"count": anomaly_counts.get("DUPLICATE_PAYMENT", 0), "percentage": f"{(anomaly_counts.get('DUPLICATE_PAYMENT', 0)/total_records)*100:.1f}%"},
            "PAYMENT_TIMEOUT": {"count": anomaly_counts.get("PAYMENT_TIMEOUT", 0), "percentage": f"{(anomaly_counts.get('PAYMENT_TIMEOUT', 0)/total_records)*100:.1f}%"},
            "UNKNOWN_STATE": {"count": anomaly_counts.get("UNKNOWN_STATE", 0), "percentage": f"{(anomaly_counts.get('UNKNOWN_STATE', 0)/total_records)*100:.1f}%"}
        },
        "total_batches": total_batches,
        "records_per_batch": batch_size,
        "supported_recovery_strategies": [
            "NONE",
            "CANCEL",
            "COMPENSATE",
            "VERIFY_BEFORE_RETRY",
            "HUMAN_ESCALATION"
        ],
        "recovery_strategy_distribution": recovery_counts
    }

    metadata_file_path = "data/banking_dataset_metadata.json"
    with open(metadata_file_path, mode="w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Generated metadata in {metadata_file_path}")

    # Generate data/banking_demo_subset.csv with EXACTLY 20 records:
    # - 10 normal
    # - 3 wrong recipient
    # - 2 wrong account
    # - 2 wrong amount
    # - 1 duplicate
    # - 1 timeout
    # - 1 human escalation case
    demo_records = []

    # Pick 10 normal records
    normals = [r for r in records if r["anomaly_type"] == "NONE"][:10]
    demo_records.extend(normals)

    # Pick 3 wrong recipient
    wrong_recps = [r for r in records if r["anomaly_type"] == "WRONG_RECIPIENT"][:3]
    demo_records.extend(wrong_recps)

    # Pick 2 wrong account
    wrong_accs = [r for r in records if r["anomaly_type"] == "WRONG_ACCOUNT"][:2]
    demo_records.extend(wrong_accs)

    # Pick 2 wrong amount
    wrong_amts = [r for r in records if r["anomaly_type"] == "WRONG_AMOUNT"][:2]
    demo_records.extend(wrong_amts)

    # Pick 1 duplicate
    duplicates = [r for r in records if r["anomaly_type"] == "DUPLICATE_PAYMENT"][:1]
    demo_records.extend(duplicates)

    # Pick 1 timeout
    timeouts = [r for r in records if r["anomaly_type"] == "PAYMENT_TIMEOUT"][:1]
    demo_records.extend(timeouts)

    # Pick 1 human escalation case
    human_cases = [r for r in records if r["recovery_strategy"] == "HUMAN_ESCALATION"]
    if human_cases:
        demo_records.append(human_cases[0])
    else:
        # Construct explicit human escalation case
        h_row = dict(wrong_recps[0])
        h_row["transaction_id"] = "TXN-DEMO-HUMAN-01"
        h_row["amount"] = "500000.00"
        h_row["expected_amount"] = "500000.00"
        h_row["actual_amount"] = "500000.00"
        h_row["transaction_status"] = "PROCESSING"
        h_row["recovery_strategy"] = "HUMAN_ESCALATION"
        h_row["risk_score"] = 98
        demo_records.append(h_row)

    demo_file_path = "data/banking_demo_subset.csv"
    with open(demo_file_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(demo_records)

    print(f"✓ Generated demo subset with {len(demo_records)} records in {demo_file_path}")

if __name__ == "__main__":
    generate_datasets()
