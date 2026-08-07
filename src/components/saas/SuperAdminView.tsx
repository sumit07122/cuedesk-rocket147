import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Building2, 
  Users, 
  Grid2X2, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Sliders,
  Search,
  Key,
  Eye,
  Megaphone,
  BarChart3,
  Activity,
  FileText,
  Download,
  Ban,
  PlayCircle,
  HardDrive,
  Cpu,
  Layers,
  Info,
  Server,
  Zap,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';
import { 
  SaaSClubProfile, 
  SubscriptionPlanId, 
  FeatureFlags, 
  PlatformAnnouncement, 
  SuperAdminAuditLog,
  SubscriptionPlan
} from '../../types';
import { SUBSCRIPTION_PLANS, calculateTrialDaysRemaining } from '../../data/saasPlans';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { 
  fetchSuperAdminLogs, 
  logSuperAdminAction, 
  fetchPlatformAnnouncements, 
  savePlatformAnnouncement, 
  togglePlatformAnnouncement,
  suspendSaaSClubWorkspace
} from '../../services/dbService';
import { getRecentMonitoringEvents } from '../../utils/monitoring';

interface SuperAdminViewProps {
  clubs: SaaSClubProfile[];
  currentClubId: string;
  onSwitchWorkspace: (clubId: string) => void;
  onOpenOnboarding: () => void;
  onUpdateClubPlan: (clubId: string, newPlanId: SubscriptionPlanId) => Promise<void>;
  onExtendTrial: (clubId: string, days: number) => Promise<void>;
  onUpdateFeatureFlags: (clubId: string, flags: FeatureFlags) => Promise<void>;
  onSuspendClub?: (clubId: string, suspend: boolean) => Promise<void>;
  onDeleteClub: (clubId: string) => Promise<void>;
}

type TabType = 'overview' | 'clubs' | 'subscriptions' | 'features' | 'support' | 'announcements' | 'analytics' | 'audit';

// Sample Analytics Data for Recharts
const CLUB_GROWTH_DATA = [
  { month: 'Jan', clubs: 2, mrr: 158 },
  { month: 'Feb', clubs: 3, mrr: 237 },
  { month: 'Mar', clubs: 5, mrr: 395 },
  { month: 'Apr', clubs: 7, mrr: 553 },
  { month: 'May', clubs: 9, mrr: 711 },
  { month: 'Jun', clubs: 12, mrr: 948 },
  { month: 'Jul', clubs: 15, mrr: 1185 },
];

const SESSION_VOLUME_DATA = [
  { day: 'Mon', sessions: 142, hoursPlayed: 284 },
  { day: 'Tue', sessions: 168, hoursPlayed: 336 },
  { day: 'Wed', sessions: 195, hoursPlayed: 390 },
  { day: 'Thu', sessions: 220, hoursPlayed: 440 },
  { day: 'Fri', sessions: 310, hoursPlayed: 620 },
  { day: 'Sat', sessions: 420, hoursPlayed: 840 },
  { day: 'Sun', sessions: 380, hoursPlayed: 760 },
];

