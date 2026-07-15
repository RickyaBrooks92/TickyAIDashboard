import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LayersIcon } from '../../../components/ui/icons';
import { selectSelectedSkill } from '../../skills/skillsSlice';
import {
  selectActiveResult,
  selectIsStreaming,
  selectRawEmails,
} from '../../telemetry/telemetrySlice';
import { EmailCleanupWidget } from './EmailCleanupWidget';
import { InboxPreviewWidget } from './InboxPreviewWidget';

/**
 * The Canvas router: shows the raw fetched inbox as soon as it arrives, then the
 * AI result widget (routed by the active skill) once categorization completes.
 * Adding a new agent means adding a `case` below — the Redux pipeline is shared.
 */
export function AgentResultCanvas() {
  const result = useAppSelector(selectActiveResult);
  const rawEmails = useAppSelector(selectRawEmails);
  const isStreaming = useAppSelector(selectIsStreaming);
  const skill = useAppSelector(selectSelectedSkill);

  // Nothing to show yet — graceful empty / loading state.
  if (!rawEmails && !result) {
    return (
      <EmptyState
        icon={<LayersIcon size={26} />}
        title={isStreaming ? 'Fetching your inbox…' : 'No results yet'}
        hint={
          isStreaming
            ? 'Raw emails will appear here as soon as they load.'
            : 'Run an agent to see its structured output here.'
        }
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Raw fetched emails — self-hides until they arrive. */}
      <InboxPreviewWidget />

      {/* AI-categorized result, routed by the active skill. */}
      {result && skill?.name === 'email-assistant' && <EmailCleanupWidget result={result} />}
      {/* case 'code-review': <DiffWidget result={result} /> */}
      {result && skill?.name !== 'email-assistant' && (
        <p className="p-4 text-sm text-zinc-500">
          No result widget is registered for the selected skill.
        </p>
      )}
    </div>
  );
}
