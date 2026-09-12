import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  QrCode, 
  Clock, 
  Bell, 
  Monitor,
  ChevronDown,
  Download
} from 'lucide-react';
import { PageView, NotificationItem } from '../../types';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useAuth } from '../../context/AuthContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../common/PWAInstallModal';

interface NavbarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  onQuickStartSession: () => void;
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => Promise<void>;
  onClearAllNotifications?: () => Promise<void>;
}

const pageTitles: Record<PageView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Live table status & club overview' },
  tables: { title: 'Table Manager', subtitle: 'Monitor, pause & transfer sessions' },
  'table-details': { title: 'Table Details', subtitle: 'Live timer, orders & session info' },
  billing: { title: 'Billing & Checkout', subtitle: 'Calculate bills, apply discounts & receipts' },
  'menu-inventory': { title: 'Food & Inventory', subtitle: 'Menu, kitchen orders, stock & purchases' },
  customers: { title: 'CRM & Credit Ledger', subtitle: 'Player profiles, dues & gaming history' },
  employees: { title: 'Staff & Shift Duty', subtitle: 'Attendance check-ins & working hours' },
  expenses: { title: 'Expenses & Profit', subtitle: 'Record costs, net profit & margins' },
  maintenance: { title: 'Table Maintenance', subtitle: 'Repair flags, issue logs & costs' },
  reports: { title: 'Reports & Analytics', subtitle: 'Revenue, peak hours & top members' },
  settings: { title: 'Club Settings', subtitle: 'Pricing, tables, roles & backup' },
  kds: { title: 'Kitchen Display', subtitle: 'Live snack & drink order queue' },
  login: { title: 'Sign In', subtitle: 'CueDesk Manager Portal' },
};

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  onQuickStartSession,
  notifications = [],
  onMarkNotificationRead = async () => {},
  onClearAllNotifications = async () => {},
}) => {
  const { user } = useAuth();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const update = () => {
      setTimeString(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentInfo = pageTitles[activePage] || pageTitles.dashboard;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-3 sm:px-5 h-14">

        {/* LEFT: Logo + Page Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Logo — actual logo image */}
          <button
            className="lg:hidden flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => setActivePage('dashboard')}
          >
            <img
              src="/logo.png"
              alt="CueDesk"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-amber-400/30 shadow-md"
            />
          </button>

          {/* Page Title (desktop shows full info, mobile shows only title) */}
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight truncate leading-tight">
              {currentInfo.title}
            </h2>
            <p className="hidden sm:block text-[11px] text-neutral-400 font-medium truncate">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* RIGHT: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Review Mode Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Review Mode</span>
          </div>

          {/* Live Clock — hidden on small mobile */}
          <div className="hidden md:flex items-center gap-1.5 bg-neutral-100 text-neutral-600 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border border-neutral-200/60">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>{timeString}</span>
          </div>

          {/* Notification Center */}
          <div className="relative">
            <NotificationCenter
              notifications={notifications}
              onMarkRead={onMarkNotificationRead}
              onClearAll={onClearAllNotifications}
            />
          </div>

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={() => setShowPwaModal(true)}
              title="Install CueDesk as Desktop or Mobile App"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-extrabold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Install App</span>
            </button>
          )}

          {/* Quick Start Session Button */}
          {activePage !== 'login' && (
            <button
              onClick={onQuickStartSession}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Start Session</span>
              <span className="sm:hidden">Start</span>
            </button>
          )}
        </div>
      </div>

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
        onInstall={promptInstall}
        isIOS={isIOS}
        isInstallable={isInstallable}
      />
    </header>
  );
};
