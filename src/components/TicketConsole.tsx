import React, { useState } from 'react';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  SupportAgent,
} from '../types';
import {
  AlertTriangle,
  Clock,
  User,
  Building,
  Mail,
  Bot,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle,
  RefreshCw,
  Send,
  BookOpen,
  FileText,
  History,
  Zap,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { evaluateAgentCandidates } from '../utils/assignmentEngine';
import { predictTicketPriorityApi, getAgentforceSolutionApi } from '../services/api';

interface TicketConsoleProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  agents: SupportAgent[];
  setAgents: React.Dispatch<React.SetStateAction<SupportAgent[]>>;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string) => void;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  openNewTicketModal: () => void;
  searchFilter: string;
}

export const TicketConsole: React.FC<TicketConsoleProps> = ({
  tickets,
  setTickets,
  agents,
  setAgents,
  selectedTicketId,
  setSelectedTicketId,
  onTicketUpdated,
  openNewTicketModal,
  searchFilter,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'solution' | 'details' | 'history'>('solution');

  const [isRePredicting, setIsRePredicting] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (priorityFilter !== 'All' && ticket.priority !== priorityFilter) return false;
    if (categoryFilter !== 'All' && ticket.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && ticket.status !== statusFilter) return false;
    if (agentFilter !== 'All' && ticket.assignedAgentId !== agentFilter) return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchSubject = ticket.subject.toLowerCase().includes(q);
      const matchDesc = ticket.issueDescription.toLowerCase().includes(q);
      const matchCustomer = ticket.customerName.toLowerCase().includes(q);
      const matchCompany = ticket.companyName.toLowerCase().includes(q);
      const matchId = ticket.id.toLowerCase().includes(q);
      const matchAgent = ticket.assignedAgentName.toLowerCase().includes(q);
      if (!matchSubject && !matchDesc && !matchCustomer && !matchCompany && !matchId && !matchAgent) {
        return false;
      }
    }
    return true;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || tickets[0];

  // Helper for priority pill styling
  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Low
          </span>
        );
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Enterprise':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            ★ Enterprise VIP
          </span>
        );
      case 'Premier':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            Premier
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-normal bg-slate-100 text-slate-700 border border-slate-200">
            Standard
          </span>
        );
    }
  };

  // Format SLA time remaining
  const getSlaIndicator = (ticket: Ticket) => {
    const breachTime = new Date(ticket.slaBreachTime).getTime();
    const now = Date.now();
    const diffMinutes = Math.round((breachTime - now) / (60 * 1000));

    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          SLA Met
        </span>
      );
    }

    if (diffMinutes <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          SLA Breached ({Math.abs(diffMinutes)}m ago)
        </span>
      );
    }

    if (diffMinutes < 60) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
          {diffMinutes}m remaining
        </span>
      );
    }

    const hours = (diffMinutes / 60).toFixed(1);
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
        <Clock className="w-3 h-3 text-slate-500" />
        {hours}h remaining
      </span>
    );
  };

  // Re-predict priority live using AI
  const handleRePredict = async () => {
    if (!selectedTicket) return;
    setIsRePredicting(true);
    try {
      const pred = await predictTicketPriorityApi({
        subject: selectedTicket.subject,
        issueDescription: selectedTicket.issueDescription,
        category: selectedTicket.category,
        customerTier: selectedTicket.customerTier,
        customerName: selectedTicket.customerName,
        companyName: selectedTicket.companyName,
      });

      const updated: Ticket = {
        ...selectedTicket,
        priority: pred.priority,
        predictedPriority: pred.priority,
        confidence: pred.confidence,
        sentiment: pred.sentiment,
        aiReasoning: pred.reasoning,
        keyFactors: pred.keyFactors || selectedTicket.keyFactors,
        slaTargetHours: pred.slaTargetHours,
        history: [
          {
            id: `H-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Priority Re-assessed by Agentforce',
            actor: 'Agentforce AI Engine',
            details: `Re-evaluated priority as ${pred.priority} (${Math.round(pred.confidence * 100)}% confidence).`,
            isAgentforce: true,
          },
          ...selectedTicket.history,
        ],
      };

      onTicketUpdated(updated);
    } finally {
      setIsRePredicting(false);
    }
  };

  // Re-assign agent dynamically using Agentforce Algorithm
  const handleReassign = () => {
    if (!selectedTicket) return;
    setIsReassigning(true);
    setTimeout(() => {
      const evalResult = evaluateAgentCandidates(
        selectedTicket.category,
        selectedTicket.priority,
        selectedTicket.customerTier,
        agents
      );

      const oldAgent = selectedTicket.assignedAgentName;
      const newAgent = evalResult.bestAgent;

      const updated: Ticket = {
        ...selectedTicket,
        assignedAgentId: newAgent.id,
        assignedAgentName: newAgent.name,
        assignedAgentRole: newAgent.role,
        assignmentRationale: evalResult.rationale,
        history: [
          {
            id: `H-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Automated Re-assignment',
            actor: 'Agentforce Routing Engine',
            details: `Reassigned from ${oldAgent} to ${newAgent.name}. Rationale: ${evalResult.rationale}`,
            isAgentforce: true,
          },
          ...selectedTicket.history,
        ],
      };

      // update agent counts
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === selectedTicket.assignedAgentId && a.id !== newAgent.id) {
            return { ...a, currentTickets: Math.max(0, a.currentTickets - 1) };
          }
          if (a.id === newAgent.id && a.id !== selectedTicket.assignedAgentId) {
            return { ...a, currentTickets: a.currentTickets + 1 };
          }
          return a;
        })
      );

      onTicketUpdated(updated);
      setIsReassigning(false);
    }, 600);
  };

  // Generate Solution Draft via Agentforce Copilot
  const handleGenerateSolution = async () => {
    if (!selectedTicket) return;
    setIsGeneratingSolution(true);
    try {
      const result = await getAgentforceSolutionApi(selectedTicket);
      const updated: Ticket = {
        ...selectedTicket,
        solutionNotes: result.recommendedSolution || selectedTicket.solutionNotes,
        customerReplyDraft: result.customerResponseDraft || selectedTicket.customerReplyDraft,
        macroAction: result.macroAction || selectedTicket.macroAction,
        history: [
          {
            id: `H-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Agentforce Solution Generated',
            actor: 'Agentforce Copilot',
            details: 'Synthesized diagnostic steps and customer reply draft.',
            isAgentforce: true,
          },
          ...selectedTicket.history,
        ],
      };
      onTicketUpdated(updated);
    } finally {
      setIsGeneratingSolution(false);
    }
  };

  // Status Change handler
  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const updated: Ticket = {
      ...selectedTicket,
      status: newStatus,
      history: [
        {
          id: `H-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: `Status changed to ${newStatus}`,
          actor: 'Sarah Jenkins (Current User)',
          details: `Manual state transition in Service Cloud console.`,
        },
        ...selectedTicket.history,
      ],
    };
    onTicketUpdated(updated);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] bg-[#F3F3F3]">
      {/* Top Filter & Omnichannel Control Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-700 font-medium hover:bg-slate-100 transition focus:outline-none focus:border-[#0176D3]"
          >
            <option value="All">All Priorities ({tickets.length})</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-700 font-medium hover:bg-slate-100 transition focus:outline-none focus:border-[#0176D3]"
          >
            <option value="All">All Categories</option>
            <option value="Billing & Invoicing">Billing & Invoicing</option>
            <option value="Technical / Bug">Technical / Bug</option>
            <option value="Account Access & Security">Account Access & Security</option>
            <option value="API & Integration">API & Integration</option>
            <option value="Performance & Outage">Performance & Outage</option>
            <option value="Feature Request">Feature Request</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-700 font-medium hover:bg-slate-100 transition focus:outline-none focus:border-[#0176D3]"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Pending Customer">Pending Customer</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-700 font-medium hover:bg-slate-100 transition focus:outline-none focus:border-[#0176D3]"
          >
            <option value="All">All Agents</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({ag.currentTickets}/{ag.maxCapacity})
              </option>
            ))}
          </select>

          {(priorityFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All' || agentFilter !== 'All') && (
            <button
              onClick={() => {
                setPriorityFilter('All');
                setCategoryFilter('All');
                setStatusFilter('All');
                setAgentFilter('All');
              }}
              className="text-[#0176D3] hover:underline text-xs font-semibold ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>
          <button
            onClick={openNewTicketModal}
            className="px-3 py-1 bg-[#0176D3] hover:bg-[#015ba5] text-white font-medium rounded shadow-xs transition"
          >
            + Create Ticket
          </button>
        </div>
      </div>

      {/* Split Console: Left Ticket List, Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List Pane */}
        <div className="w-full md:w-96 lg:w-[420px] bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Ticket Queue</span>
            <span className="flex items-center gap-1 text-[11px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
              <Bot className="w-3 h-3" /> Agentforce Auto-Triage
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-xs">No tickets match your filters</p>
                <button
                  onClick={() => {
                    setPriorityFilter('All');
                    setCategoryFilter('All');
                    setStatusFilter('All');
                    setAgentFilter('All');
                  }}
                  className="mt-2 text-xs text-[#0176D3] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicket && selectedTicket.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 cursor-pointer transition relative hover:bg-slate-50 ${
                      isSelected
                        ? 'bg-sky-50/70 border-l-4 border-l-[#0176D3] shadow-xs'
                        : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0176D3]">{ticket.id}</span>
                        {getTierBadge(ticket.customerTier)}
                      </div>
                      {getPriorityBadge(ticket.priority)}
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 mb-1.5 leading-snug">
                      {ticket.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span className="truncate font-medium text-slate-700">
                        {ticket.customerName} • {ticket.companyName}
                      </span>
                      {getSlaIndicator(ticket)}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="text-slate-600 truncate max-w-[180px]">
                        📁 {ticket.category}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        {ticket.assignedAgentName.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Deep-Dive Inspector */}
        <div className="flex-1 bg-[#F8F9FA] overflow-y-auto flex flex-col">
          {selectedTicket ? (
            <div className="p-4 sm:p-6 space-y-4 max-w-6xl w-full mx-auto">
              {/* Ticket Top Banner */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#032D60] text-white font-mono font-bold text-xs">
                      {selectedTicket.id}
                    </span>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getTierBadge(selectedTicket.customerTier)}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedTicket.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                        className="bg-white border border-slate-300 rounded font-semibold px-2 py-1 text-slate-800 focus:outline-none focus:border-[#0176D3]"
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Pending Customer">Pending Customer</option>
                        <option value="Escalated">Escalated</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {getSlaIndicator(selectedTicket)}
                  </div>
                </div>

                <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-3 mb-2">
                  {selectedTicket.subject}
                </h1>

                {/* Customer summary strip */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="flex items-center gap-1.5 font-medium text-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {selectedTicket.customerName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedTicket.customerEmail}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {selectedTicket.companyName}
                  </span>
                  <span className="ml-auto text-slate-500 text-[11px]">
                    Created: {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Agentforce 2-Card Intelligence Deck: Priority Prediction + Automated Assignment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Agentforce Priority Prediction Card */}
                <div className="bg-gradient-to-br from-white to-sky-50/50 rounded-lg border border-sky-200/80 p-4 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#0176D3] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 tracking-tight">Agentforce Priority Prediction</h3>
                        <p className="text-[10px] text-slate-500">Autonomous Severity & Impact Assessment</p>
                      </div>
                    </div>

                    <button
                      onClick={handleRePredict}
                      disabled={isRePredicting}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#0176D3] hover:text-[#015ba5] bg-white px-2 py-1 rounded border border-slate-200 shadow-xs transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRePredicting ? 'animate-spin' : ''}`} />
                      {isRePredicting ? 'Re-evaluating...' : 'Re-Predict with AI'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 bg-white p-2.5 rounded border border-slate-200/80">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Predicted Priority</p>
                      <div className="mt-0.5">{getPriorityBadge(selectedTicket.predictedPriority)}</div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Confidence</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.round((selectedTicket.confidence || 0.9) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {Math.round((selectedTicket.confidence || 0.9) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Customer Sentiment</p>
                      <span className={`text-xs font-semibold ${
                        selectedTicket.sentiment === 'Highly Frustrated' ? 'text-red-700' :
                        selectedTicket.sentiment === 'Negative' ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        {selectedTicket.sentiment || 'Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* AI Reasoning Text */}
                  <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded border border-sky-100 mb-2">
                    <span className="font-semibold text-sky-950 block mb-0.5">AI Triage Rationale:</span>
                    <p className="text-slate-700 leading-relaxed">{selectedTicket.aiReasoning}</p>
                  </div>

                  {/* Key Factors */}
                  {selectedTicket.keyFactors && selectedTicket.keyFactors.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Key Severity Triggers:</span>
                      <ul className="text-[11px] text-slate-600 space-y-0.5 pl-3 list-disc">
                        {selectedTicket.keyFactors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2. Agentforce Automated Assignment Card */}
                <div className="bg-gradient-to-br from-white to-indigo-50/40 rounded-lg border border-indigo-200/80 p-4 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 tracking-tight">Agentforce Automated Assignment</h3>
                        <p className="text-[10px] text-slate-500">Intelligent Multi-Agent Skill Routing</p>
                      </div>
                    </div>

                    <button
                      onClick={handleReassign}
                      disabled={isReassigning}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-xs transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isReassigning ? 'animate-spin' : ''}`} />
                      {isReassigning ? 'Re-routing...' : 'Re-Run Assignment'}
                    </button>
                  </div>

                  {/* Current Assigned Agent Card */}
                  <div className="flex items-center gap-3 bg-white p-3 rounded border border-slate-200/80 mb-3">
                    {(() => {
                      const agent = agents.find((a) => a.id === selectedTicket.assignedAgentId);
                      return (
                        <>
                          <img
                            src={agent?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                            alt={selectedTicket.assignedAgentName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900">{selectedTicket.assignedAgentName}</h4>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                CSAT: {agent?.csat || 4.9} ★
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">{selectedTicket.assignedAgentRole}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600 font-medium">
                              <span>Workload: {agent?.currentTickets || 2}/{agent?.maxCapacity || 4} slots</span>
                              <span>•</span>
                              <span className="text-emerald-600">Omni: {agent?.status || 'Online'}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Assignment Rationale Text */}
                  <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded border border-indigo-100 mb-2">
                    <span className="font-semibold text-indigo-950 block mb-0.5">Agentforce Autonomous Routing Rationale:</span>
                    <p className="text-slate-700 leading-relaxed">{selectedTicket.assignmentRationale}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>SLA Commitment: <strong>{selectedTicket.slaTargetHours}h target</strong></span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-indigo-600" />
                      Optimized Match Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Lower Tabs Deck: Solution, Description, History */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4">
                  <button
                    onClick={() => setActiveInspectorTab('solution')}
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition ${
                      activeInspectorTab === 'solution'
                        ? 'border-[#0176D3] text-[#0176D3] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Agentforce AI Solution & Responses
                  </button>

                  <button
                    onClick={() => setActiveInspectorTab('details')}
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition ${
                      activeInspectorTab === 'details'
                        ? 'border-[#0176D3] text-[#0176D3] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Customer Issue Narrative & Tags
                  </button>

                  <button
                    onClick={() => setActiveInspectorTab('history')}
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition ${
                      activeInspectorTab === 'history'
                        ? 'border-[#0176D3] text-[#0176D3] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Service Cloud Audit Trail ({selectedTicket.history?.length || 0})
                  </button>
                </div>

                <div className="p-5">
                  {/* TAB 1: Solution */}
                  {activeInspectorTab === 'solution' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            AI-Synthesized Diagnostics & Resolution Playbook
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Generated by Salesforce Agentforce grounded in Enterprise Service Cloud Playbooks
                          </p>
                        </div>
                        <button
                          onClick={handleGenerateSolution}
                          disabled={isGeneratingSolution}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0176D3] hover:bg-[#015ba5] text-white text-xs font-semibold rounded shadow-xs transition"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSolution ? 'animate-spin' : ''}`} />
                          {isGeneratingSolution ? 'Synthesizing...' : 'Re-Generate AI Playbook'}
                        </button>
                      </div>

                      {/* Diagnostic Steps */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900">Recommended Troubleshooting Steps</span>
                        </div>
                        <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                          {selectedTicket.solutionNotes || 'Click "Re-Generate AI Playbook" to generate step-by-step resolution steps for this ticket.'}
                        </pre>
                      </div>

                      {/* Customer Reply Draft */}
                      <div className="bg-sky-50/50 border border-sky-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#0176D3]" />
                            <span className="text-xs font-bold text-sky-950">Draft Customer Email (Ready to Send)</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(selectedTicket.customerReplyDraft || '')}
                            className="flex items-center gap-1 text-[11px] font-semibold text-[#0176D3] hover:text-[#015ba5] bg-white px-2 py-1 rounded border border-slate-200 shadow-xs"
                          >
                            {copiedDraft ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copiedDraft ? 'Copied!' : 'Copy Email'}
                          </button>
                        </div>
                        <textarea
                          readOnly
                          value={selectedTicket.customerReplyDraft || 'Generating draft customer response...'}
                          className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded p-3 font-sans leading-relaxed resize-none h-28 focus:outline-none"
                        />
                      </div>

                      {/* Macro Action Button */}
                      {selectedTicket.macroAction && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-600" />
                            <div>
                              <p className="text-xs font-bold text-indigo-950">Recommended Macro Execution</p>
                              <p className="text-[11px] text-indigo-700">{selectedTicket.macroAction}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              alert(`Agentforce Macro Executed: "${selectedTicket.macroAction}" applied to ${selectedTicket.id}. Audit log updated.`);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-xs transition"
                          >
                            Execute Macro
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Details */}
                  {activeInspectorTab === 'details' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                          Original Issue Description
                        </h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-800 leading-relaxed font-sans">
                          {selectedTicket.issueDescription}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                          Associated Tags & Entities
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTicket.tags && selectedTicket.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Tier</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTicket.customerTier}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Target SLA</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTicket.slaTargetHours} Hours</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Source Channel</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">Salesforce REST API</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Confidence Score</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">
                            {Math.round((selectedTicket.confidence || 0.9) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: History */}
                  {activeInspectorTab === 'history' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Lifecycle Timeline & Agentforce Audit Log
                        </h4>
                        <span className="text-[11px] text-slate-500">Immutable ledger events</span>
                      </div>

                      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                        {selectedTicket.history?.map((h) => (
                          <div key={h.id} className="relative flex items-start gap-3 pl-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 z-10 ${
                                h.isAgentforce
                                  ? 'bg-[#0176D3] text-white shadow-xs'
                                  : 'bg-slate-200 text-slate-700 border border-white'
                              }`}
                            >
                              {h.isAgentforce ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{h.action}</span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(h.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">Actor: {h.actor}</p>
                              <p className="text-slate-700 mt-1 leading-relaxed">{h.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="m-auto text-center p-8 text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-sm text-slate-700">No Ticket Selected</p>
              <p className="text-xs text-slate-500 mt-1">Select a support ticket from the queue or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
