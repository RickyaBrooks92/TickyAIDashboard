import type { EpochMs } from '../types';

/** `HH:MM:SS` in 24-hour form — the standard timestamp for the execution log. */
export function formatTime(ts: EpochMs): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Compact "N tok" token count, e.g. 12_500 -> "12,500". */
export function formatTokens(count: number): string {
  return count.toLocaleString('en-US');
}

/** Relative "time ago" for coarse recency labels, e.g. "3m ago". */
export function formatRelative(ts: EpochMs, now: EpochMs = Date.now()): string {
  const deltaSec = Math.max(0, Math.round((now - ts) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const deltaMin = Math.round(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHr = Math.round(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr}h ago`;
  return `${Math.round(deltaHr / 24)}d ago`;
}
