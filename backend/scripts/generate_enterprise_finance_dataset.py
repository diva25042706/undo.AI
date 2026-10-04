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

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

COMPANIES = ["CORP_ACME_IN", "CORP_INDUS_AI", "CORP_NEXUS_TECH", "CORP_GLOBAL_CORP"]
DEPARTMENTS = ["DEPT_ENG", "DEPT_HR", "DEPT_SALES", "DEPT_FINANCE", "DEPT_OPERATIONS", "DEPT_MARKETING"]

EMPLOYEE_NAMES = [
    "Aarav Sharma", "Priya Patel", "Vikram Rao", "Sneha Iyer", "Rohan Verma",
    "Ananya Singh", "Deepak Nair", "Neha Gupta", "Rahul Kapoor", "Divya Joshi",
    "Gaurav Banerjee", "Pooja Reddy", "Varun Bhat", "Kavya Menon", "Suresh Kumar"
]

VENDOR_ENTITIES = [
    {"id": "VEN_5001", "name": "TechNova Cloud Infrastructure", "type": "VENDOR"},
    {"id": "VEN_5002", "name": "Apex Office Logistics Pvt Ltd", "type": "SUPPLIER"},
    {"id": "VEN_5003", "name": "Global Talent Recruitment Hub", "type": "CONTRACTOR"},
    {"id": "VEN_5004", "name": "CyberShield Security Solutions", "type": "VENDOR"},
    {"id": "VEN_5005", "name": "OmniSupply Hardware Distributors", "type": "SUPPLIER"},
    {"id": "VEN_5006", "name": "Precision Legal & Compliance Advisors", "type": "CONTRACTOR"},
    {"id": "VEN_5099", "name": "Rogue Unvetted Vendor Pvt Ltd", "type": "VENDOR"} # Mismatch vendor
]

PAYMENT_CATEGORIES = [
    "PAYROLL",
    "VENDOR_PAYMENT",
    "INVOICE_SETTLEMENT",
    "REIMBURSEMENT",
    "EXPENSE"
]

AMOUNTS_BY_CATEGORY = {
    "PAYROLL": [45000.0, 65000.0, 85000.0, 120000.0, 175000.0, 250000.0],
    "VENDOR_PAYMENT": [25000.0, 50000.0, 150000.0, 350000.0, 800000.0],
    "INVOICE_SETTLEMENT": [15000.0, 42000.0, 95000.0, 220000.0, 550000.0],
    "REIMBURSEMENT": [1200.0, 3500.0, 7800.0, 14500.0, 25000.0],
    "EXPENSE": [2500.0, 6000.0, 18000.0, 32000.0, 48000.0]
}

