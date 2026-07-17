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

/**
 * One Server-Sent Events frame from the agent runner. Generic across agents:
 * `data` carries agent-specific domain data (the email agent uses key "inbox"),
 * `result` carries the agent's structured result. Each agent module validates the
 * `unknown` payloads it cares about. Mirror of `server/agentStream.ts`.
 */
export type AgentStreamEvent =
  | { type: 'log'; entry: ExecutionLogEntry }
  | { type: 'context'; snapshot: ContextWindowSnapshot }
  | { type: 'data'; key: string; payload: unknown }
  | { type: 'result'; payload: unknown }
  | { type: 'done' };

/** Body of POST /api/agent/run (mirrors `server/agentStream.ts`). */
export interface AgentRunRequest {
  skill?: string;
  model?: string;
  /** How many unread emails to pull (email agent). Server clamps to [1, 500]. */
  maxEmails?: number;
  /** The skill's editable instructions (SKILL.md body), sent live from the editor. */
  skillContent?: string;
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
