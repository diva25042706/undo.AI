import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
  trend?: string;
  trendPositive?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  color = 'indigo',
  trend,
  trendPositive = true,
  onClick,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
      borderGlow: 'hover:border-indigo-300 dark:hover:border-indigo-700',
      textAccent: 'text-indigo-600 dark:text-indigo-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
      borderGlow: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
      borderGlow: 'hover:border-amber-300 dark:hover:border-amber-700',
      textAccent: 'text-amber-600 dark:text-amber-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
      borderGlow: 'hover:border-blue-300 dark:hover:border-blue-700',
      textAccent: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
      borderGlow: 'hover:border-purple-300 dark:hover:border-purple-700',
      textAccent: 'text-purple-600 dark:text-purple-400',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
      borderGlow: 'hover:border-rose-300 dark:hover:border-rose-700',
      textAccent: 'text-rose-600 dark:text-rose-400',
    },
  };

  const scheme = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl transition-all duration-200 shadow-xs ${
        scheme.borderGlow
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </p>
          <motion.h3
            key={String(value)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {value}
          </motion.h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${scheme.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {subtext && (
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
              {subtext}
            </span>
          )}
          {trend && (
            <span
              className={`font-semibold flex items-center gap-0.5 ${
                trendPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
