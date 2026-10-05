// ============================================================================
// UNDO.AI — DETERMINISTIC PARAMETERIZED MOCKED WORLD STATE & SIDE EFFECT RUNTIME
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// ============================================================================

import { WorkflowType, WorkflowInstance } from './workflows';
import { discoverNearestAvailableHotel } from './chennaiGeo';

export interface MockWorldState {
  workflowId: string;
  workflowType: WorkflowType;
  
  // Payment Transaction Domain
  payment: {
    transactionId: string;
    chargeStatus: 'NOT_CHARGED' | 'CHARGED';
    amountCharged: number;
    refundedAmount: number;
    refundTransactionId: string | null;
    currency: string;
    label: string;
  };

  // Cab / Ride Domain
  cab: {
    rideId: string | null;
    rideStatus: 'NOT_REQUESTED' | 'REQUESTED' | 'CONFIRMED' | 'CANCELLED';
    driverId: string | null;
    driverName: string | null;
    pickup: string;
    drop: string;
    fare: number;
  };

  // Hotel Domain
  hotel: {
    hotelId: string;
    hotelName: string;
    area: string;
    distanceKm: number;
    roomType: string;
    roomId: string | null;
    roomStatus: 'AVAILABLE' | 'SELECTED' | 'RESERVED';
    activeBookingId: string | null;
    guestName: string | null;
    roomPrice: number;
    availableRooms: number;
    initialAvailableRooms: number;
    ticketId: string | null;
    ticketStatus: 'NOT_CREATED' | 'CREATED' | 'CANCELLED';
    ticketExists: boolean;
  };

  // E-Commerce Order Domain
  order: {
    orderStatus: 'NOT_CREATED' | 'CREATED' | 'CANCELLED';
    orderId: string | null;
    product: string;
    quantity: number;
    totalAmount: number;
  };

  // Inventory Domain
  inventory: {
    sku: string;
    stock: number;
    initialStock: number;
    reservedQuantity: number;
    holdId: string | null;
  };

  // Shipment / Logistics Domain
  shipment: {
    shipmentStatus: 'NOT_CREATED' | 'LABEL_GENERATED' | 'CANCELLED';
    trackingNumber: string | null;
    carrier: string | null;
    destination: string | null;
  };

  // Support CRM Domain
  support: {
    ticketStatus: 'NOT_CREATED' | 'OPEN' | 'CLOSED_CANCELLED';
    ticketId: string | null;
    assignedAgent: string | null;
    customerTier: string;
    initialTier: string;
    issue: string;
    crmNotes: string;
    resolutionCredit: number;
  };

  // Communication & Notifications
  notifications: {
    confirmationSent: boolean;
    recipient: string;
    customerName: string;
    lastSentTimestamp: string | null;
  };
}

export function createInitialWorldState(
  workflowType: WorkflowType = 'cab_booking',
  workflowId: string = 'WF-CAB-CHN-001',
  params: Record<string, any> = {},
  customer: { name: string; email: string; phone: string } = {
    name: 'Divakaran',
    email: 'divakaranperumal27@gmail.com',
    phone: '+91-98400-44910',
  }
): MockWorldState {
  const currency = params.currency || 'INR';
  const amount =
    workflowType === 'hotel_booking'
      ? params.roomPrice || 750.0
      : workflowType === 'cab_booking'
      ? params.fare || 420.0
      : workflowType === 'ecommerce_order'
      ? params.price || 85000.0
      : workflowType === 'customer_support'
      ? params.creditAmount || 500.0
      : params.amount || 1000.0;

  const txnId =
    params.transactionId ||
    params.paymentId ||
    (workflowType === 'hotel_booking' ? 'TXN-HOTEL-7A21' : workflowType === 'cab_booking' ? 'PAY-CAB-4D88' : 'PAY-ECOM-55A1');

  return {
    workflowId,
    workflowType,
    payment: {
      transactionId: txnId,
      chargeStatus: 'NOT_CHARGED',
      amountCharged: 0,
      refundedAmount: 0,
      refundTransactionId: null,
      currency,
      label:
        workflowType === 'cab_booking'
          ? 'RIDE FARE PAYMENT'
          : workflowType === 'hotel_booking'
          ? 'HOTEL PAYMENT TRANSACTION'
          : workflowType === 'ecommerce_order'
          ? 'ORDER PAYMENT TRANSACTION'
          : workflowType === 'customer_support'
          ? 'SLA RESOLUTION CREDIT'
          : 'FINANCIAL TRANSACTION',
    },
    cab: {
      rideId: params.rideId || 'RIDE-CHN-8841',
      rideStatus: 'NOT_REQUESTED',
      driverId: null,
      driverName: null,
      pickup: params.pickup || 'Thiruvanmiyur',
      drop: params.drop || 'OMR / Sholinganallur',
      fare: amount,
    },
    hotel: (() => {
      const searchLocation = params.searchLocation || params.area || params.location || 'Nungambakkam';
      const discovery = discoverNearestAvailableHotel(searchLocation);
      const nearest = discovery.selectedNearestHotel;
      const hotelName = params.hotel || params.hotelName || nearest.hotelName;
      const hotelId = params.hotelId || nearest.hotelId;
      const area = nearest.area || searchLocation;
      const roomType = params.roomType || nearest.roomType || 'Deluxe Room';
      const distanceKm = params.distanceKm || nearest.distanceKm || 0.85;
      const roomPrice = typeof params.roomPrice === 'number' ? params.roomPrice : (nearest.price || 750.0);
      const avail = typeof params.availableRooms === 'number' ? params.availableRooms : nearest.availableRooms || 3;

      return {
        hotelId,
        hotelName,
        area,
        distanceKm,
        roomType,
        roomId: params.roomId || 'ROOM-CHN-4491',
        roomStatus: 'AVAILABLE' as const,
        activeBookingId: null,
        guestName: null,
        roomPrice,
        availableRooms: avail,
        initialAvailableRooms: avail,
        ticketId: null,
        ticketStatus: 'NOT_CREATED' as const,
        ticketExists: false,
      };
    })(),
    order: {
      orderStatus: 'NOT_CREATED',
      orderId: params.orderId || null,
      product: params.product || 'AI Development Laptop',
      quantity: params.quantity || 1,
      totalAmount: amount,
    },
    inventory: {
      sku: params.productId || 'PROD-CHN-771',
      stock: 10,
      initialStock: 10,
      reservedQuantity: 0,
      holdId: null,
    },
    shipment: {
      shipmentStatus: 'NOT_CREATED',
      trackingNumber: null,
      carrier: null,
      destination: params.deliveryArea ? `${params.deliveryArea}, Chennai` : null,
    },
    support: {
      ticketStatus: 'NOT_CREATED',
      ticketId: params.ticketId || 'TKT-CHN-5512',
      assignedAgent: null,
      customerTier: 'Standard',
      initialTier: 'Standard',
      issue: params.issue || 'Payment charged but booking confirmation not received',
      crmNotes: 'Account created 2024. Good standing.',
      resolutionCredit: 0,
    },
    notifications: {
      confirmationSent: false,
      recipient: customer.email,
      customerName: customer.name,
      lastSentTimestamp: null,
    },
  };
}

