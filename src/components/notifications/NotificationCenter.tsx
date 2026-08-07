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
  X
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      default:
        return <Info className="w-4 h-4 text-neutral-600" />;
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
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-neutral-900" />
              <h3 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                Notifications Center ({unreadCount} New)
              </h3>
            </div>

            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={() => onClearAll()}
                  className="p-1 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 transition-colors"
                  title="Clear All Notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No notifications right now. Everything is running smoothly!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    n.read ? 'bg-white opacity-70' : 'bg-neutral-50/80 font-medium'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-neutral-200/80 shrink-0 shadow-2xs">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">{n.title}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-snug">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
