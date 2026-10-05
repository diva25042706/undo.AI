# SYNTHETIC CHENNAI WORKFLOW DATA
### UNDO.AI — Buildathon 2026 AG02: The Agent With An Undo Button

> **Dataset Declaration:**  
> This dataset is **100% synthetic**. Real Chennai geographic areas (e.g. T. Nagar, Velachery, Anna Nagar, Mylapore, OMR, etc.) are used solely as realistic context. All customer names, phone numbers, emails, business entities, accounts, and identifiers are **purely fictional synthetic demo entities**.

---

## 📦 Files in this Dataset

| Filename | Description | Records / Rows |
| :--- | :--- | :--- |
| **`chennai_demo_20.csv`** | 20 canonical judge-demo workflows (5 Normal, 3 Step Fail, 2 Timeout, 2 Duplicate, 2 Unknown, 2 Crash, 2 Comp Fail, 1 Irreversible, 1 Partial Fail) | 100 step records |
| **`chennai_demo_100.csv`** | 100 live demo workflows across all 36 Chennai areas | 500 step records |
| **`chennai_workflows_100k.csv`** | Master scalability benchmark dataset | **100,000 master step records** |
| **`workflow_definitions.json`** | Machine-readable specifications for all 8 Chennai multi-step workflows | 8 Workflows, 40 Steps |
| **`compensation_registry.json`** | Machine-readable compensation contracts (Action, Compensation, Reversibility, Idempotency, Approval Guard) | 40 Tool Contracts |
| **`fault_injection_matrix.json`** | Fault classification rules, timeout policies, idempotency rules, and recovery DAG strategies | 12 Fault Types |
| **`mock_world_states.json`** | Multi-domain invariant definitions, baseline state maps, and verification rules | 8 Domain Worlds |

---

## 🏛️ Chennai Workflow Domains (8 Workflows)

1. **Hotel Booking (Chennai Hospitality)** — `search_hotel` ➔ `select_room` ➔ `book_room` ➔ `charge_card` ➔ `email_customer`
2. **E-Commerce Order Fulfillment** — `create_order` ➔ `reserve_inventory` ➔ `charge_card` ➔ `create_shipment` ➔ `email_customer`
3. **Customer Support Escalation** — `create_ticket` ➔ `assign_agent` ➔ `update_customer_record` ➔ `create_resolution` ➔ `email_customer`
4. **Restaurant Table Reservation** — `find_restaurant` ➔ `reserve_table` ➔ `charge_deposit` ➔ `create_reservation` ➔ `send_confirmation`
5. **Cab / Ride Booking** — `request_ride` ➔ `assign_driver` ➔ `confirm_ride` ➔ `charge_payment` ➔ `send_confirmation`
6. **Event & Conference Registration** — `register_participant` ➔ `reserve_seat` ➔ `process_payment` ➔ `generate_ticket` ➔ `email_ticket`
7. **Parcel Delivery & Logistics** — `create_delivery` ➔ `assign_driver` ➔ `reserve_vehicle` ➔ `dispatch_package` ➔ `notify_customer`
8. **Healthcare & Diagnostic Appointment** — `find_slot` ➔ `reserve_slot` ➔ `process_payment` ➔ `create_appointment` ➔ `send_confirmation`

---

## 🛡️ Machine-Readable Schema

Every record contains:
- `record_id`, `workflow_id`, `workflow_type`, `city`, `area`
- `customer_id`, `customer_name`, `synthetic_phone`, `synthetic_email`
- `business_id`, `business_name`, `agent_id`
- `step_id`, `step_number`, `total_steps`, `tool_name`, `action`, `compensation_action`
- `reversible`, `idempotent`, `requires_approval`, `dependency_ids`, `idempotency_key`
- `execution_status`, `fault_type`, `fault_position`, `crash_after_step`
- `checkpoint_id`, `previous_state`, `expected_state`, `actual_state`
- `compensation_status`, `recovery_strategy`, `human_intervention_required`
- `verification_status`, `final_world_state`, `created_at`, `updated_at`

---

## 🎯 Verification Guarantee

```
PLAN ➔ ORDER ➔ CHECKPOINT ➔ EXECUTE ➔ LOG ➔ FAULT ➔ SAGA COMPENSATE ➔ VERIFY ➔ WORLD RESTORED ✓
```

**UNDO.AI: "AI That Acts. You Stay In Control."**
