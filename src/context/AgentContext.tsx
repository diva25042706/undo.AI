import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  AgentAction, 
  Snapshot, 
  PolicyRule, 
  AuditEntry, 
  LiveAgentState, 
  ToastMessage, 
  ActiveTab,
  RiskLevel
} from '../types';
import { 
  INITIAL_ACTIONS, 
  INITIAL_SNAPSHOTS, 
  INITIAL_POLICIES, 
  INITIAL_AUDIT_LOG, 
  INITIAL_LIVE_AGENT 
} from '../data/mockData';

interface AgentContextType {
  // Navigation & UI state
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  safeMode: boolean;
  setSafeMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  demoMode: boolean;
  setDemoMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Domain State
  actions: AgentAction[];
  snapshots: Snapshot[];
  policies: PolicyRule[];
  auditLogs: AuditEntry[];
  liveAgent: LiveAgentState;
  requireApprovalIrreversible: boolean;
  setRequireApprovalIrreversible: (val: boolean) => void;

  // Selected Items for Modals
  selectedActionForUndo: AgentAction | null;
  setSelectedActionForUndo: (action: AgentAction | null) => void;
  selectedActionForDetails: AgentAction | null;
  setSelectedActionForDetails: (action: AgentAction | null) => void;
  selectedSnapshotForPreview: Snapshot | null;
  setSelectedSnapshotForPreview: (snapshot: Snapshot | null) => void;

  // Operations
  undoAction: (actionId: string) => Promise<boolean>;
  undoLastAction: () => Promise<boolean>;
  restoreSnapshot: (snapshotId: string) => Promise<boolean>;
  togglePolicy: (policyId: string) => void;
  addNewAction: (newAction: Omit<AgentAction, 'id' | 'timestamp' | 'timeAgo'>) => void;
  resetToDefault: () => void;

  // Hackathon Demo Controller
  isDemoRunning: boolean;
  demoStep: number;
  runHackathonDemo: () => void;
  cancelDemo: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;

