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
  EyeOff
} from 'lucide-react';
import { TableItem, MenuItem, BusinessConfig, TableType, TopCustomer, SessionHistoryItem, EmployeeUser } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPerMinuteRate } from '../../utils/formatters';
import { exportClubBackup, downloadBackupFile, restoreClubBackup, ClubBackupSnapshot } from '../../utils/backupService';
import { getAvailableAutoSnapshots, restoreAutoSnapshot, performDailyAutoSnapshot } from '../../utils/autoSnapshot';
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
  | 'billing'
  | 'credit'
  | 'reports'
  | 'backup'
  | 'notifications'
  | 'security'
  | 'health'
  | 'about'
  | 'danger';

interface SettingsViewProps {
  config: BusinessConfig;
  tables: TableItem[];
  menuItems: MenuItem[];
  employees?: EmployeeUser[];
  history?: SessionHistoryItem[];
  customers?: TopCustomer[];
  onUpdateConfig: (newConfig: BusinessConfig) => void;
  onAddTable: (table: Omit<TableItem, 'id' | 'status'>) => void;
  onEditTable?: (table: TableItem) => void;
  onDeleteTable: (tableId: string) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onEditMenuItem?: (item: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onSaveEmployee?: (emp: EmployeeUser) => void;
  onDeleteEmployee?: (empId: string) => void;
  onResetClub?: (type: 'all' | 'history' | 'crm') => Promise<void>;
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
  onResetClub,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('profile');

  // Business Config Form State
  const [businessForm, setBusinessForm] = useState<BusinessConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  // Stations State
  const [showAddTable, setShowAddTable] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState<TableType>('snooker');
  const [newTableRate, setNewTableRate] = useState<number>(300.00);

  // Menu State
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCat, setNewMenuCat] = useState<'drinks' | 'snacks' | 'food' | 'tea_coffee' | 'cold_drinks' | 'instant_food' | 'accessories'>('cold_drinks');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(120.00);
  const [newMenuCost, setNewMenuCost] = useState<number>(60.00);
  const [newMenuStock, setNewMenuStock] = useState<number>(50);

  const { user, updateUserPassword, sendPasswordReset } = useAuth();

  // Staff State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'owner' | 'manager' | 'cashier' | 'kitchen'>('cashier');

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

