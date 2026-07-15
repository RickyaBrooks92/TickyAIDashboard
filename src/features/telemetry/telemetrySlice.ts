import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type {
  ContextWindowSnapshot,
  ExecutionLogEntry,
  TelemetryState,
} from './types';
import { mockContext, mockLog } from './mockData';

const DEFAULT_MAX_LOG_ENTRIES = 500;

const initialState: TelemetryState = {
  log: mockLog,
  maxLogEntries: DEFAULT_MAX_LOG_ENTRIES,
  context: mockContext,
  isStreaming: false,
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
  },
});

export const {
  logAppended,
  logBatchAppended,
  logCleared,
  contextUpdated,
  streamingToggled,
  streamingSet,
} = telemetrySlice.actions;

/* ---- Selectors ---- */

export const selectLog = (state: RootState): ExecutionLogEntry[] =>
  state.telemetry.log;

export const selectContext = (state: RootState): ContextWindowSnapshot | null =>
  state.telemetry.context;

export const selectIsStreaming = (state: RootState): boolean =>
  state.telemetry.isStreaming;

/** Fraction (0–1) of the context window in use. */
export const selectContextUsageRatio = (state: RootState): number => {
  const ctx = state.telemetry.context;
  if (!ctx || ctx.maxTokens <= 0) return 0;
  return Math.min(1, ctx.totalTokens / ctx.maxTokens);
};

export default telemetrySlice.reducer;
