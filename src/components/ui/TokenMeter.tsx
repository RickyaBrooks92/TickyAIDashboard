import { cx } from '../../lib/cx';
import { formatTokens } from '../../lib/format';

export interface TokenMeterProps {
  used: number;
  max: number;
  label?: string;
}

/** A single context-usage bar (not a chart) — green/amber/red by fill ratio. */
export function TokenMeter({ used, max, label = 'Context usage' }: TokenMeterProps) {
  const ratio = max > 0 ? Math.min(1, used / max) : 0;
  const pct = Math.round(ratio * 100);
  const barTone =
    ratio >= 0.9 ? 'bg-red-500' : ratio >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className="font-mono text-[11px] text-zinc-400">
          {formatTokens(used)} / {formatTokens(max)}
          <span className="ml-1 text-zinc-500">· {pct}%</span>
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-800"
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cx('h-full rounded-full transition-[width] duration-300', barTone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