  // Danger Zone State
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerTarget, setDangerTarget] = useState<'history' | 'crm' | 'all' | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const RESET_KEYWORD = 'RESET ONESHOT';
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Developer Tools Hidden Drawer
  const [showDevDrawer, setShowDevDrawer] = useState(false);
  const [versionClickCount, setVersionClickCount] = useState(0);

  // Handle saving general config
  const handleSaveConfig = () => {
    onUpdateConfig(businessForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // 13 Navigation Tabs Definition
  const sections: { id: SettingsSectionId; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'profile', label: 'Club Profile', icon: Building2 },
    { id: 'stations', label: 'Gaming Stations', icon: Grid2X2, badge: `${tables.length}` },
    { id: 'staff', label: 'Staff & Roles', icon: Users },
    { id: 'menu', label: 'Menu & Food', icon: Utensils, badge: `${menuItems.length}` },
    { id: 'billing', label: 'Billing Settings', icon: Receipt },
    { id: 'credit', label: 'Customer & Credit', icon: CreditCard },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'backup', label: 'Backup & Restore', icon: HardDrive },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Audit', icon: ShieldCheck },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'about', label: 'About CueDesk', icon: Info },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, badge: 'Wipe' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <span>Club Management Panel</span>
            <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              One Shot Pro
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure gaming stations, rates, staff permissions, menu catalog, and data safety.
          </p>
        </div>

        {/* Global Save Button for configuration forms */}
        {(activeSection === 'profile' || activeSection === 'billing' || activeSection === 'credit' || activeSection === 'notifications') && (
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveConfig}
            leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            className="self-start sm:self-auto shadow-sm"
          >
            {isSaved ? 'Saved to Cloud' : 'Save Changes'}
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
            const isDanger = sec.id === 'danger';

            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? isDanger
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-neutral-900 text-white shadow-xs'
                    : isDanger
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDanger ? 'text-rose-600' : 'text-neutral-400'}`} />
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
                    placeholder="e.g. Premium Cue Sports & Gaming Arena"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-neutral-700 block mb-1">Physical Venue Address</label>
                  <Input
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    placeholder="e.g. Level 2, Grand Arena Plaza, Metro Ave"
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
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Business Number</span>
                  </label>
                  <Input
                    value={businessForm.whatsappNumber || businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, whatsappNumber: e.target.value })}
                    placeholder="+91 98765 43210"
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
                    setNewTableRate(180.00);
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
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-neutral-600 border border-neutral-200">
                          {tbl.type.replace('_', ' ')}
                        </span>
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
                            setNewTableType(tbl.type);
                            setNewTableRate(tbl.hourlyRate);
                            setShowAddTable(true);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 cursor-pointer"
                          title="Edit Station"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove station "${tbl.name}"?`)) {
                              onDeleteTable(tbl.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
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
                        {editingTable ? 'Edit Station' : 'Add New Gaming Station'}
                      </h4>
                      <button onClick={() => setShowAddTable(false)} className="p-1 text-neutral-400 hover:text-black">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Station Name</label>
                        <Input
                          value={newTableName}
                          onChange={(e) => setNewTableName(e.target.value)}
                          placeholder="e.g. Snooker Match Star 03"
                        />
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
                              name: newTableName.trim(),
                              type: newTableType,
                              hourlyRate: newTableRate,
                              perMinuteRate: Number((newTableRate / 60).toFixed(2))
                            });
                          } else {
                            onAddTable({
                              number: tables.length + 1,
                              name: newTableName.trim(),
                              type: newTableType,
                              hourlyRate: newTableRate,
                              perMinuteRate: Number((newTableRate / 60).toFixed(2)),
                              isMaintenance: false
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
                  <p className="text-xs text-neutral-500 mt-0.5">Role-based credentials for Owner, Managers, Cashiers, and Kitchen display.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowAddStaff(true)}
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
                            emp.role === 'kitchen' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                            'bg-blue-100 text-blue-900 border-blue-300'
                          }`}>
                            {emp.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">{emp.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
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
                  <li><strong>Owner:</strong> Full system access, financials, destructive wipes, and cloud database tools.</li>
                  <li><strong>Manager:</strong> Daily shift closures, financial reports, expense recording, and station management.</li>
                  <li><strong>Cashier / Desk:</strong> Session timers, billing checkout, snacks additions, and customer dues.</li>
                  <li><strong>Kitchen Staff:</strong> Kitchen Display (KDS) order management screen at <code>/kds</code>.</li>
                </ul>
              </div>

              {/* Add Staff Modal */}
              {showAddStaff && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-extrabold text-neutral-900 text-sm">Add Staff Account</h4>
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
                        <label className="font-bold text-neutral-700 block mb-1">Email Address</label>
                        <Input
                          type="email"
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          placeholder="staff@oneshotsnooker.com"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Phone Number</label>
                        <Input
                          value={newStaffPhone}
                          onChange={(e) => setNewStaffPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Assigned Role</label>
                        <select
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value as any)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold"
                        >
                          <option value="cashier">Cashier / Desk Marker</option>
                          <option value="manager">Club Manager</option>
                          <option value="kitchen">Kitchen / KDS Operator</option>
                          <option value="owner">Club Owner</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => setShowAddStaff(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!newStaffName.trim() || !newStaffEmail.trim()) return;
                          if (onSaveEmployee) {
                            onSaveEmployee({
                              id: `emp-${Date.now()}`,
                              clubId: config.id,
                              name: newStaffName.trim(),
                              email: newStaffEmail.trim(),
                              phone: newStaffPhone.trim(),
                              role: newStaffRole,
                              joiningDate: new Date().toISOString().split('T')[0],
                              status: 'active'
                            });
                          }
                          setShowAddStaff(false);
                        }}
                      >
                        Create Account
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
                          if (!newEmpPassword || newEmpPassword.length < 6) {
                            setEmpPassMsg({ text: 'Password must be at least 6 characters.', isError: true });
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
                  <p className="text-xs text-neutral-500 mt-0.5">Items displayed on table order modals and Kitchen Display (KDS).</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingMenuItem(null);
                    setNewMenuName('');
                    setNewMenuPrice(120.00);
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
                      <h5 className="font-bold text-xs text-neutral-900 truncate">{item.name}</h5>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500 font-medium">
                        <span className="capitalize">{item.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Stock: {item.stockQuantity} units</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-extrabold text-xs text-neutral-900 font-mono">
                        {formatCurrency(item.price, config.currencySymbol)}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete menu item "${item.name}"?`)) {
                            onDeleteMenuItem(item.id);
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Menu Item Modal */}
              {showAddMenu && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-extrabold text-neutral-900 text-sm">Add Menu Item</h4>
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
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Selling Price ({config.currencySymbol})</label>
                          <Input
                            type="number"
                            value={newMenuPrice}
                            onChange={(e) => setNewMenuPrice(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Stock Quantity</label>
                          <Input
                            type="number"
                            value={newMenuStock}
                            onChange={(e) => setNewMenuStock(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => setShowAddMenu(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!newMenuName.trim()) return;
                          onAddMenuItem({
                            name: newMenuName.trim(),
                            category: newMenuCat,
                            price: newMenuPrice,
                            costPrice: newMenuCost,
                            stockQuantity: newMenuStock,
                            lowStockThreshold: 5,
                            available: true
                          });
                          setShowAddMenu(false);
                        }}
                      >
                        Save Item
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* 5. BILLING SETTINGS */}
          {/* ========================================================= */}
          {activeSection === 'billing' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Billing & Payment Rules</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Rates calculation, rounding rules, discounts, and payment methods.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Default Base Rate ({config.currencySymbol}/hr)</label>
                  <Input
                    type="number"
                    value={businessForm.defaultHourlyRate}
                    onChange={(e) => setBusinessForm({ ...businessForm, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Minimum Charge Duration (Minutes)</label>
                  <select
                    value={businessForm.minimumChargeMinutes || 30}
                    onChange={(e) => setBusinessForm({ ...businessForm, minimumChargeMinutes: parseInt(e.target.value) })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                  >
                    <option value={0}>No minimum charge (Pay exact seconds)</option>
                    <option value={15}>15 Minutes minimum</option>
                    <option value={30}>30 Minutes minimum</option>
                    <option value={60}>1 Hour minimum</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Cashier Max Discount Allowance (%)</label>
                  <Input
                    type="number"
                    value={businessForm.maxCashierDiscountPercent || 10}
                    onChange={(e) => setBusinessForm({ ...businessForm, maxCashierDiscountPercent: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Currency Rounding Rule</label>
                  <select
                    value={businessForm.roundingRule || 'nearest_1'}
                    onChange={(e) => setBusinessForm({ ...businessForm, roundingRule: e.target.value as any })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                  >
                    <option value="none">Exact cents / paise (no rounding)</option>
                    <option value="nearest_1">Round to nearest ₹1</option>
                    <option value="nearest_5">Round to nearest ₹5</option>
                    <option value="round_up">Always round UP to next ₹1</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Club UPI ID for QR Billing</label>
                  <Input
                    value={businessForm.upiId || 'oneshot@upi'}
                    onChange={(e) => setBusinessForm({ ...businessForm, upiId: e.target.value })}
                    placeholder="oneshot@upi"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">UPI Payee Business Name</label>
                  <Input
                    value={businessForm.upiName || 'One Shot Snooker Gaming Club'}
                    onChange={(e) => setBusinessForm({ ...businessForm, upiName: e.target.value })}
                    placeholder="One Shot Snooker Gaming Club"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 6. CUSTOMER & CREDIT */}
          {/* ========================================================= */}
          {activeSection === 'credit' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Customer & Credit (Udhaar) Rules</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Player credit limits, risk tiers, and automated WhatsApp reminder details.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Default Player Credit Limit ({config.currencySymbol})</label>
                  <Input
                    type="number"
                    value={businessForm.maxCreditLimit || 2000}
                    onChange={(e) => setBusinessForm({ ...businessForm, maxCreditLimit: parseFloat(e.target.value) || 0 })}
                  />
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    Cashiers will receive warnings when a player's balance exceeds this limit.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Credit Risk Classification</label>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-bold">● GOOD:</span>
                      <span className="text-neutral-600">&lt; 50% of credit limit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-700 font-bold">● MODERATE:</span>
                      <span className="text-neutral-600">50% – 99% of credit limit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-700 font-bold">● OVER LIMIT:</span>
                      <span className="text-neutral-600">100%+ (Checkout requires manager)</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-neutral-700 block mb-1">WhatsApp Reminder Message Template</label>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-700 leading-relaxed">
                    "Hello [Customer Name], gentle reminder from One Shot Snooker Gaming Club: you have an outstanding session balance of ₹[Amount Due]. Kindly clear via UPI to: {businessForm.upiId || 'oneshot@upi'}. Thank you!"
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 7. REPORTS & EXPORT */}
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
                    Automated daily snapshot saved in browser storage. Acts as emergency cache on the counter PC.
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
                      if (!myNewPass || myNewPass.length < 6) {
                        setMyPassMsg({ text: 'Password must be at least 6 characters.', isError: true });
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
                        if (selfEmp && onSaveEmployee) {
                          onSaveEmployee({ ...selfEmp, password: myNewPass });
                        }
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

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800">Auto Logout Timer</span>
                    <select className="p-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold">
                      <option value="4">After 4 Hours of Inactivity</option>
                      <option value="8">After 8 Hours of Inactivity</option>
                      <option value="never">Never (Stay Signed In on Counter PC)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Automatically signs out staff when counter computer is left unattended.
                  </p>
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
                onOpenDeveloperDrawer={() => setShowDevDrawer(true)}
              />
            </Card>
          )}

          {/* ========================================================= */}
          {/* 12. ABOUT CUEDESK */}
          {/* ========================================================= */}
          {activeSection === 'about' && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="CueDesk Logo"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-300 shadow-md cursor-pointer"
                  onClick={() => {
                    const next = versionClickCount + 1;
                    setVersionClickCount(next);
                    if (next >= 5) {
                      setShowDevDrawer(true);
                      setVersionClickCount(0);
                    }
                  }}
                  title="CueDesk One Shot OS"
                />
                <div>
                  <h3 className="text-lg font-black text-neutral-900 tracking-tight">CueDesk Pro OS</h3>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Custom Edition for One Shot Snooker Gaming Club
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Build: 2026.09-production • Cloud Firestore Realtime Engine
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-2 text-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Licensed Venue</span>
                  <span>One Shot Snooker Gaming Club</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Deployment Type</span>
                  <span className="text-emerald-700 font-bold">Cloud Production</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Customer Support</span>
                  <span>support@oneshotsnooker.com</span>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 13. DANGER ZONE */}
          {/* ========================================================= */}
          {activeSection === 'danger' && (
            <Card className="p-6 space-y-6 border-rose-200 bg-rose-50/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-rose-900">Danger Zone — Destructive Operations</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    High privilege actions. Data wiping cannot be undone. All actions require typing strict confirmation.
                  </p>
                </div>
              </div>

              {/* 3 Destructive Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Reset Sales History */}
                <div className="p-4 rounded-2xl bg-white border border-rose-200 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <h5 className="font-bold text-neutral-900 text-xs">Clear Sales & Revenue History</h5>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Wipes all billing receipts, session history, active timers, and revenue counters back to ₹0, keeping CRM players, catalog, and staff intact.
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
                    Reset Sales & Revenue
                  </Button>
                </div>

                {/* 2. Wipe CRM Database */}
                <div className="p-4 rounded-2xl bg-white border border-rose-200 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <h5 className="font-bold text-neutral-900 text-xs">Wipe CRM Customer Database</h5>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Deletes all customer profiles, contact numbers, and credit/udhaar ledgers from CRM, keeping sales history and tables intact.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setDangerTarget('crm');
                      setResetConfirmText('');
                      setDangerModalOpen(true);
                    }}
                    className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 justify-center font-bold"
                  >
                    Wipe CRM Database
                  </Button>
                </div>

                {/* 3. Full Club Reset */}
                <div className="p-4 rounded-2xl bg-white border border-rose-300 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <h5 className="font-bold text-rose-900 text-xs">Full Club Factory Reset</h5>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Completely wipes all sales receipts, revenue, CRM customers, orders, expenses, and restores all tables to fresh empty state.
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
                    className="bg-rose-600 text-white hover:bg-rose-700 border-none justify-center font-bold shadow-xs"
                  >
                    Full Factory Reset
                  </Button>
                </div>
              </div>

              {clearSuccess && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Operation completed: Data successfully wiped.</span>
                </div>
              )}
            </Card>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* DANGER ZONE CONFIRMATION MODAL (Strict RESET ONESHOT) */}
      {/* ========================================================= */}
      {dangerModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Confirm High-Privilege Wipe</span>
              </h3>
              <button
                onClick={() => {
                  setDangerModalOpen(false);
                  setResetConfirmText('');
                }}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed font-medium">
                ⚠️ You are about to permanently delete{' '}
                <strong>
                  {dangerTarget === 'all'
                    ? 'ALL club data: sales receipts, revenue, CRM customer database, orders, and telemetry logs'
                    : dangerTarget === 'crm'
                    ? 'ALL CRM customer records, phone numbers, and credit/udhaar ledgers'
                    : 'all billing receipts, session history, and revenue counters'}
                </strong>{' '}
                for <strong>{config.clubName}</strong>.
              </div>

              <div>
                <label className="font-extrabold text-neutral-800 block mb-1">
                  Type <span className="font-mono text-rose-600 font-black tracking-wider">RESET ONESHOT</span> below to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type RESET ONESHOT here..."
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm font-mono font-bold tracking-wider uppercase outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
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
                    const target = dangerTarget || 'all';
                    if (onResetClub) {
                      await onResetClub(target);
                    }
                    setClearSuccess(true);
                    setDangerModalOpen(false);
                    setResetConfirmText('');
                    setTimeout(() => setClearSuccess(false), 5000);
                  } catch (err: any) {
                    alert('Error clearing data: ' + (err?.message || err));
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
                {isClearingHistory ? 'Wiping Data...' : 'PERMANENTLY DELETE DATA'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* HIDDEN DEVELOPER DRAWER (Accessible via ?dev=true or click) */}
      {/* ========================================================= */}
      {showDevDrawer && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <span>Developer Diagnostics & Overrides</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Internal developer tool for checking direct database connection strings.
                </p>
              </div>
              <button onClick={() => setShowDevDrawer(false)} className="p-1 text-neutral-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <FirebaseConnectSection currentClubId={config.id} />

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowDevDrawer(false)}>
                Close Developer Tool
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
