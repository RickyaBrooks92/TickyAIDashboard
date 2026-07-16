import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { emailOpened, selectRawEmails } from '../emailSlice';

/**
 * Compact list of the raw emails the agent fetched from Gmail. Each row opens the
 * full email in the center reader. Self-hides until the emails arrive.
 */
export function InboxPreviewWidget() {
  const rawEmails = useAppSelector(selectRawEmails);
  const dispatch = useAppDispatch();
  if (!rawEmails || rawEmails.length === 0) return null;

  return (
    <section className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Target Inbox (Raw Data)
        </h3>
        <span className="font-mono text-[11px] text-zinc-500">
          {rawEmails.length} email{rawEmails.length === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="divide-y divide-zinc-800/60 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/40">
        {rawEmails.map((email) => (
          <li key={email.id}>
            <button
              type="button"
              onClick={() => dispatch(emailOpened(email))}
              className="block w-full min-w-0 px-3 py-2 text-left transition-colors hover:bg-zinc-800/50"
            >
              <p className="truncate text-xs font-medium text-zinc-200">
                {email.subject || '(no subject)'}
              </p>
              <p className="truncate font-mono text-[11px] text-zinc-500">{email.from}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
