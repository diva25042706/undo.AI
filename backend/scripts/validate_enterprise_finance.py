import csv
import json
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def validate_enterprise_finance():
    print("=" * 65)
    print("VALIDATING ENTERPRISE FINANCE DATASET")
    print("=" * 65)

    with open("data/enterprise_finance_10000.csv", mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        records = list(reader)

    print(f"Total Records in 10,000 CSV: {len(records)}")
    assert len(records) == 10000

    req_cols = [
        "payment_id", "company_id", "department_id", "employee_or_vendor_id",
        "entity_name", "entity_type", "phone_number", "invoice_id", "invoice_amount",
        "approved_amount", "payment_amount", "currency", "source_account",
        "destination_account", "expected_recipient", "actual_recipient",
        "expected_amount", "actual_amount", "payment_status", "approval_status",
        "risk_score", "verification_status", "anomaly_type", "recovery_strategy",
        "checkpoint_id", "batch_id", "created_at"
    ]
    for col in req_cols:
        assert col in records[0], f"Missing column {col}"
    print(f"All {len(req_cols)} required columns present.")

    counts = {}
    for r in records:
        a = r["anomaly_type"]
        counts[a] = counts.get(a, 0) + 1

    print("\nAnomaly Breakdown:")
    for k, v in counts.items():
        print(f"  * {k}: {v} ({v/100:.2f}%)")

    assert counts["NONE"] == 9000
    assert counts["WRONG_VENDOR"] == 200
    assert counts["WRONG_AMOUNT"] == 200
    assert counts["DUPLICATE_PAYMENT"] == 150
    assert counts["UNAPPROVED_PAYMENT"] == 100
    assert counts["WRONG_ACCOUNT"] == 100
    assert counts["TIMEOUT"] == 100
    assert counts["UNKNOWN_STATE"] == 50
    assert counts["OTHER_POLICY_VIOLATION"] == 100

    # Validate Metadata
    with open("data/enterprise_finance_metadata.json", mode="r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["total_records"] == 10000
    assert meta["normal_records"] == 9000
    assert meta["anomaly_records"] == 1000
    print("\nMetadata JSON verified successfully.")

    # Validate Demo Subset
    with open("data/enterprise_finance_demo_subset.csv", mode="r", encoding="utf-8") as f:
        demo = list(csv.DictReader(f))

    print(f"\nDemo Subset Records: {len(demo)}")
    assert len(demo) == 20

    demo_types = set(r["anomaly_type"] for r in demo)
    print(f"Demo subset anomaly types: {sorted(list(demo_types))}")

    print("\n" + "=" * 65)
    print("ALL ENTERPRISE FINANCE DATASET CRITERIA VERIFIED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    validate_enterprise_finance()
