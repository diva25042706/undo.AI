// ============================================================================
// UNDO.AI (AG02) — TOOL & COMPENSATION REGISTRY
// Maps forward actions to their strict inverse compensations
// ============================================================================

import type { DomainWorldState } from './mockWorld.ts';

export interface ToolExecutionResult {
  success: boolean;
  action: string;
  sideEffectDetails: Record<string, any>;
  error?: string;
  worldState: DomainWorldState;
}

export interface CompensationExecutionResult {
  success: boolean;
  compensationAction: string;
  compensatedStepId: string;
  sideEffectReversed: Record<string, any>;
  error?: string;
  worldState: DomainWorldState;
}

export interface ToolDefinition {
  toolId: string;
  name: string;
  reversible: boolean;
  compensationAction: string | null;
  sideEffectType: 'FINANCIAL' | 'INVENTORY' | 'DISPATCH' | 'COMMUNICATION' | 'READ_ONLY' | 'ESCROW';
  executeForward: (params: Record<string, any>, state: DomainWorldState) => Promise<ToolExecutionResult>;
  executeCompensation?: (params: Record<string, any>, state: DomainWorldState) => Promise<CompensationExecutionResult>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool(tool: ToolDefinition) {
    this.tools.set(tool.toolId, tool);
  }

  public getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  public getToolByCompensation(compensationAction: string): ToolDefinition | undefined {
    for (const tool of this.tools.values()) {
      if (tool.compensationAction === compensationAction) {
        return tool;
      }
    }
    return undefined;
  }

  public hasCompensation(toolId: string): boolean {
    const tool = this.tools.get(toolId);
    return !!tool && tool.reversible && !!tool.executeCompensation;
  }

