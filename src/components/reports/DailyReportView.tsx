import React, { useState, useMemo, useEffect } from 'react';
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
  RotateCcw,
  Lock,
  Unlock,
  Archive,
  DollarSign,
  ShieldCheck,
  CheckCheck,
  History,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SessionHistoryItem, TopCustomer, TableItem, ExpenseRecord, UserProfile, DailyLedgerRecord } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatTimerString, getBusinessDateKey } from '../../utils/formatters';
import { getCustomerNumber } from '../../utils/customerIdentity';
import { subscribeDailyLedgers, saveDailyLedgerClosure } from '../../services/dbService';

interface DailyReportViewProps {
  history: SessionHistoryItem[];
  customers?: TopCustomer[];
  tables?: TableItem[];
  expenses?: ExpenseRecord[];
  currencySymbol?: string;
  timeZone?: string;
  clubName?: string;
  clubId?: string;
  currentUser?: UserProfile | null;
}

type SortField = 'time' | 'consumer' | 'amount' | 'duration' | 'table' | 'receipt';
type SortOrder = 'asc' | 'desc';
type DateFilterType = 'today' | 'yesterday' | 'week' | 'custom' | 'all';
type SystemTab = 'live_ledger' | 'day_closing' | 'vault_archives';

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  history = [],
  customers = [],
  tables = [],
  expenses = [],
  currencySymbol = '₹',
  timeZone = 'Asia/Kolkata',
  clubName = 'One Shot Gaming Club',
  clubId = 'club-royal-cue',
  currentUser = null,
}) => {
  // Navigation tabs
  const [activeSystemTab, setActiveSystemTab] = useState<SystemTab>('live_ledger');

  // Business Today & Yesterday Keys
  const todayKey = useMemo(() => getBusinessDateKey(Date.now(), timeZone), [timeZone]);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getBusinessDateKey(d.getTime(), timeZone);
  }, [timeZone]);

  // Live Ledger States
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('today');
  const [customDate, setCustomDate] = useState<string>(todayKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Day Closing (EOD) Form States
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [actualCashCounted, setActualCashCounted] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [closingStaff, setClosingStaff] = useState<string>(currentUser?.displayName || currentUser?.fullName || 'Shift Manager');
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [dayCloseSuccess, setDayCloseSuccess] = useState<DailyLedgerRecord | null>(null);

  // Historical Vault Archives from Firestore & Local Storage
  const [archivedLedgers, setArchivedLedgers] = useState<DailyLedgerRecord[]>([]);
  const [inspectArchive, setInspectArchive] = useState<DailyLedgerRecord | null>(null);
  const [inspectSession, setInspectSession] = useState<SessionHistoryItem | null>(null);
  const [showZReportModal, setShowZReportModal] = useState<DailyLedgerRecord | null>(null);

  // Subscribe to Daily Ledgers
  useEffect(() => {
    const unsubscribe = subscribeDailyLedgers(clubId, (ledgers) => {
      setArchivedLedgers(ledgers);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [clubId]);

  // Read saved opening cash from localStorage if exists
  useEffect(() => {
    const savedOpening = localStorage.getItem(`cuedesk_opening_cash_${clubId}_${todayKey}`);
    if (savedOpening) {
      setOpeningCash(Number(savedOpening) || 0);
    }
  }, [clubId, todayKey]);

  // Check if today is already closed
  const isTodayClosed = useMemo(() => {
    return archivedLedgers.some(l => l.dateKey === todayKey && l.status === 'closed');
  }, [archivedLedgers, todayKey]);

  // Active Tables Count
  const occupiedTables = useMemo(() => {
    return tables.filter(t => t.status === 'occupied' || t.status === 'payment_pending');
  }, [tables]);

  // Sort helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      if (field === 'time' || field === 'amount' || field === 'duration') {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  // Helper date/time formatters
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

  // 1. Date Filtering for Live Ledger
  const dateFilteredHistory = useMemo(() => {
    return history.filter(item => {
      const itemTimestamp = item.endTime || item.startTime || Date.now();
      const itemDateKey = getBusinessDateKey(itemTimestamp, timeZone);

      if (dateFilterType === 'today') return itemDateKey === todayKey;
      if (dateFilterType === 'yesterday') return itemDateKey === yesterdayKey;
      if (dateFilterType === 'custom') return itemDateKey === customDate;
      if (dateFilterType === 'week') {
        const itemTime = new Date(itemTimestamp).getTime();
        return Date.now() - itemTime <= 7 * 24 * 60 * 60 * 1000;
      }
      return true; // 'all'
    });
  }, [history, dateFilterType, todayKey, yesterdayKey, customDate, timeZone]);

  // 2. Multi-Filter
  const filteredHistory = useMemo(() => {
    return dateFilteredHistory.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (item.customerPhone || '').toLowerCase().includes(q);
        const matchesReceipt = (item.receiptNo || '').toLowerCase().includes(q);
        const matchesTable = (item.tableName || '').toLowerCase().includes(q);
        const matchesId = (item.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesReceipt && !matchesTable && !matchesId) return false;
      }
      if (selectedTable !== 'all') {
        if (item.tableId !== selectedTable && item.tableName !== selectedTable) return false;
      }
      if (selectedPaymentMethod !== 'all') {
        if (item.paymentMethod !== selectedPaymentMethod) return false;
      }
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'due') {
          if ((item.balanceDue || 0) <= 0 && item.paymentStatus !== 'due_ledger') return false;
        } else if (item.paymentStatus !== selectedStatus) return false;
      }
      return true;
    });
  }, [dateFilteredHistory, searchQuery, selectedTable, selectedPaymentMethod, selectedStatus]);

  // 3. Sorting
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
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredHistory, sortField, sortOrder]);

  // 4. Financial Calculations for Today (Used for Day Closing)
  const todayFinancials = useMemo(() => {
    const todaySessions = history.filter(item => {
      const itemTimestamp = item.endTime || item.startTime || Date.now();
      return getBusinessDateKey(itemTimestamp, timeZone) === todayKey;
    });

    const validSessions = todaySessions.filter(h => h.paymentStatus !== 'refunded');
    const totalBilled = validSessions.reduce((sum, h) => sum + (Number(h.grandTotal) || 0), 0);
    const totalPaid = validSessions.reduce((sum, h) => sum + (Number(h.amountPaid) || 0), 0);
    const creditDueAdded = validSessions.reduce((sum, h) => sum + (Number(h.balanceDue) || 0), 0);

    let cashCollected = 0;
    let upiCollected = 0;
    let cardCollected = 0;

    validSessions.forEach(h => {
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

    const tableRevenue = validSessions.reduce((sum, h) => sum + (Number(h.tableFee) || 0), 0);
    const foodRevenue = validSessions.reduce((sum, h) => {
      if (typeof h.foodFee === 'number' && h.foodFee > 0) return sum + h.foodFee;
      if (h.foodOrders && h.foodOrders.length > 0) {
        return sum + h.foodOrders.reduce((fsum, f) => fsum + (Number(f.price) || 0) * (Number(f.quantity) || 0), 0);
      }
      return sum;
    }, 0);

    const discountGiven = validSessions.reduce((sum, h) => sum + (Number(h.discountAmount) || 0), 0);
    const taxCollected = validSessions.reduce((sum, h) => sum + (Number(h.taxAmount) || 0), 0);

    const refundedSessions = todaySessions.filter(h => h.paymentStatus === 'refunded');
    const refundsTotal = refundedSessions.reduce((sum, h) => sum + (Number(h.refundedAmount ?? h.grandTotal) || 0), 0);

    // Today's expenses
    const todayExpenses = expenses.filter(exp => {
      const expDateKey = getBusinessDateKey(exp.timestamp || exp.date, timeZone);
      return expDateKey === todayKey;
    });
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const cashExpenses = todayExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Net Profit
    const netProfit = totalBilled - totalExpenses - refundsTotal;

    // Expected Cash in Till = Opening Cash + Cash Collected - Cash Expenses
    const expectedCashInTill = openingCash + cashCollected - cashExpenses;

    const countedCashNum = actualCashCounted === '' ? expectedCashInTill : Number(actualCashCounted) || 0;
    const cashDifference = countedCashNum - expectedCashInTill;

    const totalSeconds = validSessions.reduce((sum, h) => sum + (Number(h.durationSeconds) || 0), 0);
    const totalHoursPlayed = Math.round((totalSeconds / 3600) * 10) / 10;

    const uniqueCustomers = new Set(
      validSessions.map(h => (h.customerId || h.customerPhone || h.customerName || 'walkin').trim().toLowerCase())
    ).size;

    return {
      todaySessions,
      validSessions,
      totalBilled,
      totalPaid,
      creditDueAdded,
      cashCollected,
      upiCollected,
      cardCollected,
      tableRevenue,
      foodRevenue,
      discountGiven,
      taxCollected,
      refundsTotal,
      totalExpenses,
      cashExpenses,
      netProfit,
      expectedCashInTill,
      countedCashNum,
      cashDifference,
      totalSessionsCount: validSessions.length,
      refundedCount: refundedSessions.length,
      totalHoursPlayed,
      uniqueCustomers
    };
  }, [history, expenses, todayKey, timeZone, openingCash, actualCashCounted]);

  // Execute Day Closure & Seal Ledger
  const handleSealAndCloseDay = async () => {
    if (isClosingDay) return;
    setIsClosingDay(true);

    try {
      const closureNumber = `EOD-${todayKey.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Build embedded sessions summary for instant offline vault recall
      const sessionsSummary = todayFinancials.todaySessions.map(h => ({
        id: h.id,
        receiptNo: h.receiptNo || h.id.slice(-6).toUpperCase(),
        time: formatRecordTimeOnly(h.endTime || h.startTime),
        customerName: h.customerName || 'Walk-in',
        customerPhone: h.customerPhone || '',
        tableName: h.tableName || '',
        durationMinutes: Math.ceil((h.durationSeconds || 0) / 60),
        grandTotal: Number(h.grandTotal) || 0,
        amountPaid: Number(h.amountPaid) || 0,
        paymentMethod: h.paymentMethod,
        paymentStatus: h.paymentStatus
      }));

      const ledgerRecord: DailyLedgerRecord = {
        id: `ledger-${todayKey}`,
        dateKey: todayKey,
        clubId,
        closedAt: Date.now(),
        closedBy: closingStaff || 'Shift Manager',
        closureNumber,
        status: 'closed',
        totalBilled: todayFinancials.totalBilled,
        totalCollected: todayFinancials.totalPaid,
        cashCollected: todayFinancials.cashCollected,
        upiCollected: todayFinancials.upiCollected,
        cardCollected: todayFinancials.cardCollected,
        creditDueAdded: todayFinancials.creditDueAdded,
        totalExpenses: todayFinancials.totalExpenses,
        netProfit: todayFinancials.netProfit,
        tableRevenue: todayFinancials.tableRevenue,
        foodRevenue: todayFinancials.foodRevenue,
        taxCollected: todayFinancials.taxCollected,
        discountGiven: todayFinancials.discountGiven,
        refundsTotal: todayFinancials.refundsTotal,
        openingCash,
        expectedCash: todayFinancials.expectedCashInTill,
        actualCashCounted: todayFinancials.countedCashNum,
        cashDifference: todayFinancials.cashDifference,
        totalSessions: todayFinancials.totalSessionsCount,
        totalHoursPlayed: todayFinancials.totalHoursPlayed,
        uniqueCustomers: todayFinancials.uniqueCustomers,
        notes: closingNotes.trim() || undefined,
        sessionsSummary
      };

      // Save to Firebase and Local Vault
      await saveDailyLedgerClosure(clubId, ledgerRecord);

      // Save next day opening cash recommendation in localStorage
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = getBusinessDateKey(tomorrow.getTime(), timeZone);
      localStorage.setItem(`cuedesk_opening_cash_${clubId}_${tomorrowKey}`, String(todayFinancials.countedCashNum));

      setDayCloseSuccess(ledgerRecord);
      setShowZReportModal(ledgerRecord);
    } catch (err) {
      console.error('Failed to seal day ledger:', err);
      alert('Failed to save day ledger. Please try again.');
    } finally {
      setIsClosingDay(false);
    }
  };

  // Export Daily Report to CSV
  const handleExportCSV = () => {
    const filename = `Daily_Report_${dateFilterType === 'custom' ? customDate : dateFilterType}_${todayKey}.csv`;
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
      'Cashier'
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

  // Helper to render sort icon
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">Day Management & EOD System</h2>
                {isTodayClosed ? (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Day Ledger Sealed
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Business Day Active ({todayKey})
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Executive day-closing, cash drawer tally reconciliation, immutable daily archives, and session audit.
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
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
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
            size="sm"
            className="cursor-pointer font-bold text-xs"
          >
            Print
          </Button>
        </div>
      </div>

      {/* Top-Level Module Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-100/90 rounded-2xl border border-neutral-200/80 w-fit">
        <button
          onClick={() => setActiveSystemTab('live_ledger')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSystemTab === 'live_ledger'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Daily Transactions & Audit</span>
        </button>

        <button
          onClick={() => setActiveSystemTab('day_closing')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSystemTab === 'day_closing'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Close Day & Cash Tally</span>
        </button>

        <button
          onClick={() => setActiveSystemTab('vault_archives')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSystemTab === 'vault_archives'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Archive className="w-3.5 h-3.5 text-blue-400" />
          <span>Historical Day Vault ({archivedLedgers.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY TRANSACTIONS & AUDIT LEDGER */}
      {/* ========================================================================= */}
      {activeSystemTab === 'live_ledger' && (
        <>
          {/* Date Range Selection & Quick Switcher */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Total Billed</span>
              <div className="text-xl font-black mt-2 font-mono">
                {formatCurrency(
                  dateFilteredHistory.filter(h => h.paymentStatus !== 'refunded').reduce((s, h) => s + (Number(h.grandTotal) || 0), 0),
                  currencySymbol
                )}
              </div>
              <span className="text-[10px] text-amber-400 mt-1 font-semibold">{dateFilteredHistory.length} Sessions</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Cash Collected</span>
              <div className="text-xl font-black mt-2 font-mono text-emerald-800">
                {formatCurrency(todayFinancials.cashCollected, currencySymbol)}
              </div>
              <span className="text-[10px] text-emerald-600 mt-1 font-semibold">Physical Till Cash</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">UPI / QR Online</span>
              <div className="text-xl font-black mt-2 font-mono text-blue-800">
                {formatCurrency(todayFinancials.upiCollected, currencySymbol)}
              </div>
              <span className="text-[10px] text-blue-600 mt-1 font-semibold">Instant Digital Receipts</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Credit / Udhaar Added</span>
              <div className="text-xl font-black mt-2 font-mono text-rose-800">
                {formatCurrency(todayFinancials.creditDueAdded, currencySymbol)}
              </div>
              <span className="text-[10px] text-rose-600 mt-1 font-semibold">Pending Recovery</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-900 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Expenses Logged</span>
              <div className="text-xl font-black mt-2 font-mono text-neutral-900">
                {formatCurrency(todayFinancials.totalExpenses, currencySymbol)}
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 font-semibold">Club Costs Today</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Net Estimated Profit</span>
              <div className="text-xl font-black mt-2 font-mono text-amber-800">
                {formatCurrency(todayFinancials.netProfit, currencySymbol)}
              </div>
              <span className="text-[10px] text-amber-600 mt-1 font-semibold">{todayFinancials.uniqueCustomers} Customers Served</span>
            </div>
          </div>

          {/* Filtering, Searching & Data Table */}
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="w-full lg:w-80">
                <Input
                  placeholder="Search consumer, phone, receipt #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
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

                {(searchQuery || selectedTable !== 'all' || selectedPaymentMethod !== 'all' || selectedStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTable('all');
                      setSelectedPaymentMethod('all');
                      setSelectedStatus('all');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-neutral-600 hover:bg-neutral-100 font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Sort Shortcuts */}
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

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs text-neutral-700 divide-y divide-neutral-200">
                <thead className="bg-neutral-100/80 text-neutral-600 font-bold text-[11px] uppercase tracking-wider select-none">
                  <tr>
                    <th onClick={() => handleSort('time')} className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group">
                      <div className="flex items-center gap-1.5">
                        <span>Date & Time</span>
                        {renderSortIndicator('time')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('receipt')} className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group">
                      <div className="flex items-center gap-1.5">
                        <span>Receipt No</span>
                        {renderSortIndicator('receipt')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('consumer')} className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group">
                      <div className="flex items-center gap-1.5">
                        <span>Consumer (Customer)</span>
                        {renderSortIndicator('consumer')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('table')} className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group">
                      <div className="flex items-center gap-1.5">
                        <span>Station / Table</span>
                        {renderSortIndicator('table')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('duration')} className="p-3.5 cursor-pointer hover:bg-neutral-200/70 transition-colors group">
                      <div className="flex items-center gap-1.5">
                        <span>Duration</span>
                        {renderSortIndicator('duration')}
                      </div>
                    </th>
                    <th className="p-3.5">Fee Breakdown</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Status</th>
                    <th onClick={() => handleSort('amount')} className="p-3.5 text-right cursor-pointer hover:bg-neutral-200/70 transition-colors group">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Grand Total</span>
                        {renderSortIndicator('amount')}
                      </div>
                    </th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-neutral-100">
                  {sortedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-neutral-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="w-10 h-10 text-neutral-300" />
                          <p className="font-bold text-neutral-700 text-sm">No Daily Transactions Found</p>
                          <p className="text-xs text-neutral-400 max-w-sm">
                            No bills match your current filters. Settle sessions at checkout to populate this ledger.
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
                      const foodCount = (item.foodOrders || []).reduce((acc, f) => acc + (f.quantity || 1), 0);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-neutral-50/80 transition-colors ${
                            isRefunded ? 'bg-neutral-50/40 opacity-70' : hasDue ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="p-3.5 font-medium whitespace-nowrap">
                            <div className="font-bold text-neutral-900">{formatRecordTimeOnly(item.endTime || item.startTime)}</div>
                            <div className="text-[10px] text-neutral-400">{formatRecordDateOnly(item.endTime || item.startTime)}</div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                              {item.receiptNo || item.id.slice(-6).toUpperCase()}
                            </span>
                          </td>

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

                          <td className="p-3.5 whitespace-nowrap font-semibold text-neutral-800">
                            {item.tableName || 'Gaming Table'}
                          </td>

                          <td className="p-3.5 whitespace-nowrap font-mono text-neutral-700">
                            {formatTimerString(item.durationSeconds || 0)}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="text-[11px]">
                              <span className="text-neutral-500">Table: </span>
                              <span className="font-bold text-neutral-800 font-mono">{formatCurrency(item.tableFee || 0, currencySymbol)}</span>
                            </div>
                            {(item.foodFee || 0) > 0 && (
                              <div className="text-[10px] text-amber-700 flex items-center gap-1">
                                <Utensils className="w-2.5 h-2.5" />
                                <span>Food: {formatCurrency(item.foodFee, currencySymbol)} ({foodCount} items)</span>
                              </div>
                            )}
                          </td>

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
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLOSE DAY & RECONCILE CASH TALLY (EOD) */}
      {/* ========================================================================= */}
      {activeSystemTab === 'day_closing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Day Financials Summary */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Warning if tables currently occupied */}
            {occupiedTables.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-extrabold text-sm">Attention: {occupiedTables.length} Active Table Sessions Running</h4>
                  <p className="mt-0.5 text-amber-800">
                    Tables {occupiedTables.map(t => t.name).join(', ')} currently have unbilled open timers. For complete accuracy, checkout these tables before sealing today's ledger.
                  </p>
                </div>
              </div>
            )}

            {/* Financial Breakdown Card */}
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Today's Financial Summary ({todayKey})
                  </h3>
                  <p className="text-xs text-neutral-500">Live consolidated figures ready for Day Closure</p>
                </div>
                <Badge variant={isTodayClosed ? 'success' : 'warning'}>
                  {isTodayClosed ? 'Already Sealed' : 'Active Slate'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Gross Billed</span>
                  <span className="text-base font-black font-mono text-neutral-900 mt-1 block">
                    {formatCurrency(todayFinancials.totalBilled, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">{todayFinancials.totalSessionsCount} bills settled</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Cash Sales</span>
                  <span className="text-base font-black font-mono text-emerald-900 mt-1 block">
                    {formatCurrency(todayFinancials.cashCollected, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Physical cash in</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold uppercase block">Digital UPI / QR</span>
                  <span className="text-base font-black font-mono text-blue-900 mt-1 block">
                    {formatCurrency(todayFinancials.upiCollected, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Instant bank credits</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-bold uppercase block">Card Swipes</span>
                  <span className="text-base font-black font-mono text-amber-900 mt-1 block">
                    {formatCurrency(todayFinancials.cardCollected, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-amber-600 font-medium">POS terminals</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Udhaar / Credit Added</span>
                  <span className="text-base font-black font-mono text-rose-900 mt-1 block">
                    {formatCurrency(todayFinancials.creditDueAdded, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">Customer dues</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 text-white">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Total Expenses</span>
                  <span className="text-base font-black font-mono text-amber-400 mt-1 block">
                    {formatCurrency(todayFinancials.totalExpenses, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">Cash exp: {formatCurrency(todayFinancials.cashExpenses, currencySymbol)}</span>
                </div>
              </div>

              {/* Sub-Ledger Calculations */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col gap-2.5 text-xs font-mono mt-2">
                <div className="flex justify-between text-neutral-300">
                  <span>Table Hours Playtime Revenue</span>
                  <span>{formatCurrency(todayFinancials.tableRevenue, currencySymbol)} ({todayFinancials.totalHoursPlayed} hrs)</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Café & Refreshments Revenue</span>
                  <span>{formatCurrency(todayFinancials.foodRevenue, currencySymbol)}</span>
                </div>
                {todayFinancials.discountGiven > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discounts Granted</span>
                    <span>-{formatCurrency(todayFinancials.discountGiven, currencySymbol)}</span>
                  </div>
                )}
                {todayFinancials.taxCollected > 0 && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Tax / GST Collected</span>
                    <span>+{formatCurrency(todayFinancials.taxCollected, currencySymbol)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-neutral-700 flex justify-between font-black text-sm text-white">
                  <span>Day Operating Net Profit</span>
                  <span className={todayFinancials.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {formatCurrency(todayFinancials.netProfit, currencySymbol)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Cash Drawer Reconciliation & Seal Action */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <Card className="flex flex-col gap-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Cash Drawer Tally & Reconciliation
                </h3>
                <p className="text-xs text-neutral-500">Reconcile physical cash till against system records</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Opening Cash */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Opening Cash in Drawer (Morning Float)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-bold">{currencySymbol}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">Float carried over from previous day's closing</span>
                </div>

                {/* System Calculated Expected Cash */}
                <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-200 flex flex-col gap-1.5">
                  <div className="flex justify-between font-medium text-neutral-600">
                    <span>+ Opening Cash Float:</span>
                    <span className="font-mono">{formatCurrency(openingCash, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-emerald-700">
                    <span>+ Cash Sales Collected:</span>
                    <span className="font-mono">+{formatCurrency(todayFinancials.cashCollected, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-rose-700">
                    <span>- Cash Expenses Paid:</span>
                    <span className="font-mono">-{formatCurrency(todayFinancials.cashExpenses, currencySymbol)}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-300 flex justify-between font-black text-neutral-900 text-sm">
                    <span>Expected Cash in Till:</span>
                    <span className="font-mono text-emerald-800">{formatCurrency(todayFinancials.expectedCashInTill, currencySymbol)}</span>
                  </div>
                </div>

                {/* 2. Actual Physical Cash Counted */}
                <div>
                  <label className="font-black text-neutral-800 block mb-1">
                    Actual Physical Cash Counted in Hand:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={actualCashCounted}
                      onChange={(e) => setActualCashCounted(e.target.value)}
                      placeholder={todayFinancials.expectedCashInTill.toFixed(2)}
                      className="w-full px-3 py-2.5 bg-white border-2 border-neutral-800 rounded-xl font-mono font-black text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <span className="absolute right-3 top-3 text-xs text-neutral-500 font-bold">{currencySymbol}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Count physical currency notes & coins in drawer</span>
                </div>

                {/* Variance Display */}
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  todayFinancials.cashDifference === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : todayFinancials.cashDifference > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {todayFinancials.cashDifference === 0 ? (
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                      {todayFinancials.cashDifference === 0
                        ? 'Drawer Perfectly Balanced'
                        : todayFinancials.cashDifference > 0
                        ? 'Cash Surplus / Excess'
                        : 'Cash Shortage'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-sm">
                    {todayFinancials.cashDifference > 0 ? '+' : ''}
                    {formatCurrency(todayFinancials.cashDifference, currencySymbol)}
                  </span>
                </div>

                {/* Closing Cashier / Manager Name */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Closing Authorized Staff</label>
                  <input
                    type="text"
                    value={closingStaff}
                    onChange={(e) => setClosingStaff(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 font-semibold focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Shift Handover & End-of-Day Notes</label>
                  <textarea
                    rows={2}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="e.g. Clean shift, cash verified, restocked cues..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 text-xs focus:outline-none"
                  />
                </div>

                {/* Seal Action Button */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    onClick={handleSealAndCloseDay}
                    disabled={isClosingDay}
                    leftIcon={<Lock className="w-4 h-4 text-amber-400" />}
                    className="w-full py-3 text-xs font-black uppercase tracking-wider cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg"
                  >
                    {isClosingDay ? 'Sealing Daily Ledger...' : 'Seal & Archive Day Ledger (EOD Close)'}
                  </Button>
                  <p className="text-[10px] text-neutral-400 text-center mt-2">
                    Stores complete immutable day record to the vault and generates the official Z-Report.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HISTORICAL DAY VAULT & ARCHIVES (PERMANENT STORE) */}
      {/* ========================================================================= */}
      {activeSystemTab === 'vault_archives' && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-neutral-900">Historical Day Ledger Vault</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {archivedLedgers.length} Sealed Closures
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Permanent immutable store of all daily closures. Inspect past dossiers, reprint Z-Reports, and review cash tallies.
              </p>
            </div>
          </div>

          {archivedLedgers.length === 0 ? (
            <div className="p-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
              <Archive className="w-12 h-12 text-neutral-300" />
              <h4 className="font-bold text-neutral-700 text-sm">No Day Closures Archived Yet</h4>
              <p className="text-xs text-neutral-400 max-w-sm">
                When you close a day from the "Close Day & Cash Tally" tab, its permanent sealed ledger dossier will be stored here forever.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs text-neutral-700 divide-y divide-neutral-200">
                <thead className="bg-neutral-100 text-neutral-600 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Business Date</th>
                    <th className="p-3.5">Closure Seal #</th>
                    <th className="p-3.5">Closed By & Time</th>
                    <th className="p-3.5">Gross Billed</th>
                    <th className="p-3.5">Cash Collected</th>
                    <th className="p-3.5">Digital UPI</th>
                    <th className="p-3.5">Expenses</th>
                    <th className="p-3.5">Net Profit</th>
                    <th className="p-3.5">Cash Tally</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-neutral-100">
                  {archivedLedgers.map((ledger) => {
                    const diff = ledger.cashDifference || 0;
                    return (
                      <tr key={ledger.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-neutral-900 whitespace-nowrap">
                          {ledger.dateKey}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                            {ledger.closureNumber}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-semibold text-neutral-800">{ledger.closedBy}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {formatRecordDateTime(ledger.closedAt)}
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-neutral-900">
                          {formatCurrency(ledger.totalBilled || 0, currencySymbol)}
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono text-emerald-700 font-bold">
                          {formatCurrency(ledger.cashCollected || 0, currencySymbol)}
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono text-blue-700 font-bold">
                          {formatCurrency(ledger.upiCollected || 0, currencySymbol)}
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono text-neutral-600">
                          {formatCurrency(ledger.totalExpenses || 0, currencySymbol)}
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-neutral-900">
                          <span className={(ledger.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {formatCurrency(ledger.netProfit || 0, currencySymbol)}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          {diff === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              BALANCED
                            </span>
                          ) : diff > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              +{diff} OVER
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                              {diff} SHORT
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setInspectArchive(ledger)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold transition-colors cursor-pointer"
                              title="Inspect Full Day Dossier"
                            >
                              Dossier
                            </button>
                            <button
                              onClick={() => setShowZReportModal(ledger)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Print Z-Report Slip"
                            >
                              <Printer className="w-3 h-3 text-amber-400" />
                              <span>Z-Report</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: OFFICIAL Z-REPORT / DAY CLOSURE SLIP (PRINTABLE) */}
      {/* ========================================================================= */}
      {showZReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-neutral-300 shadow-2xl p-6 flex flex-col gap-4 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            {/* Header Slip */}
            <div className="text-center border-b border-dashed border-neutral-300 pb-4">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-amber-400 mx-auto flex items-center justify-center mb-2 font-black">
                ★
              </div>
              <h3 className="text-lg font-black tracking-tight text-neutral-900 uppercase">{clubName}</h3>
              <p className="text-[11px] text-neutral-500">Official End-of-Day Settlement Dossier (Z-Report)</p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 font-mono font-bold text-[10px] border border-neutral-200">
                SEAL: {showZReportModal.closureNumber}
              </div>
            </div>

            {/* Meta Row */}
            <div className="text-xs space-y-1 font-mono border-b border-dashed border-neutral-300 pb-3 text-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-500">Business Date:</span>
                <span className="font-bold">{showZReportModal.dateKey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Sealed At:</span>
                <span>{formatRecordDateTime(showZReportModal.closedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Closed By:</span>
                <span className="font-bold">{showZReportModal.closedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Sessions:</span>
                <span>{showZReportModal.totalSessions} bills ({showZReportModal.totalHoursPlayed} hrs)</span>
              </div>
            </div>

            {/* Financials Breakdown */}
            <div className="text-xs space-y-1.5 font-mono border-b border-dashed border-neutral-300 pb-3">
              <div className="flex justify-between font-bold text-neutral-900">
                <span>GROSS BILLED REVENUE:</span>
                <span>{formatCurrency(showZReportModal.totalBilled, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 text-[11px] pl-2">
                <span>- Table Hours Fee:</span>
                <span>{formatCurrency(showZReportModal.tableRevenue, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 text-[11px] pl-2">
                <span>- Food & Beverages:</span>
                <span>{formatCurrency(showZReportModal.foodRevenue, currencySymbol)}</span>
              </div>
              {showZReportModal.discountGiven > 0 && (
                <div className="flex justify-between text-emerald-700 text-[11px] pl-2">
                  <span>- Discounts Given:</span>
                  <span>-{formatCurrency(showZReportModal.discountGiven, currencySymbol)}</span>
                </div>
              )}
              {showZReportModal.taxCollected > 0 && (
                <div className="flex justify-between text-neutral-600 text-[11px] pl-2">
                  <span>- Tax / GST:</span>
                  <span>+{formatCurrency(showZReportModal.taxCollected, currencySymbol)}</span>
                </div>
              )}
            </div>

            {/* Payment Method Split */}
            <div className="text-xs space-y-1 font-mono border-b border-dashed border-neutral-300 pb-3 text-neutral-700">
              <span className="font-bold text-[10px] uppercase text-neutral-500 block mb-1">Collections By Method</span>
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Cash Sales:</span>
                <span>{formatCurrency(showZReportModal.cashCollected, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-blue-800 font-bold">
                <span>UPI / QR Digital:</span>
                <span>{formatCurrency(showZReportModal.upiCollected, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Card Swipes:</span>
                <span>{formatCurrency(showZReportModal.cardCollected, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-rose-800 font-bold">
                <span>Credit (Udhaar) Added:</span>
                <span>{formatCurrency(showZReportModal.creditDueAdded, currencySymbol)}</span>
              </div>
            </div>

            {/* Cash Drawer Tally */}
            <div className="text-xs space-y-1 font-mono border-b border-dashed border-neutral-300 pb-3 bg-neutral-50 p-2.5 rounded-xl">
              <span className="font-bold text-[10px] uppercase text-neutral-500 block mb-1">Till Reconciliation</span>
              <div className="flex justify-between">
                <span>Opening Cash:</span>
                <span>{formatCurrency(showZReportModal.openingCash, currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Expected Cash In Till:</span>
                <span>{formatCurrency(showZReportModal.expectedCash, currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900">
                <span>Actual Counted Cash:</span>
                <span>{formatCurrency(showZReportModal.actualCashCounted, currencySymbol)}</span>
              </div>
              <div className={`flex justify-between font-black pt-1 border-t border-neutral-200 ${
                showZReportModal.cashDifference === 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                <span>Difference / Variance:</span>
                <span>{formatCurrency(showZReportModal.cashDifference, currencySymbol)}</span>
              </div>
            </div>

            {/* Operating Profit */}
            <div className="p-3 rounded-2xl bg-neutral-900 text-white flex justify-between items-center text-xs font-mono">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-amber-400">Net Operating Profit:</span>
              <span className="text-base font-black text-white">{formatCurrency(showZReportModal.netProfit, currencySymbol)}</span>
            </div>

            {showZReportModal.notes && (
              <p className="text-[10px] text-neutral-500 italic text-center font-mono">
                "{showZReportModal.notes}"
              </p>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center gap-2 pt-2 print:hidden">
              <Button
                variant="outline"
                onClick={() => setShowZReportModal(null)}
                className="flex-1 cursor-pointer"
                size="sm"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4 text-amber-400" />}
                className="flex-1 cursor-pointer bg-neutral-900 text-white font-bold"
                size="sm"
              >
                Print Slip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INSPECT ARCHIVED DAY DOSSIER WITH ALL BILLS */}
      {/* ========================================================================= */}
      {inspectArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-neutral-200 shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Archived Day Dossier</span>
                <h3 className="text-lg font-black text-neutral-900">
                  Business Date: {inspectArchive.dateKey}
                </h3>
              </div>
              <button
                onClick={() => setInspectArchive(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Billed Revenue</span>
                <span className="text-base font-black text-neutral-900 block mt-0.5 font-mono">
                  {formatCurrency(inspectArchive.totalBilled, currencySymbol)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Cash in Till</span>
                <span className="text-base font-black text-emerald-900 block mt-0.5 font-mono">
                  {formatCurrency(inspectArchive.actualCashCounted, currencySymbol)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold uppercase block">UPI Online</span>
                <span className="text-base font-black text-blue-900 block mt-0.5 font-mono">
                  {formatCurrency(inspectArchive.upiCollected, currencySymbol)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">Net Day Profit</span>
                <span className="text-base font-black text-amber-900 block mt-0.5 font-mono">
                  {formatCurrency(inspectArchive.netProfit, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Embedded Bills List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Settled Bills & Sessions on this Date ({inspectArchive.sessionsSummary?.length || 0})
              </h4>
              <div className="rounded-xl border border-neutral-200 max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs text-neutral-700 divide-y divide-neutral-200">
                  <thead className="bg-neutral-100 text-neutral-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Receipt #</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Table</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {(inspectArchive.sessionsSummary || []).map((bill, i) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="p-2.5 font-mono text-[11px]">{bill.time}</td>
                        <td className="p-2.5 font-mono font-bold text-neutral-900">{bill.receiptNo}</td>
                        <td className="p-2.5 font-semibold text-neutral-800">{bill.customerName}</td>
                        <td className="p-2.5 text-neutral-600">{bill.tableName}</td>
                        <td className="p-2.5 font-mono">{bill.durationMinutes} min</td>
                        <td className="p-2.5 uppercase font-bold text-[10px]">{bill.paymentMethod}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-neutral-900">
                          {formatCurrency(bill.grandTotal, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectArchive(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowZReportModal(inspectArchive);
                  setInspectArchive(null);
                }}
                leftIcon={<Printer className="w-3.5 h-3.5 text-amber-400" />}
                className="bg-neutral-900 text-white font-bold"
              >
                Print Z-Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INSPECT INDIVIDUAL SESSION DETAIL */}
      {/* ========================================================================= */}
      {inspectSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-neutral-200 shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
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
