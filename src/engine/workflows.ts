// ============================================================================
// UNDO.AI — PARAMETERIZED SAGA WORKFLOW REGISTRY & INSTANCE GENERATOR
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// "SYNTHETIC CHENNAI WORKFLOW DATA"
// ============================================================================

import { CompensationContract } from './compensationContracts';
import { discoverNearestAvailableHotel } from './chennaiGeo';

export type WorkflowType =
  | 'cab_booking'
  | 'hotel_booking'
  | 'ecommerce_order'
  | 'customer_support'
  | 'restaurant_reservation'
  | 'event_registration'
  | 'delivery'
  | 'appointment_booking';

export interface WorkflowCustomer {
  name: string;
  email: string;
  phone: string;
  address?: string;
  area?: string;
}

export interface WorkflowStepSpec {
  stepNumber: number;
  stepId: string;
  title: string;
  toolName: string;
  contract: CompensationContract;
  params: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
}

export interface WorkflowDefinition {
  id: WorkflowType;
  name: string;
  category: string;
  description: string;
  agentRole: string;
  avatar: string;
  defaultArea: string;
  defaultAmount: number;
  currency: string;
  currencySymbol: string;
  stepsCount: number;
  buildSteps: (params: Record<string, any>, customer: WorkflowCustomer) => WorkflowStepSpec[];
}

export interface WorkflowInstance {
  instanceId: string;
  workflowType: WorkflowType;
  name: string;
  category: string;
  agentRole: string;
  avatar: string;
  customer: WorkflowCustomer;
  parameters: Record<string, any>;
  steps: WorkflowStepSpec[];
  createdAt: string;
}

export const CHENNAI_AREAS: string[] = [
  'Thiruvanmiyur', 'OMR', 'Sholinganallur', 'Nungambakkam', 'Adyar',
  'Velachery', 'Guindy', 'T. Nagar', 'Anna Nagar', 'Mylapore',
  'Besant Nagar', 'Perungudi', 'Thoraipakkam', 'Porur', 'Koyambedu',
  'Tambaram', 'Chromepet', 'Pallavaram', 'Perambur', 'Kilpauk',
  'Egmore', 'Royapettah', 'Triplicane', 'Madhavaram', 'Kolathur',
  'Pallikaranai', 'Medavakkam', 'Navalur', 'Siruseri', 'Kelambakkam',
  'Ambattur', 'Avadi', 'Mogappair', 'Poonamallee', 'Madhuravoyal'
];

