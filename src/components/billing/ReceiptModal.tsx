import React from 'react';
import { 
  Printer, 
  Share2, 
  CheckCircle2, 
  CircleDot, 
  Download,
  Receipt as ReceiptIcon
} from 'lucide-react';
import { SessionHistoryItem, BusinessConfig } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency, formatTimerString } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItem: SessionHistoryItem | null;
  config: BusinessConfig;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  historyItem,
  config,
}) => {
  if (!isOpen || !historyItem) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Receipt"
      subtitle={`Receipt #${historyItem.receiptNo}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* Clean Receipt Container */}
        <div id="printable-receipt" className="bg-white border border-neutral-200 rounded-3xl p-6 flex flex-col gap-5 shadow-xs">
          {/* Header */}
          <div className="text-center pb-4 border-b border-neutral-100 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-2 shadow-xs">
              <CircleDot className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-neutral-900">{config.clubName}</h2>
            <p className="text-[11px] text-neutral-500">{config.address}</p>
            <p className="text-[11px] text-neutral-500">Tel: {config.phone}</p>
          </div>

          {/* Receipt Info */}
          <div className="flex justify-between text-xs text-neutral-600 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/60">
            <div>
              <span className="text-neutral-400 block text-[10px]">CUSTOMER</span>
              <strong className="text-neutral-900">{historyItem.customerName}</strong>
              {historyItem.customerPhone && (
                <span className="text-neutral-500 block text-[11px] font-mono">{historyItem.customerPhone}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-neutral-400 block text-[10px]">DATE & TIME</span>
              <strong className="text-neutral-900">{historyItem.timestamp}</strong>
              <span className="text-neutral-400 block text-[10px] font-mono mt-0.5">No: {historyItem.receiptNo}</span>
            </div>
          </div>

          {/* Table & Session details */}
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Table</span>
              <span className="font-semibold text-neutral-900">{historyItem.tableName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Playing Time</span>
              <span className="font-mono font-semibold text-neutral-900">
                {formatTimerString(historyItem.durationSeconds)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Table Charge</span>
              <span className="font-mono text-neutral-900">{formatCurrency(historyItem.tableFee, config.currencySymbol)}</span>
            </div>

            {/* Food items breakdown */}
            {historyItem.foodOrders && historyItem.foodOrders.length > 0 && (
              <div className="py-1 border-b border-neutral-100 flex flex-col gap-1">
                <div className="flex justify-between text-neutral-600 font-semibold">
                  <span>Food & Beverages</span>
                  <span className="font-mono text-neutral-900">{formatCurrency(historyItem.foodFee, config.currencySymbol)}</span>
                </div>
                <div className="pl-2 flex flex-col gap-0.5 text-[11px] text-neutral-500">
                  {historyItem.foodOrders.map((f, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{f.name} x{f.quantity}</span>
                      <span className="font-mono">{formatCurrency(f.price * f.quantity, config.currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra charges */}
            {historyItem.extraCharges && historyItem.extraCharges.length > 0 && (
              <div className="py-1 border-b border-neutral-100 flex flex-col gap-1">
                <div className="flex justify-between text-neutral-600 font-semibold">
                  <span>Extra Manual Charges</span>
                  <span className="font-mono text-neutral-900">{formatCurrency(historyItem.extraFee || 0, config.currencySymbol)}</span>
                </div>
                <div className="pl-2 flex flex-col gap-0.5 text-[11px] text-neutral-500">
                  {historyItem.extraCharges.map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{c.name}</span>
                      <span className="font-mono">{formatCurrency(c.amount, config.currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {historyItem.discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-neutral-100 text-emerald-600">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(historyItem.discountAmount, config.currencySymbol)}</span>
              </div>
            )}

            <div className="pt-2 flex justify-between items-baseline text-sm font-extrabold text-neutral-900">
              <span>Total</span>
              <span className="text-lg font-mono">{formatCurrency(historyItem.grandTotal, config.currencySymbol)}</span>
            </div>

            <div className="flex justify-between items-baseline text-xs font-semibold text-neutral-700">
              <span>Amount Paid</span>
              <span className="font-mono text-emerald-600">{formatCurrency(historyItem.amountPaid ?? historyItem.grandTotal, config.currencySymbol)}</span>
            </div>

            {(historyItem.balanceDue || 0) > 0 && (
              <div className="flex justify-between items-baseline text-xs font-semibold text-rose-600">
                <span>Balance Remaining</span>
                <span className="font-mono">{formatCurrency(historyItem.balanceDue, config.currencySymbol)}</span>
              </div>
            )}

            {historyItem.paymentMethod === 'split' && historyItem.splitBreakdown && (
              <div className="mt-1 p-2 bg-neutral-50 rounded-xl text-[11px] text-neutral-600 flex justify-around">
                <span>Cash: {formatCurrency(historyItem.splitBreakdown.cash, config.currencySymbol)}</span>
                <span>UPI: {formatCurrency(historyItem.splitBreakdown.upi, config.currencySymbol)}</span>
                <span>Card: {formatCurrency(historyItem.splitBreakdown.card, config.currencySymbol)}</span>
              </div>
            )}

            {/* Payment Status Badge */}
            <div className={`mt-2 text-center py-1.5 rounded-xl text-xs font-bold border uppercase ${
              historyItem.paymentStatus === 'refunded'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : historyItem.paymentStatus === 'due_ledger' || historyItem.paymentMethod === 'due_ledger'
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                : historyItem.paymentStatus === 'partially_paid'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {historyItem.paymentStatus === 'refunded' ? (
                <>REFUNDED • Reason: {historyItem.refundReason || 'Customer Request'}</>
              ) : historyItem.paymentStatus === 'due_ledger' || historyItem.paymentMethod === 'due_ledger' ? (
                <>PAYMENT DUE • CREDIT LEDGER</>
              ) : historyItem.paymentStatus === 'partially_paid' ? (
                <>Partially Paid via {historyItem.paymentMethod.toUpperCase()}</>
              ) : (
                <>Paid via {historyItem.paymentMethod.toUpperCase()} • Completed</>
              )}
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center text-[10px] text-neutral-400 border-t border-neutral-100 pt-3">
            {config.receiptFooterMsg}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {historyItem.customerPhone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const phoneClean = historyItem.customerPhone?.replace(/[^0-9]/g, '') || '';
                const msg = `🎱 *${config.clubName || 'ONE SHOT SNOOKER GAMING CLUB'} - DIGITAL RECEIPT* 🎱\n` +
                  `Receipt #: ${historyItem.receiptNo}\n` +
                  `Date: ${historyItem.timestamp}\n` +
                  `Customer: ${historyItem.customerName}\n` +
                  `Table: ${historyItem.tableName}\n` +
                  `Time Played: ${formatTimerString(historyItem.durationSeconds)}\n` +
                  `----------------------------\n` +
                  `Table Charge: ₹${historyItem.tableFee.toFixed(2)}\n` +
                  (historyItem.foodFee > 0 ? `Food & Drinks: ₹${historyItem.foodFee.toFixed(2)}\n` : '') +
                  (historyItem.discountAmount > 0 ? `Discount: -₹${historyItem.discountAmount.toFixed(2)}\n` : '') +
                  (historyItem.taxAmount > 0 ? `Tax (${config.taxRatePercent}%): ₹${historyItem.taxAmount.toFixed(2)}\n` : '') +
                  `----------------------------\n` +
                  `*GRAND TOTAL: ₹${historyItem.grandTotal.toFixed(2)}*\n` +
                  `Status: ${historyItem.paymentMethod.toUpperCase()} (${historyItem.paymentStatus.toUpperCase()})\n` +
                  `----------------------------\n` +
                  `Thank you for playing at ${config.clubName || 'One Shot Snooker'}! See you next time.`;
                
                window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
            >
              WhatsApp Receipt
            </Button>
          )}
          <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
