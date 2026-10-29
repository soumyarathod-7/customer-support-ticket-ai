import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Building,
  Mail,
  Shield,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react';
import {
  Ticket,
  SupportAgent,
  TicketCategory,
  CustomerTier,
  TicketPriority,
  PriorityPredictionResult,
} from '../types';
import { evaluateAgentCandidates, AssignmentEvaluation } from '../utils/assignmentEngine';
import { predictTicketPriorityApi } from '../services/api';

interface PriorityPredictorProps {
  agents: SupportAgent[];
  setAgents: React.Dispatch<React.SetStateAction<SupportAgent[]>>;
  onTicketCreated: (ticket: Ticket) => void;
  onNavigateToConsole: (ticketId: string) => void;
}

export const PriorityPredictor: React.FC<PriorityPredictorProps> = ({
  agents,
  setAgents,
  onTicketCreated,
  onNavigateToConsole,
}) => {
  // Form State
  const [customerName, setCustomerName] = useState('Alexander Reed');
  const [customerEmail, setCustomerEmail] = useState('a.reed@acmesystems.io');
  const [companyName, setCompanyName] = useState('Acme Systems Inc.');
  const [customerTier, setCustomerTier] = useState<CustomerTier>('Enterprise');
  const [category, setCategory] = useState<TicketCategory>('Technical / Bug');
  const [subject, setSubject] = useState(
    'Production Database Connection Pool Exhausted - API 500 Failures across US-East'
  );
  const [issueDescription, setIssueDescription] = useState(
    'Our production cluster in us-east-1 is throwing pg_max_connections errors. 14,000 API requests have failed in the last 15 minutes, blocking our retail checkout pipeline during our Flash Sale event. We require immediate failover or pool expansion.'
  );

  // Prediction State
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PriorityPredictionResult | null>(null);
  const [evaluations, setEvaluations] = useState<AssignmentEvaluation[] | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<SupportAgent | null>(null);
  const [assignmentRationale, setAssignmentRationale] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string>('');

  // Sample Presets for Fast Testing
  const presets = [
    {
      title: 'Critical Outage (API & Checkout)',
      tier: 'Enterprise' as CustomerTier,
      category: 'API & Integration' as TicketCategory,
      subject: 'Stripe Webhook signatures failing on EU cluster - payment checkout returning 502',
      description: 'Starting at 09:15 UTC, all incoming webhook events for subscription charges from the Dublin EU gateway are receiving HTTP 502 Bad Gateway. Merchant checkout is stalled for 18,000 active shoppers.',
    },
    {
      title: 'Critical Billing Dispute ($125k)',
      tier: 'Enterprise' as CustomerTier,
      category: 'Billing & Invoicing' as TicketCategory,
      subject: 'Double-charged 250 Enterprise seats during renewal cycle - CFO demands immediate reversal',
      description: 'Our card was charged twice for our annual expansion ($125,000 x 2). CFO is demanding immediate void and corrected tax invoice.',
    },
    {
      title: 'High Security (SAML SSO)',
      tier: 'Premier' as CustomerTier,
      category: 'Account Access & Security' as TicketCategory,
      subject: 'SAML 2.0 Okta Single Sign-On certificate expired, 400 employees locked out',
      description: 'Our IdP certificate rotated earlier this morning in Okta. Over 400 employees receive an ADFS/SAML signature mismatch error and cannot authenticate.',
    },
    {
      title: 'Medium Bug (CSV Timeout)',
      tier: 'Standard' as CustomerTier,
      category: 'Technical / Bug' as TicketCategory,
      subject: 'CSV export for compliance audit times out when exceeding 50,000 rows',
      description: 'When clicking Export Audit Log as CSV in admin dashboard for Q3 records, page spins for 60 seconds before showing Gateway Timeout.',
    },
    {
      title: 'Low Request (Portal Dark Mode)',
      tier: 'Standard' as CustomerTier,
      category: 'Feature Request' as TicketCategory,
      subject: 'Request to add dark mode toggle to Customer Support portal',
      description: 'Our night shift support reps would love a native dark theme toggle in the Service Cloud customer portal to reduce eye fatigue.',
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setCustomerTier(preset.tier);
    setCategory(preset.category);
    setSubject(preset.subject);
    setIssueDescription(preset.description);
    setPrediction(null);
    setEvaluations(null);
    setIsSubmitted(false);
  };

  // Run AI Priority Prediction + Agentforce Automated Assignment
  const handleRunPrediction = async () => {
    setIsPredicting(true);
    try {
      const predResult = await predictTicketPriorityApi({
        subject,
        issueDescription,
        category,
        customerTier,
        customerName,
        companyName,
      });
      setPrediction(predResult);

      // Run Agentforce auto-assignment algorithm
      const evalResult = evaluateAgentCandidates(
        category,
        predResult.priority,
        customerTier,
        agents
      );
      setEvaluations(evalResult.evaluations);
      setSelectedAgent(evalResult.bestAgent);
      setAssignmentRationale(evalResult.rationale);
    } finally {
      setIsPredicting(false);
    }
  };

  // Submit and create ticket in Service Cloud
  const handleCreateTicket = () => {
    if (!prediction || !selectedAgent) return;

    const newId = `CASE-${Math.floor(10500 + Math.random() * 900)}`;
    const now = new Date();
    const slaHours = prediction.slaTargetHours || 4;
    const breachTime = new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString();

    const newTicket: Ticket = {
      id: newId,
      subject,
      customerName,
      customerEmail,
      companyName,
      customerTier,
      category,
      issueDescription,
      priority: prediction.priority,
      predictedPriority: prediction.priority,
      confidence: prediction.confidence,
      sentiment: prediction.sentiment,
      status: 'New',
      assignedAgentId: selectedAgent.id,
      assignedAgentName: selectedAgent.name,
      assignedAgentRole: selectedAgent.role,
      assignmentRationale,
      slaTargetHours: slaHours,
      createdAt: now.toISOString(),
      slaBreachTime: breachTime,
      isSlaBreached: false,
      tags: prediction.recommendedTags || [category.toLowerCase().replace(/\s+/g, '-'), `${customerTier.toLowerCase()}-tier`],
      aiReasoning: prediction.reasoning,
      keyFactors: prediction.keyFactors || [],
      history: [
        {
          id: `H-${Date.now()}-1`,
          timestamp: now.toISOString(),
          action: 'Case Created',
          actor: `${customerName} (Service Cloud Intake)`,
          details: `Inbound ticket created via Agentforce Intake Engine.`,
        },
        {
          id: `H-${Date.now()}-2`,
          timestamp: new Date(now.getTime() + 1000).toISOString(),
          action: 'Priority Predicted',
          actor: 'Agentforce AI Engine',
          details: `Evaluated priority as ${prediction.priority} (${Math.round(prediction.confidence * 100)}% confidence). ${prediction.reasoning}`,
          isAgentforce: true,
        },
        {
          id: `H-${Date.now()}-3`,
          timestamp: new Date(now.getTime() + 2000).toISOString(),
          action: 'Automated Assignment',
          actor: 'Agentforce Routing Engine',
          details: assignmentRationale,
          isAgentforce: true,
        },
      ],
      solutionNotes: `1. Review ${category} diagnostic logs in Service Cloud.\n2. Verify client tier (${customerTier}) SLA policy.\n3. Implement immediate recovery patch.`,
      customerReplyDraft: `Dear ${customerName},\n\nWe have received your ticket regarding "${subject}". Our Agentforce AI has assigned your case directly to ${selectedAgent.name} (${selectedAgent.role}) with ${prediction.priority} priority. We are actively working toward resolution within our ${slaHours}-hour SLA guarantee.\n\nBest regards,\nSalesforce Service Cloud Support Team`,
    };

    // Update agent's active ticket count
    setAgents((prev) =>
      prev.map((a) => (a.id === selectedAgent.id ? { ...a, currentTickets: a.currentTickets + 1 } : a))
    );

    onTicketCreated(newTicket);
    setCreatedTicketId(newId);
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#032D60] to-[#0176D3] text-white p-6 rounded-xl shadow-md border border-sky-400/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-400/20 text-sky-200 text-xs font-bold uppercase tracking-wider border border-sky-300/30">
                Agentforce Intake Engine
              </span>
              <span className="text-xs text-sky-200 font-medium">Powered by Gemini 3.8 Flash</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Ticket Priority Prediction & Autonomous Assignment
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl">
              Submit support tickets, classify severity with AI, calculate SLA commitments, and autonomously dispatch cases to optimal support engineers using Salesforce Agentforce rules.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/20 text-center min-w-[140px]">
            <p className="text-[10px] text-sky-200 font-semibold uppercase tracking-wider">Routing Accuracy</p>
            <p className="text-2xl font-bold text-white">98.4%</p>
            <p className="text-[10px] text-sky-300">Agent Capacity Aware</p>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center flex-wrap gap-2 text-xs">
          <span className="font-semibold text-sky-200 mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Quick Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition active:scale-95"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form on Left, Live AI Prediction & Assignment on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intake Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0176D3]" />
              Support Ticket Intake Details
            </h2>
            <span className="text-xs text-slate-500">Service Cloud Case Intake</span>
          </div>

          {/* Customer Info row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:border-[#0176D3] focus:outline-none"
                  placeholder="e.g. Alexander Reed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:border-[#0176D3] focus:outline-none"
                  placeholder="alex@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:border-[#0176D3] focus:outline-none"
                  placeholder="Acme Systems Inc."
                />
              </div>
            </div>
          </div>

          {/* Customer Tier & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Tier</label>
              <select
                value={customerTier}
                onChange={(e) => setCustomerTier(e.target.value as CustomerTier)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-medium focus:border-[#0176D3] focus:outline-none bg-white"
              >
                <option value="Enterprise">Enterprise (1h Critical SLA)</option>
                <option value="Premier">Premier (4h SLA)</option>
                <option value="Standard">Standard (12h-24h SLA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-medium focus:border-[#0176D3] focus:outline-none bg-white"
              >
                <option value="Billing & Invoicing">Billing & Invoicing</option>
                <option value="Technical / Bug">Technical / Bug</option>
                <option value="Account Access & Security">Account Access & Security</option>
                <option value="API & Integration">API & Integration</option>
                <option value="Performance & Outage">Performance & Outage</option>
                <option value="Feature Request">Feature Request</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-medium focus:border-[#0176D3] focus:outline-none"
              placeholder="Brief summary of the issue..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Narrative & Description</label>
            <textarea
              rows={5}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded focus:border-[#0176D3] focus:outline-none leading-relaxed"
              placeholder="Provide full technical context, error messages, business impact, and urgency..."
            />
          </div>

          {/* Action Button: Predict Priority with Agentforce */}
          <div className="pt-2">
            <button
              onClick={handleRunPrediction}
              disabled={isPredicting || !subject.trim() || !issueDescription.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0176D3] hover:bg-[#015ba5] disabled:opacity-60 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.99]"
            >
              <Sparkles className={`w-4 h-4 ${isPredicting ? 'animate-spin' : ''}`} />
              {isPredicting ? 'Agentforce Analyzing Severity & Routing...' : 'Predict Priority & Auto-Assign with AI'}
            </button>
          </div>
        </div>

        {/* Right Column: AI Prediction & Automated Assignment Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {prediction ? (
            <div className="bg-white rounded-xl border border-sky-300/80 p-5 shadow-sm space-y-4 relative overflow-hidden animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#0176D3] text-white flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Agentforce AI Evaluation</h3>
                    <p className="text-[10px] text-slate-500">Live Decision Matrix</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {prediction.modelUsed || 'Agentforce Engine'}
                </span>
              </div>

              {/* Priority Display Banner */}
              <div
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  prediction.priority === 'Critical'
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : prediction.priority === 'High'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : prediction.priority === 'Medium'
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Predicted Priority</p>
                  <p className="text-xl font-black">{prediction.priority}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Target SLA</p>
                  <p className="text-sm font-bold flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    {prediction.slaTargetHours} Hours
                  </p>
                </div>
              </div>

              {/* Confidence & Sentiment metrics */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence Score</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800">{Math.round(prediction.confidence * 100)}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Customer Sentiment</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{prediction.sentiment}</p>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="text-xs text-slate-700 bg-sky-50/50 p-3 rounded-lg border border-sky-100">
                <span className="font-bold text-sky-950 block mb-1">Autonomous Reasoning:</span>
                <p className="leading-relaxed">{prediction.reasoning}</p>
              </div>

              {/* Auto-Assigned Support Agent */}
              {selectedAgent && (
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-900 flex items-center gap-1">
                      <Bot className="w-3 h-3 text-indigo-600" />
                      Auto-Assigned Support Specialist
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Match: 98%
                    </span>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-2.5 rounded border border-indigo-100">
                    <img
                      src={selectedAgent.avatar}
                      alt={selectedAgent.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-900">{selectedAgent.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">{selectedAgent.role}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600 font-medium">
                        <span>Workload: {selectedAgent.currentTickets}/{selectedAgent.maxCapacity} slots</span>
                        <span>•</span>
                        <span className="text-emerald-600">CSAT {selectedAgent.csat} ★</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-indigo-950 leading-relaxed font-medium">
                    {assignmentRationale}
                  </p>
                </div>
              )}

              {/* Candidate Scoring Breakdown */}
              {evaluations && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Multi-Agent Workload & Skill Ranking:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {evaluations.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.agent.id}
                        className={`flex items-center justify-between p-2 rounded text-xs border ${
                          idx === 0
                            ? 'bg-emerald-50/60 border-emerald-300 font-semibold text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center font-bold text-[10px] text-slate-400">#{idx + 1}</span>
                          <span className="truncate max-w-[130px]">{item.agent.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span>Cap: {item.agent.currentTickets}/{item.agent.maxCapacity}</span>
                          <span className="font-mono font-bold">{item.score} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispatch to Service Cloud Button */}
              {!isSubmitted ? (
                <button
                  onClick={handleCreateTicket}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  Dispatch & Commit to Service Cloud Queue
                </button>
              ) : (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Successfully Created {createdTicketId}!
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Dispatched to {selectedAgent?.name}. SLA countdown started.
                  </p>
                  <button
                    onClick={() => onNavigateToConsole(createdTicketId)}
                    className="w-full py-1.5 bg-[#0176D3] hover:bg-[#015ba5] text-white font-bold text-xs rounded shadow-xs transition"
                  >
                    View in Omni-Desk Console →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State Waiting for Prediction */
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-[#0176D3] flex items-center justify-center mx-auto border border-sky-100 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Ready for Agentforce Prediction</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Click <strong>"Predict Priority & Auto-Assign with AI"</strong> to classify ticket priority, evaluate customer sentiment, enforce SLAs, and find the optimal support agent.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Try one of the presets above for instant demo testing
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
