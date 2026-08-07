import React from 'react';
import { WifiOff, Wifi, ShieldAlert } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-lg sticky top-0 z-50 animate-pulse">
        <div className="flex items-center gap-2 max-w-7xl mx-auto">
          <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
          <span>
            <strong>Offline Mode Active:</strong> Internet connection lost. Pending operations are buffered safely to prevent data corruption.
          </span>
        </div>
        <div className="flex items-center gap-1 bg-amber-600/30 px-2 py-0.5 rounded text-[11px] font-mono shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Offline Protected</span>
        </div>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-2 max-w-7xl mx-auto">
          <Wifi className="w-4 h-4 shrink-0 text-white" />
          <span>
            <strong>Back Online:</strong> Connection re-established. Syncing database records with Firestore.
          </span>
        </div>
      </div>
    );
  }

  return null;
};