  // Computed Stats
  stats: {
    activeAgents: number;
    actionsToday: number;
    reversibleActions: number;
    undoneActions: number;
    undoSuccessRate: number;
    avgRollbackTime: string;
    safeToUndoCount: number;
    failedRollbacks: number;
  };
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [safeMode, setSafeMode] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const [actions, setActions] = useState<AgentAction[]>(INITIAL_ACTIONS);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(INITIAL_SNAPSHOTS);
  const [policies, setPolicies] = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOG);
  const [liveAgent, setLiveAgent] = useState<LiveAgentState>(INITIAL_LIVE_AGENT);
  const [requireApprovalIrreversible, setRequireApprovalIrreversible] = useState<boolean>(true);

  // Modals state
  const [selectedActionForUndo, setSelectedActionForUndo] = useState<AgentAction | null>(null);
  const [selectedActionForDetails, setSelectedActionForDetails] = useState<AgentAction | null>(null);
  const [selectedSnapshotForPreview, setSelectedSnapshotForPreview] = useState<Snapshot | null>(null);

  // Demo state
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync dark mode class with html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toast Helpers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Trigger celebration confetti on successful rollback
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85, x: 0.88 },
        colors: ['#4F46E5', '#10B981', '#6366F1', '#38BDF8'],
      });
    } catch {
      // Fallback silently if canvas is not supported
    }
  };

  // Main Undo Action Method
  const undoAction = useCallback(async (actionId: string): Promise<boolean> => {
    const targetAction = actions.find((a) => a.id === actionId);
    if (!targetAction || targetAction.status !== 'completed' || !targetAction.reversible) {
      addToast({
        type: 'error',
        title: 'Rollback Failed',
        message: 'This action is not currently reversible or already undone.',
      });
      return false;
    }

    // 1. Mark as rolling back
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: 'rolling_back' } : a))
    );

    // 2. Simulate realistic rollback delay (1.1s)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // 3. Mark as undone
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: 'undone',
              rollbackAvailable: false,
              newStateDesc: `[Restored to: ${a.previousStateDesc}]`,
            }
          : a
      )
    );

    // 4. Update audit logs
    const newAudit: AuditEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      actionId: targetAction.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agent: 'Undo Engine / Safety Guard',
      action: `Reversed: ${targetAction.title}`,
      resource: targetAction.target,
      risk: targetAction.risk,
      status: 'Undone',
      reversible: false,
      details: `Restored ${targetAction.target} to previous state (${targetAction.previousStateDesc})`,
      ipHash: '127.0.0.1 (Local Verified)',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // 5. Update live agent action if it was the current one
    setLiveAgent((prev) => ({
      ...prev,
      currentAction: `Restored ${targetAction.target} (Rollback complete)`,
      status: 'Idle',
    }));

    // 6. Show toast
    addToast({
      type: 'success',
      title: 'Action Successfully Undone',
      message: `${targetAction.target} restored to its previous state.`,
    });

    triggerConfetti();
    return true;
  }, [actions, addToast]);

  // Global Undo: Reverses the latest reversible completed action
  const undoLastAction = useCallback(async (): Promise<boolean> => {
    const latestReversible = actions.find(
      (a) => a.status === 'completed' && a.reversible && a.rollbackAvailable
    );

    if (!latestReversible) {
      addToast({
        type: 'info',
        title: 'No Actions to Undo',
        message: 'All recent agent actions are already in baseline or irreversible.',
      });
      return false;
    }

    return await undoAction(latestReversible.id);
  }, [actions, undoAction, addToast]);

  // Restore snapshot
  const restoreSnapshot = useCallback(async (snapshotId: string): Promise<boolean> => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return false;

    addToast({
      type: 'info',
      title: 'Initiating Time Travel',
      message: `Restoring workspace to ${snap.name} (${snap.relativeTime})...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Mark current snapshot
    setSnapshots((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === snapshotId,
      }))
    );

    // Rollback actions that occurred after this snapshot
    const snapIndex = snapshots.findIndex((s) => s.id === snapshotId);
    if (snapIndex > 0) {
      const rolledBackActionIds = actions.slice(0, snapIndex * 2).map((a) => a.id);
      setActions((prev) =>
        prev.map((a) =>
          rolledBackActionIds.includes(a.id)
            ? { ...a, status: 'undone', rollbackAvailable: false }
            : a
        )
      );
    }

    addToast({
      type: 'success',
      title: 'Snapshot Restored',
      message: `Workspace successfully restored to ${snap.name}. All intermediate files reverted.`,
    });

    triggerConfetti();
    return true;
  }, [snapshots, actions, addToast]);

  // Policy toggles
  const togglePolicy = useCallback((policyId: string) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === policyId) {
          const nextVal = !p.enabled;
          addToast({
            type: nextVal ? 'success' : 'warning',
            title: `Policy Updated: ${p.name}`,
            message: `Agent permissions set to: ${nextVal ? 'ENABLED' : 'DISABLED'}`,
          });
          return { ...p, enabled: nextVal };
        }
        return p;
      })
    );
  }, [addToast]);

  // Add new dynamic action
  const addNewAction = useCallback(
    (newAction: Omit<AgentAction, 'id' | 'timestamp' | 'timeAgo'>) => {
      const id = `ACT-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const fullAction: AgentAction = {
        ...newAction,
        id,
        timestamp,
        timeAgo: 'Just now',
      };

      setActions((prev) => [fullAction, ...prev]);

      const audit: AuditEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        actionId: id,
        time: timestamp,
        agent: fullAction.agentName,
        action: fullAction.title,
        resource: fullAction.target,
        risk: fullAction.risk,
        status: fullAction.status === 'completed' ? 'Completed' : 'Pending',
        reversible: fullAction.reversible,
        details: fullAction.actionSummary,
        ipHash: '192.168.1.104',
      };
      setAuditLogs((prev) => [audit, ...prev]);
    },
    []
  );

  // Reset demo to default state
  const resetToDefault = useCallback(() => {
    setActions(INITIAL_ACTIONS);
    setSnapshots(INITIAL_SNAPSHOTS);
    setPolicies(INITIAL_POLICIES);
    setAuditLogs(INITIAL_AUDIT_LOG);
    setLiveAgent(INITIAL_LIVE_AGENT);
    setIsDemoRunning(false);
    setDemoStep(0);
    addToast({
      type: 'info',
      title: 'State Reset',
      message: 'UNDO.AI demo environment reset to default seed state.',
    });
  }, [addToast]);

  // Hackathon Demo Workflow
  const runHackathonDemo = useCallback(async () => {
    setIsDemoRunning(true);
    setDemoStep(1);
    setActiveTab('workspace');

    addToast({
      type: 'info',
      title: 'Hackathon Demo Started',
      message: 'Running "AI Project Organizer" scenario...',
    });
  }, [addToast]);

  const cancelDemo = useCallback(() => {
    setIsDemoRunning(false);
    setDemoStep(0);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+Z / Cmd+Z, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLastAction();
      } else if (e.key === 'Escape') {
        setSelectedActionForUndo(null);
        setSelectedActionForDetails(null);
        setSelectedSnapshotForPreview(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastAction]);

  // Demo Mode automatic background heartbeat simulation
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      const simulatedActions = [
        {
          agentName: 'Documentation Agent',
          agentAvatar: '📝',
          agentRole: 'Doc Sync',
          title: 'Synchronized API Reference docs',
          actionSummary: 'Updated /docs/api.md with latest TypeScript interfaces',
          target: 'api.md',
          destPath: '/docs/api.md',
          previousStateDesc: 'api.md v1.2',
          newStateDesc: 'api.md v1.3 with 4 new endpoints',
          reason: 'Auto-sync with OpenAPI schema change.',
          risk: 'low' as RiskLevel,
          status: 'completed' as const,
          reversible: true,
          rollbackAvailable: true,
          impact: 'Reverts /docs/api.md to v1.2',
          affectedFiles: ['/docs/api.md'],
        },
        {
          agentName: 'Linter Agent',
          agentAvatar: '✨',
          agentRole: 'Code Hygiene',
          title: 'Fixed formatting in utils.ts',
          actionSummary: 'Applied Prettier code style rules',
          target: 'utils.ts',
          destPath: '/src/utils.ts',
          previousStateDesc: 'Unformatted tabs/spaces',
          newStateDesc: 'Clean standard formatting',
          reason: 'Pre-commit hook optimization.',
          risk: 'low' as RiskLevel,
          status: 'completed' as const,
          reversible: true,
          rollbackAvailable: true,
          impact: 'Restores previous indentation and format.',
          affectedFiles: ['/src/utils.ts'],
        },
      ];

      const chosen = simulatedActions[Math.floor(Math.random() * simulatedActions.length)];
      addNewAction({
        ...chosen,
        agentId: 'agent-auto',
        type: 'modify_file',
      });

      addToast({
        type: 'info',
        title: `🤖 ${chosen.agentName}`,
        message: `${chosen.title} (Reversible checkpoint created)`,
      });
    }, 18000);

    return () => clearInterval(interval);
  }, [demoMode, addNewAction, addToast]);

  // Computed statistics
  const completedActions = actions.filter((a) => a.status === 'completed');
  const undoneActions = actions.filter((a) => a.status === 'undone');
  const reversibleActions = actions.filter((a) => a.reversible);
  const safeToUndoCount = actions.filter(
    (a) => a.status === 'completed' && a.reversible && a.rollbackAvailable
  ).length;

  const stats = {
    activeAgents: 3,
    actionsToday: actions.length + 40,
    reversibleActions: reversibleActions.length + 35,
    undoneActions: undoneActions.length + 3,
    undoSuccessRate: 98.4,
    avgRollbackTime: '1.2s',
    safeToUndoCount,
    failedRollbacks: 0,
  };

  return (
    <AgentContext.Provider
      value={{
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        safeMode,
        setSafeMode,
        demoMode,
        setDemoMode,
        isSidebarCollapsed,
        setIsSidebarCollapsed,

        actions,
        snapshots,
        policies,
        auditLogs,
        liveAgent,
        requireApprovalIrreversible,
        setRequireApprovalIrreversible,

        selectedActionForUndo,
        setSelectedActionForUndo,
        selectedActionForDetails,
        setSelectedActionForDetails,
        selectedSnapshotForPreview,
        setSelectedSnapshotForPreview,

        undoAction,
        undoLastAction,
        restoreSnapshot,
        togglePolicy,
        addNewAction,
        resetToDefault,

        isDemoRunning,
        demoStep,
        runHackathonDemo,
        cancelDemo,

        toasts,
        addToast,
        removeToast,

        stats,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
