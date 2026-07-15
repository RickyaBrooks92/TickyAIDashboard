import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

/** User-provided settings + connection status. The key is held in memory only. */
export interface SettingsState {
  aiProviderKey: string | null;
  isGoogleConnected: boolean;
}

const initialState: SettingsState = {
  aiProviderKey: null,
  isGoogleConnected: false,
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
  },
});

export const { aiProviderKeySet, aiProviderKeyCleared, googleConnectionSet } =
  settingsSlice.actions;

export const selectAiProviderKey = (state: RootState): string | null =>
  state.settings.aiProviderKey;

export const selectHasAiProviderKey = (state: RootState): boolean =>
  Boolean(state.settings.aiProviderKey);

export const selectIsGoogleConnected = (state: RootState): boolean =>
  state.settings.isGoogleConnected;

export default settingsSlice.reducer;
