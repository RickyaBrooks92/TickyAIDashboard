/**
 * Shared, cross-feature types.
 *
 * Feature-specific contracts live inside each feature (`features/<name>/types.ts`).
 * Only genuinely shared primitives belong here.
 */

/** Lifecycle status for any async-loaded slice of state. */
export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/** Epoch milliseconds (the result of `Date.now()`). */
export type EpochMs = number;
