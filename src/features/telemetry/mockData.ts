import type {
  ContextWindowSnapshot,
  EmailResultPayload,
  ExecutionLogEntry,
} from './types';

const SEC = 1000;
const now = Date.now();

/** Seed context-window snapshot for the "Current Context" panel. */
export const mockContext: ContextWindowSnapshot = {
  maxTokens: 200_000,
  totalTokens: 48_200,
  updatedAt: now - 4 * SEC,
  blocks: [
    {
      id: 'ctx-system',
      label: 'System Prompt',
      tokenCount: 3_100,
      content: 'You are an agent operating inside the Tickys observability dashboard...',
    },
    {
      id: 'ctx-skill',
      label: 'Skill: code-review',
      tokenCount: 1_450,
      content: 'Review the current diff for correctness bugs and simplification opportunities...',
    },
    {
      id: 'ctx-conversation',
      label: 'Conversation History',
      tokenCount: 28_900,
      content: '12 turns · user requests + assistant responses since session start...',
    },
    {
      id: 'ctx-tool-result',
      label: 'Tool Result: read_file(src/app/store.ts)',
      tokenCount: 9_850,
      content: 'import { configureStore } from "@reduxjs/toolkit"; export const store = ...',
    },
    {
      id: 'ctx-scratch',
      label: 'Working Notes',
      tokenCount: 4_900,
      content: 'Tracked TODOs and intermediate reasoning for the current task...',
    },
  ],
};

/** Seed execution log — a plausible slice of an agent loop. */
export const mockLog: ExecutionLogEntry[] = [
  {
    id: 'log-1',
    timestamp: now - 42 * SEC,
    level: 'info',
    type: 'system',
    message: 'Session started · model=claude-opus-4-8',
  },
  {
    id: 'log-2',
    timestamp: now - 39 * SEC,
    level: 'info',
    type: 'model_response',
    message: 'Planning: locate the store configuration before editing slices.',
  },
  {
    id: 'log-3',
    timestamp: now - 35 * SEC,
    level: 'debug',
    type: 'tool_call',
    message: 'read_file(src/app/store.ts)',
    metadata: { path: 'src/app/store.ts' },
  },
  {
    id: 'log-4',
    timestamp: now - 34 * SEC,
    level: 'info',
    type: 'tool_result',
    message: 'read_file ok · 812 bytes',
    metadata: { bytes: 812 },
  },
  {
    id: 'log-5',
    timestamp: now - 28 * SEC,
    level: 'debug',
    type: 'context_update',
    message: 'Context grew by 9,850 tokens (tool result appended).',
    metadata: { delta: 9850 },
  },
  {
    id: 'log-6',
    timestamp: now - 21 * SEC,
    level: 'warn',
    type: 'tool_call',
    message: 'grep("createEntityAdapter") returned 0 matches — retrying broader query.',
  },
  {
    id: 'log-7',
    timestamp: now - 12 * SEC,
    level: 'info',
    type: 'model_response',
    message: 'Applying edit to skillsSlice.ts to add the entity adapter.',
  },
  {
    id: 'log-8',
    timestamp: now - 5 * SEC,
    level: 'error',
    type: 'tool_result',
    message: 'tsc failed: TS2532 object is possibly undefined at skillsSlice.ts:42',
    metadata: { code: 'TS2532', line: 42 },
  },
];

/** Seed structured result emitted by the email-assistant runner on completion. */
export const mockEmailResult: EmailResultPayload = {
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
