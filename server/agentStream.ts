import { randomUUID } from 'node:crypto';

/**
 * SSE payload contract shared with the frontend.
 * These interfaces mirror `src/features/telemetry/types.ts`; keep the two in
 * sync until a shared package exists.
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

/** How safe an email is to delete — drives the color-coded Results grouping. */
export type CleanupPriority = 'high' | 'medium' | 'low';

export interface FlaggedEmail {
  id: string;
  sender: string;
  subject: string;
  reason: string;
  priority: CleanupPriority;
}

export interface EmailResultPayload {
  summary: string;
  flaggedForDeletion: FlaggedEmail[];
}

/** A raw unread email fetched from Gmail (headers + plain-text snippet). */
export interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

/** One SSE frame. Kept identical to the frontend's `AgentStreamEvent`. */
export type AgentStreamEvent =
  | { type: 'log'; entry: ExecutionLogEntry }
  | { type: 'context'; snapshot: ContextWindowSnapshot }
  | { type: 'inbox_fetched'; payload: ParsedEmail[] }
  | { type: 'result'; result: EmailResultPayload }
  | { type: 'done' };

/** Body of POST /api/agent/run (mirrors the frontend request). */
export interface AgentRunRequest {
  skill?: string;
  model?: string;
  /** How many unread emails to pull (email agent). Server clamps to [1, 500]. */
  maxEmails?: number;
}

export const MAX_CONTEXT_TOKENS = 200_000;

/** Build a `log` SSE frame with a generated id + timestamp. */
export function logEvent(
  level: LogLevel,
  type: ExecutionEventType,
  message: string,
): AgentStreamEvent {
  return {
    type: 'log',
    entry: { id: randomUUID(), timestamp: Date.now(), level, type, message },
  };
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

/** Rough token estimate (~4 chars/token) for the context meter. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
