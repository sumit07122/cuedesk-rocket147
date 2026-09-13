import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Grid2X2, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut, 
  ShieldAlert,
  Utensils,
  Users,
  UserCheck,
  TrendingUp,
  ChefHat,
  Trophy,
  Key,
  Gamepad2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PageView, SaaSClubProfile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  occupiedCount: number;
  totalTables: number;
  onLogout: () => void;
  clubs?: SaaSClubProfile[];
  clubName?: string;
  onOpenOnboarding?: () => void;
  onOpenSuperAdmin?: () => void;
}

interface NavItem {
  id: PageView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeType?: 'live' | 'neutral' | 'accent';
  minRole: UserRole;
  tooltip: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  occupiedCount,
  totalTables,
  onLogout,
  clubs = [],
  clubName = 'One Shot Snooker Club',
  onOpenOnboarding = () => {},
  onOpenSuperAdmin = () => {},
}) => {
  const { user, currentClubId, role, hasPermission, switchRole } = useAuth();

  // Collapsible mini-rail state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cuedesk_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cuedesk_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Structured, categorized navigation groups
  const sections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { 
          id: 'dashboard', 
          label: 'Dashboard', 
          icon: LayoutDashboard, 
          minRole: 'cashier',
          tooltip: 'Live Club Overview & Stats'
        },
        { 
          id: 'tables', 
          label: 'Table Manager', 
          icon: Grid2X2, 
          badge: `${occupiedCount}/${totalTables}`,
          badgeType: 'live',
          minRole: 'cashier',
          tooltip: 'Monitor & Transfer Tables'
        },
        { 
          id: 'billing', 
          label: 'Billing & POS', 
          icon: Receipt, 
          minRole: 'cashier',
          tooltip: 'Quick Checkout & Receipts'
        },
        { 
          id: 'menu-inventory', 
          label: 'Menu & Stock', 
          icon: Utensils, 
          minRole: 'cashier',
          tooltip: 'Café Menu & Inventory Stock'
        },
        { 
          id: 'kds', 
          label: 'Kitchen KDS', 
          icon: ChefHat, 
          minRole: 'kitchen',
          tooltip: 'Live Kitchen Order Display'
        },
      ]
    },
    {
      title: 'Arena & Players',
      items: [
        { 
          id: 'tournaments', 
          label: 'Tournaments', 
          icon: Trophy, 
          minRole: 'cashier',
          tooltip: 'Knockouts & League Brackets'
        },
        { 
          id: 'lockers', 
          label: 'Cue Lockers', 
          icon: Key, 
          minRole: 'cashier',
          tooltip: 'VIP Cue Storage Allocations'
        },
        { 
          id: 'arena', 
          label: 'Gaming & PS5', 
          icon: Gamepad2, 
          minRole: 'cashier',
          tooltip: 'PS5 & Multi-Game Lounge'
        },
        { 
          id: 'customers', 
          label: 'Customer CRM', 
          icon: Users, 
          minRole: 'cashier',
          tooltip: 'Member Profiles & Credit Ledgers'
        },
      ]
    },
    {
      title: 'Management',
      items: [
        { 
          id: 'employees', 
          label: 'Staff & Shifts', 
          icon: UserCheck, 
          minRole: 'owner',
          tooltip: 'Staff Attendance & Shift Logs'
        },
        { 
          id: 'expenses', 
          label: 'Expenses & P&L', 
          icon: TrendingUp, 
          minRole: 'manager',
          tooltip: 'Club Expenses & Profit Analysis'
        },
        { 
          id: 'reports', 
          label: 'Reports & Analytics', 
          icon: BarChart3, 
          minRole: 'manager',
          tooltip: 'Financial Reports & Insights'
        },
        { 
          id: 'settings', 
          label: 'Club Settings', 
          icon: Settings, 
          minRole: 'owner',
          tooltip: 'Rates, Backups & Configurations'
        },
      ]
    }
  ];

  const roleBadgeStyles: Record<string, string> = {
    owner: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    manager: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    cashier: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    kitchen: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-[#0B0F17] border-r border-[#1C2333] h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* ─── Top Brand Header ─── */}
      <div className={`p-3.5 border-b border-[#1C2333] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div 
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
          title="CueDesk Gaming OS"
        >
          <div className="relative shrink-0">
            <img
              src="/logo.png"
              alt="CueDesk"
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:ring-amber-400 transition-all"
            />
            {occupiedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0B0F17] rounded-full animate-pulse" />
            )}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-tight leading-none">CueDesk</h1>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider">
                  OS
                </span>
              </div>
              <p className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mt-1 truncate">
                {clubName}
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-[#151B28] rounded-lg transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── Club Live Status Pill (Expanded Only) ─── */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="px-3 py-2 rounded-xl bg-[#131825] border border-[#1E2638] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-neutral-300 truncate">
                Cloud Sync Active
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
              {occupiedCount}/{totalTables} Tables
            </span>
          </div>
        </div>
      )}

      {/* ─── Navigation Groups ─── */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto sidebar-scrollbar flex flex-col gap-3">
        {sections.map((section, sIdx) => (
          <div key={section.title} className="flex flex-col gap-0.5">
            {/* Section Divider Header */}
            {!isCollapsed ? (
              <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                {section.title}
              </div>
            ) : sIdx > 0 ? (
              <div className="my-1.5 mx-2 border-t border-[#1C2333]" />
            ) : null}

            {/* Nav Items */}
            {section.items.map((item) => {
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
                  title={isCollapsed ? `${item.label} — ${item.tooltip}` : undefined}
                  className={`group relative w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isCollapsed 
                      ? 'justify-center h-10 px-0' 
                      : 'justify-between px-3 py-2.5'
                  } ${
                    !canAccess
                      ? 'opacity-30 cursor-not-allowed text-neutral-400'
                      : isActive
                      ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 text-amber-200 border border-amber-500/30 shadow-[0_2px_8px_rgba(245,158,11,0.08)]'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#151B28]'
                  }`}
                >
                  {/* Active Indicator Strip */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  )}

                  {/* Left: Icon + Label */}
                  <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                    <Icon 
                      className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                        isActive 
                          ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]' 
                          : 'text-neutral-400 group-hover:text-neutral-200 group-hover:scale-105'
                      }`} 
                    />
                    {!isCollapsed && (
                      <span className="truncate tracking-tight">{item.label}</span>
                    )}
                  </div>

                  {/* Right: Badge or Lock */}
                  {!canAccess ? (
                    !isCollapsed && <ShieldAlert className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  ) : item.badge && !isCollapsed ? (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 transition-colors ${
                        item.badgeType === 'live'
                          ? occupiedCount > 0
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50'
                          : isActive
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : item.badge && isCollapsed && occupiedCount > 0 ? (
                    /* Dot indicator on collapsed view */
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── Footer: User Profile & Role Selector ─── */}
      <div className="p-3 border-t border-[#1C2333] flex flex-col gap-2.5 bg-[#090C13]">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black font-black text-xs flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
              title={user?.email || 'Logged in user'}
            >
              {role.charAt(0).toUpperCase()}
            </div>
            
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-neutral-200 truncate leading-tight">
                  {user?.displayName || 'Club Master'}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                      roleBadgeStyles[role] || 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              title="Sign Out to Login Screen"
              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Role Preview Bar (Expanded only) */}
        {!isCollapsed && switchRole && (
          <div className="p-1 bg-[#131825] rounded-xl border border-[#1E2638] flex items-center gap-1">
            {(['owner', 'manager', 'cashier', 'kitchen'] as any[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={`flex-1 text-[9px] font-extrabold py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                  role === r
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title={`Switch preview role to ${r.toUpperCase()}`}
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
