import { google } from 'googleapis';
import { getOAuthClient } from './auth.ts';
import { getRefreshToken } from './tokenStore.ts';

/** Minimal parsed representation of an unread email. */
export interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

const MAX_EMAILS = 15;

type GmailHeader = { name?: string | null; value?: string | null };

function header(headers: GmailHeader[] | undefined, name: string): string {
  const match = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return match?.value ?? '';
}

/**
 * Fetch the user's most recent unread emails (headers + plain-text snippet).
 * Throws a clear error if the account isn't connected or OAuth is unconfigured.
 */
export async function fetchUnreadEmails(userId: string): Promise<ParsedEmail[]> {
  const refreshToken = getRefreshToken(userId);
  if (!refreshToken) {
    throw new Error('No Google account connected — click "Connect Google Workspace" first.');
  }

  const client = getOAuthClient();
  if (!client) {
    throw new Error('Google OAuth is not configured (set GOOGLE_* in server/.env).');
  }
  client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: client });

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
