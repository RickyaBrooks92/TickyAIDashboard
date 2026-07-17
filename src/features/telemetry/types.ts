import type { EpochMs } from '../../types';

/** Severity or semantic tag shown as the log entry's badge. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success' | 'action';

/** The kind of agent-loop event a log entry represents. */
export type ExecutionEventType =
  | 'system'
  | 'model_response'
  | 'tool_call'
  | 'tool_result'
  | 'context_update';

/** One line in the agent's execution log / event stream. */
export interface ExecutionLogEntry {
  id: string;
  timestamp: EpochMs;
  level: LogLevel;
  type: ExecutionEventType;
  message: string;
  /** Structured detail; typed escape hatch — never `any`. */
  metadata?: Record<string, unknown>;
}

/** A single segment of the agent's current context window. */
export interface ContextBlock {
  id: string;
  /** e.g. "System Prompt", "Skill: code-review", "Tool Result". */
  label: string;
  tokenCount: number;
  /** Preview text for the block. */
  content: string;
}

/** A point-in-time snapshot of what occupies the agent's context window. */
export interface ContextWindowSnapshot {
  totalTokens: number;
  maxTokens: number;
  blocks: ContextBlock[];
  updatedAt: EpochMs;
}

/** How safe an email is to delete — drives the color-coded Results grouping. */
export type CleanupPriority = 'high' | 'medium' | 'low';

/** One email the agent proposes to delete/archive; awaits human approval. */
export interface FlaggedEmail {
  id: string;
  sender: string;
  subject: string;
  reason: string;
  priority: CleanupPriority;
}

/** Structured JSON result emitted by the email-assistant agent. */
export interface EmailResultPayload {
  summary: string;
  flaggedForDeletion: FlaggedEmail[];
}

/** A raw unread email fetched from Gmail (mirror of the server's ParsedEmail). */
export interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

/**
 * One Server-Sent Events frame from the agent runner.
 * Mirror of the union in `server/agentStream.ts`.
 */
export type AgentStreamEvent =
  | { type: 'log'; entry: ExecutionLogEntry }
  | { type: 'context'; snapshot: ContextWindowSnapshot }
  | { type: 'inbox_fetched'; payload: ParsedEmail[] }
  | { type: 'result'; result: EmailResultPayload }
  | { type: 'done' };

/** Body of POST /api/agent/run (mirrors `server/agentStream.ts`). */
export interface AgentRunRequest {
  skill?: string;
  model?: string;
  /** How many unread emails to pull (email agent). Server clamps to [1, 500]. */
  maxEmails?: number;
}

/**
 * Root shape of the (generic) telemetry slice — run observability only. Agent
 * result state lives in each agent module's own slice.
 */
export interface TelemetryState {
  /** Append-only event stream, capped at `maxLogEntries` (ring buffer). */
  log: ExecutionLogEntry[];
  maxLogEntries: number;
  context: ContextWindowSnapshot | null;
  /** True while an agent run is actively streaming events. */
  isStreaming: boolean;
}