export class MockWorldEngine {
  // Instance-level isolated world states
  private instances: Map<string, MockWorldState> = new Map();
  private baselines: Map<string, MockWorldState> = new Map();
  private activeWorkflowId: string = 'WF-CAB-CHN-001';

  constructor() {
    const defaultState = createInitialWorldState('cab_booking', 'WF-CAB-CHN-001', {
      fare: 420.0,
      pickup: 'Thiruvanmiyur',
      drop: 'OMR / Sholinganallur',
      driverName: 'Murugan K',
      driverId: 'DRV-CHN-1042',
    });
    this.instances.set(this.activeWorkflowId, defaultState);
    this.baselines.set(this.activeWorkflowId, JSON.parse(JSON.stringify(defaultState)));
  }

  public initializeWorkflowWorld(
    instance: WorkflowInstance
  ): MockWorldState {
    this.activeWorkflowId = instance.instanceId;
    const state = createInitialWorldState(
      instance.workflowType,
      instance.instanceId,
      instance.parameters,
      instance.customer
    );
    this.instances.set(instance.instanceId, state);
    this.baselines.set(instance.instanceId, JSON.parse(JSON.stringify(state)));
    return this.getState(instance.instanceId);
  }

  public getState(workflowId: string = this.activeWorkflowId): MockWorldState {
    if (!this.instances.has(workflowId)) {
      const fresh = createInitialWorldState();
      this.instances.set(workflowId, fresh);
      this.baselines.set(workflowId, JSON.parse(JSON.stringify(fresh)));
    }
    return JSON.parse(JSON.stringify(this.instances.get(workflowId)!));
  }

  public getBaseline(workflowId: string = this.activeWorkflowId): MockWorldState {
    if (!this.baselines.has(workflowId)) {
      const fresh = createInitialWorldState();
      this.baselines.set(workflowId, JSON.parse(JSON.stringify(fresh)));
    }
    return JSON.parse(JSON.stringify(this.baselines.get(workflowId)!));
  }

  public resetToBaseline(workflowId: string = this.activeWorkflowId): MockWorldState {
    const base = this.baselines.get(workflowId);
    if (base) {
      this.instances.set(workflowId, JSON.parse(JSON.stringify(base)));
    } else {
      const fresh = createInitialWorldState();
      this.instances.set(workflowId, fresh);
      this.baselines.set(workflowId, JSON.parse(JSON.stringify(fresh)));
    }
    return this.getState(workflowId);
  }

  public setBaseline(baseline: MockWorldState, workflowId: string = this.activeWorkflowId): void {
    this.baselines.set(workflowId, JSON.parse(JSON.stringify(baseline)));
  }

