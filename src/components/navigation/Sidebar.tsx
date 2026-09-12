import React from 'react';
import { 
  LayoutDashboard, 
  Grid2X2, 
  Receipt, 
  BarChart3, 
  Settings, 
  QrCode,
  LogOut, 
  Sparkles,
  CircleDot,
  Building2,
  ShieldAlert,
  Utensils,
  Users,
  UserCheck,
  TrendingUp,
  ChefHat,
  RotateCcw
} from 'lucide-react';
import { PageView, SaaSClubProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  occupiedCount: number;
  totalTables: number;
  onLogout: () => void;
  clubs?: SaaSClubProfile[];
  onOpenOnboarding?: () => void;
  onOpenSuperAdmin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  occupiedCount,
  totalTables,
  onLogout,
  clubs = [],
  onOpenOnboarding = () => {},
  onOpenSuperAdmin = () => {},
}) => {
  const { user, currentClubId, role, hasPermission, switchClub, switchRole } = useAuth();

  const navItems = [
    { id: 'dashboard' as PageView, label: 'Dashboard Overview', icon: LayoutDashboard, minRole: 'cashier' },
    { id: 'tables' as PageView, label: 'Table Manager', icon: Grid2X2, badge: `${occupiedCount}/${totalTables}`, minRole: 'cashier' },
    { id: 'billing' as PageView, label: 'Billing & Checkout', icon: Receipt, minRole: 'cashier' },
    { id: 'menu-inventory' as PageView, label: 'Food & Inventory', icon: Utensils, minRole: 'cashier' },
    { id: 'kds' as PageView, label: 'Kitchen Display (KDS)', icon: ChefHat, minRole: 'kitchen' },
    { id: 'customers' as PageView, label: 'Customer CRM & Credit Ledger', icon: Users, minRole: 'cashier' },
    { id: 'employees' as PageView, label: 'Staff & Shift Duty', icon: UserCheck, minRole: 'owner' },
    { id: 'expenses' as PageView, label: 'Expenses & Profit', icon: TrendingUp, minRole: 'manager' },
    { id: 'reports' as PageView, label: 'Reports & Analytics', icon: BarChart3, minRole: 'manager' },
    { id: 'settings' as PageView, label: 'Club Settings', icon: Settings, minRole: 'owner' },
  ];

  const roleColors: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-900 border-amber-300',
    manager: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    cashier: 'bg-blue-100 text-blue-900 border-blue-300',
    kitchen: 'bg-purple-100 text-purple-900 border-purple-300',
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200/80 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('dashboard')}>
          <img
            src="/logo.png"
            alt="CueDesk One Shot Snooker"
            className="w-12 h-12 rounded-2xl object-cover shadow-lg shrink-0 ring-2 ring-amber-200/60"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-black text-neutral-900 tracking-tight leading-none">CueDesk</h1>
            <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">One Shot • Gaming OS</span>
          </div>
        </div>
      </div>

      {/* Club Identity Widget */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2 bg-neutral-50/70">
        <Building2 className="w-4 h-4 text-neutral-500 shrink-0" />
        <div className="truncate">
          <p className="text-xs font-bold text-neutral-900 truncate">One Shot Snooker Gaming</p>
          <p className="text-[10px] text-neutral-400">Grand Arena Plaza • Official OS</p>
        </div>
      </div>

      {/* Live Club Status Widget */}
      <div className="px-4 py-2.5 mx-4 my-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-neutral-700">Firestore Realtime</span>
        </div>
        <span className="text-[11px] font-bold text-neutral-700 bg-white px-2 py-0.5 rounded-lg border border-neutral-200/80">
          {occupiedCount} Active
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const canAccess = hasPermission(item.minRole as any);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (canAccess) {
                  setActivePage(item.id);
                }
              }}
              disabled={!canAccess}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                !canAccess
                  ? 'opacity-40 cursor-not-allowed text-neutral-400'
                  : isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </div>

              {!canAccess ? (
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
              ) : item.badge ? (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile & Role Switcher */}
      <div className="p-3 border-t border-neutral-100 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {role.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-neutral-900 truncate">
                {user?.displayName || 'Club Owner'}
              </h4>
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded border ${
                  roleColors[role] || 'bg-neutral-100 text-neutral-800'
                }`}
              >
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out to Login Screen"
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Role Switcher for Client Review */}
        {switchRole && (
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl border border-neutral-200/60">
            {(['owner', 'manager', 'cashier', 'kitchen'] as any[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={`flex-1 text-[10px] font-bold py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  role === r
                    ? 'bg-white text-neutral-900 shadow-2xs font-extrabold ring-1 ring-black/5'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title={`Preview as ${r.toUpperCase()}`}
              >
                {r === 'kitchen' ? 'KDS' : r}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
