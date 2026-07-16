import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type {
  ContextWindowSnapshot,
  EmailResultPayload,
  ExecutionLogEntry,
  ParsedEmail,
  TelemetryState,
} from './types';

const DEFAULT_MAX_LOG_ENTRIES = 500;

// Starts empty — the log and context populate live once an agent run streams in.
const initialState: TelemetryState = {
  log: [],
  maxLogEntries: DEFAULT_MAX_LOG_ENTRIES,
  context: null,
  isStreaming: false,
  activeResult: null,
  rawEmails: null,
};

/** Drop oldest entries in place so the log never exceeds its cap. */
function enforceCap(state: TelemetryState): void {
  const overflow = state.log.length - state.maxLogEntries;
  if (overflow > 0) state.log.splice(0, overflow);
}

const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState,
  reducers: {
    /** Append a single execution event (from the live feed). */
    logAppended(state, action: PayloadAction<ExecutionLogEntry>) {
      state.log.push(action.payload);
      enforceCap(state);
    },
    /** Append a batch of events at once. */
    logBatchAppended(state, action: PayloadAction<ExecutionLogEntry[]>) {
      state.log.push(...action.payload);
      enforceCap(state);
    },
    /** Clear the execution log. */
    logCleared(state) {
      state.log = [];
    },
    /** Replace the current context-window snapshot. */
    contextUpdated(state, action: PayloadAction<ContextWindowSnapshot>) {
      state.context = action.payload;
    },
    /** Toggle the live-feed attachment (manual top-bar control). */
    streamingToggled(state) {
      state.isStreaming = !state.isStreaming;
    },
    /** Explicitly set the live-feed attachment (used by the agent runner). */
    streamingSet(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },
    /** Store a structured agent result (renders in the Results tab). */
    resultReceived(state, action: PayloadAction<EmailResultPayload>) {
      state.activeResult = action.payload;
    },
    /** Clear the active result (e.g. at the start of a new run). */
    resultCleared(state) {
      state.activeResult = null;
    },
    /** Store the raw emails fetched from Gmail for this run. */
    inboxFetched(state, action: PayloadAction<ParsedEmail[]>) {
      state.rawEmails = action.payload;
    },
    /** Clear the raw emails (e.g. at the start of a new run). */
    rawEmailsCleared(state) {
      state.rawEmails = null;
    },
  },
});

export const {
  logAppended,
  logBatchAppended,
  logCleared,
  contextUpdated,
  streamingToggled,
  streamingSet,
  resultReceived,
  resultCleared,
  inboxFetched,
  rawEmailsCleared,
} = telemetrySlice.actions;

/* ---- Selectors ---- */

export const selectLog = (state: RootState): ExecutionLogEntry[] =>
  state.telemetry.log;

export const selectContext = (state: RootState): ContextWindowSnapshot | null =>
  state.telemetry.context;

export const selectIsStreaming = (state: RootState): boolean =>
  state.telemetry.isStreaming;

export const selectActiveResult = (state: RootState): EmailResultPayload | null =>
  state.telemetry.activeResult;

export const selectRawEmails = (state: RootState): ParsedEmail[] | null =>
  state.telemetry.rawEmails;

/** Fraction (0–1) of the context window in use. */
export const selectContextUsageRatio = (state: RootState): number => {
  const ctx = state.telemetry.context;
  if (!ctx || ctx.maxTokens <= 0) return 0;
  return Math.min(1, ctx.totalTokens / ctx.maxTokens);
};

export default telemetrySlice.reducer;
