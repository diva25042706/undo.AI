// ============================================================================
// UNDO.AI — CHENNAI SYNTHETIC WORKFLOW DATASET GENERATOR
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// "SYNTHETIC CHENNAI WORKFLOW DATA"
// ============================================================================

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('data');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 36 Real Chennai Areas
export const CHENNAI_AREAS = [
  'T. Nagar', 'Nungambakkam', 'Anna Nagar', 'Adyar', 'Mylapore',
  'Velachery', 'Guindy', 'Saidapet', 'Besant Nagar', 'Thiruvanmiyur',
  'Perungudi', 'Thoraipakkam', 'Sholinganallur', 'OMR', 'Porur',
  'Koyambedu', 'Ambattur', 'Avadi', 'Mogappair', 'Poonamallee',
  'Madhuravoyal', 'Tambaram', 'Chromepet', 'Pallavaram', 'Perambur',
  'Kilpauk', 'Egmore', 'Royapettah', 'Triplicane', 'Madhavaram',
  'Kolathur', 'Pallikaranai', 'Medavakkam', 'Navalur', 'Siruseri',
  'Kelambakkam'
];

// Fictional Synthetic Customer Names
export const SYNTHETIC_CUSTOMERS = [
  'Arun Kumar', 'Kavin Raj', 'Priya Anand', 'Divya Krishnan',
  'Sanjay Rao', 'Nithya Kumar', 'Rahul Varma', 'Meena Raj',
  'Karthik Sundaram', 'Ananya Balaji', 'Vignesh Natarajan', 'Deepa Venkat',
  'Suresh Ranganathan', 'Lavanya Sridhar', 'Gautham Chandrasekar', 'Swetha Subramanian',
  'Manoj Parthasarathy', 'Harini Raghavan', 'Ashok Narayanan', 'Keerthana Murali',
  'Pradeep Venkatesh', 'Janani Ramesh', 'Dinesh Mohan', 'Abirami Kalyan',
  'Surya Prakash', 'Bhavani Shankar', 'Vijay Anand', 'Sneha Radhakrishnan'
];

// Synthetic Businesses by Domain (Marked as SYNTHETIC DEMO ENTITY)
export const SYNTHETIC_BUSINESSES = {
  hotel_booking: [
    'Chennai Grand Stay (SYNTHETIC DEMO ENTITY)',
    'Marina Comfort Suites (SYNTHETIC DEMO ENTITY)',
    'OMR Business Hotel (SYNTHETIC DEMO ENTITY)',
    'Adyar Residency (SYNTHETIC DEMO ENTITY)',
    'Velachery Central Hotel (SYNTHETIC DEMO ENTITY)',
    'T. Nagar Heritage Inn (SYNTHETIC DEMO ENTITY)',
    'Anna Nagar Palms Boutique (SYNTHETIC DEMO ENTITY)',
    'Guindy Tech Park Hotel (SYNTHETIC DEMO ENTITY)'
  ],
  ecommerce_order: [
    'Chennai MegaMart Digital (SYNTHETIC DEMO ENTITY)',
    'Namma Chennai Retail Hub (SYNTHETIC DEMO ENTITY)',
    'OMR SuperStore Online (SYNTHETIC DEMO ENTITY)',
    'Bay View Electronics Chennai (SYNTHETIC DEMO ENTITY)',
    'Coromandel Provisions (SYNTHETIC DEMO ENTITY)'
  ],
  customer_support: [
    'Namma Network Care (SYNTHETIC DEMO ENTITY)',
    'Metro Broadband Support (SYNTHETIC DEMO ENTITY)',
    'Coromandel Cloud CRM (SYNTHETIC DEMO ENTITY)',
    'Southern Tech Helpdesk (SYNTHETIC DEMO ENTITY)'
  ],
  restaurant_reservation: [
    'Marina Spice House (SYNTHETIC DEMO ENTITY)',
    'Adyar Table Bistro (SYNTHETIC DEMO ENTITY)',
    'OMR Kitchen & Grills (SYNTHETIC DEMO ENTITY)',
    'Velachery Bistro & Cafe (SYNTHETIC DEMO ENTITY)',
    'Mylapore Rasam & Curries (SYNTHETIC DEMO ENTITY)',
    'T. Nagar Chettinad Court (SYNTHETIC DEMO ENTITY)',
    'Besant Beach Terrace Diner (SYNTHETIC DEMO ENTITY)'
  ],
  cab_booking: [
    'Chennai MetroRide Fleet (SYNTHETIC DEMO ENTITY)',
    'Coromandel Cabs (SYNTHETIC DEMO ENTITY)',
    'OMR Express Shuttle (SYNTHETIC DEMO ENTITY)',
    'Bay City Taxi Co. (SYNTHETIC DEMO ENTITY)'
  ],
  event_registration: [
    'Chennai Tech Summit 2026 (SYNTHETIC DEMO ENTITY)',
    'Tamil Nadu AI Developers Conference (SYNTHETIC DEMO ENTITY)',
    'Marina Hackathon Expo (SYNTHETIC DEMO ENTITY)',
    'OMR Cloud Innovators Meet (SYNTHETIC DEMO ENTITY)'
  ],
  delivery: [
    'Chennai Express Logistics (SYNTHETIC DEMO ENTITY)',
    'OMR QuickShip Courier (SYNTHETIC DEMO ENTITY)',
    'MetroDrop Chennai (SYNTHETIC DEMO ENTITY)',
    'Southern Parcel Dispatch (SYNTHETIC DEMO ENTITY)'
  ],
  appointment_booking: [
    'Apollo Health Hub Chennai (SYNTHETIC DEMO ENTITY)',
    'MedIndia Diagnostic Clinic (SYNTHETIC DEMO ENTITY)',
    'OMR Wellness Centre (SYNTHETIC DEMO ENTITY)',
    'Adyar Dental & Aesthetics (SYNTHETIC DEMO ENTITY)'
  ]
};

