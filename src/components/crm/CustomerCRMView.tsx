import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Calendar, 
  Award, 
  Clock, 
  DollarSign, 
  Download, 
  Edit, 
  Trash2, 
  Star,
  FileText,
  AlertTriangle,
  Send,
  CheckCircle2,
  X,
  CreditCard,
  PlusCircle,
  ShieldAlert,
  Wallet,
  Eye,
  MessageCircle,
  Copy,
  Share2,
  ArrowUpDown,
  BadgePercent,
  BookOpen
} from 'lucide-react';
import { TopCustomer, BusinessConfig, UdhaarTransaction, SessionHistoryItem } from '../../types';

// WhatsApp phone normalizer: ensures country code '91' for 10-digit Indian numbers & strips symbols
const normalizeWhatsAppPhone = (phone: string): string => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

// Formats branded WhatsApp message templates
const getWhatsAppReminderText = (
  cust: TopCustomer,
  clubName: string = 'One Shot Snooker Gaming Club',
  currencySymbol: string = '₹',
  upiId?: string,
  tone: 'gentle' | 'standard' | 'urgent' = 'standard'
): string => {
  const due = (cust.outstandingDue || 0).toFixed(0);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const cName = clubName || 'One Shot Snooker Gaming Club';

  if (tone === 'gentle') {
    return `🎱 *${cName}*\n\n` +
      `Hello ${cust.name}! Hope you had a great session at the club. 🎱\n\n` +
      `This is a gentle update regarding your outstanding credit tab of *${currencySymbol}${due}* as of ${dateStr}.\n\n` +
      (upiId ? `📲 *UPI Payment ID:* \`${upiId}\`\n\n` : '') +
      `Whenever you visit next or find time, you can clear it. We look forward to having you back on the tables!`;
  }

  if (tone === 'urgent') {
    return `⚠️ *PAYMENT NOTICE: ${cName}*\n\n` +
      `Dear ${cust.name},\n` +
      `Your credit tab has reached *${currencySymbol}${due}* (as of ${dateStr}) and is currently overdue.\n\n` +
      `Please clear the pending amount today to maintain your active player credit line and avoid session booking restrictions.\n\n` +
      (upiId ? `📲 *Pay via UPI:* \`${upiId}\`\n\n` : '') +
      `If already settled, kindly share the payment screenshot. Thank you!`;
  }

  // standard
  return `🎱 *${cName} — Pending Payment Reminder*\n\n` +
    `Hello ${cust.name},\n` +
    `You have an outstanding credit balance of *${currencySymbol}${due}* as of ${dateStr}.\n\n` +
    `Kindly clear this at your earliest convenience.\n\n` +
    (upiId ? `📲 *UPI ID for Payment:* \`${upiId}\`\n\n` : '') +
    `Thank you for playing with us!\n` +
    `— Team ${cName}`;
};

// Formats detailed Member Account Statement for 1-click WhatsApp sharing
const getCustomerStatementText = (
  cust: TopCustomer,
  clubName: string = 'One Shot Snooker Gaming Club',
  currencySymbol: string = '₹',
  upiId?: string
): string => {
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const dues = (cust.outstandingDue || 0).toFixed(0);
  const wallet = (cust.walletBalance || 0).toFixed(0);
  const spent = (cust.totalSpent || 0).toFixed(0);
  const sessions = cust.sessionsCount || 0;
  const hours = (cust.totalHoursPlayed || 0).toFixed(1);
  const cName = clubName || 'One Shot Snooker Gaming Club';

  let text = `🎱 *${cName} — Customer Account Statement*\n` +
    `👤 *Player:* ${cust.name} (${cust.phone})\n` +
    `🪪 *Customer ID:* ${getCustomerNumber(cust)}\n` +
    `📅 *Statement Date:* ${dateStr}\n\n` +
    `📊 *Activity Summary:*\n` +
    `• Total Sessions: ${sessions}\n` +
    `• Gaming Time: ${hours} hours\n` +
    `• Lifetime Spend: ${currencySymbol}${spent}\n` +
    `• Advance / Wallet Balance: ${currencySymbol}${wallet}\n` +
    `• Current Credit Due: *${currencySymbol}${dues}*\n\n`;

  const recentTx = (cust.udhaarLedger || []).slice(0, 3);
  if (recentTx.length > 0) {
    text += `📜 *Recent Account Transactions:*\n`;
    recentTx.forEach((tx) => {
      const d = new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const sign = tx.type === 'payment_received' || tx.type === 'deposit_added' ? '✓' : '+';
      text += `• ${d}: ${sign} ${currencySymbol}${tx.amount} (${tx.description})\n`;
    });
    text += `\n`;
  }

  if (Number(dues) > 0) {
    text += `⚠️ *Outstanding Balance to Clear:* ${currencySymbol}${dues}\n`;
    if (upiId) text += `📲 *Pay via UPI:* \`${upiId}\`\n\n`;
  } else {
    text += `🟢 *All account dues are cleared!*\n\n`;
  }

  text += `Thank you for choosing ${cName}! 🎱`;
  return text;
};
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { exportCreditLedgerToExcel } from '../../utils/excelExport';
import { useAuth } from '../../context/AuthContext';
import { createCustomerIdentity, getCustomerNumber } from '../../utils/customerIdentity';

interface CustomerCRMViewProps {
  customers: TopCustomer[];
  history?: SessionHistoryItem[];
  config: BusinessConfig;
  onSaveCustomer: (customer: TopCustomer) => Promise<void>;
  onRecordAccountTransaction: (customerId: string, transaction: UdhaarTransaction) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
}

