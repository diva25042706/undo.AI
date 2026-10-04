import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldCheck, ShieldAlert, ShieldX, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md', showTooltip = true }) => {
  const getRiskDetails = () => {
    switch (risk) {
      case 'low':
        return {
          label: 'LOW RISK',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
          tooltip: 'Safe action. Verified 100% reversible with standard rollback hooks.',
        };
      case 'medium':
        return {
          label: 'MEDIUM RISK',
          color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
          dot: 'bg-amber-500',
          icon: ShieldAlert,
          tooltip: 'Moderate impact. Modifies existing configs or schema. Reversible via snapshot buffer.',
        };
      case 'high':
        return {
          label: 'HIGH RISK',
          color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
          dot: 'bg-rose-500',
          icon: ShieldX,
          tooltip: 'Irreversible or destructive operation. Human approval required by policy.',
        };
      case 'critical':
      default:
        return {
          label: 'CRITICAL',
          color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
          dot: 'bg-red-600',
          icon: AlertOctagon,
          tooltip: 'Critical risk. Requires explicit human authorization.',
        };
    }
  };

  const { label, color, dot, icon: Icon, tooltip } = getRiskDetails();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <div className="relative group inline-flex items-center">
      <span
        className={`inline-flex items-center font-semibold rounded-full border tracking-wide transition-all shadow-xs ${color} ${sizeClasses}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>{label}</span>
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-[11px] rounded-lg py-1.5 px-2.5 shadow-xl max-w-xs whitespace-normal text-center border border-slate-700">
            {tooltip}
          </div>
        </div>
      )}
    </div>
  );
};
