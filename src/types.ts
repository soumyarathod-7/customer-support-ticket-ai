export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TicketStatus = 
  | 'New' 
  | 'In Progress' 
  | 'Under Review' 
  | 'Pending Customer' 
  | 'Escalated' 
  | 'Resolved' 
  | 'Closed';

export type CustomerTier = 'Enterprise' | 'Premier' | 'Standard';

export type TicketCategory =
  | 'Billing & Invoicing'
  | 'Technical / Bug'
  | 'Account Access & Security'
  | 'API & Integration'
  | 'Performance & Outage'
  | 'Feature Request';

export interface SupportAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  skills: TicketCategory[];
  maxCapacity: number;
  currentTickets: number;
  tierClearance: CustomerTier[];
  csat: number; // e.g. 4.9
  status: 'Online' | 'Busy' | 'Away' | 'Offline';
  avgResolutionHours: number;
  specialization: string;
}

export interface TicketHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  isAgentforce?: boolean;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  relevance: number;
  excerpt: string;
  category: TicketCategory;
}

export interface PriorityPredictionResult {
  priority: TicketPriority;
  confidence: number;
  sentiment: 'Highly Frustrated' | 'Negative' | 'Neutral' | 'Positive';
  urgencyScore: number;
  slaTargetHours: number;
  reasoning: string;
  keyFactors: string[];
  suggestedCategory: string;
  slaBreachRisk: 'High' | 'Medium' | 'Low';
  recommendedTags: string[];
  potentialImpact: string;
  modelUsed?: string;
  warning?: string;
}

export interface Ticket {
  id: string; // e.g. "CASE-10492"
  subject: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
  customerTier: CustomerTier;
  category: TicketCategory;
  issueDescription: string;
  priority: TicketPriority;
  predictedPriority: TicketPriority;
  confidence: number;
  sentiment: 'Highly Frustrated' | 'Negative' | 'Neutral' | 'Positive';
  status: TicketStatus;
  assignedAgentId: string;
  assignedAgentName: string;
  assignedAgentRole: string;
  assignmentRationale: string;
  slaTargetHours: number;
  createdAt: string;
  slaBreachTime: string;
  isSlaBreached: boolean;
  tags: string[];
  aiReasoning: string;
  keyFactors: string[];
  history: TicketHistoryItem[];
  solutionNotes?: string;
  customerReplyDraft?: string;
  suggestedArticles?: KnowledgeBaseArticle[];
  macroAction?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'priority' | 'assignment' | 'sla' | 'agentforce' | 'info';
  ticketId?: string;
  read: boolean;
}

export interface AgentforceChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
  metadata?: {
    modelUsed?: string;
    ticketId?: string;
  };
}
