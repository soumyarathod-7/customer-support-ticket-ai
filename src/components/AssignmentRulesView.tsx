import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Shield,
  Bot,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SupportAgent, Ticket } from '../types';
import { evaluateAgentCandidates } from '../utils/assignmentEngine';

interface AssignmentRulesViewProps {
  agents: SupportAgent[];
  setAgents: React.Dispatch<React.SetStateAction<SupportAgent[]>>;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  addNotification: (title: string, message: string, type: 'agentforce' | 'assignment') => void;
}

export const AssignmentRulesView: React.FC<AssignmentRulesViewProps> = ({
  agents,
  setAgents,
  tickets,
  setTickets,
  addNotification,
}) => {
  const [skillWeight, setSkillWeight] = useState(40);
  const [capacityWeight, setCapacityWeight] = useState(30);
  const [tierWeight, setTierWeight] = useState(20);
  const [csatWeight, setCsatWeight] = useState(10);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceSummary, setRebalanceSummary] = useState<string | null>(null);

  // Simulate Agentforce Autonomous Queue Rebalancing
  const handleRebalanceQueue = () => {
    setIsRebalancing(true);
    setTimeout(() => {
      let rebalancedCount = 0;
      const updatedTickets = [...tickets];
      const updatedAgents = agents.map((a) => ({ ...a, currentTickets: 0 }));

      // Re-evaluate open tickets
      updatedTickets.forEach((ticket, idx) => {
        if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
          const evalResult = evaluateAgentCandidates(
            ticket.category,
            ticket.priority,
            ticket.customerTier,
            updatedAgents
          );

          if (evalResult.bestAgent.id !== ticket.assignedAgentId) {
            rebalancedCount++;
            updatedTickets[idx] = {
              ...ticket,
              assignedAgentId: evalResult.bestAgent.id,
              assignedAgentName: evalResult.bestAgent.name,
              assignedAgentRole: evalResult.bestAgent.role,
              assignmentRationale: `[Queue Rebalanced] ${evalResult.rationale}`,
              history: [
                {
                  id: `H-${Date.now()}-${idx}`,
                  timestamp: new Date().toISOString(),
                  action: 'Autonomous Queue Rebalance',
                  actor: 'Agentforce Routing Engine',
                  details: `Dynamically re-routed to ${evalResult.bestAgent.name} to optimize workload.`,
                  isAgentforce: true,
                },
                ...ticket.history,
              ],
            };
          }

          // tally agent ticket
          const agentIndex = updatedAgents.findIndex((a) => a.id === evalResult.bestAgent.id);
          if (agentIndex >= 0) {
            updatedAgents[agentIndex].currentTickets++;
          }
        }
      });

      setTickets(updatedTickets);
      setAgents(updatedAgents);
      setIsRebalancing(false);
      setRebalanceSummary(`Agentforce successfully rebalanced ${rebalancedCount} tickets across ${agents.length} agents.`);
      addNotification(
        'Queue Rebalanced',
        `Agentforce re-evaluated all active tickets to maintain optimal agent capacity.`,
        'agentforce'
      );
    }, 750);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#0176D3]" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Agentforce Automated Assignment Rules & Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-agent decision criteria, weighting thresholds, and customer SLA commitments.
          </p>
        </div>

        <button
          onClick={handleRebalanceQueue}
          disabled={isRebalancing}
          className="flex items-center gap-2 px-4 py-2 bg-[#0176D3] hover:bg-[#015ba5] disabled:opacity-60 text-white font-bold text-xs rounded-lg shadow-xs transition active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRebalancing ? 'animate-spin' : ''}`} />
          {isRebalancing ? 'Rebalancing Queue...' : 'Run Autonomous Rebalance'}
        </button>
      </div>

      {rebalanceSummary && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {rebalanceSummary}
          </span>
          <button
            onClick={() => setRebalanceSummary(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Decision Scoring Weights */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Agentforce Decision Algorithm Weights
            </h3>
            <p className="text-[11px] text-slate-500">
              Determines how candidates are scored when assigning incoming support tickets.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
            Total Weight: {skillWeight + capacityWeight + tierWeight + csatWeight}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Skill Weight */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Domain Skill Match</span>
              <span className="text-[#0176D3]">{skillWeight}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              value={skillWeight}
              onChange={(e) => setSkillWeight(Number(e.target.value))}
              className="w-full accent-[#0176D3]"
            />
            <p className="text-[10px] text-slate-500">
              Matches ticket category directly to agent's validated technical specialties.
            </p>
          </div>

          {/* Capacity Weight */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Available Capacity</span>
              <span className="text-[#0176D3]">{capacityWeight}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              value={capacityWeight}
              onChange={(e) => setCapacityWeight(Number(e.target.value))}
              className="w-full accent-[#0176D3]"
            />
            <p className="text-[10px] text-slate-500">
              Penalizes overloaded agents and distributes tickets to available agents.
            </p>
          </div>

          {/* Tier Weight */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Customer Tier Clearance</span>
              <span className="text-[#0176D3]">{tierWeight}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={40}
              value={tierWeight}
              onChange={(e) => setTierWeight(Number(e.target.value))}
              className="w-full accent-[#0176D3]"
            />
            <p className="text-[10px] text-slate-500">
              Ensures Enterprise and Premier accounts route to Senior/Lead engineers.
            </p>
          </div>

          {/* CSAT Weight */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>CSAT Quality Score</span>
              <span className="text-[#0176D3]">{csatWeight}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              value={csatWeight}
              onChange={(e) => setCsatWeight(Number(e.target.value))}
              className="w-full accent-[#0176D3]"
            />
            <p className="text-[10px] text-slate-500">
              Favors high CSAT ratings for complex and escalated situations.
            </p>
          </div>
        </div>
      </div>

      {/* SLA Policy Threshold Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Priority SLA Target Matrix
            </h3>
            <p className="text-[11px] text-slate-500">
              Standard Service Cloud SLA response agreements enforced automatically upon triage.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Active SLA Timers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="font-bold text-red-900 block mb-1">Critical Priority</span>
            <p className="text-lg font-black text-red-700">1.0 Hour</p>
            <p className="text-[11px] text-red-800 mt-1">Full outages, data loss, immediate revenue stoppage.</p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="font-bold text-amber-900 block mb-1">High Priority</span>
            <p className="text-lg font-black text-amber-700">4.0 Hours</p>
            <p className="text-[11px] text-amber-800 mt-1">Core feature broken, multiple users locked out.</p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="font-bold text-blue-900 block mb-1">Medium Priority</span>
            <p className="text-lg font-black text-blue-700">12.0 Hours</p>
            <p className="text-[11px] text-blue-800 mt-1">Non-critical bug with temporary workaround.</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="font-bold text-emerald-900 block mb-1">Low Priority</span>
            <p className="text-lg font-black text-emerald-700">24.0 Hours</p>
            <p className="text-[11px] text-emerald-800 mt-1">General inquiries, cosmetics, and feature suggestions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
