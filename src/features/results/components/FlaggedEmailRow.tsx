import { useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { CheckIcon } from '../../../components/ui/icons';
import { cx } from '../../../lib/cx';
import type { FlaggedEmail } from '../../telemetry/types';

type RowStatus = 'idle' | 'trashing' | 'trashed' | 'error';

export interface FlaggedEmailRowProps {
  email: FlaggedEmail;
  onKeep: (email: FlaggedEmail) => void;
  /** Performs the trash request; rejects on failure. */
  onApproveDeletion: (email: FlaggedEmail) => Promise<void>;
}

/** One flagged email + the Human-in-the-Loop Keep / Approve Deletion controls. */
export function FlaggedEmailRow({ email, onKeep, onApproveDeletion }: FlaggedEmailRowProps) {
  const [status, setStatus] = useState<RowStatus>('idle');
  const busy = status === 'trashing';

  const handleApprove = async () => {
    setStatus('trashing');
    try {
      await onApproveDeletion(email);
      setStatus('trashed');
    } catch {
      setStatus('error');
    }
  };

  return (
    <li
      className={cx(
        'rounded-md border border-zinc-800 bg-zinc-900/40 p-3 transition-opacity',
        status === 'trashed' && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{email.subject}</p>
          <p className="truncate font-mono text-xs text-zinc-500">{email.sender}</p>
        </div>
        <Badge tone="amber">{email.reason}</Badge>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {status === 'trashed' ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
            <CheckIcon size={13} />
            Moved to Trash
          </span>
        ) : (
          <>
            {status === 'error' && (
              <span className="mr-auto text-xs text-red-400">Couldn&apos;t move — try again</span>
            )}
            <button
              type="button"
              onClick={() => onKeep(email)}
              disabled={busy}
              className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Moving…
                </>
              ) : (
                'Approve Deletion'
              )}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
