import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { TrashIcon } from '../../../../components/ui/icons';
import { emailClosed, selectSelectedEmail } from '../emailSlice';
import { fetchEmailBody, trashEmails } from '../api';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; body: string }
  | { status: 'error'; message: string };

/**
 * Center-pane reader for a single email. The body arrives as plain text (the
 * server strips any HTML), so it's rendered as escaped text — no markup reaches
 * the DOM. Opened from the Raw Data / Results lists; Close returns to the editor.
 */
export function EmailDetailView() {
  const email = useAppSelector(selectSelectedEmail);
  const dispatch = useAppDispatch();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [trashing, setTrashing] = useState(false);
  const [trashError, setTrashError] = useState(false);

  const emailId = email?.id;

  // Fetch the full body whenever the opened email changes.
  useEffect(() => {
    if (!emailId) return;
    let cancelled = false;
    setLoad({ status: 'loading' });
    void fetchEmailBody(emailId)
      .then((body) => {
        if (!cancelled) setLoad({ status: 'ready', body });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoad({
            status: 'error',
            message: err instanceof Error ? err.message : 'Could not load this email.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [emailId]);

  if (!email) return null;

  const handleClose = () => dispatch(emailClosed());

  const handleTrash = async () => {
    setTrashing(true);
    setTrashError(false);
    try {
      await trashEmails([email.id]);
      dispatch(emailClosed());
    } catch {
      setTrashError(true);
      setTrashing(false);
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950">
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900 px-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Email Reader
        </span>
        <div className="flex items-center gap-2">
          {trashError && (
            <span className="text-[11px] text-red-400">Couldn&apos;t move — try again</span>
          )}
          <button
            type="button"
            onClick={handleTrash}
            disabled={trashing}
            className="flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            <TrashIcon size={13} />
            {trashing ? 'Moving…' : 'Trash'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="break-words text-base font-semibold text-zinc-100">
            {email.subject || '(no subject)'}
          </h2>
          <p className="mt-1 break-words font-mono text-xs text-zinc-400">{email.from}</p>
          {email.date && <p className="mt-0.5 text-[11px] text-zinc-500">{email.date}</p>}
        </div>

        <div className="px-5 py-4">
          {load.status === 'loading' && <p className="text-xs text-zinc-500">Loading email…</p>}
          {load.status === 'error' && <p className="text-xs text-red-400">{load.message}</p>}
          {load.status === 'ready' && (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-200">
              {load.body}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
