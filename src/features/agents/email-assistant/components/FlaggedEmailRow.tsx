import { Badge, type BadgeTone } from '../../../../components/ui/Badge';
import { CheckIcon } from '../../../../components/ui/icons';
import { cx } from '../../../../lib/cx';
import type { FlaggedEmail } from '../../../telemetry/types';

/** Per-email lifecycle. Owned by the parent widget so bulk actions can drive it. */
export type RowStatus = 'idle' | 'trashing' | 'trashed' | 'error' | 'kept';

export interface FlaggedEmailRowProps {
  email: FlaggedEmail;
  status: RowStatus;
  /** Priority color for the reason badge. */
  tone: BadgeTone;
  onOpen: (email: FlaggedEmail) => void;
  onKeep: (email: FlaggedEmail) => void;
  onApproveDeletion: (email: FlaggedEmail) => void;
}

/** One flagged email + the Human-in-the-Loop Keep / Approve Deletion controls. */
export function FlaggedEmailRow({
  email,
  status,
  tone,
  onOpen,
  onKeep,
  onApproveDeletion,
}: FlaggedEmailRowProps) {
  const busy = status === 'trashing';
  const resolved = status === 'trashed' || status === 'kept';

  return (
    <li
      className={cx(
        'rounded-md border border-zinc-800 bg-zinc-900/40 p-3 transition-opacity',
        resolved && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpen(email)}
          className="group min-w-0 flex-1 text-left"
          title="Open email"
        >
          <p className="truncate text-sm font-medium text-zinc-100 group-hover:underline">
            {email.subject}
          </p>
          <p className="truncate font-mono text-xs text-zinc-500">{email.sender}</p>
        </button>
        <Badge tone={tone}>{email.reason}</Badge>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {status === 'trashed' ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
            <CheckIcon size={13} />
            Moved to Trash
          </span>
        ) : status === 'kept' ? (
          <span className="inline-flex items-center rounded-md bg-zinc-700/40 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-600/40">
            Kept
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
              onClick={() => onApproveDeletion(email)}
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
