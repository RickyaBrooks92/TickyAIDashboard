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

/** Root shape of the telemetry slice. */
export interface TelemetryState {
  /** Append-only event stream, capped at `maxLogEntries` (ring buffer). */
  log: ExecutionLogEntry[];
  maxLogEntries: number;
  context: ContextWindowSnapshot | null;
  /** Whether a live feed is currently attached (future phase). */
  isStreaming: boolean;
}
