import React, { useState } from 'react';
import { 
  Grid2X2, 
  CircleDot, 
  DollarSign, 
  Clock, 
  AlertCircle,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Plus,
  TrendingUp,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Bell
} from 'lucide-react';
import { TableItem, TableType, SessionRequest, DashboardWidgetConfig, NotificationItem } from '../../types';
import { StatCard } from './StatCard';
import { TableCard } from './TableCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { formatCurrency } from '../../utils/formatters';

interface DashboardViewProps {
  tables: TableItem[];
  revenueToday: number;
  pendingPaymentsTotal: number;
  currencySymbol: string;
  taxRatePercent?: number;
  enableTax?: boolean;
  minimumChargeMinutes?: number;
  roundingRule?: 'none' | 'nearest_1' | 'nearest_5' | 'round_up';
  lowStockCount?: number;
  netProfitToday?: number;
  sessionRequests?: SessionRequest[];
  notifications?: NotificationItem[];
  widgetConfig?: DashboardWidgetConfig;
  onUpdateWidgetConfig?: (config: DashboardWidgetConfig) => void;
  onApproveRequest?: (req: SessionRequest) => void;
  onRejectRequest?: (requestId: string) => void;
  onMarkNotificationRead?: (id: string) => void;
  onResolveNotification?: (id: string) => void;
  onSelectTable: (table: TableItem) => void;
  onStartSession: (table: TableItem) => void;
  onEndSession: (table: TableItem) => void;
  onPauseResumeSession: (table: TableItem) => void;
  onAddSnack: (table: TableItem) => void;
  onQuickStartAnySession: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tables,
  revenueToday,
  pendingPaymentsTotal,
  currencySymbol,
  taxRatePercent = 0,
  enableTax = false,
  minimumChargeMinutes = 0,
  roundingRule = 'nearest_1',
  lowStockCount = 0,
  netProfitToday = 0,
  sessionRequests = [],
  notifications = [],
  widgetConfig = {
    showRevenue: true,
    showActiveTables: true,
    showPendingPayments: true,
    showLowStock: true,
    showTodaysBookings: true,
    showRecentActivity: true,
    showExpensesNetProfit: true,
    showStaffAttendance: true
  },
  onUpdateWidgetConfig,
  onApproveRequest,
  onRejectRequest,
  onMarkNotificationRead,
  onResolveNotification,
  onSelectTable,
  onStartSession,
  onEndSession,
  onPauseResumeSession,
  onAddSnack,
  onQuickStartAnySession,
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
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full pb-28 lg:pb-8">
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Grid2X2 className="w-6 h-6 text-neutral-900" />
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">Live Tables & Operations</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor active sessions, timers, kitchen orders, and table checkouts in real-time
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-neutral-700">{occupiedCount} Active</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500">{availableCount} Free</span>
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

      {/* 🛎️ Live Cue Boy / Staff Assistance Alerts (Active & Unresolved ONLY) */}
      {notifications.filter((n) => !n.read && !n.resolved && (n.title?.includes('Cue Boy') || n.title?.includes('Assistance'))).length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-amber-900">
                  🛎️ Cue Boy Assistance Requests ({notifications.filter((n) => !n.read && !n.resolved && (n.title?.includes('Cue Boy') || n.title?.includes('Assistance'))).length})
                </h4>
                <p className="text-[11px] text-amber-700 font-medium">Players requested staff attention at their table</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {notifications
              .filter((n) => !n.read && !n.resolved && (n.title?.includes('Cue Boy') || n.title?.includes('Assistance')))
              .map((n) => (
                <div key={n.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-amber-900 truncate block">{n.title}</span>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">{n.message}</p>
                    <span className="text-[9px] text-neutral-400 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (onResolveNotification) onResolveNotification(n.id);
                      else if (onMarkNotificationRead) onMarkNotificationRead(n.id);
                    }}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                  >
                    ✓ Done
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 📱 Customer QR Booking Requests */}
      {sessionRequests.filter((r) => r.status === 'pending').length > 0 && (
        <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CircleDot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-sky-950">
                📱 Pending Customer QR Bookings ({sessionRequests.filter((r) => r.status === 'pending').length})
              </h4>
              <p className="text-[11px] text-sky-800">Players scanned table QR and are waiting for session activation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {sessionRequests
              .filter((r) => r.status === 'pending')
              .map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-sky-950 block">{req.customerName}</span>
                    <p className="text-[11px] text-neutral-600">Table ID: #{req.tableId} • {req.playerCount || 2} players</p>
                    {req.customerPhone && <p className="text-[10px] text-neutral-400 font-mono">{req.customerPhone}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onApproveRequest && (
                      <button
                        onClick={() => onApproveRequest(req)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        Approve
                      </button>
                    )}
                    {onRejectRequest && (
                      <button
                        onClick={() => onRejectRequest(req.id)}
                        className="px-2 py-1.5 bg-neutral-100 hover:bg-rose-100 text-neutral-600 hover:text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Top Header Metrics — 2-col on mobile, 3 on md, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <StatCard
          title="Total Tables"
          value={totalTables}
          subtitle="Capacity"
          icon={Grid2X2}
          variant="default"
        />
        <StatCard
          title="Occupied"
          value={occupiedCount}
          subtitle={`${totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0}% Active`}
          icon={CircleDot}
          variant="success"
        />
        <StatCard
          title="Available"
          value={availableCount}
          subtitle="Ready Now"
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Collected Today"
          value={formatCurrency(revenueToday, currencySymbol)}
          subtitle="Bills + due payments + advances"
          icon={DollarSign}
          trend={revenueToday > 0 ? { value: 'Today Active', positive: true } : undefined}
          variant="dark"
        />
        <StatCard
          title="Cash After Expenses"
          value={formatCurrency(netProfitToday, currencySymbol)}
          subtitle="Collections minus expenses"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Pending Bills"
          value={formatCurrency(pendingPaymentsTotal, currencySymbol)}
          subtitle="Active Checkouts"
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 flex flex-col gap-2.5 shadow-2xs">
        <Input
          placeholder="Search table # or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        {/* Scrollable filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'occupied', label: `🟢 Occupied (${occupiedCount})` },
            { id: 'available', label: `⚪ Free (${availableCount})` },
            { id: 'snooker', label: '🔴 Snooker' },
            { id: 'pool', label: '🎱 Pool' },
            { id: 'american_pool', label: '🎱 American Pool' },
            { id: 'table_tennis', label: '🏓 Table Tennis' },
            { id: 'magnet_table', label: '🧲 Magnet Board' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
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

      {/* Grid of Table Cards — 1 col mobile, 2 sm, 3 lg, 4 xl */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              currencySymbol={currencySymbol}
              taxRatePercent={taxRatePercent}
              enableTax={enableTax}
              minimumChargeMinutes={minimumChargeMinutes}
              roundingRule={roundingRule}
              onSelectTable={onSelectTable}
              onStartSession={onStartSession}
              onEndSession={onEndSession}
              onPauseResumeSession={onPauseResumeSession}
              onAddSnack={onAddSnack}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Tables Found"
          description={`No tables match "${searchQuery}" — try clearing your filters.`}
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedTypeFilter('all');
          }}
        />
      )}

      {/* Mobile FAB: Quick Start Session */}
      <button
        onClick={onQuickStartAnySession}
        className="lg:hidden fixed right-4 bottom-20 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-neutral-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] font-extrabold text-xs cursor-pointer active:scale-95 transition-all border border-neutral-700"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-4 h-4 text-amber-400" />
        <span>Quick Start</span>
      </button>
    </div>
  );
};
