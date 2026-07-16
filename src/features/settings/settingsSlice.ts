import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { loadPersistedSettings } from './persistence';

/** User-provided settings + connection status. */
export interface SettingsState {
  aiProviderKey: string | null;
  isGoogleConnected: boolean;
  selectedModel: string;
}

// Hydrate the key + model from localStorage so they survive a refresh. The
// Google connection is intentionally NOT persisted — it's re-derived from the
// server's /api/auth/status on load.
const persisted = loadPersistedSettings();

const initialState: SettingsState = {
  aiProviderKey: persisted.aiProviderKey ?? null,
  isGoogleConnected: false,
  selectedModel: persisted.selectedModel ?? 'gemini-flash-latest',
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
  },
});

export const {
  aiProviderKeySet,
  aiProviderKeyCleared,
  googleConnectionSet,
  modelSelected,
} = settingsSlice.actions;

export const selectAiProviderKey = (state: RootState): string | null =>
  state.settings.aiProviderKey;

export const selectHasAiProviderKey = (state: RootState): boolean =>
  Boolean(state.settings.aiProviderKey);

export const selectIsGoogleConnected = (state: RootState): boolean =>
  state.settings.isGoogleConnected;

export const selectSelectedModel = (state: RootState): string =>
  state.settings.selectedModel;

export default settingsSlice.reducer;
