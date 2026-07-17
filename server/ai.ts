import { GoogleGenAI, Type } from '@google/genai';
import type { ParsedEmail } from './gmail.ts';
import { withRetry, type OnRetry } from './retry.ts';

/** How safe an email is to delete — drives the color-coded Results grouping. */
export type CleanupPriority = 'high' | 'medium' | 'low';

export interface FlaggedEmail {
  id: string;
  sender: string;
  subject: string;
  reason: string;
  priority: CleanupPriority;
}

export interface EmailResultPayload {
  summary: string;
  flaggedForDeletion: FlaggedEmail[];
}

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

/** Fallback instructions when the skill body is empty. */
const DEFAULT_INSTRUCTIONS =
  'You are an email cleanup assistant. Analyze the unread emails and identify which are safe to delete or archive.';

/** Strip a leading YAML frontmatter block (--- … ---) from a SKILL.md body. */
function stripFrontmatter(md: string): string {
  return md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
}

/**
 * Build the Gemini prompt: the skill's own instructions (from the editable
 * SKILL.md body) lead, followed by the fixed output contract (which must match
 * the JSON schema) and the email payload. The skill text steers behavior; the
 * contract keeps the structured output valid regardless of what the user writes.
 */
function buildPrompt(emails: ParsedEmail[], skillContent: string): string {
  const instructions = stripFrontmatter(skillContent) || DEFAULT_INSTRUCTIONS;
  const inbox = emails.map((e) => ({
    id: e.id,
    from: e.from,
    subject: e.subject,
    snippet: e.snippet,
  }));
  return [
    instructions,
    '',
    'Return JSON only, matching the provided schema:',
    '- "summary": a one-to-two sentence executive summary of what needs the user\'s attention.',
    '- "flaggedForDeletion": include ONLY promotional, marketing, newsletter, or low-priority',
    '  automated emails that are safe to delete or archive. Never flag personal or important mail.',
    '  For each, set "id" to the exact input id, copy its "sender" (the from field) and "subject",',
    '  give a short "reason", and set "priority" by how safe it is to delete:',
    '    - "high": spam, junk, or obvious clutter that is clearly safe to delete',
    '    - "medium": promotional or marketing email (sales, product news, newsletters)',
    '    - "low": automated notifications, receipts, or social updates worth a glance first',
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
 * held on the server. Transient overload (503/429/500) is retried with backoff.
 */
export async function categorizeInbox(
  emails: ParsedEmail[],
  apiKey: string,
  model: string,
  skillContent: string,
  onRetry?: OnRetry,
): Promise<EmailResultPayload> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model,
        contents: buildPrompt(emails, skillContent),
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      }),
    onRetry,
  );

  const text = response.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return parseResult(text);
}
