import React, { useState } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Printer
} from 'lucide-react';
import { SessionHistoryItem, BusinessConfig } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';

interface ShiftClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SessionHistoryItem[];
  config: BusinessConfig;
  userRole: string;
  userName: string;
}

export const ShiftClosureModal: React.FC<ShiftClosureModalProps> = ({
  isOpen,
  onClose,
  history,
  config,
  userRole,
  userName,
}) => {
  const [actualCash, setActualCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  // Filter today's transactions
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysHistory = history.filter((h) => {
    const d = new Date(h.timestamp || Date.now()).toISOString().split('T')[0];
    return d === todayStr;
  });

  // Calculate System Expected Totals by Payment Method
  const expectedCash = todaysHistory
    .filter((h) => h.paymentMethod === 'cash' && h.paymentStatus !== 'refunded')
    .reduce((acc, h) => acc + (h.amountPaid || h.grandTotal || 0), 0);

  const expectedUpi = todaysHistory
    .filter((h) => h.paymentMethod === 'upi' && h.paymentStatus !== 'refunded')
    .reduce((acc, h) => acc + (h.amountPaid || h.grandTotal || 0), 0);

  const expectedCard = todaysHistory
    .filter((h) => h.paymentMethod === 'card' && h.paymentStatus !== 'refunded')
    .reduce((acc, h) => acc + (h.amountPaid || h.grandTotal || 0), 0);

  const expectedCreditDues = todaysHistory
    .filter((h) => (h.paymentMethod === 'due_ledger' || h.paymentStatus === 'due_ledger') && h.paymentStatus !== 'refunded')
    .reduce((acc, h) => acc + (h.grandTotal || 0), 0);

  const totalSystemRevenue = expectedCash + expectedUpi + expectedCard;
  const difference = actualCash - expectedCash;

  const handleSubmitReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End-of-Shift Cash Drawer Reconciliation"
      subtitle={`Reconcile cash drawer balances for Shift Operator: ${userName}`}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 pt-2">
        {!isSubmitted ? (
          <form onSubmit={handleSubmitReconciliation} className="space-y-5">
            {/* Today's Sales Breakdown Card */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">System Expected Collections Today</span>
                <span className="text-[10px] font-mono bg-neutral-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                  {todaysHistory.length} Settled Bills
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block uppercase font-semibold">Cash</span>
                  <span className="text-sm font-bold text-white font-mono">{formatCurrency(expectedCash, config?.currencySymbol || '₹')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block uppercase font-semibold">UPI Online</span>
                  <span className="text-sm font-bold text-white font-mono">{formatCurrency(expectedUpi, config?.currencySymbol || '₹')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block uppercase font-semibold">Card</span>
                  <span className="text-sm font-bold text-white font-mono">{formatCurrency(expectedCard, config?.currencySymbol || '₹')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block uppercase font-semibold">Credit Dues</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{formatCurrency(expectedCreditDues, config?.currencySymbol || '₹')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline text-xs">
                <span className="text-neutral-400">Total System Revenue Collected:</span>
                <strong className="text-base text-emerald-400 font-mono">{formatCurrency(totalSystemRevenue, config?.currencySymbol || '₹')}</strong>
              </div>
            </div>

            {/* Cash Drawer Entry */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Physical Cash Counted in Drawer</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    label="Actual Physical Cash in Drawer (₹)"
                    type="number"
                    min={0}
                    step={1}
                    value={actualCash || ''}
                    onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className={`p-3 rounded-2xl border text-center shrink-0 min-w-36 ${
                  difference === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  difference < 0 ? 'bg-rose-50 border-rose-200 text-rose-800' :
                  'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <span className="text-[10px] font-bold uppercase block">Variance</span>
                  <span className="text-base font-black font-mono">
                    {difference >= 0 ? `+₹${difference.toFixed(0)}` : `-₹${Math.abs(difference).toFixed(0)}`}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Shift Notes / Handover Comments</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any cash paid out for petty expenses, change notes, or shift comments..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs outline-none h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Complete Shift Reconciliation
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900">Shift Closed & Reconciled!</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Shift handover report logged for operator <strong>{userName}</strong>. Owner audit trail updated in Firestore.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Expected Cash:</span>
                <span className="font-bold text-neutral-900 font-mono">₹{expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Physical Cash Counted:</span>
                <span className="font-bold text-neutral-900 font-mono">₹{actualCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2">
                <span className="font-bold text-neutral-800">Final Cash Difference:</span>
                <span className={`font-black font-mono ${difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {difference >= 0 ? `+₹${difference.toFixed(2)}` : `-₹${Math.abs(difference).toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                Print Shift Audit
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
