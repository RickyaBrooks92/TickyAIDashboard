import { runEmailAgent } from './agentRunner.ts';
import type { AgentRunner } from './agentStream.ts';
import { runReceiptsAgent } from './receiptsRunner.ts';

/**
 * Backend agent registry: maps a skill/agent id (the SKILL.md `name`, sent as
 * `skill` in the run request) to its runner. Add a new agent here — the
 * /api/agent/run handler dispatches by this map, so no route changes are needed.
 */
const agentRunners: Record<string, AgentRunner> = {
  'email-assistant': runEmailAgent,
  'receipts-assistant': runReceiptsAgent,
};

export function getAgentRunner(id: string): AgentRunner | undefined {
  return agentRunners[id];
}
