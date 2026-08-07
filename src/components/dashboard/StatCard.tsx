import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'purple' | 'dark';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
}) => {
  let iconBg = 'bg-neutral-100 text-neutral-800';
  let cardBorder = 'border-neutral-200/80';

  if (variant === 'success') {
    iconBg = 'bg-emerald-100 text-emerald-800';
  } else if (variant === 'warning') {
    iconBg = 'bg-amber-100 text-amber-800';
  } else if (variant === 'dark') {
    iconBg = 'bg-neutral-800 text-white';
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${cardBorder} p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all ${
        onClick ? 'cursor-pointer hover:border-neutral-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            {title}
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-1 font-mono">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-neutral-500 font-normal">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.positive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
