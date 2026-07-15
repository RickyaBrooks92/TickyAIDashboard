import { google } from 'googleapis';
import type { ParsedEmail } from './agentStream.ts';
import { getOAuthClient } from './auth.ts';
import { getRefreshToken } from './tokenStore.ts';

const MAX_EMAILS = 15;

type GmailHeader = { name?: string | null; value?: string | null };

function header(headers: GmailHeader[] | undefined, name: string): string {
  const match = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return match?.value ?? '';
}

/** Build a Gmail API client authorized for the user, or throw a clear error. */
function getGmailClient(userId: string) {
  const refreshToken = getRefreshToken(userId);
  if (!refreshToken) {
    throw new Error('No Google account connected — click "Connect Google Workspace" first.');
  }
  const client = getOAuthClient();
  if (!client) {
    throw new Error('Google OAuth is not configured (set GOOGLE_* in server/.env).');
  }
  client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: client });
}

/**
 * Fetch the user's most recent unread emails (headers + plain-text snippet).
 * Throws a clear error if the account isn't connected or OAuth is unconfigured.
 */
export async function fetchUnreadEmails(userId: string): Promise<ParsedEmail[]> {
  const gmail = getGmailClient(userId);

  const list = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: MAX_EMAILS,
  });
  const messages = list.data.messages ?? [];

  const emails = await Promise.all(
    messages.map(async (msg): Promise<ParsedEmail | null> => {
      if (!msg.id) return null;
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });
      const headers = detail.data.payload?.headers ?? undefined;
      return {
        id: msg.id,
        from: header(headers, 'From'),
        subject: header(headers, 'Subject'),
        date: header(headers, 'Date'),
        snippet: detail.data.snippet ?? '',
      };
    }),
  );

  return emails.filter((email): email is ParsedEmail => email !== null);
}

/**
 * Move the given messages to the user's Gmail trash (recoverable — not a
 * permanent delete). Uses batchModify to add the special TRASH label.
 */
export async function trashMessages(userId: string, messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;
  const gmail = getGmailClient(userId);
  try {
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds,
        addLabelIds: ['TRASH'],
      },
    });
  } catch (err) {
    console.error('[gmail] batchModify (trash) failed:', err);
    throw new Error('Failed to move messages to trash.');
  }
}
