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
  Bell,
  ChefHat
} from 'lucide-react';
import { TableItem, TableType, SessionRequest, DashboardWidgetConfig, NotificationItem } from '../../types';
import { StatCard } from './StatCard';
import { TableCard } from './TableCard';
import { SessionRequestsPanel } from './SessionRequestsPanel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { formatCurrency } from '../../utils/formatters';

interface DashboardViewProps {
  tables: TableItem[];
  revenueToday: number;
  pendingPaymentsTotal: number;
  currencySymbol: string;
  taxRatePercent: number;
  enableTax: boolean;
  lowStockCount?: number;
  netProfitToday?: number;
  sessionRequests?: SessionRequest[];
  notifications?: NotificationItem[];
  widgetConfig?: DashboardWidgetConfig;
  onUpdateWidgetConfig?: (config: DashboardWidgetConfig) => void;
  onApproveRequest?: (req: SessionRequest) => void;
  onRejectRequest?: (requestId: string) => void;
  onMarkNotificationRead?: (id: string) => void;
  onShowQRCode?: (table: TableItem) => void;
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
  taxRatePercent,
  enableTax,
  lowStockCount = 0,
  netProfitToday = revenueToday * 0.7,
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
  onShowQRCode,
  onSelectTable,
  onStartSession,
  onEndSession,
  onPauseResumeSession,
  onAddSnack,
  onQuickStartAnySession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | TableType | 'occupied' | 'available'>('all');
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

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

  const toggleWidget = (key: keyof DashboardWidgetConfig) => {
    if (onUpdateWidgetConfig) {
      onUpdateWidgetConfig({
        ...widgetConfig,
        [key]: !widgetConfig[key]
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full pb-28 lg:pb-8">
      {/* Top Controls & Widget Customizer Trigger */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-xl font-extrabold text-neutral-900 tracking-tight">Club Dashboard</h2>
          <p className="hidden sm:block text-xs text-neutral-500">Live table monitoring, session checkout, and club revenue statistics</p>
        </div>

        <button
          onClick={() => setIsWidgetModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer border border-neutral-200"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Customize</span>
        </button>
      </div>

      {/* Live Customer QR Session Requests Panel */}
      {widgetConfig.showTodaysBookings && sessionRequests && sessionRequests.length > 0 && onApproveRequest && onRejectRequest && (
        <SessionRequestsPanel
          requests={sessionRequests}
          tables={tables}
          onApprove={onApproveRequest}
          onReject={onRejectRequest}
          onEndTableSession={onEndSession}
        />
      )}

      {/* 🛎️ Live Cue Boy / Staff Assistance Alerts */}
      {notifications.filter((n) => n.title?.includes('Cue Boy')).length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-amber-900">🛎️ Cue Boy Assistance Requests ({notifications.filter((n) => n.title?.includes('Cue Boy')).length})</h4>
                <p className="text-[11px] text-amber-700">Customers are requesting staff attention at their tables</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {notifications.filter((n) => n.title?.includes('Cue Boy')).map((n) => (
              <div key={n.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs">
                <div>
                  <span className="font-bold text-amber-900">{n.title}</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{n.message}</p>
                </div>
                {onMarkNotificationRead && (
                  <button
                    onClick={() => onMarkNotificationRead(n.id)}
                    className="ml-2 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    ✓ Done
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🍳 Live Pending Kitchen Orders Alert */}
      {notifications.filter((n) => n.type === 'food_order').length > 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-emerald-900">{notifications.filter((n) => n.type === 'food_order').length} Kitchen Order(s) Queued</h4>
              <p className="text-[11px] text-emerald-700">New food/drink orders waiting in the kitchen queue</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Metrics — 2-col on mobile, 3 on md, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {widgetConfig.showActiveTables && (
          <StatCard
            title="Total Tables"
            value={totalTables}
            subtitle="Capacity"
            icon={Grid2X2}
            variant="default"
          />
        )}
        {widgetConfig.showActiveTables && (
          <StatCard
            title="Occupied"
            value={occupiedCount}
            subtitle={`${totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0}% Active`}
            icon={CircleDot}
            variant="success"
          />
        )}
        {widgetConfig.showActiveTables && (
          <StatCard
            title="Available"
            value={availableCount}
            subtitle="Ready Now"
            icon={Clock}
            variant="default"
          />
        )}
        {widgetConfig.showRevenue && (
          <StatCard
            title="Revenue Today"
            value={formatCurrency(revenueToday, currencySymbol)}
            subtitle="Sessions + Orders"
            icon={DollarSign}
            trend={{ value: '+14% vs yesterday', positive: true }}
            variant="dark"
          />
        )}
        {widgetConfig.showExpensesNetProfit && (
          <StatCard
            title="Net Profit"
            value={formatCurrency(netProfitToday, currencySymbol)}
            subtitle="Rev - Expense"
            icon={TrendingUp}
            variant="success"
          />
        )}
        {widgetConfig.showPendingPayments && (
          <StatCard
            title="Pending Bills"
            value={formatCurrency(pendingPaymentsTotal, currencySymbol)}
            subtitle="Active Checkouts"
            icon={AlertCircle}
            variant="warning"
          />
        )}
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
            { id: 'pickleball', label: '🏓 Pickle' },
            { id: 'ps5', label: '🎮 PS5' },
            { id: 'vip', label: '👑 VIP' },
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
              onSelectTable={onSelectTable}
              onStartSession={onStartSession}
              onEndSession={onEndSession}
              onPauseResumeSession={onPauseResumeSession}
              onAddSnack={onAddSnack}
              onShowQRCode={onShowQRCode}
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

      {/* Customize Dashboard Widgets Modal */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-neutral-900" />
                <h3 className="text-base font-extrabold text-neutral-900">Customize Dashboard Cards</h3>
              </div>
              <button onClick={() => setIsWidgetModalOpen(false)} className="text-neutral-400 font-bold text-lg">×</button>
            </div>

            <p className="text-xs text-neutral-500 mb-4">
              Toggle which statistics, revenue cards, and booking panels appear on your main dashboard
            </p>

            <div className="space-y-2.5">
              {[
                { key: 'showRevenue', label: 'Gross Revenue Today' },
                { key: 'showExpensesNetProfit', label: 'Net Profit & Margins' },
                { key: 'showActiveTables', label: 'Active Table Occupancy Stats' },
                { key: 'showPendingPayments', label: 'Pending Payment Bills' },
                { key: 'showLowStock', label: 'Low Stock Inventory Alert' },
                { key: 'showTodaysBookings', label: 'Customer QR Booking Panel' },
              ].map(({ key, label }) => {
                const k = key as keyof DashboardWidgetConfig;
                const active = widgetConfig[k];
                return (
                  <div
                    key={key}
                    onClick={() => toggleWidget(k)}
                    className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200/80 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-neutral-800">{label}</span>
                    <button className={`p-1.5 rounded-xl font-bold text-xs flex items-center gap-1 ${
                      active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{active ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
              <Button variant="primary" onClick={() => setIsWidgetModalOpen(false)}>
                Save Layout Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

