import React, { useState, useEffect } from 'react';
import { 
  Receipt as ReceiptIcon, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  Percent, 
  Clock, 
  User, 
  Printer, 
  Share2, 
  Utensils,
  ChevronRight,
  AlertCircle,
  Plus,
  Trash2,
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  Split,
  History as HistoryIcon,
  ShieldAlert,
  ArrowRightLeft,
  Sparkles,
  Check,
  Users
} from 'lucide-react';
import { 
  TableItem, 
  SessionData, 
  SessionHistoryItem, 
  BusinessConfig, 
  ExtraChargeItem, 
  SplitPaymentBreakdown,
  SplitPaymentPlayer,
  AuditLogItem,
  UserRole,
  TopCustomer
} from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { formatCurrency, calculateSessionSeconds, formatTimerString, calculateBillTotals } from '../../utils/formatters';
import { exportSalesToExcel } from '../../utils/excelExport';
import { useAuth } from '../../context/AuthContext';
import { getCustomerNumber } from '../../utils/customerIdentity';

interface BillingViewProps {
  tables: TableItem[];
  currencySymbol: string;
  taxRatePercent: number;
  enableTax: boolean;
  upiId: string;
  upiName: string;
  config?: BusinessConfig;
  history?: SessionHistoryItem[];
  userRole?: UserRole;
  auditLogs?: AuditLogItem[];
  topCustomers?: TopCustomer[];
  onMarkPaid: (historyItem: SessionHistoryItem) => void;
  onShowReceipt: (historyItem: SessionHistoryItem) => void;
  onRefund?: (historyId: string, reason: string) => Promise<void> | void;
  onUpdateHistoryRecord?: (historyId: string, updates: Partial<SessionHistoryItem>) => Promise<void> | void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  tables,
  currencySymbol,
  taxRatePercent,
  enableTax,
  upiId,
  upiName,
  config,
  history = [],
  userRole = 'owner',
  auditLogs = [],
  topCustomers = [],
  onMarkPaid,
  onShowReceipt,
  onRefund,
  onUpdateHistoryRecord
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'checkout' | 'ledger' | 'audit' | 'eod'>('checkout');

  // Active Tables & Selected Table
  const occupiedTables = tables.filter((t) => (t.status === 'occupied' || t.status === 'payment_pending') && t.currentSession);
  const [selectedTableId, setSelectedTableId] = useState<string>(
    occupiedTables.length > 0 ? occupiedTables[0].id : ''
  );

