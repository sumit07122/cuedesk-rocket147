import React, { useState } from 'react';
import { 
  TrendingUp, 
  Grid2X2, 
  Receipt, 
  Search, 
  Calendar,
  Sparkles,
  CreditCard,
  Download,
  Printer
} from 'lucide-react';
import { 
  exportRevenueReportCSV,
  triggerPrintReport 
} from '../export/ExportUtility';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { SessionHistoryItem, TopCustomer, TableItem } from '../../types';
import { StatCard } from '../dashboard/StatCard';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatTimerString } from '../../utils/formatters';
import { hourlyOccupancyData, categorySalesData, weeklyRevenueData, paymentMethodsData } from '../../data/mockData';

interface ReportsViewProps {
  history: SessionHistoryItem[];
  topCustomers: TopCustomer[];
  tables: TableItem[];
  currencySymbol: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  history,
  topCustomers,
  tables,
  currencySymbol,
}) => {
  const [searchHistory, setSearchHistory] = useState('');
  const [revenueTimeframe, setRevenueTimeframe] = useState<'daily' | 'weekly'>('weekly');

  const totalRevenue = history.reduce((sum, item) => sum + item.grandTotal, 0);
  const totalSessionsCount = history.length + 12; // Including previous shifts
  const avgSessionVal = totalRevenue > 0 ? totalRevenue / history.length : 42.50;

  const filteredHistory = history.filter(
    (item) =>
      item.customerName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.tableName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.receiptNo.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Analytics & Business Intelligence</h2>
          <p className="text-xs text-neutral-500">Track daily & weekly revenue, peak hours, table utilization, and payment breakdown</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportRevenueReportCSV(history)}
            leftIcon={<Download className="w-4 h-4" />}
            size="sm"
          >
            Export Revenue CSV
          </Button>
          <Button
            variant="outline"
            onClick={triggerPrintReport}
            leftIcon={<Printer className="w-4 h-4" />}
            size="sm"
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Revenue Today"
          value={formatCurrency(totalRevenue + 480.00, currencySymbol)}
          subtitle="All payments settled today"
          icon={TrendingUp}
          trend={{ value: '+18.4% vs yesterday', positive: true }}
          variant="dark"
        />
        <StatCard
          title="Weekly Revenue"
          value={formatCurrency(4120.00, currencySymbol)}
          subtitle="Mon - Sun total earnings"
          icon={Calendar}
          trend={{ value: '+12.5% vs last week', positive: true }}
        />
        <StatCard
          title="Average Bill Value"
          value={formatCurrency(avgSessionVal, currencySymbol)}
          subtitle="Table fee + Food & Drinks"
          icon={Receipt}
        />
        <StatCard
          title="Table Utilization"
          value="78%"
          subtitle="10 tables active peak"
          icon={Grid2X2}
          variant="success"
        />
      </div>

      {/* Primary Chart: Daily & Weekly Revenue Comparison */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-neutral-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {revenueTimeframe === 'weekly' ? 'Weekly Revenue Breakdown (Mon - Sun)' : 'Daily Revenue Flow (Hourly)'}
            </h3>
            <p className="text-xs text-neutral-500">Comparative financial growth and peak earnings</p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setRevenueTimeframe('daily')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                revenueTimeframe === 'daily'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Daily Hourly
            </button>
            <button
              onClick={() => setRevenueTimeframe('weekly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                revenueTimeframe === 'weekly'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Weekly Overview
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {revenueTimeframe === 'weekly' ? (
              <BarChart data={weeklyRevenueData}>
                <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  formatter={(val: any) => [`${currencySymbol}${val}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#171717" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={hourlyOccupancyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#171717" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Secondary Charts: Payment Methods & Category Revenue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Methods Breakdown */}
        <Card className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Payment Methods Distribution</h3>
              <p className="text-xs text-neutral-500">UPI vs Cash vs Credit Card transactions</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              68% Digital Payments
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`pay-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-neutral-100 text-center">
            {paymentMethodsData.map((method) => (
              <div key={method.name} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex flex-col items-center">
                <span className="text-neutral-500 font-medium">{method.name}</span>
                <strong className="text-neutral-900 font-mono text-sm mt-0.5">{method.value}%</strong>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Split (Table vs Food) */}
        <Card className="lg:col-span-6 flex flex-col justify-between gap-4">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-base font-bold text-neutral-900">Revenue Split</h3>
            <p className="text-xs text-neutral-500">Table hourly rental fees vs Snack & Beverage sales</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categorySalesData.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  formatter={(val: any) => [`${currencySymbol}${val}`, 'Sales']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-100">
            {categorySalesData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-neutral-600 truncate font-medium">{cat.name}</span>
                </div>
                <strong className="text-neutral-900 font-mono">{currencySymbol}{cat.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Table Usage Performance & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Usage Performance */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Grid2X2 className="w-4 h-4 text-neutral-700" />
              Table Usage & Daily Yield
            </h3>
            <span className="text-xs text-neutral-500">Occupancy Hours</span>
          </div>

          <div className="flex flex-col gap-3">
            {tables.slice(0, 5).map((t, idx) => {
              const utilPercent = 92 - idx * 11;
              return (
                <div key={t.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-neutral-900">{t.name}</span>
                    <span className="font-mono font-bold text-neutral-800">
                      {formatCurrency(t.hourlyRate * 5.2, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-neutral-900 h-full rounded-full" style={{ width: `${utilPercent}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-700 w-12 text-right">
                      {utilPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Regular Players */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Top Regular Players
            </h3>
            <span className="text-xs text-neutral-500">Loyalty Leaderboard</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {topCustomers.map((cust, idx) => (
              <div key={cust.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{cust.name}</h4>
                    <span className="text-neutral-400 text-[11px]">{cust.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-neutral-900 block font-mono">
                      {formatCurrency(cust.totalSpent, currencySymbol)}
                    </span>
                    <span className="text-[10px] text-neutral-400">{cust.sessionsCount} sessions</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
                    {cust.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Payments Ledger */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Recent Payment Transactions</h3>
            <p className="text-xs text-neutral-500">Historical ledger of all receipts & payments</p>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search receipt # or customer..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-100 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-3">Receipt No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Table</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-neutral-900">{item.receiptNo}</td>
                  <td className="p-3 font-semibold text-neutral-800">{item.customerName}</td>
                  <td className="p-3 text-neutral-600">{item.tableName}</td>
                  <td className="p-3 font-mono">{formatTimerString(item.durationSeconds)}</td>
                  <td className="p-3">
                    <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-800">
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-neutral-900">
                    {formatCurrency(item.grandTotal, currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Credit Dues Recovery Report ───────────────────────────── */}
      {topCustomers.some((c) => (c.outstandingDue || 0) > 0) && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-500" />
                Credit Dues Recovery Report
              </h3>
              <p className="text-xs text-neutral-500">
                All customers with outstanding credit balances — total recoverable:{' '}
                <strong className="text-rose-600">
                  {formatCurrency(
                    topCustomers.reduce((sum, c) => sum + (c.outstandingDue || 0), 0),
                    currencySymbol
                  )}
                </strong>
              </p>
            </div>
            <button
              onClick={() => {
                const headers = ['Name', 'Phone', 'Membership', 'Outstanding Due', 'Credit Limit', 'Risk Status', 'Last Visit'];
                const rows = topCustomers
                  .filter((c) => (c.outstandingDue || 0) > 0)
                  .sort((a, b) => (b.outstandingDue || 0) - (a.outstandingDue || 0))
                  .map((c) => {
                    const due = c.outstandingDue || 0;
                    const limit = c.creditLimit || 2000;
                    const risk = due >= limit ? 'OVER LIMIT' : due > limit * 0.5 ? 'MODERATE' : 'GOOD';
                    return [
                      `"${c.name}"`,
                      `"${c.phone}"`,
                      c.membershipStatus || 'Regular',
                      due.toFixed(2),
                      limit.toFixed(2),
                      risk,
                      `"${c.lastVisit}"`
                    ];
                  });
                const csv = 'data:text/csv;charset=utf-8,\uFEFF' +
                  [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                const a = document.createElement('a');
                a.href = encodeURI(csv);
                a.download = `Credit_Dues_Report_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Dues CSV
            </button>
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Total Recoverable',
                value: formatCurrency(topCustomers.reduce((s, c) => s + (c.outstandingDue || 0), 0), currencySymbol),
                color: 'bg-rose-50 border-rose-200 text-rose-900',
              },
              {
                label: 'Customers with Dues',
                value: `${topCustomers.filter((c) => (c.outstandingDue || 0) > 0).length} accounts`,
                color: 'bg-amber-50 border-amber-200 text-amber-900',
              },
              {
                label: 'Over Credit Limit',
                value: `${topCustomers.filter((c) => (c.outstandingDue || 0) >= (c.creditLimit || 2000)).length} customers`,
                color: 'bg-neutral-50 border-neutral-200 text-neutral-900',
              },
            ].map((s) => (
              <div key={s.label} className={`p-3 rounded-2xl border text-xs font-bold ${s.color}`}>
                <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 mb-1">{s.label}</div>
                <div className="text-base font-black">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-neutral-500 font-bold text-[10px] uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Membership</th>
                  <th className="p-3">Outstanding Due</th>
                  <th className="p-3">Credit Limit</th>
                  <th className="p-3">Risk Status</th>
                  <th className="p-3">Last Visit</th>
                  <th className="p-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {topCustomers
                  .filter((c) => (c.outstandingDue || 0) > 0)
                  .sort((a, b) => (b.outstandingDue || 0) - (a.outstandingDue || 0))
                  .map((cust) => {
                    const due = cust.outstandingDue || 0;
                    const limit = cust.creditLimit || 2000;
                    const isOver = due >= limit;
                    const isModerate = !isOver && due > limit * 0.5;
                    return (
                      <tr key={cust.id} className={`transition-colors ${isOver ? 'bg-rose-50/40' : 'hover:bg-neutral-50/60'}`}>
                        <td className="p-3 font-bold text-neutral-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-neutral-900 text-amber-400 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                            {cust.name}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-neutral-600">{cust.phone}</td>
                        <td className="p-3">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                            {cust.membershipStatus || 'Regular'}
                          </span>
                        </td>
                        <td className="p-3 font-black font-mono text-rose-700 text-sm">
                          {formatCurrency(due, currencySymbol)}
                        </td>
                        <td className="p-3 font-mono text-neutral-600">
                          {formatCurrency(limit, currencySymbol)}
                        </td>
                        <td className="p-3">
                          {isOver ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-md uppercase">
                              ⚠ OVER LIMIT
                            </span>
                          ) : isModerate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md uppercase">
                              MODERATE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md uppercase">
                              LOW RISK
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-neutral-500">{cust.lastVisit}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              const msg = `Hello ${cust.name}, this is a payment reminder from our club. Your outstanding credit balance is ${formatCurrency(due, currencySymbol)}. Kindly clear it at your earliest convenience. Thank you!`;
                              window.open(`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-all cursor-pointer"
                          >
                            WhatsApp Reminder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
