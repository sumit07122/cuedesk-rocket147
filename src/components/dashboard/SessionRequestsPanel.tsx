import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Phone, 
  User, 
  AlertCircle,
  Square,
  MessageSquare
} from 'lucide-react';
import { SessionRequest, TableItem } from '../../types';
import { Button } from '../ui/Button';

interface SessionRequestsPanelProps {
  requests: SessionRequest[];
  tables: TableItem[];
  onApprove: (request: SessionRequest) => void;
  onReject: (requestId: string) => void;
  onEndTableSession?: (table: TableItem) => void;
}

export const SessionRequestsPanel: React.FC<SessionRequestsPanelProps> = ({
  requests,
  tables,
  onApprove,
  onReject,
  onEndTableSession,
}) => {
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (pendingRequests.length === 0) return null;

  const getTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}m ago`;
  };

  const modeIcon: Record<string, string> = {
    solo: '🎱',
    '1v1': '⚔️',
    doubles: '👥',
    group: '🏆',
  };

  return (
    <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xs transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
              Live Session Requests
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingRequests.length}
              </span>
            </h3>
            <p className="text-[11px] text-amber-800">
              Customers scanned table QR codes and are waiting for Desk Marker approval.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pendingRequests.map((req) => {
          const tableObj = tables.find((t) => t.id === req.tableId);
          const isTableOccupied = tableObj?.status === 'occupied' || tableObj?.status === 'payment_pending';

          return (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-amber-200/80 p-3.5 flex flex-col justify-between gap-3 shadow-2xs relative"
            >
              {/* Request Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                    Table #{tableObj?.number || req.tableId}
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 mt-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    {req.customerName}
                  </h4>
                  {req.customerPhone && (
                    <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      {req.customerPhone}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {getTimeAgo(req.timestamp)}
                  </span>
                  <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md">
                    <Users className="w-3 h-3 text-neutral-500" />
                    {req.playersCount || 2} Players
                  </span>
                  {(req as any).matchMode && (
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      {modeIcon[(req as any).matchMode] || '🎱'} {(req as any).matchMode}
                    </span>
                  )}
                </div>
              </div>

              {/* Occupied Table Warning */}
              {isTableOccupied && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Table is occupied. You can end the current session first, then approve this request.</span>
                  </div>
                  {tableObj && onEndTableSession && (
                    <button
                      type="button"
                      onClick={() => onEndTableSession(tableObj)}
                      className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Square className="w-3 h-3" />
                      End Current Table Session
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => onReject(req.id)}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5 text-neutral-400" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(req)}
                  disabled={isTableOccupied}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isTableOccupied
                      ? 'bg-neutral-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-2xs'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