  // Customer Identification State (captured on checkout)
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [selectedCrmCustomerId, setSelectedCrmCustomerId] = useState<string | null>(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Billing State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'split' | 'due_ledger'>('upi');
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [extraCharges, setExtraCharges] = useState<ExtraChargeItem[]>([]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraAmount, setNewExtraAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Split Payment State
  const [splitMode, setSplitMode] = useState<'method' | 'players'>('method');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);

  // Two-Person Split State
  const [p1Name, setP1Name] = useState('Player 1');
  const [p1Amount, setP1Amount] = useState<number>(0);
  const [p1Method, setP1Method] = useState<'cash' | 'upi' | 'credit'>('cash');
  const [p1CustomerId, setP1CustomerId] = useState<string | null>(null);

  const [p2Name, setP2Name] = useState('Player 2');
  const [p2Amount, setP2Amount] = useState<number>(0);
  const [p2Method, setP2Method] = useState<'cash' | 'upi' | 'credit'>('upi');
  const [p2CustomerId, setP2CustomerId] = useState<string | null>(null);

  // Partial Payment
  const [customAmountPaid, setCustomAmountPaid] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userRole === 'worker') {
      setSplitMode('method');
      setDiscountInput(0);
      setExtraCharges([]);
    }
  }, [userRole]);
  const [now, setNow] = useState(Date.now());

  // Ledger Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'pending' | 'refunded'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'upi' | 'split' | 'due_ledger' | 'card'>('all');

  // Refund Modal State
  const [refundModalItem, setRefundModalItem] = useState<SessionHistoryItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (occupiedTables.length > 0 && !occupiedTables.some((t) => t.id === selectedTableId)) {
      setSelectedTableId(occupiedTables[0].id);
    }
  }, [occupiedTables, selectedTableId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTable = tables.find((t) => t.id === selectedTableId) || occupiedTables[0];
  const session = currentTable?.currentSession;

  // Reset local state when selected table changes
  useEffect(() => {
    setExtraCharges([]);
    setDiscountInput(0);
    setNotes('');
    setCustomAmountPaid(null);
    setSplitMode('method');

    const defaultCustName = session?.customerName && !session.customerName.startsWith('Table #') ? session.customerName : '';
    setCustomerNameInput(defaultCustName);
    setCustomerPhoneInput(session?.customerPhone || '');

    // Only use an explicit, stable customer link. Never guess by a shared name or phone number.
    const linkedCustomerId = session?.customerId || null;
    setSelectedCrmCustomerId(linkedCustomerId);

    setP1Name(defaultCustName || 'Player 1');
    setP1CustomerId(linkedCustomerId);
    setP1Method('cash');
    setP2Name('Player 2');
    setP2CustomerId(null);
    setP2Method('upi');
  }, [selectedTableId]);

  let seconds = 0;
  let computedTotals = { tableFee: 0, foodFee: 0, extraFee: 0, subtotal: 0, discountAmount: 0, taxableAmount: 0, taxAmount: 0, grandTotal: 0 };

  if (session) {
    seconds = calculateSessionSeconds(session, now);
    
    // Calculate numeric discount
    let discountVal = discountInput;
    if (discountType === 'percent') {
      const approxTableFee = (seconds / 3600) * session.hourlyRate;
      const approxFoodFee = session.foodOrders ? session.foodOrders.reduce((s, o) => s + o.price * o.quantity, 0) : 0;
      const approxSubtotal = approxTableFee + approxFoodFee + extraCharges.reduce((s, e) => s + e.amount, 0);
      discountVal = (approxSubtotal * (discountInput / 100));
    }

    computedTotals = calculateBillTotals(
      session, 
      taxRatePercent, 
      enableTax, 
      discountVal, 
      now, 
      extraCharges, 
      config?.roundingRule || 'nearest_1',
      config?.minimumChargeMinutes || 0
    );
  }

  // Handle auto split allocation default
  useEffect(() => {
    if (computedTotals.grandTotal > 0) {
      const half = Math.round(computedTotals.grandTotal / 2);
      const rem = computedTotals.grandTotal - half;
      setSplitCash(half);
      setSplitUpi(rem);
      setP1Amount(half);
      setP2Amount(rem);
    }
  }, [computedTotals.grandTotal]);

  const handleAddExtraCharge = () => {
    if (!newExtraName.trim() || !newExtraAmount || Number(newExtraAmount) <= 0) return;
    setExtraCharges((prev) => [
      ...prev,
      { id: `extra-${Date.now()}`, name: newExtraName.trim(), amount: Number(newExtraAmount) }
    ]);
    setNewExtraName('');
    setNewExtraAmount('');
  };

  const handleRemoveExtraCharge = (id: string) => {
    setExtraCharges((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredCustomers = topCustomers.filter((c) => {
    if (!customerNameInput.trim()) return true;
    const q = customerNameInput.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  const selectedCustomerObj = topCustomers.find((c) => c.id === selectedCrmCustomerId);

  const handleCheckout = async () => {
    if (!currentTable || !session || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const isUdhaar = paymentMethod === 'due_ledger';
      const finalGrandTotal = computedTotals.grandTotal;
      let actualPaid = isUdhaar ? 0 : (customAmountPaid !== null ? customAmountPaid : finalGrandTotal);
      let balance = isUdhaar ? finalGrandTotal : Math.max(0, finalGrandTotal - actualPaid);
      
      let pStatus: SessionHistoryItem['paymentStatus'] = 'paid';
      if (isUdhaar) {
        pStatus = 'due_ledger';
      } else if (actualPaid <= 0) {
        pStatus = 'pending';
      } else if (actualPaid < finalGrandTotal) {
        pStatus = 'partially_paid';
      }

      const receiptNo = `REC-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      let splitBreakdownData: SplitPaymentBreakdown | undefined = undefined;
      if (paymentMethod === 'split') {
        if (splitMode === 'players') {
          const p1Cash = p1Method === 'cash' ? p1Amount : 0;
          const p2Cash = p2Method === 'cash' ? p2Amount : 0;
          const p1Upi = p1Method === 'upi' ? p1Amount : 0;
          const p2Upi = p2Method === 'upi' ? p2Amount : 0;
          splitBreakdownData = {
            cash: p1Cash + p2Cash,
            upi: p1Upi + p2Upi,
            splitType: 'players',
            players: [
              {
                name: p1Name.trim() || 'Player 1',
                amount: p1Amount,
                method: p1Method,
                customerId: p1CustomerId || undefined,
              },
              {
                name: p2Name.trim() || 'Player 2',
                amount: p2Amount,
                method: p2Method,
                customerId: p2CustomerId || undefined,
              }
            ]
          };
        } else {
          splitBreakdownData = {
            cash: splitCash,
            upi: splitUpi,
            splitType: 'method'
          };
        }
      }

      if (paymentMethod === 'split' && splitMode === 'players' && splitBreakdownData?.players) {
        const playerTotal = splitBreakdownData.players.reduce((sum, player) => sum + player.amount, 0);
        if (Math.abs(playerTotal - finalGrandTotal) > 0.01) {
          window.alert('Player shares must add up to the bill total before checkout.');
          return;
        }
        actualPaid = splitBreakdownData.players
          .filter((player) => player.method !== 'credit')
          .reduce((sum, player) => sum + player.amount, 0);
        balance = splitBreakdownData.players
          .filter((player) => player.method === 'credit')
          .reduce((sum, player) => sum + player.amount, 0);
        pStatus = balance > 0 ? (actualPaid > 0 ? 'partially_paid' : 'due_ledger') : 'paid';
      }

      if (balance > 0 && !selectedCrmCustomerId && !session.customerId && !p1CustomerId && !p2CustomerId) {
        window.alert('Select the customer from CRM before recording an unpaid balance. This links the due to the right account.');
        return;
      }
      if (paymentMethod === 'split' && splitMode === 'players' && splitBreakdownData?.players?.some((player) => player.method === 'credit' && !player.customerId)) {
        window.alert('Select a CRM customer for each player paying on credit.');
        return;
      }

      const finalCustomerName = customerNameInput.trim() ||
        (session.customerName && !session.customerName.startsWith('Table #') ? session.customerName : `Guest (Table #${currentTable.number})`);
      const finalCustomerPhone = customerPhoneInput.trim() || session.customerPhone || '';

      const historyItem: SessionHistoryItem = {
        id: `hist-${Date.now()}`,
        tableId: currentTable.id,
        tableName: currentTable.name,
        customerName: finalCustomerName,
        customerId: selectedCrmCustomerId || session.customerId || p1CustomerId || p2CustomerId || undefined,
        customerPhone: finalCustomerPhone,
        startTime: session.startTime,
        endTime: now,
        durationSeconds: seconds,
        hourlyRate: session.hourlyRate,
        tableFee: computedTotals.tableFee,
        foodFee: computedTotals.foodFee,
        extraFee: computedTotals.extraFee,
        extraCharges: extraCharges,
        taxAmount: computedTotals.taxAmount,
        discountAmount: computedTotals.discountAmount,
        grandTotal: finalGrandTotal,
        amountPaid: actualPaid,
        balanceDue: balance,
        paymentMethod: paymentMethod,
        ...(splitBreakdownData ? { splitBreakdown: splitBreakdownData } : {}),
        paymentStatus: pStatus,
        foodOrders: session.foodOrders || [],
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        receiptNo: receiptNo,
        timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      await onMarkPaid(historyItem);
      onShowReceipt(historyItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    exportSalesToExcel(history, config.clubName);
  };

  // Process Refund
  const handleConfirmRefund = async () => {
    if (!refundModalItem || !refundReason.trim() || !onRefund || isRefunding) return;
    setIsRefunding(true);
    try {
      await onRefund(refundModalItem.id, refundReason.trim());
      setRefundModalItem(null);
      setRefundReason('');
    } finally {
      setIsRefunding(false);
    }
  };

  // Ledger Filtered List
  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.customerName.toLowerCase().includes(q) ||
      (item.customerPhone && item.customerPhone.toLowerCase().includes(q)) ||
      item.tableName.toLowerCase().includes(q) ||
      item.receiptNo.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || item.paymentStatus === statusFilter;
    const matchesMethod = methodFilter === 'all' || item.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate Ledger totals
  const todayRevenue = history
    .filter(h => h.paymentStatus !== 'refunded')
    .reduce((sum, h) => sum + (h.amountPaid ?? h.grandTotal), 0);
  const pendingBalanceTotal = history
    .filter(h => h.paymentStatus === 'partially_paid' || h.paymentStatus === 'pending')
    .reduce((sum, h) => sum + (h.balanceDue || 0), 0);
  const refundedTotal = history
    .filter(h => h.paymentStatus === 'refunded')
    .reduce((sum, h) => sum + h.grandTotal, 0);

  const canApplyHighDiscount = userRole === 'owner' || userRole === 'manager';
  const isCashierDiscountCapped = userRole === 'cashier' && discountType === 'percent' && discountInput > (config?.maxCashierDiscountPercent || 10);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
      {/* Top Console Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Production Billing & Ledger Console
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono uppercase bg-neutral-100">
              {config?.clubName || 'Billing Engine'}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Per-minute exact session billing, split payments, manual charges, receipts & payment ledger
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('checkout')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'checkout'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ReceiptIcon className="w-4 h-4" />
            Live Checkout ({occupiedTables.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ledger'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <HistoryIcon className="w-4 h-4" />
            Payment History ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'audit'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('eod')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'eod'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            EOD Report
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE CHECKOUT & BILLING CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === 'checkout' && (
        <>
          {occupiedTables.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-1">
                <ReceiptIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-neutral-800">No Active Sessions To Bill</h3>
              <p className="text-xs text-neutral-500 max-w-sm">
                All snooker & pool tables are currently available. Start a session from the Dashboard or Table Grid to manage live billing.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Active Tables Selection Bar */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>Active Sessions ({occupiedTables.length})</span>
                  <span className="text-[10px] text-neutral-500 font-normal">Click table to bill</span>
                </h3>

                <div className="flex flex-col gap-2.5">
                  {occupiedTables.map((t) => {
                    const s = t.currentSession!;
                    const sec = calculateSessionSeconds(s, now);
                    const tTotals = calculateBillTotals(s, taxRatePercent, enableTax, 0, now, [], config?.roundingRule || 'nearest_1', config?.minimumChargeMinutes || 0);
                    const isSelected = t.id === selectedTableId;

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTableId(t.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg scale-[1.01]'
                            : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-sm ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                              Table #{t.number.toString().padStart(2, '0')}
                            </span>
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                              {t.type}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 truncate max-w-[150px] font-medium ${isSelected ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            {s.customerName}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`text-sm font-bold font-mono block ${isSelected ? 'text-emerald-300' : 'text-neutral-900'}`}>
                            {formatCurrency(tTotals.grandTotal, currencySymbol)}
                          </span>
                          <span className={`text-[11px] font-mono ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {formatTimerString(sec)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Complete Statement & Payment Form */}
              {currentTable && session && (
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 sm:p-8 flex flex-col gap-6">
                    {/* Bill Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-100 gap-2">
                      <div>
                        <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                          {config?.clubName || 'Club'} Official Session Statement
                        </span>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight mt-0.5">
                          Table #{currentTable.number} Billing Statement
                        </h3>
                      </div>

                      <Badge variant="occupied" dot={true}>
                        Session Live ({Math.ceil(seconds / 60)} min)
                      </Badge>
                    </div>

                    {/* Customer Information & CRM Linking Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-neutral-600" />
                          <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                            Customer Details & CRM Ledger
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          Record customer name & phone or link regular player
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                        {/* Customer Name with Autocomplete */}
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                            Customer Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={customerNameInput}
                              onChange={(e) => {
                                setCustomerNameInput(e.target.value);
                                setShowCustomerSuggestions(true);
                              }}
                              onFocus={() => setShowCustomerSuggestions(true)}
                              placeholder="e.g. Rahul Sharma"
                              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-medium outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                            />
                            {selectedCrmCustomerId && (
                              <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Regular
                              </span>
                            )}
                          </div>

                          {/* Dropdown Suggestions */}
                          {showCustomerSuggestions && topCustomers.length > 0 && (
                            <div className="absolute left-0 right-0 sm:right-auto sm:w-80 mt-1 bg-white border border-neutral-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-neutral-100">
                              <div className="p-2.5 bg-neutral-50 flex items-center justify-between text-[11px] font-bold text-neutral-500">
                                <span>Choose Regular Player</span>
                                <button
                                  type="button"
                                  onClick={() => setShowCustomerSuggestions(false)}
                                  className="text-neutral-400 hover:text-neutral-600 text-xs px-1"
                                >
                                  ✕
                                </button>
                              </div>
                              {filteredCustomers.slice(0, 8).map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setCustomerNameInput(c.name);
                                    setCustomerPhoneInput(c.phone || '');
                                    setSelectedCrmCustomerId(c.id);
                                    setP1Name(c.name);
                                    setP1CustomerId(c.id);
                                    setShowCustomerSuggestions(false);
                                  }}
                                  className="p-3 hover:bg-neutral-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                >
                                  <div>
                                    <span className="font-bold text-neutral-900 block">{c.name}</span>
                                    <span className="text-[11px] text-neutral-500 font-mono">{c.phone || 'No phone'}</span>
                                  </div>
                                  <div className="text-right">
                                    {(c.outstandingDue || 0) > 0 ? (
                                      <span className="text-rose-600 font-bold font-mono text-[11px] block">
                                        Due: {formatCurrency(c.outstandingDue || 0, currencySymbol)}
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 font-semibold font-mono text-[11px] block">
                                        Clear Due
                                      </span>
                                    )}
                                    <span className="text-[9px] uppercase font-bold font-mono text-neutral-500">
                                      {getCustomerNumber(c)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Customer Phone */}
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                            Phone Number (WhatsApp Bill)
                          </label>
                          <input
                            type="tel"
                            value={customerPhoneInput}
                            onChange={(e) => setCustomerPhoneInput(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                          />
                        </div>
                      </div>

                      {/* Active Customer Details Pill */}
                      {selectedCustomerObj && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-950">
                              {selectedCustomerObj.name} ({getCustomerNumber(selectedCustomerObj)})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-600 text-[11px]">
                              Outstanding Due: <strong className={`font-mono ${(selectedCustomerObj.outstandingDue || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{formatCurrency(selectedCustomerObj.outstandingDue || 0, currencySymbol)}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCrmCustomerId(null);
                              }}
                              className="text-neutral-400 hover:text-neutral-700 text-[11px] underline"
                            >
                              Unlink
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing & Duration Metadata Grid */}
                    <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs">
                      <div>
                        <span className="text-neutral-400 block mb-0.5">Session Duration</span>
                        <span className="font-bold text-neutral-900 text-sm font-mono block">
                          {formatTimerString(seconds)}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">({Math.ceil(seconds / 60)} exact min)</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block mb-0.5">Hourly Rate</span>
                        <span className="font-semibold text-neutral-900 text-sm font-mono block">
                          {formatCurrency(session.hourlyRate, currencySymbol)}/hr
                        </span>
                        <span className="text-[10px] text-emerald-600 block uppercase font-bold">
                          {session.rateType}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block mb-0.5">Started At</span>
                        <span className="font-semibold text-neutral-900 text-sm block">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          {new Date(session.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Itemized Charges List */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Itemized Charges</h4>
                      
                      <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100 text-xs bg-white">
                        {/* Table Time Rental */}
                        <div className="p-3.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-neutral-900 block">
                              Table Rental ({currentTable.name})
                            </span>
                            <span className="text-neutral-500 text-[11px]">
                              {Math.ceil(seconds / 60)} minutes @ {formatCurrency(session.hourlyRate, currencySymbol)}/hr
                            </span>
                          </div>
                          <span className="font-mono font-bold text-neutral-900 text-sm">
                            {formatCurrency(computedTotals.tableFee, currencySymbol)}
                          </span>
                        </div>

                        {/* Food & Beverages Orders */}
                        {session.foodOrders && session.foodOrders.length > 0 && session.foodOrders.map((order) => (
                          <div key={order.id} className="p-3.5 flex items-center justify-between">
                            <div>
                              <span className="font-medium text-neutral-800">{order.name}</span>
                              <span className="text-neutral-400 text-[11px] ml-2">
                                x{order.quantity} @ {formatCurrency(order.price, currencySymbol)}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-neutral-800">
                              {formatCurrency(order.price * order.quantity, currencySymbol)}
                            </span>
                          </div>
                        ))}

                        {/* Extra Manual Charges */}
                        {extraCharges.map((charge) => (
                          <div key={charge.id} className="p-3.5 flex items-center justify-between bg-amber-50/50">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-amber-900">{charge.name}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded uppercase">
                                Manual Extra
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-semibold text-neutral-900">
                                {formatCurrency(charge.amount, currencySymbol)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveExtraCharge(charge.id)}
                                className="text-neutral-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Extra Manual Charge Row */}
                      {userRole !== 'worker' && <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row items-center gap-2">
                        <Input
                          placeholder="Extra charge (e.g., Late fee, Cue damage)"
                          value={newExtraName}
                          onChange={(e) => setNewExtraName(e.target.value)}
                          className="text-xs bg-white h-9"
                        />
                        <Input
                          type="number"
                          placeholder={`Amount (${currencySymbol})`}
                          value={newExtraAmount}
                          onChange={(e) => setNewExtraAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="text-xs bg-white w-full sm:w-32 h-9 font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto h-9 text-xs font-semibold shrink-0"
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                          onClick={handleAddExtraCharge}
                        >
                          Add Charge
                        </Button>
                      </div>}
                    </div>

                    {/* Manual Discount Controls */}
                    {userRole !== 'worker' && <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-neutral-700" />
                          <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                            Manual Discount
                          </span>
                        </div>

                        {/* Discount type toggle */}
                        <div className="flex items-center gap-1 bg-neutral-200/80 p-0.5 rounded-xl text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setDiscountType('amount')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              discountType === 'amount'
                                ? 'bg-neutral-900 text-white shadow-xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            {currencySymbol} Flat Off
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('percent')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              discountType === 'percent'
                                ? 'bg-neutral-900 text-white shadow-xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            % Percent Off
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400 font-mono">
                            {discountType === 'amount' ? currencySymbol : '%'}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step={discountType === 'percent' ? '1' : '10'}
                            placeholder="0"
                            value={discountInput || ''}
                            onChange={(e) => setDiscountInput(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full bg-white border border-neutral-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                          />
                        </div>

                        {discountInput > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDiscountInput(0)}
                            className="text-xs text-rose-600 hover:bg-rose-50 h-9"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      {/* Quick Preset Discount Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1">Presets:</span>
                        {discountType === 'amount' ? (
                          [20, 50, 100, 150, 200, 500].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setDiscountInput(val)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                                discountInput === val
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {currencySymbol}{val}
                            </button>
                          ))
                        ) : (
                          [5, 10, 15, 20, 25, 50].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setDiscountInput(val)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                                discountInput === val
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {val}%
                            </button>
                          ))
                        )}
                      </div>

                      {computedTotals.discountAmount > 0 && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold">
                          <span>Total Discount Saved:</span>
                          <span className="font-mono text-sm">
                            -{formatCurrency(computedTotals.discountAmount, currencySymbol)}
                          </span>
                        </div>
                      )}

                      {/* Cashier Discount Warning */}
                      {isCashierDiscountCapped && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>Cashiers are capped at max {config?.maxCashierDiscountPercent || 10}% discount. Owner/Manager authorization required.</span>
                        </div>
                      )}
                    </div>}

                    {/* Billing Summary Calculation */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 text-xs">
                      <div className="flex justify-between text-neutral-600">
                        <span>Subtotal Charges</span>
                        <span className="font-mono font-semibold text-neutral-900">
                          {formatCurrency(computedTotals.subtotal, currencySymbol)}
                        </span>
                      </div>

                      {computedTotals.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount Applied</span>
                          <span className="font-mono">
                            -{formatCurrency(computedTotals.discountAmount, currencySymbol)}
                          </span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline text-lg font-extrabold text-neutral-900">
                        <div>
                          <span>Total Due</span>
                          {config?.roundingRule && config.roundingRule !== 'none' && (
                            <span className="text-[10px] text-neutral-400 font-normal block font-sans">
                              (Rounded to nearest {config.roundingRule.replace('nearest_', '₹')})
                            </span>
                          )}
                        </div>
                        <span className="text-2xl font-mono text-neutral-900">
                          {formatCurrency(computedTotals.grandTotal, currencySymbol)}
                        </span>
                      </div>
                    </div>

                    {/* Notes Field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-neutral-700">Billing Notes / Customer Remarks</label>
                      <input
                        type="text"
                        placeholder="Add custom bill notes (e.g., Partial cash advance paid)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 outline-none focus:border-neutral-900"
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Select Payment Method
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'upi', label: 'UPI / QR', icon: QrCode },
                          { id: 'cash', label: 'Cash', icon: Banknote },
                          { id: 'split', label: 'Split Payment', icon: Split },
                          { id: 'due_ledger', label: 'Pay Later / Credit', icon: ArrowRightLeft },
                        ].map((method) => {
                          const Icon = method.icon;
                          const isSelected = paymentMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setPaymentMethod(method.id as any)}
                              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? method.id === 'due_ledger'
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]'
                                    : 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-[1.02]'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs font-bold">{method.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Split Payment Breakdown Inputs */}
                      {paymentMethod === 'split' && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200 flex flex-col gap-4 mt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200">
                            <div>
                              <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                                Split Payment Configuration
                              </h5>
                              <p className="text-[11px] text-neutral-500">
                                Split between Cash & UPI, or split between two players
                              </p>
                            </div>

                            <div className="flex items-center gap-1 bg-neutral-200/80 p-0.5 rounded-xl text-xs font-bold shrink-0">
                              <button
                                type="button"
                                onClick={() => setSplitMode('method')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                  splitMode === 'method'
                                    ? 'bg-neutral-900 text-white shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                Cash + UPI Split
                              </button>
                              {userRole !== 'worker' && <button
                                type="button"
                                onClick={() => setSplitMode('players')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                  splitMode === 'players'
                                    ? 'bg-neutral-900 text-white shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                Two-Person / Player Split
                              </button>}
                            </div>
                          </div>

                          {splitMode === 'method' ? (
                            /* MODE A: Method Split (Cash + UPI) */
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[11px] text-neutral-700 block font-semibold mb-1">
                                    Cash Amount ({currencySymbol})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={splitCash || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setSplitCash(val);
                                      setSplitUpi(Math.max(0, computedTotals.grandTotal - val));
                                    }}
                                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 outline-none focus:border-neutral-900"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] text-neutral-700 block font-semibold mb-1">
                                    UPI Amount ({currencySymbol})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={splitUpi || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setSplitUpi(val);
                                    }}
                                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 outline-none focus:border-neutral-900"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const half = Math.round(computedTotals.grandTotal / 2);
                                    setSplitCash(half);
                                    setSplitUpi(computedTotals.grandTotal - half);
                                  }}
                                  className="text-xs font-semibold h-8"
                                >
                                  50% Cash / 50% UPI
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSplitCash(computedTotals.grandTotal);
                                    setSplitUpi(0);
                                  }}
                                  className="text-xs font-semibold h-8"
                                >
                                  All Cash
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSplitCash(0);
                                    setSplitUpi(computedTotals.grandTotal);
                                  }}
                                  className="text-xs font-semibold h-8"
                                >
                                  All UPI
                                </Button>
                              </div>

                              {/* Allocation validation bar */}
                              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                                Math.round(splitCash + splitUpi) === Math.round(computedTotals.grandTotal)
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}>
                                <span>Allocated: {formatCurrency(splitCash + splitUpi, currencySymbol)} of {formatCurrency(computedTotals.grandTotal, currencySymbol)}</span>
                                {Math.round(splitCash + splitUpi) === Math.round(computedTotals.grandTotal) ? (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <Check className="w-4 h-4" /> Exactly Matched
                                  </span>
                                ) : (
                                  <span className="text-amber-700">
                                    Difference: {formatCurrency(computedTotals.grandTotal - (splitCash + splitUpi), currencySymbol)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* MODE B: Two-Person / Player Split */
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-neutral-600">
                                  Split bill between 2 players with individual payment methods:
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const half = Math.round(computedTotals.grandTotal / 2);
                                    setP1Amount(half);
                                    setP2Amount(computedTotals.grandTotal - half);
                                  }}
                                  className="text-xs font-semibold h-8 shrink-0"
                                >
                                  50% / 50% Equal Split
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Person 1 Card */}
                                <div className="p-4 bg-white rounded-2xl border border-neutral-200 flex flex-col gap-3 shadow-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-neutral-500" /> Person 1
                                    </span>
                                    <span className="font-mono text-xs font-bold text-neutral-900">
                                      {formatCurrency(p1Amount, currencySymbol)}
                                    </span>
                                  </div>

                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={p1Name}
                                      onChange={(e) => setP1Name(e.target.value)}
                                      placeholder="Person 1 Name"
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Share Amount ({currencySymbol})</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={p1Amount || ''}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setP1Amount(val);
                                        setP2Amount(Math.max(0, computedTotals.grandTotal - val));
                                      }}
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900 outline-none focus:border-neutral-900"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Paying Via</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {[
                                        { id: 'cash', label: 'Cash' },
                                        { id: 'upi', label: 'UPI' },
                                        { id: 'credit', label: 'Credit (Khata)' },
                                      ].map((pm) => (
                                        <button
                                          key={pm.id}
                                          type="button"
                                          onClick={() => setP1Method(pm.id as any)}
                                          className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                                            p1Method === pm.id
                                              ? pm.id === 'credit'
                                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                                : 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                          }`}
                                        >
                                          {pm.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Person 2 Card */}
                                <div className="p-4 bg-white rounded-2xl border border-neutral-200 flex flex-col gap-3 shadow-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-neutral-500" /> Person 2
                                    </span>
                                    <span className="font-mono text-xs font-bold text-neutral-900">
                                      {formatCurrency(p2Amount, currencySymbol)}
                                    </span>
                                  </div>

                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={p2Name}
                                      onChange={(e) => setP2Name(e.target.value)}
                                      placeholder="Person 2 Name"
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Share Amount ({currencySymbol})</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={p2Amount || ''}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setP2Amount(val);
                                      }}
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900 outline-none focus:border-neutral-900"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Paying Via</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {[
                                        { id: 'cash', label: 'Cash' },
                                        { id: 'upi', label: 'UPI' },
                                        { id: 'credit', label: 'Credit (Khata)' },
                                      ].map((pm) => (
                                        <button
                                          key={pm.id}
                                          type="button"
                                          onClick={() => setP2Method(pm.id as any)}
                                          className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                                            p2Method === pm.id
                                              ? pm.id === 'credit'
                                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                                : 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                          }`}
                                        >
                                          {pm.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Validation Bar */}
                              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                                Math.round(p1Amount + p2Amount) === Math.round(computedTotals.grandTotal)
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}>
                                <span>
                                  {p1Name || 'P1'}: {formatCurrency(p1Amount, currencySymbol)} ({p1Method.toUpperCase()}) + {p2Name || 'P2'}: {formatCurrency(p2Amount, currencySymbol)} ({p2Method.toUpperCase()})
                                </span>
                                {Math.round(p1Amount + p2Amount) === Math.round(computedTotals.grandTotal) ? (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <Check className="w-4 h-4" /> Balanced
                                  </span>
                                ) : (
                                  <span className="text-amber-700">
                                    Difference: {formatCurrency(computedTotals.grandTotal - (p1Amount + p2Amount), currencySymbol)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pay Later / Credit (Khata) Explanation Card */}
                      {paymentMethod === 'due_ledger' && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2 mt-1">
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                              Khata / Udhaar Credit Account Checkout
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            This full bill of <strong className="font-mono font-bold">{formatCurrency(computedTotals.grandTotal, currencySymbol)}</strong> will be added to{' '}
                            <strong>{customerNameInput.trim() || 'the customer'}</strong>'s Khata account in Customer CRM.
                          </p>
                          {selectedCustomerObj ? (
                            <div className="mt-1 pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs font-semibold">
                              <span>Current Outstanding Due: {formatCurrency(selectedCustomerObj.outstandingDue || 0, currencySymbol)}</span>
                              <span className="text-amber-950 font-bold font-mono">
                                ➔ New Total Due: {formatCurrency((selectedCustomerObj.outstandingDue || 0) + computedTotals.grandTotal, currencySymbol)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-700">
                              Tip: Make sure customer name and phone are filled above so the ledger balance can be tracked.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Partial Payment Input */}
                      <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-semibold text-neutral-900 block">Record Partial / Custom Amount Paid</span>
                          <span className="text-[11px] text-neutral-500">Leave empty or equal to Grand Total for full settlement</span>
                        </div>
                        <div className="w-full sm:w-36">
                          <input
                            type="number"
                            min="0"
                            placeholder={computedTotals.grandTotal.toFixed(2)}
                            value={customAmountPaid === null ? '' : customAmountPaid}
                            onChange={(e) => setCustomAmountPaid(e.target.value === '' ? null : parseFloat(e.target.value))}
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-right font-mono font-bold outline-none focus:border-neutral-900"
                          />
                        </div>
                      </div>

                      {/* Remaining Balance Indicator */}
                      {customAmountPaid !== null && customAmountPaid < computedTotals.grandTotal && (
                        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 font-bold">
                          <span>Balance Remaining (Due Later):</span>
                          <span className="font-mono text-sm">{formatCurrency(computedTotals.grandTotal - customAmountPaid, currencySymbol)}</span>
                        </div>
                      )}

                      {/* UPI QR Display */}
                      {(paymentMethod === 'upi' || (paymentMethod === 'split' && (splitMode === 'method' ? splitUpi > 0 : (p1Method === 'upi' || p2Method === 'upi')))) && (
                        <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between gap-4 mt-2 shadow-md">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold">
                              {config?.clubName || 'Club'} Instant UPI QR Code
                            </span>
                            <h4 className="text-sm font-bold mt-0.5">{upiName}</h4>
                            <p className="text-xs text-neutral-300 font-mono mt-0.5">{upiId}</p>
                            <p className="text-xs font-semibold text-emerald-400 mt-2 font-mono">
                              Scan Amount: {formatCurrency(
                                paymentMethod === 'upi'
                                  ? computedTotals.grandTotal
                                  : splitMode === 'method'
                                    ? splitUpi
                                    : (p1Method === 'upi' ? p1Amount : 0) + (p2Method === 'upi' ? p2Amount : 0),
                                currencySymbol
                              )}
                            </p>
                          </div>
                          <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                            <div className="w-full h-full bg-neutral-900 rounded-lg p-1.5 flex flex-col justify-between">
                              <div className="flex justify-between">
                                <div className="w-4 h-4 bg-white rounded-xs" />
                                <div className="w-4 h-4 bg-white rounded-xs" />
                              </div>
                              <div className="text-[8px] text-center font-bold text-emerald-400 font-mono">UPI SCAN</div>
                              <div className="flex justify-between">
                                <div className="w-4 h-4 bg-white rounded-xs" />
                                <div className="w-4 h-4 bg-white rounded-xs" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Final Action Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                      <Button
                        variant="primary"
                        size="lg"
                        disabled={isSubmitting || isCashierDiscountCapped}
                        className="w-full sm:w-auto text-sm py-3 px-6 shadow-lg"
                        leftIcon={<CheckCircle2 className="w-5 h-5" />}
                        onClick={handleCheckout}
                      >
                        {isSubmitting ? 'Processing Settlement...' : `Mark Paid & Checkout Table #${currentTable.number}`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENTS & LEDGER HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="flex flex-col gap-6">
          {/* Revenue Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border border-neutral-200">
              <span className="text-xs text-neutral-500 block">Total Revenue Collected</span>
              <h3 className="text-2xl font-extrabold text-neutral-900 font-mono mt-1">
                {formatCurrency(todayRevenue, currencySymbol)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">From {history.length} completed transactions</p>
            </Card>

            <Card className="p-5 bg-white border border-neutral-200">
              <span className="text-xs text-neutral-500 block">Pending Outstanding Balance</span>
              <h3 className="text-2xl font-extrabold text-amber-600 font-mono mt-1">
                {formatCurrency(pendingBalanceTotal, currencySymbol)}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">Unpaid balance on partial bills</p>
            </Card>

            <Card className="p-5 bg-white border border-neutral-200">
              <span className="text-xs text-neutral-500 block">Total Refunded Value</span>
              <h3 className="text-2xl font-extrabold text-rose-600 font-mono mt-1">
                {formatCurrency(refundedTotal, currencySymbol)}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">Total value of refunded transactions</p>
            </Card>
          </div>

          {/* Search, Filter & CSV Export Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search customer, phone, receipt #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-neutral-900"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 outline-none focus:border-neutral-900 font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid (Completed)</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>

              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 outline-none focus:border-neutral-900 font-medium"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="split">Split</option>
                <option value="due_ledger">Credit / Khata</option>
                <option value="card">Card (Legacy)</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={handleExportCSV}
            >
              Export CSV Ledger
            </Button>
          </div>

          {/* Ledger History Table */}
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Receipt #</th>
                    <th className="p-4">Customer & Phone</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Paid</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-neutral-400">
                        No transactions found matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-neutral-900">{item.receiptNo}</td>
                        <td className="p-4">
                          <span className="font-semibold text-neutral-900 block">{item.customerName}</span>
                          {item.customerPhone && (
                            <span className="text-[11px] text-neutral-400 font-mono block">{item.customerPhone}</span>
                          )}
                        </td>
                        <td className="p-4 font-medium text-neutral-800">{item.tableName}</td>
                        <td className="p-4 font-mono text-neutral-600">{formatTimerString(item.durationSeconds)}</td>
                        <td className="p-4 font-mono font-bold text-neutral-900">
                          {formatCurrency(item.grandTotal, currencySymbol)}
                        </td>
                        <td className="p-4 font-mono font-semibold text-emerald-600">
                          {formatCurrency(item.amountPaid ?? item.grandTotal, currencySymbol)}
                        </td>
                        <td className="p-4 font-mono text-neutral-500">
                          {(item.balanceDue || 0) > 0 ? (
                            <span className="text-rose-600 font-bold">{formatCurrency(item.balanceDue, currencySymbol)}</span>
                          ) : (
                            '₹0'
                          )}
                        </td>
                        <td className="p-4 uppercase font-bold text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800">
                            {item.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                            item.paymentStatus === 'refunded'
                              ? 'bg-rose-100 text-rose-800'
                              : item.paymentStatus === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onShowReceipt(item)}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg transition-colors"
                            >
                              Receipt
                            </button>
                            {(userRole === 'owner' || userRole === 'manager') && item.paymentStatus !== 'refunded' && onRefund && (
                              <button
                                type="button"
                                onClick={() => setRefundModalItem(item)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg transition-colors"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT TRAIL LOG */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col gap-4 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-neutral-900">{config?.clubName || 'Club'} Security & Operational Audit Log</h3>
            <p className="text-xs text-neutral-500">Immutable security trail for sessions, discounts, refunds & setting changes</p>
          </div>

          <div className="overflow-x-auto border border-neutral-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action Code</th>
                  <th className="p-3.5">Performed By</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-neutral-400">
                      No security audit events recorded yet
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="p-3.5 font-mono text-neutral-500">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-neutral-900">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-neutral-800">{log.performedBy}</td>
                      <td className="p-3.5 text-neutral-600">{log.details || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      <Modal
        isOpen={Boolean(refundModalItem)}
        onClose={() => setRefundModalItem(null)}
        title="Issue Payment Refund"
        subtitle={refundModalItem ? `Receipt #${refundModalItem.receiptNo} • ${refundModalItem.customerName}` : ''}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 pt-2">
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
            <strong>Warning:</strong> Refunding a completed payment will mark the receipt as refunded in the ledger and record an audit security log.
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-800">Reason for Refund *</label>
            <textarea
              rows={3}
              placeholder="Provide reason (e.g., Table issue, Overcharged, Customer left early)..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs outline-none focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRefundModalItem(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!refundReason.trim() || isRefunding}
              onClick={handleConfirmRefund}
            >
              {isRefunding ? 'Processing Refund...' : 'Confirm Refund'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* TAB 4: EOD REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'eod' && (() => {
        const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const todayKey = new Date().toISOString().split('T')[0];
        const todaysRecords = history.filter((h) => {
          try {
            const d = new Date(h.startTime || Date.now()).toISOString().split('T')[0];
            return d === todayKey;
          } catch { return false; }
        });

        const paidRecords = todaysRecords.filter((h) => h.paymentStatus !== 'refunded');
        const totalCash = paidRecords.filter(h => h.paymentMethod === 'cash').reduce((s, h) => s + (h.amountPaid || h.grandTotal), 0);
        const totalUpi = paidRecords.filter(h => h.paymentMethod === 'upi').reduce((s, h) => s + (h.amountPaid || h.grandTotal), 0);
        const totalCard = paidRecords.filter(h => h.paymentMethod === 'card').reduce((s, h) => s + (h.amountPaid || h.grandTotal), 0);
        const totalDues = paidRecords.filter(h => h.paymentMethod === 'due_ledger' || h.paymentStatus === 'due_ledger').reduce((s, h) => s + h.grandTotal, 0);
        const totalTableRevenue = paidRecords.reduce((s, h) => s + h.tableFee, 0);
        const totalFoodRevenue = paidRecords.reduce((s, h) => s + (h.foodFee || 0), 0);
        const totalDiscounts = paidRecords.reduce((s, h) => s + (h.discountAmount || 0), 0);
        const totalTax = paidRecords.reduce((s, h) => s + (h.taxAmount || 0), 0);
        const grandCollected = totalCash + totalUpi + totalCard;
        const totalRefunds = todaysRecords.filter(h => h.paymentStatus === 'refunded').reduce((s, h) => s + h.grandTotal, 0);

        const handleExportEOD = () => {
          const rows: (string | number)[][] = [
            ['END-OF-DAY REPORT', config?.clubName || 'One Shot Snooker'],
            ['Report Date:', todayStr],
            ['Generated At:', new Date().toLocaleTimeString()],
            ['Generated By:', user?.displayName || user?.email || 'Staff'],
            [''],
            ['PAYMENT METHOD BREAKDOWN'],
            ['Cash Collected:', `Rs.${totalCash.toFixed(2)}`],
            ['UPI Collected:', `Rs.${totalUpi.toFixed(2)}`],
            ['Card Collected:', `Rs.${totalCard.toFixed(2)}`],
            ['Total Collected:', `Rs.${grandCollected.toFixed(2)}`],
            ['Credit Dues:', `Rs.${totalDues.toFixed(2)}`],
            [''],
            ['REVENUE BREAKDOWN'],
            ['Table Revenue:', `Rs.${totalTableRevenue.toFixed(2)}`],
            ['Food & Beverage Revenue:', `Rs.${totalFoodRevenue.toFixed(2)}`],
            ['Total Discounts Given:', `-Rs.${totalDiscounts.toFixed(2)}`],
            ['Total Tax Collected:', `Rs.${totalTax.toFixed(2)}`],
            ['Total Refunds:', `-Rs.${totalRefunds.toFixed(2)}`],
            [''],
            ['SESSIONS SUMMARY'],
            ['Total Bills:', paidRecords.length.toString()],
            ['Refunded Bills:', todaysRecords.filter(h => h.paymentStatus === 'refunded').length.toString()],
            [''],
            ['DETAILED TRANSACTIONS'],
            ['Receipt No', 'Time', 'Customer', 'Table', 'Duration(min)', 'Table Fee', 'Food Fee', 'Discount', 'Tax', 'Grand Total', 'Paid', 'Method', 'Status'],
            ...todaysRecords.map(h => [
              h.receiptNo, h.timestamp, h.customerName, h.tableName,
              Math.ceil(h.durationSeconds / 60),
              h.tableFee.toFixed(2), (h.foodFee || 0).toFixed(2),
              (h.discountAmount || 0).toFixed(2), (h.taxAmount || 0).toFixed(2),
              h.grandTotal.toFixed(2), (h.amountPaid ?? h.grandTotal).toFixed(2),
              h.paymentMethod.toUpperCase(), h.paymentStatus.toUpperCase()
            ])
          ];
          const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
          const link = document.createElement('a');
          link.setAttribute('href', encodeURI(csvContent));
          link.setAttribute('download', `OneShot_EOD_Report_${todayKey}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="space-y-5">
            {/* EOD Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-neutral-900 text-white">
              <div>
                <h3 className="text-lg font-extrabold">End-of-Day Sales Report</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{todayStr} • {paidRecords.length} transactions settled today</p>
              </div>
              <button
                onClick={handleExportEOD}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel / CSV
              </button>
            </div>

            {/* Payment Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Cash', amount: totalCash, color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                { label: 'UPI / QR', amount: totalUpi, color: 'bg-blue-50 border-blue-200 text-blue-900' },
                { label: 'Split Payments', amount: todaysRecords.filter(h => h.paymentMethod === 'split').reduce((s, h) => s + (h.amountPaid ?? h.grandTotal), 0), color: 'bg-purple-50 border-purple-200 text-purple-900' },
                { label: 'Credit Dues (Khata)', amount: totalDues, color: 'bg-amber-50 border-amber-200 text-amber-900' },
              ].map((m) => (
                <div key={m.label} className={`p-4 rounded-2xl border ${m.color}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">{m.label}</span>
                  <span className="text-lg font-black font-mono block mt-1">₹{m.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Revenue & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-white border border-neutral-200 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Revenue Breakdown</h4>
                {[
                  { label: 'Table Hire', val: totalTableRevenue, neg: false },
                  { label: 'Food & Beverages', val: totalFoodRevenue, neg: false },
                  { label: 'Discounts Given', val: totalDiscounts, neg: true },
                  { label: 'Tax Collected', val: totalTax, neg: false },
                  { label: 'Refunds', val: totalRefunds, neg: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-neutral-600">{row.label}</span>
                    <span className={`font-mono font-bold ${row.neg ? 'text-rose-600' : 'text-neutral-900'}`}>
                      {row.neg ? '-' : ''}₹{row.val.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-neutral-200 pt-3 flex justify-between text-sm font-black">
                  <span>Total Collected</span>
                  <span className="font-mono text-emerald-600">₹{grandCollected.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-5 bg-white border border-neutral-200 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Sessions Summary</h4>
                {[
                  { label: 'Total Bills Settled', val: `${paidRecords.length}` },
                  { label: 'Refunded Bills', val: `${todaysRecords.filter(h => h.paymentStatus === 'refunded').length}` },
                  { label: 'Credit Due Bills', val: `${paidRecords.filter(h => h.paymentStatus === 'due_ledger').length}` },
                  { label: 'Avg. Bill Value', val: paidRecords.length > 0 ? `₹${Math.round(grandCollected / paidRecords.length)}` : '₹0' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-neutral-600">{row.label}</span>
                    <span className="font-mono font-bold text-neutral-900">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {todaysRecords.length === 0 && (
              <div className="text-center py-12 text-neutral-400 text-sm">
                No transactions recorded today yet. Bills settled will appear here.
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
};