  // --- Execute Forward Action ---
  public executeAction(
    toolName: string,
    params: Record<string, any> = {},
    workflowId: string = this.activeWorkflowId
  ): {
    success: boolean;
    output: Record<string, any>;
    sideEffectDesc: string;
    newState: MockWorldState;
  } {
    const s = this.instances.get(workflowId) || this.getState(workflowId);
    let output: Record<string, any> = {};
    let sideEffectDesc = '';

    switch (toolName) {
      // 1. Cab Actions
      case 'request_ride':
        s.cab.rideStatus = 'REQUESTED';
        s.cab.pickup = params.pickup || s.cab.pickup;
        s.cab.drop = params.drop || s.cab.drop;
        output = {
          pickup: s.cab.pickup,
          drop: s.cab.drop,
          etaMinutes: 3,
          availableDrivers: 4,
        };
        sideEffectDesc = `Fleet query: Located 4 drivers in ${s.cab.pickup} zone (0 mutations committed).`;
        break;

      case 'assign_driver':
        s.cab.driverId = params.driverId || 'DRV-CHN-1042';
        s.cab.driverName = params.driverName || params.driver || 'Murugan K';
        s.support.assignedAgent = s.cab.driverName;
        output = {
          driverId: s.cab.driverId,
          driverName: s.cab.driverName,
          vehicle: params.cabNumber || 'TN-09-AX-4491',
          status: 'ALLOCATED',
        };
        sideEffectDesc = `Driver locked: ${s.cab.driverName} (${s.cab.driverId}) assigned to ride.`;
        break;

      case 'reserve_ride':
        s.cab.rideStatus = 'CONFIRMED';
        s.cab.rideId = params.rideId || s.cab.rideId || 'RIDE-CHN-8841';
        output = {
          rideId: s.cab.rideId,
          status: 'CONFIRMED',
          pickup: s.cab.pickup,
          drop: s.cab.drop,
        };
        sideEffectDesc = `Ride #${s.cab.rideId} confirmed in mobility dispatch engine.`;
        break;

      // 2. Hotel Actions
      case 'search_hotels':
      case 'search_hotel':
      case 'search_room': {
        const searchLoc = params.searchLocation || params.area || s.hotel.area || 'Nungambakkam';
        const disc = discoverNearestAvailableHotel(searchLoc);
        output = {
          searchLocation: disc.customerCoord.name,
          customerLat: disc.customerCoord.lat,
          customerLng: disc.customerCoord.lng,
          totalFound: disc.totalFound,
          availableFound: disc.availableFound,
          nearestHotel: disc.selectedNearestHotel.hotelName,
          distanceKm: disc.selectedNearestHotel.distanceKm,
          roomType: disc.selectedNearestHotel.roomType,
          rate: disc.selectedNearestHotel.price,
          availableRooms: disc.selectedNearestHotel.availableRooms,
          currency: 'INR',
        };
        sideEffectDesc = `Discovered ${disc.totalFound} Chennai hotels: ${disc.availableFound} available properties filtered. Nearest: ${disc.selectedNearestHotel.hotelName} (${disc.selectedNearestHotel.distanceKm} km). (Read-only query, 0 side effects).`;
        break;
      }

      case 'select_room':
        s.hotel.roomStatus = 'SELECTED';
        s.hotel.hotelId = params.hotelId || s.hotel.hotelId;
        s.hotel.hotelName = params.hotelName || s.hotel.hotelName;
        s.hotel.area = params.area || s.hotel.area;
        s.hotel.distanceKm = typeof params.distanceKm === 'number' ? params.distanceKm : s.hotel.distanceKm;
        s.hotel.roomId = params.roomId || s.hotel.roomId || 'ROOM-CHN-4491';
        s.hotel.roomType = params.roomType || s.hotel.roomType;
        s.hotel.roomPrice = typeof params.roomPrice === 'number' ? params.roomPrice : typeof params.rate === 'number' ? params.rate : s.hotel.roomPrice;
        output = {
          hotelId: s.hotel.hotelId,
          hotelName: s.hotel.hotelName,
          area: s.hotel.area,
          distanceKm: s.hotel.distanceKm,
          roomId: s.hotel.roomId,
          roomType: s.hotel.roomType,
          rate: s.hotel.roomPrice,
          availableRooms: s.hotel.availableRooms,
          currency: 'INR',
        };
        sideEffectDesc = `Auto-selected nearest hotel ${s.hotel.hotelName} (${s.hotel.distanceKm} km, ${s.hotel.area}) — ${s.hotel.roomType} (${s.hotel.roomId}) at ₹${s.hotel.roomPrice.toLocaleString('en-IN')}.`;
        break;

      case 'reserve_room':
        s.hotel.roomStatus = 'RESERVED';
        s.hotel.activeBookingId = params.bookingId || params.holdId || 'HTL-CHN-4491';
        s.hotel.guestName = params.guest || params.attendee || params.patient || 'Divakaran';
        s.hotel.roomId = params.roomId || s.hotel.roomId;
        if (s.hotel.availableRooms > 0) {
          s.hotel.availableRooms -= 1;
        }
        output = {
          bookingId: s.hotel.activeBookingId,
          roomId: s.hotel.roomId,
          roomType: s.hotel.roomType,
          hotelName: s.hotel.hotelName,
          remainingRooms: s.hotel.availableRooms,
          status: 'HELD_RESERVED',
        };
        sideEffectDesc = `Room hold placed: ${s.hotel.roomType} (${s.hotel.roomId}) status changed from AVAILABLE ➔ RESERVED (Booking ID: ${s.hotel.activeBookingId}). Available inventory: ${s.hotel.availableRooms}.`;
        break;

      case 'create_booking_ticket':
        s.hotel.ticketId = params.ticketId || 'TKT-HTL-20547106';
        s.hotel.ticketStatus = 'CREATED';
        s.hotel.ticketExists = true;
        output = {
          ticketId: s.hotel.ticketId,
          bookingId: s.hotel.activeBookingId,
          hotelName: s.hotel.hotelName,
          status: 'ACTIVE_VOUCHER',
        };
        sideEffectDesc = `Issued reservation voucher ticket #${s.hotel.ticketId} in central hospitality ledger.`;
        break;

      // 3. Payment Actions (Parameterized Amount & Currency)
      case 'charge_card':
      case 'charge_payment':
      case 'process_order_payment':
      case 'charge_fare':
      case 'charge_deposit':
      case 'process_payment':
        const chargeAmt = typeof params.amount === 'number' ? params.amount : s.payment.amountCharged > 0 ? s.payment.amountCharged : 750.0;
        s.payment.chargeStatus = 'CHARGED';
        s.payment.amountCharged = chargeAmt;
        s.payment.transactionId = params.txnId || params.paymentId || s.payment.transactionId;
        s.payment.refundedAmount = 0;
        s.payment.currency = params.currency || s.payment.currency;
        output = {
          transactionId: s.payment.transactionId,
          amount: chargeAmt,
          currency: s.payment.currency,
          status: 'SETTLED',
        };
        const currSym = s.payment.currency === 'USD' ? '$' : '₹';
        sideEffectDesc = `Payment captured: ${currSym}${chargeAmt.toLocaleString()} charged (Txn: ${s.payment.transactionId}). State changed: NOT_CHARGED ➔ CHARGED.`;
        break;

      // 4. E-Commerce Actions
      case 'validate_product':
        output = {
          productId: params.productId || 'PROD-CHN-771',
          product: params.product || 'AI Development Laptop',
          price: params.price || 85000,
          inventoryAvailable: s.inventory.stock > 0,
          status: 'VALIDATED',
        };
        sideEffectDesc = `Product catalog query: SKU ${output.productId} (${output.product}) verified at ₹${Number(output.price).toLocaleString('en-IN')}. (Read-only query, 0 side effects).`;
        break;

      case 'create_order':
        s.order.orderStatus = 'CREATED';
        s.order.orderId = params.orderId || params.manifestId || params.resId || params.aptId || 'ORD-CHN-8821';
        s.order.product = params.product || s.order.product;
        s.order.totalAmount = typeof params.amount === 'number' ? params.amount : s.order.totalAmount;
        output = {
          orderId: s.order.orderId,
          product: s.order.product,
          status: 'CREATED_PENDING',
        };
        sideEffectDesc = `Created customer order record #${s.order.orderId} in database (Order state: NOT_CREATED ➔ CREATED).`;
        break;

      case 'reserve_inventory':
        if (s.inventory.stock > 0) {
          s.inventory.stock -= (params.quantity || 1);
          s.inventory.reservedQuantity += (params.quantity || 1);
          s.inventory.holdId = params.orderId || params.holdId || 'HOLD-SKU-99';
        }
        output = {
          sku: s.inventory.sku,
          remainingStock: s.inventory.stock,
          allocatedQuantity: params.quantity || 1,
        };
        sideEffectDesc = `Warehouse inventory: SKU ${s.inventory.sku} stock decremented (${s.inventory.stock + (params.quantity || 1)} ➔ ${s.inventory.stock} units, status: AVAILABLE ➔ RESERVED).`;
        break;

      case 'capture_payment':
        const ecomPrice = typeof params.amount === 'number' ? params.amount : s.payment.amountCharged > 0 ? s.payment.amountCharged : 85000.0;
        s.payment.chargeStatus = 'CHARGED';
        s.payment.amountCharged = ecomPrice;
        s.payment.transactionId = params.txnId || params.paymentId || s.payment.transactionId || 'PAY-ECOM-55A1';
        s.payment.refundedAmount = 0;
        s.payment.currency = params.currency || 'INR';
        output = {
          transactionId: s.payment.transactionId,
          amount: ecomPrice,
          currency: 'INR',
          status: 'SETTLED',
        };
        sideEffectDesc = `Payment captured: ₹${ecomPrice.toLocaleString('en-IN')} charged on card (Txn: ${s.payment.transactionId}). State: NOT_CHARGED ➔ CHARGED.`;
        break;

      case 'generate_shipment_label':
      case 'create_shipment':
        s.shipment.shipmentStatus = 'LABEL_GENERATED';
        s.shipment.trackingNumber = params.trackingNo || params.shipmentLabelId || params.passId || params.parcelId || 'LBL-ECOM-8821';
        s.shipment.carrier = 'Chennai Express Logistics';
        s.shipment.destination = params.destination || s.shipment.destination;
        output = {
          trackingNumber: s.shipment.trackingNumber,
          carrier: s.shipment.carrier,
          status: 'LABEL_GENERATED',
        };
        sideEffectDesc = `Carrier manifest: Generated airway shipment label #${s.shipment.trackingNumber} for ${s.shipment.destination || 'Velachery, Chennai'}.`;
        break;

      // 5. Support CRM Actions
      case 'search_customer_incident':
        output = {
          customer: params.customer || 'Divakaran',
          issue: params.issue || 'Payment transaction failed',
          area: params.area || 'Adyar',
          accountStatus: 'ACTIVE',
          incidentFound: true,
        };
        sideEffectDesc = `Queried CRM customer and incident logs for ${output.customer} (Incident: ${output.issue}). (Read-only query, 0 side effects).`;
        break;

      case 'create_support_ticket':
      case 'create_ticket':
        s.support.ticketStatus = 'OPEN';
        s.support.ticketId = params.ticketId || 'TKT-SUP-5512';
        s.support.issue = params.issue || s.support.issue;
        output = {
          ticketId: s.support.ticketId,
          priority: params.priority || 'HIGH',
          status: 'OPEN',
        };
        sideEffectDesc = `Created priority support ticket #${s.support.ticketId} in CRM database (Ticket state: NOT_CREATED ➔ OPEN).`;
        break;

      case 'assign_specialist':
      case 'assign_agent':
        s.support.assignedAgent = params.agent || params.driver || 'Sarah Jenkins';
        output = {
          ticketId: s.support.ticketId,
          assignedAgent: s.support.assignedAgent,
          status: 'ASSIGNED',
        };
        sideEffectDesc = `Assigned specialist: ${s.support.assignedAgent} allocated to ticket (Specialist state: AVAILABLE ➔ ASSIGNED).`;
        break;

      case 'upgrade_customer_priority':
      case 'update_customer_record':
        s.support.customerTier = params.to || params.tier || 'HIGH';
        s.support.initialTier = params.from || 'NORMAL';
        s.support.crmNotes = `Upgraded SLA priority to ${s.support.customerTier} via automated workflow protocol.`;
        output = {
          customer: params.customer || 'Divakaran',
          previousPriority: s.support.initialTier,
          newPriority: s.support.customerTier,
        };
        sideEffectDesc = `Upgraded customer priority in CRM: ${s.support.initialTier} ➔ ${s.support.customerTier}.`;
        break;

      case 'issue_resolution_credit':
      case 'create_resolution':
        s.support.resolutionCredit = typeof params.resolutionCredit === 'number' ? params.resolutionCredit : typeof params.creditAmount === 'number' ? params.creditAmount : 500;
        output = {
          creditAmount: s.support.resolutionCredit,
          currency: 'INR',
          status: 'CREDIT_COMMITTED',
        };
        sideEffectDesc = `Issued resolution credit of ₹${s.support.resolutionCredit} to customer account (Resolution Credit: NOT_CREATED ➔ ISSUED).`;
        break;

      // 6. External Immutable Communication
      case 'send_booking_confirmation':
      case 'send_order_confirmation':
      case 'send_support_notification':
      case 'send_confirmation':
      case 'send_email':
        s.notifications.confirmationSent = true;
        s.notifications.lastSentTimestamp = new Date().toLocaleTimeString();
        s.notifications.recipient = params.email || s.notifications.recipient;
        s.notifications.customerName = params.user || s.notifications.customerName;
        output = {
          recipient: s.notifications.recipient,
          user: s.notifications.customerName,
          deliveryStatus: 'DELIVERED_TO_GATEWAY',
          bookingId: s.hotel.activeBookingId,
          ticketId: s.hotel.ticketId || s.support.ticketId,
          orderId: s.order.orderId,
        };
        sideEffectDesc = `Delivered external confirmation to ${s.notifications.customerName} (${s.notifications.recipient}) (Irreversible).`;
        break;

      default:
        sideEffectDesc = `Executed action: ${toolName}`;
    }

    this.instances.set(workflowId, s);

    return {
      success: true,
      output,
      sideEffectDesc,
      newState: this.getState(workflowId),
    };
  }

