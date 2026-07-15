import type { AsyncStatus, EpochMs } from '../../types';

/**
 * A single authorable SKILL.md file in the control plane.
 * `content` is the raw markdown shown in the Monaco editor.
 */
export interface Skill {
  id: string;
  /** Display name, e.g. "code-review". */
  name: string;
  /** Logical file path, e.g. "skills/code-review/SKILL.md". */
  path: string;
  /** Raw markdown source. */
  content: string;
  /** True when the editor holds unsaved edits. */
  isDirty: boolean;
  lastModifiedAt: EpochMs;
}

/**
 * UI-only fields stored alongside the normalized entity collection.
 * The full slice state is `EntityState<Skill, string> & SkillsExtraState`.
 */
export interface SkillsExtraState {
  selectedSkillId: string | null;
  status: AsyncStatus;
  error: string | null;
}

/** Payload for editing the selected skill's markdown. */
export interface SkillContentChange {
  id: string;
  content: string;
}
