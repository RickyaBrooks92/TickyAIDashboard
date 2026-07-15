import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type BadgeTone = 'zinc' | 'sky' | 'emerald' | 'amber' | 'red' | 'violet';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  zinc: 'bg-zinc-700/40 text-zinc-300 ring-zinc-600/40',
  sky: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  red: 'bg-red-500/15 text-red-300 ring-red-500/30',
  violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
};

export function Badge({ children, tone = 'zinc', className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