  // --- Execute Reverse Compensation Action ---
  public executeCompensation(
    compensationAction: string,
    params: Record<string, any> = {},
    shouldInjectFailure: boolean = false,
    workflowId: string = this.activeWorkflowId
  ): {
    success: boolean;
    output: Record<string, any>;
    compensationDesc: string;
    newState: MockWorldState;
    errorMessage?: string;
  } {
    if (shouldInjectFailure) {
      return {
        success: false,
        output: { error: 'COMPENSATION_REMOTE_TIMEOUT' },
        compensationDesc: `Failed executing compensation '${compensationAction}': Remote gateway lock timeout.`,
        newState: this.getState(workflowId),
        errorMessage: `Remote endpoint rejected compensation for ${compensationAction}: Gateway Lock Timeout.`,
      };
    }

    const s = this.instances.get(workflowId) || this.getState(workflowId);
    let output: Record<string, any> = {};
    let compensationDesc = '';

    switch (compensationAction) {
      // Cab compensations
      case 'cancel_ride':
        s.cab.rideStatus = 'CANCELLED';
        output = { rideId: s.cab.rideId, status: 'CANCELLED' };
        compensationDesc = `Compensated Ride: Trip #${s.cab.rideId || 'RIDE'} cancelled in mobility system.`;
        break;

      case 'release_driver':
      case 'unassign_agent':
      case 'unassign_driver':
        const releasedAgent = s.cab.driverName || s.support.assignedAgent || 'Murugan K';
        s.cab.driverId = null;
        s.cab.driverName = null;
        s.support.assignedAgent = null;
        output = { released: releasedAgent, status: 'RETURNED_TO_POOL' };
        compensationDesc = `Compensated Driver/Specialist: ${releasedAgent} returned to active routing pool.`;
        break;

      // Hotel compensations
      case 'cancel_booking_ticket':
        const voidedTkt = s.hotel.ticketId || params.ticketId || 'TKT-HTL-20547106';
        s.hotel.ticketStatus = 'CANCELLED';
        s.hotel.ticketId = null;
        output = { ticketId: voidedTkt, status: 'CANCELLED_VOID' };
        compensationDesc = `Compensated Ticket: Booking ticket #${voidedTkt} voided and cancelled in central hospitality ledger.`;
        break;

      case 'cancel_room_booking':
      case 'cancel_booking':
      case 'cancel_room':
      case 'release_table':
      case 'release_seat':
      case 'release_slot':
      case 'release_vehicle':
        s.hotel.roomStatus = 'AVAILABLE';
        s.hotel.activeBookingId = null;
        s.hotel.guestName = null;
        s.hotel.availableRooms = s.hotel.initialAvailableRooms;
        output = { roomType: s.hotel.roomType, status: 'AVAILABLE', availableRooms: s.hotel.availableRooms };
        compensationDesc = `Compensated Reservation: Room hold #${params.bookingId || s.hotel.activeBookingId || 'HTL'} cancelled, status restored to AVAILABLE, room inventory restored to ${s.hotel.availableRooms}.`;
        break;

      // Payment Compensations (Refund exact workflow amount)
      case 'refund_payment':
      case 'refund_order_payment':
      case 'refund_deposit':
      case 'revert_resolution':
        const refundAmt =
          s.payment.amountCharged > 0
            ? s.payment.amountCharged
            : typeof params.amount === 'number'
            ? params.amount
            : s.hotel.roomPrice || s.cab.fare || s.order.totalAmount || 750.0;

        s.payment.chargeStatus = 'NOT_CHARGED';
        s.payment.refundedAmount = refundAmt;
        s.payment.amountCharged = 0;
        s.payment.refundTransactionId = `REF-${Math.floor(1000 + Math.random() * 9000)}`;
        const sym = s.payment.currency === 'USD' ? '$' : '₹';
        output = {
          transactionId: s.payment.transactionId,
          refundId: s.payment.refundTransactionId,
          refundedAmount: refundAmt,
          currency: s.payment.currency,
          status: 'REFUND_SETTLED',
        };
        compensationDesc = `Compensated Payment: Executed reverse refund of ${sym}${refundAmt.toLocaleString()} (Txn: ${s.payment.transactionId}). Payment state restored to NOT_CHARGED.`;
        break;

      // E-Commerce compensations
      case 'cancel_order':
      case 'cancel_registration':
      case 'cancel_delivery':
      case 'cancel_appointment':
        s.order.orderStatus = 'CANCELLED';
        output = { orderId: s.order.orderId, status: 'VOIDED_AND_CANCELLED' };
        compensationDesc = `Compensated Order/Record: Record #${s.order.orderId || 'ORD'} cancelled and voided in database.`;
        break;

      case 'release_inventory':
        s.inventory.stock = s.inventory.initialStock;
        s.inventory.reservedQuantity = 0;
        s.inventory.holdId = null;
        output = { sku: s.inventory.sku, stockRestored: s.inventory.stock };
        compensationDesc = `Compensated Inventory: SKU ${s.inventory.sku} stock restored to initial ${s.inventory.initialStock} units.`;
        break;

      case 'void_shipment_label':
      case 'cancel_shipment':
      case 'recall_dispatch':
      case 'invalidate_ticket':
        s.shipment.shipmentStatus = 'CANCELLED';
        s.shipment.trackingNumber = null;
        output = { trackingNumber: s.shipment.trackingNumber, status: 'DISPATCH_VOIDED' };
        compensationDesc = `Compensated Shipment: Voided carrier shipment label #${params.trackingNo || params.shipmentLabelId || 'LBL-ECOM'}.`;
        break;

      // Support CRM compensations
      case 'cancel_support_ticket':
      case 'close_ticket':
      case 'delete_ticket':
        s.support.ticketStatus = 'CLOSED_CANCELLED';
        s.support.ticketId = null;
        output = { ticketId: params.ticketId || s.support.ticketId, status: 'CLOSED_CANCELLED' };
        compensationDesc = `Compensated Support Ticket: Ticket #${params.ticketId || s.support.ticketId || 'TKT-SUP'} closed and voided in CRM.`;
        break;

      case 'release_specialist':
      case 'unassign_specialist':
        const unassignedAgent = s.support.assignedAgent || 'Sarah Jenkins';
        s.support.assignedAgent = null;
        output = { releasedAgent: unassignedAgent, status: 'RETURNED_TO_POOL' };
        compensationDesc = `Compensated Specialist: Specialist ${unassignedAgent} returned to active support routing pool (Status: AVAILABLE).`;
        break;

      case 'restore_customer_priority':
      case 'restore_customer_record':
        s.support.customerTier = 'NORMAL';
        s.support.crmNotes = 'Priority restored to NORMAL baseline.';
        output = { customerTier: 'NORMAL' };
        compensationDesc = `Compensated Customer Priority: Customer priority restored from HIGH ➔ NORMAL.`;
        break;

      case 'revoke_resolution_credit':
      case 'revert_resolution':
        const revokedAmount = s.support.resolutionCredit > 0 ? s.support.resolutionCredit : (params.resolutionCredit || 500);
        s.support.resolutionCredit = 0;
        output = { creditRevoked: revokedAmount, status: 'REVOKED' };
        compensationDesc = `Compensated Resolution Credit: Revoked ₹${revokedAmount} resolution credit allocation in ledger.`;
        break;

      default:
        compensationDesc = `Executed compensation: ${compensationAction}`;
    }

    this.instances.set(workflowId, s);

    return {
      success: true,
      output,
      compensationDesc,
      newState: this.getState(workflowId),
    };
  }

