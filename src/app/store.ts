import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from '../features/settings/settingsSlice';
import skillsReducer from '../features/skills/skillsSlice';
import telemetryReducer from '../features/telemetry/telemetrySlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    skills: skillsReducer,
    telemetry: telemetryReducer,
  },
});

/** Full state tree — inferred from the store, the single source of truth. */
export type RootState = ReturnType<typeof store.getState>;

/** Dispatch type that knows about thunks/middleware. */
export type AppDispatch = typeof store.dispatch;
