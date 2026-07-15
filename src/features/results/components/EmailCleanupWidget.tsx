import type { EmailResultPayload, FlaggedEmail } from '../../telemetry/types';
import { FlaggedEmailRow } from './FlaggedEmailRow';

export interface EmailCleanupWidgetProps {
  result: EmailResultPayload;
}

/**
 * Renders the email-assistant's structured output as an approval surface.
 * The Keep / Approve handlers are the seam where real Redux/mailbox actions
 * land later — for now they just log.
 */
export function EmailCleanupWidget({ result }: EmailCleanupWidgetProps) {
  const handleKeep = (email: FlaggedEmail) => {
    console.log('[email-cleanup] keep', email.id, email.subject);
  };
  const handleApproveDeletion = (email: FlaggedEmail) => {
    console.log('[email-cleanup] approve-deletion', email.id, email.subject);
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

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Flagged for deletion
          </h3>
          <span className="font-mono text-[11px] text-zinc-500">
            {flaggedCount} email{flaggedCount === 1 ? '' : 's'}
          </span>
        </div>
        {flaggedCount === 0 ? (
          <p className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-500">
            Nothing flagged — inbox is clean.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.flaggedForDeletion.map((email) => (
              <FlaggedEmailRow
                key={email.id}
                email={email}
                onKeep={handleKeep}
                onApproveDeletion={handleApproveDeletion}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
