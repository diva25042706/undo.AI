// ============================================================================
// UNDO.AI (AG02) — MOCK WORLD STATE ENGINE
// Deterministic state container for all workflow domains
// ============================================================================

export interface CabWorldState {
  driver: {
    driverId: string;
    name: string;
    state: 'AVAILABLE' | 'ASSIGNED' | 'EN_ROUTE' | 'BUSY';
    location: string;
  };
  ride: {
    rideId: string;
    state: 'NOT_CREATED' | 'PENDING' | 'RESERVED' | 'ACTIVE' | 'CANCELLED';
    pickup: string;
    destination: string;
    otp?: string;
  };
  payment: {
    state: 'NOT_CHARGED' | 'HELD_ESCROW' | 'CHARGED' | 'REFUNDED';
    fare: number;
    currency: string;
    transactionId?: string;
  };
}

export interface HotelWorldState {
  room: {
    roomId: string;
    hotelName: string;
    roomType: string;
    state: 'AVAILABLE' | 'SELECTED' | 'RESERVED' | 'OCCUPIED';
  };
  booking: {
    bookingId: string;
    state: 'NOT_CREATED' | 'CONFIRMED' | 'CANCELLED';
  };
  payment: {
    state: 'NOT_CHARGED' | 'CHARGED' | 'REFUNDED';
    amount: number;
    currency: string;
    transactionId?: string;
  };
  ticket?: {
    ticketId: string;
    state: 'NOT_CREATED' | 'CREATED' | 'CANCELLED';
  };
}

export interface EcommerceWorldState {
  inventory: {
    sku: string;
    item: string;
    state: 'IN_STOCK' | 'ALLOCATED' | 'OUT_OF_STOCK';
    warehouse: string;
  };
  order: {
    orderId: string;
    state: 'NOT_CREATED' | 'PLACED' | 'MANIFESTED' | 'CANCELLED';
  };
  payment: {
    state: 'NOT_CHARGED' | 'CHARGED' | 'REFUNDED';
    amount: number;
    currency: string;
    transactionId?: string;
  };
}

export interface DeliveryWorldState {
  courier: {
    courierId: string;
    name: string;
    state: 'AVAILABLE' | 'ASSIGNED' | 'DISPATCHED';
  };
  manifest: {
    manifestId: string;
    state: 'NOT_CREATED' | 'MANIFESTED' | 'DISPATCHED' | 'CANCELLED';
  };
  fee: {
    state: 'NOT_CHARGED' | 'CHARGED' | 'REFUNDED';
    amount: number;
    currency: string;
  };
}

export interface SupportWorldState {
  ticket: {
    ticketId: string;
    priority: 'STANDARD' | 'ESCALATED';
    state?: 'OPEN' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  };
  agent?: {
    agentId: string | null;
    state: 'AVAILABLE' | 'ASSIGNED' | 'BUSY';
  };
  credit: {
    state: 'NOT_ISSUED' | 'ISSUED' | 'REVERSED';
    amount: number;
  };
}

export interface DomainWorldState {
  cab?: CabWorldState;
  hotel?: HotelWorldState;
  ecommerce?: EcommerceWorldState;
  delivery?: DeliveryWorldState;
  support?: SupportWorldState;
}

export class WorldStateManager {
  private states = new Map<string, DomainWorldState>();

  public getOrCreateWorldState(workflowId: string, workflowType: string, parameters: Record<string, any>): DomainWorldState {
    if (this.states.has(workflowId)) {
      return this.states.get(workflowId)!;
    }

    const state = this.createInitialWorldState(workflowType, parameters);
    this.states.set(workflowId, state);
    return state;
  }

  public setWorldState(workflowId: string, state: DomainWorldState) {
    this.states.set(workflowId, JSON.parse(JSON.stringify(state)));
  }

  public getWorldState(workflowId: string): DomainWorldState | undefined {
    return this.states.get(workflowId);
  }

  public createInitialWorldState(workflowType: string, parameters: Record<string, any>): DomainWorldState {
    switch (workflowType) {
      case 'cab_booking':
        return {
          cab: {
            driver: {
              driverId: parameters.driverId || 'DRV-CHN-1042',
              name: parameters.driverName || 'Murugan K',
              state: 'AVAILABLE',
              location: parameters.pickup || 'Thiruvanmiyur',
            },
            ride: {
              rideId: parameters.rideId || `RIDE-CHN-${Math.floor(1000 + Math.random() * 9000)}`,
              state: 'NOT_CREATED',
              pickup: parameters.pickup || 'Thiruvanmiyur',
              destination: parameters.drop || 'OMR / Sholinganallur',
            },
            payment: {
              state: 'NOT_CHARGED',
              fare: parameters.fare || 420.0,
              currency: parameters.currency || 'INR',
            },
          },
        };

      case 'hotel_booking':
        return {
          hotel: {
            room: {
              roomId: parameters.roomId || 'ROOM-CHN-4491',
              hotelName: parameters.hotelName || parameters.hotel || 'Pharos Hotels',
              roomType: parameters.roomType || 'Deluxe Room',
              state: 'AVAILABLE',
            },
            booking: {
              bookingId: parameters.bookingId || `HTL-CHN-${Math.floor(1000 + Math.random() * 9000)}`,
              state: 'NOT_CREATED',
            },
            payment: {
              state: 'NOT_CHARGED',
              amount: parameters.roomPrice || 750.0,
              currency: parameters.currency || 'INR',
            },
            ticket: {
              ticketId: parameters.ticketId || `TKT-HTL-${Math.floor(1000 + Math.random() * 9000)}`,
              state: 'NOT_CREATED',
            },
          },
        };

      case 'ecommerce_order':
        return {
          ecommerce: {
            inventory: {
              sku: 'SKU-LAPTOP-01',
              item: parameters.productName || 'AI Dev Workstation Laptop',
              state: 'IN_STOCK',
              warehouse: parameters.warehouse || 'Velachery Central Hub',
            },
            order: {
              orderId: parameters.orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
              state: 'NOT_CREATED',
            },
            payment: {
              state: 'NOT_CHARGED',
              amount: parameters.price || 85000.0,
              currency: parameters.currency || 'INR',
            },
          },
        };

      case 'delivery':
        return {
          delivery: {
            courier: {
              courierId: 'COU-44',
              name: parameters.driver || 'Ravi S (Courier #44)',
              state: 'AVAILABLE',
            },
            manifest: {
              manifestId: parameters.manifestId || `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
              state: 'NOT_CREATED',
            },
            fee: {
              state: 'NOT_CHARGED',
              amount: parameters.fare || 350.0,
              currency: parameters.currency || 'INR',
            },
          },
        };

      case 'customer_support':
      case 'support_ticket':
      default:
        return {
          support: {
            ticket: {
              ticketId: parameters.ticketId || `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
              priority: 'STANDARD',
            },
            credit: {
              state: 'NOT_ISSUED',
              amount: parameters.creditAmount || 500.0,
            },
          },
        };
    }
  }
}

export const worldStateManager = new WorldStateManager();