def generate_enterprise_dataset():
    total_records = 10000
    batch_size = 250
    total_batches = total_records // batch_size

    # Target distribution:
    # 90% NORMAL = 9000
    # 2% WRONG_VENDOR = 200
    # 2% WRONG_AMOUNT = 200
    # 1.5% DUPLICATE_PAYMENT = 150
    # 1% UNAPPROVED_PAYMENT = 100
    # 1% WRONG_ACCOUNT = 100
    # 1% TIMEOUT = 100
    # 0.5% UNKNOWN_STATE = 50
    # 1% OTHER_POLICY_VIOLATION = 100
    # Total = 10000
    anomaly_plan = (
        ["NORMAL"] * 9000 +
        ["WRONG_VENDOR"] * 200 +
        ["WRONG_AMOUNT"] * 200 +
        ["DUPLICATE_PAYMENT"] * 150 +
        ["UNAPPROVED_PAYMENT"] * 100 +
        ["WRONG_ACCOUNT"] * 100 +
        ["TIMEOUT"] * 100 +
        ["UNKNOWN_STATE"] * 50 +
        ["OTHER_POLICY_VIOLATION"] * 100
    )
    random.shuffle(anomaly_plan)

    base_time = datetime(2026, 3, 1, 7, 30, 0, tzinfo=timezone.utc)
    records = []
    recent_records = []

    for i in range(total_records):
        idx = i + 1
        payment_id = f"PAY_ENT_{idx:08d}"
        company_id = random.choice(COMPANIES)
        dept_id = random.choice(DEPARTMENTS)
        category = random.choice(PAYMENT_CATEGORIES)
        phone = f"+91-90000{random.randint(10000, 99999)}"
        inv_id = f"INV_2026_{random.randint(100001, 999999)}"

        if category in ["PAYROLL", "REIMBURSEMENT"]:
            entity_name = random.choice(EMPLOYEE_NAMES)
            entity_type = "EMPLOYEE"
            entity_id = f"EMP_{random.randint(3001, 3999)}"
        else:
            v_obj = random.choice(VENDOR_ENTITIES[:6])
            entity_name = v_obj["name"]
            entity_type = v_obj["type"]
            entity_id = v_obj["id"]

        base_amount = float(random.choice(AMOUNTS_BY_CATEGORY[category]))
        invoice_amount = base_amount
        approved_amount = base_amount
        payment_amount = base_amount
        currency = "INR"

        src_acc = f"ACC_CORP_{random.randint(101, 109)}"
        dest_acc = f"ACC_REC_{random.randint(500001, 599999)}"
        checkpoint_id = f"CP-ENT-{idx:06d}"
        batch_id = f"BATCH-ENT-2026-{(i // batch_size) + 1:03d}"
        created_at = (base_time + timedelta(seconds=i * 20)).isoformat()

        anomaly_type = anomaly_plan[i]

        expected_recipient = entity_name
        actual_recipient = entity_name
        expected_amount = payment_amount
        actual_amount = payment_amount
        expected_account = dest_acc
        actual_account = dest_acc

        approval_status = "APPROVED"
        verification_status = "VERIFIED"
        anomaly_val = "NONE"
        recovery_strategy = "NONE"
        payment_status = "COMPLETED" if random.random() < 0.85 else "PENDING"
        risk_score = random.randint(10, 35)

        if anomaly_type == "NORMAL":
            pass

        elif anomaly_type == "WRONG_VENDOR":
            rogue_v = VENDOR_ENTITIES[6]  # Rogue vendor
            actual_recipient = rogue_v["name"]
            verification_status = "FAILED"
            anomaly_val = "WRONG_VENDOR"
            risk_score = random.randint(88, 98)

            if random.random() < 0.65:
                payment_status = "PENDING"
                recovery_strategy = "CANCEL"
            elif random.random() < 0.90:
                payment_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"
            else:
                payment_status = "PROCESSING"
                recovery_strategy = "BLOCK + HUMAN_APPROVAL"

        elif anomaly_type == "WRONG_AMOUNT":
            # Inflated invoice/payment amount
            actual_amount = expected_amount + random.choice([5000.0, 25000.0, 50000.0, 100000.0])
            payment_amount = actual_amount
            verification_status = "FAILED"
            anomaly_val = "WRONG_AMOUNT"
            risk_score = random.randint(85, 96)

            if random.random() < 0.65:
                payment_status = "PENDING"
                recovery_strategy = "CANCEL"
            else:
                payment_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "DUPLICATE_PAYMENT":
            if recent_records:
                ref = random.choice(recent_records[-15:])
                entity_id = ref["employee_or_vendor_id"]
                entity_name = ref["entity_name"]
                entity_type = ref["entity_type"]
                dept_id = ref["department_id"]
                inv_id = ref["invoice_id"]
                base_amount = float(ref["payment_amount"])
                invoice_amount = base_amount
                approved_amount = base_amount
                payment_amount = base_amount
                expected_recipient = entity_name
                actual_recipient = entity_name
                expected_amount = base_amount
                actual_amount = base_amount

            verification_status = "FAILED"
            anomaly_val = "DUPLICATE_PAYMENT"
            risk_score = random.randint(86, 97)

            if random.random() < 0.60:
                payment_status = "PENDING"
                recovery_strategy = "CANCEL_DUPLICATE"
            else:
                payment_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "UNAPPROVED_PAYMENT":
            approval_status = "UNAPPROVED"
            payment_status = "BLOCKED"
            verification_status = "FAILED"
            anomaly_val = "UNAPPROVED_PAYMENT"
            risk_score = random.randint(92, 99)
            recovery_strategy = "BLOCK + HUMAN_APPROVAL"

        elif anomaly_type == "WRONG_ACCOUNT":
            actual_account = f"ACC_UNRECOG_{random.randint(900001, 999999)}"
            verification_status = "FAILED"
            anomaly_val = "WRONG_ACCOUNT"
            risk_score = random.randint(84, 95)

            if random.random() < 0.60:
                payment_status = "PENDING"
                recovery_strategy = "CANCEL"
            else:
                payment_status = "COMPLETED"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "TIMEOUT":
            payment_status = "UNKNOWN"
            verification_status = "FAILED"
            anomaly_val = "TIMEOUT"
            risk_score = random.randint(70, 85)
            recovery_strategy = "VERIFY_BEFORE_RETRY"

        elif anomaly_type == "UNKNOWN_STATE":
            payment_status = "UNKNOWN"
            verification_status = "FAILED"
            anomaly_val = "UNKNOWN_STATE"
            risk_score = random.randint(75, 90)
            recovery_strategy = "VERIFY_BEFORE_RETRY"

        elif anomaly_type == "OTHER_POLICY_VIOLATION":
            # Out of budget or department policy violation
            payment_status = "BLOCKED"
            approval_status = "REJECTED"
            verification_status = "FAILED"
            anomaly_val = "OTHER_POLICY_VIOLATION"
            risk_score = random.randint(88, 97)
            recovery_strategy = "BLOCK + HUMAN_APPROVAL"

        row = {
            "payment_id": payment_id,
            "company_id": company_id,
            "department_id": dept_id,
            "employee_or_vendor_id": entity_id,
            "entity_name": entity_name,
            "entity_type": entity_type,
            "phone_number": phone,
            "invoice_id": inv_id,
            "invoice_amount": f"{invoice_amount:.2f}",
            "approved_amount": f"{approved_amount:.2f}",
            "payment_amount": f"{payment_amount:.2f}",
            "currency": currency,
            "source_account": src_acc,
            "destination_account": dest_acc,
            "expected_recipient": expected_recipient,
            "actual_recipient": actual_recipient,
            "expected_amount": f"{expected_amount:.2f}",
            "actual_amount": f"{actual_amount:.2f}",
            "payment_status": payment_status,
            "approval_status": approval_status,
            "risk_score": risk_score,
            "verification_status": verification_status,
            "anomaly_type": anomaly_val,
            "recovery_strategy": recovery_strategy,
            "checkpoint_id": checkpoint_id,
            "batch_id": batch_id,
            "created_at": created_at
        }

        records.append(row)
        recent_records.append(row)

    # Write 10k CSV
    csv_path = "data/enterprise_finance_10000.csv"
    fieldnames = list(records[0].keys())
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"✓ Generated {len(records)} records in {csv_path}")

    # Counts & metadata
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
        "dataset_name": "UNDO.AI Enterprise AI Finance Autonomous Recovery Benchmark",
        "scenario": "Enterprise AI Finance Agent — Payroll, Invoices, Vendor Disbursements & Expense Settlement",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": RANDOM_SEED,
        "total_records": total_records,
        "normal_records": normal_count,
        "anomaly_records": anomaly_total,
        "anomaly_distribution": {
            "NONE (NORMAL)": {"count": anomaly_counts.get("NONE", 0), "percentage": f"{(anomaly_counts.get('NONE', 0)/total_records)*100:.1f}%"},
            "WRONG_VENDOR": {"count": anomaly_counts.get("WRONG_VENDOR", 0), "percentage": f"{(anomaly_counts.get('WRONG_VENDOR', 0)/total_records)*100:.1f}%"},
            "WRONG_AMOUNT": {"count": anomaly_counts.get("WRONG_AMOUNT", 0), "percentage": f"{(anomaly_counts.get('WRONG_AMOUNT', 0)/total_records)*100:.1f}%"},
            "DUPLICATE_PAYMENT": {"count": anomaly_counts.get("DUPLICATE_PAYMENT", 0), "percentage": f"{(anomaly_counts.get('DUPLICATE_PAYMENT', 0)/total_records)*100:.1f}%"},
            "UNAPPROVED_PAYMENT": {"count": anomaly_counts.get("UNAPPROVED_PAYMENT", 0), "percentage": f"{(anomaly_counts.get('UNAPPROVED_PAYMENT', 0)/total_records)*100:.1f}%"},
            "WRONG_ACCOUNT": {"count": anomaly_counts.get("WRONG_ACCOUNT", 0), "percentage": f"{(anomaly_counts.get('WRONG_ACCOUNT', 0)/total_records)*100:.1f}%"},
            "TIMEOUT": {"count": anomaly_counts.get("TIMEOUT", 0), "percentage": f"{(anomaly_counts.get('TIMEOUT', 0)/total_records)*100:.1f}%"},
            "UNKNOWN_STATE": {"count": anomaly_counts.get("UNKNOWN_STATE", 0), "percentage": f"{(anomaly_counts.get('UNKNOWN_STATE', 0)/total_records)*100:.1f}%"},
            "OTHER_POLICY_VIOLATION": {"count": anomaly_counts.get("OTHER_POLICY_VIOLATION", 0), "percentage": f"{(anomaly_counts.get('OTHER_POLICY_VIOLATION', 0)/total_records)*100:.1f}%"}
        },
        "total_batches": total_batches,
        "records_per_batch": batch_size,
        "supported_entity_types": ["EMPLOYEE", "VENDOR", "CONTRACTOR", "SUPPLIER"],
        "supported_recovery_strategies": [
            "NONE",
            "CANCEL",
            "CANCEL_DUPLICATE",
            "COMPENSATE",
            "BLOCK + HUMAN_APPROVAL",
            "VERIFY_BEFORE_RETRY"
        ],
        "recovery_strategy_distribution": recovery_counts
    }

    meta_path = "data/enterprise_finance_metadata.json"
    with open(meta_path, mode="w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Generated metadata in {meta_path}")

    # Generate data/enterprise_finance_demo_subset.csv with 20 carefully selected records:
    # 1 normal payroll
    # 1 wrong vendor
    # 1 wrong amount
    # 1 duplicate payroll
    # 1 unapproved payment
    # 1 wrong account
    # 1 timeout
    # 1 human escalation / policy violation
    # and 12 additional normal transactions across departments/categories (Total = 20)
    demo_records = []

    # 1 normal payroll + 11 normal
    normal_payroll = [r for r in records if r["anomaly_type"] == "NONE" and r["entity_type"] == "EMPLOYEE"][:1]
    other_normals = [r for r in records if r["anomaly_type"] == "NONE" and r["payment_id"] != normal_payroll[0]["payment_id"]][:11]
    demo_records.extend(normal_payroll)
    demo_records.extend(other_normals)

    # 1 wrong vendor
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_VENDOR"][:1])
    # 1 wrong amount
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_AMOUNT"][:1])
    # 1 duplicate payment
    demo_records.extend([r for r in records if r["anomaly_type"] == "DUPLICATE_PAYMENT"][:1])
    # 1 unapproved payment
    demo_records.extend([r for r in records if r["anomaly_type"] == "UNAPPROVED_PAYMENT"][:1])
    # 1 wrong account
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_ACCOUNT"][:1])
    # 1 timeout
    demo_records.extend([r for r in records if r["anomaly_type"] == "TIMEOUT"][:1])
    # 1 human escalation / policy violation
    demo_records.extend([r for r in records if r["anomaly_type"] == "OTHER_POLICY_VIOLATION"][:1])
    # 1 unknown state
    demo_records.extend([r for r in records if r["anomaly_type"] == "UNKNOWN_STATE"][:1])

    demo_path = "data/enterprise_finance_demo_subset.csv"
    with open(demo_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(demo_records)

    print(f"✓ Generated enterprise demo subset with {len(demo_records)} records in {demo_path}")

if __name__ == "__main__":
    generate_enterprise_dataset()
