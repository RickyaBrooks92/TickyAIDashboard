/**
 * localStorage persistence for edited SKILL.md content, keyed by skill id. Lets a
 * user's edits to a skill survive a refresh (the seed content comes from the
 * bundled SKILL.md file at build time). Local, single-user dashboard — see the
 * settings persistence note for the threat model.
 */

const STORAGE_KEY = 'tickys.skills.v1';

/** Read the saved id → content map. Never throws; returns {} on any problem. */
export function loadSkillContents(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Record<string, string> = {};
    for (const [id, content] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof content === 'string') out[id] = content;
    }
    return out;
  } catch {
    return {};
  }
}

/** Persist the id → content map. Silent on failure (non-fatal). */
export function saveSkillContents(contents: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contents));
  } catch {
    // Storage unavailable (e.g. private mode) — safe to ignore for a dev tool.
  }
}
