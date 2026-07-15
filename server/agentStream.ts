/**
 * SSE payload contract + mock run script for the agent runner.
 *
 * The payload interfaces below mirror `src/features/telemetry/types.ts` on the
 * frontend. They are duplicated here (not imported) so the server stays a
 * standalone package; keep the two in sync until a shared package exists.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success' | 'action';

export type ExecutionEventType =
  | 'system'
  | 'model_response'
  | 'tool_call'
  | 'tool_result'
  | 'context_update';

export interface ExecutionLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  type: ExecutionEventType;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ContextBlock {
  id: string;
  label: string;
  tokenCount: number;
  content: string;
}

export interface ContextWindowSnapshot {
  totalTokens: number;
  maxTokens: number;
  blocks: ContextBlock[];
  updatedAt: number;
}

export interface FlaggedEmail {
  id: string;
  sender: string;
  subject: string;
  reason: string;
}

export interface EmailResultPayload {
  summary: string;
  flaggedForDeletion: FlaggedEmail[];
}

/** One SSE frame. Kept identical to the frontend's `AgentStreamEvent`. */
export type AgentStreamEvent =
  | { type: 'log'; entry: ExecutionLogEntry }
  | { type: 'context'; snapshot: ContextWindowSnapshot }
  | { type: 'result'; result: EmailResultPayload }
  | { type: 'done' };

const MAX_CONTEXT_TOKENS = 200_000;

/** A simulated agent-loop step: a log line + the cumulative context after it. */
export interface AgentStep {
  level: LogLevel;
  type: ExecutionEventType;
  message: string;
  blocks: ContextBlock[];
}

/** The structured result streamed on completion. */
export const emailResult: EmailResultPayload = {
  summary:
    '3 action items require your attention. 7 promotional emails flagged for cleanup.',
  flaggedForDeletion: [
    {
      id: '1',
      sender: 'marketing@brand.com',
      subject: 'Huge Weekend Sale!',
      reason: 'Promotional',
    },
    {
      id: '2',
      sender: 'alerts@software.io',
      subject: 'Daily Digest',
      reason: 'Low-priority automated alert',
    },
  ],
};

/** Build the deterministic 6-step run for `skillName`. */
export function buildSteps(skillName: string): AgentStep[] {
  const systemBlock: ContextBlock = {
    id: 'run-system',
    label: 'System Prompt',
    tokenCount: 1_200,
    content:
      'You are the Tickys email assistant operating over the user inbox. Follow the active skill.',
  };
  const skillBlock: ContextBlock = {
    id: 'run-skill',
    label: `Skill: ${skillName}`,
    tokenCount: 480,
    content: `Active skill loaded: ${skillName}.`,
  };
  const mailboxBlock: ContextBlock = {
    id: 'run-mailbox',
    label: 'Mailbox Session',
    tokenCount: 350,
    content: 'Connected to mailbox interface · 12 unread messages available.',
  };
  const payloadBlock: ContextBlock = {
    id: 'run-payload',
    label: 'Inbox Payload (12 headers)',
    tokenCount: 8_400,
    content: 'Parsed Sender / Subject / Date headers for 12 unread messages.',
  };
  const categorizationBlock: ContextBlock = {
    id: 'run-categorization',
    label: 'Categorization Working Set',
    tokenCount: 3_200,
    content: 'Classifying into Action Required / Information / Low-Priority · Promotional.',
  };
  const cleanupBlock: ContextBlock = {
    id: 'run-cleanup',
    label: 'Cleanup Candidates (7)',
    tokenCount: 1_500,
    content: '7 promotional / duplicate messages flagged for trash with rationales.',
  };
  const summaryBlock: ContextBlock = {
    id: 'run-summary',
    label: 'Summary Report',
    tokenCount: 2_100,
    content: '3 urgent action items · executive summary generated.',
  };

  return [
    {
      level: 'info',
      type: 'system',
      message: `Initializing agent context with skill: ${skillName}`,
      blocks: [systemBlock, skillBlock],
    },
    {
      level: 'info',
      type: 'tool_call',
      message: 'Connecting to mailbox interface...',
      blocks: [systemBlock, skillBlock, mailboxBlock],
    },
    {
      level: 'info',
      type: 'tool_result',
      message: 'Parsing 12 unread email headers...',
      blocks: [systemBlock, skillBlock, mailboxBlock, payloadBlock],
    },
    {
      level: 'info',
      type: 'model_response',
      message: 'Applying categorization logic...',
      blocks: [systemBlock, skillBlock, mailboxBlock, payloadBlock, categorizationBlock],
    },
    {
      level: 'action',
      type: 'tool_result',
      message: 'Identified 7 promotional emails flagged for trash',
      blocks: [
        systemBlock,
        skillBlock,
        mailboxBlock,
        payloadBlock,
        categorizationBlock,
        cleanupBlock,
      ],
    },
    {
      level: 'success',
      type: 'model_response',
      message: 'Summary report generated (3 urgent action items)',
      blocks: [
        systemBlock,
        skillBlock,
        mailboxBlock,
        payloadBlock,
        categorizationBlock,
        cleanupBlock,
        summaryBlock,
      ],
    },
  ];
}

/** Total-token snapshot for a set of context blocks. */
export function snapshot(blocks: ContextBlock[]): ContextWindowSnapshot {
  const totalTokens = blocks.reduce((sum, block) => sum + block.tokenCount, 0);
  return {
    blocks,
    totalTokens,
    maxTokens: MAX_CONTEXT_TOKENS,
    updatedAt: Date.now(),
  };
}