  private registerDefaultTools() {
    // -------------------------------------------------------------
    // CAB BOOKING TOOLS
    // -------------------------------------------------------------
    this.registerTool({
      toolId: 'request_ride',
      name: 'Request Ride',
      reversible: true,
      compensationAction: 'cancel_ride_request',
      sideEffectType: 'DISPATCH',
      executeForward: async (_params, state) => {
        if (!state.cab) state.cab = {} as any;
        state.cab!.ride.state = 'PENDING';
        return {
          success: true,
          action: 'request_ride',
          sideEffectDetails: { rideId: state.cab!.ride.rideId, pickup: state.cab!.ride.pickup, destination: state.cab!.ride.destination },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.cab) {
          state.cab.ride.state = 'NOT_CREATED';
        }
        return {
          success: true,
          compensationAction: 'cancel_ride_request',
          compensatedStepId: 'request_ride',
          sideEffectReversed: { rideState: 'NOT_CREATED' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'assign_driver',
      name: 'Assign Driver',
      reversible: true,
      compensationAction: 'release_driver',
      sideEffectType: 'DISPATCH',
      executeForward: async (_params, state) => {
        if (state.cab) {
          state.cab.driver.state = 'ASSIGNED';
        }
        return {
          success: true,
          action: 'assign_driver',
          sideEffectDetails: { driverId: state.cab?.driver.driverId, driverName: state.cab?.driver.name },
          worldState: state,
        };
      },
      executeCompensation: async (params, state) => {
        if (params.failCompensation) {
          return {
            success: false,
            compensationAction: 'release_driver',
            compensatedStepId: 'assign_driver',
            sideEffectReversed: {},
            error: 'Fleet allocation lock timeout: Driver release failed at dispatch gateway',
            worldState: state,
          };
        }
        if (state.cab) {
          state.cab.driver.state = 'AVAILABLE';
        }
        return {
          success: true,
          compensationAction: 'release_driver',
          compensatedStepId: 'assign_driver',
          sideEffectReversed: { driverState: 'AVAILABLE' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'reserve_cab',
      name: 'Reserve Cab',
      reversible: true,
      compensationAction: 'cancel_ride',
      sideEffectType: 'DISPATCH',
      executeForward: async (_params, state) => {
        if (state.cab) {
          state.cab.ride.state = 'RESERVED';
        }
        return {
          success: true,
          action: 'reserve_cab',
          sideEffectDetails: { rideState: 'RESERVED' },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.cab) {
          state.cab.ride.state = 'CANCELLED';
        }
        return {
          success: true,
          compensationAction: 'cancel_ride',
          compensatedStepId: 'reserve_cab',
          sideEffectReversed: { rideState: 'CANCELLED' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'charge_fare',
      name: 'Charge Fare',
      reversible: true,
      compensationAction: 'refund_payment',
      sideEffectType: 'FINANCIAL',
      executeForward: async (_params, state) => {
        if (state.cab) {
          state.cab.payment.state = 'CHARGED';
          state.cab.payment.transactionId = `TXN-CAB-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        return {
          success: true,
          action: 'charge_fare',
          sideEffectDetails: {
            amount: state.cab?.payment.fare,
            currency: state.cab?.payment.currency,
            transactionId: state.cab?.payment.transactionId,
          },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.cab) {
          state.cab.payment.state = 'NOT_CHARGED';
        }
        return {
          success: true,
          compensationAction: 'refund_payment',
          compensatedStepId: 'charge_fare',
          sideEffectReversed: { paymentState: 'NOT_CHARGED', refundedAmount: state.cab?.payment.fare },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'dispatch_otp',
      name: 'Dispatch Ride OTP',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'COMMUNICATION',
      executeForward: async (_params, state) => {
        if (state.cab) {
          state.cab.ride.otp = '4491';
        }
        return {
          success: true,
          action: 'dispatch_otp',
          sideEffectDetails: { otpSent: true },
          worldState: state,
        };
      },
    });

    // -------------------------------------------------------------
    // HOTEL BOOKING TOOLS
    // -------------------------------------------------------------
    this.registerTool({
      toolId: 'search_hotels',
      name: 'Search Nearby Chennai Hotels',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'READ_ONLY',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'search_hotels',
        sideEffectDetails: {
          hotelsFound: 3,
          hotels: ['Pharos Hotels', 'Park Avenue', 'UPAR Hotels'],
          area: 'Nungambakkam, Chennai',
        },
        worldState: state,
      }),
    });

    this.registerTool({
      toolId: 'search_room',
      name: 'Search Room',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'READ_ONLY',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'search_room',
        sideEffectDetails: { roomsFound: 1 },
        worldState: state,
      }),
    });

    this.registerTool({
      toolId: 'select_room',
      name: 'Select Available Room',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'READ_ONLY',
      executeForward: async (params, state) => {
        if (state.hotel) {
          state.hotel.room.state = 'SELECTED';
          if (params.roomId) state.hotel.room.roomId = params.roomId;
          if (params.roomType) state.hotel.room.roomType = params.roomType;
        }
        return {
          success: true,
          action: 'select_room',
          sideEffectDetails: {
            roomState: 'SELECTED',
            roomId: state.hotel?.room.roomId,
            roomType: state.hotel?.room.roomType,
            tariff: state.hotel?.payment.amount,
          },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'reserve_room',
      name: 'Reserve Room',
      reversible: true,
      compensationAction: 'cancel_room_booking',
      sideEffectType: 'INVENTORY',
      executeForward: async (params, state) => {
        if (state.hotel) {
          state.hotel.room.state = 'RESERVED';
          state.hotel.booking.state = 'CONFIRMED';
          if (params.bookingId) state.hotel.booking.bookingId = params.bookingId;
        }
        return {
          success: true,
          action: 'reserve_room',
          sideEffectDetails: { roomState: 'RESERVED', bookingState: 'CONFIRMED', bookingId: state.hotel?.booking.bookingId },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.hotel) {
          state.hotel.room.state = 'AVAILABLE';
          state.hotel.booking.state = 'CANCELLED';
        }
        return {
          success: true,
          compensationAction: 'cancel_room_booking',
          compensatedStepId: 'reserve_room',
          sideEffectReversed: { roomState: 'AVAILABLE', bookingState: 'CANCELLED' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'charge_card',
      name: 'Charge Credit Card',
      reversible: true,
      compensationAction: 'refund_payment',
      sideEffectType: 'FINANCIAL',
      executeForward: async (params, state) => {
        if (state.hotel) {
          state.hotel.payment.state = 'CHARGED';
          state.hotel.payment.transactionId = params.txnId || `TXN-HOTEL-${Math.floor(1000 + Math.random() * 9000)}`;
          if (typeof params.amount === 'number') state.hotel.payment.amount = params.amount;
        }
        return {
          success: true,
          action: 'charge_card',
          sideEffectDetails: {
            amount: state.hotel?.payment.amount,
            currency: state.hotel?.payment.currency,
            transactionId: state.hotel?.payment.transactionId,
          },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.hotel) {
          state.hotel.payment.state = 'NOT_CHARGED';
        }
        return {
          success: true,
          compensationAction: 'refund_payment',
          compensatedStepId: 'charge_card',
          sideEffectReversed: { paymentState: 'NOT_CHARGED', refundedAmount: state.hotel?.payment.amount },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'charge_payment',
      name: 'Charge Payment',
      reversible: true,
      compensationAction: 'refund_payment',
      sideEffectType: 'FINANCIAL',
      executeForward: async (params, state) => {
        if (state.hotel) {
          state.hotel.payment.state = 'CHARGED';
          state.hotel.payment.transactionId = params.txnId || `PAY-HTL-${Math.floor(1000 + Math.random() * 9000)}`;
          if (typeof params.amount === 'number') state.hotel.payment.amount = params.amount;
        }
        return {
          success: true,
          action: 'charge_payment',
          sideEffectDetails: {
            amount: state.hotel?.payment.amount,
            currency: state.hotel?.payment.currency,
            transactionId: state.hotel?.payment.transactionId,
          },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.hotel) {
          state.hotel.payment.state = 'NOT_CHARGED';
        }
        return {
          success: true,
          compensationAction: 'refund_payment',
          compensatedStepId: 'charge_payment',
          sideEffectReversed: { paymentState: 'NOT_CHARGED', refundedAmount: state.hotel?.payment.amount },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'create_booking_ticket',
      name: 'Create Booking Ticket Voucher',
      reversible: true,
      compensationAction: 'cancel_booking_ticket',
      sideEffectType: 'INVENTORY',
      executeForward: async (params, state) => {
        if (state.hotel) {
          state.hotel.ticket = {
            ticketId: params.ticketId || `TKT-HTL-${Math.floor(1000 + Math.random() * 9000)}`,
            state: 'CREATED',
          };
        }
        return {
          success: true,
          action: 'create_booking_ticket',
          sideEffectDetails: { ticketId: state.hotel?.ticket?.ticketId, ticketState: 'CREATED' },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.hotel && state.hotel.ticket) {
          state.hotel.ticket.state = 'CANCELLED';
        }
        return {
          success: true,
          compensationAction: 'cancel_booking_ticket',
          compensatedStepId: 'create_booking_ticket',
          sideEffectReversed: { ticketState: 'CANCELLED' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'send_booking_confirmation',
      name: 'Send Booking Confirmation Email',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'COMMUNICATION',
      executeForward: async (params, state) => ({
        success: true,
        action: 'send_booking_confirmation',
        sideEffectDetails: { confirmationSent: true, recipient: params.email, bookingId: state.hotel?.booking.bookingId },
        worldState: state,
      }),
    });

    this.registerTool({
      toolId: 'send_confirmation',
      name: 'Send Confirmation',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'COMMUNICATION',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'send_confirmation',
        sideEffectDetails: { confirmationSent: true },
        worldState: state,
      }),
    });

    // -------------------------------------------------------------
    // E-COMMERCE TOOLS
    // -------------------------------------------------------------
    this.registerTool({
      toolId: 'validate_product',
      name: 'Validate Product & Price',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'READ_ONLY',
      executeForward: async (params, state) => ({
        success: true,
        action: 'validate_product',
        sideEffectDetails: {
          productId: params.productId || 'PRD-IPHONE-15',
          price: params.price || 85000.0,
          inStock: true,
        },
        worldState: state,
      }),
    });

    this.registerTool({
      toolId: 'create_order',
      name: 'Create Order Record',
      reversible: true,
      compensationAction: 'cancel_order',
      sideEffectType: 'INVENTORY',
      executeForward: async (params, state) => {
        if (state.ecommerce) {
          state.ecommerce.order.state = 'PLACED';
          state.ecommerce.order.orderId = params.orderId || 'ORD-1001';
        }
        return {
          success: true,
          action: 'create_order',
          sideEffectDetails: { orderState: 'PLACED', orderId: params.orderId || 'ORD-1001' },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.ecommerce) {
          state.ecommerce.order.state = 'CANCELLED';
        }
        return {
          success: true,
          compensationAction: 'cancel_order',
          compensatedStepId: 'create_order',
          sideEffectReversed: { orderState: 'CANCELLED' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'reserve_inventory',
      name: 'Reserve Inventory',
      reversible: true,
      compensationAction: 'release_inventory',
      sideEffectType: 'INVENTORY',
      executeForward: async (_params, state) => {
        if (state.ecommerce) {
          state.ecommerce.inventory.state = 'ALLOCATED';
        }
        return {
          success: true,
          action: 'reserve_inventory',
          sideEffectDetails: { inventoryState: 'ALLOCATED' },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.ecommerce) {
          state.ecommerce.inventory.state = 'IN_STOCK';
        }
        return {
          success: true,
          compensationAction: 'release_inventory',
          compensatedStepId: 'reserve_inventory',
          sideEffectReversed: { inventoryState: 'IN_STOCK' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'capture_payment',
      name: 'Capture Payment',
      reversible: true,
      compensationAction: 'refund_payment',
      sideEffectType: 'FINANCIAL',
      executeForward: async (params, state) => {
        if (state.ecommerce) {
          state.ecommerce.payment.state = 'CHARGED';
          state.ecommerce.payment.transactionId = params.txnId || `TXN-ECOM-${Math.floor(1000 + Math.random() * 9000)}`;
          if (typeof params.price === 'number') state.ecommerce.payment.amount = params.price;
        }
        return {
          success: true,
          action: 'capture_payment',
          sideEffectDetails: {
            amount: state.ecommerce?.payment.amount || 85000,
            transactionId: state.ecommerce?.payment.transactionId,
          },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.ecommerce) {
          state.ecommerce.payment.state = 'NOT_CHARGED';
        }
        return {
          success: true,
          compensationAction: 'refund_payment',
          compensatedStepId: 'capture_payment',
          sideEffectReversed: { paymentState: 'NOT_CHARGED', refundedAmount: state.ecommerce?.payment.amount || 85000 },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'process_order_payment',
      name: 'Process Order Payment',
      reversible: true,
      compensationAction: 'refund_order_payment',
      sideEffectType: 'FINANCIAL',
      executeForward: async (_params, state) => {
        if (state.ecommerce) {
          state.ecommerce.payment.state = 'CHARGED';
          state.ecommerce.payment.transactionId = `TXN-ECOM-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        return {
          success: true,
          action: 'process_order_payment',
          sideEffectDetails: {
            amount: state.ecommerce?.payment.amount,
            transactionId: state.ecommerce?.payment.transactionId,
          },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.ecommerce) {
          state.ecommerce.payment.state = 'NOT_CHARGED';
        }
        return {
          success: true,
          compensationAction: 'refund_order_payment',
          compensatedStepId: 'process_order_payment',
          sideEffectReversed: { paymentState: 'NOT_CHARGED', refundedAmount: state.ecommerce?.payment.amount },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'generate_shipment_label',
      name: 'Generate Shipment Label',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'DISPATCH',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'generate_shipment_label',
        sideEffectDetails: { shipmentLabelId: 'LBL-ECOM-8831' },
        worldState: state,
      }),
    });

    this.registerTool({
      toolId: 'send_order_confirmation',
      name: 'Send Order Confirmation',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'COMMUNICATION',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'send_order_confirmation',
        sideEffectDetails: { confirmationSent: true },
        worldState: state,
      }),
    });

    // -------------------------------------------------------------
    // CUSTOMER SUPPORT TOOLS
    // -------------------------------------------------------------
    this.registerTool({
      toolId: 'fetch_account_status',
      name: 'Fetch Account & History',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'READ_ONLY',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'fetch_account_status',
        sideEffectDetails: { accountTier: 'PLATINUM', openDisputes: 0 },
        worldState: state,
      }),
    });

    this.registerTool({
      toolId: 'verify_customer_identity',
      name: 'Verify Identity & Authorization',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'READ_ONLY',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'verify_customer_identity',
        sideEffectDetails: { identityVerified: true },
        worldState: state,
      }),
    });

    this.registerTool({
      toolId: 'escalate_ticket_priority',
      name: 'Escalate Ticket Priority',
      reversible: true,
      compensationAction: 'demote_ticket_priority',
      sideEffectType: 'INVENTORY',
      executeForward: async (_params, state) => {
        if (state.support) {
          state.support.ticket.priority = 'ESCALATED';
          state.support.ticket.state = 'ESCALATED';
        }
        return {
          success: true,
          action: 'escalate_ticket_priority',
          sideEffectDetails: { priority: 'ESCALATED', ticketState: 'ESCALATED' },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.support) {
          state.support.ticket.priority = 'STANDARD';
          state.support.ticket.state = 'OPEN';
        }
        return {
          success: true,
          compensationAction: 'demote_ticket_priority',
          compensatedStepId: 'escalate_ticket_priority',
          sideEffectReversed: { priority: 'STANDARD', ticketState: 'OPEN' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'assign_specialist_agent',
      name: 'Assign Specialist Agent',
      reversible: true,
      compensationAction: 'unassign_specialist_agent',
      sideEffectType: 'DISPATCH',
      executeForward: async (_params, state) => {
        if (state.support) {
          state.support.agent = {
            state: 'ASSIGNED',
            agentId: 'AGT-TIER2-9921',
          };
        }
        return {
          success: true,
          action: 'assign_specialist_agent',
          sideEffectDetails: { agentState: 'ASSIGNED', agentId: 'AGT-TIER2-9921' },
          worldState: state,
        };
      },
      executeCompensation: async (_params, state) => {
        if (state.support) {
          state.support.agent = {
            state: 'AVAILABLE',
            agentId: null,
          };
        }
        return {
          success: true,
          compensationAction: 'unassign_specialist_agent',
          compensatedStepId: 'assign_specialist_agent',
          sideEffectReversed: { agentState: 'AVAILABLE' },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'issue_resolution_credit',
      name: 'Issue Resolution Credit',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'FINANCIAL',
      executeForward: async (params, state) => {
        if (state.support) {
          state.support.credit.state = 'ISSUED';
          state.support.credit.amount = params.creditAmount || 500;
        }
        return {
          success: true,
          action: 'issue_resolution_credit',
          sideEffectDetails: { creditState: 'ISSUED', amount: params.creditAmount || 500 },
          worldState: state,
        };
      },
    });

    this.registerTool({
      toolId: 'send_ticket_resolution_notice',
      name: 'Send Resolution Notice',
      reversible: false,
      compensationAction: null,
      sideEffectType: 'COMMUNICATION',
      executeForward: async (_params, state) => ({
        success: true,
        action: 'send_ticket_resolution_notice',
        sideEffectDetails: { noticeSent: true },
        worldState: state,
      }),
    });
  }
}

export const toolRegistry = new ToolRegistry();
