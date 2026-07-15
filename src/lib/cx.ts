/**
 * Minimal className joiner — avoids pulling in `clsx` for a scaffold.
 * Falsy parts are dropped so conditional classes read cleanly at call sites.
 */
export type ClassValue = string | false | null | undefined;

export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}