export const CustomerCRMView: React.FC<CustomerCRMViewProps> = ({
  customers,
  history = [],
  config,
  onSaveCustomer,
  onRecordAccountTransaction,
  onDeleteCustomer,
}) => {
  const { user } = useAuth();
  const canManageAccountBalances = user?.role === 'owner' || user?.role === 'manager';

  const [searchTerm, setSearchTerm] = useState('');
  const [creditFilter, setCreditFilter] = useState<string>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<TopCustomer> | null>(null);
  const [viewingLedgerCustomer, setViewingLedgerCustomer] = useState<TopCustomer | null>(null);
  const [viewingProfileCustomer, setViewingProfileCustomer] = useState<TopCustomer | null>(null);

  // Settlement Modal State
  const [settlingCustomer, setSettlingCustomer] = useState<TopCustomer | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'cash' | 'upi'>('upi');
  const [settleNotes, setSettleNotes] = useState<string>('');

  // Add Manual Credit Charge Modal State
  const [addingCreditCustomer, setAddingCreditCustomer] = useState<TopCustomer | null>(null);
  const [creditChargeAmount, setCreditChargeAmount] = useState<string>('');
  const [creditChargeReason, setCreditChargeReason] = useState<string>('');

  // Delete Customer State
  const [deletingCustomer, setDeletingCustomer] = useState<TopCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Advance Deposit Modal State
  const [depositingCustomer, setDepositingCustomer] = useState<TopCustomer | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositMethod, setDepositMethod] = useState<'cash' | 'upi'>('upi');
  const [depositNotes, setDepositNotes] = useState<string>('');

  // Sorting
  const [sortBy, setSortBy] = useState<'dues' | 'spent' | 'sessions' | 'recent' | 'name'>('dues');

  // WhatsApp Reminder State
  const [whatsAppCustomer, setWhatsAppCustomer] = useState<TopCustomer | null>(null);
  const [whatsAppTone, setWhatsAppTone] = useState<'gentle' | 'standard' | 'urgent'>('standard');
  const [whatsAppMessage, setWhatsAppMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const handleOpenWhatsAppModal = (cust: TopCustomer, tone: 'gentle' | 'standard' | 'urgent' = 'standard') => {
    setWhatsAppCustomer(cust);
    setWhatsAppTone(tone);
    setWhatsAppMessage(getWhatsAppReminderText(cust, config.clubName, config.currencySymbol, config.upiId, tone));
    setIsCopied(false);
  };

  const handleShareStatement = (cust: TopCustomer) => {
    const text = getCustomerStatementText(cust, config.clubName, config.currencySymbol, config.upiId);
    const phone = normalizeWhatsAppPhone(cust.phone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleToneChange = (tone: 'gentle' | 'standard' | 'urgent') => {
    if (!whatsAppCustomer) return;
    setWhatsAppTone(tone);
    setWhatsAppMessage(getWhatsAppReminderText(whatsAppCustomer, config.clubName, config.currencySymbol, config.upiId, tone));
  };

  const handleSendWhatsApp = () => {
    if (!whatsAppCustomer) return;
    const phone = normalizeWhatsAppPhone(whatsAppCustomer.phone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsAppMessage = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const [isSaving, setIsSaving] = useState(false);

  // Default credit limit if unassigned
  const DEFAULT_CREDIT_LIMIT = config?.maxCreditLimit || 2000;

  // Filter Logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase());

    const dueAmt = c.outstandingDue || 0;
    const limit = c.creditLimit || DEFAULT_CREDIT_LIMIT;

    const matchesCredit = 
      creditFilter === 'all' ||
      (creditFilter === 'has_dues' && dueAmt > 0) ||
      (creditFilter === 'high_risk' && (dueAmt >= limit || dueAmt >= 1500)) ||
      (creditFilter === 'cleared' && dueAmt === 0);

    return matchesSearch && matchesCredit;
  });

  // Sort Logic
  const sortedAndFilteredCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'dues') {
      return (b.outstandingDue || 0) - (a.outstandingDue || 0);
    }
    if (sortBy === 'spent') {
      return (b.totalSpent || 0) - (a.totalSpent || 0);
    }
    if (sortBy === 'sessions') {
      return (b.sessionsCount || 0) - (a.sessionsCount || 0);
    }
    if (sortBy === 'recent') {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    }
    return a.name.localeCompare(b.name);
  });

  const totalDuesAcrossClub = customers.reduce((acc, c) => acc + (c.outstandingDue || 0), 0);
  const totalAdvanceDeposits = customers.reduce((acc, c) => acc + (c.walletBalance || 0), 0);
  const customersWithDuesCount = customers.filter((c) => (c.outstandingDue || 0) > 0).length;
  const highRiskCustomersCount = customers.filter((c) => (c.outstandingDue || 0) >= (c.creditLimit || DEFAULT_CREDIT_LIMIT)).length;

  const handleOpenAddModal = () => {
    const identity = createCustomerIdentity();
    setEditingCustomer({
      ...identity,
      name: '',
      phone: '',
      email: '',
      sessionsCount: 0,
      totalSpent: 0,
      totalHoursPlayed: 0,
      dateJoined: new Date().toISOString().split('T')[0],
      lastVisit: '',
      creditLimit: DEFAULT_CREDIT_LIMIT,
      outstandingDue: 0,
      walletBalance: 0,
      customDiscountPercent: 0,
      preferredGame: 'Snooker',
      notes: ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (cust: TopCustomer) => {
    setEditingCustomer({ ...cust });
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.phone) return;

    try {
      setIsSaving(true);
      await onSaveCustomer({
        ...editingCustomer,
        customerNumber: editingCustomer.customerNumber || getCustomerNumber(editingCustomer as TopCustomer),
      } as TopCustomer);
      setIsEditModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      alert('Failed to save customer record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    try {
      setIsDeleting(true);
      await onDeleteCustomer(deletingCustomer.id);
      setDeletingCustomer(null);
    } catch (err) {
      alert('Failed to delete customer profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Settlement
  const handleConfirmSettlement = async () => {
    if (!settlingCustomer || !settleAmount || Number(settleAmount) <= 0) return;
    const paid = Number(settleAmount);
    const currentDue = settlingCustomer.outstandingDue || 0;
    if (paid > currentDue) {
      alert('Settlement cannot exceed the current outstanding balance.');
      return;
    }

    const newTx: UdhaarTransaction = {
      id: `tx_${crypto.randomUUID()}`,
      timestamp: Date.now(),
      type: 'payment_received',
      amount: paid,
      description: settleNotes.trim() || `Settled Credit Payment (${settleMethod.toUpperCase()})`,
      paymentMethod: settleMethod,
      source: 'balance_settlement',
      recordedBy: user?.displayName || user?.email || 'Staff'
    };

    try {
      setIsSaving(true);
      await onRecordAccountTransaction(settlingCustomer.id, newTx);
      setSettlingCustomer(null);
      setSettleAmount('');
      setSettleNotes('');
    } catch (err) {
      alert('Failed to record settlement.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Manual Credit Charge
  const handleConfirmAddCredit = async () => {
    if (!addingCreditCustomer || !creditChargeAmount || Number(creditChargeAmount) <= 0) return;
    const charge = Number(creditChargeAmount);

    const newTx: UdhaarTransaction = {
      id: `tx_${crypto.randomUUID()}`,
      timestamp: Date.now(),
      type: 'due_added',
      amount: charge,
      description: creditChargeReason.trim() || 'Manual Credit Charge Added',
      source: 'manual_due',
      recordedBy: user?.displayName || user?.email || 'Staff'
    };

    try {
      setIsSaving(true);
      await onRecordAccountTransaction(addingCreditCustomer.id, newTx);
      setAddingCreditCustomer(null);
      setCreditChargeAmount('');
      setCreditChargeReason('');
    } catch (err) {
      alert('Failed to add credit charge.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Advance Deposit
  const handleConfirmAddDeposit = async () => {
    if (!depositingCustomer || !depositAmount || Number(depositAmount) <= 0) return;
    const added = Number(depositAmount);

    const newTx: UdhaarTransaction = {
      id: `tx_${crypto.randomUUID()}`,
      timestamp: Date.now(),
      type: 'deposit_added',
      amount: added,
      description: depositNotes.trim() || `Advance Deposit Added (${depositMethod.toUpperCase()})`,
      paymentMethod: depositMethod,
      source: 'deposit',
      recordedBy: user?.displayName || user?.email || 'Staff'
    };

    try {
      setIsSaving(true);
      await onRecordAccountTransaction(depositingCustomer.id, newTx);
      setDepositingCustomer(null);
      setDepositAmount('');
      setDepositNotes('');
    } catch (err) {
      alert('Failed to record advance deposit.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportCSV = () => {
    exportCreditLedgerToExcel(customers, config.clubName);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full pb-28 lg:pb-8">

      {/* ===== CUSTOMER PROFILE DRAWER ===== */}
      {viewingProfileCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col overflow-hidden shadow-2xl">
            {/* Drawer Header */}
            <div className="bg-neutral-900 text-white p-5 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center font-extrabold text-xl text-white shrink-0">
                  {viewingProfileCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold">{viewingProfileCustomer.name}</h3>
                  <p className="text-xs text-neutral-300">{viewingProfileCustomer.phone}</p>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-neutral-700 text-amber-300">
                      {getCustomerNumber(viewingProfileCustomer)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingProfileCustomer(null)} className="p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Lifetime Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-center">
                  <div className="text-xl font-black text-neutral-900">{viewingProfileCustomer.sessionsCount || 0}</div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">Total Sessions</div>
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-center">
                  <div className="text-xl font-black text-neutral-900">{viewingProfileCustomer.totalHoursPlayed?.toFixed(1) || '0'}h</div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">Hours Played</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <div className="text-xl font-black text-emerald-700">{formatCurrency(viewingProfileCustomer.totalSpent || 0, config.currencySymbol)}</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Lifetime Spent</div>
                </div>
                <div className={`p-3 rounded-2xl border text-center ${
                  (viewingProfileCustomer.walletBalance || 0) > 0 ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <div className={`text-xl font-black ${ (viewingProfileCustomer.walletBalance || 0) > 0 ? 'text-blue-700' : 'text-neutral-400' }`}>
                    {formatCurrency(viewingProfileCustomer.walletBalance || 0, config.currencySymbol)}
                  </div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">Advance Vault</div>
                </div>
                <div className={`col-span-2 p-3 rounded-2xl border flex items-center justify-between px-5 ${
                  (viewingProfileCustomer.outstandingDue || 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'
                }`}>
                  <span className="text-xs font-bold text-neutral-700">Outstanding Credit Due</span>
                  <span className={`text-xl font-black font-mono ${ (viewingProfileCustomer.outstandingDue || 0) > 0 ? 'text-rose-700' : 'text-emerald-700' }`}>
                    {formatCurrency(viewingProfileCustomer.outstandingDue || 0, config.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Credit Usage Progress Bar */}
              {(viewingProfileCustomer.creditLimit || 0) > 0 && (
                <div className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-neutral-700">Credit Limit Usage</span>
                    <span className={`${ ((viewingProfileCustomer.outstandingDue || 0) / (viewingProfileCustomer.creditLimit || 1)) > 0.8 ? 'text-rose-600' : 'text-neutral-500' }`}>
                      {formatCurrency(viewingProfileCustomer.outstandingDue || 0, config.currencySymbol)} / {formatCurrency(viewingProfileCustomer.creditLimit || 0, config.currencySymbol)}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ((viewingProfileCustomer.outstandingDue || 0) / (viewingProfileCustomer.creditLimit || 1)) > 0.8 ? 'bg-rose-500'
                        : ((viewingProfileCustomer.outstandingDue || 0) / (viewingProfileCustomer.creditLimit || 1)) > 0.5 ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ((viewingProfileCustomer.outstandingDue || 0) / (viewingProfileCustomer.creditLimit || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-2 text-xs">
                <h4 className="font-extrabold text-neutral-800 uppercase tracking-wider text-[10px]">Player Profile Details</h4>
                <div className="flex justify-between"><span className="text-neutral-500">Phone Number</span><span className="font-semibold text-neutral-900 font-mono">{viewingProfileCustomer.phone}</span></div>
                {viewingProfileCustomer.email && (
                  <div className="flex justify-between"><span className="text-neutral-500">Email Address</span><span className="font-semibold text-neutral-900">{viewingProfileCustomer.email}</span></div>
                )}
                <div className="flex justify-between"><span className="text-neutral-500">Preferred Game</span><span className="font-semibold text-neutral-900">{viewingProfileCustomer.preferredGame || 'Snooker'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Customer Since</span><span className="font-semibold text-neutral-900">{viewingProfileCustomer.dateJoined || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Last Visit</span><span className="font-semibold text-neutral-900">{viewingProfileCustomer.lastVisit || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Credit Risk Limit</span><span className="font-semibold text-neutral-900">{formatCurrency(viewingProfileCustomer.creditLimit || DEFAULT_CREDIT_LIMIT, config.currencySymbol)}</span></div>
                {viewingProfileCustomer.notes && (
                  <div className="pt-2 border-t border-neutral-100">
                    <span className="text-neutral-500 block mb-1">Player Notes</span>
                    <p className="text-neutral-800 font-medium leading-relaxed">{viewingProfileCustomer.notes}</p>
                  </div>
                )}
              </div>

              {/* Linked club visits. Legacy records are not guessed by name or phone. */}
              <div className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-neutral-800 uppercase tracking-wider text-[10px]">Recent Club Activity</h4>
                {history.filter((item) => item.customerId === viewingProfileCustomer.id).slice(0, 10).length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3">No linked visits yet. Link this customer when preparing their next bill.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.filter((item) => item.customerId === viewingProfileCustomer.id).slice(0, 10).map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-neutral-900">{item.tableName}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">
                              {new Date(item.endTime || item.startTime).toLocaleString('en-IN')}
                              {' · '}{Math.max(0, Math.round((item.durationSeconds || 0) / 60))} min
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-1">Receipt {item.receiptNo} · {item.paymentMethod.toUpperCase()}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-extrabold text-neutral-900">{formatCurrency(item.grandTotal, config.currencySymbol)}</p>
                            <p className={item.balanceDue > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                              {item.balanceDue > 0 ? `Due ${formatCurrency(item.balanceDue, config.currencySymbol)}` : 'Paid'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Credit & Deposit Ledger History */}
              <div className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-neutral-800 uppercase tracking-wider text-[10px]">Financial Ledger Audit ({(viewingProfileCustomer.udhaarLedger || []).length} transactions)</h4>
                {(viewingProfileCustomer.udhaarLedger || []).length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3">No credit or deposit transactions recorded yet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(viewingProfileCustomer.udhaarLedger || []).map((tx) => {
                      const isCreditAdd = tx.type === 'due_added';
                      const isDeposit = tx.type === 'deposit_added';
                      const isPaid = tx.type === 'payment_received';
                      return (
                        <div key={tx.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                          isPaid ? 'bg-emerald-50 border-emerald-100'
                          : isDeposit ? 'bg-blue-50 border-blue-100'
                          : isCreditAdd ? 'bg-rose-50 border-rose-100'
                          : 'bg-amber-50 border-amber-100'
                        }`}>
                          <div>
                            <span className={`font-bold ${
                              isPaid ? 'text-emerald-700'
                              : isDeposit ? 'text-blue-700'
                              : isCreditAdd ? 'text-rose-700'
                              : 'text-amber-700'
                            }`}>
                              {isPaid ? '✓ Paid / Settle'
                              : isDeposit ? '💎 Advance Deposited'
                              : isCreditAdd ? '+ Due Added'
                              : tx.type === 'due_reversed' ? '− Due Reversed' : '⚡ Tab Deducted'}
                            </span>
                            <p className="text-[10px] text-neutral-500 mt-0.5">{tx.description}</p>
                            <p className="text-[9px] text-neutral-400">{new Date(tx.timestamp).toLocaleString('en-IN')}</p>
                          </div>
                          <span className={`font-extrabold text-sm ${
                            isPaid ? 'text-emerald-700'
                            : isDeposit ? 'text-blue-700'
                            : isCreditAdd ? 'text-rose-700'
                            : 'text-amber-700'
                          }`}>
                            {isPaid || tx.type === 'deposit_used' || tx.type === 'due_reversed' ? '-' : '+'}{formatCurrency(tx.amount, config.currencySymbol)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex flex-col gap-2 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => { setSettlingCustomer(viewingProfileCustomer); setViewingProfileCustomer(null); }}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Wallet className="w-3.5 h-3.5" /> Settle
                </button>
                <button
                  onClick={() => {
                    setDepositingCustomer(viewingProfileCustomer);
                    setDepositAmount('1000');
                    setViewingProfileCustomer(null);
                  }}
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> + Deposit
                </button>
                <button
                  onClick={() => handleShareStatement(viewingProfileCustomer)}
                  className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  title="Send full account statement via WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Statement
                </button>
                <button
                  onClick={() => { handleOpenEditModal(viewingProfileCustomer); setViewingProfileCustomer(null); }}
                  className="py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    <div className="flex flex-col gap-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">Customer CRM & Credit Ledger</h2>
            <Badge variant="amber" size="sm">AUDIT TRAIL</Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Track customer gaming profiles, manage credit vault balances, risk thresholds, and audit trails
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={exportCSV}
            leftIcon={<Download className="w-4 h-4" />}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Export
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-4 flex items-center gap-3 bg-rose-50/50 border-rose-200">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">Outstanding Credit</span>
            <div className="text-xl font-black text-rose-900 font-mono">
              {formatCurrency(totalDuesAcrossClub, config.currencySymbol)}
            </div>
            <span className="text-[10px] font-semibold text-rose-700">{customersWithDuesCount} players due</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 bg-blue-50/50 border-blue-200">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">Advance Vault Held</span>
            <div className="text-xl font-black text-blue-900 font-mono">
              {formatCurrency(totalAdvanceDeposits, config.currencySymbol)}
            </div>
            <span className="text-[10px] font-semibold text-blue-700">Prepaid balances</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">High Risk / Over Limit</span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {highRiskCustomersCount}
            </div>
            <span className="text-[10px] font-semibold text-amber-700">Exceed limit</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Total Active Players</span>
            <div className="text-xl font-black text-neutral-900 font-mono">{customers.length}</div>
            <span className="text-[10px] font-semibold text-emerald-700">Saved profiles</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Total Gaming Time</span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {customers.reduce((acc, c) => acc + (c.totalHoursPlayed || c.sessionsCount * 1.5 || 0), 0).toFixed(0)} hrs
            </div>
            <span className="text-[10px] font-semibold text-neutral-500">All sessions</span>
          </div>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search player name, phone, email..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-0.5 flex-wrap sm:flex-nowrap">
            {[
              { id: 'all', label: `All (${customers.length})` },
              { id: 'has_dues', label: `🔴 Dues (${customersWithDuesCount})` },
              { id: 'high_risk', label: `⚠️ Over Limit (${highRiskCustomersCount})` },
              { id: 'cleared', label: `🟢 Cleared (${customers.filter(c => (c.outstandingDue || 0) <= 0).length})` },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCreditFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  creditFilter === chip.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                {chip.label}
              </button>
            ))}

            <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 rounded-xl px-2.5 py-1.5 ml-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-neutral-700 outline-none cursor-pointer"
              >
                <option value="dues">Sort: Highest Dues</option>
                <option value="spent">Sort: Top Spenders</option>
                <option value="sessions">Sort: Most Visits</option>
                <option value="recent">Sort: Recently Active</option>
                <option value="name">Sort: Name A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Customer Directory & Credit Ledger Table / Mobile Cards */}
      {/* Mobile Card List View (Visible on small screens) */}
      <div className="block lg:hidden space-y-3">
        {sortedAndFilteredCustomers.length === 0 ? (
          <Card className="p-8 text-center text-neutral-400 font-medium text-xs">
            No matching customer credit records found.
          </Card>
        ) : (
          sortedAndFilteredCustomers.map((cust) => {
            const dueAmt = cust.outstandingDue || 0;
            const walletAmt = cust.walletBalance || 0;
            const limit = cust.creditLimit || DEFAULT_CREDIT_LIMIT;
            const isOverLimit = dueAmt >= limit && dueAmt > 0;
            const isModerateRisk = dueAmt > limit * 0.5 && !isOverLimit;

            return (
              <Card key={cust.id} className="p-4 space-y-3 border-neutral-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-amber-400 font-extrabold flex items-center justify-center shrink-0 text-sm shadow-2xs">
                      {cust.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-neutral-900 text-sm">{cust.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          {cust.phone}
                        </span>
                        <span className="text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded border bg-neutral-100 text-neutral-700 border-neutral-200">
                          {getCustomerNumber(cust)}
                        </span>
                        {walletAmt > 0 && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            Vault: {formatCurrency(walletAmt, config.currencySymbol)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isOverLimit ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                      <AlertTriangle className="w-2.5 h-2.5" /> OVER LIMIT
                    </span>
                  ) : isModerateRisk ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                      MODERATE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider">
                      GOOD
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-neutral-50 rounded-xl p-2.5 border border-neutral-100 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Due Amount</span>
                    {dueAmt > 0 ? (
                      <span className={`font-black font-mono ${isOverLimit ? 'text-rose-600' : 'text-amber-700'}`}>
                        {formatCurrency(dueAmt, config.currencySymbol)} <span className="text-[9px] font-normal text-neutral-400">({formatCurrency(limit, config.currencySymbol)})</span>
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Cleared
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Advance Vault</span>
                    <span className="font-bold font-mono text-blue-600">
                      {formatCurrency(walletAmt, config?.currencySymbol || '₹')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Total Spent</span>
                    <span className="font-bold font-mono text-emerald-600">
                      {formatCurrency(cust.totalSpent || 0, config?.currencySymbol || '₹')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setViewingProfileCustomer(cust)}
                      className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> Profile
                    </button>
                    {dueAmt > 0 && (
                      <button
                        onClick={() => {
                          setSettlingCustomer(cust);
                          setSettleAmount(dueAmt.toString());
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Wallet className="w-3 h-3" /> Settle
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDepositingCustomer(cust);
                        setDepositAmount('1000');
                      }}
                      className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      title="Add Advance Prepaid Deposit"
                    >
                      <PlusCircle className="w-3 h-3 text-blue-600" /> + Deposit
                    </button>
                    {dueAmt > 0 && (
                      <button
                        onClick={() => handleOpenWhatsAppModal(cust)}
                        className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Send WhatsApp Payment Reminder"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" /> Reminder
                      </button>
                    )}
                    <button
                      onClick={() => handleShareStatement(cust)}
                      className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      title="Share Statement via WhatsApp"
                    >
                      <Share2 className="w-3 h-3 text-neutral-500" /> Statement
                    </button>
                    {canManageAccountBalances && <button
                      onClick={() => {
                        setAddingCreditCustomer(cust);
                        setCreditChargeAmount('');
                        setCreditChargeReason('');
                      }}
                      className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" /> Charge
                    </button>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(cust)}
                      className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-lg cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {canManageAccountBalances && <button
                      onClick={() => setDeletingCustomer(cust)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Table View (Hidden on Mobile) */}
      <Card className="hidden lg:block p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200/80 text-neutral-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Customer Profile</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Credit Limit</th>
                <th className="py-3.5 px-4">Advance Vault</th>
                <th className="py-3.5 px-4">Outstanding Due</th>
                <th className="py-3.5 px-4">Risk Status</th>
                <th className="py-3.5 px-4">Total Spend</th>
                <th className="py-3.5 px-4 text-right">Credit & Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedAndFilteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-neutral-400 font-medium">
                    No matching customer credit records found.
                  </td>
                </tr>
              ) : (
                sortedAndFilteredCustomers.map((cust) => {
                  const dueAmt = cust.outstandingDue || 0;
                  const walletAmt = cust.walletBalance || 0;
                  const limit = cust.creditLimit || DEFAULT_CREDIT_LIMIT;
                  const isOverLimit = dueAmt >= limit && dueAmt > 0;
                  const isModerateRisk = dueAmt > limit * 0.5 && !isOverLimit;

                  return (
                    <tr key={cust.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-amber-400 font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900">{cust.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              {cust.sessionsCount || 0} visits • {cust.totalHoursPlayed || 0}h played
                              {cust.preferredGame ? ` • ${cust.preferredGame}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-600 font-mono">
                        <span className="flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          {cust.phone}
                        </span>
                        {cust.email && (
                          <span className="text-[10px] text-neutral-400 block truncate max-w-[140px]">{cust.email}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[10px] font-bold text-neutral-700">
                        {getCustomerNumber(cust)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-700">
                        {formatCurrency(limit, config.currencySymbol)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        {walletAmt > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                            {formatCurrency(walletAmt, config?.currencySymbol || '₹')}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-xs">{formatCurrency(0, config.currencySymbol)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {dueAmt > 0 ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                            isOverLimit
                              ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            {formatCurrency(dueAmt, config.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> CLEARED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isOverLimit ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" /> OVER LIMIT
                          </span>
                        ) : isModerateRisk ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            MODERATE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            GOOD
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                        {formatCurrency(cust.totalSpent || 0, config?.currencySymbol || '₹')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Settle Dues Button (High Priority if Dues exist) */}
                          {dueAmt > 0 && (
                            <button
                              onClick={() => {
                                setSettlingCustomer(cust);
                                setSettleAmount(String(dueAmt));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                              title="Settle Outstanding Balance"
                            >
                              <CreditCard className="w-3 h-3" />
                              Settle
                            </button>
                          )}

                          {/* WhatsApp Reminder (Quick Action if Dues exist) */}
                          {dueAmt > 0 && (
                            <button
                              onClick={() => handleOpenWhatsAppModal(cust)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          )}

                          {/* View Full Profile */}
                          <button
                            onClick={() => setViewingProfileCustomer(cust)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-700 text-white text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="View Full Customer Profile"
                          >
                            <Eye className="w-3 h-3" />
                            Profile
                          </button>

                          {/* Secondary Action Icons */}
                          <div className="flex items-center gap-0.5 border-l border-neutral-200 pl-1 ml-0.5">
                            <button
                              onClick={() => {
                                setDepositingCustomer(cust);
                                setDepositAmount('1000');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Add Advance Deposit"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleShareStatement(cust)}
                              className="p-1.5 text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Share Statement on WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(cust)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Edit Profile"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {canManageAccountBalances && (
                              <button
                                onClick={() => setDeletingCustomer(cust)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: DELETE CUSTOMER CONFIRMATION */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900">Archive Customer Profile?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Archive <strong className="text-neutral-900">{deletingCustomer.name}</strong>? Their bills and account history will be kept, and their customer portal will be disabled.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                {isDeleting ? 'Archiving...' : 'Archive Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SETTLE CREDIT DUES */}
      {settlingCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Settle Credit Payment
                </h3>
                <p className="text-xs text-neutral-500">{settlingCustomer.name} • {settlingCustomer.phone}</p>
              </div>
              <button onClick={() => setSettlingCustomer(null)} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Outstanding Summary Card */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block">Outstanding Due</span>
                <span className="text-2xl font-black font-mono text-rose-400">{formatCurrency(settlingCustomer.outstandingDue || 0, config.currencySymbol)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block">Credit Limit</span>
                <span className="text-sm font-bold font-mono text-neutral-300">{formatCurrency(settlingCustomer.creditLimit || DEFAULT_CREDIT_LIMIT, config.currencySymbol)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Settlement Amount Received ({config.currencySymbol}) *</label>
                <input
                  type="number"
                  step="1"
                  max={settlingCustomer.outstandingDue || 0}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 font-mono font-bold text-sm outline-none focus:border-neutral-900 text-neutral-900"
                />

                {/* 1-Click Quick Fill Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(String(Math.round(settlingCustomer.outstandingDue || 0)))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Full {formatCurrency(Math.round(settlingCustomer.outstandingDue || 0), config.currencySymbol)}
                  </button>
                  {(settlingCustomer.outstandingDue || 0) > 500 && (
                    <button
                      type="button"
                      onClick={() => setSettleAmount('500')}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-bold hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {formatCurrency(500, config.currencySymbol)}
                    </button>
                  )}
                  {(settlingCustomer.outstandingDue || 0) > 1000 && (
                    <button
                      type="button"
                      onClick={() => setSettleAmount('1000')}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-bold hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {formatCurrency(1000, config.currencySymbol)}
                    </button>
                  )}
                </div>

                {/* Remaining Balance Calculator */}
                {Number(settleAmount) > 0 && (
                  <div className="flex justify-between items-center text-xs text-neutral-600 mt-2.5 bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl">
                    <span className="font-medium">Remaining Credit Due:</span>
                    <span className={`font-mono font-extrabold ${Math.max(0, (settlingCustomer.outstandingDue || 0) - Number(settleAmount)) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(Math.max(0, (settlingCustomer.outstandingDue || 0) - Number(settleAmount)), config.currencySymbol)}
                      {Math.max(0, (settlingCustomer.outstandingDue || 0) - Number(settleAmount)) === 0 && ' (Fully Cleared! 🎉)'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'upi', label: '📱 UPI / QR' },
                    { id: 'cash', label: '💵 Cash' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSettleMethod(m.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        settleMethod === m.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Payment Notes / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref #982347102"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs outline-none focus:border-neutral-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setSettlingCustomer(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!settleAmount || Number(settleAmount) <= 0 || isSaving}
                onClick={handleConfirmSettlement}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
              >
                {isSaving ? 'Processing...' : 'Confirm Settlement'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL CREDIT CHARGE */}
      {addingCreditCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-500" />
                  Add Manual Credit Charge
                </h3>
                <p className="text-xs text-neutral-500">{addingCreditCustomer.name} • {addingCreditCustomer.phone}</p>
              </div>
              <button onClick={() => setAddingCreditCustomer(null)} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Credit Amount to Charge ({config.currencySymbol}) *</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 500"
                  value={creditChargeAmount}
                  onChange={(e) => setCreditChargeAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 font-mono font-bold text-sm outline-none focus:border-neutral-900 text-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Reason / Note *</label>
                <input
                  type="text"
                  placeholder="e.g. Tournament Entry Fee / Canteen Order"
                  value={creditChargeReason}
                  onChange={(e) => setCreditChargeReason(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs outline-none focus:border-neutral-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setAddingCreditCustomer(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!creditChargeAmount || Number(creditChargeAmount) <= 0 || !creditChargeReason.trim() || isSaving}
                onClick={handleConfirmAddCredit}
                className="bg-amber-500 hover:bg-amber-600 text-white border-none"
              >
                {isSaving ? 'Processing...' : 'Record Credit Charge'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD ADVANCE DEPOSIT */}
      {depositingCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  Record Advance Deposit
                </h3>
                <p className="text-xs text-neutral-500">{depositingCustomer.name} • {depositingCustomer.phone}</p>
              </div>
              <button onClick={() => setDepositingCustomer(null)} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Advance Vault Balance */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block">Current Advance Vault</span>
                <span className="text-2xl font-black font-mono text-blue-400">
                  {formatCurrency(depositingCustomer.walletBalance || 0, config.currencySymbol)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block">Total Sessions</span>
                <span className="text-sm font-bold font-mono text-neutral-300">{depositingCustomer.sessionsCount || 0} visits</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Deposit Amount to Add ({config.currencySymbol}) *</label>
                <input
                  type="number"
                  step="50"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 font-mono font-bold text-sm outline-none focus:border-neutral-900 text-neutral-900"
                  placeholder="e.g. 1000"
                />

                {/* 1-Click Quick Preset Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Quick Add:</span>
                  {['500', '1000', '2000', '5000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      +{config.currencySymbol}{amt}
                    </button>
                  ))}
                </div>

                {/* New Balance Projection */}
                {Number(depositAmount) > 0 && (
                  <div className="flex justify-between items-center text-xs text-neutral-600 mt-2.5 bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl">
                    <span className="font-medium">New Vault Balance:</span>
                    <span className="font-mono font-extrabold text-blue-600">
                      {formatCurrency((depositingCustomer.walletBalance || 0) + Number(depositAmount), config.currencySymbol)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'upi', label: '📱 UPI / QR' },
                    { id: 'cash', label: '💵 Cash' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDepositMethod(m.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        depositMethod === m.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Deposit Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Prepaid hour pack / UPI Ref #48102"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs outline-none focus:border-neutral-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setDepositingCustomer(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!depositAmount || Number(depositAmount) <= 0 || isSaving}
                onClick={handleConfirmAddDeposit}
                className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-xs"
              >
                {isSaving ? 'Processing...' : 'Confirm Deposit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CUSTOMER PROFILE */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-neutral-900">
                {editingCustomer.id ? 'Edit Customer CRM Profile' : 'Add New Customer Profile'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name *</label>
                <Input
                  required
                  value={editingCustomer.name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="e.g. Marcus Vance"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Phone Number *</label>
                  <Input
                    required
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={editingCustomer.email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    disabled={!canManageAccountBalances}
                    placeholder="player@example.com"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Customer ID</label>
                  <Input value={getCustomerNumber(editingCustomer as TopCustomer)} disabled className="text-xs font-mono bg-neutral-100" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Preferred Game / Area</label>
                  <select
                    value={editingCustomer.preferredGame || 'Snooker'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, preferredGame: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 text-xs font-semibold rounded-xl p-2.5 outline-none"
                  >
                    <option value="Snooker">Snooker</option>
                    <option value="Pool">8-Ball Pool</option>
                    <option value="PS5">PlayStation 5</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="General">General Gaming</option>
                  </select>
                </div>
              </div>

              <p className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-900">
                Balances and credit limits are managed through recorded account transactions, not by editing this profile.
              </p>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Special Notes / Preferences</label>
                <textarea
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="e.g. Prefers Snooker Table 05, usually plays on weekends..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Customer Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Vault & Transaction Audit Trail Modal */}
      {viewingLedgerCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Credit Vault Audit Trail — {viewingLedgerCustomer.name}
                </h3>
                <p className="text-xs text-neutral-500">Phone: {viewingLedgerCustomer.phone}</p>
              </div>
              <button
                onClick={() => setViewingLedgerCustomer(null)}
                className="text-neutral-400 hover:text-neutral-900 font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Total Due Banner */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">Current Outstanding Credit</span>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {formatCurrency(viewingLedgerCustomer.outstandingDue || 0, config.currencySymbol)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(viewingLedgerCustomer.outstandingDue || 0) > 0 && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const c = viewingLedgerCustomer;
                      setViewingLedgerCustomer(null);
                      handleOpenWhatsAppModal(c);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp Reminder
                  </Button>
                )}
              </div>
            </div>

            {/* Audit History List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Transaction Audit Log</h4>
              {viewingLedgerCustomer.udhaarLedger && viewingLedgerCustomer.udhaarLedger.length > 0 ? (
                viewingLedgerCustomer.udhaarLedger.map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-neutral-900">{tx.description}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {new Date(tx.timestamp).toLocaleString()} • Staff: {tx.recordedBy} {tx.paymentMethod ? `(${tx.paymentMethod.toUpperCase()})` : ''}
                      </div>
                    </div>
                    <span className={`font-black font-mono ${tx.type === 'due_added' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'due_added' ? '+' : '-'}{formatCurrency(tx.amount, config.currencySymbol)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-neutral-400 text-xs bg-neutral-50 rounded-xl">
                  No previous credit transactions recorded for this customer.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setViewingLedgerCustomer(null)}>
                Close Audit View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WHATSAPP PAYMENT REMINDER MODAL */}
      {/* ========================================================= */}
      {whatsAppCustomer && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-emerald-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">WhatsApp Payment Reminder</h3>
                  <p className="text-xs text-neutral-500 font-medium">Send balance statement & payment instructions</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppCustomer(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Snapshot Card */}
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-extrabold text-neutral-900 text-sm">{whatsAppCustomer.name}</span>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mt-0.5">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  <span>{whatsAppCustomer.phone}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                    +{normalizeWhatsAppPhone(whatsAppCustomer.phone)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Pending Due</span>
                <span className="text-base font-black font-mono text-rose-600">
                  {formatCurrency(whatsAppCustomer.outstandingDue || 0, config.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Template Tone Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Select Reminder Template:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleToneChange('gentle')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    whatsAppTone === 'gentle'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  🌱 Gentle Notice
                </button>
                <button
                  type="button"
                  onClick={() => handleToneChange('standard')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    whatsAppTone === 'standard'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  📋 Standard Due
                </button>
                <button
                  type="button"
                  onClick={() => handleToneChange('urgent')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    whatsAppTone === 'urgent'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-2xs ring-1 ring-rose-500'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  ⚠️ Overdue Alert
                </button>
              </div>
            </div>

            {/* Message Preview Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">Message Preview & Customization:</label>
                {config.upiId && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    UPI: {config.upiId}
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                value={whatsAppMessage}
                onChange={(e) => setWhatsAppMessage(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs font-mono text-neutral-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none leading-relaxed"
              />
              <p className="text-[10px] text-neutral-400">
                You can edit the text before sending. Formatting (*bold*, `code`) will appear nicely in WhatsApp.
              </p>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyWhatsAppMessage}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                {isCopied ? 'Copied Text!' : 'Copy Text'}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWhatsAppCustomer(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendWhatsApp}
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs font-bold cursor-pointer"
                >
                  Open in WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
