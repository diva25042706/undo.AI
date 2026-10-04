import csv
import json
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def validate():
    print("=" * 60)
    print("VALIDATING SYNTHETIC BANKING DATASETS")
    print("=" * 60)

    # 1. Validate 10,000 CSV
    with open("data/banking_payments_10000.csv", mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        records_10k = list(reader)

    print(f"Total Records in 10,000 CSV: {len(records_10k)}")
    assert len(records_10k) == 10000, f"Expected 10000, got {len(records_10k)}"

    # Required columns check
    req_cols = [
        "transaction_id", "customer_id", "customer_name", "phone_number",
        "source_account", "beneficiary_id", "beneficiary_name", "beneficiary_phone",
        "destination_account", "amount", "currency", "payment_type",
        "transaction_status", "created_at", "expected_recipient", "expected_amount",
        "expected_account", "actual_recipient", "actual_amount", "actual_account",
        "risk_score", "verification_status", "anomaly_type", "recovery_strategy",
        "checkpoint_id", "batch_id"
    ]
    for col in req_cols:
        assert col in records_10k[0], f"Missing column {col}"
    print(f"All {len(req_cols)} required columns present.")

    # Anomaly counts
    anomaly_counts = {}
    for r in records_10k:
        a = r["anomaly_type"]
        anomaly_counts[a] = anomaly_counts.get(a, 0) + 1

    print("\nAnomaly Distribution in 10k CSV:")
    for k, v in anomaly_counts.items():
        print(f"  * {k}: {v} ({v/100:.1f}%)")

    assert anomaly_counts["NONE"] == 9200
    assert anomaly_counts["WRONG_RECIPIENT"] == 200
    assert anomaly_counts["WRONG_ACCOUNT"] == 200
    assert anomaly_counts["WRONG_AMOUNT"] == 100
    assert anomaly_counts["DUPLICATE_PAYMENT"] == 100
    assert anomaly_counts["PAYMENT_TIMEOUT"] == 100
    assert anomaly_counts["UNKNOWN_STATE"] == 100

    # 2. Validate Metadata JSON
    with open("data/banking_dataset_metadata.json", mode="r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["total_records"] == 10000
    assert meta["normal_records"] == 9200
    assert meta["anomaly_records"] == 800
    assert meta["total_batches"] == 40
    print("\nMetadata JSON verified successfully.")

    # 3. Validate Demo Subset (20 records)
    with open("data/banking_demo_subset.csv", mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        records_20 = list(reader)

    print(f"\nTotal Records in Demo Subset: {len(records_20)}")
    assert len(records_20) == 20, f"Expected 20, got {len(records_20)}"

    subset_anomalies = {}
    subset_strategies = {}
    for r in records_20:
        a = r["anomaly_type"]
        s = r["recovery_strategy"]
        subset_anomalies[a] = subset_anomalies.get(a, 0) + 1
        subset_strategies[s] = subset_strategies.get(s, 0) + 1

    print("Demo Subset Anomaly Breakdown:")
    for k, v in subset_anomalies.items():
        print(f"  * {k}: {v}")

    assert subset_anomalies.get("NONE", 0) == 10
    assert subset_anomalies.get("WRONG_RECIPIENT", 0) >= 3
    assert subset_anomalies.get("WRONG_ACCOUNT", 0) == 2
    assert subset_anomalies.get("WRONG_AMOUNT", 0) == 2
    assert subset_anomalies.get("DUPLICATE_PAYMENT", 0) == 1
    assert subset_anomalies.get("PAYMENT_TIMEOUT", 0) == 1
    assert subset_strategies.get("HUMAN_ESCALATION", 0) >= 1

    print("\n" + "=" * 60)
    print("ALL VALIDATION CRITERIA MET WITH 100% ACCURACY!")
    print("=" * 60)

if __name__ == "__main__":
    validate()
