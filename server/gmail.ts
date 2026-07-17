import { google, type gmail_v1 } from 'googleapis';
import { getOAuthClient } from './auth.ts';
import { getRefreshToken } from './tokenStore.ts';

/** A raw email fetched from Gmail (headers + plain-text snippet). */
export interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

/** Gmail returns at most 500 messages per list page. */
export const MAX_EMAILS_CAP = 500;
/** Default pull size when a run doesn't specify one. */
export const DEFAULT_MAX_EMAILS = 250;

// Gmail metadata reads are N+1 (one messages.get per message). Cap how many run
// at once so a large pull stays under Gmail's per-user rate limit (~250 quota
// units/sec; each get ≈ 5 units). ~10 in flight keeps us comfortably under it.
const FETCH_CONCURRENCY = 10;

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

/** Run `fn` over `items` with at most `limit` promises in flight at a time. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

/**
 * Fetch emails matching a Gmail search query (headers + plain-text snippet).
 * Metadata reads are throttled (see FETCH_CONCURRENCY) so a large pull stays
 * under Gmail's rate limit, and a single failed message is skipped rather than
 * failing the whole batch. Throws only if the account isn't connected / OAuth
 * is unconfigured.
 */
export async function fetchEmails(
  userId: string,
  query: string,
  maxEmails: number = DEFAULT_MAX_EMAILS,
): Promise<ParsedEmail[]> {
  const gmail = getGmailClient(userId);

  const list = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: maxEmails, // caller clamps to [1, MAX_EMAILS_CAP]; one page, no paging.
  });
  const messages = list.data.messages ?? [];

  const emails = await mapWithConcurrency(
    messages,
    FETCH_CONCURRENCY,
    async (msg): Promise<ParsedEmail | null> => {
      if (!msg.id) return null;
      try {
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
      } catch (err) {
        // Skip a message that failed to load (deleted mid-fetch / transient error).
        console.warn(`[gmail] skipped message ${msg.id}:`, err instanceof Error ? err.message : err);
        return null;
      }
    },
  );

  return emails.filter((email): email is ParsedEmail => email !== null);
}

/** Fetch the user's most recent unread emails. */
export function fetchUnreadEmails(
  userId: string,
  maxEmails: number = DEFAULT_MAX_EMAILS,
): Promise<ParsedEmail[]> {
  return fetchEmails(userId, 'is:unread', maxEmails);
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
