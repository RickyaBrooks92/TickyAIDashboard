import type { ReactNode } from 'react';
import { BoltIcon } from '../ui/icons';

export interface TopBarProps {
  actions?: ReactNode;
}

/** App title bar. `actions` renders on the right (e.g. the stream status). */
export function TopBar({ actions }: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/30">
          <BoltIcon size={14} />
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-zinc-100">Tickys AI Dashboard</span>
          <span className="hidden text-[11px] uppercase tracking-wider text-zinc-500 sm:inline">
            observability
          </span>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
