import csv
import json
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def validate_payment_platform():
    print("=" * 65)
    print("VALIDATING PAYMENT PLATFORM / DIGITAL WALLET DATASET")
    print("=" * 65)

    with open("data/payment_platform_10000.csv", mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        records = list(reader)

    print(f"Total Records in 10,000 CSV: {len(records)}")
    assert len(records) == 10000

    req_cols = [
        "transaction_id", "merchant_id", "merchant_name", "customer_id",
        "customer_phone", "payment_method", "order_id", "amount", "currency",
        "payment_status", "expected_merchant", "actual_merchant", "expected_amount",
        "actual_amount", "expected_order_id", "actual_order_id", "transaction_timestamp",
        "risk_score", "verification_status", "anomaly_type", "recovery_strategy",
        "checkpoint_id", "batch_id"
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

    assert counts["NONE"] == 9300
    assert counts["WRONG_MERCHANT"] == 200
    assert counts["WRONG_AMOUNT"] == 150
    assert counts["DUPLICATE_CHARGE"] == 100
    assert counts["REFUND_MISMATCH"] == 100
    assert counts["UNKNOWN_PAYMENT_STATE"] == 50
    assert counts["TIMEOUT"] == 100

    # Validate Metadata
    with open("data/payment_platform_metadata.json", mode="r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["total_records"] == 10000
    assert meta["normal_records"] == 9300
    assert meta["anomaly_records"] == 700
    print("\nMetadata JSON verified successfully.")

    # Validate Demo Subset
    with open("data/payment_platform_demo_subset.csv", mode="r", encoding="utf-8") as f:
        demo = list(csv.DictReader(f))

    print(f"\nDemo Subset Records: {len(demo)}")
    assert len(demo) == 20

    demo_types = set(r["anomaly_type"] for r in demo)
    expected_types = {"NONE", "WRONG_MERCHANT", "WRONG_AMOUNT", "DUPLICATE_CHARGE", "REFUND_MISMATCH", "UNKNOWN_PAYMENT_STATE", "TIMEOUT"}
    assert demo_types == expected_types, f"Missing types in demo subset: {expected_types - demo_types}"

    print(f"All anomaly types represented in 20-record demo subset: {sorted(list(demo_types))}")
    print("\n" + "=" * 65)
    print("ALL PAYMENT PLATFORM DATASET CRITERIA VERIFIED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    validate_payment_platform()
