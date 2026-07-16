import { useEffect, useState, type ReactNode } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LayersIcon } from '../../../components/ui/icons';
import { cx } from '../../../lib/cx';
import { AgentResultCanvas } from '../../results/components/AgentResultCanvas';
import { InboxPreviewWidget } from '../../results/components/InboxPreviewWidget';
import { selectActiveResult, selectIsStreaming, selectRawEmails } from '../telemetrySlice';
import { CurrentContextWindow } from './CurrentContextWindow';
import { ExecutionLog } from './ExecutionLog';

type RightPaneTab = 'telemetry' | 'raw' | 'results';

/** Right pane: tabbed view over raw Telemetry, the fetched inbox, and the AI verdict. */
export function TelemetryPanel() {
  const activeResult = useAppSelector(selectActiveResult);
  const rawEmails = useAppSelector(selectRawEmails);
  const isStreaming = useAppSelector(selectIsStreaming);
  const [tab, setTab] = useState<RightPaneTab>('telemetry');

  const hasRaw = Boolean(rawEmails && rawEmails.length > 0);
  const hasResult = Boolean(activeResult);

  // Progression: jump to Raw Data when the inbox lands, then to Results when the
  // AI verdict arrives. The truthy guards keep a null-reset (start of a new run)
  // from yanking the user off a tab they switched to manually.
  useEffect(() => {
    if (rawEmails) setTab('raw');
  }, [rawEmails]);
  useEffect(() => {
    if (activeResult) setTab('results');
  }, [activeResult]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-2">
        <TabButton active={tab === 'telemetry'} onClick={() => setTab('telemetry')}>
          Telemetry
        </TabButton>
        <TabButton active={tab === 'raw'} onClick={() => setTab('raw')}>
          Raw Data
          {hasRaw && <ReadyDot />}
        </TabButton>
        <TabButton active={tab === 'results'} onClick={() => setTab('results')}>
          Results
          {hasResult && <ReadyDot />}
        </TabButton>
      </div>

      {tab === 'telemetry' && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <CurrentContextWindow />
          <ExecutionLog />
        </div>
      )}

      {tab === 'raw' && (
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {hasRaw ? (
            <InboxPreviewWidget />
          ) : (
            <EmptyState
              icon={<LayersIcon size={26} />}
              title={isStreaming ? 'Fetching your inbox…' : 'No inbox loaded'}
              hint={
                isStreaming
                  ? 'Raw emails will appear here as soon as they load.'
                  : 'Run an agent to fetch your unread inbox.'
              }
            />
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <AgentResultCanvas />
        </div>
      )}
    </div>
  );
}

/** Small emerald dot signalling a tab has fresh content. */
function ReadyDot() {
  return (
    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
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
