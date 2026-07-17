import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { savePersistedSettings } from './persistence';
import {
  aiProviderKeyCleared,
  aiProviderKeySet,
  maxEmailsSet,
  modelSelected,
} from './settingsSlice';

/**
 * Persists settings to localStorage whenever the key, model, or pull size
 * changes. Scoped to just those actions via `isAnyOf`, so the frequent telemetry
 * dispatches during an agent run never trigger a write.
 */
export const settingsListenerMiddleware = createListenerMiddleware();

settingsListenerMiddleware.startListening({
  matcher: isAnyOf(aiProviderKeySet, aiProviderKeyCleared, modelSelected, maxEmailsSet),
  effect: (_action, listenerApi) => {
    const { aiProviderKey, selectedModel, maxEmails } = (
      listenerApi.getState() as RootState
    ).settings;
    savePersistedSettings({ aiProviderKey, selectedModel, maxEmails });
  },
});
