import type { ReactNode } from 'react';

export interface DashboardLayoutProps {
  header: ReactNode;
  /** Left: the Control Plane (skills explorer + editor). */
  left: ReactNode;
  /** Right: the Observability Plane (telemetry). */
  right: ReactNode;
}

/** Full-screen two-pane shell. Left flexes; right is a fixed observability rail. */
export function DashboardLayout({ header, left, right }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-200">
      {header}
      <main className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1">{left}</section>
        <aside className="flex w-[34rem] max-w-[42%] shrink-0 border-l border-zinc-800">
          {right}
        </aside>
      </main>
    </div>
  );
}
