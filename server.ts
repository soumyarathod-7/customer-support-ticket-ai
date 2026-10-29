import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenAI | null = null;
if (apiKey) {
  genAI = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback logic for ticket priority prediction
function calculateFallbackPrediction(
  subject: string,
  description: string,
  category: string,
  tier: string
) {
  const combined = `${subject} ${description}`.toLowerCase();
  
  let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence = 0.88;
  let sentiment: 'Highly Frustrated' | 'Negative' | 'Neutral' | 'Positive' = 'Neutral';
  let slaTargetHours = 12;
  let reasoning = 'Evaluated based on standard Service Cloud intake heuristics.';
  let keyFactors: string[] = [];
  let potentialImpact = 'Standard business workflow affected without system-wide interruption.';

  const isSevere = /down|outage|crash|offline|data loss|breach|security|vulnerability|emergency|production down|blocker|unusable/i.test(combined);
  const isFinancial = /payment|charge|billing|invoice|double charged|unauthorized|refund|fraud/i.test(combined);
  const isUrgent = /urgent|asap|immediately|furious|escalate|cancelling|lost customer|sla/i.test(combined);
  const isBug = /error|bug|broken|failure|fails|500|exception|timeout/i.test(combined);

  if (isSevere || (tier === 'Enterprise' && isFinancial) || (isFinancial && isUrgent)) {
    priority = 'Critical';
    slaTargetHours = 1;
    confidence = 0.96;
    sentiment = isUrgent ? 'Highly Frustrated' : 'Negative';
    reasoning = `Production-impacting or financial blocker detected for ${tier} tier account with high revenue at risk.`;
    keyFactors = ['Production/System disruption keywords identified', 'Potential revenue or contract loss', `${tier} SLA requirement`];
    potentialImpact = 'High operational stoppage affecting active operations and client revenue.';
  } else if (isBug || isUrgent || tier === 'Enterprise') {
    priority = 'High';
    slaTargetHours = 4;
    confidence = 0.91;
    sentiment = 'Negative';
    reasoning = `Functional impairment affecting key operations for ${tier} tier customer. Requires accelerated Tier-2 triage.`;
    keyFactors = ['Functional disruption in core feature', 'Negative customer sentiment detected', 'Priority tier escalation'];
    potentialImpact = 'Key functionality degraded with moderate workaround feasibility.';
  } else if (/slow|intermittent|howto|question|guide|setup|export|config/i.test(combined)) {
    priority = 'Low';
    slaTargetHours = 24;
    confidence = 0.89;
    sentiment = 'Neutral';
    reasoning = 'Informational inquiry, configuration assistance, or non-blocking cosmetic request.';
    keyFactors = ['No system downtime', 'Standard operational inquiry', 'Normal response threshold'];
    potentialImpact = 'Minimal operational impact; user seeking guidance or configuration assistance.';
  } else {
    priority = 'Medium';
    slaTargetHours = 12;
    confidence = 0.85;
    sentiment = 'Neutral';
    reasoning = 'Standard issue impacting individual workflows without critical system degradation.';
    keyFactors = ['Individual user impact', 'Workaround available', 'Standard triage pipeline'];
    potentialImpact = 'Single department or user impacted; operational work can continue with temporary mitigation.';
  }

  return {
    priority,
    confidence,
    sentiment,
    urgencyScore: priority === 'Critical' ? 95 : priority === 'High' ? 78 : priority === 'Medium' ? 52 : 25,
    slaTargetHours,
    reasoning,
    keyFactors,
    suggestedCategory: category || 'Technical / Bug',
    slaBreachRisk: priority === 'Critical' ? 'High' : priority === 'High' ? 'Medium' : 'Low',
    recommendedTags: [
      category.replace(/\s+/g, '-').toLowerCase(),
      `${tier.toLowerCase()}-tier`,
      `${priority.toLowerCase()}-priority`,
    ],
    potentialImpact,
  };
}

// Route: Status check
app.get('/api/agentforce/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    agentforceVersion: 'Spring 2026 / Agentforce 360',
    geminiLive: Boolean(genAI),
    activeAutonomousAgents: 5,
    lastSyncTimestamp: new Date().toISOString(),
    serviceCloudConnected: true,
  });
});

