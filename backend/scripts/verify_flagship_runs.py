import json
import sys
import urllib.request

# Ensure UTF-8 output encoding on Windows console
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def run_five_demos():
    url = "http://127.0.0.1:8000/api/v1/payment/demo/run-flagship"
    print("=" * 75)
    print("UNDO.AI - REAL-TIME PAYMENT GUARDIAN 5-RUN DETERMINISTIC VALIDATION")
    print("Scenario: ₹10,000 to Sam -> Injected Fault (Rakesh) -> Verifier Catch -> Automatic Cancel -> Balance Restored (₹100,000)")
    print("=" * 75)

    for run_idx in range(1, 6):
        req = urllib.request.Request(url, data=b"", headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))["data"]

        tx_id = data["step_5_transaction_initiated"]["transaction_id"]
        cp_id = data["step_4_checkpoint_id"]
        intended_recp = data["step_2_expected_state"]["recipient"]
        injected_fault = data["step_6_fault_injected"]
        actual_recp = data["step_5_transaction_initiated"]["recipient_name"]
        mismatch = data["step_7_verifier_result"]["mismatch_type"]
        is_valid = data["step_7_verifier_result"]["is_valid"]
        strategy = data["step_8_recovery_plan"]["strategy"]
        final_status = data["final_status"]
        final_bal = data["final_sender_balance"]
        post_verif = data["step_10_post_recovery_verification"]["is_valid"]

        print(f"\n[RUN #{run_idx}]")
        print(f"  * Step 1-2 Intent & Contract: Pay ₹10,000 to {intended_recp}")
        print(f"  * Step 3 Risk Analysis:       Score = {data['step_3_risk_score']}/100 (CRITICAL)")
        print(f"  * Step 4 Checkpoint Created:  {cp_id} (Captured Balance: ₹100,000.00)")
        print(f"  * Step 5-6 Tx Executed:       {tx_id} | Injected Fault: {injected_fault} (Actual: {actual_recp})")
        print(f"  * Step 7 Verifier Triggered:  Valid={is_valid} | Mismatch={mismatch}")
        print(f"  * Step 8 Recovery Engine:     Recommended Strategy={strategy} (Reason: {data['step_8_recovery_plan']['reason']})")
        print(f"  * Step 9 Recovery Execution:  Action={data['step_9_recovery_execution'].get('action', 'CANCEL')} -> {data['step_9_recovery_execution'].get('message')}")
        print(f"  * Step 10 Final Post-Check:   Restoration Valid={post_verif} | Final Sender Balance: ₹{final_bal:,.2f} | Status: {final_status}")

        assert mismatch == "DESTINATION_MISMATCH", f"Run {run_idx} failed mismatch test: {mismatch}"
        assert strategy == "CANCEL", f"Run {run_idx} failed strategy test: {strategy}"
        assert final_bal == 100000.0, f"Run {run_idx} failed balance check: {final_bal}"
        assert post_verif is True, f"Run {run_idx} post-recovery verification failed"

    print("\n" + "=" * 75)
    print("ALL 5 RUNS COMPLETED SUCCESSFULLY WITH 100% DETERMINISTIC RESTORATION!")
    print("=" * 75)

if __name__ == "__main__":
    run_five_demos()
