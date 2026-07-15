import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export interface PaneProps {
  children: ReactNode;
  className?: string;
}

/** Generic vertical flex container that participates in a flex layout without
 *  overflowing (min-h-0 / min-w-0 lets inner scroll regions work). */
export function Pane({ children, className }: PaneProps) {
  return (
    <section className={cx('flex min-h-0 min-w-0 flex-col', className)}>
      {children}
    </section>
  );
}
