import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

/** User-provided settings + connection status. The key is held in memory only. */
export interface SettingsState {
  aiProviderKey: string | null;
  isGoogleConnected: boolean;
  selectedModel: string;
}

const initialState: SettingsState = {
  aiProviderKey: null,
  isGoogleConnected: false,
  selectedModel: 'gemini-2.5-flash',
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
