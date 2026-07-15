import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { PaneHeader } from '../../../components/layout/PaneHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ActivityIcon, TrashIcon } from '../../../components/ui/icons';
import { logCleared, selectLog } from '../telemetrySlice';
import { ExecutionLogItem } from './ExecutionLogItem';

export function ExecutionLog() {
  const log = useAppSelector(selectLog);
  const dispatch = useAppDispatch();

  // Newest first for at-a-glance monitoring (copy before reversing — never mutate state).
  const ordered = useMemo(() => log.slice().reverse(), [log]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PaneHeader
        title="Execution Log"
        subtitle={`${log.length} events`}
        icon={<ActivityIcon size={15} />}
        actions={
          <button
            type="button"
            onClick={() => dispatch(logCleared())}
            disabled={log.length === 0}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            title="Clear log"
            aria-label="Clear log"
          >
            <TrashIcon size={14} />
          </button>
        }
      />
      {ordered.length === 0 ? (
        <EmptyState title="No events yet" hint="Agent execution events will stream in here." />
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-zinc-800/50 overflow-y-auto">
          {ordered.map((entry) => (
            <ExecutionLogItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
