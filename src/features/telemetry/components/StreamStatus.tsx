import { useAppSelector } from '../../../app/hooks';
import { cx } from '../../../lib/cx';
import { selectIsStreaming } from '../telemetrySlice';

/**
 * Top-bar status light. Read-only: it reflects whether an agent run is currently
 * streaming (driven by the agent runner's lifecycle), and is not a manual control.
 */
export function StreamStatus() {
  const isStreaming = useAppSelector(selectIsStreaming);

  return (
    <div
      className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-400 select-none"
      title={isStreaming ? 'Agent run in progress' : 'Agent idle'}
    >
      <span
        className={cx(
          'h-2 w-2 rounded-full',
          isStreaming ? 'animate-pulse bg-emerald-400' : 'bg-zinc-500',
        )}
      />
      {isStreaming ? 'Running…' : 'Idle'}
    </div>
  );
}