// Helper to generate unique hex ID tokens
export function generateUniqueToken(prefix: string): string {
  const hex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${hex}${num}`;
}

// Data-Driven Workflow Definitions Registry
export const WORKFLOW_DEFINITIONS: Record<WorkflowType, WorkflowDefinition> = {
  // 1. Cab / Ride Booking (Urban Mobility)
  cab_booking: {
    id: 'cab_booking',
    name: 'Cab / Ride Booking (Chennai MetroRide)',
    category: 'Urban Mobility',
    description: 'Autonomous ride dispatch: locates driver in OMR zone, locks fleet vehicle, commits ride token, pre-authorizes trip fare, dispatches driver ETA.',
    agentRole: 'Ride Dispatch Agent',
    avatar: '🚕',
    defaultArea: 'Thiruvanmiyur ➔ OMR',
    defaultAmount: 420.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 5,
    buildSteps: (p, c) => [
      {
        stepNumber: 1,
        stepId: 'step_1_request_ride',
        title: `Locate Nearest Cab in ${p.pickup || 'Thiruvanmiyur'}`,
        toolName: 'request_ride',
        contract: {
          toolName: 'request_ride',
          displayName: 'Request Ride',
          action: 'request_ride',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: `Locates available driver fleet near ${p.pickup || 'Thiruvanmiyur'}.`,
          compensationDescription: null,
          sideEffectDescription: 'Read-only fleet search (0 state mutations committed).',
          rollbackStrategy: 'NONE',
        },
        params: { pickup: p.pickup || 'Thiruvanmiyur', drop: p.drop || 'OMR / Sholinganallur', rideId: p.rideId },
        riskLevel: 'low',
        dependencies: [],
      },
      {
        stepNumber: 2,
        stepId: 'step_2_assign_driver',
        title: `Assign Driver (${p.driverName || 'Murugan K'} - ${p.driverId || 'DRV-CHN-1042'})`,
        toolName: 'assign_driver',
        contract: {
          toolName: 'assign_driver',
          displayName: 'Assign Fleet Driver',
          action: 'assign_driver',
          compensationAction: 'release_driver',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'support',
          description: `Locks and allocates driver ${p.driverName || 'Murugan K'} to ride.`,
          compensationDescription: `Releases driver ${p.driverName || 'Murugan K'} back to active dispatch pool.`,
          sideEffectDescription: `Driver allocation: UNASSIGNED ➔ ${p.driverName || 'Murugan K'} (ID: ${p.driverId || 'DRV-CHN-1042'}).`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { driverId: p.driverId || 'DRV-CHN-1042', driverName: p.driverName || 'Murugan K', cabNumber: p.cabNumber || 'TN-09-AX-4491' },
        riskLevel: 'low',
        dependencies: ['step_1_request_ride'],
      },
      {
        stepNumber: 3,
        stepId: 'step_3_reserve_ride',
        title: `Reserve Ride #${p.rideId || 'RIDE-CHN-8841'}`,
        toolName: 'reserve_ride',
        contract: {
          toolName: 'reserve_ride',
          displayName: 'Reserve Ride',
          action: 'reserve_ride',
          compensationAction: 'cancel_ride',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: `Commits trip reservation #${p.rideId || 'RIDE-CHN-8841'} in mobility engine.`,
          compensationDescription: `Cancels trip #${p.rideId || 'RIDE-CHN-8841'} and marks status as CANCELLED.`,
          sideEffectDescription: `Trip status: NOT_RESERVED ➔ CONFIRMED (Token: ${p.rideId || 'RIDE-CHN-8841'}).`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { rideId: p.rideId || 'RIDE-CHN-8841', customer: c.name },
        riskLevel: 'low',
        dependencies: ['step_2_assign_driver'],
      },
      {
        stepNumber: 4,
        stepId: 'step_4_charge_payment',
        title: `Pre-Authorize Fare (₹${Number(p.fare || 420).toFixed(2)})`,
        toolName: 'charge_payment',
        contract: {
          toolName: 'charge_payment',
          displayName: `Charge Payment (₹${Number(p.fare || 420).toFixed(2)})`,
          action: 'charge_payment',
          compensationAction: 'refund_payment',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'payment',
          description: `Pre-authorizes trip fare ₹${Number(p.fare || 420).toFixed(2)} on rider token.`,
          compensationDescription: `Releases fare authorization and issues reverse credit refund of ₹${Number(p.fare || 420).toFixed(2)}.`,
          sideEffectDescription: `Financial ledger: NOT_CHARGED ➔ CHARGED (₹${Number(p.fare || 420).toFixed(2)} - Txn: ${p.paymentId || 'PAY-CAB-4D88'}).`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { amount: Number(p.fare || 420), currency: 'INR', txnId: p.paymentId || 'PAY-CAB-4D88' },
        riskLevel: 'medium',
        dependencies: ['step_3_reserve_ride'],
      },
      {
        stepNumber: 5,
        stepId: 'step_5_send_confirmation',
        title: 'Push Live ETA & OTP to Rider',
        toolName: 'send_confirmation',
        contract: {
          toolName: 'send_confirmation',
          displayName: 'Send Confirmation SMS & Push Alert',
          action: 'send_confirmation',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: true,
          category: 'notification',
          description: `Dispatches live driver ETA and trip OTP to rider inbox/SMS (${c.email}) (Irreversible).`,
          compensationDescription: 'Cannot unsend delivered cellular/email alert.',
          sideEffectDescription: `External notification: NOT_SENT ➔ SENT to ${c.name} (${c.email}).`,
          rollbackStrategy: 'HUMAN_ESCALATION',
        },
        params: { user: c.name, email: c.email, phone: c.phone },
        riskLevel: 'high',
        dependencies: ['step_4_charge_payment'],
      },
    ],
  },

  // 2. Hotel Booking (Hospitality & Travel)
  hotel_booking: {
    id: 'hotel_booking',
    name: 'Hotel Booking (Autonomous Nearest Hotel Discovery)',
    category: 'Hospitality & Travel',
    description: 'Autonomous Chennai hotel discovery: calculates Haversine distances from customer location, filters sold-out properties, auto-selects the nearest available hotel, commits room hold, charges payment, issues booking voucher, and sends confirmation.',
    agentRole: 'Travel Concierge Agent',
    avatar: '🏨',
    defaultArea: 'Nungambakkam, Chennai',
    defaultAmount: 750.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 6,
    buildSteps: (p, c) => {
      const searchArea = p.searchLocation || p.area || p.location || 'Nungambakkam';
      const discovery = discoverNearestAvailableHotel(searchArea);
      const nearest = discovery.selectedNearestHotel;

      const hotelName = p.hotel || p.hotelName || nearest.hotelName;
      const hotelId = p.hotelId || nearest.hotelId;
      const area = nearest.area || searchArea;
      const roomType = p.roomType || nearest.roomType || 'Deluxe Room';
      const roomPrice = typeof p.roomPrice === 'number' ? p.roomPrice : (nearest.price || 750.0);
      const distanceKm = nearest.distanceKm !== undefined ? nearest.distanceKm : 0.85;

      const roomId = p.roomId || generateUniqueToken('ROOM-CHN');
      const bookingId = p.bookingId || generateUniqueToken('HTL-CHN');
      const paymentId = p.paymentId || p.transactionId || generateUniqueToken('PAY-HTL');
      const ticketId = p.ticketId || 'TKT-HTL-20547106';

      return [
        {
          stepNumber: 1,
          stepId: 'step_1_search_hotels',
          title: `Discover Hotels near ${discovery.customerCoord.name} (${discovery.totalFound} found, ${discovery.availableFound} available)`,
          toolName: 'search_hotels',
          contract: {
            toolName: 'search_hotels',
            displayName: 'Spatial Hotel Discovery & Availability Filter',
            action: 'search_hotels',
            compensationAction: null,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            category: 'booking',
            description: `Scans ${discovery.totalFound} Chennai hotels, computes Haversine distances from ${discovery.customerCoord.name}, and filters ${discovery.availableFound} properties with available rooms.`,
            compensationDescription: null,
            sideEffectDescription: `Discovered ${discovery.totalFound} properties (${discovery.availableFound} available, ${discovery.totalFound - discovery.availableFound} sold out). Read-only query (0 side effects).`,
            rollbackStrategy: 'NONE',
          },
          params: {
            searchLocation: discovery.customerCoord.name,
            customerLat: discovery.customerCoord.lat,
            customerLng: discovery.customerCoord.lng,
            totalFound: discovery.totalFound,
            availableFound: discovery.availableFound,
          },
          riskLevel: 'low',
          dependencies: [],
        },
        {
          stepNumber: 2,
          stepId: 'step_2_select_room',
          title: `Auto-Select Nearest Available Hotel: ${hotelName} (${distanceKm} km) — ₹${roomPrice.toLocaleString('en-IN')}`,
          toolName: 'select_room',
          contract: {
            toolName: 'select_room',
            displayName: 'Auto-Select Nearest Available Hotel',
            action: 'select_room',
            compensationAction: null,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            category: 'booking',
            description: `Evaluates sorted distance matrix and selects nearest eligible property (${hotelName}, ${distanceKm} km away in ${area}) with ${roomType}.`,
            compensationDescription: null,
            sideEffectDescription: `Hotel allocated: ${hotelName} [${hotelId}] • Room: ${roomType} (${roomId}) • Tariff: ₹${roomPrice.toLocaleString('en-IN')}.`,
            rollbackStrategy: 'NONE',
          },
          params: { hotelId, hotelName, area, distanceKm, roomType, roomId, roomPrice },
          riskLevel: 'low',
          dependencies: ['step_1_search_hotels'],
        },
        {
          stepNumber: 3,
          stepId: 'step_3_reserve_room',
          title: `Book & Reserve Room at ${hotelName} (Hold #${bookingId})`,
          toolName: 'reserve_room',
          contract: {
            toolName: 'reserve_room',
            displayName: `Reserve ${roomType} at ${hotelName}`,
            action: 'reserve_room',
            compensationAction: 'cancel_room_booking',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'booking',
            description: `Places atomic inventory hold on ${roomType} in ${hotelName} reservation ledger.`,
            compensationDescription: `Releases room hold #${bookingId} and restores room availability count (previous + 1).`,
            sideEffectDescription: `Room state: AVAILABLE ➔ RESERVED (Booking ID: ${bookingId}). Available rooms decremented.`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { bookingId, roomId, hotelId, hotelName, roomType, guest: c.name },
          riskLevel: 'medium',
          dependencies: ['step_2_select_room'],
        },
        {
          stepNumber: 4,
          stepId: 'step_4_charge_payment',
          title: `Charge Card (₹${roomPrice.toLocaleString('en-IN')})`,
          toolName: 'charge_payment',
          contract: {
            toolName: 'charge_payment',
            displayName: `Charge Card (₹${roomPrice.toLocaleString('en-IN')})`,
            action: 'charge_payment',
            compensationAction: 'refund_payment',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'payment',
            description: `Captures ₹${roomPrice.toLocaleString('en-IN')} room tariff on guest card token.`,
            compensationDescription: `Issues gateway reverse refund: REFUNDED ₹${roomPrice.toLocaleString('en-IN')}.`,
            sideEffectDescription: `Financial ledger: NOT_CHARGED ➔ CHARGED (₹${roomPrice.toLocaleString('en-IN')} - Txn: ${paymentId}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { amount: roomPrice, currency: 'INR', txnId: paymentId },
          riskLevel: 'medium',
          dependencies: ['step_3_reserve_room'],
        },
        {
          stepNumber: 5,
          stepId: 'step_5_create_ticket',
          title: `Create Booking Ticket (${ticketId})`,
          toolName: 'create_booking_ticket',
          contract: {
            toolName: 'create_booking_ticket',
            displayName: 'Create Booking Voucher Ticket',
            action: 'create_booking_ticket',
            compensationAction: 'cancel_booking_ticket',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'booking',
            description: `Issues official guest reservation voucher #${ticketId} in central hospitality ledger.`,
            compensationDescription: `Voids booking ticket #${ticketId} and updates status to CANCELLED.`,
            sideEffectDescription: `Ticket state: NOT_CREATED ➔ CREATED (Ticket #${ticketId}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { ticketId, bookingId, hotelId, hotelName, guest: c.name },
          riskLevel: 'medium',
          dependencies: ['step_4_charge_payment'],
        },
        {
          stepNumber: 6,
          stepId: 'step_6_email_customer',
          title: `Email Confirmation to ${c.name} (${c.email})`,
          toolName: 'send_booking_confirmation',
          contract: {
            toolName: 'send_booking_confirmation',
            displayName: 'Send Booking Confirmation Email',
            action: 'send_booking_confirmation',
            compensationAction: null,
            reversible: false, // Irreversible external email side effect!
            idempotent: true,
            requiresApproval: true,
            category: 'notification',
            description: `Dispatches verified booking confirmation email with ${hotelName}, ${area}, ${roomType}, ₹${roomPrice.toLocaleString('en-IN')} to ${c.email} via Resend (Irreversible).`,
            compensationDescription: 'Cannot unsend delivered SMTP email transmission.',
            sideEffectDescription: `External email: NOT_SENT ➔ SENT to ${c.name} (${c.email}).`,
            rollbackStrategy: 'HUMAN_ESCALATION',
          },
          params: { user: c.name, email: c.email, hotelName, bookingId, ticketId, amount: roomPrice, area, distanceKm },
          riskLevel: 'high',
          dependencies: ['step_5_create_ticket'],
        },
      ];
    },
  },

  // 3. E-Commerce Order (Retail & Logistics)
  ecommerce_order: {
    id: 'ecommerce_order',
    name: 'E-Commerce Order (Chennai MegaMart)',
    category: 'Retail & Logistics',
    description: 'Fulfills customer purchase: provisions database order, reserves warehouse inventory, captures payment, generates shipment label.',
    agentRole: 'E-Commerce Fulfillment Agent',
    avatar: '📦',
    defaultArea: 'Velachery',
    defaultAmount: 85000.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 6,
    buildSteps: (p, c) => {
      const price = typeof p.price === 'number' ? p.price : 85000.0;
      const orderId = p.orderId || 'ORD-CHN-8821';
      const productId = p.productId || 'PROD-CHN-771';
      const product = p.product || 'AI Development Laptop';
      const trackingNo = p.trackingNo || p.shipmentLabelId || 'LBL-ECOM-8821';
      const paymentId = p.paymentId || 'PAY-ECOM-55A1';

      return [
        {
          stepNumber: 1,
          stepId: 'step_1_validate_product',
          title: `Validate Product & Price (${product} - ₹${price.toLocaleString('en-IN')})`,
          toolName: 'validate_product',
          contract: {
            toolName: 'validate_product',
            displayName: 'Validate Product & Price',
            action: 'validate_product',
            compensationAction: null,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            category: 'system',
            description: `Validates SKU ${productId} and verifies ₹${price.toLocaleString('en-IN')} price catalog (Read-only).`,
            compensationDescription: null,
            sideEffectDescription: 'Read-only catalog query: Product and price validated (0 side effects).',
            rollbackStrategy: 'NONE',
          },
          params: { productId, product, price },
          riskLevel: 'low',
          dependencies: [],
        },
        {
          stepNumber: 2,
          stepId: 'step_2_create_order',
          title: `Create Order #${orderId} (${product})`,
          toolName: 'create_order',
          contract: {
            toolName: 'create_order',
            displayName: 'Create Order Record',
            action: 'create_order',
            compensationAction: 'cancel_order',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'system',
            description: 'Generates new customer order record in database.',
            compensationDescription: 'Marks order status as CANCELLED and voids locks.',
            sideEffectDescription: `Order status: NOT_CREATED ➔ CREATED (Order #${orderId}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { orderId, product, customer: c.name, amount: price },
          riskLevel: 'low',
          dependencies: ['step_1_validate_product'],
        },
        {
          stepNumber: 3,
          stepId: 'step_3_reserve_inventory',
          title: `Reserve Warehouse Stock (SKU: ${productId})`,
          toolName: 'reserve_inventory',
          contract: {
            toolName: 'reserve_inventory',
            displayName: 'Reserve Inventory',
            action: 'reserve_inventory',
            compensationAction: 'release_inventory',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'inventory',
            description: `Decrements warehouse stock for ${productId} (quantity - 1).`,
            compensationDescription: `Increments warehouse stock for ${productId} back to original quantity.`,
            sideEffectDescription: 'Warehouse inventory: stock decremented (AVAILABLE ➔ RESERVED).',
            rollbackStrategy: 'COMPENSATE',
          },
          params: { sku: productId, quantity: p.quantity || 1, warehouse: 'WH-GUINDY', orderId },
          riskLevel: 'low',
          dependencies: ['step_2_create_order'],
        },
        {
          stepNumber: 4,
          stepId: 'step_4_capture_payment',
          title: `Capture Payment (₹${price.toLocaleString('en-IN')})`,
          toolName: 'capture_payment',
          contract: {
            toolName: 'capture_payment',
            displayName: 'Capture Payment',
            action: 'capture_payment',
            compensationAction: 'refund_payment',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'payment',
            description: `Captures ₹${price.toLocaleString('en-IN')} payment gateway charge.`,
            compensationDescription: `Executes reverse settlement gateway refund of ₹${price.toLocaleString('en-IN')}.`,
            sideEffectDescription: `Financial ledger: NOT_CHARGED ➔ CHARGED (₹${price.toLocaleString('en-IN')} - Txn: ${paymentId}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { amount: price, currency: 'INR', txnId: paymentId },
          riskLevel: 'medium',
          dependencies: ['step_3_reserve_inventory'],
        },
        {
          stepNumber: 5,
          stepId: 'step_5_generate_shipment_label',
          title: `Generate Shipment Label (${trackingNo})`,
          toolName: 'generate_shipment_label',
          contract: {
            toolName: 'generate_shipment_label',
            displayName: 'Generate Shipment Label',
            action: 'generate_shipment_label',
            compensationAction: 'void_shipment_label',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'shipment',
            description: 'Creates tracking manifest and registers dispatch label with carrier.',
            compensationDescription: 'Voids shipment airway bill with carrier.',
            sideEffectDescription: `Carrier manifest: NOT_CREATED ➔ LABEL_GENERATED (${trackingNo}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { trackingNo, shipmentLabelId: trackingNo, destination: `${p.deliveryArea || 'Velachery'}, Chennai`, orderId },
          riskLevel: 'medium',
          dependencies: ['step_4_capture_payment'],
        },
        {
          stepNumber: 6,
          stepId: 'step_6_send_order_confirmation',
          title: `Send Order Confirmation to ${c.name} (${c.email})`,
          toolName: 'send_order_confirmation',
          contract: {
            toolName: 'send_order_confirmation',
            displayName: 'Send Order Confirmation',
            action: 'send_order_confirmation',
            compensationAction: null,
            reversible: false,
            idempotent: true,
            requiresApproval: true,
            category: 'notification',
            description: `Sends external order dispatch notification to customer inbox (${c.email}) via Resend (Irreversible).`,
            compensationDescription: 'Cannot unsend delivered SMTP email.',
            sideEffectDescription: `External notification: NOT_SENT ➔ SENT to ${c.name} (${c.email}).`,
            rollbackStrategy: 'HUMAN_ESCALATION',
          },
          params: { user: c.name, email: c.email, orderId, product, amount: price },
          riskLevel: 'high',
          dependencies: ['step_5_generate_shipment_label'],
        },
      ];
    },
  },

  // 4. Customer Support Workflow (CRM & Operations)
  customer_support: {
    id: 'customer_support',
    name: 'Customer Support (Namma Network Care)',
    category: 'CRM & Operations',
    description: 'Urgent incident triage: opens support ticket, assigns specialist, upgrades customer tier, and creates resolution credit.',
    agentRole: 'Customer Operations Lead',
    avatar: '🎧',
    defaultArea: 'Adyar',
    defaultAmount: 500.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 6,
    buildSteps: (p, c) => {
      const credit = typeof p.resolutionCredit === 'number' ? p.resolutionCredit : typeof p.creditAmount === 'number' ? p.creditAmount : 500.0;
      const ticketId = p.ticketId || 'TKT-SUP-5512';
      const agent = p.agent || p.specialist || 'Sarah Jenkins';
      const issue = p.issue || 'Payment transaction failed';
      const priority = p.priority || 'HIGH';

      return [
        {
          stepNumber: 1,
          stepId: 'step_1_search_incident',
          title: `Search Customer / Incident (${c.name} - ${issue})`,
          toolName: 'search_customer_incident',
          contract: {
            toolName: 'search_customer_incident',
            displayName: 'Search Customer / Incident',
            action: 'search_customer_incident',
            compensationAction: null,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            category: 'system',
            description: 'Queries customer CRM history and incident log (Read-only).',
            compensationDescription: null,
            sideEffectDescription: 'Read-only CRM search: Customer record and incident verified (0 side effects).',
            rollbackStrategy: 'NONE',
          },
          params: { customer: c.name, issue, area: p.customerArea || 'Adyar' },
          riskLevel: 'low',
          dependencies: [],
        },
        {
          stepNumber: 2,
          stepId: 'step_2_create_ticket',
          title: `Create Support Ticket #${ticketId}`,
          toolName: 'create_support_ticket',
          contract: {
            toolName: 'create_support_ticket',
            displayName: 'Create Support Ticket',
            action: 'create_support_ticket',
            compensationAction: 'cancel_support_ticket',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'support',
            description: 'Opens priority incident in support CRM.',
            compensationDescription: 'Cancels and voids ticket in CRM system.',
            sideEffectDescription: `Support ticket state: NOT_CREATED ➔ OPEN (Ticket #${ticketId}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { ticketId, priority, issue, customer: c.name },
          riskLevel: 'low',
          dependencies: ['step_1_search_incident'],
        },
        {
          stepNumber: 3,
          stepId: 'step_3_assign_specialist',
          title: `Assign Specialist (${agent})`,
          toolName: 'assign_specialist',
          contract: {
            toolName: 'assign_specialist',
            displayName: 'Assign Specialist',
            action: 'assign_specialist',
            compensationAction: 'release_specialist',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'support',
            description: 'Allocates specialist to support case routing queue.',
            compensationDescription: 'Removes specialist assignment and returns agent to pool.',
            sideEffectDescription: `Specialist state: AVAILABLE ➔ ASSIGNED (${agent}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { agent, ticketId },
          riskLevel: 'low',
          dependencies: ['step_2_create_ticket'],
        },
        {
          stepNumber: 4,
          stepId: 'step_4_upgrade_priority',
          title: `Upgrade Customer Priority (NORMAL ➔ HIGH)`,
          toolName: 'upgrade_customer_priority',
          contract: {
            toolName: 'upgrade_customer_priority',
            displayName: 'Upgrade Customer Priority',
            action: 'upgrade_customer_priority',
            compensationAction: 'restore_customer_priority',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'support',
            description: 'Updates CRM customer SLA priority from NORMAL to HIGH.',
            compensationDescription: 'Restores original customer priority back to NORMAL.',
            sideEffectDescription: 'Customer priority: NORMAL ➔ HIGH.',
            rollbackStrategy: 'COMPENSATE',
          },
          params: { customer: c.name, from: 'NORMAL', to: 'HIGH' },
          riskLevel: 'medium',
          dependencies: ['step_3_assign_specialist'],
        },
        {
          stepNumber: 5,
          stepId: 'step_5_issue_credit',
          title: `Issue Resolution Credit (₹${credit.toFixed(2)})`,
          toolName: 'issue_resolution_credit',
          contract: {
            toolName: 'issue_resolution_credit',
            displayName: 'Issue Resolution Credit',
            action: 'issue_resolution_credit',
            compensationAction: 'revoke_resolution_credit',
            reversible: true,
            idempotent: true,
            requiresApproval: false,
            category: 'payment',
            description: `Issues ₹${credit.toFixed(2)} service resolution credit to customer account.`,
            compensationDescription: 'Revokes resolution credit allocation in ledger.',
            sideEffectDescription: `Resolution credit: NOT_CREATED ➔ ISSUED (₹${credit.toFixed(2)}).`,
            rollbackStrategy: 'COMPENSATE',
          },
          params: { resolutionCredit: credit, creditAmount: credit, currency: 'INR', ticketId },
          riskLevel: 'medium',
          dependencies: ['step_4_upgrade_priority'],
        },
        {
          stepNumber: 6,
          stepId: 'step_6_send_notification',
          title: `Send Customer Notification to ${c.name} (${c.email})`,
          toolName: 'send_support_notification',
          contract: {
            toolName: 'send_support_notification',
            displayName: 'Send Customer Notification',
            action: 'send_support_notification',
            compensationAction: null,
            reversible: false,
            idempotent: true,
            requiresApproval: true,
            category: 'notification',
            description: `Sends support resolution notice to customer inbox (${c.email}) via Resend (Irreversible).`,
            compensationDescription: 'Cannot unsend delivered notification.',
            sideEffectDescription: `Customer notification: NOT_SENT ➔ SENT to ${c.name} (${c.email}).`,
            rollbackStrategy: 'HUMAN_ESCALATION',
          },
          params: { user: c.name, email: c.email, ticketId, creditAmount: credit },
          riskLevel: 'high',
          dependencies: ['step_5_issue_credit'],
        },
      ];
    },
  },

  // 5. Restaurant Reservation
  restaurant_reservation: {
    id: 'restaurant_reservation',
    name: 'Restaurant Reservation (Marina Spice House)',
    category: 'Dining & Hospitality',
    description: 'Finds table availability, holds dining table for party, charges cover deposit, records reservation.',
    agentRole: 'Dining Concierge Agent',
    avatar: '🍽️',
    defaultArea: 'Mylapore',
    defaultAmount: 1000.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 5,
    buildSteps: (p, c) => [
      {
        stepNumber: 1,
        stepId: 'step_1_find_restaurant',
        title: 'Search Table Availability (Marina Spice House)',
        toolName: 'search_hotel',
        contract: {
          toolName: 'search_hotel',
          displayName: 'Search Tables',
          action: 'find_restaurant',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: 'Queries dining capacity in Mylapore.',
          compensationDescription: null,
          sideEffectDescription: 'Found 2 tables available.',
          rollbackStrategy: 'NONE',
        },
        params: { partySize: 4, area: p.area || 'Mylapore' },
        riskLevel: 'low',
        dependencies: [],
      },
      {
        stepNumber: 2,
        stepId: 'step_2_reserve_table',
        title: `Hold Dining Table (Table #${p.tableNo || 14})`,
        toolName: 'reserve_room',
        contract: {
          toolName: 'reserve_room',
          displayName: 'Reserve Table',
          action: 'reserve_table',
          compensationAction: 'cancel_room',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: `Holds table #${p.tableNo || 14} in POS.`,
          compensationDescription: `Releases table #${p.tableNo || 14} back to open pool.`,
          sideEffectDescription: `Table #${p.tableNo || 14} status: AVAILABLE ➔ RESERVED.`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { tableNo: p.tableNo || 14, partySize: 4 },
        riskLevel: 'low',
        dependencies: ['step_1_find_restaurant'],
      },
      {
        stepNumber: 3,
        stepId: 'step_3_charge_deposit',
        title: `Charge Cover Deposit (₹${Number(p.deposit || 1000).toFixed(2)})`,
        toolName: 'charge_payment',
        contract: {
          toolName: 'charge_payment',
          displayName: 'Charge Cover Deposit',
          action: 'charge_payment',
          compensationAction: 'refund_payment',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'payment',
          description: `Charges ₹${Number(p.deposit || 1000).toFixed(2)} table deposit.`,
          compensationDescription: `Refunds ₹${Number(p.deposit || 1000).toFixed(2)} table deposit.`,
          sideEffectDescription: `Deposit charged: ₹${Number(p.deposit || 1000).toFixed(2)}.`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { amount: Number(p.deposit || 1000), currency: 'INR', txnId: p.paymentId || generateUniqueToken('TXN-REST') },
        riskLevel: 'medium',
        dependencies: ['step_2_reserve_table'],
      },
      {
        stepNumber: 4,
        stepId: 'step_4_create_reservation',
        title: `Commit Reservation #${p.resId || 'RES-CHN-3301'}`,
        toolName: 'create_order',
        contract: {
          toolName: 'create_order',
          displayName: 'Create Reservation',
          action: 'create_order',
          compensationAction: 'cancel_order',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'system',
          description: 'Records confirmed dining reservation.',
          compensationDescription: 'Cancels reservation record in POS.',
          sideEffectDescription: 'Reservation committed in POS.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { resId: p.resId || 'RES-CHN-3301', customer: c.name },
        riskLevel: 'low',
        dependencies: ['step_3_charge_deposit'],
      },
      {
        stepNumber: 5,
        stepId: 'step_5_send_confirmation',
        title: 'Send Table Pass & Directions SMS',
        toolName: 'send_confirmation',
        contract: {
          toolName: 'send_confirmation',
          displayName: 'Send Confirmation',
          action: 'send_confirmation',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: true,
          category: 'notification',
          description: 'Sends SMS table pass (Irreversible).',
          compensationDescription: null,
          sideEffectDescription: `SMS sent to ${c.name} (${c.email}).`,
          rollbackStrategy: 'HUMAN_ESCALATION',
        },
        params: { user: c.name, email: c.email, phone: c.phone },
        riskLevel: 'high',
        dependencies: ['step_4_create_reservation'],
      },
    ],
  },

  // 6. Event Registration
  event_registration: {
    id: 'event_registration',
    name: 'Event Registration (Chennai Tech Summit 2026)',
    category: 'Events & Conferences',
    description: 'Registers delegate, reserves auditorium seat, captures conference pass fee, issues verifiable QR badge.',
    agentRole: 'Ticketing Agent',
    avatar: '🎟️',
    defaultArea: 'Guindy',
    defaultAmount: 1500.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 5,
    buildSteps: (p, c) => [
      {
        stepNumber: 1,
        stepId: 'step_1_register',
        title: 'Register Participant Profile',
        toolName: 'create_order',
        contract: {
          toolName: 'create_order',
          displayName: 'Register Participant',
          action: 'create_order',
          compensationAction: 'cancel_order',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'system',
          description: 'Creates participant registration record.',
          compensationDescription: 'Cancels registration record in database.',
          sideEffectDescription: 'Participant registered in attendee roster.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { attendee: c.name, event: 'Chennai Tech Summit 2026' },
        riskLevel: 'low',
        dependencies: [],
      },
      {
        stepNumber: 2,
        stepId: 'step_2_reserve_seat',
        title: `Reserve Auditorium Seat (${p.seat || 'Row C - Seat 18'})`,
        toolName: 'reserve_room',
        contract: {
          toolName: 'reserve_room',
          displayName: 'Reserve Seat',
          action: 'reserve_room',
          compensationAction: 'cancel_room',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: 'Locks seat in ticketing system.',
          compensationDescription: 'Releases seat back to open ticket pool.',
          sideEffectDescription: `Seat ${p.seat || 'C-18'} locked.`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { seat: p.seat || 'C-18' },
        riskLevel: 'low',
        dependencies: ['step_1_register'],
      },
      {
        stepNumber: 3,
        stepId: 'step_3_process_payment',
        title: `Process Delegate Fee (₹${Number(p.fee || 1500).toFixed(2)})`,
        toolName: 'charge_payment',
        contract: {
          toolName: 'charge_payment',
          displayName: 'Process Payment',
          action: 'charge_payment',
          compensationAction: 'refund_payment',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'payment',
          description: 'Captures conference pass fee.',
          compensationDescription: 'Issues reverse credit refund.',
          sideEffectDescription: `Charged ₹${Number(p.fee || 1500).toFixed(2)}.`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { amount: Number(p.fee || 1500), currency: 'INR', txnId: p.paymentId || generateUniqueToken('TXN-EVT') },
        riskLevel: 'medium',
        dependencies: ['step_2_reserve_seat'],
      },
      {
        stepNumber: 4,
        stepId: 'step_4_generate_ticket',
        title: `Generate Verifiable QR Access Pass (${p.passId || 'PASS-CHN-9912'})`,
        toolName: 'create_shipment',
        contract: {
          toolName: 'create_shipment',
          displayName: 'Generate Ticket',
          action: 'create_shipment',
          compensationAction: 'cancel_shipment',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'shipment',
          description: 'Issues cryptographic QR delegate badge.',
          compensationDescription: 'Voids QR ticket in scanner database.',
          sideEffectDescription: 'QR Pass generated.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { passId: p.passId || 'PASS-CHN-9912' },
        riskLevel: 'low',
        dependencies: ['step_3_process_payment'],
      },
      {
        stepNumber: 5,
        stepId: 'step_5_email_ticket',
        title: 'Email Delegate Pass & Schedule',
        toolName: 'send_confirmation',
        contract: {
          toolName: 'send_confirmation',
          displayName: 'Email Ticket',
          action: 'send_confirmation',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: true,
          category: 'notification',
          description: 'Emails digital badge to attendee (Irreversible).',
          compensationDescription: null,
          sideEffectDescription: `Badge emailed to ${c.name} (${c.email}).`,
          rollbackStrategy: 'HUMAN_ESCALATION',
        },
        params: { user: c.name, email: c.email },
        riskLevel: 'high',
        dependencies: ['step_4_generate_ticket'],
      },
    ],
  },

  // 7. Parcel Delivery
  delivery: {
    id: 'delivery',
    name: 'Parcel Delivery (Chennai Express Logistics)',
    category: 'Logistics & Dispatch',
    description: 'Creates delivery manifest, assigns courier driver, reserves vehicle cargo slot, dispatches package, alerts customer.',
    agentRole: 'Logistics Dispatch Agent',
    avatar: '🚚',
    defaultArea: 'Tambaram',
    defaultAmount: 350.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 5,
    buildSteps: (p, c) => [
      {
        stepNumber: 1,
        stepId: 'step_1_create_delivery',
        title: `Create Delivery Manifest #${p.manifestId || 'DEL-CHN-7701'}`,
        toolName: 'create_order',
        contract: {
          toolName: 'create_order',
          displayName: 'Create Delivery',
          action: 'create_order',
          compensationAction: 'cancel_order',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'system',
          description: 'Creates dispatch record in central hub.',
          compensationDescription: 'Cancels delivery dispatch record.',
          sideEffectDescription: 'Delivery record created.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { manifestId: p.manifestId || 'DEL-CHN-7701' },
        riskLevel: 'low',
        dependencies: [],
      },
      {
        stepNumber: 2,
        stepId: 'step_2_assign_driver',
        title: `Assign Local Courier Driver (${p.driver || 'Ravi S'})`,
        toolName: 'assign_driver',
        contract: {
          toolName: 'assign_driver',
          displayName: 'Assign Driver',
          action: 'assign_driver',
          compensationAction: 'release_driver',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'support',
          description: 'Assigns driver to parcel route.',
          compensationDescription: 'Unassigns driver from parcel route.',
          sideEffectDescription: 'Driver allocated.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { driver: p.driver || 'Ravi S' },
        riskLevel: 'low',
        dependencies: ['step_1_create_delivery'],
      },
      {
        stepNumber: 3,
        stepId: 'step_3_reserve_vehicle',
        title: 'Reserve Vehicle Cargo Slot (Van #04)',
        toolName: 'reserve_room',
        contract: {
          toolName: 'reserve_room',
          displayName: 'Reserve Vehicle',
          action: 'reserve_room',
          compensationAction: 'cancel_room',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: 'Locks cargo space in delivery van.',
          compensationDescription: 'Frees cargo space in delivery van.',
          sideEffectDescription: 'Cargo slot reserved.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { vehicle: 'Van #04' },
        riskLevel: 'low',
        dependencies: ['step_2_assign_driver'],
      },
      {
        stepNumber: 4,
        stepId: 'step_4_dispatch_package',
        title: 'Dispatch Package for Out-for-Delivery',
        toolName: 'create_shipment',
        contract: {
          toolName: 'create_shipment',
          displayName: 'Dispatch Package',
          action: 'create_shipment',
          compensationAction: 'cancel_shipment',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'shipment',
          description: 'Marks package as out for delivery.',
          compensationDescription: 'Recalls package back to hub holding bay.',
          sideEffectDescription: 'Package marked out for delivery.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { parcelId: p.parcelId || 'PCL-CHN-552' },
        riskLevel: 'medium',
        dependencies: ['step_3_reserve_vehicle'],
      },
      {
        stepNumber: 5,
        stepId: 'step_5_notify_customer',
        title: 'Send Live GPS Tracker SMS',
        toolName: 'send_confirmation',
        contract: {
          toolName: 'send_confirmation',
          displayName: 'Notify Customer',
          action: 'send_confirmation',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: true,
          category: 'notification',
          description: 'Sends live GPS tracking SMS (Irreversible).',
          compensationDescription: null,
          sideEffectDescription: `Tracking link sent to ${c.name} (${c.email}).`,
          rollbackStrategy: 'HUMAN_ESCALATION',
        },
        params: { user: c.name, email: c.email, phone: c.phone },
        riskLevel: 'high',
        dependencies: ['step_4_dispatch_package'],
      },
    ],
  },

  // 8. Healthcare Appointment Booking
  appointment_booking: {
    id: 'appointment_booking',
    name: 'Healthcare Appointment (Apollo Health Hub)',
    category: 'Healthcare & Clinical',
    description: 'Finds doctor slot, reserves consultation window, processes fee, creates hospital EMR appointment, sends confirmation token.',
    agentRole: 'Medical Concierge Agent',
    avatar: '🩺',
    defaultArea: 'Greams Road',
    defaultAmount: 1000.0,
    currency: 'INR',
    currencySymbol: '₹',
    stepsCount: 5,
    buildSteps: (p, c) => [
      {
        stepNumber: 1,
        stepId: 'step_1_find_slot',
        title: `Check Specialist Availability (${p.doctor || 'Dr. S. Raman'})`,
        toolName: 'search_hotel',
        contract: {
          toolName: 'search_hotel',
          displayName: 'Find Slot',
          action: 'find_slot',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: 'Queries consultation schedule.',
          compensationDescription: null,
          sideEffectDescription: 'Slot found at 11:30 AM.',
          rollbackStrategy: 'NONE',
        },
        params: { doctor: p.doctor || 'Dr. S. Raman', specialty: 'Cardiology' },
        riskLevel: 'low',
        dependencies: [],
      },
      {
        stepNumber: 2,
        stepId: 'step_2_reserve_slot',
        title: 'Hold 30-Min Consultation Slot',
        toolName: 'reserve_room',
        contract: {
          toolName: 'reserve_room',
          displayName: 'Reserve Slot',
          action: 'reserve_room',
          compensationAction: 'cancel_room',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'booking',
          description: 'Holds 11:30 AM slot in hospital calendar.',
          compensationDescription: 'Releases 11:30 AM slot back to open appointments.',
          sideEffectDescription: 'Slot held.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { slotTime: '11:30 AM', patient: c.name },
        riskLevel: 'low',
        dependencies: ['step_1_find_slot'],
      },
      {
        stepNumber: 3,
        stepId: 'step_3_process_payment',
        title: `Process Consultation Fee (₹${Number(p.fee || 1000).toFixed(2)})`,
        toolName: 'charge_payment',
        contract: {
          toolName: 'charge_payment',
          displayName: 'Process Payment',
          action: 'charge_payment',
          compensationAction: 'refund_payment',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'payment',
          description: 'Charges consultation fee.',
          compensationDescription: 'Refunds consultation fee.',
          sideEffectDescription: `Charged ₹${Number(p.fee || 1000).toFixed(2)}.`,
          rollbackStrategy: 'COMPENSATE',
        },
        params: { amount: Number(p.fee || 1000), currency: 'INR', txnId: p.paymentId || generateUniqueToken('TXN-APT') },
        riskLevel: 'medium',
        dependencies: ['step_2_reserve_slot'],
      },
      {
        stepNumber: 4,
        stepId: 'step_4_create_appointment',
        title: `Create EMR Clinical Record #${p.aptId || 'APT-CHN-901'}`,
        toolName: 'create_order',
        contract: {
          toolName: 'create_order',
          displayName: 'Create Appointment',
          action: 'create_order',
          compensationAction: 'cancel_order',
          reversible: true,
          idempotent: true,
          requiresApproval: false,
          category: 'system',
          description: 'Creates hospital EMR consultation record.',
          compensationDescription: 'Cancels appointment in EMR system.',
          sideEffectDescription: 'EMR record created.',
          rollbackStrategy: 'COMPENSATE',
        },
        params: { aptId: p.aptId || 'APT-CHN-901', patient: c.name },
        riskLevel: 'low',
        dependencies: ['step_3_process_payment'],
      },
      {
        stepNumber: 5,
        stepId: 'step_5_send_confirmation',
        title: 'Send Clinical Pass & Token SMS',
        toolName: 'send_confirmation',
        contract: {
          toolName: 'send_confirmation',
          displayName: 'Send Confirmation',
          action: 'send_confirmation',
          compensationAction: null,
          reversible: false,
          idempotent: true,
          requiresApproval: true,
          category: 'notification',
          description: 'Sends appointment SMS token (Irreversible).',
          compensationDescription: null,
          sideEffectDescription: `SMS token sent to ${c.name} (${c.email}).`,
          rollbackStrategy: 'HUMAN_ESCALATION',
        },
        params: { user: c.name, email: c.email, phone: c.phone },
        riskLevel: 'high',
        dependencies: ['step_4_create_appointment'],
      },
    ],
  },
};

// Default Synthetic Customer Generator
export const DEFAULT_CUSTOMER: WorkflowCustomer = {
  name: 'Divakaran',
  email: 'divakaranperumal2007@gmail.com',
  phone: '+91-8754300777',
  address: 'No. 14, 2nd Main Road, Chennai',
  area: 'Thiruvanmiyur',
};

// Instance Generator: builds a fresh, parameter-driven workflow instance with unique IDs
export function generateWorkflowInstance(
  type: WorkflowType = 'hotel_booking',
  customParams: Record<string, any> = {},
  customCustomer?: Partial<WorkflowCustomer>
): WorkflowInstance {
  const def = WORKFLOW_DEFINITIONS[type];
  const customer: WorkflowCustomer = {
    ...DEFAULT_CUSTOMER,
    ...(customCustomer || {}),
  };

  const instanceId = generateUniqueToken(`WF-${type.replace('_', '-').toUpperCase()}`);

  // Base parameters specialized by workflow type
  const baseParams: Record<string, any> = {};

  switch (type) {
    case 'cab_booking':
      baseParams.pickup = customParams.pickup || 'Thiruvanmiyur';
      baseParams.drop = customParams.drop || 'OMR / Sholinganallur';
      baseParams.fare = customParams.fare !== undefined ? customParams.fare : 420.0;
      baseParams.driverName = customParams.driverName || 'Murugan K';
      baseParams.driverId = customParams.driverId || generateUniqueToken('DRV-CHN');
      baseParams.rideId = customParams.rideId || generateUniqueToken('RIDE-CHN');
      baseParams.paymentId = customParams.paymentId || generateUniqueToken('PAY-CAB');
      baseParams.currency = 'INR';
      break;

    case 'hotel_booking': {
      const searchLocation = customParams.searchLocation || customParams.area || 'Nungambakkam';
      const discovery = discoverNearestAvailableHotel(searchLocation);
      const nearest = discovery.selectedNearestHotel;
      baseParams.searchLocation = searchLocation;
      baseParams.area = nearest.area || searchLocation;
      baseParams.hotel = customParams.hotel || nearest.hotelName;
      baseParams.hotelId = customParams.hotelId || nearest.hotelId;
      baseParams.hotelName = customParams.hotelName || nearest.hotelName;
      baseParams.roomType = customParams.roomType || nearest.roomType || 'Deluxe Room';
      baseParams.roomPrice = typeof customParams.roomPrice === 'number' ? customParams.roomPrice : (nearest.price || 750.0);
      baseParams.distanceKm = nearest.distanceKm !== undefined ? nearest.distanceKm : 0.18;
      baseParams.availableRooms = nearest.availableRooms || 3;
      baseParams.roomId = customParams.roomId || generateUniqueToken('ROOM-CHN');
      baseParams.bookingId = customParams.bookingId || generateUniqueToken('HTL-CHN');
      baseParams.paymentId = customParams.paymentId || generateUniqueToken('PAY-HTL');
      baseParams.ticketId = customParams.ticketId || generateUniqueToken('TKT-HTL');
      baseParams.currency = 'INR';
      break;
    }

    case 'ecommerce_order':
      baseParams.deliveryArea = customParams.deliveryArea || 'Velachery';
      baseParams.product = customParams.product || 'AI Development Laptop';
      baseParams.productId = customParams.productId || generateUniqueToken('PROD-CHN');
      baseParams.quantity = customParams.quantity || 1;
      baseParams.price = customParams.price !== undefined ? customParams.price : 85000.0;
      baseParams.orderId = customParams.orderId || generateUniqueToken('ORD-CHN');
      baseParams.paymentId = customParams.paymentId || generateUniqueToken('PAY-ECOM');
      baseParams.trackingNo = customParams.trackingNo || generateUniqueToken('TRK-CHN');
      baseParams.currency = 'INR';
      break;

    case 'customer_support':
      baseParams.customerArea = customParams.customerArea || 'Adyar';
      baseParams.ticketId = customParams.ticketId || generateUniqueToken('TKT-CHN');
      baseParams.issue = customParams.issue || 'Payment charged but booking confirmation not received';
      baseParams.agent = customParams.agent || 'Sarah Jenkins';
      baseParams.priority = customParams.priority || 'P1 - Urgent';
      baseParams.creditAmount = customParams.creditAmount !== undefined ? customParams.creditAmount : 500.0;
      baseParams.currency = 'INR';
      break;

    default:
      baseParams.amount = customParams.amount !== undefined ? customParams.amount : def.defaultAmount;
      baseParams.currency = def.currency;
      baseParams.area = def.defaultArea;
      baseParams.paymentId = generateUniqueToken('TXN-CHN');
      baseParams.orderId = generateUniqueToken('REC-CHN');
  }

  const mergedParams = { ...baseParams, ...customParams };
  const steps = def.buildSteps(mergedParams, customer);

  return {
    instanceId,
    workflowType: type,
    name: def.name,
    category: def.category,
    agentRole: def.agentRole,
    avatar: def.avatar,
    customer,
    parameters: mergedParams,
    steps,
    createdAt: new Date().toISOString(),
  };
}
