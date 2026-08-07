import React, { useState } from 'react';
import { Play, User, Phone, Tag, ShieldCheck, Sparkles } from 'lucide-react';
import { TableItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableItem | null;
  availableTables: TableItem[];
  currencySymbol: string;
  onConfirmStart: (tableId: string, customerName: string, customerPhone: string, isMember: boolean, hourlyRate: number) => void;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  table,
  availableTables,
  currencySymbol,
  onConfirmStart,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [customRate, setCustomRate] = useState<number | undefined>(undefined);

  const activeTargetTable = availableTables.find((t) => t.id === selectedTableId) || table || availableTables[0];

  React.useEffect(() => {
    if (table) {
      setSelectedTableId(table.id);
      setCustomRate(table.hourlyRate);
    } else if (availableTables.length > 0) {
      setSelectedTableId(availableTables[0].id);
      setCustomRate(availableTables[0].hourlyRate);
    }
  }, [table, availableTables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetTable) return;
    const finalName = customerName.trim() || 'Guest Player';
    const rateToUse = customRate !== undefined ? customRate : (activeTargetTable?.hourlyRate || 0);
    onConfirmStart(activeTargetTable.id, finalName, customerPhone.trim(), isMember, rateToUse);
    onClose();
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setIsMember(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Session"
      subtitle="Select table & enter customer details to start timer"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        {/* Table Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-700">Select Table</label>
          <select
            value={selectedTableId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setSelectedTableId(selectedId);
              const found = availableTables.find((t) => t.id === selectedId);
              if (found) setCustomRate(found.hourlyRate);
            }}
            className="w-full bg-white text-neutral-900 text-sm rounded-xl border border-neutral-200/90 px-3.5 py-2.5 outline-none focus:border-neutral-900"
          >
            {availableTables.map((t) => (
              <option key={t.id} value={t.id}>
                Table #{t.number.toString().padStart(2, '0')} — {t.name} ({formatCurrency(t.hourlyRate, currencySymbol)}/hr)
              </option>
            ))}
          </select>
        </div>

        {/* Customer Name */}
        <Input
          label="Customer Name"
          placeholder="e.g. John Doe or Walk-in"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
        />

        {/* Customer Phone */}
        <Input
          label="Phone Number (Optional)"
          placeholder="e.g. +1 555-0192"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          leftIcon={<Phone className="w-4 h-4" />}
        />

        {/* Member VIP Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 cursor-pointer" onClick={() => setIsMember(!isMember)}>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-xs font-semibold text-neutral-900 block">Apply Member VIP Discount</span>
              <span className="text-[11px] text-neutral-500">Applies 10% discount on final bill</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isMember}
            onChange={(e) => setIsMember(e.target.checked)}
            className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer"
          />
        </div>

        {/* Hourly Rate Option & Custom Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-700">Hourly Rate ({currencySymbol}/hr)</label>
            <span className="text-[11px] font-mono text-neutral-500 font-semibold">
              Current: {currencySymbol}{customRate || activeTargetTable?.hourlyRate || 0}/hr
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[180, 220, 250, 320, 400].map((rate) => (
              <button
                type="button"
                key={rate}
                onClick={() => setCustomRate(rate)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  customRate === rate
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {currencySymbol}{rate}
              </button>
            ))}
          </div>

          <Input
            placeholder="Or enter custom rate per hour..."
            type="number"
            value={customRate !== undefined ? customRate.toString() : ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCustomRate(isNaN(val) ? undefined : val);
            }}
            leftIcon={<Tag className="w-4 h-4 text-neutral-400" />}
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Play className="w-4 h-4 fill-current text-white" />}
          >
            Start Timer & Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};
