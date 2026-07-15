import { useAppSelector } from '../../../app/hooks';
import { selectRawEmails } from '../../telemetry/telemetrySlice';

/**
 * Compact preview of the raw emails the agent just fetched from Gmail, shown
 * above the AI result so the user sees exactly what is being processed.
 * Self-hides until the emails arrive.
 */
export function InboxPreviewWidget() {
  const rawEmails = useAppSelector(selectRawEmails);
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
          <li key={email.id} className="px-3 py-2">
            <p className="truncate text-xs font-medium text-zinc-200">
              {email.subject || '(no subject)'}
            </p>
            <p className="truncate font-mono text-[11px] text-zinc-500">{email.from}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
