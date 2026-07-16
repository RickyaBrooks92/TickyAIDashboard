/**
 * localStorage persistence for user settings (the BYOK Gemini key + model choice).
 *
 * This is a local, single-user dashboard, so we persist the key for convenience —
 * no re-pasting after every refresh. The realistic risk of putting a secret in
 * localStorage is an XSS payload reading it, and this app renders all email
 * content as escaped text (no `dangerouslySetInnerHTML`), so that surface is
 * minimal. The stored value is a *metered, revocable* Gemini API key — not Google
 * account access (the OAuth refresh token lives server-side, never in the browser).
 *
 * Do NOT copy this pattern into a multi-user or publicly-deployed app.
 */

const STORAGE_KEY = 'tickys.settings.v1';

/** The subset of settings we persist across sessions. */
export interface PersistedSettings {
  aiProviderKey: string | null;
  selectedModel: string;
}

/**
 * Read persisted settings from localStorage. Returns a partial object so the
 * slice can fall back to its defaults for anything missing or invalid. Never
 * throws — a corrupt or unavailable store simply yields `{}`.
 */
export function loadPersistedSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};

    const record = parsed as Record<string, unknown>;
    const out: Partial<PersistedSettings> = {};
    if (typeof record.aiProviderKey === 'string') {
      out.aiProviderKey = record.aiProviderKey;
    }
    if (typeof record.selectedModel === 'string' && record.selectedModel.length > 0) {
      out.selectedModel = record.selectedModel;
    }
    return out;
  } catch {
    // Corrupt JSON, disabled storage, or private-mode quota — treat as empty.
    return {};
  }
}

/** Write the given settings to localStorage. Silent on failure (non-fatal). */
export function savePersistedSettings(settings: PersistedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full/unavailable (e.g. private mode) — safe to ignore for a dev tool.
  }
}
