import type { AgentModule } from './AgentModule';

/** Registered agent modules, keyed by their `id` (the SKILL.md name). */
const registry = new Map<string, AgentModule>();

/** Register an agent module. Call once at app startup (see app/registerAgents). */
export function registerAgentModule(module: AgentModule): void {
  registry.set(module.id, module);
}

/** Resolve the module for a skill name, or undefined when none is registered. */
export function getAgentModule(id: string | undefined): AgentModule | undefined {
  return id ? registry.get(id) : undefined;
}
