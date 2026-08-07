import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/70 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
        hoverable ? 'transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-neutral-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
