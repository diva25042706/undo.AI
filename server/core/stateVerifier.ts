// ============================================================================
// UNDO.AI (AG02) — DETERMINISTIC WORLD STATE VERIFIER
// Strict mathematical invariant validation across all domains
// ============================================================================

import type { DomainWorldState } from './mockWorld.ts';
import type { InvariantResult, StateVerificationResult, WorkflowType } from './types.ts';

export class StateVerifier {
  public verifyWorldRestored(
    workflowType: WorkflowType,
    currentState: DomainWorldState,
    _initialParameters?: Record<string, any>
  ): StateVerificationResult {
    const invariants: InvariantResult[] = [];

    switch (workflowType) {
      case 'cab_booking': {
        const cab = currentState.cab;
        const driverState = cab?.driver?.state || 'UNKNOWN';
        const rideState = cab?.ride?.state || 'UNKNOWN';
        const paymentState = cab?.payment?.state || 'UNKNOWN';

        invariants.push({
          name: 'Driver returned to fleet',
          resource: 'driver.state',
          expected: 'AVAILABLE',
          actual: driverState,
          passed: driverState === 'AVAILABLE',
        });

        invariants.push({
          name: 'Ride cancelled',
          resource: 'ride.state',
          expected: 'CANCELLED',
          actual: rideState,
          passed: rideState === 'CANCELLED' || rideState === 'NOT_CREATED',
        });

        invariants.push({
          name: 'Payment restored',
          resource: 'payment.state',
          expected: 'NOT_CHARGED',
          actual: paymentState,
          passed: paymentState === 'NOT_CHARGED' || paymentState === 'REFUNDED',
        });
        break;
      }

      case 'hotel_booking': {
        const hotel = currentState.hotel;
        const roomState = hotel?.room?.state || 'UNKNOWN';
        const bookingState = hotel?.booking?.state || 'UNKNOWN';
        const paymentState = hotel?.payment?.state || 'UNKNOWN';

        invariants.push({
          name: 'Hotel room returned to inventory',
          resource: 'room.state',
          expected: 'AVAILABLE',
          actual: roomState,
          passed: roomState === 'AVAILABLE',
        });

        invariants.push({
          name: 'Reservation cancelled',
          resource: 'booking.state',
          expected: 'CANCELLED',
          actual: bookingState,
          passed: bookingState === 'CANCELLED' || bookingState === 'NOT_CREATED',
        });

        invariants.push({
          name: 'Payment refunded / not charged',
          resource: 'payment.state',
          expected: 'NOT_CHARGED',
          actual: paymentState,
          passed: paymentState === 'NOT_CHARGED' || paymentState === 'REFUNDED',
        });

        const ticketState = hotel?.ticket?.state || 'NOT_CREATED';
        invariants.push({
          name: 'Booking ticket voided / uncreated',
          resource: 'ticket.state',
          expected: 'NOT_CREATED',
          actual: ticketState,
          passed: ticketState === 'CANCELLED' || ticketState === 'NOT_CREATED',
        });
        break;
      }

      case 'ecommerce_order': {
        const ecom = currentState.ecommerce;
        const invState = ecom?.inventory?.state || 'UNKNOWN';
        const orderState = ecom?.order?.state || 'UNKNOWN';
        const paymentState = ecom?.payment?.state || 'UNKNOWN';

        invariants.push({
          name: 'Inventory returned to stock',
          resource: 'inventory.state',
          expected: 'IN_STOCK',
          actual: invState,
          passed: invState === 'IN_STOCK',
        });

        invariants.push({
          name: 'Order status cancelled',
          resource: 'order.state',
          expected: 'CANCELLED',
          actual: orderState,
          passed: orderState === 'CANCELLED' || orderState === 'NOT_CREATED',
        });

        invariants.push({
          name: 'Payment reversed',
          resource: 'payment.state',
          expected: 'NOT_CHARGED',
          actual: paymentState,
          passed: paymentState === 'NOT_CHARGED' || paymentState === 'REFUNDED',
        });
        break;
      }

      case 'delivery': {
        const del = currentState.delivery;
        const courierState = del?.courier?.state || 'UNKNOWN';
        const manifestState = del?.manifest?.state || 'UNKNOWN';
        const feeState = del?.fee?.state || 'UNKNOWN';

        invariants.push({
          name: 'Courier courier freed to pool',
          resource: 'courier.state',
          expected: 'AVAILABLE',
          actual: courierState,
          passed: courierState === 'AVAILABLE',
        });

        invariants.push({
          name: 'Manifest cancelled',
          resource: 'manifest.state',
          expected: 'CANCELLED',
          actual: manifestState,
          passed: manifestState === 'CANCELLED' || manifestState === 'NOT_CREATED',
        });

        invariants.push({
          name: 'Delivery fee refunded',
          resource: 'fee.state',
          expected: 'NOT_CHARGED',
          actual: feeState,
          passed: feeState === 'NOT_CHARGED' || feeState === 'REFUNDED',
        });
        break;
      }

      case 'customer_support':
      case 'restaurant_reservation':
      default: {
        const supp = currentState.support;
        const priorityState = supp?.ticket?.priority || 'UNKNOWN';
        const creditState = supp?.credit?.state || 'UNKNOWN';

        invariants.push({
          name: 'Priority reset to standard',
          resource: 'ticket.priority',
          expected: 'STANDARD',
          actual: priorityState,
          passed: priorityState === 'STANDARD',
        });

        invariants.push({
          name: 'Credit reversed',
          resource: 'credit.state',
          expected: 'NOT_ISSUED',
          actual: creditState,
          passed: creditState === 'NOT_ISSUED' || creditState === 'REVERSED',
        });
        break;
      }
    }

    const checkedInvariants = invariants.length;
    const passedInvariants = invariants.filter((i) => i.passed).length;
    const failedInvariants = invariants.filter((i) => !i.passed).map((i) => i.name);
    const verified = checkedInvariants > 0 && passedInvariants === checkedInvariants;

    return {
      verified,
      status: verified ? 'WORLD_RESTORED' : 'STATE_MISMATCH',
      invariants,
      checkedInvariants,
      passedInvariants,
      failedInvariants,
      actualStateHash: `HASH-${Buffer.from(JSON.stringify(currentState)).toString('base64').substring(0, 16)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export const stateVerifier = new StateVerifier();
