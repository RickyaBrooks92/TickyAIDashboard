import { google, type gmail_v1 } from 'googleapis';
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

/** Decode a Gmail base64url body part into a UTF-8 string. */
function decodeBody(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

/** Depth-first search for the first body part of the given MIME type. */
function findPart(
  part: gmail_v1.Schema$MessagePart | undefined,
  mimeType: string,
): string | null {
  if (!part) return null;
  if (part.mimeType === mimeType && part.body?.data) {
    return decodeBody(part.body.data);
  }
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found !== null) return found;
  }
  return null;
}

/** Reduce an HTML body to readable plain text (also our XSS guard — no markup reaches the UI). */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|br|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fetch a single message's full body as plain text. Prefers the text/plain part;
 * falls back to stripping the HTML part to text. Returns the snippet if neither
 * exists. The body is always returned as text — no HTML is sent to the client.
 */
export async function fetchMessageBody(userId: string, id: string): Promise<string> {
  const gmail = getGmailClient(userId);
  const detail = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
  const payload = detail.data.payload ?? undefined;

  const plain = findPart(payload, 'text/plain');
  if (plain !== null && plain.trim().length > 0) return plain.trim();

  const html = findPart(payload, 'text/html');
  if (html !== null) return htmlToText(html);

  if (payload?.body?.data) return decodeBody(payload.body.data);
  return detail.data.snippet ?? '(This email has no readable text body.)';
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
