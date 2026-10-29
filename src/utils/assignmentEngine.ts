import { SupportAgent, TicketCategory, TicketPriority, CustomerTier } from '../types';

export interface AssignmentEvaluation {
  agent: SupportAgent;
  score: number;
  skillMatch: boolean;
  capacityRatio: number;
  tierApproved: boolean;
  breakdown: {
    skillScore: number;
    capacityScore: number;
    tierScore: number;
    csatScore: number;
  };
}

export function evaluateAgentCandidates(
  category: TicketCategory,
  priority: TicketPriority,
  customerTier: CustomerTier,
  agents: SupportAgent[]
): { bestAgent: SupportAgent; rationale: string; evaluations: AssignmentEvaluation[] } {
  const evaluations: AssignmentEvaluation[] = agents.map((agent) => {
    // 1. Skill Match (40 pts)
    const hasExactSkill = agent.skills.includes(category);
    const skillScore = hasExactSkill ? 40 : 10;

    // 2. Available Workload Capacity (30 pts)
    const availableSlots = Math.max(0, agent.maxCapacity - agent.currentTickets);
    const capacityRatio = agent.maxCapacity > 0 ? availableSlots / agent.maxCapacity : 0;
    // If agent is full, heavily penalize unless everyone is full
    const capacityScore = availableSlots > 0 ? capacityRatio * 30 : 2;

    // 3. Customer Tier Clearance & Urgency Match (20 pts)
    const hasTierClearance = agent.tierClearance.includes(customerTier);
    let tierScore = hasTierClearance ? 20 : 5;
    if (priority === 'Critical' && !hasTierClearance) {
      tierScore = 0; // Strictly prioritize tier-cleared agents for critical outages
    }

    // 4. CSAT & Quality Rating (10 pts)
    const csatScore = ((agent.csat || 4.5) / 5.0) * 10;

    // Penalty for Offline / Away
    let statusPenalty = 0;
    if (agent.status === 'Offline') statusPenalty = 50;
    else if (agent.status === 'Away') statusPenalty = 15;
    else if (agent.status === 'Busy') statusPenalty = 5;

    const totalScore = Math.max(0, skillScore + capacityScore + tierScore + csatScore - statusPenalty);

    return {
      agent,
      score: Math.round(totalScore * 10) / 10,
      skillMatch: hasExactSkill,
      capacityRatio,
      tierApproved: hasTierClearance,
      breakdown: {
        skillScore,
        capacityScore: Math.round(capacityScore),
        tierScore,
        csatScore: Math.round(csatScore),
      },
    };
  });

  // Sort descending by score
  evaluations.sort((a, b) => b.score - a.score);

  const best = evaluations[0] ? evaluations[0].agent : agents[0];
  const bestEval = evaluations[0];

  // Synthesize Agentforce Rationale string
  let rationale = `Assigned to ${best.name} (${best.role}) by Salesforce Agentforce: `;
  const parts: string[] = [];

  if (bestEval?.skillMatch) {
    parts.push(`100% domain match in ${category}`);
  } else {
    parts.push(`Cross-functional coverage for ${category}`);
  }

  if (best.tierClearance.includes(customerTier)) {
    parts.push(`${customerTier} tier verified`);
  }

  const freeSlots = Math.max(0, best.maxCapacity - best.currentTickets);
  parts.push(`Workload capacity optimal (${freeSlots}/${best.maxCapacity} open slots)`);

  if (best.csat >= 4.9) {
    parts.push(`High CSAT rating (${best.csat.toFixed(2)}/5.0)`);
  }

  rationale += parts.join(', ') + '.';

  return {
    bestAgent: best,
    rationale,
    evaluations,
  };
}
