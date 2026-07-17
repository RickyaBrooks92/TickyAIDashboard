/** Called before each backoff sleep so the caller can surface a "retrying" log. */
export type OnRetry = (attempt: number, delayMs: number) => void;

const MAX_ATTEMPTS = 4;

/** True for transient Gemini failures worth retrying (overload / rate spikes). */
function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /503|429|500|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(msg);
}

/** Retry `fn` with exponential backoff (~0.5s, 1s, 2s + jitter) on transient errors. */
export async function withRetry<T>(fn: () => Promise<T>, onRetry?: OnRetry): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS || !isRetryable(err)) throw err;
      const delayMs = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
      console.warn(`[ai] Gemini call failed (attempt ${attempt}/${MAX_ATTEMPTS}); retrying in ${delayMs}ms`);
      onRetry?.(attempt, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
