import type { ReactNode } from 'react';

export interface PaneHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

/** Consistent header row for every pane: icon + title/subtitle + optional actions. */
export function PaneHeader({ title, subtitle, icon, actions }: PaneHeaderProps) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/40 px-3">
      <div className="flex min-w-0 items-center gap-2">
        {icon && <span className="shrink-0 text-zinc-500">{icon}</span>}
        <div className="min-w-0 leading-tight">
          <h2 className="truncate text-xs font-semibold uppercase tracking-wide text-zinc-300">
            {title}
          </h2>
          {subtitle && <p className="truncate text-[11px] text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}
