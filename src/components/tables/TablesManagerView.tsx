import React, { useState } from 'react';
import { 
  Grid2X2, 
  CircleDot, 
  Clock, 
  Search, 
  Plus, 
  Sparkles, 
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TableItem, TableType } from '../../types';
import { TableCard } from '../dashboard/TableCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TablesManagerViewProps {
  tables: TableItem[];
  currencySymbol: string;
  taxRatePercent: number;
  enableTax: boolean;
  onSelectTable: (table: TableItem) => void;
  onStartSession: (table: TableItem) => void;
  onEndSession: (table: TableItem) => void;
  onPauseResumeSession: (table: TableItem) => void;
  onAddSnack: (table: TableItem) => void;
  onQuickStartAnySession: () => void;
  onTransferTableClick?: () => void;
}

export const TablesManagerView: React.FC<TablesManagerViewProps> = ({
  tables,
  currencySymbol,
  taxRatePercent,
  enableTax,
  onSelectTable,
  onStartSession,
  onEndSession,
  onPauseResumeSession,
  onAddSnack,
  onQuickStartAnySession,
  onTransferTableClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | TableType | 'occupied' | 'available'>('all');

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const totalTables = tables.length;

  const filteredTables = tables.filter((table) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      table.number.toString().includes(q) ||
      table.name.toLowerCase().includes(q) ||
      (table.currentSession && table.currentSession.customerName.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (selectedTypeFilter === 'occupied') return table.status === 'occupied';
    if (selectedTypeFilter === 'available') return table.status === 'available';
    if (selectedTypeFilter !== 'all') return table.type === selectedTypeFilter;

    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Grid2X2 className="w-6 h-6 text-neutral-900" />
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Table Layout & Live Timers</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time table control grid — manage active sessions, pause timers, add snacks, or transfer players
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-2xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-neutral-700">{occupiedCount} Occupied</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500">{availableCount} Available</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onQuickStartAnySession}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Start Session
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search table #, name or player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All Tables' },
            { id: 'occupied', label: `Occupied (${occupiedCount})` },
            { id: 'available', label: `Available (${availableCount})` },
            { id: 'snooker', label: '🔴 Snooker' },
            { id: 'pool', label: '🎱 Pool' },
            { id: 'vip', label: '👑 VIP' },
            { id: 'carom', label: '⚪ Carom' },
            { id: 'ps5', label: '🎮 PS5' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTypeFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTypeFilter === tab.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Cards Grid */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              currencySymbol={currencySymbol}
              taxRatePercent={taxRatePercent}
              enableTax={enableTax}
              onSelectTable={onSelectTable}
              onStartSession={onStartSession}
              onEndSession={onEndSession}
              onPauseResumeSession={onPauseResumeSession}
              onAddSnack={onAddSnack}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200/80 space-y-3">
          <Grid2X2 className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-neutral-800">No tables match your filter</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Try clearing your search query or selecting a different table type filter above.
          </p>
          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedTypeFilter('all'); }}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};
