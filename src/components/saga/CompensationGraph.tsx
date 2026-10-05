// ============================================================================
// UNDO.AI — SAGA TOPOLOGICAL EXECUTION & RECOVERY GRAPH
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// COMPLETE REAL EMAIL PIPELINE & RESEND DIAGNOSTICS
// ============================================================================

import React, { useState } from 'react';
import { WorkflowStepSpec } from '../../engine/workflows';
import { DurableLogEntry } from '../../engine/durableLog';
import { EmailDeliveryModal, EmailDeliveryDetails } from './EmailDeliveryModal';
import { VoiceRecoveryPanel, VoiceCallData } from './VoiceRecoveryPanel';
import { ApiService } from '../../services/api';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  Sparkles,
  Layers,
  AlertTriangle,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Eye,
  Terminal,
  ExternalLink,
  PhoneCall
} from 'lucide-react';

interface CompensationGraphProps {
  steps: WorkflowStepSpec[];
  currentStepIndex: number;
  status: string;
  logs: DurableLogEntry[];
  compensationSequence: string[];
  emailNotification?: {
    status:
      | 'EMAIL_PENDING'
      | 'EMAIL_SENDING'
      | 'EMAIL_SENT'
      | 'EMAIL_ACCEPTED'
      | 'EMAIL_DELIVERED'
      | 'EMAIL_DELIVERY_DELAYED'
      | 'EMAIL_BOUNCED'
      | 'EMAIL_COMPLAINED'
      | 'EMAIL_SUPPRESSED'
      | 'EMAIL_FAILED'
      | 'EMAIL_PROVIDER_NOT_CONFIGURED'
      | 'EMAIL_ALREADY_SENT';
    recipient: string;
    customerName: string;
    sender?: string;
    subject?: string;
    messageId?: string;
    emailId?: string;
    timestamp?: string;
    error?: string;
    stage?: string;
    stageLabel?: string;
    lastEvent?: string;
    rawResponse?: any;
  } | null;
  voiceCallNotification?: VoiceCallData | null;
  onRetryEmail?: (forceRetry?: boolean) => void;
  onTriggerVoiceCall?: (forceRetry?: boolean) => void;
  onRollback?: () => void;
  lastError?: string | null;
  workflowType?: string;
  workflowId?: string;
  worldState?: any;
  isWorldRestored?: boolean;
}

