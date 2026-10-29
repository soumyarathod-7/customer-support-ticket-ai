import React, { useState } from 'react';
import {
  Search,
  Bell,
  Settings,
  ShieldCheck,
  Sparkles,
  Bot,
  Layers,
  ChevronDown,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { NotificationItem } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewTicketModal: () => void;
  openSyncModal: () => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  openNotifications: boolean;
  setOpenNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openNewTicketModal,
  openSyncModal,
  unreadNotificationCount,
  openNotifications,
  setOpenNotifications,
  globalSearch,
  setGlobalSearch,
}) => {
  const [presence, setPresence] = useState<'Online' | 'Busy' | 'Away'>('Online');
  const [showPresenceDropdown, setShowPresenceDropdown] = useState(false);

  const navItems = [
    { id: 'console', label: 'Omni-Desk Console', icon: Layers, badge: null },
    { id: 'intake', label: 'Priority Predictor & Intake', icon: Sparkles, badge: 'AI' },
    { id: 'copilot', label: 'Agentforce Copilot', icon: Bot, badge: 'Live' },
    { id: 'analytics', label: 'Service Analytics & Agents', icon: ShieldCheck, badge: null },
    { id: 'rules', label: 'Assignment Matrix', icon: Settings, badge: null },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#032D60] text-white shadow-md border-b border-[#0176D3]/40">
      {/* Top Global Bar */}
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        {/* App Launcher & Logo */}
        <div className="flex items-center gap-3">
          {/* Salesforce App Launcher 9 dots */}
          <button
            title="App Launcher"
            className="p-1.5 rounded hover:bg-white/10 transition flex items-center justify-center text-slate-200"
          >
            <div className="grid grid-cols-3 gap-0.5 w-4 h-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
              ))}
            </div>
          </button>

          {/* Salesforce Cloud Branding */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('console')}>
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#0176D3] to-[#00A1E0] flex items-center justify-center shadow-inner text-white font-bold text-xs tracking-wider">
              SF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">Salesforce Agentforce</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200 border border-sky-400/30">
                  Service Cloud 360
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-normal">Ticket Priority Prediction & Auto-Assignment</p>
            </div>
          </div>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-xl mx-2 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search tickets, customers, categories, agents... (Ctrl+K)"
              className="w-full bg-[#001639]/80 border border-slate-600/70 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3] transition"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Omni-Channel Presence */}
        <div className="flex items-center gap-2.5">
          {/* Quick Create Ticket Button */}
          <button
            onClick={openNewTicketModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0176D3] hover:bg-[#015ba5] text-white text-xs font-medium rounded-md shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Ticket</span>
          </button>

          {/* Omni-Channel Presence Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowPresenceDropdown(!showPresenceDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 rounded-md text-xs font-medium transition"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  presence === 'Online' ? 'bg-emerald-400 animate-pulse' : presence === 'Busy' ? 'bg-amber-400' : 'bg-slate-400'
                }`}
              />
              <span className="hidden lg:inline">{presence} (Omni)</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </button>

            {showPresenceDropdown && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1 text-xs z-50">
                <div className="px-3 py-1.5 font-semibold text-slate-500 border-b border-slate-100">
                  Omni-Channel Status
                </div>
                {(['Online', 'Busy', 'Away'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setPresence(status);
                      setShowPresenceDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === 'Online' ? 'bg-emerald-500' : status === 'Busy' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                      />
                      {status}
                    </span>
                    {presence === status && <CheckCircle2 className="w-3.5 h-3.5 text-[#0176D3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className="relative p-2 rounded-md hover:bg-white/10 text-slate-200 transition"
            title="Agentforce & Ticket Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Salesforce Integration Info & Sync Button */}
          <button
            onClick={openSyncModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-400/40 rounded-md text-sky-200 text-xs transition"
            title="Salesforce Integration Details"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Integration & Sim</span>
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/20">
            <div className="w-7 h-7 rounded-full bg-slate-200 border border-white/40 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                alt="Sarah Jenkins"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden 2xl:block text-left">
              <p className="text-xs font-semibold leading-tight text-white">Sarah Jenkins</p>
              <p className="text-[10px] text-slate-300">Service Operations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightning Navigation Tabs */}
      <nav className="bg-[#001639] px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#0176D3]/30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-[#0176D3] text-white bg-white/10'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="ml-auto hidden lg:flex items-center gap-3 text-[11px] text-slate-300 pr-2">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Agentforce Autonomous Dispatch Active
          </span>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            SLA Engine: Active
          </span>
        </div>
      </nav>
    </header>
  );
};
