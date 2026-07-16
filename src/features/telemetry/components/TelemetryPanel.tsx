import { useEffect, useState, type ReactNode } from 'react';
import { useAppSelector } from '../../../app/hooks';
import type { RootState } from '../../../app/store';
import { cx } from '../../../lib/cx';
import { ResultsHost } from '../../agents/components/ResultsHost';
import { useActiveModule } from '../../agents/useActiveModule';
import { CurrentContextWindow } from './CurrentContextWindow';
import { ExecutionLog } from './ExecutionLog';

interface PaneTab {
  id: string;
  label: string;
  body: ReactNode;
  /** Fresh-content predicate (drives the dot + auto-switch). Omit for Telemetry. */
  hasContent?: (state: RootState) => boolean;
  /** Telemetry lays itself out; other tabs get a scroll container. */
  scroll: boolean;
}

/**
 * Right pane: a Telemetry tab plus whatever tabs the active agent module
 * contributes (email → Raw Data) and a generic Results tab. The panel itself
 * knows nothing about any specific agent.
 */
export function TelemetryPanel() {
  const module = useActiveModule();
  const [tab, setTab] = useState<string>('telemetry');

  const tabs: PaneTab[] = [
    {
      id: 'telemetry',
      label: 'Telemetry',
      body: (
        <>
          <CurrentContextWindow />
          <ExecutionLog />
        </>
      ),
      scroll: false,
    },
    ...(module?.tabs ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      body: <t.View />,
      hasContent: t.hasContent,
      scroll: true,
    })),
    ...(module
      ? [
          {
            id: 'results',
            label: 'Results',
            body: <ResultsHost />,
            hasContent: module.hasResult,
            scroll: true,
          },
        ]
      : []),
  ];

  // Auto-switch: to the first module tab when its content lands, then to Results
  // when the verdict arrives (generic form of the old inbox → results flow).
  const firstModuleTabId = module?.tabs?.[0]?.id;
  const firstTabReady = useAppSelector((s) =>
    module?.tabs?.[0] ? module.tabs[0].hasContent(s) : false,
  );
  const resultReady = useAppSelector((s) => module?.hasResult(s) ?? false);

  useEffect(() => {
    if (firstTabReady && firstModuleTabId) setTab(firstModuleTabId);
  }, [firstTabReady, firstModuleTabId]);
  useEffect(() => {
    if (resultReady) setTab('results');
  }, [resultReady]);

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-2">
        {tabs.map((t) => (
          <TabButton key={t.id} tab={t} active={activeTab?.id === t.id} onClick={() => setTab(t.id)} />
        ))}
      </div>

      <div
        className={cx(
          'min-h-0 min-w-0 flex-1',
          activeTab?.scroll ? 'overflow-y-auto' : 'flex flex-col',
        )}
      >
        {activeTab?.body}
      </div>
    </div>
  );
}

interface TabButtonProps {
  tab: PaneTab;
  active: boolean;
  onClick: () => void;
}

function TabButton({ tab, active, onClick }: TabButtonProps) {
  const ready = useAppSelector((s) => tab.hasContent?.(s) ?? false);
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
      {tab.label}
      {ready && (
        <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
      )}
    </button>
  );
}
