import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TicketConsole } from './components/TicketConsole';
import { PriorityPredictor } from './components/PriorityPredictor';
import { AgentforceCopilot } from './components/AgentforceCopilot';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AssignmentRulesView } from './components/AssignmentRulesView';
import { SalesforceSyncModal } from './components/SalesforceSyncModal';
import { NotificationCenter } from './components/NotificationCenter';
import { INITIAL_TICKETS, INITIAL_AGENTS } from './data/initialData';
import { Ticket, SupportAgent, NotificationItem } from './types';
import { CheckCircle2, AlertTriangle, Bot, X } from 'lucide-react';

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('sf_agentforce_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TICKETS;
      }
    }
    return INITIAL_TICKETS;
  });

  const [agents, setAgents] = useState<SupportAgent[]>(() => {
    const saved = localStorage.getItem('sf_agentforce_agents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_AGENTS;
      }
    }
    return INITIAL_AGENTS;
  });

  const [activeTab, setActiveTab] = useState<string>('console');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openSyncModal, setOpenSyncModal] = useState(false);

  // Notification Feed State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'N-1',
      title: 'Agentforce Triage: CASE-10492',
      message: 'Predicted CRITICAL priority with 98% confidence. Auto-routed to Elena Rostova (SRE Lead).',
      timestamp: '10m ago',
      type: 'priority',
      ticketId: 'CASE-10492',
      read: false,
    },
    {
      id: 'N-2',
      title: 'Automated Assignment: CASE-10488',
      message: 'Dispatched to Marcus Vance based on Billing domain specialization and capacity balance.',
      timestamp: '25m ago',
      type: 'assignment',
      ticketId: 'CASE-10488',
      read: false,
    },
    {
      id: 'N-3',
      title: 'SLA Escalation Warning: CASE-10488',
      message: '12 minutes remaining on 1-hour executive SLA timer.',
      timestamp: '35m ago',
      type: 'sla',
      ticketId: 'CASE-10488',
      read: true,
    },
  ]);

  // Floating Toast Notification
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('sf_agentforce_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('sf_agentforce_agents', JSON.stringify(agents));
  }, [agents]);

  const addNotification = (
    title: string,
    message: string,
    type: NotificationItem['type'],
    ticketId?: string
  ) => {
    const newNotif: NotificationItem = {
      id: `N-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      type,
      ticketId,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Show floating toast
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
    addNotification(
      `New Ticket ${newTicket.id} Auto-Assigned`,
      `Predicted ${newTicket.priority} Priority. Dispatched to ${newTicket.assignedAgentName}.`,
      'priority',
      newTicket.id
    );
  };

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    addNotification(
      `Ticket ${updatedTicket.id} Updated`,
      `Priority: ${updatedTicket.priority} | Status: ${updatedTicket.status}`,
      'info',
      updatedTicket.id
    );
  };

  const handleNavigateToConsole = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('console');
  };

  const handleResetData = () => {
    localStorage.removeItem('sf_agentforce_tickets');
    localStorage.removeItem('sf_agentforce_agents');
    setTickets(INITIAL_TICKETS);
    setAgents(INITIAL_AGENTS);
    setSelectedTicketId(INITIAL_TICKETS[0].id);
    addNotification('Demo Data Reset', 'Restored default enterprise tickets and agent pool.', 'info');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-slate-800 flex flex-col font-sans selection:bg-[#0176D3] selection:text-white">
      {/* Salesforce Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNewTicketModal={() => setActiveTab('intake')}
        openSyncModal={() => setOpenSyncModal(true)}
        notifications={notifications}
        unreadNotificationCount={unreadCount}
        openNotifications={openNotifications}
        setOpenNotifications={setOpenNotifications}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
      />

      {/* Main Tab Content */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'console' && (
          <TicketConsole
            tickets={tickets}
            setTickets={setTickets}
            agents={agents}
            setAgents={setAgents}
            selectedTicketId={selectedTicketId}
            setSelectedTicketId={setSelectedTicketId}
            onTicketUpdated={handleTicketUpdated}
            openNewTicketModal={() => setActiveTab('intake')}
            searchFilter={globalSearch}
          />
        )}

        {activeTab === 'intake' && (
          <PriorityPredictor
            agents={agents}
            setAgents={setAgents}
            onTicketCreated={handleTicketCreated}
            onNavigateToConsole={handleNavigateToConsole}
          />
        )}

        {activeTab === 'copilot' && (
          <AgentforceCopilot
            tickets={tickets}
            selectedTicketId={selectedTicketId}
            onTicketUpdated={handleTicketUpdated}
            onNavigateToConsole={handleNavigateToConsole}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            tickets={tickets}
            agents={agents}
            onSelectTicket={setSelectedTicketId}
            onNavigateToConsole={handleNavigateToConsole}
          />
        )}

        {activeTab === 'rules' && (
          <AssignmentRulesView
            agents={agents}
            setAgents={setAgents}
            tickets={tickets}
            setTickets={setTickets}
            addNotification={addNotification}
          />
        )}
      </main>

      {/* Slide-out Notification Drawer */}
      <NotificationCenter
        isOpen={openNotifications}
        onClose={() => setOpenNotifications(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        onSelectTicket={handleNavigateToConsole}
      />

      {/* Salesforce Integration & Sync Architecture Modal */}
      <SalesforceSyncModal
        isOpen={openSyncModal}
        onClose={() => setOpenSyncModal(false)}
        tickets={tickets}
        onResetData={handleResetData}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-[#032D60] text-white p-3.5 rounded-xl shadow-2xl border border-sky-400/40 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-1 rounded bg-[#0176D3] text-white shrink-0 mt-0.5">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <h4 className="font-bold text-white truncate">{toast.title}</h4>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-0.5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
