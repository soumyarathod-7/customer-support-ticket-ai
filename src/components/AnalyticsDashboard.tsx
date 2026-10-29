import React from 'react';
import {
  Ticket,
  SupportAgent,
  TicketPriority,
  TicketCategory,
} from '../types';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  Bot,
  Zap,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  tickets: Ticket[];
  agents: SupportAgent[];
  onSelectTicket: (ticketId: string) => void;
  onNavigateToConsole: (ticketId: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  tickets,
  agents,
  onSelectTicket,
  onNavigateToConsole,
}) => {
  // Compute Key Metrics
  const totalTickets = tickets.length;
  const criticalCount = tickets.filter((t) => t.priority === 'Critical').length;
  const highCount = tickets.filter((t) => t.priority === 'High').length;
  const mediumCount = tickets.filter((t) => t.priority === 'Medium').length;
  const lowCount = tickets.filter((t) => t.priority === 'Low').length;

  const resolvedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
  const openCount = totalTickets - resolvedCount;

  const slaBreachedCount = tickets.filter((t) => t.isSlaBreached).length;
  const slaCompliancePercent = totalTickets > 0 ? (((totalTickets - slaBreachedCount) / totalTickets) * 100).toFixed(1) : '100.0';

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  // Calculate Agent Utilization
  const totalSlots = agents.reduce((acc, a) => acc + a.maxCapacity, 0);
  const usedSlots = agents.reduce((acc, a) => acc + a.currentTickets, 0);
  const avgUtilization = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

  // Tickets nearest to SLA breach
  const activeTicketsWithSla = tickets
    .filter((t) => t.status !== 'Resolved' && t.status !== 'Closed')
    .map((t) => {
      const breachTime = new Date(t.slaBreachTime).getTime();
      const diffMin = Math.round((breachTime - Date.now()) / (60 * 1000));
      return { ...t, diffMin };
    })
    .sort((a, b) => a.diffMin - b.diffMin);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Service Cloud & Agentforce Analytics
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-[#0176D3]">
              Real-Time Triage Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring ticket velocity, priority classification distribution, and support engineer workload balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Live Agentforce Engine:</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" /> 100% Autonomous Triage
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Tickets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] uppercase font-bold text-slate-500">Total Cases</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-slate-900">{totalTickets}</p>
            <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
              {openCount} Open
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Across all organizations</p>
        </div>

        {/* Critical & High */}
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-xs">
          <p className="text-[11px] uppercase font-bold text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Critical / High
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-red-700">{criticalCount + highCount}</p>
            <span className="text-[11px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
              {criticalCount} Critical
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Accelerated 1h-4h SLAs</p>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SLA Compliance
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-emerald-600">{slaCompliancePercent}%</p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Target: 95%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Contractual commitments</p>
        </div>

        {/* Agent Capacity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#0176D3]" /> Team Workload
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-slate-900">{avgUtilization}%</p>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              {usedSlots}/{totalSlots} slots
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Balanced by Agentforce</p>
        </div>

        {/* Autonomous Resolution Rate */}
        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs col-span-2 lg:col-span-1">
          <p className="text-[11px] uppercase font-bold text-indigo-700 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" /> AI Triage Rate
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-indigo-900">97.6%</p>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
              Zero Manual
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Instant priority routing</p>
        </div>
      </div>

      {/* 2-Column Section: Priority Distribution & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ticket Priority Distribution
              </h3>
              <p className="text-[11px] text-slate-500">Predicted and categorized by AI</p>
            </div>
            <span className="text-xs font-bold text-[#0176D3]">{totalTickets} Cases</span>
          </div>

          {/* Progress Stack Bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex shadow-inner bg-slate-100">
            <div
              style={{ width: `${(criticalCount / totalTickets) * 100}%` }}
              className="bg-red-500 transition-all"
              title={`Critical: ${criticalCount}`}
            />
            <div
              style={{ width: `${(highCount / totalTickets) * 100}%` }}
              className="bg-amber-500 transition-all"
              title={`High: ${highCount}`}
            />
            <div
              style={{ width: `${(mediumCount / totalTickets) * 100}%` }}
              className="bg-blue-500 transition-all"
              title={`Medium: ${mediumCount}`}
            />
            <div
              style={{ width: `${(lowCount / totalTickets) * 100}%` }}
              className="bg-emerald-500 transition-all"
              title={`Low: ${lowCount}`}
            />
          </div>

          {/* Detailed Priority Rows */}
          <div className="space-y-2.5 pt-1">
            {[
              { label: 'Critical Priority (1h SLA)', count: criticalCount, color: 'bg-red-500', text: 'text-red-700' },
              { label: 'High Priority (4h SLA)', count: highCount, color: 'bg-amber-500', text: 'text-amber-700' },
              { label: 'Medium Priority (12h SLA)', count: mediumCount, color: 'bg-blue-500', text: 'text-blue-700' },
              { label: 'Low Priority (24h SLA)', count: lowCount, color: 'bg-emerald-500', text: 'text-emerald-700' },
            ].map((p, i) => {
              const pct = totalTickets > 0 ? Math.round((p.count / totalTickets) * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded ${p.color}`} />
                    <span className="font-semibold text-slate-800">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono">{pct}%</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded bg-slate-100 ${p.text}`}>
                      {p.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Support Category Volume
              </h3>
              <p className="text-[11px] text-slate-500">Service Cloud Case Classifications</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Normalized count</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-800">{cat}</span>
                    <span className="text-slate-600 font-mono font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0176D3] h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Support Agent Performance & Workload Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0176D3]" />
              Support Agent Capacity & Performance Leaderboard
            </h3>
            <p className="text-[11px] text-slate-500">
              Agentforce balances incoming tickets in real-time based on current capacity and customer tier clearance.
            </p>
          </div>

          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
            All 5 Agents Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Workload / Capacity</th>
                <th className="py-2.5 px-3">Clearance</th>
                <th className="py-2.5 px-3">CSAT Rating</th>
                <th className="py-2.5 px-3">Avg Resolution</th>
                <th className="py-2.5 px-3">Specialization</th>
                <th className="py-2.5 px-3">Omni Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((ag) => {
                const utilRatio = (ag.currentTickets / ag.maxCapacity) * 100;
                return (
                  <tr key={ag.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ag.avatar}
                          alt={ag.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{ag.name}</p>
                          <p className="text-[11px] text-slate-500">{ag.role}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-700">
                            {ag.currentTickets} / {ag.maxCapacity} Cases
                          </span>
                          <span className="text-slate-500">{Math.round(utilRatio)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              utilRatio >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${utilRatio}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {ag.tierClearance.map((tier) => (
                          <span
                            key={tier}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              tier === 'Enterprise'
                                ? 'bg-purple-100 text-purple-800'
                                : tier === 'Premier'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {tier}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ★ {ag.csat.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {ag.avgResolutionHours} hrs
                    </td>

                    <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={ag.specialization}>
                      {ag.specialization}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ag.status === 'Online'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ag.status === 'Busy'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ag.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {ag.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA Breach Watchlist */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Active SLA Countdown Watchlist
            </h3>
          </div>
          <span className="text-xs text-slate-500">Sorted by proximity to SLA breach</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeTicketsWithSla.slice(0, 3).map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onNavigateToConsole(ticket.id)}
              className="p-3 bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 rounded-lg cursor-pointer transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0176D3]">{ticket.id}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    ticket.priority === 'Critical'
                      ? 'bg-red-100 text-red-800'
                      : ticket.priority === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>

              <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                {ticket.subject}
              </h4>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>{ticket.assignedAgentName.split(' ')[0]}</span>
                <span className={`font-bold ${ticket.diffMin < 60 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {ticket.diffMin > 0 ? `${ticket.diffMin}m remaining` : 'Breached'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
