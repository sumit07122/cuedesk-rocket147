import React, { useState } from 'react';
import { Play, User, Phone } from 'lucide-react';
import { TableItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency, formatPerMinuteRate } from '../../utils/formatters';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableItem | null;
  availableTables: TableItem[];
  currencySymbol: string;
  onConfirmStart: (tableId: string, customerName: string, customerPhone: string, hourlyRate: number) => void;
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

  const activeTargetTable = availableTables.find((t) => t.id === selectedTableId) || table || availableTables[0];

  React.useEffect(() => {
    if (table) {
      setSelectedTableId(table.id);
    } else if (availableTables.length > 0) {
      setSelectedTableId(availableTables[0].id);
    }
  }, [table, availableTables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetTable) return;
    const finalName = customerName.trim() || 'Guest Player';
    onConfirmStart(activeTargetTable.id, finalName, customerPhone.trim(), activeTargetTable.hourlyRate);
    onClose();
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
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
            }}
            className="w-full bg-white text-neutral-900 text-sm rounded-xl border border-neutral-200/90 px-3.5 py-2.5 outline-none focus:border-neutral-900"
          >
            {availableTables.map((t) => (
              <option key={t.id} value={t.id}>
                Table #{t.number.toString().padStart(2, '0')} — {t.name} ({formatPerMinuteRate(t.perMinuteRate ? t.perMinuteRate * 60 : t.hourlyRate, currencySymbol)} • {formatCurrency(t.hourlyRate, currencySymbol)}/hr)
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

        <div className="flex items-center justify-between rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5">
          <label className="text-xs font-semibold text-neutral-700">Configured Session Rate</label>
          <span className="text-[11px] font-mono text-neutral-700 font-bold">
            {formatPerMinuteRate(activeTargetTable?.hourlyRate || 0, currencySymbol)} ({formatCurrency(activeTargetTable?.hourlyRate || 0, currencySymbol)}/hr)
          </span>
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
