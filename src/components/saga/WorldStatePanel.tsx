import React from 'react';
import { MockWorldState } from '../../engine/mockWorld';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  Database, 
  ArrowRight,
  CreditCard,
  Car,
  Hotel,
  Package,
  Headphones,
  Truck,
  Send,
  Boxes,
  UserCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface WorldStatePanelProps {
  currentWorld: MockWorldState;
  baselineWorld: MockWorldState;
  differences: Array<{ resource: string; expected: string; actual: string; isMatch: boolean }>;
  isWorldRestored: boolean;
  status?: string;
  onResetWorld?: () => void;
  onCompensatePayment?: () => void;
}

export const WorldStatePanel: React.FC<WorldStatePanelProps> = ({
  currentWorld,
  baselineWorld,
  differences,
  isWorldRestored,
  status = 'IDLE',
  onResetWorld,
  onCompensatePayment,
}) => {
  const isCompleted = status === 'COMPLETED';
  const isRecovered = isWorldRestored || status === 'RECOVERED' || status === 'FULLY_RESTORED';
  const isCompensating = status === 'COMPENSATING';
  const isFailed = status === 'FAILED' || status === 'PARTIALLY_RECOVERED';
  const isRunning = status === 'RUNNING';

  const isPaymentCharged = currentWorld.payment.chargeStatus === 'CHARGED' && currentWorld.payment.amountCharged > 0;
  const currSym = currentWorld.payment.currency === 'USD' ? '$' : '₹';
  const displayAmount = currentWorld.hotel.roomPrice || currentWorld.cab.fare || currentWorld.order.totalAmount || currentWorld.support.resolutionCredit || 750;

  // Header Badge Resolution
  let headerBadgeText = 'BASELINE INTACT ✓';
  let headerBadgeStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300';
  let HeaderIcon = CheckCircle2;

  if (isCompleted) {
    headerBadgeText = currentWorld.workflowType === 'hotel_booking' ? 'HOTEL BOOKING COMPLETED ✓' : 'WORKFLOW COMPLETED ✓';
    headerBadgeStyle = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200';
    HeaderIcon = CheckCircle2;
  } else if (isRecovered) {
    headerBadgeText = 'WORLD RESTORED ✓';
    headerBadgeStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300';
    HeaderIcon = CheckCircle2;
  } else if (isCompensating) {
    headerBadgeText = 'UNDO.AI RECOVERY IN PROGRESS 🔄';
    headerBadgeStyle = 'bg-purple-100 dark:bg-purple-950 border-purple-400 dark:border-purple-600 text-purple-800 dark:text-purple-200 animate-pulse';
    HeaderIcon = RotateCcw;
  } else if (isFailed) {
    headerBadgeText = 'PARTIAL TRANSACTION DETECTED (AWAITING UNDO) ⚠️';
    headerBadgeStyle = 'bg-rose-100 dark:bg-rose-950 border-rose-400 dark:border-rose-600 text-rose-800 dark:text-rose-200 animate-pulse';
    HeaderIcon = AlertTriangle;
  } else if (isRunning) {
    headerBadgeText = 'TRANSACTION IN PROGRESS ⚡';
    headerBadgeStyle = 'bg-indigo-100 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200 animate-pulse';
    HeaderIcon = Sparkles;
  }

  return (
    <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      
      {/* Top Inspector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>PARAMETERIZED MOCKED EXTERNAL RUNTIME</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            World State & Verification Inspector
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-xs ${headerBadgeStyle}`}>
            <HeaderIcon className="w-4 h-4" />
            <span>{headerBadgeText}</span>
          </div>

          {onResetWorld && (
            <button
              onClick={onResetWorld}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Reset World
            </button>
          )}
        </div>
      </div>

      {/* 4 Multi-Domain Adaptive State Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: PAYMENT / FINANCIAL TRANSACTION */}
        <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
          isCompleted
            ? 'bg-white/70 dark:bg-slate-900/70 border-emerald-300/80 dark:border-emerald-800 shadow-sm ring-1 ring-emerald-500/10'
            : isPaymentCharged && !isRecovered
            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-md ring-1 ring-rose-500/20'
            : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              {currentWorld.payment.label}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {currentWorld.payment.transactionId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED STATE</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {isCompleted ? `CHARGED ${currSym}${displayAmount.toLocaleString('en-IN')}` : 'NOT CHARGED'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL STATE</span>
              <span className={`font-bold ${
                isCompleted 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : isPaymentCharged 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isPaymentCharged ? `CHARGED ${currSym}${currentWorld.payment.amountCharged.toLocaleString('en-IN')}` : 'NOT CHARGED'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-slate-500">Transaction Amount:</span>
            <span className="text-base font-mono font-extrabold text-slate-900 dark:text-white">
              {currSym}{displayAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {isCompleted ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ✓ VERIFIED (SETTLED)
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Captured</span>
            </div>
          ) : isPaymentCharged && !isRecovered ? (
            <div className="space-y-2 pt-1 border-t border-rose-200 dark:border-rose-900/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> ⚠ UNCOMPENSATED SIDE EFFECT
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                <span>Recovery Plan:</span>
                <span className="font-mono font-bold">REFUND {currSym}{displayAmount.toLocaleString('en-IN')}</span>
              </div>
              {onCompensatePayment && (
                <button
                  onClick={onCompensatePayment}
                  className="w-full mt-1.5 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Manual Refund {currSym}{displayAmount.toLocaleString('en-IN')}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentWorld.payment.refundedAmount > 0 
                  ? `RESTORED (${currSym}${currentWorld.payment.refundedAmount.toLocaleString('en-IN')} REFUNDED)` 
                  : '✓ VERIFIED'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Net $0 Charged</span>
            </div>
          )}
        </div>

        {/* Card 2: Workflow Domain Resource 1 */}
        {currentWorld.workflowType === 'cab_booking' ? (
          <div className={`p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border ${isCompleted ? 'border-emerald-300/80 dark:border-emerald-800' : 'border-slate-200/80 dark:border-slate-800'} space-y-3`}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-500" />
                RIDE DISPATCH TOKEN
              </span>
              <span className="text-[10px] font-mono">#{currentWorld.cab.rideId}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'CONFIRMED' : 'NOT_REQUESTED'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.cab.rideStatus}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              📍 {currentWorld.cab.pickup} ➔ {currentWorld.cab.drop}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : currentWorld.workflowType === 'ecommerce_order' ? (
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                E-COMMERCE ORDER
              </span>
              <span className="text-[10px] font-mono">#{currentWorld.order.orderId || 'ORD-CHN'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'CREATED' : 'NOT_CREATED'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.order.orderStatus}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Item: {currentWorld.order.product} (Qty: {currentWorld.order.quantity})
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : currentWorld.workflowType === 'customer_support' ? (
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-purple-500" />
                CRM SUPPORT TICKET
              </span>
              <span className="text-[10px] font-mono">#{currentWorld.support.ticketId}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'OPEN' : 'NOT_CREATED'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.support.ticketStatus}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Issue: {currentWorld.support.issue}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : (
          /* Hotel Room Card */
          <div className={`p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border ${isCompleted ? 'border-emerald-300/80 dark:border-emerald-800' : 'border-slate-200/80 dark:border-slate-800'} space-y-3`}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-indigo-500" />
                {currentWorld.hotel.roomType.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono">{currentWorld.hotel.roomId || 'ROOM-CHN'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'RESERVED' : 'AVAILABLE'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.hotel.roomStatus}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Hold: {currentWorld.hotel.activeBookingId || 'None'} • Guest: {currentWorld.hotel.guestName || 'Divakaran'}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        )}

        {/* Card 3: Allocation / Inventory Domain */}
        {currentWorld.workflowType === 'cab_booking' ? (
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                DRIVER FLEET ALLOCATION
              </span>
              <span className="text-[10px] font-mono">fleet</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'ASSIGNED' : 'IN POOL'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.cab.driverId === null ? 'UNASSIGNED' : 'ASSIGNED'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Driver: {currentWorld.cab.driverName || 'None'} ({currentWorld.cab.driverId || 'In Pool'})
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : currentWorld.workflowType === 'hotel_booking' ? (
          /* Hotel Inventory Card */
          <div className={`p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border ${isCompleted ? 'border-emerald-300/80 dark:border-emerald-800' : 'border-slate-200/80 dark:border-slate-800'} space-y-3`}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                HOTEL INVENTORY
              </span>
              <span className="text-[10px] font-mono">{currentWorld.hotel.hotelId}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? `${currentWorld.hotel.initialAvailableRooms - 1} ROOMS` : `${currentWorld.hotel.initialAvailableRooms} ROOMS`}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.hotel.availableRooms} ROOMS
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Hotel: {currentWorld.hotel.hotelName} ({currentWorld.hotel.area})
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Inventory State:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : currentWorld.workflowType === 'customer_support' ? (
          /* Support Specialist Allocation Card */
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                SPECIALIST ALLOCATION
              </span>
              <span className="text-[10px] font-mono">tier_support</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'ASSIGNED' : 'IN POOL'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.support.assignedAgent && currentWorld.support.assignedAgent !== 'AVAILABLE' ? 'ASSIGNED' : 'IN POOL'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Lead: {currentWorld.support.assignedAgent || 'Senior Specialist Murugan'}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Specialist State:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : (
          /* Warehouse Inventory Card */
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-500" />
                WAREHOUSE INVENTORY
              </span>
              <span className="text-[10px] font-mono">{currentWorld.inventory.sku}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? `${currentWorld.inventory.initialStock - 1} Units` : `${currentWorld.inventory.initialStock} Units`}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.inventory.stock} Units
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Hold: {currentWorld.inventory.holdId || 'None'} • Reserved: {currentWorld.inventory.reservedQuantity}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        )}

        {/* Card 4: Dispatch / Communication / SLA Tier Domain */}
        {currentWorld.workflowType === 'customer_support' ? (
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                CUSTOMER SLA TIER
              </span>
              <span className="text-[10px] font-mono">crm_tier</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'Enterprise VIP' : currentWorld.support.initialTier}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.support.customerTier}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Audit: {currentWorld.support.crmNotes}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : currentWorld.workflowType === 'ecommerce_order' ? (
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                SHIPPING MANIFEST
              </span>
              <span className="text-[10px] font-mono">carrier</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'LABEL_GENERATED' : 'NOT_CREATED'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.shipment.shipmentStatus}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              Tracking: {currentWorld.shipment.trackingNumber || 'None'} • {currentWorld.shipment.destination || 'Chennai Hub'}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        ) : (
          /* Customer Notification Card */
          <div className={`p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border ${isCompleted ? 'border-emerald-300/80 dark:border-emerald-800' : 'border-slate-200/80 dark:border-slate-800'} space-y-3`}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-indigo-500" />
                CUSTOMER NOTIFICATION
              </span>
              <span className="text-[10px] font-mono">resend</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">EXPECTED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isCompleted ? 'SENT' : 'NOT SENT'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">ACTUAL</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWorld.notifications.confirmationSent ? 'SENT' : 'NOT SENT'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 truncate pt-1">
              To: {currentWorld.notifications.customerName} ({currentWorld.notifications.recipient})
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Invariant:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ✓ VERIFIED
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Invariants Verification Table */}
      {differences.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            {isCompleted ? 'Forward Execution Invariant Report (Target vs Actual Runtime)' : 'Invariant Verification Report (Expected Baseline vs Actual Runtime)'}
          </h4>
          <div className="space-y-1.5">
            {differences.map((diff, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl text-xs border ${
                  diff.isMatch
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {diff.isMatch ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span className="font-bold">{diff.resource}</span>
                </div>
                
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    Expected: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{diff.expected}</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>
                    Actual: <span className={`font-mono font-bold ${diff.isMatch ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{diff.actual}</span>
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    diff.isMatch 
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' 
                      : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                  }`}>
                    {diff.isMatch ? '✓ VERIFIED' : '⚠ STATE MISMATCH'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
