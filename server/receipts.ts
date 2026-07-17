import { GoogleGenAI, Type } from '@google/genai';
import type { ParsedEmail } from './gmail.ts';
import { withRetry, type OnRetry } from './retry.ts';

export type ReceiptType = 'subscription' | 'receipt';

export interface ReceiptItem {
  /** Source email id. */
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  type: ReceiptType;
  /** For subscriptions: monthly | yearly | weekly | unknown; "" for one-time receipts. */
  cadence: string;
}

export interface ReceiptsResultPayload {
  summary: string;
  items: ReceiptItem[];
}

const RECEIPT_TYPES: readonly ReceiptType[] = ['subscription', 'receipt'];

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          vendor: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          currency: { type: Type.STRING },
          date: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['subscription', 'receipt'] },
          cadence: { type: Type.STRING },
        },
        required: ['id', 'vendor', 'amount', 'currency', 'date', 'type', 'cadence'],
        propertyOrdering: ['id', 'vendor', 'amount', 'currency', 'date', 'type', 'cadence'],
      },
    },
  },
  required: ['summary', 'items'],
  propertyOrdering: ['summary', 'items'],
};

const DEFAULT_INSTRUCTIONS =
  'You are a receipts assistant. From these purchase emails, extract receipts and recurring subscriptions.';

/** Strip a leading YAML frontmatter block (--- … ---) from a SKILL.md body. */
function stripFrontmatter(md: string): string {
  return md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
}

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
    '- "summary": one or two sentences (e.g. how many subscriptions and a rough monthly total).',
    '- "items": one entry per receipt/subscription found. For each, set "id" to the exact input',
    '  id, and extract "vendor", "amount" (a number; 0 if unclear), "currency" (e.g. "USD"), and',
    '  "date". Set "type" to "subscription" for recurring charges (renewal / auto-pay /',
    '  membership), otherwise "receipt". For subscriptions set "cadence" to "monthly", "yearly",',
    '  "weekly", or "unknown"; use "" for one-time receipts. Ignore marketing / non-purchase email.',
    '',
    `Purchase emails (JSON):\n${JSON.stringify(inbox, null, 2)}`,
  ].join('\n');
}

/** Coerce one untrusted item into a ReceiptItem, or null if the core fields are missing. */
function toReceiptItem(value: unknown): ReceiptItem | null {
  if (typeof value !== 'object' || value === null) return null;
  const o = value as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    typeof o.vendor !== 'string' ||
    typeof o.currency !== 'string' ||
    typeof o.date !== 'string'
  ) {
    return null;
  }
  const amount = typeof o.amount === 'number' && Number.isFinite(o.amount) ? o.amount : 0;
  const type: ReceiptType =
    typeof o.type === 'string' && (RECEIPT_TYPES as readonly string[]).includes(o.type)
      ? (o.type as ReceiptType)
      : 'receipt';
  const cadence = typeof o.cadence === 'string' ? o.cadence : '';
  return { id: o.id, vendor: o.vendor, amount, currency: o.currency, date: o.date, type, cadence };
}

function parseResult(text: string): ReceiptsResultPayload {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Gemini returned a non-object result.');
  }
  const o = parsed as Record<string, unknown>;
  if (typeof o.summary !== 'string' || !Array.isArray(o.items)) {
    throw new Error('Gemini result did not match ReceiptsResultPayload.');
  }
  const items: ReceiptItem[] = [];
  for (const item of o.items) {
    const receipt = toReceiptItem(item);
    if (receipt) items.push(receipt);
  }
  return { summary: o.summary, items };
}

/**
 * Send purchase emails to Gemini (BYOK) and return the extracted receipts +
 * subscriptions. Client built per call; transient overload is retried.
 */
export async function extractReceipts(
  emails: ParsedEmail[],
  apiKey: string,
  model: string,
  skillContent: string,
  onRetry?: OnRetry,
): Promise<ReceiptsResultPayload> {
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
