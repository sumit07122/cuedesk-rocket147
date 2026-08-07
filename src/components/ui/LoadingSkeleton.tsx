import React from 'react';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => {
  return (
    <div className={`animate-pulse bg-neutral-200/70 rounded-xl ${className}`} />
  );
};

export const TableCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 flex flex-col gap-4 shadow-2xs">
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-5 w-24" />
        <LoadingSkeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 my-2">
        <LoadingSkeleton className="h-8 w-32" />
        <LoadingSkeleton className="h-4 w-28" />
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
};