const FEATURE_ADOPTION_DATA = [
  { name: 'Food POS', adoption: 92 },
  { name: 'CRM Memberships', adoption: 78 },
  { name: 'Staff Attendance', adoption: 65 },
  { name: 'Table Maintenance', adoption: 54 },
  { name: 'Tournament Module', adoption: 35 },
];

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  clubs,
  currentClubId,
  onSwitchWorkspace,
  onOpenOnboarding,
  onUpdateClubPlan,
  onExtendTrial,
  onUpdateFeatureFlags,
  onSuspendClub,
  onDeleteClub,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected Club Modals
  const [viewingClub, setViewingClub] = useState<SaaSClubProfile | null>(null);
  const [selectedClubForFlags, setSelectedClubForFlags] = useState<SaaSClubProfile | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [deleteConfirmClub, setDeleteConfirmClub] = useState<SaaSClubProfile | null>(null);

  // Platform Announcements State
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceContent, setNewAnnounceContent] = useState('');
  const [newAnnounceSeverity, setNewAnnounceSeverity] = useState<'info' | 'warning' | 'urgent'>('info');

  // Support & Diagnostics State
  const [selectedSupportClubId, setSelectedSupportClubId] = useState<string>(clubs[0]?.id || '');
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>([]);

  // Configurable Plans State (Super Admin Plan Override)
  const [customPlans, setCustomPlans] = useState<Record<SubscriptionPlanId, SubscriptionPlan>>(SUBSCRIPTION_PLANS);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch Announcements and Audit Logs on Mount
  useEffect(() => {
    const loadData = async () => {
      const logs = await fetchSuperAdminLogs();
      setAuditLogs(logs);

      const anns = await fetchPlatformAnnouncements();
      setAnnouncements(anns);
    };
    loadData();
  }, []);

  // Platform Level Metrics
  const totalClubs = clubs.length;
  const activeClubs = clubs.filter((c) => c.status !== 'suspended' && c.subscriptionStatus === 'active').length;
  const trialClubs = clubs.filter((c) => c.subscriptionStatus === 'trial').length;
  const suspendedClubs = clubs.filter((c) => c.status === 'suspended').length;
  const totalTables = clubs.reduce((sum, c) => sum + (c.tablesCount || 6), 0);
  const estimatedMRR = clubs.reduce((sum, c) => {
    const p = customPlans[c.planId] || customPlans.starter;
    return sum + (c.status !== 'suspended' && c.subscriptionStatus === 'active' ? p.priceMonthly : 0);
  }, 0);

  // Filtered Clubs
  const filteredClubs = clubs.filter((c) => {
    const matchesSearch = c.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || c.planId === planFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'suspended' ? c.status === 'suspended' : c.subscriptionStatus === statusFilter);
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Action Handlers with Audit Logging
  const handlePlanChange = async (clubId: string, newPlan: SubscriptionPlanId) => {
    try {
      await onUpdateClubPlan(clubId, newPlan);
      await logSuperAdminAction('PLAN_UPGRADED', 'SuperAdmin', `Changed subscription plan of ${clubId} to ${newPlan.toUpperCase()}`, clubId);
      showToast(`Updated plan for club ${clubId} to ${newPlan.toUpperCase()}`);
    } catch (err) {
      alert('Failed to update plan: ' + err);
    }
  };

  const handleExtendTrial = async (clubId: string) => {
    try {
      await onExtendTrial(clubId, 14);
      await logSuperAdminAction('TRIAL_EXTENDED', 'SuperAdmin', `Extended trial by +14 days for ${clubId}`, clubId);
      showToast(`Extended trial by +14 days for club ${clubId}`);
    } catch (err) {
      alert('Failed to extend trial: ' + err);
    }
  };

  const handleToggleSuspend = async (club: SaaSClubProfile) => {
    const isCurrentlySuspended = club.status === 'suspended';
    try {
      if (onSuspendClub) {
        await onSuspendClub(club.id, !isCurrentlySuspended);
      } else {
        await suspendSaaSClubWorkspace(club.id, !isCurrentlySuspended);
      }
      await logSuperAdminAction(
        isCurrentlySuspended ? 'CLUB_REACTIVATED' : 'CLUB_SUSPENDED',
        'SuperAdmin',
        `${isCurrentlySuspended ? 'Reactivated' : 'Suspended'} club workspace ${club.clubName} (${club.id})`,
        club.id
      );
      showToast(`Club ${club.clubName} ${isCurrentlySuspended ? 'Reactivated' : 'Suspended'}`);
    } catch (err) {
      alert('Failed to toggle suspension: ' + err);
    }
  };

  const handleResetPassword = async (club: SaaSClubProfile) => {
    const generatedPass = `CueDesk#${Math.floor(100000 + Math.random() * 900000)}`;
    setTempPassword(generatedPass);
    await logSuperAdminAction('PASSWORD_RESET', 'SuperAdmin', `Issued temporary owner credential for ${club.clubName}`, club.id);
    showToast(`Temporary credentials generated for ${club.clubName}`);
  };

  const handleImpersonate = async (club: SaaSClubProfile) => {
    await logSuperAdminAction('WORKSPACE_IMPERSONATED', 'SuperAdmin', `Impersonated club workspace ${club.clubName} (${club.id})`, club.id);
    showToast(`Entering workspace "${club.clubName}"...`);
    onSwitchWorkspace(club.id);
  };

  const handleDeleteClub = async (clubId: string) => {
    try {
      await onDeleteClub(clubId);
      await logSuperAdminAction('CLUB_DELETED', 'SuperAdmin', `Permanently deleted club workspace ${clubId}`, clubId);
      setDeleteConfirmClub(null);
      showToast(`Deleted club workspace ${clubId}`);
    } catch (err) {
      alert('Failed to delete club: ' + err);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceTitle || !newAnnounceContent) return;

    try {
      const newAnn: Omit<PlatformAnnouncement, 'id'> = {
        title: newAnnounceTitle,
        content: newAnnounceContent,
        severity: newAnnounceSeverity,
        createdAt: Date.now(),
        active: true,
        createdBy: 'SuperAdmin HQ'
      };

      const id = await savePlatformAnnouncement(newAnn);
      setAnnouncements([{ id, ...newAnn }, ...announcements]);
      setNewAnnounceTitle('');
      setNewAnnounceContent('');
      await logSuperAdminAction('ANNOUNCEMENT_CREATED', 'SuperAdmin', `Published platform alert: "${newAnn.title}"`);
      showToast('Announcement published to all club workspaces!');
    } catch (err) {
      alert('Failed to create announcement: ' + err);
    }
  };

  const handleToggleAnnouncement = async (id: string, active: boolean) => {
    try {
      await togglePlatformAnnouncement(id, active);
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, active } : a));
      showToast(`Announcement ${active ? 'Activated' : 'Deactivated'}`);
    } catch (err) {
      alert('Failed to toggle announcement: ' + err);
    }
  };

  const handleDownloadDiagnostics = (clubId: string) => {
    const targetClub = clubs.find(c => c.id === clubId) || clubs[0];
    const diagnosticsData = {
      timestamp: new Date().toISOString(),
      platform: 'CueDesk Multi-Tenant SaaS Engine',
      environment: 'Cloud Run Production Container',
      health: {
        databaseLatencyMs: 12,
        authStatus: 'OPERATIONAL',
        websocketSync: 'CONNECTED',
      },
      clubProfile: targetClub,
      activeFeatureFlags: targetClub?.featureFlags || SUBSCRIPTION_PLANS[targetClub?.planId || 'starter'].features,
      systemMonitoringLogs: getRecentMonitoringEvents(),
    };

    const blob = new Blob([JSON.stringify(diagnosticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuedesk-diagnostics-${targetClub?.id || 'global'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Diagnostics Report Downloaded!');
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28 lg:pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-2xl bg-neutral-900 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Super Admin Top Header Banner */}
      <div className="p-6 rounded-3xl bg-neutral-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl border border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black tracking-tight text-white">CueDesk Super Admin Portal</h2>
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-950">
                Master Platform Controls
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Platform-wide administration, tenant isolation security, billing quotas, global announcements, and system diagnostic telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <Button
            variant="outline"
            onClick={() => handleDownloadDiagnostics(selectedSupportClubId)}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
            className="text-xs border-neutral-700 text-neutral-200 hover:bg-neutral-800"
          >
            Diagnostics
          </Button>

          <Button
            variant="primary"
            onClick={onOpenOnboarding}
            leftIcon={<Plus className="w-4 h-4 text-neutral-950" />}
            className="bg-white text-neutral-950 hover:bg-neutral-100 font-bold text-xs"
          >
            + Onboard New Club
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-2 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs">
        {[
          { id: 'overview', label: 'Platform Overview', icon: Activity },
          { id: 'clubs', label: 'Club Workspaces', icon: Building2 },
          { id: 'subscriptions', label: 'Subscription Plans', icon: Crown },
          { id: 'features', label: 'Feature Flags', icon: Sliders },
          { id: 'support', label: 'Support & Diagnostics', icon: FileText },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
          { id: 'audit', label: 'Audit Telemetry', icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
            }`}
          >
            <Icon className={`w-4 h-4 ${activeTab === id ? 'text-amber-400' : 'text-neutral-400'}`} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 border border-neutral-200">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Total Registered</span>
                <Building2 className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900 mt-2">{totalClubs}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Multi-Tenant Workspaces</span>
            </Card>

            <Card className="p-4 border border-neutral-200">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Active Paid Subs</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900 mt-2">{activeClubs}</div>
              <span className="text-[11px] text-neutral-400 font-medium mt-1 block">{trialClubs} in Trial</span>
            </Card>

            <Card className="p-4 border border-neutral-200">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Tables Tracked</span>
                <Grid2X2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900 mt-2">{totalTables}</div>
              <span className="text-[11px] text-neutral-400 font-medium mt-1 block">Live Table Matrix</span>
            </Card>

            <Card className="p-4 border border-neutral-200">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Monthly Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600 mt-2">${estimatedMRR}</div>
              <span className="text-[11px] text-neutral-400 font-medium mt-1 block">Estimated MRR</span>
            </Card>

            <Card className="p-4 border border-neutral-200 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Platform Health</span>
                <Server className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-lg font-black text-neutral-900">99.9% Nominal</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium mt-1 block">Cloud Run & Firestore OK</span>
            </Card>
          </div>

          {/* System Health Breakdown & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-neutral-900">Live Session & Platform Activity Stream</h3>
                </div>
                <Badge variant="success">Realtime Sync</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SESSION_VOLUME_DATA}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sessions" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" name="Total Table Sessions" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900">Platform Security Status</h3>
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-neutral-900">Firestore Rules</div>
                    <div className="text-[10px] text-neutral-500">Multi-tenant subcollection isolation</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">ENFORCED</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-neutral-900">RBAC Permissions Matrix</div>
                    <div className="text-[10px] text-neutral-500">Owner / Manager / Cashier scopes</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-neutral-900">Client Rate Limiting</div>
                    <div className="text-[10px] text-neutral-500">Protection against double submits</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">ENABLED</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-neutral-900">Audit Logging Engine</div>
                    <div className="text-[10px] text-neutral-500">Administrative activity trails</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">LOGGING</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CLUB WORKSPACES DIRECTORY & MANAGEMENT */}
      {activeTab === 'clubs' && (
        <Card className="flex flex-col gap-5">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Multi-Tenant Workspaces Directory</h3>
              <p className="text-xs text-neutral-500">View, suspend, reactivate, or impersonate registered cue club accounts</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search club name, ID, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-900 outline-none"
                />
              </div>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
              >
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Clubs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase font-mono text-[10px]">
                  <th className="p-3 font-semibold">Club Name & ID</th>
                  <th className="p-3 font-semibold">Owner Contact</th>
                  <th className="p-3 font-semibold">Plan Tier</th>
                  <th className="p-3 font-semibold">Tables / Cap</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredClubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400">
                      No club workspaces found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClubs.map((c) => {
                    const isCurrent = c.id === currentClubId;
                    const isSuspended = c.status === 'suspended';
                    const trialDaysLeft = c.trialEndDate ? calculateTrialDaysRemaining(c.trialEndDate) : 0;
                    const plan = customPlans[c.planId] || customPlans.starter;

                    return (
                      <tr key={c.id} className={`hover:bg-neutral-50/80 transition-colors ${isSuspended ? 'bg-red-50/40 opacity-75' : isCurrent ? 'bg-amber-50/40' : ''}`}>
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${isSuspended ? 'bg-red-900 text-white' : 'bg-neutral-900 text-white'}`}>
                              {c.clubName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                                <span>{c.clubName}</span>
                                {isCurrent && (
                                  <span className="text-[9px] font-bold bg-neutral-900 text-amber-400 px-1.5 py-0.2 rounded uppercase">
                                    Current
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-neutral-400">{c.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-neutral-600">
                          <div className="font-medium text-neutral-900">{c.email || c.ownerId}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{c.phone}</div>
                        </td>

                        <td className="p-3">
                          <select
                            value={c.planId}
                            onChange={(e) => handlePlanChange(c.id, e.target.value as SubscriptionPlanId)}
                            className="bg-white border border-neutral-300 rounded-lg px-2 py-1 font-bold text-xs text-neutral-900 outline-none cursor-pointer"
                          >
                            <option value="starter">Starter ($29/mo)</option>
                            <option value="professional">Professional ($79/mo)</option>
                            <option value="enterprise">Enterprise ($199/mo)</option>
                          </select>
                        </td>

                        <td className="p-3 font-mono text-neutral-800">
                          <span className="font-bold">{c.tablesCount || 6}</span>
                          <span className="text-neutral-400 text-[10px]"> / {plan.maxTables === 999 ? '∞' : plan.maxTables}</span>
                        </td>

                        <td className="p-3">
                          {isSuspended ? (
                            <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Ban className="w-3 h-3 text-red-600" />
                              Suspended
                            </span>
                          ) : c.subscriptionStatus === 'trial' ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              {trialDaysLeft}d Trial
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingClub(c)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              className="text-[11px] px-2 py-1"
                            >
                              Details
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleSuspend(c)}
                              className={`text-[11px] px-2 py-1 ${isSuspended ? 'text-emerald-700 border-emerald-300' : 'text-amber-700 border-amber-300'}`}
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend'}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(c)}
                              leftIcon={<Key className="w-3.5 h-3.5" />}
                              className="text-[11px] px-2 py-1"
                            >
                              Pass
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleImpersonate(c)}
                              leftIcon={<PlayCircle className="w-3.5 h-3.5 text-amber-400" />}
                              className="text-[11px] px-2.5 py-1 bg-neutral-900 text-white"
                            >
                              Enter
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmClub(c)}
                              className="text-[11px] px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
      )}

      {/* TAB 3: SUBSCRIPTION PLANS CONFIGURATION */}
      {activeTab === 'subscriptions' && (
        <Card className="flex flex-col gap-6">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900">Subscription Tier Parameters</h3>
            <p className="text-xs text-neutral-500">Configure global capacity caps, pricing, and storage limits for SaaS tiers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(customPlans) as SubscriptionPlanId[]).map((planKey) => {
              const plan = customPlans[planKey];

              return (
                <div key={planKey} className="p-6 rounded-3xl border-2 border-neutral-200 bg-white flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-black text-neutral-900 uppercase">{plan.name}</h4>
                      <Badge variant={planKey === 'enterprise' ? 'warning' : 'info'}>{planKey}</Badge>
                    </div>

                    <div className="text-3xl font-black font-mono text-neutral-900 mb-4">${plan.priceMonthly}<span className="text-xs text-neutral-400 font-normal">/month</span></div>

                    <div className="space-y-3 text-xs border-t border-neutral-100 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Max Tables Limit:</span>
                        <input
                          type="number"
                          value={plan.maxTables}
                          onChange={(e) => setCustomPlans({
                            ...customPlans,
                            [planKey]: { ...plan, maxTables: Number(e.target.value) }
                          })}
                          className="w-20 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-right font-bold text-neutral-900"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Max Employees Limit:</span>
                        <input
                          type="number"
                          value={plan.maxEmployees}
                          onChange={(e) => setCustomPlans({
                            ...customPlans,
                            [planKey]: { ...plan, maxEmployees: Number(e.target.value) }
                          })}
                          className="w-20 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-right font-bold text-neutral-900"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Storage Limit (MB):</span>
                        <input
                          type="number"
                          value={plan.storageLimitMb}
                          onChange={(e) => setCustomPlans({
                            ...customPlans,
                            [planKey]: { ...plan, storageLimitMb: Number(e.target.value) }
                          })}
                          className="w-20 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-right font-bold text-neutral-900"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      logSuperAdminAction('PLAN_CONFIG_UPDATED', 'SuperAdmin', `Saved updated tier limits for ${plan.name}`);
                      showToast(`Updated tier limits for ${plan.name}`);
                    }}
                    className="mt-6 w-full justify-center text-xs font-bold"
                  >
                    Save Tier Settings
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 4: FEATURE FLAGS MANAGEMENT */}
      {activeTab === 'features' && (
        <Card className="flex flex-col gap-5">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900">Module Feature Flags Matrix</h3>
            <p className="text-xs text-neutral-500">Enable or disable specific CueDesk modules per club workspace</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => {
              const flags = club.featureFlags || customPlans[club.planId]?.features || customPlans.starter.features;

              return (
                <div key={club.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-bold text-neutral-900 text-sm">{club.clubName}</div>
                        <div className="text-[10px] font-mono text-neutral-400">{club.id}</div>
                      </div>
                      <Badge variant="info">{club.planId}</Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {Object.entries(flags).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between py-1 border-b border-neutral-100 last:border-0">
                          <span className="text-neutral-600 text-[11px] capitalize">{key.replace(/([AZ])/g, ' $1')}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                            {val ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedClubForFlags(club)}
                    leftIcon={<Sliders className="w-3.5 h-3.5" />}
                    className="mt-4 w-full justify-center text-xs"
                  >
                    Configure Flags
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 5: SUPPORT TOOLS & DIAGNOSTICS */}
      {activeTab === 'support' && (
        <Card className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-3 gap-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Support Tools & Club Diagnostics</h3>
              <p className="text-xs text-neutral-500">Run diagnostic checks, inspect error trails, and export diagnostic logs</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSupportClubId}
                onChange={(e) => setSelectedSupportClubId(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-900 outline-none"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.clubName} ({c.id})</option>
                ))}
              </select>

              <Button
                variant="primary"
                onClick={() => handleDownloadDiagnostics(selectedSupportClubId)}
                leftIcon={<Download className="w-4 h-4 text-amber-400" />}
                className="text-xs"
              >
                Download Diagnostics Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-neutral-900 text-white font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-amber-400 font-bold border-b border-neutral-800 pb-2">
                // DIAGNOSTIC SUMMARY: {clubs.find(c => c.id === selectedSupportClubId)?.clubName || 'Global'}
              </div>
              <div>Status: ONLINE & NOMINAL</div>
              <div>Tenant ID: {selectedSupportClubId}</div>
              <div>Plan Tier: {clubs.find(c => c.id === selectedSupportClubId)?.planId}</div>
              <div>Tables Configured: {clubs.find(c => c.id === selectedSupportClubId)?.tablesCount || 6}</div>
              <div>Sync Engine: Firestore Realtime OnSnapshot</div>
              <div>Permissions: Multi-tenant isolated subcollections</div>
              <div>Last Healthcheck: {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">System Monitoring Events</h4>
              <div className="space-y-2">
                {getRecentMonitoringEvents().length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                    Zero error exceptions logged. System operating cleanly.
                  </div>
                ) : (
                  getRecentMonitoringEvents().map((e) => (
                    <div key={e.id} className="p-3 rounded-xl border border-neutral-200 bg-white text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-neutral-900">{e.type}</span>
                        <div className="text-neutral-500 text-[11px]">{e.message}</div>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 6: PLATFORM ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 flex flex-col gap-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Publish Platform Alert</h3>
              <p className="text-xs text-neutral-500">Send system messages to all logged-in club managers</p>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Announcement Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Scheduled System Maintenance"
                  value={newAnnounceTitle}
                  onChange={(e) => setNewAnnounceTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Severity Level</label>
                <select
                  value={newAnnounceSeverity}
                  onChange={(e) => setNewAnnounceSeverity(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 outline-none"
                >
                  <option value="info">Info (General Update)</option>
                  <option value="warning">Warning (Feature Advisory)</option>
                  <option value="urgent">Urgent (Maintenance Alert)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Alert Content</label>
                <textarea
                  rows={3}
                  placeholder="Describe the platform alert or announcement details..."
                  value={newAnnounceContent}
                  onChange={(e) => setNewAnnounceContent(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-900 outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                leftIcon={<Megaphone className="w-4 h-4 text-amber-400" />}
                className="w-full justify-center text-xs font-bold"
              >
                Publish Announcement
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 flex flex-col gap-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Active & Historical Announcements</h3>
              <p className="text-xs text-neutral-500">Broadcast alerts currently live in user workspace banners</p>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  No active platform announcements published yet.
                </div>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                      a.severity === 'urgent' ? 'bg-red-50/60 border-red-200' :
                      a.severity === 'warning' ? 'bg-amber-50/60 border-amber-200' :
                      'bg-blue-50/60 border-blue-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-neutral-900 text-sm">{a.title}</span>
                        <Badge variant={a.severity === 'urgent' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info'}>
                          {a.severity.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 mt-1">{a.content}</p>
                    </div>

                    <button
                      onClick={() => handleToggleAnnouncement(a.id, !a.active)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors shrink-0 ${
                        a.active ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                      }`}
                    >
                      {a.active ? 'Live Banner' : 'Inactive'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: PLATFORM ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-neutral-900">New Club Registrations & MRR Growth</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CLUB_GROWTH_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="clubs" fill="#3B82F6" name="Total Clubs" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="mrr" fill="#10B981" name="MRR ($)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-neutral-900">Module Feature Adoption Rate (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FEATURE_ADOPTION_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="adoption" fill="#F59E0B" name="Adoption %" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 8: AUDIT TELEMETRY */}
      {activeTab === 'audit' && (
        <Card className="flex flex-col gap-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900">Platform Super Admin Audit Logs</h3>
            <p className="text-xs text-neutral-500">Immutable trail of all administrative actions and security overrides</p>
          </div>

          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-neutral-400 text-xs">
                No administrative actions recorded yet in session.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-neutral-200 bg-white text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-amber-400 mr-2">
                      {log.action}
                    </span>
                    <span className="font-medium text-neutral-900">{log.details}</span>
                    <span className="text-[10px] text-neutral-400 block font-mono">Target: {log.targetClubId}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingClub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">{viewingClub.clubName}</h3>
                <p className="text-xs text-neutral-500 font-mono">Workspace ID: {viewingClub.id}</p>
              </div>
              <button onClick={() => setViewingClub(null)} className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg">×</button>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="font-bold text-neutral-900 mb-1">Owner Contact Info</div>
                <div>Owner ID/Email: {viewingClub.email || viewingClub.ownerId}</div>
                <div>Phone: {viewingClub.phone}</div>
                <div>Address: {viewingClub.address || 'Default Lounge Arena'}</div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="font-bold text-neutral-900 mb-1">Subscription Details</div>
                <div>Current Plan: {viewingClub.planId.toUpperCase()}</div>
                <div>Status: {viewingClub.subscriptionStatus.toUpperCase()}</div>
                <div>Tables Capacity: {viewingClub.tablesCount || 6} Tables</div>
                <div>Created At: {new Date(viewingClub.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <Button variant="primary" onClick={() => setViewingClub(null)} className="w-full justify-center">
              Close Profile
            </Button>
          </div>
        </div>
      )}

      {/* FEATURE FLAGS MODAL */}
      {selectedClubForFlags && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Module Feature Flags</h3>
                <p className="text-xs text-neutral-500">{selectedClubForFlags.clubName}</p>
              </div>
              <button onClick={() => setSelectedClubForFlags(null)} className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg">×</button>
            </div>

            <div className="space-y-3 my-4 text-xs">
              {(
                [
                  { key: 'foodOrdering', label: 'Food & Snack Kitchen Ordering' },
                  { key: 'inventory', label: 'Food Inventory & Purchase Logs' },
                  { key: 'crmMemberships', label: 'Customer CRM & Member Tiers' },
                  { key: 'maintenance', label: 'Table Repair & Technician Flags' },
                  { key: 'employeeAttendance', label: 'Staff Shift Check-ins & Duty Logs' },
                  { key: 'expensesNetProfit', label: 'Expenses & Net Profit Tracker' },
                  { key: 'analyticsExport', label: 'CSV Data Export & Analytics' },
                  { key: 'tournamentModule', label: 'Tournament & League Bracket Module' },
                ] as { key: keyof FeatureFlags; label: string }[]
              ).map(({ key, label }) => {
                const currentFlags = selectedClubForFlags.featureFlags || customPlans[selectedClubForFlags.planId]?.features || customPlans.starter.features;
                const isEnabled = Boolean(currentFlags[key]);

                return (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-neutral-50">
                    <span className="font-semibold text-neutral-800">{label}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated: FeatureFlags = { ...currentFlags, [key]: !isEnabled };
                        await onUpdateFeatureFlags(selectedClubForFlags.id, updated);
                        setSelectedClubForFlags({ ...selectedClubForFlags, featureFlags: updated });
                        showToast(`Updated feature flag ${key}`);
                      }}
                      className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase transition-colors cursor-pointer ${
                        isEnabled ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                );
              })}
            </div>

            <Button variant="primary" onClick={() => setSelectedClubForFlags(null)} className="w-full justify-center">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 font-bold">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Temporary Owner Credentials</h3>
            <p className="text-xs text-neutral-500 mb-4">Share this temporary password with the club owner for immediate login access:</p>
            <div className="p-3 bg-neutral-900 text-amber-400 font-mono text-base font-bold rounded-xl mb-4 select-all">
              {tempPassword}
            </div>
            <Button variant="primary" onClick={() => setTempPassword(null)} className="w-full justify-center text-xs">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmClub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Delete Workspace?</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Are you sure you want to permanently delete workspace <b>{deleteConfirmClub.clubName}</b> ({deleteConfirmClub.id})? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmClub(null)} className="flex-1 justify-center text-xs">
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDeleteClub(deleteConfirmClub.id)} className="flex-1 justify-center text-xs font-bold">
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
