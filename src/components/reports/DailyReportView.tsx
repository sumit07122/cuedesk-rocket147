import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Receipt, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Utensils, 
  Grid2X2,
  CalendarDays,
  RotateCcw
} from 'lucide-react';
import { SessionHistoryItem, TopCustomer, TableItem } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatTimerString, getBusinessDateKey } from '../../utils/formatters';
import { getCustomerNumber } from '../../utils/customerIdentity';

interface DailyReportViewProps {
  history: SessionHistoryItem[];
  customers?: TopCustomer[];
  tables?: TableItem[];
  currencySymbol: string;
  timeZone?: string;
  clubName?: string;
}

type SortField = 'time' | 'consumer' | 'amount' | 'duration' | 'table' | 'receipt';
type SortOrder = 'asc' | 'desc';
type DateFilterType = 'today' | 'yesterday' | 'week' | 'custom' | 'all';

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  history = [],
  customers = [],
  tables = [],
  currencySymbol = '₹',
  timeZone = 'Asia/Kolkata',
  clubName = 'One Shot Gaming Club',
}) => {
  // Current business today key (YYYY-MM-DD)
  const todayKey = useMemo(() => getBusinessDateKey(Date.now(), timeZone), [timeZone]);
  
  // Calculate yesterday key
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getBusinessDateKey(d.getTime(), timeZone);
  }, [timeZone]);

  // States
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('today');
  const [customDate, setCustomDate] = useState<string>(todayKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Sorting state: default is time descending (latest first)
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Detail Modal state
  const [inspectSession, setInspectSession] = useState<SessionHistoryItem | null>(null);

  // Toggle sort helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Sensible defaults
      if (field === 'time' || field === 'amount' || field === 'duration') {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  // Helper to format record date/time
  const formatRecordDateTime = (timestamp: number | string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return String(timestamp);
    }
  };

  const formatRecordTimeOnly = (timestamp: number | string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return '';
    }
  };

  const formatRecordDateOnly = (timestamp: number | string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  };

  // 1. Date Filtering
  const dateFilteredHistory = useMemo(() => {
    return history.filter(item => {
      const itemTimestamp = item.endTime || item.startTime || Date.now();
      const itemDateKey = getBusinessDateKey(itemTimestamp, timeZone);

      if (dateFilterType === 'today') {
        return itemDateKey === todayKey;
      }
      if (dateFilterType === 'yesterday') {
        return itemDateKey === yesterdayKey;
      }
      if (dateFilterType === 'custom') {
        return itemDateKey === customDate;
      }
      if (dateFilterType === 'week') {
        const itemTime = new Date(itemTimestamp).getTime();
        const now = Date.now();
        return now - itemTime <= 7 * 24 * 60 * 60 * 1000;
      }
      return true; // 'all'
    });
  }, [history, dateFilterType, todayKey, yesterdayKey, customDate, timeZone]);

  // 2. Multi-Filter (Search, Table, Payment Method, Status)
  const filteredHistory = useMemo(() => {
    return dateFilteredHistory.filter(item => {
      // Search query filter (matches consumer name, phone, receipt #, table name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (item.customerPhone || '').toLowerCase().includes(q);
        const matchesReceipt = (item.receiptNo || '').toLowerCase().includes(q);
        const matchesTable = (item.tableName || '').toLowerCase().includes(q);
        const matchesId = (item.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesReceipt && !matchesTable && !matchesId) {
          return false;
        }
      }

      // Table filter
      if (selectedTable !== 'all') {
        if (item.tableId !== selectedTable && item.tableName !== selectedTable) {
          return false;
        }
      }

      // Payment method filter
      if (selectedPaymentMethod !== 'all') {
        if (item.paymentMethod !== selectedPaymentMethod) {
          return false;
        }
      }

      // Payment status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'due') {
          if ((item.balanceDue || 0) <= 0 && item.paymentStatus !== 'due_ledger') {
            return false;
          }
        } else if (item.paymentStatus !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilteredHistory, searchQuery, selectedTable, selectedPaymentMethod, selectedStatus]);

  // 3. Sorting (Date/Time, Consumer, Amount, Duration, Table, Receipt)
  const sortedHistory = useMemo(() => {
    const list = [...filteredHistory];

    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'time': {
          const timeA = a.endTime || a.startTime || 0;
          const timeB = b.endTime || b.startTime || 0;
          comparison = timeA - timeB;
          break;
        }
        case 'consumer': {
          const nameA = (a.customerName || 'Walk-in').toLowerCase();
          const nameB = (b.customerName || 'Walk-in').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'amount': {
          const amtA = Number(a.grandTotal) || 0;
          const amtB = Number(b.grandTotal) || 0;
          comparison = amtA - amtB;
          break;
        }
        case 'duration': {
          const durA = Number(a.durationSeconds) || 0;
          const durB = Number(b.durationSeconds) || 0;
          comparison = durA - durB;
          break;
        }
        case 'table': {
          const tblA = (a.tableName || '').toLowerCase();
          const tblB = (b.tableName || '').toLowerCase();
          comparison = tblA.localeCompare(tblB);
          break;
        }
        case 'receipt': {
          const recA = (a.receiptNo || a.id).toLowerCase();
          const recB = (b.receiptNo || b.id).toLowerCase();
          comparison = recA.localeCompare(recB);
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [filteredHistory, sortField, sortOrder]);

  // 4. Daily KPI Metrics computed for currently selected date filter
  const kpis = useMemo(() => {
    const validRecords = dateFilteredHistory.filter(h => h.paymentStatus !== 'refunded');
    const totalBilled = validRecords.reduce((sum, h) => sum + (Number(h.grandTotal) || 0), 0);
    const totalPaid = validRecords.reduce((sum, h) => sum + (Number(h.amountPaid) || 0), 0);
    const totalDue = validRecords.reduce((sum, h) => sum + (Number(h.balanceDue) || 0), 0);
    
    // Payment method breakdown
    let cashCollected = 0;
    let upiCollected = 0;
    let cardCollected = 0;

    validRecords.forEach(h => {
      const paid = Number(h.amountPaid) || Number(h.grandTotal) || 0;
      if (h.paymentMethod === 'cash') cashCollected += paid;
      else if (h.paymentMethod === 'upi') upiCollected += paid;
      else if (h.paymentMethod === 'card') cardCollected += paid;
      else if (h.paymentMethod === 'split' && h.splitBreakdown) {
        cashCollected += Number(h.splitBreakdown.cash) || 0;
        upiCollected += Number(h.splitBreakdown.upi) || 0;
        cardCollected += Number(h.splitBreakdown.card) || 0;
      }
    });

    // Food vs Table breakdown
    const tableRevenue = validRecords.reduce((sum, h) => sum + (Number(h.tableFee) || 0), 0);
    const foodRevenue = validRecords.reduce((sum, h) => {
      if (typeof h.foodFee === 'number' && h.foodFee > 0) return sum + h.foodFee;
      if (h.foodOrders && h.foodOrders.length > 0) {
        return sum + h.foodOrders.reduce((fsum, f) => fsum + (Number(f.price) || 0) * (Number(f.quantity) || 0), 0);
      }
      return sum;
    }, 0);

    const refundedRecords = dateFilteredHistory.filter(h => h.paymentStatus === 'refunded');
    const totalRefunded = refundedRecords.reduce((sum, h) => sum + (Number(h.refundedAmount ?? h.grandTotal) || 0), 0);

    // Unique customers served
    const uniqueCustomers = new Set(
      validRecords.map(h => (h.customerId || h.customerPhone || h.customerName || 'walkin').trim().toLowerCase())
    ).size;

    return {
      totalBilled,
      totalPaid,
      totalDue,
      cashCollected,
      upiCollected,
      cardCollected,
      tableRevenue,
      foodRevenue,
      totalRefunded,
      totalSessions: validRecords.length,
      refundedCount: refundedRecords.length,
      uniqueCustomers
    };
  }, [dateFilteredHistory]);

  // Export to CSV
  const handleExportCSV = () => {
    const filename = `Daily_Report_${dateFilterType === 'custom' ? customDate : dateFilterType}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const headers = [
      'Receipt No',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Table',
      'Duration (Mins)',
      'Table Fee',
      'Food Fee',
      'Discount',
      'Tax',
      'Grand Total',
      'Amount Paid',
      'Balance Due',
      'Payment Method',
      'Payment Status',
      'Cashier / Billed By'
    ];

    const rows = sortedHistory.map(item => {
      const mins = Math.ceil((item.durationSeconds || 0) / 60);
      return [
        `"${item.receiptNo || item.id}"`,
        `"${formatRecordDateTime(item.endTime || item.startTime)}"`,
        `"${item.customerName || 'Walk-in'}"`,
        `"${item.customerPhone || ''}"`,
        `"${item.tableName || ''}"`,
        mins,
        (item.tableFee || 0).toFixed(2),
        (item.foodFee || 0).toFixed(2),
        (item.discountAmount || 0).toFixed(2),
        (item.taxAmount || 0).toFixed(2),
        (item.grandTotal || 0).toFixed(2),
        (item.amountPaid || 0).toFixed(2),
        (item.balanceDue || 0).toFixed(2),
        `"${(item.paymentMethod || '').toUpperCase()}"`,
        `"${(item.paymentStatus || '').toUpperCase()}"`,
        `"${item.processedBy || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Daily Report
  const handlePrintDailyReport = () => {
    window.print();
  };

  // Helper to render sort icon on table headers
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-amber-500 font-bold" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-amber-500 font-bold" />
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
      {/* Top Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">Daily Business Report</h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Audit & Ledger
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit daily transactions, filter by customer or time, inspect receipts, and sort session records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
            size="sm"
            className="cursor-pointer font-bold text-xs"
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handlePrintDailyReport}
            leftIcon={<Printer className="w-4 h-4" />}
            size="sm"
            className="cursor-pointer font-bold text-xs"
          >
            Print Sheet
          </Button>
        </div>
      </div>

      {/* Date Range Selection & Quick Switcher */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Quick Date Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 mr-1">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            Date Period:
          </span>
          <button
            onClick={() => setDateFilterType('today')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              dateFilterType === 'today'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Today ({todayKey})
          </button>
          <button
            onClick={() => setDateFilterType('yesterday')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              dateFilterType === 'yesterday'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setDateFilterType('week')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              dateFilterType === 'week'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setDateFilterType('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              dateFilterType === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All History
          </button>
        </div>

        {/* Custom Calendar Date Input */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-neutral-500">Pick Specific Date:</label>
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilterType('custom');
            }}
            className="px-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards for the Selected Day */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Total Billed</span>
          <div className="text-xl font-black mt-2 font-mono">{formatCurrency(kpis.totalBilled, currencySymbol)}</div>
          <span className="text-[10px] text-amber-400 mt-1 font-semibold">{kpis.totalSessions} Sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Cash Collected</span>
          <div className="text-xl font-black mt-2 font-mono text-emerald-800">{formatCurrency(kpis.cashCollected, currencySymbol)}</div>
          <span className="text-[10px] text-emerald-600 mt-1 font-semibold">Physical Cash In-Hand</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">UPI / QR Online</span>
          <div className="text-xl font-black mt-2 font-mono text-blue-800">{formatCurrency(kpis.upiCollected, currencySymbol)}</div>
          <span className="text-[10px] text-blue-600 mt-1 font-semibold">Instant Digital Receipts</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Credit / Udhaar Added</span>
          <div className="text-xl font-black mt-2 font-mono text-rose-800">{formatCurrency(kpis.totalDue, currencySymbol)}</div>
          <span className="text-[10px] text-rose-600 mt-1 font-semibold">Pending Recovery</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-900 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Table Play Revenue</span>
          <div className="text-xl font-black mt-2 font-mono text-neutral-900">{formatCurrency(kpis.tableRevenue, currencySymbol)}</div>
          <span className="text-[10px] text-neutral-500 mt-1 font-semibold">Snooker & Pool fees</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Café & Food Revenue</span>
          <div className="text-xl font-black mt-2 font-mono text-amber-800">{formatCurrency(kpis.foodRevenue, currencySymbol)}</div>
          <span className="text-[10px] text-amber-600 mt-1 font-semibold">{kpis.uniqueCustomers} Customers Served</span>
        </div>
      </div>

      {/* Sorting, Search & Multi-Filter Control Bar */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full lg:w-80">
            <Input
              placeholder="Search consumer, phone, receipt #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Table Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-neutral-500">Table:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2.5 py-1.5 rounded-xl border border-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Tables</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-neutral-500">Method:</span>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2.5 py-1.5 rounded-xl border border-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR</option>
                <option value="card">Card</option>
                <option value="split">Split</option>
                <option value="due_ledger">Udhaar / Credit</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-neutral-500">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2.5 py-1.5 rounded-xl border border-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="due">Has Balance Due</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Clear Filters Button if any active */}
            {(searchQuery || selectedTable !== 'all' || selectedPaymentMethod !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTable('all');
                  setSelectedPaymentMethod('all');
                  setSelectedStatus('all');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-neutral-600 hover:bg-neutral-100 font-bold cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Active Sort Bar / Quick Sort Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-700">Quick Sort by:</span>
            <button
              onClick={() => handleSort('time')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                sortField === 'time' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Time {sortField === 'time' && (sortOrder === 'asc' ? '↑ Oldest' : '↓ Newest')}</span>
            </button>
            <button
              onClick={() => handleSort('consumer')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                sortField === 'consumer' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Consumer {sortField === 'consumer' && (sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A')}</span>
            </button>
            <button
              onClick={() => handleSort('amount')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                sortField === 'amount' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑ Low-High' : '↓ High-Low')}</span>
            </button>
            <button
              onClick={() => handleSort('duration')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                sortField === 'duration' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <span>Playtime {sortField === 'duration' && (sortOrder === 'asc' ? '↑ Short-Long' : '↓ Long-Short')}</span>
            </button>
          </div>

          <div className="font-semibold text-neutral-600">
            Showing <strong className="text-neutral-900">{sortedHistory.length}</strong> of {dateFilteredHistory.length} records
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-left text-xs text-neutral-700 divide-y divide-neutral-200">
            <thead className="bg-neutral-100/80 text-neutral-600 font-bold text-[11px] uppercase tracking-wider select-none">
              <tr>
                {/* Date & Time Header */}
                <th
                  onClick={() => handleSort('time')}
                  className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date & Time</span>
                    {renderSortIndicator('time')}
                  </div>
                </th>

                {/* Receipt Header */}
                <th
                  onClick={() => handleSort('receipt')}
                  className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Receipt No</span>
                    {renderSortIndicator('receipt')}
                  </div>
                </th>

                {/* Consumer / Customer Header */}
                <th
                  onClick={() => handleSort('consumer')}
                  className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Consumer (Customer)</span>
                    {renderSortIndicator('consumer')}
                  </div>
                </th>

                {/* Table Header */}
                <th
                  onClick={() => handleSort('table')}
                  className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Station / Table</span>
                    {renderSortIndicator('table')}
                  </div>
                </th>

                {/* Playtime Duration Header */}
                <th
                  onClick={() => handleSort('duration')}
                  className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Play Duration</span>
                    {renderSortIndicator('duration')}
                  </div>
                </th>

                {/* Breakdown Header */}
                <th className="p-3.5">
                  <span>Fee Breakdown</span>
                </th>

                {/* Payment Method Header */}
                <th className="p-3.5">
                  <span>Method</span>
                </th>

                {/* Status Header */}
                <th className="p-3.5">
                  <span>Status</span>
                </th>

                {/* Grand Total Header */}
                <th
                  onClick={() => handleSort('amount')}
                  className="p-3.5 text-right cursor-pointer hover:bg-neutral-200/70 transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Amount</span>
                    {renderSortIndicator('amount')}
                  </div>
                </th>

                {/* Action Header */}
                <th className="p-3.5 text-center">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-neutral-100">
              {sortedHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-10 h-10 text-neutral-300" />
                      <p className="font-bold text-neutral-700 text-sm">No Daily Records Found</p>
                      <p className="text-xs text-neutral-400 max-w-sm">
                        {searchQuery || selectedTable !== 'all' || selectedPaymentMethod !== 'all' || selectedStatus !== 'all'
                          ? 'No transactions matched your active search or filters. Try adjusting them.'
                          : 'No session receipts have been recorded for this date period yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedHistory.map((item) => {
                  const customerObj = customers.find(c => c.id === item.customerId || c.phone === item.customerPhone);
                  const custNum = customerObj ? getCustomerNumber(customerObj) : null;
                  const hasDue = (item.balanceDue || 0) > 0 || item.paymentStatus === 'due_ledger';
                  const isRefunded = item.paymentStatus === 'refunded';
                  const foodItemsCount = (item.foodOrders || []).reduce((acc, f) => acc + (f.quantity || 1), 0);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        isRefunded ? 'bg-neutral-50/40 opacity-70' : hasDue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="p-3.5 font-medium whitespace-nowrap">
                        <div className="font-bold text-neutral-900">{formatRecordTimeOnly(item.endTime || item.startTime)}</div>
                        <div className="text-[10px] text-neutral-400">{formatRecordDateOnly(item.endTime || item.startTime)}</div>
                      </td>

                      {/* Receipt No */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                          {item.receiptNo || item.id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      {/* Consumer / Customer */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-amber-400 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {(item.customerName || 'W').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                              <span>{item.customerName || 'Walk-in Guest'}</span>
                              {custNum && (
                                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  {custNum}
                                </span>
                              )}
                            </div>
                            {item.customerPhone ? (
                              <div className="text-[11px] text-neutral-500 font-mono">{item.customerPhone}</div>
                            ) : (
                              <div className="text-[10px] text-neutral-400">Casual Walk-in</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Station / Table */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-neutral-800">{item.tableName || 'Gaming Table'}</div>
                      </td>

                      {/* Play Duration */}
                      <td className="p-3.5 whitespace-nowrap font-mono text-neutral-700">
                        {formatTimerString(item.durationSeconds || 0)}
                      </td>

                      {/* Fee Breakdown */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-[11px]">
                          <span className="text-neutral-500">Table: </span>
                          <span className="font-bold text-neutral-800 font-mono">{formatCurrency(item.tableFee || 0, currencySymbol)}</span>
                        </div>
                        {(item.foodFee || 0) > 0 && (
                          <div className="text-[10px] text-amber-700 flex items-center gap-1">
                            <Utensils className="w-2.5 h-2.5" />
                            <span>Food: {formatCurrency(item.foodFee, currencySymbol)} ({foodItemsCount} items)</span>
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`uppercase font-extrabold text-[10px] px-2 py-0.5 rounded border ${
                          item.paymentMethod === 'cash'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.paymentMethod === 'upi'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.paymentMethod === 'card'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : item.paymentMethod === 'split'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {item.paymentMethod === 'split' ? 'SPLIT' : item.paymentMethod || 'CASH'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isRefunded ? (
                          <Badge variant="neutral">REFUNDED</Badge>
                        ) : hasDue ? (
                          <Badge variant="danger">
                            DUE {formatCurrency(item.balanceDue || 0, currencySymbol)}
                          </Badge>
                        ) : (
                          <Badge variant="success">PAID</Badge>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="p-3.5 text-right whitespace-nowrap font-mono">
                        <div className="font-black text-neutral-900 text-sm">
                          {formatCurrency(item.grandTotal || 0, currencySymbol)}
                        </div>
                        {hasDue && (
                          <div className="text-[10px] font-bold text-rose-600">
                            Paid: {formatCurrency(item.amountPaid || 0, currencySymbol)}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setInspectSession(item)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Inspect Bill Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Session Details Modal */}
      {inspectSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-neutral-200 shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Daily Audit Record</span>
                <h3 className="text-lg font-black text-neutral-900">
                  Receipt #{inspectSession.receiptNo || inspectSession.id.slice(-6).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setInspectSession(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Customer / Consumer</span>
                <span className="font-bold text-neutral-900 block mt-0.5 text-sm">{inspectSession.customerName || 'Walk-in'}</span>
                {inspectSession.customerPhone && (
                  <span className="text-neutral-500 font-mono text-[11px] block">{inspectSession.customerPhone}</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Station / Table</span>
                <span className="font-bold text-neutral-900 block mt-0.5 text-sm">{inspectSession.tableName}</span>
                <span className="text-neutral-500 font-mono text-[11px] block">
                  Duration: {formatTimerString(inspectSession.durationSeconds || 0)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Time Settled</span>
                <span className="font-bold text-neutral-900 block mt-0.5 text-xs">
                  {formatRecordDateTime(inspectSession.endTime || inspectSession.startTime)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Payment Mode & Status</span>
                <span className="font-extrabold uppercase text-xs text-neutral-900 block mt-0.5">
                  {inspectSession.paymentMethod} • {inspectSession.paymentStatus}
                </span>
              </div>
            </div>

            {/* Food Items Ordered if any */}
            {inspectSession.foodOrders && inspectSession.foodOrders.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  Café & Food Orders ({inspectSession.foodOrders.length})
                </span>
                <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 text-xs overflow-hidden">
                  {inspectSession.foodOrders.map((f, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between bg-neutral-50/50">
                      <div>
                        <span className="font-bold text-neutral-900">{f.name}</span>
                        <span className="text-neutral-400 text-[11px] ml-1.5">x{f.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-neutral-800">
                        {formatCurrency((f.price || 0) * (f.quantity || 1), currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split payment breakdown if any */}
            {inspectSession.paymentMethod === 'split' && inspectSession.splitBreakdown && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                <span className="font-bold text-purple-900 block mb-1">Split Payment Breakdown:</span>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div>Cash: {formatCurrency(inspectSession.splitBreakdown.cash || 0, currencySymbol)}</div>
                  <div>UPI: {formatCurrency(inspectSession.splitBreakdown.upi || 0, currencySymbol)}</div>
                  <div>Card: {formatCurrency(inspectSession.splitBreakdown.card || 0, currencySymbol)}</div>
                </div>
              </div>
            )}

            {/* Financial Ledger Calculation */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col gap-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-300">
                <span>Table Charge</span>
                <span>{formatCurrency(inspectSession.tableFee || 0, currencySymbol)}</span>
              </div>
              {(inspectSession.foodFee || 0) > 0 && (
                <div className="flex justify-between text-neutral-300">
                  <span>Food & Refreshments</span>
                  <span>{formatCurrency(inspectSession.foodFee, currencySymbol)}</span>
                </div>
              )}
              {(inspectSession.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(inspectSession.discountAmount, currencySymbol)}</span>
                </div>
              )}
              {(inspectSession.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-neutral-400">
                  <span>Tax / GST</span>
                  <span>+{formatCurrency(inspectSession.taxAmount, currencySymbol)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-700 flex justify-between font-black text-sm text-white">
                <span>Grand Total</span>
                <span className="text-amber-400">{formatCurrency(inspectSession.grandTotal || 0, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-300">
                <span>Amount Paid</span>
                <span>{formatCurrency(inspectSession.amountPaid || 0, currencySymbol)}</span>
              </div>
              {(inspectSession.balanceDue || 0) > 0 && (
                <div className="flex justify-between text-xs text-rose-400 font-bold">
                  <span>Balance Due (Udhaar)</span>
                  <span>{formatCurrency(inspectSession.balanceDue, currencySymbol)}</span>
                </div>
              )}
            </div>

            {/* Cashier / Staff Info */}
            {inspectSession.processedBy && (
              <div className="text-[11px] text-neutral-500 text-right">
                Processed by: <strong className="text-neutral-800">{inspectSession.processedBy}</strong>
              </div>
            )}

            {/* Actions in Modal */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setInspectSession(null)}
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
