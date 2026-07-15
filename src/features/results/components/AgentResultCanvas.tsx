import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LayersIcon } from '../../../components/ui/icons';
import { selectSelectedSkill } from '../../skills/skillsSlice';
import { selectActiveResult } from '../../telemetry/telemetrySlice';
import { EmailCleanupWidget } from './EmailCleanupWidget';

/**
 * The Canvas router: maps the active agent result to a widget by the active
 * skill. Today: email-assistant → EmailCleanupWidget. Adding a new agent means
 * adding a `case` here — the Redux pipeline stays identical.
 */
export function AgentResultCanvas() {
  const result = useAppSelector(selectActiveResult);
  const skill = useAppSelector(selectSelectedSkill);

  if (!result) {
    return (
      <EmptyState
        icon={<LayersIcon size={26} />}
        title="No results yet"
        hint="Run an agent to see its structured output here."
      />
    );
  }

  switch (skill?.name) {
    case 'email-assistant':
      return <EmailCleanupWidget result={result} />;
    // case 'code-review':
    //   return <DiffWidget result={result} />;
    default:
      return (
        <EmptyState
          title="No widget for this skill"
          hint="This agent produced a result, but no result widget is registered for the selected skill."
        />
      );
  }
}
