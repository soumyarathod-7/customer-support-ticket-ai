import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Database,
  Cloud,
  Cpu,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Ticket } from '../types';

interface SalesforceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  onResetData: () => void;
}

export const SalesforceSyncModal: React.FC<SalesforceSyncModalProps> = ({
  isOpen,
  onClose,
  tickets,
  onResetData,
}) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  if (!isOpen) return null;

  const handleSimulateSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 1200);
  };

  const handleExportJson = () => {
    const exportData = tickets.map((t) => ({
      attributes: {
        type: 'Case',
        url: `/services/data/v60.0/sobjects/Case/${t.id}`,
      },
      Id: t.id,
      CaseNumber: t.id.replace('CASE-', ''),
      Subject: t.subject,
      Description: t.issueDescription,
      Priority: t.priority,
      Agentforce_Predicted_Priority__c: t.predictedPriority,
      Agentforce_Confidence__c: t.confidence,
      Agentforce_Sentiment__c: t.sentiment,
      Agentforce_Rationale__c: t.aiReasoning,
      Status: t.status,
      Origin: 'Web-to-Case / REST API',
      ContactEmail: t.customerEmail,
      ContactName: t.customerName,
      Account: { Name: t.companyName, Tier__c: t.customerTier },
      Category__c: t.category,
      Owner: { Name: t.assignedAgentName, Role__c: t.assignedAgentRole },
      CreatedDate: t.createdAt,
      Target_SLA_Hours__c: t.slaTargetHours,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Salesforce_Service_Cloud_Cases_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ['Case ID', 'Subject', 'Priority', 'Customer', 'Company', 'Tier', 'Category', 'Status', 'Assigned Agent', 'SLA Hours', 'Created At'];
    const rows = tickets.map((t) => [
      `"${t.id}"`,
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${t.priority}"`,
      `"${t.customerName}"`,
      `"${t.companyName}"`,
      `"${t.customerTier}"`,
      `"${t.category}"`,
      `"${t.status}"`,
      `"${t.assignedAgentName}"`,
      `"${t.slaTargetHours}"`,
      `"${t.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Salesforce_Cases_Export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#032D60] text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0176D3] flex items-center justify-center font-bold text-xs">
              SF
            </div>
            <div>
              <h3 className="text-sm font-bold">Salesforce Integration Architecture</h3>
              <p className="text-[11px] text-slate-300">Live AI vs. Simulated Service Cloud Features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Comparison Cards: Real vs Simulated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real Technologies */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Real Active Technologies</span>
              </div>
              <ul className="space-y-1.5 text-emerald-950 text-[11px] list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Gemini 3.8 Flash AI Model:</strong> Server-side `@google/genai` calls predicting ticket priority (Critical, High, Medium, Low), customer sentiment, SLA timelines, and AI reasoning.
                </li>
                <li>
                  <strong>Autonomous Assignment Algorithm:</strong> Real multi-variable optimization engine calculating skill matches, agent capacity ratios, customer tier clearance, and CSAT scores.
                </li>
                <li>
                  <strong>Agentforce Copilot Assistant:</strong> Real-time generative chat synthesizing diagnostics, ITIL solutions, and empathetic customer email drafts.
                </li>
              </ul>
            </div>

            {/* Simulated Features */}
            <div className="p-4 rounded-xl border border-sky-300 bg-sky-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-sky-950 font-bold">
                <Cloud className="w-4 h-4 text-[#0176D3]" />
                <span>Simulated Salesforce Features</span>
              </div>
              <ul className="space-y-1.5 text-sky-950 text-[11px] list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Service Cloud REST API:</strong> Simulates `/services/data/v60.0/sobjects/Case` endpoints and web-to-case payloads.
                </li>
                <li>
                  <strong>Omni-Channel Presence:</strong> Simulates live agent status changes (Online, Busy, Away) and queue capacity thresholds.
                </li>
                <li>
                  <strong>Salesforce Org Context:</strong> Pre-populated with realistic enterprise cases, accounts, and Tier-1 SLA contracts.
                </li>
              </ul>
            </div>
          </div>

          {/* Org Details Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Simulated Salesforce Service Cloud Org Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Organization ID:</span>
                <span className="font-mono font-semibold text-slate-800">00D8c000008FxyzEAA</span>
              </div>
              <div>
                <span className="text-slate-400 block">Instance:</span>
                <span className="font-mono font-semibold text-slate-800">NA142 (Service Cloud)</span>
              </div>
              <div>
                <span className="text-slate-400 block">Agentforce Edition:</span>
                <span className="font-semibold text-slate-800">Spring '26 Autonomous</span>
              </div>
            </div>
          </div>

          {/* Sync Trigger and Export Actions */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleSimulateSync}
                disabled={syncStatus === 'syncing'}
                className="flex items-center gap-2 px-4 py-2 bg-[#0176D3] hover:bg-[#015ba5] disabled:opacity-60 text-white font-bold rounded-lg shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                {syncStatus === 'syncing'
                  ? 'Syncing with Salesforce Service Cloud...'
                  : syncStatus === 'synced'
                  ? 'Sync Completed!'
                  : 'Simulate Salesforce Org Sync'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
                  title="Export Cases as Salesforce JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export SF JSON</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
                  title="Export Cases as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Want to start fresh with demo data?</span>
              <button
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
              >
                Reset to Sample Enterprise Dataset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
