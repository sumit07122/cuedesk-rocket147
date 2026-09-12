import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  Plus, 
  Clock, 
  User, 
  Utensils, 
  ArrowRight,
  MoreVertical,
  CircleDot,
  QrCode
} from 'lucide-react';
import { TableItem, SessionData } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatPerMinuteRate, calculateSessionSeconds, formatTimerString, calculateBillTotals } from '../../utils/formatters';

interface TableCardProps {
  table: TableItem;
  currencySymbol?: string;
  taxRatePercent?: number;
  enableTax?: boolean;
  onSelectTable: (table: TableItem) => void;
  onStartSession: (table: TableItem) => void;
  onEndSession: (table: TableItem) => void;
  onPauseResumeSession: (table: TableItem) => void;
  onAddSnack: (table: TableItem) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  currencySymbol = '$',
  taxRatePercent = 8,
  enableTax = true,
  onSelectTable,
  onStartSession,
  onEndSession,
  onPauseResumeSession,
  onAddSnack,
}) => {
  const [now, setNow] = useState(Date.now());

  // Update live timer every second for occupied active tables
  useEffect(() => {
    if (table.status !== 'occupied' || !table.currentSession || table.currentSession.isPaused) {
      return;
    }
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [table.status, table.currentSession]);

  const isOccupied = (table.status === 'occupied' || table.status === 'payment_pending') && table.currentSession;
  const isAvailable = table.status === 'available';
  const isReserved = table.status === 'reserved';
  const isCleaning = table.status === 'cleaning';
  const isPaymentPending = table.status === 'payment_pending';

  let timerSeconds = 0;
  let currentBill = 0;
  let foodCount = 0;

  if (isOccupied && table.currentSession) {
    timerSeconds = calculateSessionSeconds(table.currentSession, now);
    const totals = calculateBillTotals(table.currentSession, taxRatePercent, enableTax, 0, now);
    currentBill = totals.grandTotal;
    foodCount = table.currentSession.foodOrders.reduce((acc, order) => acc + order.quantity, 0);
  }

  return (
    <div
      onClick={() => onSelectTable(table)}
      className={`group bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer relative overflow-hidden ${
        isPaymentPending
          ? 'border-purple-300 bg-purple-50/20'
          : isOccupied
          ? table.currentSession?.isPaused
            ? 'border-amber-300/80 bg-amber-50/20'
            : 'border-emerald-300/80 bg-emerald-50/10'
          : isReserved
          ? 'border-amber-200 bg-amber-50/30'
          : isCleaning
          ? 'border-slate-200 bg-slate-50/50'
          : 'border-neutral-200/90 hover:border-neutral-300'
      }`}
    >
      {/* Top Bar: Table Number, Type & Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-neutral-900 tracking-tight font-mono">
              #{table?.number != null ? table.number.toString().padStart(2, '0') : '00'}
            </span>
            <span className={`text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
              table.type === 'snooker'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : table.type === 'pool' || table.type === 'american_pool'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : table.type === 'table_tennis'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : table.type === 'ps5' || table.type === 'ps4'
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : table.type === 'magnet_table'
                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                : table.type === 'vip'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-neutral-100 text-neutral-700'
            }`}>
              {table.type === 'snooker' ? '🔴 Snooker' 
                : table.type === 'pool' ? '🎱 Pool' 
                : table.type === 'american_pool' ? '🎱 American Pool' 
                : table.type === 'table_tennis' ? '🏓 Table Tennis' 
                : table.type === 'ps5' ? '🎮 PS5' 
                : table.type === 'ps4' ? '🎮 PS4' 
                : table.type === 'magnet_table' ? '🧲 Magnet Table' 
                : table.type.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] mt-0.5">
            {table.name}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant={table.status} />
        </div>
      </div>

      {/* Middle Section: Live Timer & Bill for Occupied tables OR Status detail */}
      <div className="my-4 py-2">
        {isOccupied && table.currentSession ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-0.5">
                  Running Timer
                </span>
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${table.currentSession.isPaused ? 'text-amber-500' : 'text-emerald-600 animate-pulse'}`} />
                  <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
                    {formatTimerString(timerSeconds)}
                  </span>
                  {table.currentSession.isPaused && (
                    <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-100 px-1.5 py-0.5 rounded">
                      PAUSED
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-0.5">
                  Current Bill
                </span>
                <span className="text-xl font-bold text-neutral-900">
                  {formatCurrency(currentBill, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Customer Details & Snacks count */}
            <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
              <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="font-semibold text-neutral-800 truncate">
                  {table.currentSession.customerName}
                </span>
                {table.currentSession.isMember && (
                  <span className="text-[10px] bg-neutral-900 text-white font-bold px-1 rounded">VIP</span>
                )}
              </div>

              {foodCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded-md">
                  <Utensils className="w-3 h-3 text-neutral-500" />
                  <span>{foodCount} items</span>
                </div>
              )}
            </div>
          </div>
        ) : isReserved ? (
          <div className="py-2 px-3 rounded-xl bg-amber-100/50 border border-amber-200 text-xs">
            <p className="font-semibold text-amber-900">Reserved for {table.reservedCustomer || 'Guest'}</p>
            <p className="text-amber-700 text-[11px] mt-0.5">Scheduled: {table.reservedTime}</p>
          </div>
        ) : isCleaning ? (
          <div className="py-2 px-3 rounded-xl bg-slate-100 text-xs text-slate-600">
            <p className="font-semibold">Cleaning & Maintenance</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready shortly</p>
          </div>
        ) : (
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-xs text-neutral-400 block font-medium">Session Rate</span>
              <span className="text-sm font-extrabold text-neutral-900">
                {formatPerMinuteRate(table.perMinuteRate ? table.perMinuteRate * 60 : table.hourlyRate, currencySymbol)}
                <span className="text-[11px] font-normal text-neutral-500 ml-1">
                  ({formatCurrency(table.hourlyRate, currencySymbol)}/hr)
                </span>
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              Ready
            </span>
          </div>
        )}
      </div>

      {/* Bottom Actions Row */}
      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        {isOccupied ? (
          <>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPauseResumeSession(table)}
                title={table.currentSession?.isPaused ? 'Resume Session' : 'Pause Session'}
              >
                {table.currentSession?.isPaused ? (
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                )}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAddSnack(table)}
                title="Add Food & Beverage"
              >
                <Plus className="w-3.5 h-3.5 text-neutral-700" />
                <span className="hidden sm:inline text-xs">Snacks</span>
              </Button>
            </div>

            <Button
              variant="danger"
              size="sm"
              leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
              onClick={() => onEndSession(table)}
            >
              End Session
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center"
            leftIcon={<Play className="w-4 h-4 fill-current text-white" />}
            onClick={() => onStartSession(table)}
          >
            Start Session
          </Button>
        )}
      </div>
    </div>
  );
};
