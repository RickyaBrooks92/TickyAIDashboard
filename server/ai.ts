import { GoogleGenAI, Type } from '@google/genai';
import type { EmailResultPayload, FlaggedEmail, ParsedEmail } from './agentStream.ts';

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
        },
        required: ['id', 'sender', 'subject', 'reason'],
        propertyOrdering: ['id', 'sender', 'subject', 'reason'],
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
    '   "subject", and give a short "reason" (e.g. "Promotional", "Low-priority automated alert").',
    '',
    `Unread emails (JSON):\n${JSON.stringify(inbox, null, 2)}`,
  ].join('\n');
}

function isFlaggedEmail(value: unknown): value is FlaggedEmail {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.sender === 'string' &&
    typeof o.subject === 'string' &&
    typeof o.reason === 'string'
  );
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
  return {
    summary: o.summary,
    flaggedForDeletion: o.flaggedForDeletion.filter(isFlaggedEmail),
  };
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
