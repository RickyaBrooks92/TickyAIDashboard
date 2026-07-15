/**
 * Rough token estimate: ~4 characters per token. Good enough to drive the
 * context meter in the simulator; swap for a real tokenizer when we wire a
 * live agent.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
