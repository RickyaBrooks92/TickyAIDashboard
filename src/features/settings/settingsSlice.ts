import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

/** User-provided settings (Bring-Your-Own-Key). Held in memory only — not persisted. */
export interface SettingsState {
  aiProviderKey: string | null;
}

const initialState: SettingsState = {
  aiProviderKey: null,
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
  },
});

export const { aiProviderKeySet, aiProviderKeyCleared } = settingsSlice.actions;

export const selectAiProviderKey = (state: RootState): string | null =>
  state.settings.aiProviderKey;

export const selectHasAiProviderKey = (state: RootState): boolean =>
  Boolean(state.settings.aiProviderKey);

export default settingsSlice.reducer;
