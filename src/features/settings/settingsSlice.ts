import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { loadPersistedSettings } from './persistence';

/** Pull-size bounds (Gmail caps a single list page at 500). */
export const MAX_EMAILS_MIN = 1;
export const MAX_EMAILS_MAX = 500;
export const DEFAULT_MAX_EMAILS = 250;

/** User-provided settings + connection status. */
export interface SettingsState {
  aiProviderKey: string | null;
  isGoogleConnected: boolean;
  selectedModel: string;
  maxEmails: number;
}

// Hydrate the key, model, and pull size from localStorage so they survive a
// refresh. The Google connection is intentionally NOT persisted — it's
// re-derived from the server's /api/auth/status on load.
const persisted = loadPersistedSettings();

const initialState: SettingsState = {
  aiProviderKey: persisted.aiProviderKey ?? null,
  isGoogleConnected: false,
  selectedModel: persisted.selectedModel ?? 'gemini-flash-latest',
  maxEmails: persisted.maxEmails ?? DEFAULT_MAX_EMAILS,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    aiProviderKeySet(state, action: PayloadAction<string>) {
      state.aiProviderKey = action.payload;
    },
    aiProviderKeyCleared(state) {
      state.aiProviderKey = null;
    },
    googleConnectionSet(state, action: PayloadAction<boolean>) {
      state.isGoogleConnected = action.payload;
    },
    modelSelected(state, action: PayloadAction<string>) {
      state.selectedModel = action.payload;
    },
    maxEmailsSet(state, action: PayloadAction<number>) {
      const n = action.payload;
      if (Number.isFinite(n)) {
        state.maxEmails = Math.min(MAX_EMAILS_MAX, Math.max(MAX_EMAILS_MIN, Math.floor(n)));
      }
    },
  },
});

export const {
  aiProviderKeySet,
  aiProviderKeyCleared,
  googleConnectionSet,
  modelSelected,
  maxEmailsSet,
} = settingsSlice.actions;

export const selectAiProviderKey = (state: RootState): string | null =>
  state.settings.aiProviderKey;

export const selectHasAiProviderKey = (state: RootState): boolean =>
  Boolean(state.settings.aiProviderKey);

export const selectIsGoogleConnected = (state: RootState): boolean =>
  state.settings.isGoogleConnected;

export const selectSelectedModel = (state: RootState): string =>
  state.settings.selectedModel;

export const selectMaxEmails = (state: RootState): number => state.settings.maxEmails;

export default settingsSlice.reducer;