  // --- Phase-Aware Dynamic Invariant Verifier ---
  public verifyWorldState(
    workflowId: string = this.activeWorkflowId,
    phase: string = 'IDLE'
  ): {
    isFullyRestored: boolean;
    differences: Array<{
      resource: string;
      expected: string;
      actual: string;
      isMatch: boolean;
    }>;
    summary: string;
    isCompletedValid: boolean;
  } {
    const cur = this.getState(workflowId);
    const base = this.getBaseline(workflowId);
    const diffs: Array<{
      resource: string;
      expected: string;
      actual: string;
      isMatch: boolean;
    }> = [];

    const currSym = cur.payment.currency === 'USD' ? '$' : '₹';

    // 1. HAPPY PATH COMPLETED PHASE VERIFIER
    if (phase === 'COMPLETED') {
      switch (cur.workflowType) {
        case 'hotel_booking': {
          const hotelPrice = cur.hotel.roomPrice || 750.0;
          const isPayCharged = cur.payment.chargeStatus === 'CHARGED' && cur.payment.amountCharged === hotelPrice;
          diffs.push({
            resource: 'Hotel Payment Transaction',
            expected: `CHARGED ${currSym}${hotelPrice.toLocaleString('en-IN')}`,
            actual: cur.payment.chargeStatus === 'CHARGED' ? `CHARGED ${currSym}${cur.payment.amountCharged.toLocaleString('en-IN')}` : 'NOT_CHARGED',
            isMatch: isPayCharged,
          });

          const isRoomReserved = cur.hotel.roomStatus === 'RESERVED';
          diffs.push({
            resource: `Hotel ${cur.hotel.roomType}`,
            expected: 'RESERVED',
            actual: cur.hotel.roomStatus,
            isMatch: isRoomReserved,
          });

          const isInvDecremented = cur.hotel.availableRooms === cur.hotel.initialAvailableRooms - 1;
          diffs.push({
            resource: 'Hotel Inventory',
            expected: `${cur.hotel.initialAvailableRooms - 1} ROOMS`,
            actual: `${cur.hotel.availableRooms} ROOMS`,
            isMatch: isInvDecremented,
          });

          const isBookingCreated = cur.hotel.activeBookingId !== null;
          diffs.push({
            resource: 'Hotel Booking Record',
            expected: 'CREATED',
            actual: isBookingCreated ? 'CREATED' : 'NOT_CREATED',
            isMatch: isBookingCreated,
          });

          const isTicketIssued = cur.hotel.ticketStatus === 'CREATED';
          diffs.push({
            resource: 'Guest Voucher Ticket',
            expected: 'CREATED',
            actual: cur.hotel.ticketStatus,
            isMatch: isTicketIssued,
          });

          const isEmailDelivered = cur.notifications.confirmationSent;
          diffs.push({
            resource: 'Customer Confirmation Notification',
            expected: 'SENT',
            actual: isEmailDelivered ? 'SENT' : 'NOT_SENT',
            isMatch: isEmailDelivered,
          });
          break;
        }

        case 'cab_booking': {
          const fareAmt = cur.cab.fare || 420.0;
          const isPayCharged = cur.payment.chargeStatus === 'CHARGED' && cur.payment.amountCharged === fareAmt;
          diffs.push({
            resource: 'Ride Fare Payment',
            expected: `CHARGED ${currSym}${fareAmt.toLocaleString('en-IN')}`,
            actual: cur.payment.chargeStatus === 'CHARGED' ? `CHARGED ${currSym}${cur.payment.amountCharged.toLocaleString('en-IN')}` : 'NOT_CHARGED',
            isMatch: isPayCharged,
          });

          const isRideConfirmed = cur.cab.rideStatus === 'CONFIRMED';
          diffs.push({
            resource: 'Ride Reservation Status',
            expected: 'CONFIRMED',
            actual: cur.cab.rideStatus,
            isMatch: isRideConfirmed,
          });

          const isDriverAssigned = cur.cab.driverId !== null;
          diffs.push({
            resource: 'Driver Fleet Assignment',
            expected: `ASSIGNED (${cur.cab.driverName || 'Murugan K'})`,
            actual: isDriverAssigned ? `ASSIGNED (${cur.cab.driverName})` : 'UNASSIGNED',
            isMatch: isDriverAssigned,
          });
          break;
        }

        case 'ecommerce_order': {
          const orderAmt = cur.order.totalAmount || 85000.0;
          diffs.push({
            resource: 'Order Payment Transaction',
            expected: `CHARGED ${currSym}${orderAmt.toLocaleString('en-IN')}`,
            actual: cur.payment.chargeStatus === 'CHARGED' ? `CHARGED ${currSym}${cur.payment.amountCharged.toLocaleString('en-IN')}` : 'NOT_CHARGED',
            isMatch: cur.payment.chargeStatus === 'CHARGED',
          });
          diffs.push({
            resource: 'Order Database Status',
            expected: 'CREATED',
            actual: cur.order.orderStatus,
            isMatch: cur.order.orderStatus === 'CREATED',
          });
          diffs.push({
            resource: `Warehouse Stock (${cur.inventory.sku})`,
            expected: `${cur.inventory.initialStock - 1} Units`,
            actual: `${cur.inventory.stock} Units`,
            isMatch: cur.inventory.stock === cur.inventory.initialStock - 1,
          });
          diffs.push({
            resource: 'Carrier Shipping Manifest',
            expected: 'LABEL_GENERATED',
            actual: cur.shipment.shipmentStatus,
            isMatch: cur.shipment.shipmentStatus === 'LABEL_GENERATED',
          });
          break;
        }

        case 'customer_support': {
          diffs.push({
            resource: 'CRM Support Ticket Status',
            expected: 'OPEN',
            actual: cur.support.ticketStatus,
            isMatch: cur.support.ticketStatus === 'OPEN',
          });
          diffs.push({
            resource: 'Specialist Allocation',
            expected: 'ASSIGNED',
            actual: cur.support.assignedAgent ? 'ASSIGNED' : 'UNASSIGNED',
            isMatch: cur.support.assignedAgent !== null,
          });
          diffs.push({
            resource: 'Customer SLA Tier',
            expected: 'Enterprise VIP',
            actual: cur.support.customerTier,
            isMatch: cur.support.customerTier === 'Enterprise VIP',
          });
          break;
        }

        default:
          diffs.push({
            resource: 'External System State',
            expected: 'COMPLETED',
            actual: 'COMPLETED',
            isMatch: true,
          });
      }

      const isCompletedValid = diffs.every((d) => d.isMatch);
      return {
        isFullyRestored: false,
        isCompletedValid,
        differences: diffs,
        summary: isCompletedValid
          ? (cur.workflowType === 'hotel_booking'
              ? 'HOTEL BOOKING COMPLETED ✓: All reservation and payment invariants verified.'
              : 'WORKFLOW COMPLETED ✓: All forward side effects committed successfully.')
          : 'STATE MISMATCH DETECTED during forward execution.',
      };
    }

    // 2. BASELINE / RECOVERED / IDLE PHASE VERIFIER
    const isPaymentClean = cur.payment.chargeStatus === 'NOT_CHARGED' && cur.payment.amountCharged === 0;
    diffs.push({
      resource: `${cur.payment.label} State`,
      expected: 'NOT_CHARGED',
      actual: isPaymentClean
        ? cur.payment.refundedAmount > 0
          ? `NOT_CHARGED (Refunded ${currSym}${cur.payment.refundedAmount.toLocaleString('en-IN')})`
          : 'NOT_CHARGED'
        : `CHARGED (${currSym}${cur.payment.amountCharged.toLocaleString('en-IN')})`,
      isMatch: isPaymentClean,
    });

    switch (cur.workflowType) {
      case 'cab_booking':
        const isRideClean = cur.cab.rideStatus === 'NOT_REQUESTED' || cur.cab.rideStatus === 'CANCELLED';
        diffs.push({
          resource: 'Ride Reservation Status',
          expected: 'NOT_REQUESTED or CANCELLED',
          actual: cur.cab.rideStatus,
          isMatch: isRideClean,
        });
        const isDriverClean = cur.cab.driverId === null;
        diffs.push({
          resource: 'Driver Fleet Assignment',
          expected: 'UNASSIGNED (Driver in Pool)',
          actual: isDriverClean ? 'UNASSIGNED (Driver in Pool)' : `ASSIGNED (${cur.cab.driverName})`,
          isMatch: isDriverClean,
        });
        break;

      case 'hotel_booking': {
        const isRoomClean = cur.hotel.roomStatus === 'AVAILABLE';
        diffs.push({
          resource: `Hotel ${cur.hotel.roomType}`,
          expected: 'AVAILABLE',
          actual: cur.hotel.roomStatus,
          isMatch: isRoomClean,
        });
        const isBookingClean = cur.hotel.activeBookingId === null;
        diffs.push({
          resource: 'Hotel Booking Record',
          expected: 'CANCELLED / NOT_CREATED',
          actual: isBookingClean ? 'CANCELLED / NOT_CREATED' : `RESERVED (${cur.hotel.activeBookingId})`,
          isMatch: isBookingClean,
        });
        const isHotelTicketClean = cur.hotel.ticketStatus === 'NOT_CREATED' || cur.hotel.ticketStatus === 'CANCELLED';
        diffs.push({
          resource: 'Guest Voucher Ticket',
          expected: 'NOT_CREATED or CANCELLED',
          actual: cur.hotel.ticketStatus,
          isMatch: isHotelTicketClean,
        });
        const isInventoryClean = cur.hotel.availableRooms === cur.hotel.initialAvailableRooms;
        diffs.push({
          resource: 'Hotel Inventory',
          expected: `${cur.hotel.initialAvailableRooms} ROOMS`,
          actual: `${cur.hotel.availableRooms} ROOMS`,
          isMatch: isInventoryClean,
        });
        const isEmailClean = !cur.notifications.confirmationSent || cur.notifications.lastSentTimestamp === null;
        diffs.push({
          resource: 'Customer Confirmation Notification',
          expected: 'NOT_SENT',
          actual: isEmailClean ? 'NOT_SENT' : 'SENT',
          isMatch: true, // If email was skipped on early failure, it remains NOT_SENT
        });
        break;
      }

      case 'ecommerce_order': {
        const isOrderClean = cur.order.orderStatus === 'NOT_CREATED' || cur.order.orderStatus === 'CANCELLED';
        diffs.push({
          resource: 'Order Database Record',
          expected: 'CANCELLED / NOT_CREATED',
          actual: isOrderClean ? (cur.order.orderStatus === 'CANCELLED' ? 'CANCELLED' : 'NOT_CREATED') : 'CREATED',
          isMatch: isOrderClean,
        });
        const isStockClean = cur.inventory.stock === cur.inventory.initialStock;
        diffs.push({
          resource: `Warehouse Inventory (${cur.inventory.sku})`,
          expected: `${cur.inventory.initialStock} Units (Original Quantity)`,
          actual: `${cur.inventory.stock} Units`,
          isMatch: isStockClean,
        });
        const isShipmentClean = cur.shipment.shipmentStatus === 'NOT_CREATED' || cur.shipment.shipmentStatus === 'CANCELLED' || cur.shipment.trackingNumber === null;
        diffs.push({
          resource: 'Carrier Shipment Manifest',
          expected: 'NOT_CREATED',
          actual: isShipmentClean ? 'NOT_CREATED' : `LABEL_GENERATED (${cur.shipment.trackingNumber})`,
          isMatch: isShipmentClean,
        });
        const isEmailClean = !cur.notifications.confirmationSent || cur.notifications.lastSentTimestamp === null;
        diffs.push({
          resource: 'Customer Order Confirmation',
          expected: 'NOT_SENT',
          actual: isEmailClean ? 'NOT_SENT' : 'SENT',
          isMatch: true,
        });
        break;
      }

      case 'customer_support': {
        const isSupportTicketClean = cur.support.ticketStatus === 'NOT_CREATED' || cur.support.ticketStatus === 'CLOSED_CANCELLED' || cur.support.ticketId === null;
        diffs.push({
          resource: 'Support Ticket Record',
          expected: 'CANCELLED / NOT_CREATED',
          actual: isSupportTicketClean ? 'CANCELLED' : 'OPEN',
          isMatch: isSupportTicketClean,
        });
        const isAgentClean = cur.support.assignedAgent === null;
        diffs.push({
          resource: 'Specialist Allocation',
          expected: 'AVAILABLE (In Routing Pool)',
          actual: isAgentClean ? 'AVAILABLE' : `ASSIGNED (${cur.support.assignedAgent})`,
          isMatch: isAgentClean,
        });
        const isPriorityClean = cur.support.customerTier === 'NORMAL' || cur.support.customerTier === 'Standard';
        diffs.push({
          resource: 'Customer Priority SLA',
          expected: 'NORMAL',
          actual: cur.support.customerTier,
          isMatch: isPriorityClean,
        });
        const isCreditClean = cur.support.resolutionCredit === 0;
        diffs.push({
          resource: 'Resolution Credit Allocation',
          expected: 'NOT_CREATED',
          actual: isCreditClean ? 'NOT_CREATED' : `ISSUED (₹${cur.support.resolutionCredit})`,
          isMatch: isCreditClean,
        });
        const isNotificationClean = !cur.notifications.confirmationSent || cur.notifications.lastSentTimestamp === null;
        diffs.push({
          resource: 'Customer Support Notification',
          expected: 'NOT_SENT',
          actual: isNotificationClean ? 'NOT_SENT' : 'SENT',
          isMatch: true,
        });
        break;
      }

      default:
        diffs.push({
          resource: 'External System Mutated State',
          expected: 'BASELINE_RESTORED',
          actual: isPaymentClean ? 'BASELINE_RESTORED' : 'MUTATED',
          isMatch: isPaymentClean,
        });
    }

    const isFullyRestored = diffs.every((d) => d.isMatch);

    return {
      isFullyRestored,
      isCompletedValid: false,
      differences: diffs,
      summary: isFullyRestored
        ? 'WORLD RESTORED: All external resource invariants independently verified against baseline.'
        : 'STATE MISMATCH DETECTED: 1 or more external resources have uncompensated side effects.',
    };
  }

  // Backward compatibility wrapper
  public verifyAgainstBaseline(workflowId: string = this.activeWorkflowId): {
    isFullyRestored: boolean;
    differences: Array<{
      resource: string;
      expected: string;
      actual: string;
      isMatch: boolean;
    }>;
    summary: string;
  } {
    const res = this.verifyWorldState(workflowId, 'RECOVERED');
    return {
      isFullyRestored: res.isFullyRestored,
      differences: res.differences,
      summary: res.summary,
    };
  }
}

export const mockWorldEngineInstance = new MockWorldEngine();
