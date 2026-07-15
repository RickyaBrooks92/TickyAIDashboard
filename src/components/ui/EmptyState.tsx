import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint?: string;
}

/** Centered placeholder for panes with no content yet. */
export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      {icon && <div className="text-zinc-600">{icon}</div>}
      <p className="text-sm text-zinc-400">{title}</p>
      {hint && <p className="max-w-xs text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}
