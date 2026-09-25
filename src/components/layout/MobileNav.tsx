import React from 'react';
import { useAgent } from '../../context/AgentContext';
import { ActiveTab } from '../../types';
import { LayoutDashboard, Bot, History, RotateCcw, Camera, ShieldAlert, FileText } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, stats } = useAgent();

  const items = [
    { id: 'dashboard' as ActiveTab, label: 'Dash', icon: LayoutDashboard },
    { id: 'workspace' as ActiveTab, label: 'Agent', icon: Bot },
    { id: 'undocenter' as ActiveTab, label: 'Undo', icon: RotateCcw, badge: stats.safeToUndoCount },
    { id: 'snapshots' as ActiveTab, label: 'Snapshots', icon: Camera },
    { id: 'policies' as ActiveTab, label: 'Policies', icon: ShieldAlert },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all relative ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
