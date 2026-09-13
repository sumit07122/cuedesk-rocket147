import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Grid2X2, 
  Receipt, 
  Users,
  BarChart3, 
  Settings,
  MoreHorizontal,
  Utensils,
  UserCheck,
  TrendingUp,
  Wrench,
  ChefHat,
  QrCode,
  X,
  ChevronRight,
  Trophy,
  Key,
  Gamepad2
} from 'lucide-react';
import { PageView } from '../../types';

interface MobileBottomNavProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  occupiedCount: number;
}

const primaryTabs = [
  { id: 'dashboard' as PageView, label: 'Home', icon: LayoutDashboard },
  { id: 'tables' as PageView, label: 'Tables', icon: Grid2X2 },
  { id: 'billing' as PageView, label: 'Billing', icon: Receipt },
  { id: 'customers' as PageView, label: 'CRM', icon: Users },
  { id: '__more__' as any, label: 'More', icon: MoreHorizontal },
];

const moreItems = [
  { id: 'menu-inventory' as PageView, label: 'Food & Inventory', icon: Utensils },
  { id: 'kds' as PageView, label: 'Kitchen Display', icon: ChefHat },
  { id: 'tournaments' as PageView, label: 'Tournaments & Leagues', icon: Trophy },
  { id: 'lockers' as PageView, label: 'Cue Lockers', icon: Key },
  { id: 'arena' as PageView, label: 'Gaming Lounge & PS5', icon: Gamepad2 },
  { id: 'employees' as PageView, label: 'Staff & Attendance', icon: UserCheck },
  { id: 'expenses' as PageView, label: 'Expenses & Profit', icon: TrendingUp },
  { id: 'reports' as PageView, label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'maintenance' as PageView, label: 'Table Maintenance', icon: Wrench },
  { id: 'settings' as PageView, label: 'Club Settings', icon: Settings },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  setActivePage,
  occupiedCount,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMoreActive = moreItems.some((item) => item.id === activePage);

  const handleTabClick = (id: any) => {
    if (id === '__more__') {
      setIsMoreOpen(true);
    } else {
      setActivePage(id);
    }
  };

  const handleMoreItemClick = (id: PageView) => {
    setActivePage(id);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 select-none"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="bg-[#0f0f13]/95 backdrop-blur-xl border-t border-amber-500/15 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-stretch h-16 px-1">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isMore = tab.id === '__more__';
              const isActive = isMore ? isMoreActive : activePage === tab.id;
              const showBadge = tab.id === 'tables' && occupiedCount > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 relative cursor-pointer transition-all duration-150 group"
                >
                  {/* Active glow background */}
                  {isActive && (
                    <span className="absolute inset-x-1 top-1 bottom-1 rounded-xl bg-amber-500/10 border border-amber-500/20" />
                  )}

                  <div className="relative z-10">
                    <Icon 
                      className={`w-5 h-5 transition-all duration-150 ${
                        isActive ? 'text-amber-400 scale-110' : 'text-neutral-500 group-hover:text-neutral-300'
                      }`} 
                    />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 rounded-full border border-[#0f0f13] leading-4 min-w-[16px] text-center">
                        {occupiedCount}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold tracking-tight relative z-10 ${
                    isActive ? 'text-amber-400' : 'text-neutral-500 group-hover:text-neutral-300'
                  }`}>
                    {tab.label}
                  </span>

                  {/* Active dot indicator */}
                  {isActive && (
                    <span className="absolute bottom-0.5 w-4 h-0.5 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* "More" Slide-Up Drawer */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative bg-[#0f0f13] rounded-t-3xl border-t border-amber-500/20 shadow-2xl"
               style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}>
            
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <h3 className="text-sm font-extrabold text-white tracking-tight">All Sections</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-2 gap-2 p-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreItemClick(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        : 'bg-white/5 border border-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-amber-500/30' : 'bg-white/5'
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                    </div>
                    <span className="text-xs font-bold leading-tight">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
