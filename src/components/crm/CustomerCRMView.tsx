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
  Wallet
} from 'lucide-react';
import { TopCustomer, BusinessConfig, UdhaarTransaction } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface CustomerCRMViewProps {
  customers: TopCustomer[];
  config: BusinessConfig;
  onSaveCustomer: (customer: TopCustomer) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
}

export const CustomerCRMView: React.FC<CustomerCRMViewProps> = ({
  customers,
  config,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [creditFilter, setCreditFilter] = useState<string>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<TopCustomer> | null>(null);
  const [viewingLedgerCustomer, setViewingLedgerCustomer] = useState<TopCustomer | null>(null);

  // Settlement Modal State
  const [settlingCustomer, setSettlingCustomer] = useState<TopCustomer | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'cash' | 'upi' | 'card'>('upi');
  const [settleNotes, setSettleNotes] = useState<string>('');

  // Add Manual Credit Charge Modal State
  const [addingCreditCustomer, setAddingCreditCustomer] = useState<TopCustomer | null>(null);
  const [creditChargeAmount, setCreditChargeAmount] = useState<string>('');
  const [creditChargeReason, setCreditChargeReason] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);

  // Default credit limit if unassigned
  const DEFAULT_CREDIT_LIMIT = config?.maxCreditLimit || 2000;

  // Filter Logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMembership = 
      membershipFilter === 'all' || 
      (c.membershipStatus || c.tier || 'Regular').toLowerCase() === membershipFilter.toLowerCase();

    const dueAmt = c.outstandingDue || 0;
    const limit = c.creditLimit || DEFAULT_CREDIT_LIMIT;

    const matchesCredit = 
      creditFilter === 'all' ||
      (creditFilter === 'has_dues' && dueAmt > 0) ||
      (creditFilter === 'high_risk' && (dueAmt >= limit || dueAmt >= 1500)) ||
      (creditFilter === 'cleared' && dueAmt === 0);

    return matchesSearch && matchesMembership && matchesCredit;
  });

  const totalDuesAcrossClub = customers.reduce((acc, c) => acc + (c.outstandingDue || 0), 0);
  const customersWithDuesCount = customers.filter((c) => (c.outstandingDue || 0) > 0).length;
  const highRiskCustomersCount = customers.filter((c) => (c.outstandingDue || 0) >= (c.creditLimit || DEFAULT_CREDIT_LIMIT)).length;

  const handleOpenAddModal = () => {
    setEditingCustomer({
      id: `c-${Date.now()}`,
      name: '',
      phone: '',
      sessionsCount: 1,
      totalSpent: 0,
      totalHoursPlayed: 0,
      dateJoined: new Date().toISOString().split('T')[0],
      membershipStatus: 'Regular',
      lastVisit: 'Today',
      creditLimit: DEFAULT_CREDIT_LIMIT,
      outstandingDue: 0,
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
      await onSaveCustomer(editingCustomer as TopCustomer);
      setIsEditModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      alert('Failed to save customer record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer profile for "${name}"?`)) {
      await onDeleteCustomer(id);
    }
  };

  // Submit Settlement
  const handleConfirmSettlement = async () => {
    if (!settlingCustomer || !settleAmount || Number(settleAmount) <= 0) return;
    const paid = Number(settleAmount);
    const currentDue = settlingCustomer.outstandingDue || 0;
    const newDue = Math.max(0, currentDue - paid);

    const newTx: UdhaarTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: Date.now(),
      type: 'payment_received',
      amount: paid,
      description: settleNotes.trim() || `Settled Credit Payment (${settleMethod.toUpperCase()})`,
      paymentMethod: settleMethod,
      recordedBy: user?.displayName || user?.email || 'Staff'
    };

    const updatedCust: TopCustomer = {
      ...settlingCustomer,
      outstandingDue: newDue,
      totalSpent: (settlingCustomer.totalSpent || 0) + paid,
      udhaarLedger: [newTx, ...(settlingCustomer.udhaarLedger || [])]
    };

    try {
      setIsSaving(true);
      await onSaveCustomer(updatedCust);
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
    const currentDue = addingCreditCustomer.outstandingDue || 0;
    const newDue = currentDue + charge;

    const newTx: UdhaarTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: Date.now(),
      type: 'due_added',
      amount: charge,
      description: creditChargeReason.trim() || 'Manual Credit Charge Added',
      recordedBy: user?.displayName || user?.email || 'Staff'
    };

    const updatedCust: TopCustomer = {
      ...addingCreditCustomer,
      outstandingDue: newDue,
      udhaarLedger: [newTx, ...(addingCreditCustomer.udhaarLedger || [])]
    };

    try {
      setIsSaving(true);
      await onSaveCustomer(updatedCust);
      setAddingCreditCustomer(null);
      setCreditChargeAmount('');
      setCreditChargeReason('');
    } catch (err) {
      alert('Failed to add credit charge.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Membership', 'Credit Dues', 'Credit Limit', 'Sessions', 'Hours Played', 'Total Spent', 'Last Visit', 'Notes'];
    const rows = customers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      c.membershipStatus || c.tier || 'Regular',
      (c.outstandingDue || 0).toFixed(2),
      (c.creditLimit || DEFAULT_CREDIT_LIMIT).toFixed(2),
      c.sessionsCount || 0,
      c.totalHoursPlayed || 0,
      c.totalSpent.toFixed(2),
      `"${c.lastVisit}"`,
      `"${c.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Credit_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-rose-50/50 border-rose-200">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">Total Outstanding Credit</span>
            <div className="text-xl font-black text-rose-900 font-mono">
              ₹{totalDuesAcrossClub.toFixed(0)}
            </div>
            <span className="text-[10px] font-semibold text-rose-700">{customersWithDuesCount} customers with unpaid dues</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">High Risk / Over Limit</span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {highRiskCustomersCount}
            </div>
            <span className="text-[10px] font-semibold text-amber-700">Dues exceed assigned limit</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Total Active Players</span>
            <div className="text-xl font-black text-neutral-900 font-mono">{customers.length}</div>
            <span className="text-[10px] font-semibold text-emerald-700">CRM Profiles Saved</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Total Hours Played</span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {customers.reduce((acc, c) => acc + (c.totalHoursPlayed || c.sessionsCount * 1.5 || 0), 0).toFixed(0)} hrs
            </div>
            <span className="text-[10px] font-semibold text-neutral-500">Recorded sessions</span>
          </div>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">Credit Status:</span>
          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-xs font-bold rounded-xl px-3 py-2 text-neutral-800 outline-none"
          >
            <option value="all">All Credit Statuses</option>
            <option value="has_dues">🔴 Has Dues (&gt;₹0)</option>
            <option value="high_risk">⚠️ High Risk / Limit Exceeded</option>
            <option value="cleared">🟢 Fully Cleared</option>
          </select>

          <span className="text-xs font-bold text-neutral-500 whitespace-nowrap ml-2">Tier:</span>
          <select
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-xs font-bold rounded-xl px-3 py-2 text-neutral-800 outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="VIP">VIP</option>
            <option value="Platinum">Platinum</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Regular">Regular</option>
          </select>
        </div>
      </Card>

      {/* Customer Directory & Credit Ledger Table / Mobile Cards */}
      {/* Mobile Card List View (Visible on small screens) */}
      <div className="block lg:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <Card className="p-8 text-center text-neutral-400 font-medium text-xs">
            No matching customer credit records found.
          </Card>
        ) : (
          filteredCustomers.map((cust) => {
            const status = cust.membershipStatus || cust.tier || 'Regular';
            const dueAmt = cust.outstandingDue || 0;
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          {cust.phone}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          status.toLowerCase() === 'vip' || status.toLowerCase() === 'platinum'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : status.toLowerCase() === 'gold'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}>
                          {status}
                        </span>
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

                <div className="grid grid-cols-2 gap-2 bg-neutral-50 rounded-xl p-2.5 border border-neutral-100 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Due Amount</span>
                    {dueAmt > 0 ? (
                      <span className={`font-black font-mono ${isOverLimit ? 'text-rose-600' : 'text-amber-700'}`}>
                        ₹{dueAmt.toFixed(0)} <span className="text-[9px] font-normal text-neutral-400">(Limit: ₹{limit.toFixed(0)})</span>
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Cleared
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Total Spent</span>
                    <span className="font-bold font-mono text-emerald-600">
                      {formatCurrency(cust.totalSpent || 0, config?.currencySymbol || '₹')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
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
                        setAddingCreditCustomer(cust);
                        setCreditChargeAmount('');
                        setCreditChargeReason('');
                      }}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" /> Charge
                    </button>
                    <button
                      onClick={() => setViewingLedgerCustomer(cust)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" /> Audit
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(cust)}
                      className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-lg cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id, cust.name)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                <th className="py-3.5 px-4">Membership</th>
                <th className="py-3.5 px-4">Credit Limit</th>
                <th className="py-3.5 px-4">Outstanding Credit Dues</th>
                <th className="py-3.5 px-4">Risk Status</th>
                <th className="py-3.5 px-4">Total Spend</th>
                <th className="py-3.5 px-4 text-right">Credit & Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-400 font-medium">
                    No matching customer credit records found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const status = cust.membershipStatus || cust.tier || 'Regular';
                  const dueAmt = cust.outstandingDue || 0;
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
                            <div className="text-[10px] text-neutral-400 font-mono">{cust.sessionsCount || 0} visits • {cust.totalHoursPlayed || 0}h played</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-600 font-mono">
                        <span className="flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          {cust.phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          status.toLowerCase() === 'vip' || status.toLowerCase() === 'platinum'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : status.toLowerCase() === 'gold'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}>
                          {status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-700">
                        ₹{limit.toFixed(0)}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {dueAmt > 0 ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                            isOverLimit
                              ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            ₹{dueAmt.toFixed(0)}
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
                          {/* Settle Dues Button */}
                          {dueAmt > 0 && (
                            <button
                              onClick={() => {
                                setSettlingCustomer(cust);
                                setSettleAmount(String(dueAmt));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <CreditCard className="w-3 h-3" />
                              Settle
                            </button>
                          )}

                          {/* Add Credit Charge Button */}
                          <button
                            onClick={() => setAddingCreditCustomer(cust)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Add Manual Credit Charge"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Reminder Button */}
                          {dueAmt > 0 && (
                            <button
                              onClick={() => {
                                const msg = `Hello ${cust.name}, gentle payment reminder from ${config.clubName || 'Rocket 147 Snooker & Pool Club'}. Your outstanding credit balance is ₹${dueAmt.toFixed(0)}. Kindly clear it at your earliest convenience. Thank you!`;
                                window.open(`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Audit Trail Button */}
                          <button
                            onClick={() => setViewingLedgerCustomer(cust)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="View Audit Trail"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(cust.id, cust.name)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <span className="text-2xl font-black font-mono text-rose-400">₹{(settlingCustomer.outstandingDue || 0).toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block">Credit Limit</span>
                <span className="text-sm font-bold font-mono text-neutral-300">₹{(settlingCustomer.creditLimit || DEFAULT_CREDIT_LIMIT).toFixed(0)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Settlement Amount Received (₹) *</label>
                <input
                  type="number"
                  step="1"
                  max={settlingCustomer.outstandingDue || 0}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 font-mono font-bold text-sm outline-none focus:border-neutral-900 text-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: '📱 UPI / QR' },
                    { id: 'cash', label: '💵 Cash' },
                    { id: 'card', label: '💳 Card' },
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
                <label className="font-bold text-neutral-700 block mb-1">Credit Amount to Charge (₹) *</label>
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

      {/* MODAL: ADD / EDIT CUSTOMER PROFILE */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-neutral-900">
                {editingCustomer.id ? 'Edit Customer CRM Profile' : 'Add New Customer Profile'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 font-bold text-lg"
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
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Membership Status</label>
                  <select
                    value={editingCustomer.membershipStatus || 'Regular'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, membershipStatus: e.target.value as any })}
                    className="w-full bg-neutral-50 border border-neutral-200 text-xs font-semibold rounded-xl p-2.5 outline-none"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Silver">Silver Member</option>
                    <option value="Gold">Gold Member</option>
                    <option value="Platinum">Platinum Member</option>
                    <option value="VIP">VIP Elite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Max Credit Risk Limit (₹)</label>
                  <Input
                    type="number"
                    step="100"
                    value={editingCustomer.creditLimit || DEFAULT_CREDIT_LIMIT}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, creditLimit: parseFloat(e.target.value) || DEFAULT_CREDIT_LIMIT })}
                    className="text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Current Outstanding Due (₹)</label>
                  <Input
                    type="number"
                    step="1"
                    value={editingCustomer.outstandingDue || 0}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, outstandingDue: parseFloat(e.target.value) || 0 })}
                    className="text-xs font-mono font-bold text-rose-600"
                  />
                </div>
              </div>

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
                  ₹{(viewingLedgerCustomer.outstandingDue || 0).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(viewingLedgerCustomer.outstandingDue || 0) > 0 && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const msg = `Hello ${viewingLedgerCustomer.name}, gentle payment reminder from ${config.clubName || 'Rocket 147 Snooker & Pool Club'}. Your outstanding credit balance is ₹${(viewingLedgerCustomer.outstandingDue || 0).toFixed(0)}. Kindly clear it at your earliest convenience. Thank you!`;
                      window.open(`https://wa.me/${viewingLedgerCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
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
                      {tx.type === 'due_added' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
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
    </div>
  );
};
