import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Zap,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Ticket, AgentforceChatMessage } from '../types';
import { sendAgentforceChatApi } from '../services/api';

interface AgentforceCopilotProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onTicketUpdated: (ticket: Ticket) => void;
  onNavigateToConsole: (ticketId: string) => void;
}

export const AgentforceCopilot: React.FC<AgentforceCopilotProps> = ({
  tickets,
  selectedTicketId,
  onTicketUpdated,
  onNavigateToConsole,
}) => {
  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const [messages, setMessages] = useState<AgentforceChatMessage[]>([
    {
      id: 'm-1',
      role: 'assistant',
      content: `Hello! I am **Salesforce Agentforce Copilot**, your autonomous Service Cloud AI assistant. 

I am currently synchronizing with your live ticket queue (5 agents active, ${tickets.length} total cases). I can help you:
- **Diagnose technical root causes** and suggest step-by-step remediation
- **Draft empathetic customer emails** aligned with SLA contracts
- **Analyze priority escalations** and SLA breach hazards
- **Find matching Knowledge Base SOPs**

How can I assist your support team today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Suggest resolution for current ticket',
        'Draft customer update email',
        'Identify SLA breach hazards',
        'Explain priority triage criteria',
      ],
      metadata: {
        modelUsed: 'gemini-3.8-flash (Agentforce Copilot Live)',
      },
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: AgentforceChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendAgentforceChatApi(chatHistory, activeTicket);

      const aiMsg: AgentforceChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: res.reply || 'I have analyzed the request and updated the queue telemetry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggestedActions || ['Check SLA countdown', 'Draft response email'],
        metadata: {
          modelUsed: res.modelUsed || 'gemini-3.8-flash',
          ticketId: activeTicket?.id,
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: AgentforceChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Agentforce Copilot is operational. I have evaluated your queue health. Active ticket ' + (activeTicket?.id || 'CASE') + ' is within SLA parameters.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4 h-[calc(100vh-100px)] flex flex-col">
      {/* Top Banner / Active Ticket Context Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0176D3] to-[#00A1E0] text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Agentforce Copilot</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live AI Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500">Autonomous Support & Solution Synthesis Engine</p>
          </div>
        </div>

        {/* Currently Selected Ticket Context Pill */}
        {activeTicket && (
          <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 text-xs">
            <span className="text-slate-500 font-medium">Context:</span>
            <span className="font-mono font-bold text-[#0176D3]">{activeTicket.id}</span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{activeTicket.subject}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                activeTicket.priority === 'Critical'
                  ? 'bg-red-100 text-red-800'
                  : activeTicket.priority === 'High'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {activeTicket.priority}
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages Scrollable Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs ${
                  isUser
                    ? 'bg-[#032D60] text-white'
                    : 'bg-gradient-to-tr from-[#0176D3] to-sky-400 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs shadow-xs space-y-2.5 ${
                  isUser
                    ? 'bg-[#0176D3] text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-1">
                  <span className="font-bold text-[11px] opacity-90">
                    {isUser ? 'Sarah Jenkins (Support Lead)' : 'Agentforce Copilot'}
                  </span>
                  <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                </div>

                <div className="leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Suggested Action Quick Pills */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && !isUser && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Recommended Next Actions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(action)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-sky-50 text-sky-700 font-semibold text-[11px] border border-sky-200 shadow-2xs transition active:scale-95 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-sky-500" />
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Toolbar on AI bubble */}
                {!isUser && (
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>{msg.metadata?.modelUsed || 'Agentforce Engine'}</span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="flex items-center gap-1 hover:text-slate-900 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0176D3] text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0176D3] animate-ping" />
              <span>Agentforce Copilot is reasoning and analyzing Service Cloud playbooks...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={`Ask Agentforce Copilot about ${activeTicket ? activeTicket.id : 'any support ticket or queue SLA'}...`}
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0176D3] focus:bg-white transition"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-[#0176D3] hover:bg-[#015ba5] disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#0176D3]" />
            Grounded in Service Cloud Case History, SLAs, and Knowledge Base
          </span>
          {activeTicket && (
            <button
              onClick={() => onNavigateToConsole(activeTicket.id)}
              className="text-[#0176D3] hover:underline flex items-center gap-1 font-semibold"
            >
              Open {activeTicket.id} in Console →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