export const CompensationGraph: React.FC<CompensationGraphProps> = ({
  steps,
  currentStepIndex,
  status,
  logs,
  compensationSequence,
  emailNotification,
  voiceCallNotification,
  onRetryEmail,
  onTriggerVoiceCall,
  onRollback,
  lastError,
  workflowType = 'hotel_booking',
  workflowId = 'WF-HTL-CHN-001',
  worldState,
  isWorldRestored = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const isCompensatingOrRecovered =
    status === 'COMPENSATING' || status === 'RECOVERED' || status === 'PARTIALLY_RECOVERED';
  const isFailed = status === 'FAILED';

  const failedLog = logs.find((l) => l.status === 'FAILED');
  const completedLogs = logs.filter(
    (l) => l.status === 'COMPLETED' && (!failedLog || l.stepNumber < failedLog.stepNumber)
  );
  const skippedLogs = logs.filter((l) => l.status === 'SKIPPED');

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const recipient = emailNotification?.recipient || 'divakaranperumal27@gmail.com';
      const customerName = emailNotification?.customerName || 'Divakaran';
      const res = await ApiService.sendTestEmail({ recipient, customerName });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        stage_label: 'B. RESEND API NETWORK ERROR',
        status: 'EMAIL_FAILED',
        error: err.message,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getEmailStatusDetails = (notif: typeof emailNotification) => {
    if (!notif) return null;
    const emailId = notif.emailId || notif.messageId;
    const isForward = status === 'COMPLETED';

    switch (notif.status) {
      case 'EMAIL_SENT':
        return {
          title: isForward ? 'Booking Confirmation Email Sent via Resend API' : 'Recovery Email Sent via Resend API',
          badgeText: 'EMAIL_SENT ✓',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          containerClass: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          buttonText: 'View Email Delivery',
        };
      case 'EMAIL_DELIVERED':
        return {
          title: isForward ? 'Booking Confirmation Delivered to Inbox' : 'Recovery Email Delivered to Inbox',
          badgeText: 'EMAIL_DELIVERED ✓',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          containerClass: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          buttonText: 'View Email Delivery',
        };
      case 'EMAIL_ACCEPTED':
        return {
          title: isForward ? 'Booking Confirmation Accepted by Resend API' : 'Recovery Email Accepted by Resend API',
          badgeText: 'EMAIL_ACCEPTED ✓',
          badgeClass: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
          containerClass: 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700',
          icon: <CheckCircle2 className="w-5 h-5 text-indigo-600" />,
          buttonText: 'View Email Delivery',
        };
      case 'EMAIL_SENDING':
        return {
          title: isForward ? 'Dispatching Real Booking Confirmation via Resend...' : 'Dispatching Real Outbound Email via Resend...',
          badgeText: 'EMAIL_SENDING...',
          badgeClass: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 animate-pulse',
          containerClass: 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 animate-pulse',
          icon: <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />,
          buttonText: 'View Details',
        };
      case 'EMAIL_PROVIDER_NOT_CONFIGURED':
        return {
          title: 'Resend API Key Pending in .env',
          badgeText: 'EMAIL_PROVIDER_NOT_CONFIGURED',
          badgeClass: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          containerClass: 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          buttonText: 'Inspect Config',
        };
      case 'EMAIL_DELIVERY_DELAYED':
        return {
          title: 'Email Delivery Delayed by Recipient MX',
          badgeText: 'EMAIL_DELIVERY_DELAYED ⏳',
          badgeClass: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          containerClass: 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700',
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          buttonText: 'View Email Delivery',
        };
      case 'EMAIL_BOUNCED':
        return {
          title: 'Email Bounced: Recipient Server Rejected Address',
          badgeText: 'EMAIL_BOUNCED ❌',
          badgeClass: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
          containerClass: 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700',
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          buttonText: 'View Diagnostic',
        };
      default:
        return {
          title: 'Email Delivery Incomplete (Resend Error)',
          badgeText: 'EMAIL_FAILED',
          badgeClass: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
          containerClass: 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700',
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          buttonText: 'View Diagnostic',
        };
    }
  };

  const emailUI = getEmailStatusDetails(emailNotification);

  return (
    <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>SAGA TOPOLOGICAL EXECUTION & RECOVERY GRAPH</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Workflow Execution Pipeline
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSendTestEmail}
            disabled={isSendingTest}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Sends an isolated test email via Resend to verify provider connectivity"
          >
            {isSendingTest ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>SEND TEST EMAIL</span>
          </button>

          <span className="text-xs text-slate-500 font-mono">
            Pattern: Saga (Backward Compensating Sequence)
          </span>
        </div>
      </div>

      {/* Test Email Diagnostic Result Banner (if triggered) */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border transition-all animate-in fade-in-50 ${
            testResult.success
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
                  STAGE: {testResult.stage_label || testResult.stage}
                </span>
                <span className="text-xs font-extrabold">
                  {testResult.success ? 'TEST EMAIL ACCEPTED BY RESEND ✓' : 'TEST EMAIL FAILED'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Recipient: <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{testResult.recipient}</code>
                {testResult.email_id && (
                  <> &bull; Resend ID: <code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{testResult.email_id}</code></>
                )}
              </p>
              {testResult.error && (
                <p className="text-xs font-mono text-rose-800 dark:text-rose-200 mt-1">
                  Reason: {testResult.error}
                </p>
              )}
              {testResult.diagnostic_tip && (
                <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5">
                  💡 Tip: {testResult.diagnostic_tip}
                </p>
              )}
            </div>

            <button
              onClick={() => setTestResult(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Partial Transaction Recovery Banner (when status === 'FAILED') */}
      {isFailed && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50/30 to-rose-50/70 dark:from-rose-950/60 dark:via-slate-900/80 dark:to-rose-950/40 border-2 border-rose-400 dark:border-rose-600 shadow-xl animate-in fade-in-50 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-rose-200 dark:border-rose-800/80">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-black text-rose-950 dark:text-rose-100">
                    {workflowType === 'ecommerce_order'
                      ? '⚠️ E-COMMERCE ORDER TRANSACTION FAILED'
                      : workflowType === 'customer_support'
                      ? '⚠️ CUSTOMER SUPPORT TRANSACTION FAILED'
                      : workflowType === 'cab_booking'
                      ? '⚠️ CAB DISPATCH TRANSACTION FAILED'
                      : '⚠️ BOOKING TRANSACTION FAILED'}
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border border-rose-300 dark:border-rose-700">
                    PARTIAL TRANSACTION DETECTED
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-200 mt-0.5">
                  Failed Step: <strong className="font-bold">Step {failedLog?.stepNumber || 5} ({failedLog?.title || 'External Service Call'})</strong> &bull; {
                    workflowType === 'ecommerce_order'
                      ? `Shipment ID: ${failedLog?.input?.shipmentLabelId || 'NOT_CREATED'}`
                      : workflowType === 'customer_support'
                      ? `Credit Ref: ${failedLog?.input?.creditId || 'NOT_ISSUED'}`
                      : workflowType === 'cab_booking'
                      ? `Ride ID: ${failedLog?.input?.rideId || 'RIDE-CHN'}`
                      : `Ticket ID: ${failedLog?.input?.ticketId || 'TKT-HTL-20547106'}`
                  }
                </p>
              </div>
            </div>

            {onRollback && (
              <button
                onClick={onRollback}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black tracking-wider bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transform hover:-translate-y-0.5 transition-all cursor-pointer shrink-0 animate-pulse"
              >
                <RotateCcw className="w-4 h-4" />
                <span>↩ UNDO LAST ACTION</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Completed Side Effects */}
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-300 dark:border-emerald-800 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed Side Effects
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  {completedLogs.filter(l => l.reversible).length} Active
                </span>
              </div>
              <ul className="text-xs font-bold text-slate-900 dark:text-white space-y-1">
                {workflowType === 'ecommerce_order' ? (
                  <>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Order Created ({worldState?.order?.orderId || 'ORD-CHN'})</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Inventory Reserved (1 Unit)</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>₹{(worldState?.payment?.amountCharged || 85000).toLocaleString('en-IN')} Captured</span>
                    </li>
                  </>
                ) : workflowType === 'customer_support' ? (
                  <>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Support Ticket Open ({worldState?.support?.ticketId || 'TCK-CHN'})</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Specialist Assigned ({worldState?.support?.assignedSpecialist || 'Murugan K'})</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Priority Upgraded ({worldState?.support?.customerTier || 'HIGH'})</span>
                    </li>
                  </>
                ) : workflowType === 'cab_booking' ? (
                  <>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Driver Assigned ({worldState?.cab?.driverName || 'Driver'})</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Cab Reserved</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>₹{(worldState?.payment?.amountCharged || 420).toLocaleString('en-IN')} Charged</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>Room Reserved ({worldState?.hotel?.roomType || 'Deluxe Room'})</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <span>✓</span> <span>₹{(worldState?.payment?.amountCharged || 750).toLocaleString('en-IN')} Charged to Card</span>
                    </li>
                  </>
                )}
              </ul>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                Requires backward compensation.
              </p>
            </div>

            {/* Failed Step */}
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-rose-300 dark:border-rose-800 space-y-1.5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" /> Failed Step
              </span>
              <p className="text-xs font-extrabold text-rose-900 dark:text-rose-200">
                ❌ {failedLog?.title || (
                  workflowType === 'ecommerce_order'
                    ? 'Generate Shipment Label'
                    : workflowType === 'customer_support'
                    ? 'Issue Resolution Credit'
                    : workflowType === 'cab_booking'
                    ? 'Dispatch Driver OTP'
                    : 'Create Booking Ticket'
                )}
              </p>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate">
                {workflowType === 'ecommerce_order'
                  ? 'Label: NOT_CREATED'
                  : workflowType === 'customer_support'
                  ? 'Credit: NOT_ISSUED'
                  : workflowType === 'cab_booking'
                  ? 'OTP: NOT_DISPATCHED'
                  : `Ticket: ${failedLog?.input?.ticketId || 'TKT-HTL-20547106'}`}
              </p>
              <p className="text-[10px] text-rose-700 dark:text-rose-400 font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                Reason: {failedLog?.errorMessage || (
                  workflowType === 'ecommerce_order'
                    ? 'Shipment label service failure'
                    : workflowType === 'customer_support'
                    ? 'Resolution credit service failure'
                    : workflowType === 'cab_booking'
                    ? 'Driver dispatch gateway timeout'
                    : 'Booking ticket service failure'
                )}
              </p>
            </div>

            {/* Skipped Steps */}
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Skipped Step
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ⏭ {workflowType === 'ecommerce_order'
                  ? 'Send Order Confirmation'
                  : workflowType === 'customer_support'
                  ? 'Send Customer Notification'
                  : 'Customer Email Confirmation'}
              </p>
              <p className="text-[11px] text-slate-500">
                Status: <strong className="text-slate-700 dark:text-slate-300">SKIPPED (Previous failed)</strong>
              </p>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                0 notifications dispatched.
              </p>
            </div>

            {/* Reverse Compensation Plan */}
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-indigo-300 dark:border-indigo-800 space-y-1.5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-indigo-600" /> SAGA Rollback Plan
              </span>
              <ol className="text-xs font-mono font-bold text-indigo-900 dark:text-indigo-200 space-y-0.5">
                {workflowType === 'ecommerce_order' ? (
                  <>
                    <li>1. refund_payment(₹{(worldState?.payment?.amountCharged || 85000).toLocaleString('en-IN')})</li>
                    <li>2. release_inventory()</li>
                    <li>3. cancel_order()</li>
                  </>
                ) : workflowType === 'customer_support' ? (
                  <>
                    <li>1. restore_customer_priority()</li>
                    <li>2. release_specialist()</li>
                    <li>3. cancel_support_ticket()</li>
                  </>
                ) : workflowType === 'cab_booking' ? (
                  <>
                    <li>1. refund_payment(₹{(worldState?.payment?.amountCharged || 420).toLocaleString('en-IN')})</li>
                    <li>2. cancel_ride()</li>
                    <li>3. release_driver()</li>
                  </>
                ) : (
                  <>
                    <li>1. refund_payment(₹{(worldState?.payment?.amountCharged || 750).toLocaleString('en-IN')})</li>
                    <li>2. cancel_room_booking()</li>
                  </>
                )}
              </ol>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                Failed and skipped steps never executed.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-rose-900 dark:text-rose-200 pt-1 font-medium gap-2">
            <span>
              💡 <strong>Deterministic Rule:</strong> UNDO.AI will <em>only</em> compensate successfully completed side effects in strict reverse order. Failed operations are never undone because they never occurred.
            </span>
          </div>
        </div>
      )}

      {/* Forward Execution Flow */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
            1. Forward Execution Order (Sensible Dependency Ordering)
          </span>
          <span className="text-[11px] text-slate-400">
            Irreversible actions placed last behind approval guard
          </span>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${steps.length >= 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3 relative`}>
          {steps.map((step, idx) => {
            const log = logs.find((l) => l.stepNumber === step.stepNumber);
            const isCompleted = log?.status === 'COMPLETED' || log?.status === 'COMPENSATED';
            const isFailed = log?.status === 'FAILED';
            const isCurrent = currentStepIndex === idx && status === 'RUNNING';
            const isAwaitingApproval = log?.status === 'BLOCKED_FOR_APPROVAL' || (isCurrent && step.contract.requiresApproval);

            let statusColor = 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500';
            if (isCompleted) {
              statusColor = 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs';
            } else if (isFailed) {
              statusColor = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200 animate-pulse';
            } else if (isCurrent) {
              statusColor = 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20';
            } else if (isAwaitingApproval) {
              statusColor = 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200';
            }

            return (
              <div
                key={step.stepId}
                className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${statusColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      STEP {step.stepNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      {step.contract.reversible ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                          REVERSIBLE
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> IRREVERSIBLE
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold leading-tight mb-1 text-slate-900 dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 mb-2 truncate">
                    {step.toolName}()
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span>Status:</span>
                  <span className="font-bold flex items-center gap-1">
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {isFailed && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />}
                    {log?.status || (idx > currentStepIndex ? 'PENDING' : 'READY')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reverse Compensation Recovery Flow */}
      {isCompensatingOrRecovered && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-500 animate-spin-reverse" />
              2. SAGA Reverse Compensation Sequence (Strict Reverse Topological Order)
            </span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
              Failure Detected ➔ Compensate D⁻¹ ➔ C⁻¹ ➔ B⁻¹ ➔ A⁻¹
            </span>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${steps.length >= 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
            {[...steps].reverse().map((step) => {
              const log = logs.find((l) => l.stepNumber === step.stepNumber);
              const isCompensated = log?.status === 'COMPENSATED';
              const isCompFailed = log?.status === 'COMPENSATION_FAILED';
              const isFailedStep = log?.status === 'FAILED';
              const isSkippedStep = log?.status === 'SKIPPED';
              const isReadOnly = !step.contract.compensationAction;
              const isSkipped = isReadOnly || isFailedStep || isSkippedStep;

              let cardStyle = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400';
              if (isCompensated) {
                cardStyle = 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs';
              } else if (isCompFailed) {
                cardStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30';
              } else if (isFailedStep) {
                cardStyle = 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-500';
              }

              return (
                <div
                  key={`comp-${step.stepId}`}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${cardStyle}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        REVERT STEP {step.stepNumber}
                      </span>
                      <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                      {isFailedStep
                        ? 'No Reversal (Step Failed)'
                        : isSkippedStep
                        ? 'No Reversal (Skipped)'
                        : isReadOnly
                        ? 'Read Only (No Mutations)'
                        : (step.contract.compensationAction || 'skip')}
                    </h5>
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      {isFailedStep
                        ? `Step ${step.stepNumber} failed — no side effect committed.`
                        : isSkippedStep
                        ? 'Downstream step skipped on upstream fault.'
                        : (step.contract.compensationDescription || 'Read-only query')}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold">
                    <span>Comp Result:</span>
                    <span className="flex items-center gap-1">
                      {isCompensated && (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">RESTORED ✓</span>
                        </>
                      )}
                      {isCompFailed && (
                        <>
                          <XCircle className="w-3 h-3 text-rose-500" />
                          <span className="text-rose-600 dark:text-rose-400">FAILED</span>
                        </>
                      )}
                      {isFailedStep && (
                        <span className="text-rose-600 dark:text-rose-400 font-mono">
                          NO COMP (FAILED)
                        </span>
                      )}
                      {isSkippedStep && (
                        <span className="text-slate-400 font-mono">SKIPPED</span>
                      )}
                      {isReadOnly && !isFailedStep && !isSkippedStep && (
                        <span className="text-slate-400 font-mono">READ ONLY</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outbound Email Notification Status (Confirmation or Recovery) */}
      {(isCompensatingOrRecovered || status === 'COMPLETED') && emailNotification && emailUI && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              {status === 'COMPLETED' ? '📧 OUTBOUND BOOKING CONFIRMATION NOTIFICATION' : '📧 OUTBOUND TRANSACTIONAL RECOVERY NOTIFICATION'}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Provider: Resend REST API
            </span>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${emailUI.containerClass}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                  {emailUI.icon}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {emailUI.title}
                    </h5>
                    <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${emailUI.badgeClass}`}>
                      {emailUI.badgeText}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Recipient: <strong className="text-slate-900 dark:text-white">{emailNotification.customerName}</strong> (<code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{emailNotification.recipient}</code>)
                  </p>

                  {(emailNotification.emailId || emailNotification.messageId) && (
                    <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Resend Email ID: <strong className="font-bold">{emailNotification.emailId || emailNotification.messageId}</strong>
                    </p>
                  )}

                  {emailNotification.error && (
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-mono">
                      Reason: {emailNotification.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span>View Email Delivery</span>
                </button>

                {(emailNotification.status === 'EMAIL_FAILED' ||
                  emailNotification.status === 'EMAIL_PROVIDER_NOT_CONFIGURED' ||
                  emailNotification.status === 'EMAIL_DELIVERY_DELAYED') &&
                  onRetryEmail && (
                    <button
                      onClick={() => onRetryEmail(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Notification</span>
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outbound Voice Recovery Agent (Exotel & Voice AI) */}
      {(isCompensatingOrRecovered || status === 'RECOVERED') && (
        <VoiceRecoveryPanel
          voiceCall={voiceCallNotification}
          workflowId={workflowId}
          workflowType={workflowType}
          isWorldRestored={isWorldRestored || status === 'RECOVERED'}
          onManualCall={onTriggerVoiceCall}
        />
      )}

      {/* UNDO.AI Core Philosophy Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-indigo-900/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-extrabold text-indigo-950 dark:text-indigo-200">
            &ldquo;AI agents can act. UNDO.AI makes their actions recoverable.&rdquo;
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            UNDO.AI doesn't undo what was planned. It undoes what actually happened based on durable execution logs.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-mono font-bold text-[10px]">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>DETERMINISTIC SAGA GUARANTEE</span>
        </div>
      </div>

      {/* Inspector Modal */}
      <EmailDeliveryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        emailDetails={emailNotification as EmailDeliveryDetails | null}
      />
    </div>
  );
};
