import { useAppSelector } from '../../app/hooks';
import { selectSelectedSkill } from '../skills/skillsSlice';
import type { AgentModule } from './AgentModule';
import { getAgentModule } from './registry';

/** The agent module for the currently selected skill, or undefined. */
export function useActiveModule(): AgentModule | undefined {
  const skill = useAppSelector(selectSelectedSkill);
  return getAgentModule(skill?.name);
}
