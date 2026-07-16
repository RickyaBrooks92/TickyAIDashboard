import { GoogleGenAI, Type } from '@google/genai';
import type {
  CleanupPriority,
  EmailResultPayload,
  FlaggedEmail,
  ParsedEmail,
} from './agentStream.ts';

const PRIORITIES: readonly CleanupPriority[] = ['high', 'medium', 'low'];

// JSON schema that exactly matches the frontend's EmailResultPayload interface.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    flaggedForDeletion: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          sender: { type: Type.STRING },
          subject: { type: Type.STRING },
          reason: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['id', 'sender', 'subject', 'reason', 'priority'],
        propertyOrdering: ['id', 'sender', 'subject', 'reason', 'priority'],
      },
    },
  },
  required: ['summary', 'flaggedForDeletion'],
  propertyOrdering: ['summary', 'flaggedForDeletion'],
};

function buildPrompt(emails: ParsedEmail[]): string {
  const inbox = emails.map((e) => ({
    id: e.id,
    from: e.from,
    subject: e.subject,
    snippet: e.snippet,
  }));
  return [
    'You are an email cleanup assistant. Analyze these unread emails and return JSON only.',
    '',
    'Tasks:',
    '1. Write a one-to-two sentence executive "summary" of what needs the user\'s attention.',
    '2. In "flaggedForDeletion", include ONLY promotional, marketing, newsletter, or low-priority',
    '   automated emails that are safe to delete or archive. Never flag personal or important mail.',
    '   For each flagged email set "id" to the exact input id, copy its "sender" (the from field) and',
    '   "subject", give a short "reason" (e.g. "Promotional", "Low-priority automated alert"), and',
    '   set "priority" by how safe it is to delete:',
    '     - "high": spam, junk, or obvious clutter that is clearly safe to delete',
    '     - "medium": promotional or marketing email (sales, product news, newsletters)',
    '     - "low": automated notifications, receipts, or social updates worth a glance first',
    '',
    `Unread emails (JSON):\n${JSON.stringify(inbox, null, 2)}`,
  ].join('\n');
}

/**
 * Coerce one untrusted item into a FlaggedEmail. Returns null when the core
 * fields are missing; an unrecognized/absent priority defaults to 'medium' so a
 * valid email is never silently dropped over a bad enum value.
 */
function toFlaggedEmail(value: unknown): FlaggedEmail | null {
  if (typeof value !== 'object' || value === null) return null;
  const o = value as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    typeof o.sender !== 'string' ||
    typeof o.subject !== 'string' ||
    typeof o.reason !== 'string'
  ) {
    return null;
  }
  const priority: CleanupPriority =
    typeof o.priority === 'string' && (PRIORITIES as readonly string[]).includes(o.priority)
      ? (o.priority as CleanupPriority)
      : 'medium';
  return { id: o.id, sender: o.sender, subject: o.subject, reason: o.reason, priority };
}

function parseResult(text: string): EmailResultPayload {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Gemini returned a non-object result.');
  }
  const o = parsed as Record<string, unknown>;
  if (typeof o.summary !== 'string' || !Array.isArray(o.flaggedForDeletion)) {
    throw new Error('Gemini result did not match EmailResultPayload.');
  }
  const flaggedForDeletion: FlaggedEmail[] = [];
  for (const item of o.flaggedForDeletion) {
    const email = toFlaggedEmail(item);
    if (email) flaggedForDeletion.push(email);
  }
  return { summary: o.summary, flaggedForDeletion };
}

/**
 * Send parsed emails to Gemini using the caller-supplied API key (BYOK) and
 * return a structured cleanup result. The client is built per call — no key is
 * held on the server.
 */
export async function categorizeInbox(
  emails: ParsedEmail[],
  apiKey: string,
  model: string,
): Promise<EmailResultPayload> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(emails),
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return parseResult(text);
}
