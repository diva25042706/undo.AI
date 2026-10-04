import csv
import json
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def validate_ecommerce():
    print("=" * 65)
    print("VALIDATING E-COMMERCE DATASET")
    print("=" * 65)

    with open("data/ecommerce_transactions_10000.csv", mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        records = list(reader)

    print(f"Total Records in 10,000 CSV: {len(records)}")
    assert len(records) == 10000

    req_cols = [
        "order_id", "customer_id", "customer_name", "customer_phone",
        "product_id", "product_name", "quantity", "unit_price", "total_amount",
        "payment_id", "expected_payment", "actual_payment", "expected_order_status",
        "actual_order_status", "expected_refund_amount", "actual_refund_amount",
        "merchant_id", "transaction_status", "risk_score", "verification_status",
        "anomaly_type", "recovery_strategy", "checkpoint_id", "created_at"
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

    assert counts["NONE"] == 9200
    assert counts["WRONG_AMOUNT"] == 200
    assert counts["DUPLICATE_ORDER"] == 150
    assert counts["WRONG_REFUND"] == 150
    assert counts["WRONG_CUSTOMER"] == 100
    assert counts["CANCEL_FAILURE"] == 100
    assert counts["UNKNOWN_STATE"] == 100

    # Validate Metadata
    with open("data/ecommerce_metadata.json", mode="r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["total_records"] == 10000
    assert meta["normal_records"] == 9200
    assert meta["anomaly_records"] == 800
    print("\nMetadata JSON verified successfully.")

    # Validate Demo Subset
    with open("data/ecommerce_demo_subset.csv", mode="r", encoding="utf-8") as f:
        demo = list(csv.DictReader(f))

    print(f"\nDemo Subset Records: {len(demo)}")
    assert len(demo) == 20

    demo_types = set(r["anomaly_type"] for r in demo)
    print(f"Demo subset anomaly types: {sorted(list(demo_types))}")

    print("\n" + "=" * 65)
    print("ALL E-COMMERCE DATASET CRITERIA VERIFIED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    validate_ecommerce()
