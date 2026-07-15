import type { Skill } from './types';

const HOUR = 1000 * 60 * 60;
const now = Date.now();

/**
 * Seed skills so the control plane renders real-looking SKILL.md files on first
 * load. Replaced by real file-system reads in a later phase.
 */
export const mockSkills: Skill[] = [
  {
    id: 'skill-code-review',
    name: 'code-review',
    path: 'skills/code-review/SKILL.md',
    isDirty: false,
    lastModifiedAt: now - 2 * HOUR,
    content: `---
name: code-review
description: Review a diff for correctness bugs and simplification opportunities.
---

# Code Review

Review the current diff at the requested effort level.

## Steps

1. Read the diff and surrounding context.
2. Flag correctness issues first, then simplifications.
3. Report findings ranked most-severe first.

## Notes

- Prefer high-confidence findings at low effort.
- Never invent issues to fill a quota.
`,
  },
  {
    id: 'skill-telemetry-writer',
    name: 'telemetry-writer',
    path: 'skills/telemetry-writer/SKILL.md',
    isDirty: false,
    lastModifiedAt: now - 26 * HOUR,
    content: `---
name: telemetry-writer
description: Emit structured execution events for the observability plane.
---

# Telemetry Writer

Produce one event per agent-loop step.

## Event shape

- \`level\`: debug | info | warn | error
- \`type\`: tool_call | tool_result | model_response | context_update | system
- \`message\`: human-readable summary

Keep messages short; put structured detail in \`metadata\`.
`,
  },
  {
    id: 'skill-context-budget',
    name: 'context-budget',
    path: 'skills/context-budget/SKILL.md',
    isDirty: false,
    lastModifiedAt: now - 5 * HOUR,
    content: `---
name: context-budget
description: Keep the context window under budget by pruning stale blocks.
---

# Context Budget

Monitor the current context window and prune when usage exceeds 80%.

## Priority (keep highest first)

1. System prompt
2. Active skill
3. Recent tool results
4. Older conversation turns
`,
  },
];
