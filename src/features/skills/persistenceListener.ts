import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { saveSkillContents } from './persistence';
import { selectAllSkills, skillContentChanged, skillCreated, skillSaved } from './skillsSlice';

/**
 * Persists edited skill content to localStorage whenever a skill changes. Scoped
 * to skill edit/save/create actions, so unrelated dispatches never trigger a write.
 */
export const skillsListenerMiddleware = createListenerMiddleware();

skillsListenerMiddleware.startListening({
  matcher: isAnyOf(skillContentChanged, skillSaved, skillCreated),
  effect: (_action, listenerApi) => {
    const skills = selectAllSkills(listenerApi.getState() as RootState);
    const contents: Record<string, string> = {};
    for (const skill of skills) contents[skill.id] = skill.content;
    saveSkillContents(contents);
  },
});
