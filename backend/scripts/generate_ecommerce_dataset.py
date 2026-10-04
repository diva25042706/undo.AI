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

PRODUCTS = [
    {"id": "PROD_4001", "name": "Wireless Noise Cancelling Headphones", "price": 4999.0},
    {"id": "PROD_4002", "name": "Smart Fitness Tracker Watch", "price": 2499.0},
    {"id": "PROD_4003", "name": "Mechanical Gaming Keyboard RGB", "price": 3499.0},
    {"id": "PROD_4004", "name": "Ergonomic Aluminium Laptop Stand", "price": 1299.0},
    {"id": "PROD_4005", "name": "4K Ultra HD Streaming Dongle", "price": 3999.0},
    {"id": "PROD_4006", "name": "Fast Wireless Charging Pad 30W", "price": 899.0},
    {"id": "PROD_4007", "name": "Smart Home IoT Security Camera", "price": 2799.0},
    {"id": "PROD_4008", "name": "Noise Isolating Studio Earbuds", "price": 1499.0},
    {"id": "PROD_4009", "name": "Portable SSD 1TB USB 3.2", "price": 6999.0},
    {"id": "PROD_4010", "name": "Organic Cotton Premium Hoodie", "price": 1999.0}
]

MERCHANTS = ["MER_ECOM_101", "MER_ECOM_102", "MER_ECOM_103", "MER_ECOM_104", "MER_ECOM_105"]

