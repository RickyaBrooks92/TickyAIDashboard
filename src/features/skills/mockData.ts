import type { Skill } from './types';
import emailAssistantMd from '../../../skills/email-assistant/SKILL.md?raw';
import receiptsMd from '../../../skills/receipts-assistant/SKILL.md?raw';

const now = Date.now();

/**
 * Seed the control plane with the default email-assistant skill, loaded from the
 * real skills/email-assistant/SKILL.md file. Replaced by real file-system reads
 * in a later phase.
 */
export const mockSkills: Skill[] = [
  {
    id: 'skill-email-assistant',
    name: 'email-assistant',
    path: 'skills/email-assistant/SKILL.md',
    isDirty: false,
    lastModifiedAt: now,
    content: emailAssistantMd,
  },
  {
    id: 'skill-receipts-assistant',
    name: 'receipts-assistant',
    path: 'skills/receipts-assistant/SKILL.md',
    isDirty: false,
    lastModifiedAt: now,
    content: receiptsMd,
  },
];
