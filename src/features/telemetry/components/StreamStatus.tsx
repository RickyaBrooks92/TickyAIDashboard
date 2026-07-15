import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { cx } from '../../../lib/cx';
import { selectIsStreaming, streamingToggled } from '../telemetrySlice';

/** Top-bar control: shows and toggles whether the live feed is attached. */
export function StreamStatus() {
  const isStreaming = useAppSelector(selectIsStreaming);
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={() => dispatch(streamingToggled())}
      className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
      title={
        isStreaming
          ? 'Live feed attached (click to pause)'
          : 'Feed paused (click to go live)'
      }
    >
      <span
        className={cx(
          'h-2 w-2 rounded-full',
          isStreaming ? 'animate-pulse bg-emerald-400' : 'bg-zinc-500',
        )}
      />
      {isStreaming ? 'Live' : 'Paused'}
    </button>
  );
}
