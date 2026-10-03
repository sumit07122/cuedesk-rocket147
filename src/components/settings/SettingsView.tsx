import React, { useState } from 'react';
import { 
  Building2, 
  Grid2X2, 
  Users, 
  Utensils, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  HardDrive, 
  Bell, 
  ShieldCheck, 
  Activity, 
  Info, 
  AlertTriangle,
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Save, 
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle2,
  X,
  Lock,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  Eye,
  EyeOff,
  Database
} from 'lucide-react';
import { TableItem, MenuItem, BusinessConfig, TableType, TopCustomer, SessionHistoryItem, EmployeeUser } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPerMinuteRate } from '../../utils/formatters';
import { exportClubBackup, downloadBackupFile, restoreClubBackup, ClubBackupSnapshot } from '../../utils/backupService';
import { 
  exportSalesToExcel, 
  exportCreditLedgerToExcel, 
  exportInventoryToExcel, 
  exportEmployeesToExcel,
  exportCustomerCreditLedgerCSV,
  exportBillingHistoryCSV
} from '../../utils/excelExport';
import { SystemHealthSection } from './SystemHealthSection';
import { FirebaseConnectSection } from './FirebaseConnectSection';

export type SettingsSectionId = 
  | 'profile'
  | 'stations'
  | 'staff'
  | 'menu'
  | 'reports'
  | 'backup'
  | 'firebase'
  | 'notifications'
  | 'security'
  | 'health';

interface SettingsViewProps {
  config: BusinessConfig;
  tables: TableItem[];
  menuItems: MenuItem[];
  employees?: EmployeeUser[];
  history?: SessionHistoryItem[];
  customers?: TopCustomer[];
  onUpdateConfig: (newConfig: BusinessConfig) => void | Promise<void>;
  onAddTable: (table: Omit<TableItem, 'id' | 'status'>) => void;
  onEditTable?: (table: TableItem) => void;
  onDeleteTable: (tableId: string) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onEditMenuItem?: (item: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onSaveEmployee?: (emp: EmployeeUser) => void;
  onDeleteEmployee?: (empId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  tables,
  menuItems,
  employees = [],
  history = [],
  customers = [],
  onUpdateConfig,
  onAddTable,
  onEditTable,
  onDeleteTable,
  onAddMenuItem,
  onEditMenuItem,
  onDeleteMenuItem,
  onSaveEmployee,
  onDeleteEmployee,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('profile');

  // Business Config Form State
  const [businessForm, setBusinessForm] = useState<BusinessConfig>(config);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Stations State
  const [showAddTable, setShowAddTable] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableNumber, setNewTableNumber] = useState<number>(1);
  const [newTableType, setNewTableType] = useState<TableType>('snooker');
  const [newTableRate, setNewTableRate] = useState<number>(config.defaultHourlyRate || 180);

  // Menu State
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCat, setNewMenuCat] = useState<string>('cold_drinks');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(120.00);
  const [newMenuCost, setNewMenuCost] = useState<number>(60.00);
  const [newMenuStock, setNewMenuStock] = useState<number>(50);
  const [newMenuLowStock, setNewMenuLowStock] = useState<number>(5);
  const [newMenuAvailable, setNewMenuAvailable] = useState<boolean>(true);

  const { user, updateUserPassword, sendPasswordReset } = useAuth();

  // Staff State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<EmployeeUser | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'owner' | 'manager' | 'worker'>('manager');
  const [newStaffStatus, setNewStaffStatus] = useState<'active' | 'suspended'>('active');

  // Staff Password Change Modal State
  const [passwordModalEmp, setPasswordModalEmp] = useState<EmployeeUser | null>(null);
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [confirmEmpPassword, setConfirmEmpPassword] = useState('');
  const [showEmpPass, setShowEmpPass] = useState(false);
  const [empPassMsg, setEmpPassMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdatingEmpPass, setIsUpdatingEmpPass] = useState(false);

  // Self Account Password State
  const [myNewPass, setMyNewPass] = useState('');
  const [myConfirmPass, setMyConfirmPass] = useState('');
  const [myPassMsg, setMyPassMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdatingMyPass, setIsUpdatingMyPass] = useState(false);

