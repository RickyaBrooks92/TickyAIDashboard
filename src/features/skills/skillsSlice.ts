import {
  createEntityAdapter,
  createSlice,
  nanoid,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { Skill, SkillContentChange, SkillsExtraState } from './types';
import { mockSkills } from './mockData';

/** Normalized collection of skills keyed by `id`. */
const skillsAdapter = createEntityAdapter<Skill>();

const extraState: SkillsExtraState = {
  selectedSkillId: mockSkills[0]?.id ?? null,
  status: 'succeeded',
  error: null,
};

const initialState = skillsAdapter.getInitialState(extraState, mockSkills);

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    /** Replace the whole collection (e.g. after loading from disk). */
    skillsLoaded(state, action: PayloadAction<Skill[]>) {
      skillsAdapter.setAll(state, action.payload);
      state.status = 'succeeded';
    },
    /** Select a skill to open in the editor. */
    skillSelected(state, action: PayloadAction<string>) {
      state.selectedSkillId = action.payload;
    },
    /** Editor edit: update content and mark the skill dirty. */
    skillContentChanged(state, action: PayloadAction<SkillContentChange>) {
      const { id, content } = action.payload;
      const skill = state.entities[id];
      if (!skill) return;
      skill.content = content;
      skill.isDirty = true;
      skill.lastModifiedAt = Date.now();
    },
    /** Persist: clear the dirty flag for a skill. */
    skillSaved(state, action: PayloadAction<string>) {
      const skill = state.entities[action.payload];
      if (!skill) return;
      skill.isDirty = false;
      skill.lastModifiedAt = Date.now();
    },
    /** Create a new empty skill and select it. */
    skillCreated: {
      reducer(state, action: PayloadAction<Skill>) {
        skillsAdapter.addOne(state, action.payload);
        state.selectedSkillId = action.payload.id;
      },
      prepare(name: string) {
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-') || 'untitled';
        const skill: Skill = {
          id: nanoid(),
          name: slug,
          path: `skills/${slug}/SKILL.md`,
          content: `---\nname: ${slug}\ndescription: \n---\n\n# ${slug}\n\n`,
          isDirty: true,
          lastModifiedAt: Date.now(),
        };
        return { payload: skill };
      },
    },
  },
});

export const {
  skillsLoaded,
  skillSelected,
  skillContentChanged,
  skillSaved,
  skillCreated,
} = skillsSlice.actions;

/* ---- Selectors ---- */

export const {
  selectAll: selectAllSkills,
  selectById: selectSkillById,
  selectIds: selectSkillIds,
  selectTotal: selectSkillCount,
} = skillsAdapter.getSelectors<RootState>((state) => state.skills);

export const selectSelectedSkillId = (state: RootState): string | null =>
  state.skills.selectedSkillId;

export const selectSelectedSkill = (state: RootState): Skill | undefined => {
  const id = state.skills.selectedSkillId;
  return id ? state.skills.entities[id] : undefined;
};

export const selectSkillsStatus = (state: RootState) => state.skills.status;

export default skillsSlice.reducer;
