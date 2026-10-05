import React from 'react';
import { AgentProvider, useAgent } from './context/AgentContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/toast/ToastContainer';
import { GlobalUndoButton } from './components/floating/GlobalUndoButton';
import { DemoScenarioBar } from './components/floating/DemoScenarioBar';
import { UndoConfirmModal } from './components/modals/UndoConfirmModal';
import { SnapshotCompareModal } from './components/modals/SnapshotCompareModal';
import { ActionDetailsModal } from './components/modals/ActionDetailsModal';
import { RecoveryPreviewModal } from './components/modals/RecoveryPreviewModal';
import { HumanApprovalModal } from './components/saga/HumanApprovalModal';
import { TestMatrixModal } from './components/saga/TestMatrixModal';
import { IncomingCallModal } from './components/saga/IncomingCallModal';

// Views
import { LandingHeroView } from './views/LandingHeroView';
import { DashboardView } from './views/DashboardView';
import { PaymentGuardianView } from './views/PaymentGuardianView';
import { AgentWorkspaceView } from './views/AgentWorkspaceView';
import { ChennaiDatasetView } from './views/ChennaiDatasetView';
import { ActionTimelineView } from './views/ActionTimelineView';
import { UndoCenterView } from './views/UndoCenterView';
import { SnapshotsView } from './views/SnapshotsView';
import { PoliciesView } from './views/PoliciesView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    sagaState, 
    respondToApproval,
    isTestMatrixOpen,
    setIsTestMatrixOpen
  } = useAgent();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingHeroView />;
      case 'dashboard':
        return <DashboardView />;
      case 'workspace':
        return <AgentWorkspaceView />;
      case 'chennaidataset':
        return <ChennaiDatasetView />;
      case 'payment':
        return <PaymentGuardianView />;
      case 'timeline':
        return <ActionTimelineView />;
      case 'undocenter':
        return <UndoCenterView />;
      case 'snapshots':
        return <SnapshotsView />;
      case 'policies':
        return <PoliciesView />;
      case 'auditlog':
        return <AuditLogView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar />

      {/* Global AG02 Controller Bar */}
      <DemoScenarioBar />

      {/* Main Layout Area */}
      <div className="flex-1 flex relative">
        
        {/* Sidebar (shown on desktop/tablet, collapsible) */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Dynamic Main View Content */}
        <main
          className={`flex-1 transition-all duration-300 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-full overflow-x-hidden ${
            activeTab === 'landing' ? 'p-0 sm:p-0 lg:p-0' : ''
          }`}
        >
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Elements */}
      <GlobalUndoButton />
      <ToastContainer />
      <MobileNav />

      {/* Modals & Dialogs */}
      <UndoConfirmModal />
      <SnapshotCompareModal />
      <ActionDetailsModal />
      <RecoveryPreviewModal />
      
      {/* Saga Human Approval Modal for Irreversible Actions */}
      <HumanApprovalModal
        step={sagaState.awaitingApprovalStep}
        isOpen={sagaState.status === 'AWAITING_APPROVAL'}
        onApprove={() => respondToApproval(true)}
        onReject={() => respondToApproval(false)}
      />

      {/* In-App Realistic Smartphone Incoming Voice Call Modal (100% Free) */}
      <IncomingCallModal />

      {/* Buildathon 27-Test Matrix Evaluation Modal */}
      <TestMatrixModal
        isOpen={isTestMatrixOpen}
        onClose={() => setIsTestMatrixOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AgentProvider>
      <MainAppContent />
    </AgentProvider>
  );
}
