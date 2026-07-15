import { Badge } from '../../../components/ui/Badge';
import type { FlaggedEmail } from '../../telemetry/types';

export interface FlaggedEmailRowProps {
  email: FlaggedEmail;
  onKeep: (email: FlaggedEmail) => void;
  onApproveDeletion: (email: FlaggedEmail) => void;
}

/** One flagged email + the Human-in-the-Loop Keep / Approve Deletion controls. */
export function FlaggedEmailRow({ email, onKeep, onApproveDeletion }: FlaggedEmailRowProps) {
  return (
    <li className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{email.subject}</p>
          <p className="truncate font-mono text-xs text-zinc-500">{email.sender}</p>
        </div>
        <Badge tone="amber">{email.reason}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onKeep(email)}
          className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Keep
        </button>
        <button
          type="button"
          onClick={() => onApproveDeletion(email)}
          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
        >
          Approve Deletion
        </button>
      </div>
    </li>
  );
}
