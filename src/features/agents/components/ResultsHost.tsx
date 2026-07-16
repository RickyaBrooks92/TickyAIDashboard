import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LayersIcon } from '../../../components/ui/icons';
import { selectIsStreaming } from '../../telemetry/telemetrySlice';
import { useActiveModule } from '../useActiveModule';

/**
 * Generic Results tab. Renders the active agent module's ResultView once it has a
 * result; otherwise shows a shared empty / running state. Knows nothing about any
 * specific agent.
 */
export function ResultsHost() {
  const module = useActiveModule();
  const isStreaming = useAppSelector(selectIsStreaming);
  const hasResult = useAppSelector((s) => module?.hasResult(s) ?? false);

  if (!module) {
    return (
      <EmptyState
        icon={<LayersIcon size={26} />}
        title="No agent selected"
        hint="Choose a skill from the explorer to run an agent."
      />
    );
  }

  if (!hasResult) {
    return (
      <EmptyState
        icon={<LayersIcon size={26} />}
        title={isStreaming ? 'Running…' : 'No results yet'}
        hint={
          isStreaming
            ? 'The result will appear here once the agent finishes.'
            : 'Run an agent to see its output here.'
        }
      />
    );
  }

  const ResultView = module.ResultView;
  return <ResultView />;
}
