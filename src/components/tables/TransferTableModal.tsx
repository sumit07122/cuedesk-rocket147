import React, { useState } from 'react';
import { ArrowRightLeft, Grid2X2 } from 'lucide-react';
import { TableItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

interface TransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: TableItem | null;
  availableTables: TableItem[];
  currencySymbol: string;
  onConfirmTransfer: (sourceTableId: string, targetTableId: string) => void;
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  availableTables,
  currencySymbol,
  onConfirmTransfer,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  React.useEffect(() => {
    if (availableTables.length > 0) {
      setSelectedTargetId(availableTables[0].id);
    }
  }, [availableTables]);

  if (!isOpen || !currentTable) return null;

  const handleTransfer = () => {
    if (!selectedTargetId) return;
    onConfirmTransfer(currentTable.id, selectedTargetId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Session to Another Table"
      subtitle={`Move active session timer & orders from Table #${currentTable.number}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* Current Table Summary */}
        <div className="p-4 rounded-2xl bg-neutral-100/70 border border-neutral-200 text-xs flex justify-between items-center">
          <div>
            <span className="text-neutral-500 block">Current Table</span>
            <span className="text-sm font-bold text-neutral-900">
              Table #{currentTable.number} — {currentTable.name}
            </span>
          </div>
          <span className="font-semibold text-neutral-700">{currentTable.currentSession?.customerName}</span>
        </div>

        {/* Target Table Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-700">Select Available Destination Table</label>
          {availableTables.length > 0 ? (
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full bg-white text-neutral-900 text-sm rounded-xl border border-neutral-200/90 px-3.5 py-2.5 outline-none focus:border-neutral-900"
            >
              {availableTables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table #{t.number.toString().padStart(2, '0')} — {t.name} ({formatCurrency(t.hourlyRate, currencySymbol)}/hr)
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
              No available tables to transfer to right now. All other tables are currently occupied.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
            disabled={availableTables.length === 0}
            onClick={handleTransfer}
          >
            Transfer Session Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
