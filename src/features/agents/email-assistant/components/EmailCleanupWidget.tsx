import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { Badge, type BadgeTone } from '../../../../components/ui/Badge';
import { emailOpened, selectRawEmails } from '../emailSlice';
import type { CleanupPriority, EmailResultPayload, FlaggedEmail } from '../types';
import { trashEmails } from '../api';
import { FlaggedEmailRow, type RowStatus } from './FlaggedEmailRow';

export interface EmailCleanupWidgetProps {
  result: EmailResultPayload;
}

interface PriorityMeta {
  label: string;
  tone: BadgeTone;
}

/** Rendered high → low so the most-deletable group sits at the top. */
const PRIORITY_ORDER: readonly CleanupPriority[] = ['high', 'medium', 'low'];

const PRIORITY_META: Record<CleanupPriority, PriorityMeta> = {
  high: { label: 'High · safe to delete', tone: 'red' },
  medium: { label: 'Medium', tone: 'amber' },
  low: { label: 'Low · glance first', tone: 'zinc' },
};

/** A row counts as "actionable" when a Trash-all could still affect it. */
function isActionable(status: RowStatus): boolean {
  return status === 'idle' || status === 'error' || status === 'trashing';
}

/**
 * Renders the email-assistant's verdict as an approval surface: emails grouped
 * by delete-priority (color-coded), each row with Keep / Approve Deletion, plus a
 * per-group "Trash all". Row status is owned here so bulk actions stay in sync.
 */
export function EmailCleanupWidget({ result }: EmailCleanupWidgetProps) {
  const dispatch = useAppDispatch();
  const rawEmails = useAppSelector(selectRawEmails);
  const [statuses, setStatuses] = useState<Record<string, RowStatus>>({});

  const statusOf = (id: string): RowStatus => statuses[id] ?? 'idle';

  // Open in the reader — prefer the full fetched email (has date/snippet) and
  // fall back to the flagged fields when it isn't in the raw set.
  const handleOpen = (email: FlaggedEmail) => {
    const full = rawEmails?.find((e) => e.id === email.id);
    dispatch(
      emailOpened(
        full ?? { id: email.id, from: email.sender, subject: email.subject, date: '', snippet: '' },
      ),
    );
  };

  const groups = useMemo(
    () =>
      PRIORITY_ORDER.map((priority) => ({
        priority,
        emails: result.flaggedForDeletion.filter((e) => e.priority === priority),
      })).filter((group) => group.emails.length > 0),
    [result],
  );

  const setStatus = (id: string, status: RowStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  const setMany = (ids: string[], status: RowStatus) =>
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = status;
      return next;
    });

  const handleKeep = (email: FlaggedEmail) => setStatus(email.id, 'kept');

  const handleApproveDeletion = async (email: FlaggedEmail) => {
    setStatus(email.id, 'trashing');
    try {
      await trashEmails([email.id]);
      setStatus(email.id, 'trashed');
    } catch {
      setStatus(email.id, 'error');
    }
  };

  const handleTrashGroup = async (emails: FlaggedEmail[]) => {
    // Only sweep rows the user hasn't already resolved (kept/trashed).
    const ids = emails
      .filter((e) => statusOf(e.id) === 'idle' || statusOf(e.id) === 'error')
      .map((e) => e.id);
    if (ids.length === 0) return;

    setMany(ids, 'trashing');
    try {
      await trashEmails(ids);
      setMany(ids, 'trashed');
    } catch {
      setMany(ids, 'error');
    }
  };

  const flaggedCount = result.flaggedForDeletion.length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Inbox Summary
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-200">{result.summary}</p>
      </section>

      {flaggedCount === 0 ? (
        <p className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-500">
          Nothing flagged — inbox is clean.
        </p>
      ) : (
        groups.map((group) => {
          const meta = PRIORITY_META[group.priority];
          const anyActionable = group.emails.some((e) => isActionable(statusOf(e.id)));
          return (
            <section key={group.priority}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {group.emails.length} email{group.emails.length === 1 ? '' : 's'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTrashGroup(group.emails)}
                  disabled={!anyActionable}
                  className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
                >
                  Trash all
                </button>
              </div>
              <ul className="space-y-2">
                {group.emails.map((email) => (
                  <FlaggedEmailRow
                    key={email.id}
                    email={email}
                    status={statusOf(email.id)}
                    tone={meta.tone}
                    onOpen={handleOpen}
                    onKeep={handleKeep}
                    onApproveDeletion={handleApproveDeletion}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
