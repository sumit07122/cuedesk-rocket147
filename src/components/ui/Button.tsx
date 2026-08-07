import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  let variantStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-neutral-900 text-white hover:bg-black active:bg-neutral-800 shadow-sm border border-neutral-900';
      break;
    case 'secondary':
      variantStyles = 'bg-[#F4F4F5] text-neutral-800 hover:bg-neutral-200/80 active:bg-neutral-200 border border-neutral-200/60';
      break;
    case 'outline':
      variantStyles = 'bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200 shadow-2xs';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200/60';
      break;
    case 'danger':
      variantStyles = 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs';
      break;
    case 'success':
      variantStyles = 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs';
      break;
  }

  let sizeStyles = '';
  switch (size) {
    case 'sm':
      sizeStyles = 'text-xs px-3 py-1.5 rounded-xl gap-1.5';
      break;
    case 'md':
      sizeStyles = 'text-sm px-4 py-2.5 rounded-xl gap-2 font-medium';
      break;
    case 'lg':
      sizeStyles = 'text-base px-6 py-3.5 rounded-2xl gap-2.5 font-medium';
      break;
    case 'icon':
      sizeStyles = 'p-2.5 rounded-xl justify-center';
      break;
  }

  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.985] ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