def generate_ecommerce_dataset():
    total_records = 10000

    # Target distribution:
    # 92% NORMAL = 9200
    # 2% WRONG_AMOUNT = 200
    # 1.5% DUPLICATE_ORDER = 150
    # 1.5% WRONG_REFUND = 150
    # 1% WRONG_CUSTOMER = 100
    # 1% CANCEL_FAILURE = 100
    # 1% UNKNOWN_STATE = 100
    # Total = 10000
    anomaly_plan = (
        ["NORMAL"] * 9200 +
        ["WRONG_AMOUNT"] * 200 +
        ["DUPLICATE_ORDER"] * 150 +
        ["WRONG_REFUND"] * 150 +
        ["WRONG_CUSTOMER"] * 100 +
        ["CANCEL_FAILURE"] * 100 +
        ["UNKNOWN_STATE"] * 100
    )
    random.shuffle(anomaly_plan)

    base_time = datetime(2026, 3, 1, 6, 0, 0, tzinfo=timezone.utc)
    records = []
    recent_records = []

    for i in range(total_records):
        idx = i + 1
        order_id = f"ORD_ECOM_{idx:08d}"
        cust_id = f"CUS_ECOM_{random.randint(100001, 109999)}"
        cust_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        cust_phone = f"+91-90000{random.randint(10000, 99999)}"

        prod_obj = random.choice(PRODUCTS)
        prod_id = prod_obj["id"]
        prod_name = prod_obj["name"]
        unit_price = prod_obj["price"]
        quantity = random.choices([1, 2, 3, 4], weights=[0.65, 0.20, 0.10, 0.05])[0]
        total_amount = unit_price * quantity
        payment_id = f"PAY_ECOM_{idx:08d}"
        merchant_id = random.choice(MERCHANTS)
        checkpoint_id = f"CP-ECOM-{idx:06d}"
        created_at = (base_time + timedelta(seconds=i * 22)).isoformat()

        anomaly_type = anomaly_plan[i]

        expected_payment = total_amount
        actual_payment = total_amount
        expected_order_status = "PAID"
        actual_order_status = "PAID"
        expected_refund_amount = 0.0
        actual_refund_amount = 0.0
        transaction_status = "COMPLETED"
        verification_status = "VERIFIED"
        anomaly_val = "NONE"
        recovery_strategy = "NONE"
        risk_score = random.randint(10, 35)

        if anomaly_type == "NORMAL":
            # Normal order distribution
            r = random.random()
            if r < 0.50:
                expected_order_status = "DELIVERED"
                actual_order_status = "DELIVERED"
            elif r < 0.75:
                expected_order_status = "SHIPPED"
                actual_order_status = "SHIPPED"
            elif r < 0.90:
                expected_order_status = "PROCESSING"
                actual_order_status = "PROCESSING"
            else:
                expected_order_status = "PAID"
                actual_order_status = "PAID"

        elif anomaly_type == "WRONG_AMOUNT":
            diff = random.choice([500.0, 1000.0, 2000.0, 5000.0])
            actual_payment = expected_payment + diff
            verification_status = "FAILED"
            anomaly_val = "WRONG_AMOUNT"
            risk_score = random.randint(82, 95)

            if random.random() < 0.60:
                transaction_status = "PENDING"
                actual_order_status = "PROCESSING"
                recovery_strategy = "CANCEL"
            else:
                transaction_status = "COMPLETED"
                actual_order_status = "PAID"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "DUPLICATE_ORDER":
            if recent_records:
                ref = random.choice(recent_records[-15:])
                cust_id = ref["customer_id"]
                cust_name = ref["customer_name"]
                cust_phone = ref["customer_phone"]
                prod_id = ref["product_id"]
                prod_name = ref["product_name"]
                unit_price = float(ref["unit_price"])
                quantity = int(ref["quantity"])
                total_amount = float(ref["total_amount"])
                expected_payment = total_amount
                actual_payment = total_amount

            verification_status = "FAILED"
            anomaly_val = "DUPLICATE_ORDER"
            risk_score = random.randint(85, 96)

            if random.random() < 0.60:
                transaction_status = "PENDING"
                actual_order_status = "PROCESSING"
                recovery_strategy = "CANCEL_DUPLICATE"
            else:
                transaction_status = "COMPLETED"
                actual_order_status = "PAID"
                recovery_strategy = "COMPENSATE"

        elif anomaly_type == "WRONG_REFUND":
            expected_refund_amount = total_amount
            # Under-refunded or mismatch
            actual_refund_amount = max(100.0, round(total_amount * 0.4, 2))
            expected_order_status = "REFUNDED"
            actual_order_status = "REFUND_PENDING"
            transaction_status = "REFUNDED"
            verification_status = "FAILED"
            anomaly_val = "WRONG_REFUND"
            risk_score = random.randint(80, 92)
            recovery_strategy = "COMPENSATE"

        elif anomaly_type == "WRONG_CUSTOMER":
            # Associated with wrong customer
            wrong_cust_id = f"CUS_ECOM_{random.randint(990001, 999999)}"
            cust_id = wrong_cust_id
            verification_status = "FAILED"
            anomaly_val = "WRONG_CUSTOMER"
            risk_score = random.randint(86, 97)

            if random.random() < 0.60:
                transaction_status = "PENDING"
                recovery_strategy = "CANCEL"
            else:
                transaction_status = "COMPLETED"
                recovery_strategy = "HUMAN_ESCALATION"

        elif anomaly_type == "CANCEL_FAILURE":
            expected_order_status = "CANCELLED"
            actual_order_status = "PROCESSING"  # Failure to cancel
            transaction_status = "PROCESSING"
            verification_status = "FAILED"
            anomaly_val = "CANCEL_FAILURE"
            risk_score = random.randint(88, 98)
            recovery_strategy = "HUMAN_ESCALATION"

        elif anomaly_type == "UNKNOWN_STATE":
            expected_order_status = "PAID"
            actual_order_status = "UNKNOWN"
            transaction_status = "UNKNOWN"
            verification_status = "FAILED"
            anomaly_val = "UNKNOWN_STATE"
            risk_score = random.randint(75, 90)
            recovery_strategy = "VERIFY_BEFORE_RETRY"

        row = {
            "order_id": order_id,
            "customer_id": cust_id,
            "customer_name": cust_name,
            "customer_phone": cust_phone,
            "product_id": prod_id,
            "product_name": prod_name,
            "quantity": quantity,
            "unit_price": f"{unit_price:.2f}",
            "total_amount": f"{total_amount:.2f}",
            "payment_id": payment_id,
            "expected_payment": f"{expected_payment:.2f}",
            "actual_payment": f"{actual_payment:.2f}",
            "expected_order_status": expected_order_status,
            "actual_order_status": actual_order_status,
            "expected_refund_amount": f"{expected_refund_amount:.2f}",
            "actual_refund_amount": f"{actual_refund_amount:.2f}",
            "merchant_id": merchant_id,
            "transaction_status": transaction_status,
            "risk_score": risk_score,
            "verification_status": verification_status,
            "anomaly_type": anomaly_val,
            "recovery_strategy": recovery_strategy,
            "checkpoint_id": checkpoint_id,
            "created_at": created_at
        }

        records.append(row)
        recent_records.append(row)

    # Write 10k CSV
    csv_path = "data/ecommerce_transactions_10000.csv"
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
        "dataset_name": "UNDO.AI E-commerce Autonomous Order & Settlement Benchmark",
        "scenario": "E-commerce Autonomous Order Agent — Orders, Payments, Cancellations, Refunds & Delivery",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": RANDOM_SEED,
        "total_records": total_records,
        "normal_records": normal_count,
        "anomaly_records": anomaly_total,
        "anomaly_distribution": {
            "NONE (NORMAL)": {"count": anomaly_counts.get("NONE", 0), "percentage": f"{(anomaly_counts.get('NONE', 0)/total_records)*100:.1f}%"},
            "WRONG_AMOUNT": {"count": anomaly_counts.get("WRONG_AMOUNT", 0), "percentage": f"{(anomaly_counts.get('WRONG_AMOUNT', 0)/total_records)*100:.1f}%"},
            "DUPLICATE_ORDER": {"count": anomaly_counts.get("DUPLICATE_ORDER", 0), "percentage": f"{(anomaly_counts.get('DUPLICATE_ORDER', 0)/total_records)*100:.1f}%"},
            "WRONG_REFUND": {"count": anomaly_counts.get("WRONG_REFUND", 0), "percentage": f"{(anomaly_counts.get('WRONG_REFUND', 0)/total_records)*100:.1f}%"},
            "WRONG_CUSTOMER": {"count": anomaly_counts.get("WRONG_CUSTOMER", 0), "percentage": f"{(anomaly_counts.get('WRONG_CUSTOMER', 0)/total_records)*100:.1f}%"},
            "CANCEL_FAILURE": {"count": anomaly_counts.get("CANCEL_FAILURE", 0), "percentage": f"{(anomaly_counts.get('CANCEL_FAILURE', 0)/total_records)*100:.1f}%"},
            "UNKNOWN_STATE": {"count": anomaly_counts.get("UNKNOWN_STATE", 0), "percentage": f"{(anomaly_counts.get('UNKNOWN_STATE', 0)/total_records)*100:.1f}%"}
        },
        "order_states": [
            "CREATED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED",
            "CANCELLED", "REFUND_PENDING", "REFUNDED", "UNKNOWN"
        ],
        "supported_recovery_strategies": [
            "NONE",
            "CANCEL",
            "CANCEL_DUPLICATE",
            "COMPENSATE",
            "VERIFY_BEFORE_RETRY",
            "HUMAN_ESCALATION"
        ],
        "recovery_strategy_distribution": recovery_counts
    }

    meta_path = "data/ecommerce_metadata.json"
    with open(meta_path, mode="w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Generated metadata in {meta_path}")

    # Generate data/ecommerce_demo_subset.csv with 20 records:
    # Covering:
    # 8 Normal
    # 2 Wrong Amount (1 CANCEL, 1 COMPENSATE)
    # 2 Duplicate Order (1 CANCEL_DUPLICATE, 1 COMPENSATE)
    # 2 Wrong Refund (COMPENSATE)
    # 2 Wrong Customer (1 CANCEL, 1 HUMAN_ESCALATION)
    # 2 Cancel Failure (HUMAN_ESCALATION)
    # 2 Unknown State (VERIFY_BEFORE_RETRY)
    demo_records = []
    demo_records.extend([r for r in records if r["anomaly_type"] == "NONE"][:8])
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_AMOUNT"][:2])
    demo_records.extend([r for r in records if r["anomaly_type"] == "DUPLICATE_ORDER"][:2])
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_REFUND"][:2])
    demo_records.extend([r for r in records if r["anomaly_type"] == "WRONG_CUSTOMER"][:2])
    demo_records.extend([r for r in records if r["anomaly_type"] == "CANCEL_FAILURE"][:2])
    demo_records.extend([r for r in records if r["anomaly_type"] == "UNKNOWN_STATE"][:2])

    demo_path = "data/ecommerce_demo_subset.csv"
    with open(demo_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(demo_records)

    print(f"✓ Generated ecommerce demo subset with {len(demo_records)} records in {demo_path}")

if __name__ == "__main__":
    generate_ecommerce_dataset()
