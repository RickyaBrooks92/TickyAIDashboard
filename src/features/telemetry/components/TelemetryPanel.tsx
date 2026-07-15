import { CurrentContextWindow } from './CurrentContextWindow';
import { ExecutionLog } from './ExecutionLog';

/** Right pane: read-only observability — context window stacked over the log. */
export function TelemetryPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-950">
      <CurrentContextWindow />
      <ExecutionLog />
    </div>
  );
}
