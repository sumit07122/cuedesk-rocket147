import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Grid2X2, 
  DollarSign, 
  Utensils, 
  Users, 
  Percent, 
  QrCode, 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Save, 
  Sparkles,
  Printer,
  Database,
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Crown,
  ChefHat,
  Sliders,
  CheckCircle2,
  UserPlus,
  Key,
  X,
  Lock
} from 'lucide-react';
import { TableItem, MenuItem, BusinessConfig, TableType, SubscriptionPlanId } from '../../types';
import { SUBSCRIPTION_PLANS, calculateTrialDaysRemaining } from '../../data/saasPlans';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { exportClubBackup, downloadBackupFile, restoreClubBackup, ClubBackupSnapshot } from '../../utils/backupService';
import { clearHistoryAndAnalytics } from '../../services/dbService';
import { getRecentMonitoringEvents } from '../../utils/monitoring';
import { QRCodeComponent } from '../common/QRCodeComponent';

interface SettingsViewProps {
  config: BusinessConfig;
  tables: TableItem[];
  menuItems: MenuItem[];
  onUpdateConfig: (newConfig: BusinessConfig) => void;
  onAddTable: (table: Omit<TableItem, 'id' | 'status'>) => void;
  onDeleteTable: (tableId: string) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onShowQRCode?: (table: TableItem) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  tables,
  menuItems,
  onUpdateConfig,
  onAddTable,
  onDeleteTable,
  onAddMenuItem,
  onDeleteMenuItem,
  onShowQRCode,
}) => {
  const [activeTab, setActiveTab] = useState<
    'business' | 'crm_rules' | 'tables' | 'rates' | 'menu' | 'employees' | 'qr' | 'backup'
  >('business');

  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Danger Zone state
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerTarget, setDangerTarget] = useState<'history' | 'expenses' | 'customers' | 'all' | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const RESET_KEYWORD = 'RESET';

  // Business Config Form State
  const [businessForm, setBusinessForm] = useState<BusinessConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  // New Table Form State
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState<TableType>('pool');
  const [newTableRate, setNewTableRate] = useState<number>(18.00);

  // New Menu Item State
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCat, setNewMenuCat] = useState<'drinks' | 'snacks' | 'food' | 'accessories'>('drinks');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(4.50);

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // Staff Roles & Permissions Management State
  const [rolesList, setRolesList] = useState([
    {
      id: 'owner',
      title: 'OWNER / SUPER ADMIN',
      description: 'Full system access. Can manage staff, reset analytics, edit pricing, and access all financial data.',
      baseRole: 'owner' as const,
      isCustom: false,
      permissions: {
        tableOps: true,
        billingCheckout: true,
        applyDiscount: true,
        foodInventory: true,
        customerCredit: true,
        reportsAnalytics: true,
        clubSettings: true,
        shiftClosure: true,
        dataReset: true,
      }
    },
    {
      id: 'manager',
      title: 'CLUB MANAGER',
      description: 'Operational management. Can manage inventory, expenses, maintenance, and view reports.',
      baseRole: 'manager' as const,
      isCustom: false,
      permissions: {
        tableOps: true,
        billingCheckout: true,
        applyDiscount: true,
        foodInventory: true,
        customerCredit: true,
        reportsAnalytics: true,
        clubSettings: false,
        shiftClosure: true,
        dataReset: false,
      }
    },
    {
      id: 'cashier',
      title: 'COUNTER CASHIER',
      description: 'Counter operations only. Can start/stop table sessions, add snacks, and process billing.',
      baseRole: 'cashier' as const,
      isCustom: false,
      permissions: {
        tableOps: true,
        billingCheckout: true,
        applyDiscount: false,
        foodInventory: false,
        customerCredit: true,
        reportsAnalytics: false,
        clubSettings: false,
        shiftClosure: true,
        dataReset: false,
      }
    },
    {
      id: 'kitchen',
      title: 'KITCHEN STAFF',
      description: 'Kitchen access only. Can view and manage the Kitchen Display System (KDS), update order statuses, and manage food & inventory stock levels.',
      baseRole: 'kitchen' as const,
      isCustom: false,
      permissions: {
        tableOps: false,
        billingCheckout: false,
        applyDiscount: false,
        foodInventory: true,
        customerCredit: false,
        reportsAnalytics: false,
        clubSettings: false,
        shiftClosure: false,
        dataReset: false,
      }
    }
  ]);

  const [staffAccounts, setStaffAccounts] = useState([
    { id: '1', name: 'Club Owner', email: 'owner@rocket147.com', role: 'owner', status: 'Active', access: 'Full Admin' },
    { id: '2', name: 'Duty Manager', email: 'manager@rocket147.com', role: 'manager', status: 'Active', access: 'Operational' },
    { id: '3', name: 'Front Counter Cashier', email: 'cashier@rocket147.com', role: 'cashier', status: 'Active', access: 'Counter Only' },
    { id: '4', name: 'Kitchen Staff', email: 'kitchen@rocket147.com', role: 'kitchen', status: 'Active', access: 'KDS & Inventory' },
  ]);

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleBase, setNewRoleBase] = useState<'owner' | 'manager' | 'cashier' | 'kitchen'>('cashier');

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('cashier');

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setBackupMsg(null);
      const snapshot = await exportClubBackup(config.id || 'club-royal-cue');
      downloadBackupFile(snapshot);
      setBackupMsg('Backup snapshot generated and downloaded successfully!');
    } catch (err) {
      setBackupMsg(err instanceof Error ? err.message : 'Backup export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      setBackupMsg(null);
      const text = await file.text();
      const backupData = JSON.parse(text) as ClubBackupSnapshot;

      if (!confirm(`Are you sure you want to restore backup for club ID "${backupData.clubId}"?`)) {
        setIsRestoring(false);
        return;
      }

      const res = await restoreClubBackup(config.id || 'club-royal-cue', backupData);
      setBackupMsg(res.message);
      if (backupData.config) {
        onUpdateConfig(backupData.config);
      }
    } catch (err) {
      setBackupMsg(`Restore error: ${err instanceof Error ? err.message : 'Invalid backup JSON file'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(businessForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const nextNumber = tables.length + 1;
    onAddTable({
      number: nextNumber,
      name: newTableName.trim(),
      type: newTableType,
      hourlyRate: newTableRate,
    });
    setNewTableName('');
    setShowAddTable(false);
  };

  const handleAddMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;
    onAddMenuItem({
      name: newMenuName.trim(),
      category: newMenuCat,
      price: newMenuPrice,
      available: true,
    });
    setNewMenuName('');
    setShowAddMenu(false);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
      {/* Settings Navigation Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xs">
        {[
          { id: 'business', label: 'Club Info', icon: Building2 },
          { id: 'crm_rules', label: 'CRM & Credit Rules', icon: Users },
          { id: 'tables', label: 'Manage Tables', icon: Grid2X2 },
          { id: 'rates', label: 'Hourly Pricing', icon: DollarSign },
          { id: 'menu', label: 'Food & Drinks Menu', icon: Utensils },
          { id: 'employees', label: 'Staff Roles', icon: Users },
          { id: 'qr', label: 'QR Codes Generator', icon: QrCode },
          { id: 'backup', label: 'Backup & Security', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Business Information & Taxes */}
      {activeTab === 'business' && (
        <Card>
          <form onSubmit={handleSaveConfig} className="flex flex-col gap-5 max-w-2xl">
            <div className="border-b border-neutral-100 pb-4">
              <h3 className="text-base font-bold text-neutral-900">Club Information</h3>
              <p className="text-xs text-neutral-500">All details appear on receipts and QR codes</p>
            </div>

            {/* Row 1: Club Name & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Club Name"
                value={businessForm.clubName}
                onChange={(e) => setBusinessForm({ ...businessForm, clubName: e.target.value })}
                required
              />
              <Input
                label="Tagline / Motto"
                value={businessForm.tagline}
                onChange={(e) => setBusinessForm({ ...businessForm, tagline: e.target.value })}
              />
            </div>

            {/* Row 2: Phone & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={businessForm.phone}
                onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
              />
              <Input
                label="WhatsApp Number (for bill sharing)"
                value={businessForm.whatsappNumber || ''}
                onChange={(e) => setBusinessForm({ ...businessForm, whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Row 3: Address & Operating Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Physical Address"
                value={businessForm.address}
                onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
              />
              <Input
                label="Operating Hours"
                value={businessForm.operatingHours || ''}
                onChange={(e) => setBusinessForm({ ...businessForm, operatingHours: e.target.value })}
                placeholder="10:00 AM – 11:00 PM"
              />
            </div>

            {/* Row 4: Currency, Rounding, Discount Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Currency Symbol"
                value={businessForm.currencySymbol}
                onChange={(e) => setBusinessForm({ ...businessForm, currencySymbol: e.target.value })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700">Bill Rounding Rule</label>
                <select
                  value={businessForm.roundingRule || 'nearest_1'}
                  onChange={(e) => setBusinessForm({ ...businessForm, roundingRule: e.target.value as any })}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 outline-none focus:border-neutral-900"
                >
                  <option value="none">Exact (No Rounding)</option>
                  <option value="nearest_1">Nearest ₹1</option>
                  <option value="nearest_5">Nearest ₹5</option>
                  <option value="round_up">Round Up Always</option>
                </select>
              </div>
              <Input
                label="Max Cashier Discount Limit (%)"
                type="number"
                value={businessForm.maxCashierDiscountPercent || 10}
                onChange={(e) => setBusinessForm({ ...businessForm, maxCashierDiscountPercent: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Row 5: UPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="UPI ID for Payments"
                value={businessForm.upiId}
                onChange={(e) => setBusinessForm({ ...businessForm, upiId: e.target.value })}
              />
              <Input
                label="UPI Merchant Name"
                value={businessForm.upiName}
                onChange={(e) => setBusinessForm({ ...businessForm, upiName: e.target.value })}
              />
            </div>

            {/* Row 6: Pricing multipliers & min charge */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <Input
                label="Weekend Rate Multiplier (e.g. 1.25 = +25%)"
                type="number"
                step="0.05"
                value={businessForm.weekendRateMultiplier || 1.2}
                onChange={(e) => setBusinessForm({ ...businessForm, weekendRateMultiplier: parseFloat(e.target.value) || 1.0 })}
              />
              <Input
                label="Happy Hour Multiplier (e.g. 0.8 = -20%)"
                type="number"
                step="0.05"
                value={businessForm.happyHourRateMultiplier || 0.8}
                onChange={(e) => setBusinessForm({ ...businessForm, happyHourRateMultiplier: parseFloat(e.target.value) || 1.0 })}
              />
              <Input
                label="Minimum Charge (minutes)"
                type="number"
                value={businessForm.minimumChargeMinutes || 30}
                onChange={(e) => setBusinessForm({ ...businessForm, minimumChargeMinutes: parseInt(e.target.value) || 0 })}
                placeholder="30"
              />
            </div>

            {/* Receipt Footer */}
            <Input
              label="Receipt Footer Message"
              value={businessForm.receiptFooterMsg}
              onChange={(e) => setBusinessForm({ ...businessForm, receiptFooterMsg: e.target.value })}
            />

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              {isSaved ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Settings Saved Successfully!
                </span>
              ) : (
                <span className="text-xs text-neutral-400">Changes take effect immediately</span>
              )}
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Configuration
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB: CRM & Membership Credit Rules */}
      {activeTab === 'crm_rules' && (
        <Card className="flex flex-col gap-6">
          <div className="border-b border-neutral-100 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">CRM, Membership Tiers & Credit Limits</h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure discount rates for member tiers, set credit risk limits, and define auto-upgrade criteria
              </p>
            </div>
            {isSaved && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Settings Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* Section 1: Member Tier Discounts */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                1. Tier-Based Member Discounts
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-neutral-700">SILVER TIER</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">5% Default</span>
                  </div>
                  <Input
                    label="Discount Rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={businessForm.silverDiscountPercent ?? 5}
                    onChange={(e) => setBusinessForm({ ...businessForm, silverDiscountPercent: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-neutral-400">Auto-applied to table billing for Silver members</p>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-amber-900">GOLD TIER</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800">10% Default</span>
                  </div>
                  <Input
                    label="Discount Rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={businessForm.goldDiscountPercent ?? 10}
                    onChange={(e) => setBusinessForm({ ...businessForm, goldDiscountPercent: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-amber-700/70">Auto-applied for Gold tier frequent players</p>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-emerald-900">VIP / PLATINUM</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">15% Default</span>
                  </div>
                  <Input
                    label="Discount Rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={businessForm.vipDiscountPercent ?? 15}
                    onChange={(e) => setBusinessForm({ ...businessForm, vipDiscountPercent: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-emerald-700/70">Highest tier privilege discount rate</p>
                </div>
              </div>
            </div>

            {/* Section 2: Credit Limits & Udhaar Risk Management */}
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                2. Credit Dues & VIP Auto-Upgrade Policy
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
                  <Input
                    label="Maximum Credit / Due Limit per Player (₹)"
                    type="number"
                    step="100"
                    value={businessForm.maxCreditLimit ?? 2000}
                    onChange={(e) => setBusinessForm({ ...businessForm, maxCreditLimit: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1.5">
                    Maximum outstanding balance a player can hold before staff are warned during Pay Later checkout.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
                  <Input
                    label="Auto-Upgrade to VIP Spend Threshold (₹)"
                    type="number"
                    step="500"
                    value={businessForm.autoUpgradeSpendThreshold ?? 5000}
                    onChange={(e) => setBusinessForm({ ...businessForm, autoUpgradeSpendThreshold: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1.5">
                    Customers reaching this total spend automatically become eligible for VIP lounge privileges.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <span className="text-xs text-neutral-400">Rules update live across all billing screens</span>
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save CRM & Credit Rules
              </Button>
            </div>
          </form>
        </Card>
      )}



      {/* TAB 2: Manage Tables */}
      {activeTab === 'tables' && (
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Manage Pool & Snooker Tables</h3>
              <p className="text-xs text-neutral-500">Configure table names, types, and hourly rates</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddTable(true)}
            >
              Add New Table
            </Button>
          </div>

          {/* Add Table Form */}
          {showAddTable && (
            <form onSubmit={handleAddTableSubmit} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Table Name"
                  placeholder="e.g. Table 11 — Diamond Pro"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  required
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Table Type</label>
                <select
                  value={newTableType}
                  onChange={(e) => setNewTableType(e.target.value as any)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs outline-none"
                >
                  <option value="pool">Pool 9ft</option>
                  <option value="snooker">Snooker Pro</option>
                  <option value="carom">Carom</option>
                  <option value="vip">VIP Lounge</option>
                </select>
              </div>
              <div className="w-full sm:w-32">
                <Input
                  label="Rate/hr"
                  type="number"
                  value={newTableRate}
                  onChange={(e) => setNewTableRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddTable(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Table
                </Button>
              </div>
            </form>
          )}

          {/* Table List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-neutral-900">#{t.number}</span>
                    <span className="uppercase font-semibold text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600">
                      {t.type}
                    </span>
                  </div>
                  <p className="font-semibold text-neutral-800 mt-0.5 truncate max-w-[160px]">{t.name}</p>
                  <span className="text-neutral-500 font-mono mt-1 block">
                    {formatCurrency(t.hourlyRate, config.currencySymbol)}/hr
                  </span>
                </div>

                <button
                  onClick={() => onDeleteTable(t.id)}
                  className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: Food Menu */}
      {activeTab === 'menu' && (
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Food & Beverage Menu Items</h3>
              <p className="text-xs text-neutral-500">Manage snacks, coffee, meals, and cue accessories</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddMenu(true)}
            >
              Add Menu Item
            </Button>
          </div>

          {/* Add Menu Item Form */}
          {showAddMenu && (
            <form onSubmit={handleAddMenuSubmit} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Item Name"
                  placeholder="e.g. Cold Coffee"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  required
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Category</label>
                <select
                  value={newMenuCat}
                  onChange={(e) => setNewMenuCat(e.target.value as any)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs outline-none"
                >
                  <option value="drinks">Beverages</option>
                  <option value="snacks">Snacks</option>
                  <option value="food">Food Meals</option>
                  <option value="accessories">Cue Accessories</option>
                </select>
              </div>
              <div className="w-full sm:w-32">
                <Input
                  label={`Price (${businessForm.currencySymbol || '₹'})`}
                  type="number"
                  step="0.5"
                  value={newMenuPrice}
                  onChange={(e) => setNewMenuPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddMenu(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Add Item
                </Button>
              </div>
            </form>
          )}

          {/* Menu Items Table */}
          <div className="divide-y divide-neutral-100">
            {menuItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-neutral-900">{item.name}</h4>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                      {item.category}
                    </span>
                  </div>
                  {item.description && <p className="text-neutral-400 text-[11px] mt-0.5">{item.description}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    {formatCurrency(item.price, config.currencySymbol)}
                  </span>
                  <button
                    onClick={() => onDeleteMenuItem(item.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: QR Code Generator */}
      {activeTab === 'qr' && (
        <Card className="flex flex-col gap-5">
          <div className="border-b border-neutral-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Table QR Code Generator</h3>
              <p className="text-xs text-neutral-500">Printable QR codes for each table so customers can scan, order & view live timer</p>
            </div>
            <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Print All QR Cards
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((t) => {
              const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
              const targetUrl = `${currentOrigin}/?tableId=${t.id}`;

              return (
                <div key={t.id} className="p-5 rounded-2xl border border-neutral-200 bg-white flex flex-col items-center text-center shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-extrabold font-mono text-sm mb-1">
                    #{t.number.toString().padStart(2, '0')}
                  </div>
                  <h4 className="font-bold text-neutral-900 text-sm">{t.name}</h4>
                  <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-2">{t.type} Table</p>

                  <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs my-1 flex items-center justify-center">
                    <QRCodeComponent value={targetUrl} size={112} alt={`QR Code ${t.number}`} />
                  </div>

                  <p className="text-[10px] text-neutral-400 mt-1 mb-3">Scan for Customer Check-in & Ordering</p>

                  {onShowQRCode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center text-xs"
                      leftIcon={<QrCode className="w-3.5 h-3.5" />}
                      onClick={() => onShowQRCode(t)}
                    >
                      Print / Download PNG
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 6: Backup & System Security */}
      {activeTab === 'backup' && (
        <Card className="flex flex-col gap-6">
          <div className="border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-neutral-900">Database Backup & Production Reliability</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Export full club snapshots, restore database state, and review system security logs
            </p>
          </div>

          {backupMsg && (
            <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs font-medium flex items-center justify-between">
              <span>{backupMsg}</span>
              <button onClick={() => setBackupMsg(null)} className="text-neutral-400 hover:text-white font-bold ml-2">×</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Export Card */}
            <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between gap-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-sm">Download Club Backup JSON</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Generates an offline, structured backup snapshot containing all settings, table states, session history, menu items, and audit logs.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleExportBackup}
                disabled={isExporting}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full justify-center"
              >
                {isExporting ? 'Generating Snapshot...' : 'Export Backup JSON'}
              </Button>
            </div>

            {/* Restore Card */}
            <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between gap-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-sm font-sans">Restore Club Snapshot</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Upload a previously exported `.json` snapshot file to restore system settings, table configurations, and menu catalogs.
                </p>
              </div>

              <label className="w-full">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  disabled={isRestoring}
                  className="hidden"
                />
                <div className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{isRestoring ? 'Restoring Database...' : 'Upload & Restore Snapshot'}</span>
                </div>
              </label>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="pt-4 border-t border-neutral-100">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">
              System Telemetry & Monitoring Events
            </h4>
            <div className="space-y-2">
              {getRecentMonitoringEvents().length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>All system security telemetry monitors report zero anomalies. System operating within normal thresholds.</span>
                </div>
              ) : (
                getRecentMonitoringEvents().map((e) => (
                  <div key={e.id} className="p-3 rounded-xl border border-neutral-200 bg-white text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 mr-2">
                        {e.type}
                      </span>
                      <span className="font-medium text-neutral-900">{e.message}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Danger Zone: High Privilege System Reset */}
          <div className="pt-6 border-t border-rose-200">
            <div className="p-5 rounded-2xl bg-rose-950/5 border border-rose-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-rose-950 text-sm">⚠️ High Security — Danger Zone</h4>
                  <p className="text-xs text-rose-800">
                    High privilege actions. Wiping records cannot be undone. Requires typing confirmation word <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-bold">RESET</code>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-white border border-rose-200 flex flex-col justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-neutral-900 text-xs">Clear Sales & Session History</h5>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Clears all completed bill history receipts and revenue counters to ₹0.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setDangerTarget('history');
                      setResetConfirmText('');
                      setDangerModalOpen(true);
                    }}
                    className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 justify-center font-bold"
                  >
                    Reset Sales History
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-white border border-rose-200 flex flex-col justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-neutral-900 text-xs">Full Club Data Reset</h5>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Resets sales history, telemetry logs, and restores clean slate for client handover.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setDangerTarget('all');
                      setResetConfirmText('');
                      setDangerModalOpen(true);
                    }}
                    className="bg-rose-600 text-white hover:bg-rose-700 border-none justify-center font-bold"
                  >
                    Full Club Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* DANGER ZONE CONFIRMATION MODAL */}
      {dangerModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Confirm Data Reset
              </h3>
              <button
                onClick={() => {
                  setDangerModalOpen(false);
                  setResetConfirmText('');
                }}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed font-medium">
                ⚠️ You are about to permanently delete <strong>{dangerTarget === 'all' ? 'ALL sales history and telemetry logs' : 'sales session history'}</strong> for <strong>{config.clubName}</strong>.
              </div>

              <div>
                <label className="font-extrabold text-neutral-800 block mb-1">
                  Type <span className="font-mono text-rose-600 font-black">RESET</span> below to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type RESET here..."
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm font-mono font-bold tracking-widest uppercase outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDangerModalOpen(false);
                  setResetConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={resetConfirmText.trim().toUpperCase() !== RESET_KEYWORD || isClearingHistory}
                onClick={async () => {
                  if (resetConfirmText.trim().toUpperCase() !== RESET_KEYWORD) return;
                  setIsClearingHistory(true);
                  try {
                    await clearHistoryAndAnalytics(config.id);
                    setClearSuccess(true);
                    setDangerModalOpen(false);
                    setResetConfirmText('');
                    setTimeout(() => setClearSuccess(false), 4000);
                  } catch (err) {
                    alert('Error clearing data: ' + err);
                  } finally {
                    setIsClearingHistory(false);
                  }
                }}
                className={`transition-all ${
                  resetConfirmText.trim().toUpperCase() === RESET_KEYWORD
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-none'
                }`}
              >
                {isClearingHistory ? 'Deleting...' : 'PERMANENTLY DELETE DATA'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Hourly Pricing Management */}
      {activeTab === 'rates' && (
        <Card className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Hourly Pricing & Rate Management</h3>
              <p className="text-xs text-neutral-500">Set base hourly rates per table type, configure peak-hour pricing and weekend multipliers</p>
            </div>
          </div>

          {/* Per-Table Rate Editor */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Individual Table Rates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-900">#{t.number}</span>
                      <span className="uppercase font-semibold text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">{t.type}</span>
                    </div>
                    <p className="font-semibold text-neutral-800 text-xs mt-0.5 truncate max-w-[140px]">{t.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-400">{config.currencySymbol}</span>
                    <input
                      type="number"
                      defaultValue={t.hourlyRate}
                      min={0}
                      step={10}
                      onBlur={(e) => {
                        const newRate = Number(e.target.value);
                        if (newRate > 0 && newRate !== t.hourlyRate) {
                          onAddTable({ ...t, hourlyRate: newRate } as any);
                        }
                      }}
                      className="w-20 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-neutral-900 text-center outline-none focus:border-neutral-900"
                    />
                    <span className="text-xs text-neutral-400 font-medium">/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Rate Multipliers */}
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Global Rate Multipliers</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Weekend Rate Multiplier</label>
                <p className="text-[10px] text-neutral-400 mb-2">Applied on Saturday & Sunday (e.g., 1.5 = 50% extra)</p>
                <input
                  type="number"
                  step="0.1"
                  min={1}
                  max={3}
                  value={businessForm.weekendRateMultiplier || 1}
                  onChange={(e) => setBusinessForm({ ...businessForm, weekendRateMultiplier: Number(e.target.value) })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Peak Hours Multiplier (After 6 PM)</label>
                <p className="text-[10px] text-neutral-400 mb-2">Auto-applied for sessions starting between 6 PM – 12 AM</p>
                <input
                  type="number"
                  step="0.1"
                  min={1}
                  max={3}
                  value={businessForm.happyHourRateMultiplier || 1}
                  onChange={(e) => setBusinessForm({ ...businessForm, happyHourRateMultiplier: Number(e.target.value) })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />} onClick={() => {
              onUpdateConfig(businessForm);
              setIsSaved(true);
              setTimeout(() => setIsSaved(false), 2000);
            }}>
              {isSaved ? 'Saved ✓' : 'Save Rate Rules'}
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 6: Staff Roles & Privileges Management Console */}
      {activeTab === 'employees' && (
        <Card className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Staff Roles & Dashboard Privileges Management
              </h3>
              <p className="text-xs text-neutral-500">Owner control panel: add/remove staff roles, customize dashboard module permissions, and manage staff accounts.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddRoleModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Staff Role
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddStaffModal(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add Staff Account
              </Button>
            </div>
          </div>

          {/* Section 1: Role Hierarchy & Granular Privileges Matrix */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-neutral-600" />
              Role Privileges & Feature Access Control
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {rolesList.map((r) => {
                const isOwnerRole = r.id === 'owner';
                const roleBorderColor = r.baseRole === 'owner' ? 'border-amber-300 bg-amber-50/30' : r.baseRole === 'manager' ? 'border-emerald-300 bg-emerald-50/30' : r.baseRole === 'kitchen' ? 'border-purple-300 bg-purple-50/30' : 'border-blue-300 bg-blue-50/30';
                const roleHeaderColor = r.baseRole === 'owner' ? 'text-amber-900' : r.baseRole === 'manager' ? 'text-emerald-900' : r.baseRole === 'kitchen' ? 'text-purple-900' : 'text-blue-900';
                const RoleIcon = r.baseRole === 'owner' ? Crown : r.baseRole === 'manager' ? ShieldCheck : r.baseRole === 'kitchen' ? ChefHat : Users;

                const togglePerm = (permKey: keyof typeof r.permissions) => {
                  if (isOwnerRole) return; // Owner permissions cannot be revoked
                  setRolesList((prev) =>
                    prev.map((item) =>
                      item.id === r.id
                        ? {
                            ...item,
                            permissions: {
                              ...item.permissions,
                              [permKey]: !item.permissions[permKey],
                            },
                          }
                        : item
                    )
                  );
                };

                const deleteRole = (roleId: string) => {
                  setRolesList((prev) => prev.filter((item) => item.id !== roleId));
                };

                return (
                  <div key={r.id} className={`p-4 rounded-2xl border-2 ${roleBorderColor} flex flex-col justify-between gap-3 shadow-2xs`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RoleIcon className={`w-5 h-5 ${r.baseRole === 'owner' ? 'text-amber-600' : r.baseRole === 'manager' ? 'text-emerald-600' : r.baseRole === 'kitchen' ? 'text-purple-600' : 'text-blue-600'}`} />
                          <h4 className={`font-extrabold text-sm ${roleHeaderColor}`}>{r.title}</h4>
                        </div>
                        {r.isCustom && (
                          <button
                            onClick={() => deleteRole(r.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                            title="Remove Custom Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-1">{r.description}</p>

                      {/* Permission Toggles */}
                      <div className="mt-3 pt-3 border-t border-neutral-200/80 space-y-2 text-xs font-medium">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Dashboard & CRM Rights:</p>

                        {[
                          { key: 'tableOps' as const, label: '🎱 Table Start / End / Snacks' },
                          { key: 'billingCheckout' as const, label: '💳 Billing & Checkout' },
                          { key: 'applyDiscount' as const, label: '🏷️ High Discount (>10%)' },
                          { key: 'foodInventory' as const, label: '📦 Food & Stock Inventory' },
                          { key: 'customerCredit' as const, label: '👥 Customer Credit Ledger' },
                          { key: 'reportsAnalytics' as const, label: '📊 Financial Reports' },
                          { key: 'clubSettings' as const, label: '⚙️ Club Settings & Rates' },
                          { key: 'shiftClosure' as const, label: '🔒 EOD Shift Closure' },
                          { key: 'dataReset' as const, label: '🔄 Reset System Analytics' },
                        ].map((p) => {
                          const isChecked = r.permissions[p.key];
                          return (
                            <label
                              key={p.key}
                              className={`flex items-center justify-between p-1.5 rounded-lg border transition-colors ${
                                isChecked ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-neutral-100/60 border-transparent text-neutral-400'
                              } ${isOwnerRole ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:border-neutral-300'}`}
                            >
                              <span className="text-[11px] font-semibold">{p.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isOwnerRole}
                                onChange={() => togglePerm(p.key)}
                                className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] text-neutral-400 font-mono text-center">
                      {isOwnerRole ? '🔒 Permanent Master Rights' : `${Object.values(r.permissions).filter(Boolean).length}/9 Permissions Enabled`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Staff Login Accounts Management */}
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-600" />
                Active Staff Login Accounts ({staffAccounts.length})
              </h4>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                New Staff User
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Name & Email</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Access Rights</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {staffAccounts.map((staff) => (
                    <tr key={staff.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{staff.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{staff.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={staff.role}
                          onChange={(e) => {
                            const newR = e.target.value;
                            setStaffAccounts((prev) =>
                              prev.map((item) =>
                                item.id === staff.id
                                  ? {
                                      ...item,
                                      role: newR,
                                      access: newR === 'owner' ? 'Full Admin' : newR === 'manager' ? 'Operational' : newR === 'kitchen' ? 'KDS & Inventory' : 'Counter Only',
                                    }
                                  : item
                              )
                            );
                          }}
                          className="bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-800 outline-none focus:border-neutral-900 cursor-pointer"
                        >
                          {rolesList.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-700">{staff.access}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setStaffAccounts((prev) =>
                              prev.map((item) =>
                                item.id === staff.id
                                  ? { ...item, status: item.status === 'Active' ? 'Suspended' : 'Active' }
                                  : item
                              )
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            staff.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {staff.status}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {staff.role !== 'owner' ? (
                          <button
                            onClick={() => setStaffAccounts((prev) => prev.filter((item) => item.id !== staff.id))}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Remove Staff Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-mono">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL: ADD CUSTOM STAFF ROLE */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Create New Custom Staff Role
              </h3>
              <button onClick={() => setShowAddRoleModal(false)} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Role Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Floor Supervisor, Senior Cashier..."
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Role Description</label>
                <input
                  type="text"
                  placeholder="e.g. Manages arena floor and customer billing"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Base Access Profile</label>
                <select
                  value={newRoleBase}
                  onChange={(e) => setNewRoleBase(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 outline-none focus:border-neutral-900 font-bold"
                >
                  <option value="cashier">Counter Staff Level</option>
                  <option value="manager">Manager Level</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setShowAddRoleModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newRoleTitle.trim()}
                onClick={() => {
                  const roleId = `custom_${Date.now()}`;
                  setRolesList((prev) => [
                    ...prev,
                    {
                      id: roleId,
                      title: newRoleTitle.toUpperCase(),
                      description: newRoleDesc || 'Custom staff role created by owner.',
                      baseRole: newRoleBase,
                      isCustom: true,
                      permissions: {
                        tableOps: true,
                        billingCheckout: true,
                        applyDiscount: newRoleBase === 'manager',
                        foodInventory: newRoleBase === 'manager',
                        customerCredit: true,
                        reportsAnalytics: newRoleBase === 'manager',
                        clubSettings: false,
                        shiftClosure: true,
                        dataReset: false,
                      },
                    },
                  ]);
                  setNewRoleTitle('');
                  setNewRoleDesc('');
                  setShowAddRoleModal(false);
                }}
              >
                Create Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF ACCOUNT */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Add Staff Login Account
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Email / Username *</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@rocket147.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Assign Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 outline-none focus:border-neutral-900 font-bold"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setShowAddStaffModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newStaffName.trim() || !newStaffEmail.trim()}
                onClick={() => {
                  setStaffAccounts((prev) => [
                    ...prev,
                    {
                      id: `staff_${Date.now()}`,
                      name: newStaffName,
                      email: newStaffEmail,
                      role: newStaffRole,
                      status: 'Active',
                      access: newStaffRole === 'owner' ? 'Full Admin' : newStaffRole === 'manager' ? 'Operational' : 'Counter Only',
                    },
                  ]);
                  setNewStaffName('');
                  setNewStaffEmail('');
                  setShowAddStaffModal(false);
                }}
              >
                Save Staff User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

