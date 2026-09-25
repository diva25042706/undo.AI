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

// Views
import { LandingHeroView } from './views/LandingHeroView';
import { DashboardView } from './views/DashboardView';
import { AgentWorkspaceView } from './views/AgentWorkspaceView';
import { ActionTimelineView } from './views/ActionTimelineView';
import { UndoCenterView } from './views/UndoCenterView';
import { SnapshotsView } from './views/SnapshotsView';
import { PoliciesView } from './views/PoliciesView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';

const MainAppContent: React.FC = () => {
  const { activeTab, isSidebarCollapsed } = useAgent();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingHeroView />;
      case 'dashboard':
        return <DashboardView />;
      case 'workspace':
        return <AgentWorkspaceView />;
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
      <DemoScenarioBar />
      <ToastContainer />
      <MobileNav />

      {/* Modals & Dialogs */}
      <UndoConfirmModal />
      <SnapshotCompareModal />
      <ActionDetailsModal />

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
