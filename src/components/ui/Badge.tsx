import React from 'react';
import { TableStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'neutral' | 'amber' | 'info' | TableStatus;
  className?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  dot = true,
  size = 'md'
}) => {
  let styleClasses = 'bg-neutral-100 text-neutral-700 border-neutral-200';
  let dotColor = 'bg-neutral-500';

  switch (variant) {
    case 'available':
    case 'success':
      styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      dotColor = 'bg-emerald-500';
      break;
    case 'occupied':
    case 'danger':
      styleClasses = 'bg-rose-50 text-rose-800 border-rose-200/80';
      dotColor = 'bg-rose-500';
      break;
    case 'reserved':
    case 'warning':
      styleClasses = 'bg-amber-50 text-amber-800 border-amber-200/80';
      dotColor = 'bg-amber-500';
      break;
    case 'cleaning':
    case 'neutral':
      styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
    case 'payment_pending':
      styleClasses = 'bg-purple-50 text-purple-900 border-purple-200/90 font-bold';
      dotColor = 'bg-purple-600';
      break;
    case 'outline':
      styleClasses = 'bg-transparent text-neutral-800 border-neutral-300';
      dotColor = 'bg-neutral-800';
      break;
    case 'amber':
      styleClasses = 'bg-amber-50 text-amber-800 border-amber-200/80';
      dotColor = 'bg-amber-500';
      break;
    case 'info':
      styleClasses = 'bg-sky-50 text-sky-800 border-sky-200/80';
      dotColor = 'bg-sky-500';
      break;
  }

  const formatLabel = (val: string) => {
    if (val === 'payment_pending') return 'Payment Pending';
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const label = children || (typeof variant === 'string' ? formatLabel(variant) : '');

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full font-medium border ${styleClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />}
      {label}
    </span>
  );
};
