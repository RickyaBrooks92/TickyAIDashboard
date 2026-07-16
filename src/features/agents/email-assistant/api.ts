/** Backend endpoint that moves emails to the Gmail trash. */
const TRASH_URL = 'http://localhost:3001/api/agent/trash';

/** Backend endpoint that returns a single email's plain-text body. */
const MESSAGE_URL = 'http://localhost:3001/api/agent/message';

/** Fetch one email's full body as plain text. Throws on failure. */
export async function fetchEmailBody(id: string): Promise<string> {
  const response = await fetch(`${MESSAGE_URL}/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Failed to load email (HTTP ${response.status})`);
  }
  const data: unknown = await response.json();
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as Record<string, unknown>).body !== 'string'
  ) {
    throw new Error('Malformed email response from server.');
  }
  return (data as { body: string }).body;
}

/** Request body for POST /api/agent/trash. */
export interface TrashRequest {
  messageIds: string[];
}

/** Move the given message ids to the user's Gmail trash. Throws on failure. */
export async function trashEmails(messageIds: string[]): Promise<void> {
  const payload: TrashRequest = { messageIds };
  const response = await fetch(TRASH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Trash request failed (HTTP ${response.status})`);
  }
}
