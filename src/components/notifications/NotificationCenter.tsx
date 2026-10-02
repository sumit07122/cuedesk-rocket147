import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Receipt, 
  UserCheck, 
  Wrench, 
  QrCode, 
  Info,
  X,
  CheckCircle2,
  ChefHat
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => Promise<void>;
  onResolve?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onResolve,
  onDelete,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'active' | 'all'>('active');

  const activeNotifications = notifications.filter((n) => !n.resolved && !n.read);
  const unreadCount = activeNotifications.length;

  const displayList = filterTab === 'active' ? activeNotifications : notifications;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'checkout_req':
        return <Receipt className="w-4 h-4 text-blue-600" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'new_booking':
        return <QrCode className="w-4 h-4 text-emerald-600" />;
      case 'employee_login':
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case 'table_maintenance':
        return <Wrench className="w-4 h-4 text-red-600" />;
      case 'food_order':
        return <ChefHat className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-neutral-600" />;
    }
  };

  const handleResolveClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onResolve) {
      await onResolve(id);
    } else {
      await onMarkRead(id);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete(id);
    } else {
      await onMarkRead(id);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
        title="In-App Notifications"
      >
        <Bell className="w-5 h-5 text-neutral-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 border-b border-neutral-100 bg-neutral-50/80">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-neutral-900" />
                <h3 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                  Notifications ({unreadCount} Active)
                </h3>
              </div>

              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={() => onClearAll()}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                    title="Clear All Notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-200/60 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterTab('active')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${
                  filterTab === 'active'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Active Alerts {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${
                  filterTab === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All History ({notifications.length})
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {displayList.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                {filterTab === 'active'
                  ? '✓ No active alerts! Everything is resolved and running smoothly.'
                  : 'No notification records found.'}
              </div>
            ) : (
              displayList.map((n) => {
                const isResolved = n.resolved || n.read;
                return (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead(n.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                      isResolved ? 'bg-white opacity-75' : 'bg-amber-50/40 font-medium'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-neutral-200/80 shrink-0 shadow-2xs">
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-neutral-900 truncate">{n.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isResolved ? (
                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Resolved
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5 leading-snug">{n.message}</p>

                      {/* Quick Action Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        {!isResolved && (
                          <button
                            type="button"
                            onClick={(e) => handleResolveClick(e, n.id)}
                            className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Resolved</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, n.id)}
                          className="px-1.5 py-0.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-semibold transition-all cursor-pointer"
                          title="Dismiss notification"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
