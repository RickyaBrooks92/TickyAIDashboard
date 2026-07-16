import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LayersIcon } from '../../../components/ui/icons';
import { selectSelectedSkill } from '../../skills/skillsSlice';
import { selectActiveResult, selectIsStreaming } from '../../telemetry/telemetrySlice';
import { EmailCleanupWidget } from './EmailCleanupWidget';

/**
 * The Results tab: renders the AI's structured verdict, routed by the active
 * skill. The raw fetched inbox now lives in its own "Raw Data" tab. Adding a new
 * agent means adding a `case` below — the Redux pipeline is shared.
 */
export function AgentResultCanvas() {
  const result = useAppSelector(selectActiveResult);
  const isStreaming = useAppSelector(selectIsStreaming);
  const skill = useAppSelector(selectSelectedSkill);

  // No verdict yet — graceful empty / analyzing state.
  if (!result) {
    return (
      <EmptyState
        icon={<LayersIcon size={26} />}
        title={isStreaming ? 'Analyzing your inbox…' : 'No results yet'}
        hint={
          isStreaming
            ? 'The categorized verdict appears here once the AI finishes. (Raw emails are in the Raw Data tab.)'
            : 'Run an agent to see its structured output here.'
        }
      />
    );
  }

  if (skill?.name === 'email-assistant') {
    return <EmailCleanupWidget result={result} />;
  }

  // case 'code-review': return <DiffWidget result={result} />;
  return (
    <p className="p-4 text-sm text-zinc-500">
      No result widget is registered for the selected skill.
    </p>
  );
}
