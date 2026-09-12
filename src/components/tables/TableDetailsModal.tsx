import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  ArrowRightLeft, 
  Clock, 
  User, 
  Phone, 
  Utensils, 
  Receipt, 
  Trash2, 
  Sparkles,
  Tag,
  QrCode,
  Trophy
} from 'lucide-react';
import { TableItem, SessionData } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatPerMinuteRate, calculateSessionSeconds, formatTimerString, calculateBillTotals } from '../../utils/formatters';

interface TableDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableItem | null;
  currencySymbol: string;
  taxRatePercent: number;
  enableTax: boolean;
  onStartSession: (table: TableItem) => void;
  onPauseResumeSession: (table: TableItem) => void;
  onEndSession: (table: TableItem) => void;
  onOpenAddSnacks: (table: TableItem) => void;
  onOpenTransferTable: (table: TableItem) => void;
  onRemoveOrderItem?: (tableId: string, orderId: string) => void;
}

export const TableDetailsModal: React.FC<TableDetailsModalProps> = ({
  isOpen,
  onClose,
  table,
  currencySymbol,
  taxRatePercent,
  enableTax,
  onStartSession,
  onPauseResumeSession,
  onEndSession,
  onOpenAddSnacks,
  onOpenTransferTable,
  onRemoveOrderItem,
}) => {
  const [now, setNow] = useState(Date.now());
  const [p1Frames, setP1Frames] = useState(0);
  const [p2Frames, setP2Frames] = useState(0);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

  useEffect(() => {
    if (table?.currentSession?.customerName) {
      setPlayer1Name(table.currentSession.customerName);
    }
  }, [table]);

  useEffect(() => {
    if (!isOpen || !table || table.status !== 'occupied' || table.currentSession?.isPaused) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isOpen, table]);

  if (!table) return null;

  const isOccupied = table.status === 'occupied' && table.currentSession;
  const session = table.currentSession;

  let seconds = 0;
  let billData = { tableFee: 0, foodFee: 0, subtotal: 0, taxAmount: 0, grandTotal: 0, discountAmount: 0, taxableAmount: 0 };

  if (isOccupied && session) {
    seconds = calculateSessionSeconds(session, now);
    billData = calculateBillTotals(session, taxRatePercent, enableTax, 0, now);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${table.name}`}
      subtitle={`Table #${table.number.toString().padStart(2, '0')} • ${table.type.toUpperCase()}`}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* Status & Rate Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div className="flex items-center gap-2">
            <Badge variant={table.status} />
            <span className="text-xs text-neutral-500 font-medium">
              Rate: <strong className="text-neutral-900">{formatPerMinuteRate(table.perMinuteRate ? table.perMinuteRate * 60 : table.hourlyRate, currencySymbol)}</strong>
              <span className="text-[11px] text-neutral-400 font-normal ml-1">({formatCurrency(table.hourlyRate, currencySymbol)}/hr)</span>
            </span>
          </div>

          {!isOccupied && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="w-4 h-4 fill-current text-white" />}
              onClick={() => {
                onClose();
                onStartSession(table);
              }}
            >
              Start Session
            </Button>
          )}
        </div>

        {/* OCCUPIED SESSION WORKSPACE */}
        {isOccupied && session ? (
          <>
            {/* Hero Timer Display */}
            <div className="bg-neutral-900 text-white rounded-3xl p-6 text-center flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Session Elapsed Time
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight my-1 text-emerald-400">
                {formatTimerString(seconds)}
              </div>
              {session.isPaused ? (
                <span className="text-xs font-bold text-amber-300 bg-amber-900/60 px-3 py-1 rounded-full border border-amber-500/40 mt-1">
                  Paused at {formatTimerString(seconds)}
                </span>
              ) : (
                <span className="text-[11px] text-neutral-400 mt-1">
                  Started at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              {/* Action Buttons Row under timer */}
              <div className="flex items-center gap-2 mt-5">
                <Button
                  variant={session.isPaused ? 'success' : 'secondary'}
                  size="sm"
                  leftIcon={session.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  onClick={() => onPauseResumeSession(table)}
                >
                  {session.isPaused ? 'Resume Timer' : 'Pause Session'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ArrowRightLeft className="w-4 h-4" />}
                  onClick={() => {
                    onClose();
                    onOpenTransferTable(table);
                  }}
                >
                  Transfer Table
                </Button>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 font-bold text-sm border border-neutral-200">
                  {session.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-neutral-900">{session.customerName}</h4>
                    {session.isMember && (
                      <span className="text-[10px] bg-neutral-900 text-white font-bold px-1.5 py-0.5 rounded">
                        VIP {session.memberDiscountPercent}% OFF
                      </span>
                    )}
                  </div>
                  {session.customerPhone && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      {session.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold bg-neutral-100 px-2.5 py-1.5 rounded-xl border border-neutral-200/80">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                <span>{session.playersCount || 2} Players</span>
              </div>
            </div>

            {/* Live Match Frame Scorekeeper Card */}
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white rounded-2xl p-4 border border-amber-500/20 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Live Match Scorekeeper (Best of 5 Frames)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded border border-amber-500/30">
                  ONE SHOT ARENA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                {/* Player 1 Box */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                  <input
                    type="text"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="text-xs font-bold text-center bg-transparent border-b border-white/20 pb-0.5 w-full outline-none text-neutral-200"
                  />
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setP1Frames(Math.max(0, p1Frames - 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black font-mono text-amber-400">{p1Frames}</span>
                    <button
                      type="button"
                      onClick={() => setP1Frames(p1Frames + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Frames Won</span>
                </div>

                {/* Player 2 Box */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                  <input
                    type="text"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="text-xs font-bold text-center bg-transparent border-b border-white/20 pb-0.5 w-full outline-none text-neutral-200"
                  />
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setP2Frames(Math.max(0, p2Frames - 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black font-mono text-amber-400">{p2Frames}</span>
                    <button
                      type="button"
                      onClick={() => setP2Frames(p2Frames + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Frames Won</span>
                </div>
              </div>
            </div>

            {/* Food & Beverage Orders */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-neutral-700" />
                  Food & Drinks ({session.foodOrders.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onClose();
                    onOpenAddSnacks(table);
                  }}
                >
                  Add Items
                </Button>
              </div>

              {session.foodOrders.length > 0 ? (
                <div className="bg-neutral-50 rounded-2xl border border-neutral-200/80 divide-y divide-neutral-200/60 max-h-40 overflow-y-auto">
                  {session.foodOrders.map((order) => (
                    <div key={order.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-neutral-900">{order.name}</span>
                        <span className="text-neutral-500 ml-2">x{order.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium text-neutral-800">
                          {formatCurrency(order.price * order.quantity, currencySymbol)}
                        </span>
                        {onRemoveOrderItem && (
                          <button
                            onClick={() => onRemoveOrderItem(table.id, order.id)}
                            className="text-neutral-400 hover:text-rose-600 p-1 rounded"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-xs text-neutral-400">
                  No food or drinks added yet.
                </div>
              )}
            </div>

            {/* Current Bill Breakdown */}
            <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Table Time Fee ({formatCurrency(table.hourlyRate, currencySymbol)}/hr)</span>
                <span className="font-mono font-medium text-neutral-900">
                  {formatCurrency(billData.tableFee, currencySymbol)}
                </span>
              </div>
              {billData.foodFee > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Food & Beverage Subtotal</span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(billData.foodFee, currencySymbol)}
                  </span>
                </div>
              )}
              {enableTax && billData.taxAmount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Est. Tax ({taxRatePercent}%)</span>
                  <span className="font-mono font-medium text-neutral-800">
                    {formatCurrency(billData.taxAmount, currencySymbol)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline text-sm font-bold text-neutral-900">
                <span>Current Total</span>
                <span className="text-base font-mono text-neutral-900">
                  {formatCurrency(billData.grandTotal, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="md" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="danger"
                size="md"
                leftIcon={<Square className="w-4 h-4 fill-current" />}
                onClick={() => {
                  onClose();
                  onEndSession(table);
                }}
              >
                Checkout & End Session
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-xs text-neutral-500">
            Table is currently empty and available for a new session.
          </div>
        )}
      </div>
    </Modal>
  );
};
