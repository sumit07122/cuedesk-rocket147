import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar, 
  Receipt, 
  FileText, 
  PieChart as PieIcon, 
  Tag, 
  User, 
  Trash2, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, SessionHistoryItem, BusinessConfig } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseProfitViewProps {
  expenses: ExpenseRecord[];
  history: SessionHistoryItem[];
  config: BusinessConfig;
  onSaveExpense: (expense: Omit<ExpenseRecord, 'id'> & { id?: string }) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

export const ExpenseProfitView: React.FC<ExpenseProfitViewProps> = ({
  expenses,
  history,
  config,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('Manager');
  const [isSaving, setIsSaving] = useState(false);

  // Timeframe calculation helper
  const now = new Date();
  const getFilterStartDate = () => {
    const d = new Date();
    if (timeframe === 'today') {
      d.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (timeframe === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (timeframe === 'year') {
      d.setFullYear(d.getFullYear() - 1);
    }
    return d.getTime();
  };

  const startTime = getFilterStartDate();

  // Filtered History & Expenses
  const filteredHistory = history.filter((h) => {
    const t = new Date(h.timestamp || h.startTime).getTime();
    return t >= startTime;
  });

  const filteredExpenses = expenses.filter((e) => {
    const t = new Date(e.date).getTime();
    return t >= startTime || e.timestamp >= startTime;
  });

  // Profit Calculation: Net Profit = Revenue - Expenses
  const totalRevenue = filteredHistory.reduce((acc, h) => acc + (h.grandTotal || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Category breakdown for expenses
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const handleOpenModal = () => {
    setCategory('Rent');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setRecordedBy('Manager');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveExpense({
        clubId: config.id || 'club-royal-cue',
        category,
        amount,
        date,
        timestamp: Date.now(),
        notes,
        recordedBy
      });
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to record expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, cat: string, amt: number) => {
    if (confirm(`Delete expense record for ${cat} (${formatCurrency(amt, config)})?`)) {
      await onDeleteExpense(id);
    }
  };

  const expenseCategoriesList: ExpenseCategory[] = [
    'Rent',
    'Electricity',
    'Staff Salary',
    'Table Repair',
    'Cue Maintenance',
    'Internet',
    'Cleaning',
    'Miscellaneous'
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Timeframe Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-neutral-900" />
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Business Expenses & Profit Engine</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Track operational costs, auto-calculate Net Profit in real-time, and analyze club profit margins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-neutral-100 p-1 rounded-2xl flex items-center">
            {(['today', 'week', 'month', 'year'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  timeframe === t
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={handleOpenModal}
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* Net Profit Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <Card className="p-5 flex flex-col justify-between gap-2 border-emerald-200/60 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">{formatCurrency(totalRevenue, config?.currencySymbol || '₹')}</div>
            <p className="text-[10px] text-neutral-500 mt-1">From settled table fees & food orders</p>
          </div>
        </Card>

        {/* Total Expenses Card */}
        <Card className="p-5 flex flex-col justify-between gap-2 border-red-200/60 bg-red-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">Total Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">{formatCurrency(totalExpenses, config?.currencySymbol || '₹')}</div>
            <p className="text-[10px] text-neutral-500 mt-1">Rent, electricity, salaries & maintenance</p>
          </div>
        </Card>

        {/* Net Profit Card */}
        <Card
          className={`p-5 flex flex-col justify-between gap-2 ${
            netProfit >= 0 ? 'bg-neutral-900 text-white' : 'bg-red-950 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Net Profit</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black">{formatCurrency(netProfit, config?.currencySymbol || '₹')}</div>
            <p className="text-[10px] text-neutral-400 mt-1">Revenue minus Expenses = Net Income</p>
          </div>
        </Card>

        {/* Profit Margin % */}
        <Card className="p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Profit Margin</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">{profitMarginPercent}%</div>
            <p className="text-[10px] text-neutral-500 mt-1">Efficiency percentage</p>
          </div>
        </Card>
      </div>

      {/* Category Expense Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Totals List */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Expense Breakdown by Category</h3>
            <span className="text-[10px] text-neutral-400 font-mono">{filteredExpenses.length} Records</span>
          </div>

          <div className="space-y-3">
            {Object.keys(categoryTotals).length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">No expenses recorded for this timeframe.</p>
            ) : (
              Object.entries(categoryTotals).map(([cat, total]) => {
                const percent = totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(0) : '0';
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-800">{cat}</span>
                      <span className="text-neutral-900">{formatCurrency(total, config?.currencySymbol || '₹')} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-neutral-900 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Expenses Audit Table */}
        <Card className="p-0 overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-neutral-100">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Recent Recorded Expenses</h3>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200/80 text-neutral-500 uppercase font-bold text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      <div>{exp.category}</div>
                      {exp.notes && <div className="text-[10px] text-neutral-400 font-normal">{exp.notes}</div>}
                    </td>
                    <td className="py-3 px-4 font-black text-red-600">
                      {formatCurrency(exp.amount, config?.currencySymbol || '₹')}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-[11px]">
                      {exp.recordedBy}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(exp.id, exp.category, exp.amount)}
                        className="text-neutral-400 hover:text-red-600 p-1 rounded hover:bg-neutral-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-neutral-900">Record Business Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-neutral-50 border border-neutral-200 text-xs font-semibold rounded-xl p-2.5 outline-none"
                >
                  {expenseCategoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Amount ({config.currencySymbol}) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Expense Date *</label>
                  <Input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Recorded By</label>
                <Input
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  placeholder="Manager / Owner Name"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Notes / Invoice Description</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Monthly venue lease, AC repair invoice #402..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Expense Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
