import { Badge, type BadgeTone } from '../../../components/ui/Badge';
import { formatTime } from '../../../lib/format';
import type { ExecutionEventType, ExecutionLogEntry, LogLevel } from '../types';

const levelTone: Record<LogLevel, BadgeTone> = {
  debug: 'zinc',
  info: 'sky',
  warn: 'amber',
  error: 'red',
};

const eventTypeLabel: Record<ExecutionEventType, string> = {
  system: 'system',
  model_response: 'model',
  tool_call: 'tool call',
  tool_result: 'tool result',
  context_update: 'context',
};

export interface ExecutionLogItemProps {
  entry: ExecutionLogEntry;
}

export function ExecutionLogItem({ entry }: ExecutionLogItemProps) {
  return (
    <li className="flex items-start gap-2 px-3 py-1.5 transition-colors hover:bg-zinc-900/50">
      <span className="shrink-0 pt-0.5 font-mono text-[10px] tabular-nums text-zinc-600">
        {formatTime(entry.timestamp)}
      </span>
      <Badge tone={levelTone[entry.level]}>{entry.level}</Badge>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">
          {eventTypeLabel[entry.type]}
        </span>
        <p className="break-words text-xs leading-snug text-zinc-300">{entry.message}</p>
      </div>
    </li>
  );
}