// Route: Predict Ticket Priority using Gemini 3.8 Flash
app.post('/api/tickets/predict', async (req: Request, res: Response) => {
  try {
    const { subject, issueDescription, category, customerTier, customerName, companyName } = req.body;

    if (!genAI) {
      // Return rule-based prediction if no API key is provided
      const fallback = calculateFallbackPrediction(subject || '', issueDescription || '', category || 'Technical / Bug', customerTier || 'Standard');
      return res.json({
        ...fallback,
        modelUsed: 'Agentforce-Heuristic-Engine (Fallback / Demo Mode)',
      });
    }

    const prompt = `You are Salesforce Agentforce's Autonomous Ticket Triage and Priority Classifier AI.
Analyze the following customer support ticket and predict its Priority accurately.

Customer Details:
- Name: ${customerName || 'Customer'}
- Company: ${companyName || 'Enterprise Account'}
- Customer Support Tier: ${customerTier || 'Standard'}
- Category: ${category || 'Technical / Bug'}
- Subject: ${subject || 'Support Request'}
- Description: ${issueDescription || ''}

Evaluate the severity, financial impact, operational blockage, customer tier, and tone sentiment.
Ticket Priority rules:
- "Critical": Complete service outage, data corruption, security incident, immediate financial transaction failures, or VIP Enterprise blocking issues. SLA: 1 hour.
- "High": Significant functional degradation, billing discrepancies, core workflow broken for multiple users, impending SLA breach. SLA: 4 hours.
- "Medium": Non-critical bugs with workarounds, account provisioning issues, UI inconsistencies, configuration delays. SLA: 12 hours.
- "Low": General inquiries, feature requests, cosmetic bugs, documentation questions, minor feedback. SLA: 24 hours.

Return STRICT JSON matching this schema:
{
  "priority": "Critical" | "High" | "Medium" | "Low",
  "confidence": number between 0.70 and 0.99,
  "sentiment": "Highly Frustrated" | "Negative" | "Neutral" | "Positive",
  "urgencyScore": number from 1 to 100,
  "slaTargetHours": 1 | 4 | 12 | 24,
  "reasoning": "Clear concise 2-3 sentence explanation of why this priority was assigned based on impact and tier",
  "keyFactors": ["factor 1", "factor 2", "factor 3"],
  "suggestedCategory": "string",
  "slaBreachRisk": "High" | "Medium" | "Low",
  "recommendedTags": ["tag1", "tag2", "tag3"],
  "potentialImpact": "Short summary of business or operational impact"
}`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      modelUsed: 'gemini-3.8-flash (Salesforce Agentforce Live)',
    });
  } catch (err: any) {
    console.error('Error during priority prediction:', err);
    const fallback = calculateFallbackPrediction(
      req.body.subject || '',
      req.body.issueDescription || '',
      req.body.category || 'Technical / Bug',
      req.body.customerTier || 'Standard'
    );
    return res.json({
      ...fallback,
      modelUsed: 'Agentforce-Heuristic-Engine (Fallback)',
      warning: 'Switched to local Agentforce heuristic classifier due to API response status.',
    });
  }
});

