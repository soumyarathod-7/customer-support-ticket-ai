import React from 'react';
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Bot,
  UserCheck,
  Clock,
  Info,
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onSelectTicket: (ticketId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  onSelectTicket,
}) => {
  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'priority':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'assignment':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'agentforce':
        return <Bot className="w-4 h-4 text-[#0176D3]" />;
      case 'sla':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-[#032D60] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-sky-300" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Agentforce Notifications</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="text-[11px] text-sky-200 hover:text-white flex items-center gap-1 transition"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark read</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No notifications at this time.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.ticketId) {
                  onSelectTicket(n.ticketId);
                  onClose();
                }
              }}
              className={`p-3 rounded-lg text-xs cursor-pointer transition ${
                n.read ? 'bg-white hover:bg-slate-50' : 'bg-sky-50/70 border border-sky-100 font-medium'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 p-1 rounded-full bg-slate-100 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="font-bold text-slate-900 truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                  {n.ticketId && (
                    <span className="inline-block mt-1 text-[10px] font-mono text-[#0176D3] font-bold">
                      View {n.ticketId} →
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
        Salesforce Service Cloud Live PushTopic Events
      </div>
    </div>
  );
};