  // Backup State
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setBusinessForm(config);
    setNewTableRate(config.defaultHourlyRate || 180);
  }, [config]);

  // Handle saving general config
  const handleSaveConfig = async () => {
    if (!businessForm.clubName.trim()) {
      alert('Enter the club name before saving.');
      return;
    }
    if (!businessForm.currencySymbol.trim() || !businessForm.currencyCode.trim()) {
      alert('Enter a currency symbol and code.');
      return;
    }
    const hourlyRate = Number(businessForm.defaultHourlyRate);
    const minimumMinutes = Number(businessForm.minimumChargeMinutes || 0);
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0 || !Number.isFinite(minimumMinutes) || minimumMinutes < 0) {
      alert('Enter a valid hourly rate and a minimum charge time of zero or more minutes.');
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: businessForm.timeZone || 'Asia/Kolkata' });
    } catch {
      alert('Enter a valid time zone, such as Asia/Kolkata.');
      return;
    }
    setIsSavingConfig(true);
    try {
      await onUpdateConfig({
        ...businessForm,
        clubName: businessForm.clubName.trim(),
        currencySymbol: businessForm.currencySymbol.trim(),
        currencyCode: businessForm.currencyCode.trim().toUpperCase(),
        defaultHourlyRate: hourlyRate,
        minimumChargeMinutes: minimumMinutes,
        timeZone: businessForm.timeZone?.trim() || 'Asia/Kolkata',
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: any) {
      alert(error?.message || 'Club settings could not be saved. Check your connection and try again.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Navigation Tabs Definition
  const sections: { id: SettingsSectionId; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'profile', label: 'Club Profile', icon: Building2 },
    { id: 'stations', label: 'Gaming Stations', icon: Grid2X2, badge: `${tables.length}` },
    { id: 'menu', label: 'Menu & Food', icon: Utensils, badge: `${menuItems.length}` },
    { id: 'staff', label: 'Staff & Roles', icon: Users, badge: `${employees.length}` },
    { id: 'notifications', label: 'Alerts & Rules', icon: Bell },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'backup', label: 'Backup & Restore', icon: HardDrive },
    { id: 'security', label: 'Security & Audit', icon: ShieldCheck },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'firebase', label: 'Cloud Database', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <span>One Shot Gaming Club ERP</span>
            <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              One Shot OS
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure gaming stations, rates, staff permissions, menu catalog, and data safety.
          </p>
        </div>

        {/* Global Save Button for configuration forms */}
        {activeSection === 'profile' && (
          <Button
            variant="primary"
            size="md"
            onClick={() => void handleSaveConfig()}
            disabled={isSavingConfig}
            leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            className="self-start sm:self-auto shadow-sm"
          >
            {isSavingConfig ? 'Saving…' : isSaved ? 'Saved to Cloud' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Vertical Navigation Menu */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-neutral-200/90 p-2 sm:p-3 shadow-2xs space-y-1 sticky top-20">
          <div className="px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Management Sections
          </div>
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{sec.label}</span>
                </div>
                {sec.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Active Section Workspace */}
        <div className="lg:col-span-9 min-w-0">

          {/* ========================================================= */}
          {/* 1. CLUB PROFILE */}
          {/* ========================================================= */}
          {activeSection === 'profile' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Club Identity & Branding</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Details printed on customer billing receipts and displayed across staff screens.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Club Business Name</label>
                  <Input
                    value={businessForm.clubName}
                    onChange={(e) => setBusinessForm({ ...businessForm, clubName: e.target.value })}
                    placeholder="e.g. One Shot Snooker Gaming Club"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Club Tagline / Subtitle</label>
                  <Input
                    value={businessForm.tagline || ''}
                    onChange={(e) => setBusinessForm({ ...businessForm, tagline: e.target.value })}
                    placeholder="e.g. Local Snooker and Gaming Club"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-neutral-700 block mb-1">Physical Venue Address</label>
                  <Input
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    placeholder="Enter the club's address"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Contact Phone Number</span>
                  </label>
                  <Input
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                    placeholder="Enter the club phone number"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Business Number</span>
                  </label>
                  <Input
                    value={businessForm.whatsappNumber ?? ''}
                    onChange={(e) => setBusinessForm({ ...businessForm, whatsappNumber: e.target.value })}
                    placeholder="Optional WhatsApp number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-neutral-700 block mb-1">Receipt Printed Footer Message</label>
                  <Input
                    value={businessForm.receiptFooterMsg || ''}
                    onChange={(e) => setBusinessForm({ ...businessForm, receiptFooterMsg: e.target.value })}
                    placeholder="e.g. Thank you for playing at One Shot Snooker! Visit us again."
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Operating Hours</label>
                  <Input
                    value={businessForm.operatingHours || '10:00 AM – 11:00 PM'}
                    onChange={(e) => setBusinessForm({ ...businessForm, operatingHours: e.target.value })}
                    placeholder="10:00 AM – 11:00 PM"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Default Table Rate per Hour ({businessForm.currencySymbol || '₹'})</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={businessForm.defaultHourlyRate || ''}
                    onChange={(e) => setBusinessForm({ ...businessForm, defaultHourlyRate: Number(e.target.value) })}
                    placeholder="180"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Used when a new table is added. Each table can still have its own rate.</p>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Minimum Billing Time (minutes)</label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={businessForm.minimumChargeMinutes ?? 0}
                    onChange={(e) => setBusinessForm({ ...businessForm, minimumChargeMinutes: Number(e.target.value) })}
                    placeholder="0"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Set 0 for exact per-minute billing.</p>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Business Time Zone</label>
                  <Input
                    value={businessForm.timeZone || 'Asia/Kolkata'}
                    onChange={(e) => setBusinessForm({ ...businessForm, timeZone: e.target.value.trim() })}
                    placeholder="Asia/Kolkata"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Daily reports use this time zone even if the device is set differently.</p>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Currency Code & Symbol</label>
                  <div className="flex gap-2">
                    <Input
                      value={businessForm.currencySymbol}
                      onChange={(e) => setBusinessForm({ ...businessForm, currencySymbol: e.target.value })}
                      className="w-20 text-center font-bold"
                    />
                    <Input
                      value={businessForm.currencyCode}
                      onChange={(e) => setBusinessForm({ ...businessForm, currencyCode: e.target.value })}
                      className="flex-1 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Bill Total Rounding Rule</label>
                  <select
                    value={businessForm.roundingRule || 'nearest_1'}
                    onChange={(e) => setBusinessForm({ ...businessForm, roundingRule: e.target.value as any })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800"
                  >
                    <option value="nearest_1">Round to Nearest ₹1 (Recommended)</option>
                    <option value="round_up">Always Round Up to Next ₹1</option>
                    <option value="nearest_5">Round to Nearest ₹5</option>
                    <option value="none">Exact Decimal (Paise)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Tax / GST Configuration</label>
                  <div className="flex items-center gap-4 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                      <input
                        type="checkbox"
                        checked={Boolean(businessForm.enableTax)}
                        onChange={(e) => setBusinessForm({ ...businessForm, enableTax: e.target.checked })}
                        className="w-4 h-4 rounded text-neutral-900 accent-neutral-900"
                      />
                      <span>Enable Tax on Invoices</span>
                    </label>
                    {businessForm.enableTax && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-xs font-medium text-neutral-600">Rate (%):</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={businessForm.taxRatePercent || 0}
                          onChange={(e) => setBusinessForm({ ...businessForm, taxRatePercent: Number(e.target.value) })}
                          className="w-20 font-bold text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Dedicated Club Defaults */}
                <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-xs flex items-center gap-1.5">
                      <span>🎱</span>
                      <span>One Shot Gaming Club Dedicated Defaults</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Set all configurations to official One Shot Gaming Club presets (rates, currency, UPI, address).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBusinessForm({
                          ...businessForm,
                          clubName: 'One Shot Gaming Club',
                          tagline: 'Premium Cue Sports & Gaming Lounge',
                          address: 'Level 2, Grand Arena Plaza, Metro Ave',
                          phone: '+91 98765 43210',
                          whatsappNumber: '+91 98765 43210',
                          currencySymbol: '₹',
                          currencyCode: 'INR',
                          defaultHourlyRate: 200,
                          minimumChargeMinutes: 15,
                          upiId: 'oneshotgaming@upi',
                          upiName: 'One Shot Gaming Club',
                          receiptFooterMsg: 'Thank you for playing at One Shot Gaming Club! Visit again.',
                          operatingHours: '10:00 AM – 11:30 PM',
                          timeZone: 'Asia/Kolkata',
                          enableTax: false,
                          taxRatePercent: 0,
                          roundingRule: 'nearest_1',
                        });
                        alert('Official One Shot Gaming Club defaults loaded! Click "Save Changes" to save to database.');
                      }}
                      className="text-xs font-bold"
                    >
                      Load One Shot Defaults
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 2. GAMING STATIONS */}
          {/* ========================================================= */}
          {activeSection === 'stations' && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">Gaming Stations & Tables</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Manage tables, station types, hourly rates, and per-minute charging rules.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingTable(null);
                    setNewTableName(`Table 0${tables.length + 1}`);
                    setNewTableNumber(tables.length + 1);
                    setNewTableType('snooker');
                    setNewTableRate(config.defaultHourlyRate || 180);
                    setNewTableMaintenance(false);
                    setShowAddTable(true);
                  }}
                >
                  Add Station
                </Button>
              </div>

              {/* Stations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {tables.map((tbl) => (
                  <div
                    key={tbl.id}
                    className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-neutral-900">#{tbl.number}</span>
                          <span className="font-bold text-xs text-neutral-800">{tbl.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-neutral-600 border border-neutral-200">
                            {tbl.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <Badge variant={tbl.status === 'occupied' ? 'danger' : 'success'}>
                        {tbl.status === 'occupied' ? 'Active Session' : 'Ready'}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-neutral-900">
                          {formatPerMinuteRate(tbl.perMinuteRate ? tbl.perMinuteRate * 60 : tbl.hourlyRate, config.currencySymbol)}
                        </span>
                        <span className="text-[10px] text-neutral-500 ml-1">
                          ({formatCurrency(tbl.hourlyRate, config.currencySymbol)}/hr)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTable(tbl);
                            setNewTableName(tbl.name);
                            setNewTableNumber(tbl.number);
                            setNewTableType(tbl.type);
                            setNewTableRate(tbl.hourlyRate);
                            setNewTableMaintenance(Boolean(tbl.isMaintenance || tbl.status === 'maintenance'));
                            setShowAddTable(true);
                          }}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 cursor-pointer transition-colors"
                          title="Edit Station"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (tbl.status === 'occupied') {
                              alert('Cannot remove a station while an active gaming session is running.');
                              return;
                            }
                            if (confirm(`Remove station #${tbl.number} "${tbl.name}"?`)) {
                              onDeleteTable(tbl.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete Station"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Station Modal */}
              {showAddTable && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-extrabold text-neutral-900 text-sm">
                        {editingTable ? `Edit Station #${editingTable.number}` : 'Add New Gaming Station'}
                      </h4>
                      <button onClick={() => setShowAddTable(false)} className="p-1 text-neutral-400 hover:text-black">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="font-bold text-neutral-700 block mb-1">Number</label>
                          <Input
                            type="number"
                            min="1"
                            value={newTableNumber}
                            onChange={(e) => setNewTableNumber(parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="font-bold text-neutral-700 block mb-1">Station Name</label>
                          <Input
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                            placeholder="e.g. Snooker Match Star 03"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Station Category / Type</label>
                        <select
                          value={newTableType}
                          onChange={(e) => setNewTableType(e.target.value as TableType)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold"
                        >
                          <option value="snooker">Snooker Tournament Table</option>
                          <option value="pool">9ft American Pool Table</option>
                          <option value="american_pool">Brunswick Pro Pool Table</option>
                          <option value="table_tennis">Table Tennis Court</option>
                          <option value="magnet_board">Magnet Board Arena</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Hourly Billing Rate ({config.currencySymbol})</label>
                        <Input
                          type="number"
                          value={newTableRate}
                          onChange={(e) => setNewTableRate(parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-[11px] text-neutral-400 mt-1 block">
                          Calculates to exact {formatPerMinuteRate(newTableRate, config.currencySymbol)}
                        </span>
                      </div>

                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => setShowAddTable(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!newTableName.trim()) return;
                          if (editingTable && onEditTable) {
                            onEditTable({
                              ...editingTable,
                              number: newTableNumber,
                              name: newTableName.trim(),
                              type: newTableType,
                              hourlyRate: newTableRate,
                              perMinuteRate: Number((newTableRate / 60).toFixed(2))
                            });
                          } else {
                            onAddTable({
                              number: newTableNumber,
                              name: newTableName.trim(),
                              type: newTableType,
                              hourlyRate: newTableRate,
                              perMinuteRate: Number((newTableRate / 60).toFixed(2))
                            });
                          }
                          setShowAddTable(false);
                        }}
                      >
                        {editingTable ? 'Save Station' : 'Create Station'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* 3. STAFF & ROLES */}
          {/* ========================================================= */}
          {activeSection === 'staff' && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">Staff Accounts & Access Roles</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Role-based credentials for Owner, Manager, and Club Worker.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingStaff(null);
                    setNewStaffName('');
                    setNewStaffEmail('');
                    setNewStaffPhone('');
                    setNewStaffRole('manager');
                    setNewStaffStatus('active');
                    setShowAddStaff(true);
                  }}
                >
                  Add Staff Member
                </Button>
              </div>

              {/* Roster Table */}
              <div className="divide-y divide-neutral-100 border border-neutral-200/80 rounded-2xl overflow-hidden">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-4 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {emp.role.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-neutral-900 truncate">{emp.name}</h5>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            emp.role === 'owner' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            emp.role === 'manager' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                            'bg-sky-100 text-sky-900 border-sky-300'
                          }`}>
                            {emp.role === 'worker' ? 'Worker' : emp.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">
                          {emp.email} {emp.phone ? `• ${emp.phone}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setEditingStaff(emp);
                          setNewStaffName(emp.name);
                          setNewStaffEmail(emp.email);
                          setNewStaffPhone(emp.phone || '');
                          setNewStaffRole(emp.role as any);
                          setNewStaffStatus((emp.status as any) || 'active');
                          setShowAddStaff(true);
                        }}
                        className="text-[11px] h-8 px-2.5 bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800 font-bold"
                      >
                        Edit
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setPasswordModalEmp(emp);
                          setNewEmpPassword('');
                          setConfirmEmpPassword('');
                          setEmpPassMsg(null);
                        }}
                        className="text-[11px] h-8 px-2.5 bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-800 font-bold"
                      >
                        Password
                      </Button>
                      <Badge variant={emp.status === 'active' ? 'success' : 'neutral'}>
                        {emp.status}
                      </Badge>
                      {emp.role !== 'owner' && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove staff member ${emp.name}?`)) {
                              if (onDeleteEmployee) onDeleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Roles Explanation */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs space-y-2">
                <h5 className="font-bold text-neutral-800">Role Privilege Matrix</h5>
                <ul className="space-y-1 text-neutral-600 text-[11px] list-disc pl-4">
                  <li><strong>Owner:</strong> Full system access, financial reports, club settings, and staff credentials.</li>
                  <li><strong>Manager:</strong> Daily operations, financial reports, expense recording, and station management.</li>
                  <li><strong>Club Worker:</strong> Table sessions, billing & checkout, café orders, and customer CRM.</li>
                </ul>
              </div>

              {/* Add / Edit Staff Modal */}
              {showAddStaff && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-extrabold text-neutral-900 text-sm">
                        {editingStaff ? `Edit Staff Member (${editingStaff.name})` : 'Add Staff Account'}
                      </h4>
                      <button onClick={() => setShowAddStaff(false)} className="p-1 text-neutral-400 hover:text-black">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Full Name</label>
                        <Input
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Email Address (Login Username)</label>
                        <Input
                          type="email"
                          disabled={Boolean(editingStaff)}
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          placeholder="staff@oneshotsnooker.com"
                        />
                        {editingStaff && (
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Email cannot be changed after account creation.</span>
                        )}
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Phone Number</label>
                        <Input
                          value={newStaffPhone}
                          onChange={(e) => setNewStaffPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Assigned Role</label>
                          <select
                            value={newStaffRole}
                            onChange={(e) => setNewStaffRole(e.target.value as any)}
                            className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold"
                          >
                            <option value="worker">Club Worker</option>
                            <option value="manager">Club Manager</option>
                            <option value="owner">Club Owner</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Account Status</label>
                          <select
                            value={newStaffStatus}
                            onChange={(e) => setNewStaffStatus(e.target.value as any)}
                            className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => setShowAddStaff(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!newStaffName.trim() || !newStaffEmail.trim()) return;
                          if (editingStaff && onSaveEmployee) {
                            onSaveEmployee({
                              ...editingStaff,
                              name: newStaffName.trim(),
                              phone: newStaffPhone.trim(),
                              role: newStaffRole,
                              status: newStaffStatus
                            });
                          } else if (onSaveEmployee) {
                            onSaveEmployee({
                              id: `emp-${Date.now()}`,
                              clubId: config.id,
                              name: newStaffName.trim(),
                              email: newStaffEmail.trim(),
                              phone: newStaffPhone.trim(),
                              role: newStaffRole,
                              status: newStaffStatus,
                              joiningDate: new Date().toISOString().split('T')[0]
                            });
                          }
                          setShowAddStaff(false);
                          setEditingStaff(null);
                        }}
                      >
                        {editingStaff ? 'Save Changes' : 'Create Account'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Staff Password Modal */}
              {passwordModalEmp && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                          <Lock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-neutral-900 text-sm">Change User Password</h4>
                          <p className="text-[11px] text-neutral-500 font-medium">
                            {passwordModalEmp.name} • <span className="font-mono">{passwordModalEmp.email}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPasswordModalEmp(null)}
                        className="p-1 text-neutral-400 hover:text-black rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">New Password (min 6 chars)</label>
                        <div className="relative">
                          <Input
                            type={showEmpPass ? 'text' : 'password'}
                            placeholder="Enter new password..."
                            value={newEmpPassword}
                            onChange={(e) => setNewEmpPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmpPass(!showEmpPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          >
                            {showEmpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Confirm New Password</label>
                        <Input
                          type={showEmpPass ? 'text' : 'password'}
                          placeholder="Re-enter new password..."
                          value={confirmEmpPassword}
                          onChange={(e) => setConfirmEmpPassword(e.target.value)}
                        />
                      </div>

                      {empPassMsg && (
                        <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                          empPassMsg.isError
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {empPassMsg.text}
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!passwordModalEmp.email) return;
                            try {
                              await sendPasswordReset(passwordModalEmp.email);
                              setEmpPassMsg({
                                text: `Password reset email sent to ${passwordModalEmp.email}.`,
                                isError: false
                              });
                            } catch (err: any) {
                              setEmpPassMsg({
                                text: err.message || 'Could not send reset email.',
                                isError: true
                              });
                            }
                          }}
                          className="text-[11px] text-neutral-600 hover:text-neutral-900 underline font-semibold cursor-pointer"
                        >
                          Or send Firebase reset link to user email
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPasswordModalEmp(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isUpdatingEmpPass || !newEmpPassword || !confirmEmpPassword}
                        onClick={async () => {
                          if (!newEmpPassword || newEmpPassword.length < 4) {
                            setEmpPassMsg({ text: 'Password must be at least 4 characters.', isError: true });
                            return;
                          }
                          if (newEmpPassword !== confirmEmpPassword) {
                            setEmpPassMsg({ text: 'Passwords do not match.', isError: true });
                            return;
                          }

                          setIsUpdatingEmpPass(true);
                          try {
                            await updateUserPassword(passwordModalEmp.email, newEmpPassword);
                            if (onSaveEmployee) {
                              onSaveEmployee({
                                ...passwordModalEmp,
                                password: newEmpPassword
                              });
                            }
                            setEmpPassMsg({ text: `Password for ${passwordModalEmp.name} updated successfully!`, isError: false });
                            setTimeout(() => {
                              setPasswordModalEmp(null);
                            }, 1200);
                          } catch (err: any) {
                            setEmpPassMsg({ text: err.message || 'Failed to update password.', isError: true });
                          } finally {
                            setIsUpdatingEmpPass(false);
                          }
                        }}
                      >
                        {isUpdatingEmpPass ? 'Updating...' : 'Save New Password'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* 4. MENU & FOOD */}
          {/* ========================================================= */}
          {activeSection === 'menu' && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">Food & Beverage Catalog</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Items displayed on table order modals and café inventory.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingMenuItem(null);
                    setNewMenuName('');
                    setNewMenuCat('cold_drinks');
                    setNewMenuPrice(120.00);
                    setNewMenuCost(60.00);
                    setNewMenuStock(50);
                    setNewMenuLowStock(5);
                    setNewMenuAvailable(true);
                    setShowAddMenu(true);
                  }}
                >
                  Add Item
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-xs text-neutral-900 truncate">{item.name}</h5>
                        {item.available === false && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500 font-medium">
                        <span className="capitalize">{item.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Cost: {formatCurrency(item.costPrice || 0, config.currencySymbol)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Quick Stock Controls */}
                      <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (onEditMenuItem) {
                              const nextStock = Math.max(0, (item.stockQuantity ?? 0) - 1);
                              onEditMenuItem({ ...item, stockQuantity: nextStock });
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 rounded text-xs font-bold transition-colors cursor-pointer"
                          title="Decrease Stock"
                        >
                          -
                        </button>
                        <span className={`text-[11px] font-mono font-bold px-1.5 ${(item.stockQuantity ?? 0) <= (item.lowStockThreshold || 5) ? 'text-amber-600' : 'text-neutral-800'}`}>
                          {item.stockQuantity ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onEditMenuItem) {
                              const nextStock = (item.stockQuantity ?? 0) + 1;
                              onEditMenuItem({ ...item, stockQuantity: nextStock });
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 rounded text-xs font-bold transition-colors cursor-pointer"
                          title="Increase Stock"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-extrabold text-xs text-neutral-900 font-mono">
                        {formatCurrency(item.price, config.currencySymbol)}
                      </span>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMenuItem(item);
                          setNewMenuName(item.name);
                          setNewMenuCat(item.category);
                          setNewMenuPrice(item.price);
                          setNewMenuCost(item.costPrice || 0);
                          setNewMenuStock(item.stockQuantity ?? 0);
                          setNewMenuLowStock(item.lowStockThreshold || 5);
                          setNewMenuAvailable(item.available !== false);
                          setShowAddMenu(true);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 cursor-pointer transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete menu item "${item.name}"?`)) {
                            onDeleteMenuItem(item.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Menu Item Modal */}
              {showAddMenu && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-extrabold text-neutral-900 text-sm">
                        {editingMenuItem ? `Edit "${editingMenuItem.name}"` : 'Add Menu Item'}
                      </h4>
                      <button onClick={() => setShowAddMenu(false)} className="p-1 text-neutral-400 hover:text-black">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Item Name</label>
                        <Input
                          value={newMenuName}
                          onChange={(e) => setNewMenuName(e.target.value)}
                          placeholder="e.g. Masala Chai Cup"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Category</label>
                        <select
                          value={newMenuCat}
                          onChange={(e) => setNewMenuCat(e.target.value as any)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold"
                        >
                          <option value="tea_coffee">Tea & Coffee</option>
                          <option value="cold_drinks">Cold Drinks & Beverages</option>
                          <option value="snacks">Snacks & Sandwiches</option>
                          <option value="instant_food">Instant Cup Noodles</option>
                          <option value="accessories">Cue Accessories & Chalk</option>
                          <option value="desserts">Desserts & Ice Cream</option>
                          <option value="food">Kitchen Food</option>
                          <option value="other">Other Merchandise</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Selling Price ({config.currencySymbol})</label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={newMenuPrice}
                            onChange={(e) => setNewMenuPrice(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Purchase Cost ({config.currencySymbol})</label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={newMenuCost}
                            onChange={(e) => setNewMenuCost(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Stock Quantity</label>
                          <Input
                            type="number"
                            min="0"
                            value={newMenuStock}
                            onChange={(e) => setNewMenuStock(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Low Stock Alert Level</label>
                          <Input
                            type="number"
                            min="1"
                            value={newMenuLowStock}
                            onChange={(e) => setNewMenuLowStock(parseInt(e.target.value) || 5)}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                          <input
                            type="checkbox"
                            checked={newMenuAvailable}
                            onChange={(e) => setNewMenuAvailable(e.target.checked)}
                            className="w-4 h-4 rounded text-neutral-900 accent-neutral-900"
                          />
                          <div>
                            <span className="font-bold text-neutral-800 block text-xs">Available for Sale</span>
                            <span className="text-[10px] text-neutral-500 block">Show in table order lists and cashier menus</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => setShowAddMenu(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!newMenuName.trim()) return;
                          if (editingMenuItem && onEditMenuItem) {
                            onEditMenuItem({
                              ...editingMenuItem,
                              name: newMenuName.trim(),
                              category: newMenuCat,
                              price: newMenuPrice,
                              costPrice: newMenuCost,
                              stockQuantity: newMenuStock,
                              lowStockThreshold: newMenuLowStock,
                              available: newMenuAvailable
                            });
                          } else {
                            onAddMenuItem({
                              name: newMenuName.trim(),
                              category: newMenuCat,
                              price: newMenuPrice,
                              costPrice: newMenuCost,
                              stockQuantity: newMenuStock,
                              lowStockThreshold: newMenuLowStock,
                              available: newMenuAvailable
                            });
                          }
                          setShowAddMenu(false);
                          setEditingMenuItem(null);
                        }}
                      >
                        {editingMenuItem ? 'Save Changes' : 'Create Item'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* 5. REPORTS & EXPORT */}
          {/* ========================================================= */}
          {activeSection === 'reports' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Financial Reports & Data Export</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Download spreadsheets for accountant audits, tax records, and player credit dues.</p>
              </div>

              {/* 3 Export Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 shadow-2xs flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-neutral-900">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Customer Credit & Udhaar Ledger</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Download spreadsheet of all customer outstanding balances, credit limits, and contact phones.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => {
                      exportCustomerCreditLedgerCSV(customers, config.clubName);
                    }}
                    className="justify-center font-bold"
                  >
                    Export Credit Ledger (.csv)
                  </Button>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 shadow-2xs flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-neutral-900">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Complete Billing History</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Download spreadsheet of all settled bills, durations, table fees, food sales, and payment methods.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => {
                      exportBillingHistoryCSV(history, config.clubName);
                    }}
                    className="justify-center font-bold"
                  >
                    Export Sales History (.csv)
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 8. BACKUP & RESTORE */}
          {/* ========================================================= */}
          {activeSection === 'backup' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Backup & Disaster Recovery</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Understand where your club data lives and export complete JSON dumps for offline safekeeping.
                </p>
              </div>

              {/* 3-Tier Architecture Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>1. Cloud Firestore</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Primary live database. All table sessions, orders, and payments sync here in real time.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>2. Downloaded JSON</span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Manual file dump saved directly to your computer. Can be restored anytime with 1 click.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span>3. Local Browser Snapshot</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    A browser-only recovery copy saved on this device. It is not a cloud backup and can be lost if browser data is cleared.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  disabled={isExporting}
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      const snapshot = await exportClubBackup(config.id);
                      downloadBackupFile(snapshot, config.clubName);
                      setBackupMsg('Complete JSON backup downloaded to your computer!');
                      setTimeout(() => setBackupMsg(null), 4000);
                    } catch (e: any) {
                      alert('Export error: ' + e.message);
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                >
                  {isExporting ? 'Exporting...' : 'Download Complete JSON Backup'}
                </Button>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!confirm(`Restore data from "${file.name}"? This will overwrite current tables and catalog.`)) return;
                      setIsRestoring(true);
                      try {
                        const text = await file.text();
                        const snapshot = JSON.parse(text) as ClubBackupSnapshot;
                        await restoreClubBackup(config.id, snapshot);
                        alert('Database successfully restored from JSON backup!');
                        window.location.reload();
                      } catch (err: any) {
                        alert('Restore failed: ' + err.message);
                      } finally {
                        setIsRestoring(false);
                      }
                    }}
                  />
                  <div className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2">
                    <Upload className="w-4 h-4 text-neutral-500" />
                    <span>{isRestoring ? 'Restoring...' : 'Restore from JSON File'}</span>
                  </div>
                </label>
              </div>

              {backupMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{backupMsg}</span>
                </div>
              )}

              {/* Quick Excel Exports */}
              <div className="pt-4 border-t border-neutral-100">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel & Spreadsheet Exports (.csv)
                </h4>
                <p className="text-xs text-neutral-500 mb-3">
                  Download structured tabular datasets compatible with Microsoft Excel, Google Sheets, and accounting software.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => exportSalesToExcel(history, config.clubName)}
                  >
                    Sales History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => exportCreditLedgerToExcel(customers, config.clubName)}
                  >
                    Credit Ledger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => exportInventoryToExcel(menuItems, config.clubName)}
                  >
                    Menu Inventory
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => exportEmployeesToExcel(employees, config.clubName)}
                  >
                    Staff Roster
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* FIREBASE CLOUD DB */}
          {/* ========================================================= */}
          {activeSection === 'firebase' && (
            <FirebaseConnectSection currentClubId={config.id} />
          )}

          {/* ========================================================= */}
          {/* 9. NOTIFICATIONS */}
          {/* ========================================================= */}
          {activeSection === 'notifications' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Alerts & Staff Notification Rules</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Configure audio cues and desk alert banners for active operational events.</p>
              </div>

              <div className="space-y-4 text-xs divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h5 className="font-bold text-neutral-800">Kitchen Food Order Alerts</h5>
                    <p className="text-neutral-500 text-[11px]">Notify desk whenever an order is submitted or marked ready by kitchen.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-neutral-900 accent-neutral-900" />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h5 className="font-bold text-neutral-800">Table Session 2-Hour Reminder</h5>
                    <p className="text-neutral-500 text-[11px]">Display desk notice when a single session exceeds 120 minutes of play.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-neutral-900 accent-neutral-900" />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h5 className="font-bold text-neutral-800">Low Stock Inventory Warnings</h5>
                    <p className="text-neutral-500 text-[11px]">Show snack inventory warning when item stock drops below 5 units.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-neutral-900 accent-neutral-900" />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h5 className="font-bold text-neutral-800">Customer Over-Credit Alert</h5>
                    <p className="text-neutral-500 text-[11px]">Flag desk when player outstanding dues exceed their configured limit.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-neutral-900 accent-neutral-900" />
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 10. SECURITY & AUDIT */}
          {/* ========================================================= */}
          {activeSection === 'security' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Security & Session Management</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Control login sessions, account passwords, and review security access logs.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                  <h5 className="font-bold text-neutral-900">Change Account Password</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="password"
                      placeholder="New Password (min 6 characters)"
                      value={myNewPass}
                      onChange={(e) => setMyNewPass(e.target.value)}
                    />
                    <Input
                      type="password"
                      placeholder="Confirm New Password"
                      value={myConfirmPass}
                      onChange={(e) => setMyConfirmPass(e.target.value)}
                    />
                  </div>
                  {myPassMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                      myPassMsg.isError
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {myPassMsg.text}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUpdatingMyPass || !myNewPass || !myConfirmPass}
                    onClick={async () => {
                      if (!myNewPass || myNewPass.length < 4) {
                        setMyPassMsg({ text: 'Password must be at least 4 characters.', isError: true });
                        return;
                      }
                      if (myNewPass !== myConfirmPass) {
                        setMyPassMsg({ text: 'Passwords do not match.', isError: true });
                        return;
                      }
                      setIsUpdatingMyPass(true);
                      try {
                        const targetEmail = user?.email || 'owner@oneshotsnooker.com';
                        await updateUserPassword(targetEmail, myNewPass);
                        const selfEmp = employees.find((e) => e.email.toLowerCase() === targetEmail.toLowerCase() || e.role === (user?.role || 'owner'));
                        setMyPassMsg({ text: 'Your account password was updated successfully!', isError: false });
                        setMyNewPass('');
                        setMyConfirmPass('');
                      } catch (err: any) {
                        setMyPassMsg({ text: err.message || 'Failed to update password.', isError: true });
                      } finally {
                        setIsUpdatingMyPass(false);
                      }
                    }}
                  >
                    {isUpdatingMyPass ? 'Saving...' : 'Update Password'}
                  </Button>
                </div>

              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 11. SYSTEM HEALTH (Zero Sensitive Keys Exposed!) */}
          {/* ========================================================= */}
          {activeSection === 'health' && (
            <Card className="p-6">
              <SystemHealthSection
                currentClubId={config.id}
              />
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
