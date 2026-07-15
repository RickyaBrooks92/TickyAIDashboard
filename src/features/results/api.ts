/** Backend endpoint that moves emails to the Gmail trash. */
const TRASH_URL = 'http://localhost:3001/api/agent/trash';

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
