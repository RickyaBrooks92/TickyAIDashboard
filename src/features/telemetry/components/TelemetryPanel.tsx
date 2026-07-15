import { useEffect, useState, type ReactNode } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { cx } from '../../../lib/cx';
import { AgentResultCanvas } from '../../results/components/AgentResultCanvas';
import { selectActiveResult, selectRawEmails } from '../telemetrySlice';
import { CurrentContextWindow } from './CurrentContextWindow';
import { ExecutionLog } from './ExecutionLog';

type RightPaneTab = 'telemetry' | 'results';

/** Right pane: tabbed view over raw Telemetry and structured Results. */
export function TelemetryPanel() {
  const activeResult = useAppSelector(selectActiveResult);
  const rawEmails = useAppSelector(selectRawEmails);
  const [tab, setTab] = useState<RightPaneTab>('telemetry');

  const hasResults = Boolean(rawEmails) || Boolean(activeResult);

  // Auto-switch to Results as soon as the raw inbox (or a result) arrives. Only
  // re-fires when those references change, so a manual switch back sticks.
  useEffect(() => {
    if (rawEmails || activeResult) setTab('results');
  }, [rawEmails, activeResult]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-950">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-2">
        <TabButton active={tab === 'telemetry'} onClick={() => setTab('telemetry')}>
          Telemetry
        </TabButton>
        <TabButton active={tab === 'results'} onClick={() => setTab('results')}>
          Results
          {hasResults && (
            <span
              className="ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-hidden="true"
            />
          )}
        </TabButton>
      </div>

      {tab === 'telemetry' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <CurrentContextWindow />
          <ExecutionLog />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AgentResultCanvas />
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex items-center rounded-md px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
      )}
    >
      {children}
    </button>
  );
}
