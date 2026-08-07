import React, { useState } from 'react';
import { 
  Wrench, 
  Grid2X2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Plus, 
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { TableItem, TableStatus, MaintenanceRecord, BusinessConfig } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';

interface TableMaintenanceViewProps {
  tables: TableItem[];
  maintenanceRecords: MaintenanceRecord[];
  config: BusinessConfig;
  onRecordMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => Promise<void>;
  onResolveMaintenance: (tableId: string, maintenanceId: string) => Promise<void>;
}

export const TableMaintenanceView: React.FC<TableMaintenanceViewProps> = ({
  tables,
  maintenanceRecords,
  config,
  onRecordMaintenance,
  onResolveMaintenance,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [cost, setCost] = useState<number>(0);
  const [markedBy, setMarkedBy] = useState<string>('Manager');
  const [isSaving, setIsSaving] = useState(false);

  const maintenanceTables = tables.filter((t) => t.status === 'maintenance' || t.isMaintenance);

  const handleOpenModal = (tableId?: string) => {
    setSelectedTableId(tableId || tables[0]?.id || '');
    setReason('');
    setCost(0);
    setMarkedBy('Manager');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId || !reason) return;

    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return;

    try {
      setIsSaving(true);
      await onRecordMaintenance({
        clubId: config.id || 'club-royal-cue',
        tableId: table.id,
        tableName: table.name,
        status: 'maintenance',
        reason,
        cost,
        markedBy,
        timestamp: Date.now()
      });
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to mark table for maintenance.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-neutral-900" />
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Table Maintenance & Status Log</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Flag tables under repair or re-felting, log maintenance costs, and manage equipment status history
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          leftIcon={<Wrench className="w-4 h-4" />}
          size="sm"
        >
          Mark Table Maintenance
        </Button>
      </div>

      {/* Currently Under Maintenance Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Tables Currently Under Maintenance ({maintenanceTables.length})</span>
        </h3>

        {maintenanceTables.length === 0 ? (
          <Card className="p-8 text-center text-xs text-neutral-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            All snooker & pool tables are operational and available for gaming sessions!
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maintenanceTables.map((table) => {
              const activeRecord = maintenanceRecords.find(m => m.tableId === table.id && !m.resolvedAt);
              return (
                <Card key={table.id} className="p-5 flex flex-col justify-between gap-4 border-amber-300 bg-amber-50/20">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-neutral-900 text-sm">{table.name}</span>
                      <Badge variant="amber">MAINTENANCE</Badge>
                    </div>
                    {activeRecord && (
                      <div className="space-y-1 text-xs text-neutral-600">
                        <p className="font-semibold text-neutral-800">"{activeRecord.reason}"</p>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                          <span>Cost: {formatCurrency(activeRecord.cost || 0, config?.currencySymbol || '₹')}</span>
                          <span>By: {activeRecord.markedBy}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {activeRecord && (
                    <Button
                      variant="outline"
                      onClick={() => onResolveMaintenance(table.id, activeRecord.id)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                      className="w-full text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                    >
                      Resolve & Set Available
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Maintenance Audit Trail Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Maintenance History & Repair Logs</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200/80 text-neutral-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Issue / Reason</th>
                <th className="py-3 px-4">Repair Cost</th>
                <th className="py-3 px-4">Marked By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {maintenanceRecords.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-neutral-600">
                    {new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-bold text-neutral-900">{m.tableName}</td>
                  <td className="py-3 px-4 text-neutral-700">{m.reason}</td>
                  <td className="py-3 px-4 font-bold text-red-600">
                    {formatCurrency(m.cost || 0, config?.currencySymbol || '₹')}
                  </td>
                  <td className="py-3 px-4 text-neutral-500">{m.markedBy}</td>
                  <td className="py-3 px-4">
                    {m.resolvedAt ? (
                      <Badge variant="emerald">RESOLVED</Badge>
                    ) : (
                      <Badge variant="amber">IN REPAIR</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mark Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-neutral-900">Mark Table Under Maintenance</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Select Table *</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 text-xs font-semibold rounded-xl p-2.5 outline-none"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.status.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Reason / Maintenance Description *</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Felt replacement, slate re-leveling, corner pocket damage repair..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Estimated Cost ({config.currencySymbol})</label>
                  <Input
                    type="number"
                    value={cost || ''}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Reported By</label>
                  <Input
                    value={markedBy}
                    onChange={(e) => setMarkedBy(e.target.value)}
                    placeholder="Manager / Technician"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Mark Table Under Maintenance'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
