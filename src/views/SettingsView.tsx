import React, { useState, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { ApiService } from '../services/api';
import {
  Settings as SettingsIcon,
  RotateCcw,
  Command,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Database,
  Mail,
  Send,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Clock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    safeMode,
    setSafeMode,
    demoMode,
    setDemoMode,
    resetToDefault,
    addToast,
  } = useAgent();

  const [snapshotRetention, setSnapshotRetention] = useState('50');
  const [dryRunMode, setDryRunMode] = useState(false);
  const [autoRollbackOnError, setAutoRollbackOnError] = useState(true);

  // Email Diagnostic State
  const [testRecipient, setTestRecipient] = useState('divakaranperumal27@gmail.com');
  const [testCustomerName, setTestCustomerName] = useState('Divakaran');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [queryEmailId, setQueryEmailId] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusQueryResult, setStatusQueryResult] = useState<any | null>(null);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const handleSendTestEmail = async () => {
    if (!testRecipient.trim() || !testRecipient.includes('@')) {
      addToast({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await ApiService.sendTestEmail({
        recipient: testRecipient.trim(),
        customerName: testCustomerName.trim() || 'Divakaran',
      });

      setTestResult(res);

      if (res?.success) {
        addToast({
          type: 'success',
          title: 'Test Email Accepted by Resend',
          message: `Resend accepted message ID: ${res.email_id}. Check inbox for ${res.recipient}.`,
        });
      } else {
        addToast({
          type: 'error',
          title: res?.stage_label || 'Test Email Failed',
          message: res?.error || 'Failed to dispatch test email',
        });
      }
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

  const handleCheckStatus = async () => {
    if (!queryEmailId.trim()) return;
    setIsCheckingStatus(true);
    setStatusQueryResult(null);

    try {
      const res = await ApiService.checkEmailDeliveryStatus(queryEmailId.trim());
      setStatusQueryResult(res);
    } catch (err: any) {
      setStatusQueryResult({
        success: false,
        error: err.message,
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const howItWorksSteps = [
    {
      step: 1,
      title: '1. Agent Plans',
      desc: 'The autonomous agent evaluates workspace goals and generates an atomic execution graph with categorized risk levels.',
      icon: Cpu,
    },
    {
      step: 2,
      title: '2. User Reviews',
      desc: 'High-impact or irreversible actions trigger approval gates, while safe actions are flagged for autonomous execution.',
      icon: ShieldCheck,
    },
    {
      step: 3,
      title: '3. Agent Executes',
      desc: 'Agent performs file moves, refactors, and updates in sandboxed buffers with sub-second execution speeds.',
      icon: Sparkles,
    },
    {
      step: 4,
      title: '4. System Checkpoint',
      desc: 'Before every atomic mutation, the Undo Engine saves memory diff snapshots into an indexed state buffer.',
      icon: Layers,
    },
    {
      step: 5,
      title: '5. User Can Undo',
      desc: 'Clicking “Undo” or pressing Ctrl+Z instantly computes the inverse diff and prepares zero-data-loss rollback.',
      icon: RotateCcw,
    },
    {
      step: 6,
      title: '6. State Restored',
      desc: 'The previous file tree, schema versions, and folder structures are seamlessly restored to original states.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <SettingsIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Engine Configuration & Diagnostics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings & Provider Diagnostics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure UNDO.AI parameters, inspect real email delivery pipeline, and verify external service connectivity.
          </p>
        </div>

        <button
          onClick={resetToDefault}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo State</span>
        </button>
      </div>

      {/* REAL RESEND EMAIL DELIVERY DIAGNOSTIC CARD */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm border border-indigo-200/80 dark:border-indigo-900/60 space-y-6 bg-linear-to-b from-indigo-50/20 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Real Outbound Email Pipeline Diagnostics (Resend REST API)
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                  LIVE PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Test isolated email delivery to verify provider API key, DNS verification, and inbox arrival.
              </p>
            </div>
          </div>
        </div>

        {/* Input form & send button */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={testCustomerName}
              onChange={(e) => setTestCustomerName(e.target.value)}
              placeholder="e.g. Divakaran"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="divakaranperumal27@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !testRecipient.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSendingTest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to Resend...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>SEND TEST EMAIL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostics Results Box */}
        {testResult && (
          <div
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              testResult.success
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
                  {testResult.stage_label || testResult.stage}
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {testResult.success ? 'ACCEPTED BY RESEND' : 'DELIVERY FAILED'}
                </span>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                {testResult.timestamp || new Date().toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <div>
                <span className="text-slate-400">Recipient:</span>{' '}
                <strong className="text-slate-900 dark:text-white font-mono">{testResult.recipient}</strong>
              </div>
              <div>
                <span className="text-slate-400">Resend Email ID:</span>{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {testResult.email_id || 'None'}
                </strong>
              </div>
            </div>

            {testResult.error && (
              <div className="text-xs font-mono text-rose-800 dark:text-rose-200 bg-rose-100/60 dark:bg-rose-900/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                <strong>Error:</strong> {testResult.error}
              </div>
            )}

            {testResult.diagnostic_tip && (
              <p className="text-[11px] text-amber-800 dark:text-amber-200">
                <strong>💡 Tip:</strong> {testResult.diagnostic_tip}
              </p>
            )}

            {testResult.raw_response && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold font-mono uppercase text-slate-400">
                  Raw Provider API Response
                </span>
                <pre className="p-2.5 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-32">
                  {JSON.stringify(testResult.raw_response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Query Status by Resend Email ID */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Query Live Resend Delivery Status by Email ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={queryEmailId}
              onChange={(e) => setQueryEmailId(e.target.value)}
              placeholder="e.g. 49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleCheckStatus}
              disabled={isCheckingStatus || !queryEmailId.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isCheckingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
              <span>Query Event</span>
            </button>
          </div>

          {statusQueryResult && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Status:</span>
                <strong className={statusQueryResult.status === 'EMAIL_DELIVERED' ? 'text-emerald-600' : 'text-indigo-600'}>
                  {statusQueryResult.status} ({statusQueryResult.last_event || 'accepted'})
                </strong>
              </div>
              {statusQueryResult.recipient && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">To:</span>
                  <span>{statusQueryResult.recipient}</span>
                </div>
              )}
              {statusQueryResult.error && (
                <div className="text-rose-600">Error: {statusQueryResult.error}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* HOW IT WORKS SECTION (README-Style 6-Step Guide) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6 bg-linear-to-b from-white via-indigo-50/10 to-white dark:from-slate-900 dark:via-indigo-950/10 dark:to-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                How the Undo Engine Works
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The 6-step lifecycle that guarantees autonomous safety and state reversibility.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">
            SPEC AG02
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {howItWorksSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Command className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Command Center & Keyboard Shortcuts
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Agent Rollback
            </span>
            <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold shadow-xs">
              {isMac ? '⌘' : 'Ctrl'} + Z
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Dismiss Modals
            </span>
            <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold shadow-xs">
              Esc
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Confirm Action
            </span>
            <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold shadow-xs">
              Enter
            </kbd>
          </div>
        </div>
      </div>

      {/* Engine Tuning Parameters */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Rollback Engine Parameters
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Max Undo History Depth</p>
              <p className="text-[11px] text-slate-500">Number of atomic actions retained in memory before archival.</p>
            </div>
            <select
              value={snapshotRetention}
              onChange={(e) => setSnapshotRetention(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="25">25 actions</option>
              <option value="50">50 actions</option>
              <option value="100">100 actions</option>
              <option value="unlimited">Unlimited (Enterprise)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Auto-Rollback on Verification Failure</p>
              <p className="text-[11px] text-slate-500">Automatically reverse actions if downstream syntax or build tests fail.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRollbackOnError}
                onChange={(e) => setAutoRollbackOnError(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Dry-Run Simulation Mode</p>
              <p className="text-[11px] text-slate-500">Simulate all state changes in a sandbox before committing files.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dryRunMode}
                onChange={(e) => setDryRunMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

        </div>
      </div>

    </div>
  );
};