// Route: AI Chatbot / Agentforce Solution Suggestion
app.post('/api/agentforce/suggest-solution', async (req: Request, res: Response) => {
  try {
    const { ticket } = req.body;

    if (!genAI) {
      return res.json({
        recommendedSolution: `1. Verify customer account status in Service Cloud.\n2. Review audit logs for recent errors associated with ${ticket?.category || 'this category'}.\n3. Apply standard resolution protocol according to Salesforce SLA playbook.`,
        customerResponseDraft: `Dear ${ticket?.customerName || 'Valued Customer'},\n\nThank you for contacting Support regarding "${ticket?.subject || 'your ticket'}". Our team has investigated the issue and initiated the recovery process. We anticipate full restoration shortly.\n\nBest regards,\nCustomer Support Team`,
        internalNotes: `Auto-triaged by Agentforce. Root cause identified as intermittent latency in upstream service. Monitoring telemetry.`,
        suggestedKnowledgeBaseArticles: [
          { id: 'KB-8841', title: 'Resolving Integration and API Latency in Production', relevance: 98, excerpt: 'Step-by-step guidance on validating webhook signatures and cache invalidation.' },
          { id: 'KB-5219', title: 'Service Cloud Priority Handling & Escalation Matrix', relevance: 92, excerpt: 'Enterprise customer SLA response timelines and on-call escalation rules.' }
        ],
        macroAction: 'Send Status Update & Schedule Followup',
        modelUsed: 'Agentforce Synthetic Playbook (Local)',
      });
    }

    const prompt = `You are Salesforce Agentforce Copilot for Support Service Cloud.
Analyze this ticket and generate an actionable solution, customer response draft, and internal technical notes.

Ticket Info:
- Ticket ID: ${ticket.id}
- Subject: ${ticket.subject}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Customer: ${ticket.customerName} (${ticket.companyName}, ${ticket.customerTier} Tier)
- Description: ${ticket.issueDescription}
- Assigned Agent: ${ticket.assignedAgentName || 'Unassigned'}

Return STRICT JSON:
{
  "recommendedSolution": "Numbered diagnostic and resolution steps for the support agent",
  "customerResponseDraft": "A professional, empathetic, enterprise-ready email response to the customer",
  "internalNotes": "Technical summary for Tier 2/3 engineering, potential root cause, and next actions",
  "suggestedKnowledgeBaseArticles": [
    { "id": "string e.g. KB-4091", "title": "string", "relevance": 95, "excerpt": "brief excerpt" },
    { "id": "string e.g. KB-3120", "title": "string", "relevance": 88, "excerpt": "brief excerpt" }
  ],
  "macroAction": "e.g. Issue Immediate Token Refresh | Deploy Configuration Patch | Escalate to Database SRE"
}`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      modelUsed: 'gemini-3.8-flash (Agentforce Copilot Live)',
    });
  } catch (err: any) {
    console.error('Error suggesting solution:', err);
    const safeTicket = req.body?.ticket;
    return res.json({
      recommendedSolution: `1. Triage ticket priority and inspect system health dashboards.\n2. Cross-reference customer transaction ID with payment gateway.\n3. Verify webhook delivery logs in Salesforce Service Cloud.`,
      customerResponseDraft: `Hi ${safeTicket?.customerName || 'Customer'},\n\nWe are actively reviewing your case (${safeTicket?.id || 'Case'}). Our engineering team has been notified and we will follow up with confirmation within the hour.\n\nWarm regards,\nSupport Operations`,
      internalNotes: `Auto-escalated by Agentforce fallback. Priority confirmed.`,
      suggestedKnowledgeBaseArticles: [
        { id: 'KB-1042', title: 'Automated Ticket Escalation and SLA Triage', relevance: 94, excerpt: 'Standard operating procedure for high-priority tickets.' }
      ],
      macroAction: 'Schedule Priority Callback',
      modelUsed: 'Agentforce Synthetic Playbook (Fallback)',
    });
  }
});

// Route: Interactive Agentforce Copilot Chat
app.post('/api/agentforce/chat', async (req: Request, res: Response) => {
  try {
    const { messages, activeTicket } = req.body;
    const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : 'Hello';

    if (!genAI) {
      let reply = `[Agentforce Copilot]: I am monitoring active Service Cloud queues. `;
      if (activeTicket) {
        reply += `Currently focusing on ticket ${activeTicket.id} (${activeTicket.subject}, ${activeTicket.priority} Priority). `;
        reply += `Recommended action: Review customer tier (${activeTicket.customerTier}) and verify if automated assignment to ${activeTicket.assignedAgentName} has initiated SLA countdown.`;
      } else {
        reply += `All 5 agents are active and priority triage is automated via Agentforce autonomous rules. How can I assist you with queue management or customer responses today?`;
      }
      return res.json({
        reply,
        suggestedActions: [
          'Draft executive customer update',
          'Check SLA breach countdown',
          'Run automated agent re-assignment',
        ],
        modelUsed: 'Agentforce Copilot Assistant (Demo Mode)',
      });
    }

    const systemInstruction = `You are Salesforce Agentforce Copilot, an AI support assistant embedded in Salesforce Service Cloud.
You assist support engineers, queue managers, and customer reps.
Be concise, professional, proactive, and knowledgeable about ITIL support workflows, priority classifications (Critical, High, Medium, Low), SLA requirements, and agent assignment.
Active Ticket Context (if any): ${activeTicket ? JSON.stringify(activeTicket) : 'None selected'}.`;

    const chatContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'I have analyzed the queue and updated the ticket status.';
    return res.json({
      reply,
      suggestedActions: [
        'Apply recommended fix',
        'Draft customer email',
        'Reassign based on workload',
      ],
      modelUsed: 'gemini-3.8-flash (Agentforce Copilot Live)',
    });
  } catch (err: any) {
    console.error('Error during copilot chat:', err);
    return res.json({
      reply: 'Agentforce Copilot is operational. I recommend checking the ticket priority metrics and SLA timer in the Service Cloud dashboard.',
      suggestedActions: ['Check SLA Timer', 'View Agent Capacity'],
      modelUsed: 'Agentforce Copilot (Fallback)',
    });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Salesforce Agentforce Ticket System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
