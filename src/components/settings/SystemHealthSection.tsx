import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Database, HardDrive, Radio } from 'lucide-react';
import { auth, testFirestoreHealth, currentConfigSource } from '../../lib/firebase';
import { getAvailableAutoSnapshots } from '../../utils/autoSnapshot';

interface SystemHealthSectionProps {
  currentClubId?: string;
}

export const SystemHealthSection: React.FC<SystemHealthSectionProps> = ({
  currentClubId = 'club-royal-cue',
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    message?: string;
  }>({ connected: false, message: 'Not checked yet' });
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString());
  const [snapshotCount, setSnapshotCount] = useState<number>(0);
  const isAuthVerified = Boolean(auth.currentUser?.emailVerified);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const res = await testFirestoreHealth(currentClubId);
      setDbStatus(res);
      setLastCheckTime(new Date().toLocaleTimeString());
    } catch (e: any) {
      setDbStatus({ connected: false, message: e?.message || 'Offline' });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    try {
      const snaps = getAvailableAutoSnapshots();
      setSnapshotCount(snaps.length);
    } catch {}
  }, [currentClubId]);

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-white rounded-2xl p-5 sm:p-6 border border-neutral-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              dbStatus.connected
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : isChecking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white">System Status</h4>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  dbStatus.connected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isChecking
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-emerald-400 animate-pulse' : isChecking ? 'bg-amber-300 animate-pulse' : 'bg-rose-400'}`} />
                  {isChecking ? 'Checking club database' : dbStatus.connected ? 'Club database connected' : 'Club database unavailable'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Checks access to this club’s saved settings in Firestore.
              </p>
            </div>
          </div>

          <button
            onClick={runHealthCheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check Connectivity</span>
          </button>
        </div>
      </div>

      {/* 4 Health Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Cloud Database */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold text-xs">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cloud Database</span>
            </div>
            <StatusPill active={dbStatus.connected} checking={isChecking} />
          </div>
          <p className="text-[11px] text-neutral-500">
            Firestore connection for this club workspace.
          </p>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>Latency</span>
            <span className="font-bold text-neutral-700">
              {dbStatus.latencyMs ? `${dbStatus.latencyMs} ms` : 'Not measured'}
            </span>
          </div>
        </div>

        {/* Card 2: Authentication Service */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Authentication</span>
            </div>
            <StatusPill active={isAuthVerified} />
          </div>
          <p className="text-[11px] text-neutral-500">
            Email verification status for the current Firebase sign-in.
          </p>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>Security Model</span>
            <span className="font-bold text-neutral-700">{isAuthVerified ? 'Verified account' : 'Not verified'}</span>
          </div>
        </div>

        {/* Card 3: Realtime Sync */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold text-xs">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>Last database check</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">{dbStatus.connected ? 'Successful' : isChecking ? 'Checking' : 'No connection'}</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            This is the time of the most recent manual or automatic Firestore check.
          </p>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>Last Sync</span>
            <span className="font-bold text-neutral-700">{lastCheckTime || 'Not checked'}</span>
          </div>
        </div>

        {/* Card 4: Backup Health */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold text-xs">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>Backup Status</span>
            </div>
            <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${snapshotCount > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-800 bg-amber-50 border-amber-200'}`}>
              {snapshotCount > 0 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {snapshotCount > 0 ? 'Local copies found' : 'No local copies'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Daily snapshots are stored in this browser only. Use Backup & Restore to download a separate copy.
          </p>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>Snapshots Stored</span>
            <span className="font-bold text-neutral-700">{snapshotCount} Daily Backups</span>
          </div>
        </div>
      </div>

      {/* Technical Summary Information */}
      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs space-y-2 text-neutral-600">
        <div className="flex items-center justify-between">
          <span className="font-bold text-neutral-800">Application Version</span>
          <span className="font-mono font-semibold">One Shot Club Manager</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-neutral-800">Configuration Source</span>
          <span className="font-mono capitalize font-semibold text-neutral-800">
            {currentConfigSource === 'env' ? 'Deployment environment variables' : currentConfigSource === 'custom' ? 'Legacy custom setting (ignored)' : 'Bundled development config'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-neutral-800">Active Club Workspace</span>
          <span className="font-mono font-semibold text-neutral-800">{currentClubId}</span>
        </div>
      </div>

    </div>
  );
};

const StatusPill: React.FC<{ active: boolean; checking?: boolean }> = ({ active, checking = false }) => (
  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
    checking
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : active
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-rose-200 bg-rose-50 text-rose-800'
  }`}>
    {checking ? 'Checking' : active ? 'Available' : 'Unavailable'}
  </span>
);