// 8 Full Workflow Definitions
export const WORKFLOW_DEFINITIONS = [
  {
    id: 'hotel_booking',
    name: 'Hotel Booking (Chennai Hospitality)',
    category: 'Hospitality',
    steps: [
      { step: 1, tool: 'hotel_search', action: 'search_hotel', compensation: null, reversible: false, idempotent: true, approval: false, desc: 'Search available hotel room inventory in selected Chennai area.' },
      { step: 2, tool: 'room_selection', action: 'select_room', compensation: null, reversible: false, idempotent: true, approval: false, desc: 'Select room configuration and guest requirements.' },
      { step: 3, tool: 'room_booking', action: 'book_room', compensation: 'cancel_booking', reversible: true, idempotent: true, approval: false, desc: 'Place atomic hold/reservation on room in booking engine.' },
      { step: 4, tool: 'payment_processor', action: 'charge_card', compensation: 'refund_payment', reversible: true, idempotent: true, approval: false, desc: 'Capture payment against synthetic guest card profile.' },
      { step: 5, tool: 'email_service', action: 'email_customer', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Dispatch external SMTP booking confirmation voucher (Irreversible).' }
    ]
  },
  {
    id: 'ecommerce_order',
    name: 'E-Commerce Order Fulfillment',
    category: 'Retail & Logistics',
    steps: [
      { step: 1, tool: 'order_service', action: 'create_order', compensation: 'cancel_order', reversible: true, idempotent: true, approval: false, desc: 'Create database order record with status PENDING.' },
      { step: 2, tool: 'inventory_service', action: 'reserve_inventory', compensation: 'release_inventory', reversible: true, idempotent: true, approval: false, desc: 'Decrement SKU stock count in warehouse.' },
      { step: 3, tool: 'payment_service', action: 'charge_card', compensation: 'refund_payment', reversible: true, idempotent: true, approval: false, desc: 'Execute credit charge via payment gateway.' },
      { step: 4, tool: 'shipment_service', action: 'create_shipment', compensation: 'cancel_shipment', reversible: true, idempotent: true, approval: false, desc: 'Generate carrier airway bill and manifest.' },
      { step: 5, tool: 'notification_service', action: 'email_customer', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Send order dispatched notification to customer (Irreversible).' }
    ]
  },
  {
    id: 'customer_support',
    name: 'Customer Support Escalation',
    category: 'CRM & Operations',
    steps: [
      { step: 1, tool: 'crm_service', action: 'create_ticket', compensation: 'close_ticket', reversible: true, idempotent: true, approval: false, desc: 'Create priority incident ticket in support CRM.' },
      { step: 2, tool: 'routing_service', action: 'assign_agent', compensation: 'unassign_agent', reversible: true, idempotent: true, approval: false, desc: 'Allocate specialist agent to ticket queue.' },
      { step: 3, tool: 'customer_record_service', action: 'update_customer_record', compensation: 'restore_customer_record', reversible: true, idempotent: true, approval: false, desc: 'Upgrade customer SLA tier in CRM.' },
      { step: 4, tool: 'resolution_service', action: 'create_resolution', compensation: 'revert_resolution', reversible: true, idempotent: true, approval: false, desc: 'Log resolution plan and issue service credit.' },
      { step: 5, tool: 'notification_service', action: 'email_customer', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Email resolution summary to customer (Irreversible).' }
    ]
  },
  {
    id: 'restaurant_reservation',
    name: 'Restaurant Table Reservation',
    category: 'Food & Dining',
    steps: [
      { step: 1, tool: 'dining_search', action: 'find_restaurant', compensation: null, reversible: false, idempotent: true, approval: false, desc: 'Search table availability at Chennai restaurant.' },
      { step: 2, tool: 'table_booking', action: 'reserve_table', compensation: 'release_table', reversible: true, idempotent: true, approval: false, desc: 'Hold dining table for requested party size.' },
      { step: 3, tool: 'deposit_service', action: 'charge_deposit', compensation: 'refund_deposit', reversible: true, idempotent: true, approval: false, desc: 'Capture cover deposit charge.' },
      { step: 4, tool: 'reservation_service', action: 'create_reservation', compensation: 'cancel_reservation', reversible: true, idempotent: true, approval: false, desc: 'Commit reservation record to host POS.' },
      { step: 5, tool: 'messaging_service', action: 'send_confirmation', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Send SMS/WhatsApp table confirmation (Irreversible).' }
    ]
  },
  {
    id: 'cab_booking',
    name: 'Cab / Ride Booking',
    category: 'Urban Mobility',
    steps: [
      { step: 1, tool: 'ride_dispatcher', action: 'request_ride', compensation: null, reversible: false, idempotent: true, approval: false, desc: 'Locate nearby driver in Chennai zone.' },
      { step: 2, tool: 'driver_assignment', action: 'assign_driver', compensation: 'release_driver', reversible: true, idempotent: true, approval: false, desc: 'Lock and allocate specific driver to trip.' },
      { step: 3, tool: 'trip_service', action: 'confirm_ride', compensation: 'cancel_ride', reversible: true, idempotent: true, approval: false, desc: 'Generate trip dispatch token.' },
      { step: 4, tool: 'fare_service', action: 'charge_payment', compensation: 'refund_payment', reversible: true, idempotent: true, approval: false, desc: 'Hold upfront estimated ride fare.' },
      { step: 5, tool: 'comm_service', action: 'send_confirmation', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Push driver ETA & vehicle details to rider (Irreversible).' }
    ]
  },
  {
    id: 'event_registration',
    name: 'Event & Conference Registration',
    category: 'Events & Ticketing',
    steps: [
      { step: 1, tool: 'event_service', action: 'register_participant', compensation: 'cancel_registration', reversible: true, idempotent: true, approval: false, desc: 'Register participant profile for Chennai event.' },
      { step: 2, tool: 'seating_service', action: 'reserve_seat', compensation: 'release_seat', reversible: true, idempotent: true, approval: false, desc: 'Reserve designated auditorium seat.' },
      { step: 3, tool: 'payment_gateway', action: 'process_payment', compensation: 'refund_payment', reversible: true, idempotent: true, approval: false, desc: 'Capture conference registration fee.' },
      { step: 4, tool: 'ticket_generator', action: 'generate_ticket', compensation: 'invalidate_ticket', reversible: true, idempotent: true, approval: false, desc: 'Issue verifiable QR access pass.' },
      { step: 5, tool: 'email_dispatcher', action: 'email_ticket', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Email digital ticket badge and receipt (Irreversible).' }
    ]
  },
  {
    id: 'delivery',
    name: 'Parcel Delivery & Logistics',
    category: 'Logistics',
    steps: [
      { step: 1, tool: 'dispatch_engine', action: 'create_delivery', compensation: 'cancel_delivery', reversible: true, idempotent: true, approval: false, desc: 'Create delivery manifest in logistics hub.' },
      { step: 2, tool: 'courier_service', action: 'assign_driver', compensation: 'unassign_driver', reversible: true, idempotent: true, approval: false, desc: 'Assign local delivery partner to route.' },
      { step: 3, tool: 'fleet_service', action: 'reserve_vehicle', compensation: 'release_vehicle', reversible: true, idempotent: true, approval: false, desc: 'Allocate vehicle cargo slot.' },
      { step: 4, tool: 'sorting_service', action: 'dispatch_package', compensation: 'recall_dispatch', reversible: true, idempotent: true, approval: false, desc: 'Mark parcel as out for delivery.' },
      { step: 5, tool: 'alert_service', action: 'notify_customer', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Send delivery tracking SMS link (Irreversible).' }
    ]
  },
  {
    id: 'appointment_booking',
    name: 'Healthcare & Diagnostic Appointment',
    category: 'Healthcare',
    steps: [
      { step: 1, tool: 'clinic_calendar', action: 'find_slot', compensation: null, reversible: false, idempotent: true, approval: false, desc: 'Check doctor/consultant slot availability.' },
      { step: 2, tool: 'slot_manager', action: 'reserve_slot', compensation: 'release_slot', reversible: true, idempotent: true, approval: false, desc: 'Hold 30-minute consultation slot.' },
      { step: 3, tool: 'billing_service', action: 'process_payment', compensation: 'refund_payment', reversible: true, idempotent: true, approval: false, desc: 'Process consultation consultation fee.' },
      { step: 4, tool: 'emr_service', action: 'create_appointment', compensation: 'cancel_appointment', reversible: true, idempotent: true, approval: false, desc: 'Create appointment record in hospital EMR.' },
      { step: 5, tool: 'sms_service', action: 'send_confirmation', compensation: null, reversible: false, idempotent: true, approval: true, desc: 'Send appointment SMS pass and token (Irreversible).' }
    ]
  }
];

// Fault Types
export const FAULT_TYPES = [
  'NORMAL',
  'STEP_FAILURE',
  'TOOL_FAILURE',
  'TIMEOUT',
  'NETWORK_FAILURE',
  'DUPLICATE_REQUEST',
  'UNKNOWN_STATE',
  'PARTIAL_FAILURE',
  'CRASH',
  'COMPENSATION_FAILURE',
  'IRREVERSIBLE_ACTION',
  'APPROVAL_REQUIRED'
];

export function generateWorkflowRecords(
  wfIndex,
  workflowDef,
  area,
  customerName,
  custIndex,
  faultType,
  faultPos = null,
  crashStep = null
) {
  const workflowId = `WF-CHN-${workflowDef.id.toUpperCase()}-${String(wfIndex).padStart(6, '0')}`;
  const custId = `CUS-CHN-${String(custIndex).padStart(6, '0')}`;
  const phone = `+91-90000-${String(custIndex).padStart(5, '0')}`;
  const email = `customer${String(custIndex).padStart(6, '0')}@example.test`;
  
  const businesses = SYNTHETIC_BUSINESSES[workflowDef.id] || [`Chennai ${workflowDef.name} (SYNTHETIC DEMO ENTITY)`];
  const busName = businesses[wfIndex % businesses.length];
  const busId = `BUS-CHN-${String((wfIndex % 50) + 1).padStart(4, '0')}`;
  const agentId = `AGT-CHN-${workflowDef.id.slice(0, 3).toUpperCase()}-01`;

  const records = [];
  const totalSteps = workflowDef.steps.length;

  let hasFailed = false;
  let isCrashed = false;
  let hasCompFailure = false;

  for (let i = 0; i < totalSteps; i++) {
    const s = workflowDef.steps[i];
    const stepNum = s.step;
    const stepId = `STEP-${String(stepNum).padStart(2, '0')}`;
    const idempotencyKey = `${workflowId}-${stepId}-${s.action}`;
    const checkpointId = `CP-CHN-${workflowId.slice(-6)}-${stepId}`;
    const depIds = i > 0 ? `STEP-${String(i).padStart(2, '0')}` : 'NONE';

    let execStatus = 'COMPLETED';
    let compStatus = 'NONE';
    let recStrategy = 'FORWARD_EXECUTION';
    let humanReq = false;
    let verifStatus = 'PASSED';
    let finalWorld = 'COMMITTED';
    let prev = `State before ${s.action} in ${area}`;
    let exp = `Expected valid ${s.action}`;
    let act = `Committed ${s.action}`;

    if (isCrashed) {
      execStatus = 'SKIPPED_DUE_TO_CRASH';
      compStatus = 'NONE';
      recStrategy = 'RESUME_OR_ROLLBACK_AFTER_CRASH';
      finalWorld = 'PRESERVED_AT_CHECKPOINT';
    } else if (hasFailed) {
      execStatus = 'SKIPPED_DUE_TO_PREVIOUS_FAILURE';
      compStatus = s.compensation ? 'COMPENSATED' : 'SKIPPED';
      recStrategy = 'SAGA_REVERSE_COMPENSATION';
      finalWorld = 'RESTORED';
    } else {
      // Evaluate Fault Injection
      if (faultType === 'NORMAL') {
        execStatus = 'COMPLETED';
        compStatus = s.compensation ? 'STANDBY_REVERSIBLE' : 'COMMITTED_IRREVERSIBLE';
        recStrategy = 'NONE_REQUIRED';
        finalWorld = 'RESTORED_OR_COMMITTED';
      } else if (faultType === 'STEP_FAILURE' || faultType === 'TOOL_FAILURE' || faultType === 'NETWORK_FAILURE' || faultType === 'TIMEOUT') {
        if (faultPos === stepNum) {
          execStatus = 'FAILED';
          hasFailed = true;
          compStatus = 'TRIGGERING_RECOVERY';
          recStrategy = 'SAGA_REVERSE_COMPENSATION';
          act = `Failed at ${s.action}: ${faultType}`;
          verifStatus = 'FAILED_AT_STEP';
          finalWorld = 'RESTORED';
        } else if (stepNum < (faultPos || 99)) {
          execStatus = 'COMPLETED';
          compStatus = s.compensation ? 'COMPENSATED' : 'NOT_APPLICABLE';
          recStrategy = 'REVERSE_COMPENSATE_STEP';
          act = `Originally completed, then reversed during recovery`;
          finalWorld = 'RESTORED';
        }
      } else if (faultType === 'CRASH') {
        if (crashStep === stepNum) {
          execStatus = 'COMPLETED';
          isCrashed = true;
          compStatus = 'CHECKPOINTED';
          recStrategy = 'RESUME_FROM_DURABLE_LOG';
          finalWorld = 'DURABLE_CHECKPOINT_SAVED';
        }
      } else if (faultType === 'DUPLICATE_REQUEST') {
        if (stepNum === 2) {
          execStatus = 'COMPLETED';
          act = `Duplicate request detected via idempotency key: ${idempotencyKey}. Returned cached response with 0 side effects.`;
          recStrategy = 'IDEMPOTENCY_GUARD_PREVENT_DUPLICATE';
          finalWorld = 'RESTORED_OR_COMMITTED';
        }
      } else if (faultType === 'COMPENSATION_FAILURE') {
        if (stepNum === 3) {
          execStatus = 'FAILED';
          hasFailed = true;
          hasCompFailure = true;
        }
        if (stepNum === 2 && hasCompFailure) {
          compStatus = 'COMPENSATION_FAILED';
          humanReq = true;
          recStrategy = 'HUMAN_INTERVENTION_REQUIRED';
          act = `Remote lock conflict during ${s.compensation}: Gateway 504 Timeout`;
          verifStatus = 'PARTIAL_RECOVERY';
          finalWorld = 'PARTIALLY_RECOVERED';
        }
      } else if (faultType === 'APPROVAL_REQUIRED' || faultType === 'IRREVERSIBLE_ACTION') {
        if (s.requires_approval) {
          execStatus = 'AWAITING_HUMAN_APPROVAL';
          humanReq = true;
          recStrategy = 'BLOCK_UNTIL_HUMAN_CONFIRMED';
          act = `Irreversible side effect (${s.action}) paused at checkpoint ${checkpointId}`;
          finalWorld = 'AWAITING_APPROVAL';
        }
      } else if (faultType === 'UNKNOWN_STATE' || faultType === 'PARTIAL_FAILURE') {
        if (faultPos === stepNum) {
          execStatus = 'FAILED';
          hasFailed = true;
          recStrategy = 'QUERY_AUTHORITATIVE_MOCK_WORLD_THEN_COMPENSATE';
          finalWorld = 'RESTORED';
        }
      }
    }

    records.push({
      record_id: `REC-CHN-${String(wfIndex).padStart(6, '0')}-${String(stepNum).padStart(2, '0')}`,
      workflow_id: workflowId,
      workflow_type: workflowDef.id,
      city: 'Chennai',
      area,
      customer_id: custId,
      customer_name: customerName,
      synthetic_phone: phone,
      synthetic_email: email,
      business_id: busId,
      business_name: busName,
      agent_id: agentId,
      step_id: stepId,
      step_number: stepNum,
      total_steps: totalSteps,
      tool_name: s.tool,
      action: s.action,
      compensation_action: s.compensation,
      reversible: s.reversible,
      idempotent: s.idempotent,
      requires_approval: s.approval,
      dependency_ids: depIds,
      idempotency_key: idempotencyKey,
      execution_status: execStatus,
      fault_type: faultType,
      fault_position: faultPos,
      crash_after_step: crashStep,
      checkpoint_id: checkpointId,
      previous_state: prev,
      expected_state: exp,
      actual_state: act,
      compensation_status: compStatus,
      recovery_strategy: recStrategy,
      human_intervention_required: humanReq,
      verification_status: verifStatus,
      final_world_state: finalWorld,
      created_at: new Date(Date.now() - (100000 - wfIndex) * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  return records;
}

// Convert Array of Records to CSV string
export function recordsToCSV(records, includeHeader = true) {
  const headers = Object.keys(records[0] || {});
  const lines = [];

  if (includeHeader) {
    lines.push(headers.join(','));
  }

  for (const r of records) {
    const row = headers.map(h => {
      const val = r[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    });
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

// Generate the exact 20-record Judge Demo dataset requested
export function generateJudgeDemo20() {
  const plan = [
    // 5 NORMAL
    { wfTypeIndex: 0, area: 'T. Nagar', fault: 'NORMAL' },
    { wfTypeIndex: 1, area: 'Velachery', fault: 'NORMAL' },
    { wfTypeIndex: 2, area: 'Anna Nagar', fault: 'NORMAL' },
    { wfTypeIndex: 3, area: 'Mylapore', fault: 'NORMAL' },
    { wfTypeIndex: 4, area: 'Adyar', fault: 'NORMAL' },

    // 3 STEP_FAILURE
    { wfTypeIndex: 0, area: 'OMR', fault: 'STEP_FAILURE', faultPos: 4 },
    { wfTypeIndex: 1, area: 'Guindy', fault: 'STEP_FAILURE', faultPos: 3 },
    { wfTypeIndex: 5, area: 'Nungambakkam', fault: 'STEP_FAILURE', faultPos: 4 },

    // 2 TIMEOUT
    { wfTypeIndex: 6, area: 'Tambaram', fault: 'TIMEOUT', faultPos: 3 },
    { wfTypeIndex: 7, area: 'Besant Nagar', fault: 'TIMEOUT', faultPos: 3 },

    // 2 DUPLICATE_REQUEST
    { wfTypeIndex: 0, area: 'Sholinganallur', fault: 'DUPLICATE_REQUEST' },
    { wfTypeIndex: 1, area: 'Perungudi', fault: 'DUPLICATE_REQUEST' },

    // 2 UNKNOWN_STATE
    { wfTypeIndex: 4, area: 'Koyambedu', fault: 'UNKNOWN_STATE', faultPos: 3 },
    { wfTypeIndex: 7, area: 'Kilpauk', fault: 'UNKNOWN_STATE', faultPos: 2 },

    // 2 CRASH
    { wfTypeIndex: 0, area: 'Thiruvanmiyur', fault: 'CRASH', crashStep: 2 },
    { wfTypeIndex: 2, area: 'Egmore', fault: 'CRASH', crashStep: 3 },

    // 2 COMPENSATION_FAILURE
    { wfTypeIndex: 0, area: 'Royapettah', fault: 'COMPENSATION_FAILURE' },
    { wfTypeIndex: 1, area: 'Porur', fault: 'COMPENSATION_FAILURE' },

    // 1 IRREVERSIBLE_ACTION
    { wfTypeIndex: 0, area: 'Mylapore', fault: 'IRREVERSIBLE_ACTION' },

    // 1 PARTIAL_FAILURE
    { wfTypeIndex: 6, area: 'Siruseri', fault: 'PARTIAL_FAILURE', faultPos: 4 }
  ];

  let allRecords = [];
  plan.forEach((item, idx) => {
    const wfDef = WORKFLOW_DEFINITIONS[item.wfTypeIndex % WORKFLOW_DEFINITIONS.length];
    const cust = SYNTHETIC_CUSTOMERS[idx % SYNTHETIC_CUSTOMERS.length];
    const recs = generateWorkflowRecords(
      idx + 1,
      wfDef,
      item.area,
      cust,
      idx + 1,
      item.fault,
      item.faultPos || null,
      item.crashStep || null
    );
    allRecords = allRecords.concat(recs);
  });

  return allRecords;
}

// Generate the 100-workflow Live Demo dataset
export function generateLiveDemo100() {
  let allRecords = [];
  for (let i = 1; i <= 100; i++) {
    const wfDef = WORKFLOW_DEFINITIONS[(i - 1) % WORKFLOW_DEFINITIONS.length];
    const area = CHENNAI_AREAS[(i - 1) % CHENNAI_AREAS.length];
    const cust = SYNTHETIC_CUSTOMERS[(i - 1) % SYNTHETIC_CUSTOMERS.length];
    const fault = FAULT_TYPES[(i - 1) % FAULT_TYPES.length];
    const faultPos = (i % 4) + 1;
    const crashStep = (i % 3) + 1;

    const recs = generateWorkflowRecords(i, wfDef, area, cust, i, fault, faultPos, crashStep);
    allRecords = allRecords.concat(recs);
  }
  return allRecords;
}

// Main execution script to generate all required datasets
export async function runGeneration() {
  console.log('🚀 Generating Synthetic Chennai Workflow Datasets for UNDO.AI...');

  // 1. Judge Demo 20
  const judgeDemo = generateJudgeDemo20();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'chennai_demo_20.csv'), recordsToCSV(judgeDemo));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'chennai_demo_20.json'), JSON.stringify(judgeDemo, null, 2));
  console.log(`✓ Generated chennai_demo_20.csv and chennai_demo_20.json (${judgeDemo.length} records across 20 workflows)`);

  // 2. Live Demo 100
  const liveDemo = generateLiveDemo100();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'chennai_demo_100.csv'), recordsToCSV(liveDemo));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'chennai_demo_100.json'), JSON.stringify(liveDemo, null, 2));
  console.log(`✓ Generated chennai_demo_100.csv and chennai_demo_100.json (${liveDemo.length} records across 100 workflows)`);

  // 3. Workflow Definitions & Compensation Registry
  fs.writeFileSync(path.join(OUTPUT_DIR, 'workflow_definitions.json'), JSON.stringify(WORKFLOW_DEFINITIONS, null, 2));
  
  const compRegistry = {};
  WORKFLOW_DEFINITIONS.forEach(wf => {
    wf.steps.forEach(st => {
      compRegistry[st.tool] = {
        toolName: st.tool,
        action: st.action,
        compensationAction: st.compensation,
        reversible: st.reversible,
        idempotent: st.idempotent,
        requiresApproval: st.approval,
        workflowCategory: wf.category,
        description: st.desc
      };
    });
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'compensation_registry.json'), JSON.stringify(compRegistry, null, 2));
  console.log('✓ Generated workflow_definitions.json and compensation_registry.json');

  // 4. Fault Injection Matrix
  const faultMatrix = {
    faultTypes: FAULT_TYPES,
    positions: [1, 2, 3, 4, 5],
    crashCheckpoints: ['CRASH_AFTER_STEP_1', 'CRASH_AFTER_STEP_2', 'CRASH_AFTER_STEP_3'],
    recoveryRules: {
      STEP_FAILURE: 'Compensate all preceding reversible steps in exact reverse topological order (N-1 -> 1).',
      TIMEOUT: 'Verify authoritative world state invariants before retrying or compensating.',
      DUPLICATE_REQUEST: 'Lookup durable idempotency key in log. If COMPLETED, return cached response with zero duplicate side effects.',
      UNKNOWN_STATE: 'Query authoritative mocked state store before proceeding.',
      COMPENSATION_FAILURE: 'Attempt safe retry. If remote lock conflict persists, halt and raise HUMAN INTERVENTION REQUIRED.',
      IRREVERSIBLE_ACTION: 'Intercept execution before irreversible step (email/SMS), enforce human authorization dialog.',
      CRASH: 'Read durable persistent log, recover completed checkpoints, resume from step K+1 without re-executing steps 1..K.'
    }
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'fault_injection_matrix.json'), JSON.stringify(faultMatrix, null, 2));
  console.log('✓ Generated fault_injection_matrix.json');

  // 5. Mock World States Specification
  const mockWorldSpec = {
    city: 'Chennai',
    stateSchema: {
      hospitality: { roomStatus: ['AVAILABLE', 'RESERVED'], depositStatus: ['NOT_CHARGED', 'CHARGED', 'REFUNDED'] },
      ecommerce: { orderStatus: ['NOT_CREATED', 'CREATED', 'CANCELLED'], inventoryStock: 'Units Count', shipmentStatus: ['NOT_CREATED', 'LABEL_GENERATED', 'CANCELLED'] },
      crm: { ticketStatus: ['NOT_CREATED', 'OPEN', 'CLOSED_CANCELLED'], agentAssigned: ['UNASSIGNED', 'AGENT_ASSIGNED'], customerTier: ['Standard', 'Enterprise VIP'] },
      dining: { tableStatus: ['AVAILABLE', 'HELD_RESERVED'], depositStatus: ['NOT_CHARGED', 'CHARGED', 'REFUNDED'] },
      mobility: { driverStatus: ['AVAILABLE', 'LOCKED_ASSIGNED'], fareHold: ['NOT_CHARGED', 'HELD', 'REFUNDED'] },
      events: { registrationStatus: ['NOT_REGISTERED', 'REGISTERED', 'CANCELLED'], seatStatus: ['AVAILABLE', 'RESERVED'] },
      logistics: { packageStatus: ['NOT_CREATED', 'DISPATCHED', 'RECALLED_CANCELLED'], vehicleAllocation: ['FREE', 'ALLOCATED'] },
      healthcare: { slotStatus: ['AVAILABLE', 'RESERVED'], appointmentStatus: ['NOT_CREATED', 'BOOKED', 'CANCELLED'] }
    },
    verificationInvariants: [
      'Zero Net Uncompensated Financial Liability',
      'Inventory Restored to Baseline Count on Rollback',
      'Room/Table/Slot Freed to AVAILABLE on Cancellation',
      'Immutable Audit Trail Preserved in Durable Execution Log'
    ]
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'mock_world_states.json'), JSON.stringify(mockWorldSpec, null, 2));
  console.log('✓ Generated mock_world_states.json');

  // 6. Generate Scalability Dataset and Master 100k records CSV
  console.log('⏳ Streaming 100,000 master workflow records to chennai_workflows_100k.csv...');
  const csvStreamPath = path.join(OUTPUT_DIR, 'chennai_workflows_100k.csv');
  const writeStream = fs.createWriteStream(csvStreamPath, { encoding: 'utf8' });

  // Write header
  const sampleRec = generateWorkflowRecords(1, WORKFLOW_DEFINITIONS[0], 'T. Nagar', 'Arun Kumar', 1, 'NORMAL')[0];
  const headers = Object.keys(sampleRec);
  writeStream.write(headers.join(',') + '\n');

  let totalRecordsWritten = 0;
  const targetRecords = 100000;
  let wfCounter = 1;

  while (totalRecordsWritten < targetRecords) {
    const wfDef = WORKFLOW_DEFINITIONS[(wfCounter - 1) % WORKFLOW_DEFINITIONS.length];
    const area = CHENNAI_AREAS[(wfCounter - 1) % CHENNAI_AREAS.length];
    const cust = SYNTHETIC_CUSTOMERS[(wfCounter - 1) % SYNTHETIC_CUSTOMERS.length];
    const fault = FAULT_TYPES[(wfCounter - 1) % FAULT_TYPES.length];
    const faultPos = (wfCounter % 4) + 1;
    const crashStep = (wfCounter % 3) + 1;

    const recs = generateWorkflowRecords(wfCounter, wfDef, area, cust, wfCounter, fault, faultPos, crashStep);
    
    for (const r of recs) {
      if (totalRecordsWritten >= targetRecords) break;
      const row = headers.map(h => {
        const val = r[h];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      writeStream.write(row.join(',') + '\n');
      totalRecordsWritten++;
    }
    wfCounter++;
  }

  writeStream.end();
  console.log(`✓ Successfully generated ${csvStreamPath} with ${totalRecordsWritten.toLocaleString()} synthetic records across ${wfCounter.toLocaleString()} Chennai workflows.`);

  // 7. README.md
  const readmeContent = `# SYNTHETIC CHENNAI WORKFLOW DATA
### UNDO.AI — Buildathon 2026 AG02: The Agent With An Undo Button

> **Dataset Declaration:**  
> This dataset is **100% synthetic**. Real Chennai geographic areas (e.g. T. Nagar, Velachery, Anna Nagar, Mylapore, OMR, etc.) are used solely as realistic context. All customer names, phone numbers, emails, business entities, accounts, and identifiers are **purely fictional synthetic demo entities**.

---

## 📦 Files in this Dataset

| Filename | Description | Records / Rows |
| :--- | :--- | :--- |
| **\`chennai_demo_20.csv\`** | 20 canonical judge-demo workflows (5 Normal, 3 Step Fail, 2 Timeout, 2 Duplicate, 2 Unknown, 2 Crash, 2 Comp Fail, 1 Irreversible, 1 Partial Fail) | 100 step records |
| **\`chennai_demo_100.csv\`** | 100 live demo workflows across all 36 Chennai areas | 500 step records |
| **\`chennai_workflows_100k.csv\`** | Master scalability benchmark dataset | **100,000 master step records** |
| **\`workflow_definitions.json\`** | Machine-readable specifications for all 8 Chennai multi-step workflows | 8 Workflows, 40 Steps |
| **\`compensation_registry.json\`** | Machine-readable compensation contracts (Action, Compensation, Reversibility, Idempotency, Approval Guard) | 40 Tool Contracts |
| **\`fault_injection_matrix.json\`** | Fault classification rules, timeout policies, idempotency rules, and recovery DAG strategies | 12 Fault Types |
| **\`mock_world_states.json\`** | Multi-domain invariant definitions, baseline state maps, and verification rules | 8 Domain Worlds |

---

## 🏛️ Chennai Workflow Domains (8 Workflows)

1. **Hotel Booking (Chennai Hospitality)** — \`search_hotel\` ➔ \`select_room\` ➔ \`book_room\` ➔ \`charge_card\` ➔ \`email_customer\`
2. **E-Commerce Order Fulfillment** — \`create_order\` ➔ \`reserve_inventory\` ➔ \`charge_card\` ➔ \`create_shipment\` ➔ \`email_customer\`
3. **Customer Support Escalation** — \`create_ticket\` ➔ \`assign_agent\` ➔ \`update_customer_record\` ➔ \`create_resolution\` ➔ \`email_customer\`
4. **Restaurant Table Reservation** — \`find_restaurant\` ➔ \`reserve_table\` ➔ \`charge_deposit\` ➔ \`create_reservation\` ➔ \`send_confirmation\`
5. **Cab / Ride Booking** — \`request_ride\` ➔ \`assign_driver\` ➔ \`confirm_ride\` ➔ \`charge_payment\` ➔ \`send_confirmation\`
6. **Event & Conference Registration** — \`register_participant\` ➔ \`reserve_seat\` ➔ \`process_payment\` ➔ \`generate_ticket\` ➔ \`email_ticket\`
7. **Parcel Delivery & Logistics** — \`create_delivery\` ➔ \`assign_driver\` ➔ \`reserve_vehicle\` ➔ \`dispatch_package\` ➔ \`notify_customer\`
8. **Healthcare & Diagnostic Appointment** — \`find_slot\` ➔ \`reserve_slot\` ➔ \`process_payment\` ➔ \`create_appointment\` ➔ \`send_confirmation\`

---

## 🛡️ Machine-Readable Schema

Every record contains:
- \`record_id\`, \`workflow_id\`, \`workflow_type\`, \`city\`, \`area\`
- \`customer_id\`, \`customer_name\`, \`synthetic_phone\`, \`synthetic_email\`
- \`business_id\`, \`business_name\`, \`agent_id\`
- \`step_id\`, \`step_number\`, \`total_steps\`, \`tool_name\`, \`action\`, \`compensation_action\`
- \`reversible\`, \`idempotent\`, \`requires_approval\`, \`dependency_ids\`, \`idempotency_key\`
- \`execution_status\`, \`fault_type\`, \`fault_position\`, \`crash_after_step\`
- \`checkpoint_id\`, \`previous_state\`, \`expected_state\`, \`actual_state\`
- \`compensation_status\`, \`recovery_strategy\`, \`human_intervention_required\`
- \`verification_status\`, \`final_world_state\`, \`created_at\`, \`updated_at\`

---

## 🎯 Verification Guarantee

\`\`\`
PLAN ➔ ORDER ➔ CHECKPOINT ➔ EXECUTE ➔ LOG ➔ FAULT ➔ SAGA COMPENSATE ➔ VERIFY ➔ WORLD RESTORED ✓
\`\`\`

**UNDO.AI: "AI That Acts. You Stay In Control."**
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent);
  console.log('✓ Generated data/README.md');

  console.log('🎉 ALL SYNTHETIC CHENNAI DATASET FILES SUCCESSFULLY CREATED!');
}

runGeneration();
