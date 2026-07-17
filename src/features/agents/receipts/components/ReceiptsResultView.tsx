import { useMemo } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { Badge, type BadgeTone } from '../../../../components/ui/Badge';
import { selectReceiptsResult } from '../receiptsSlice';
import type { ReceiptItem } from '../types';

function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`.trim();
}

/** Normalize a subscription's amount to an approximate monthly figure. */
function toMonthly(item: ReceiptItem): number {
  switch (item.cadence) {
    case 'yearly':
      return item.amount / 12;
    case 'weekly':
      return item.amount * 4.33;
    default:
      // monthly or unknown → treat as-is
      return item.amount;
  }
}

/**
 * Results tab for the receipts agent: a summary plus grouped Subscriptions (with
 * an estimated monthly total) and one-time Receipts. Read-only.
 */
export function ReceiptsResultView() {
  const result = useAppSelector(selectReceiptsResult);

  const { subscriptions, receipts, monthlyTotal } = useMemo(() => {
    const items = result?.items ?? [];
    const subs = items.filter((i) => i.type === 'subscription');
    const recs = items.filter((i) => i.type === 'receipt');
    const mTotal = subs.reduce((sum, i) => sum + toMonthly(i), 0);
    return { subscriptions: subs, receipts: recs, monthlyTotal: mTotal };
  }, [result]);

  if (!result) return null;

  const currency = result.items[0]?.currency ?? 'USD';

  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Summary</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-200">{result.summary}</p>
      </section>

      {subscriptions.length > 0 && (
        <ReceiptGroup
          label="Subscriptions"
          tone="violet"
          items={subscriptions}
          note={`≈ ${formatAmount(monthlyTotal, currency)} / mo`}
        />
      )}

      {receipts.length > 0 && <ReceiptGroup label="Receipts" tone="sky" items={receipts} />}

      {subscriptions.length === 0 && receipts.length === 0 && (
        <p className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-500">
          Nothing found — no receipts or subscriptions in the scanned purchases.
        </p>
      )}
    </div>
  );
}

interface ReceiptGroupProps {
  label: string;
  tone: BadgeTone;
  items: ReceiptItem[];
  note?: string;
}

function ReceiptGroup({ label, tone, items, note }: ReceiptGroupProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{label}</Badge>
          <span className="font-mono text-[11px] text-zinc-500">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        </div>
        {note && <span className="font-mono text-[11px] text-zinc-400">{note}</span>}
      </div>
      <ul className="divide-y divide-zinc-800/60 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/40">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">
                {item.vendor || '(unknown vendor)'}
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {item.date}
                {item.type === 'subscription' && item.cadence ? ` · ${item.cadence}` : ''}
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-zinc-200">
              {formatAmount(item.amount, item.currency)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
