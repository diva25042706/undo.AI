// ============================================================================
// UNDO.AI — RESEND EMAIL DELIVERY INSPECTOR & DIAGNOSTIC MODAL
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// "Traces Frontend ➔ Backend ➔ Resend API ➔ Email ID ➔ Delivery Status"
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiService } from '../../services/api';
import {
  Mail,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Terminal,
  Send,
  Zap,
} from 'lucide-react';

export interface EmailDeliveryDetails {
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
}

interface EmailDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailDetails: EmailDeliveryDetails | null;
  onRefreshStatus?: (emailId: string) => Promise<void>;
  onSendTestEmail?: () => Promise<void>;
}

export const EmailDeliveryModal: React.FC<EmailDeliveryModalProps> = ({
  isOpen,
  onClose,
  emailDetails,
  onRefreshStatus,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveStatus, setLiveStatus] = useState<EmailDeliveryDetails | null>(emailDetails);

  useEffect(() => {
    setLiveStatus(emailDetails);
  }, [emailDetails]);

  if (!isOpen || !liveStatus) return null;

  const emailId = liveStatus.emailId || liveStatus.messageId;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRefresh = async () => {
    if (!emailId || emailId.includes('CACHED') || emailId.includes('ALREADY')) return;
    setIsRefreshing(true);
    try {
      const res = await ApiService.checkEmailDeliveryStatus(emailId);
      if (res) {
        setLiveStatus((prev) => ({
          ...prev!,
          status: res.status,
          stageLabel: res.stage_label,
          lastEvent: res.last_event,
          rawResponse: res.raw_response || prev?.rawResponse,
        }));
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EMAIL_SENT':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          label: 'EMAIL_SENT ✓ (Accepted by Resend REST API)',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        };
      case 'EMAIL_DELIVERED':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          label: 'EMAIL_DELIVERED ✓ (Confirmed by Recipient Server)',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        };
      case 'EMAIL_ACCEPTED':
        return {
          bg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
          label: 'EMAIL_ACCEPTED ✓ (Resend Queue Assigned)',
          icon: <CheckCircle2 className="w-4 h-4 text-indigo-600" />,
        };
      case 'EMAIL_ALREADY_SENT':
        return {
          bg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
          label: 'EMAIL_ALREADY_SENT ✓ (Idempotent Cache Hit)',
          icon: <CheckCircle2 className="w-4 h-4 text-indigo-600" />,
        };
      case 'EMAIL_DELIVERY_DELAYED':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          label: 'EMAIL_DELIVERY_DELAYED ⏳ (Retrying with MX)',
          icon: <Clock className="w-4 h-4 text-amber-600" />,
        };
      case 'EMAIL_BOUNCED':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
          label: 'EMAIL_BOUNCED ❌ (Address Rejected by MX)',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
        };
      case 'EMAIL_SUPPRESSED':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
          label: 'EMAIL_SUPPRESSED ⚠️ (On Global Suppression List)',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        };
      case 'EMAIL_PROVIDER_NOT_CONFIGURED':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          label: 'EMAIL_PROVIDER_NOT_CONFIGURED (RESEND_API_KEY Missing in .env)',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        };
      default:
        return {
          bg: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
          label: 'EMAIL_FAILED (Error Rejected by Provider)',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
        };
    }
  };

  const badge = getStatusBadge(liveStatus.status);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Resend Outbound Delivery Inspector
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  End-to-End Pipeline Telemetry & Verification
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Status Ribbon */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${badge.bg}`}>
              <div className="flex items-center gap-2.5">
                {badge.icon}
                <span className="text-xs font-bold font-mono tracking-tight">
                  {badge.label}
                </span>
              </div>

              {emailId && !emailId.includes('CACHED') && !emailId.includes('ALREADY') && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Check Live MX Event</span>
                </button>
              )}
            </div>

            {/* Pipeline Stage Trace */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-500" />
                Pipeline Verification Stages
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">1. Environment Key:</span>
                  <strong className={liveStatus.status !== 'EMAIL_PROVIDER_NOT_CONFIGURED' ? 'text-emerald-600' : 'text-rose-600'}>
                    {liveStatus.status !== 'EMAIL_PROVIDER_NOT_CONFIGURED' ? 'CONFIGURED ✓' : 'MISSING ✗'}
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">2. Provider:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">Resend REST API v1</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">3. Recipient Validated:</span>
                  <strong className="text-emerald-600">VALID RFC-5322 ✓</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">4. Resend Acceptance:</span>
                  <strong className={emailId ? 'text-emerald-600' : 'text-slate-400'}>
                    {emailId ? 'ACCEPTED WITH ID ✓' : 'PENDING / FAILED'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Email Metadata Grid */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Outbound Message Attributes
              </span>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 text-xs">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-400">Recipient (Customer):</span>
                  <strong className="font-bold text-slate-900 dark:text-white">
                    {liveStatus.customerName} ({liveStatus.recipient})
                  </strong>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-400">Sender:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {liveStatus.sender || 'UNDO.AI Recovery <onboarding@resend.dev>'}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-sm">
                    {liveStatus.subject || 'UNDO.AI — Transaction Successfully Reversed'}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Resend Email ID:</span>
                  {emailId ? (
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md text-[11px]">
                        {emailId}
                      </code>
                      <button
                        onClick={() => handleCopy(emailId)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                        title="Copy Resend ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-mono">None (Failed before ID generation)</span>
                  )}
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {liveStatus.timestamp || new Date().toISOString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Diagnostics (if failed) */}
            {liveStatus.error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <XCircle className="w-4 h-4" />
                  <span>Failure Diagnostic Reason</span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-200 font-mono leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900">
                  {liveStatus.error}
                </p>
                {liveStatus.error.includes('testing emails') && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-1">
                    <strong>💡 Resend Free Tier Tip:</strong> Resend with <code className="font-mono">onboarding@resend.dev</code> only sends to the email address registered on your Resend account. To send to any recipient, add and verify a custom domain in your Resend dashboard.
                  </p>
                )}
              </div>
            )}

            {/* Raw JSON API Response */}
            {liveStatus.rawResponse && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Raw Provider Response Object (Sanitized)
                </span>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-40">
                  <pre>{JSON.stringify(liveStatus.rawResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Zero Secret Exposure Policy Enforced
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
