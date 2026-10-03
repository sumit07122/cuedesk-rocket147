import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  QrCode, 
  Clock, 
  Bell, 
  Monitor,
  ChevronDown,
  Download,
  Volume2,
  VolumeX,
  Menu
} from 'lucide-react';
import { PageView, NotificationItem } from '../../types';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useAuth } from '../../context/AuthContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../common/PWAInstallModal';
import { soundEffects } from '../../utils/soundEffects';

interface NavbarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  onQuickStartSession: () => void;
  onOpenMobileMenu?: () => void;
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => Promise<void>;
  onResolveNotification?: (id: string) => Promise<void>;
  onDeleteNotification?: (id: string) => Promise<void>;
  onClearAllNotifications?: () => Promise<void>;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const pageTitles: Record<PageView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Live Tables & Dashboard', subtitle: 'Live table status, timers & club operations' },
  tables: { title: 'Live Tables & Dashboard', subtitle: 'Live table status, timers & club operations' },
  'table-details': { title: 'Table Details', subtitle: 'Live timer, orders & session info' },
  billing: { title: 'Billing & Checkout', subtitle: 'Calculate bills, apply discounts & receipts' },
  'menu-inventory': { title: 'Food & Inventory', subtitle: 'Menu, kitchen orders, stock & purchases' },
  customers: { title: 'Customer Profiles', subtitle: 'Visit activity, receipts, payments and balances' },
  employees: { title: 'Staff', subtitle: 'Staff accounts and access roles' },
  expenses: { title: 'Expenses & Profit', subtitle: 'Record costs, net profit & margins' },
  maintenance: { title: 'Daily Report', subtitle: 'Daily transactions and audit ledger' },
  reports: { title: 'Reports & Analytics', subtitle: 'Revenue, peak hours & top members' },
  'daily-report': { title: 'Day Management & EOD Vault', subtitle: 'End-of-day closing, cash drawer reconciliation & permanent archives' },
  'ai-camera': { title: 'AI Camera Vision & Monitoring', subtitle: 'CP Plus CCTV integration, player motion tracking & automated table timers' },
  settings: { title: 'Club Settings', subtitle: 'Pricing, tables, roles & backup' },
  lockers: { title: 'Cue Lockers', subtitle: 'Member locker allocations & cue sticks' },
  arena: { title: 'Gaming Arena', subtitle: 'Arcade, VR & station tracking' },
  'super-admin': { title: 'Platform Super Admin', subtitle: 'Multi-club workspace management & plans' },
  login: { title: 'Sign In', subtitle: 'One Shot Gaming Club ERP' },
};

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  onQuickStartSession,
  onOpenMobileMenu,
  notifications = [],
  onMarkNotificationRead = async () => {},
  onResolveNotification,
  onDeleteNotification,
  onClearAllNotifications = async () => {},
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { user } = useAuth();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'syncing' | 'offline'>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online'
  );
  const [isAudioMuted, setIsAudioMuted] = useState(soundEffects.getMuted());

  useEffect(() => {
    return soundEffects.subscribe((muted) => setIsAudioMuted(muted));
  }, []);

  useEffect(() => {
    const update = () => {
      setTimeString(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);

    const handleOnline = () => {
      setNetworkStatus('syncing');
      setTimeout(() => setNetworkStatus('online'), 1500);
    };
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentInfo = pageTitles[activePage] || pageTitles.dashboard;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-3 sm:px-5 h-14">

        {/* LEFT: Mobile Menu Button + Page Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Desktop Sidebar Collapse / Expand Toggle */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 hover:text-black transition-colors cursor-pointer shrink-0 border border-neutral-200/60"
              title={isSidebarCollapsed ? 'Expand Sidebar (Full Menu)' : 'Collapse Sidebar (Mini-Rail)'}
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-4 h-4 text-neutral-800" />
            </button>
          )}

          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Open Menu"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-4 h-4 text-neutral-900" />
          </button>

          {/* Mobile Club Logo */}
          <button
            className="lg:hidden flex items-center shrink-0 cursor-pointer"
            onClick={() => setActivePage('dashboard')}
            title="One Shot Gaming Club"
          >
            <img
              src="/logo.png"
              alt="One Shot Gaming Club"
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-amber-400/40 shadow-xs"
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

          {/* Tri-State Cloud Connection Indicator */}
          <div
            title={
              networkStatus === 'online'
                ? 'Cloud Firestore Connected (Realtime Multi-Device Sync Active)'
                : networkStatus === 'syncing'
                ? 'Syncing offline changes with Cloud Firestore...'
                : 'Offline Mode: Transactions saved to local cache until connection restores'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
              networkStatus === 'online'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : networkStatus === 'syncing'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                networkStatus === 'online'
                  ? 'bg-emerald-500 animate-pulse'
                  : networkStatus === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-mono uppercase">{networkStatus}</span>
          </div>

          {/* Live Clock — hidden on small mobile */}
          <div className="hidden md:flex items-center gap-1.5 bg-neutral-100 text-neutral-600 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border border-neutral-200/60">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>{timeString}</span>
          </div>

          {/* Sound FX Audio Toggle */}
          <button
            type="button"
            onClick={() => soundEffects.toggleMuted()}
            title={isAudioMuted ? 'Unmute Sound Effects & Audio Alerts' : 'Mute Sound Effects'}
            aria-label={isAudioMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
              isAudioMuted
                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
            }`}
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden xl:inline text-[11px] font-semibold">
              {isAudioMuted ? 'Muted' : 'Sound'}
            </span>
          </button>

          {/* Notification Center */}
          <div className="relative">
            <NotificationCenter
              notifications={notifications}
              onMarkRead={onMarkNotificationRead}
              onResolve={onResolveNotification}
              onDelete={onDeleteNotification}
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
