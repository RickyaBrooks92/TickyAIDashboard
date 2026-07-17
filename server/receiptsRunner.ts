import type { AgentRunner, ContextBlock } from './agentStream.ts';
import { estimateTokens, logEvent, snapshot } from './agentStream.ts';
import { fetchEmails, type ParsedEmail } from './gmail.ts';
import { extractReceipts } from './receipts.ts';
import { getRefreshToken } from './tokenStore.ts';

/** Gmail's own auto-tagged purchases category — receipts, orders, subscriptions. */
const PURCHASES_QUERY = 'category:purchases';

function purchasesContext(emails: ParsedEmail[]): ContextBlock[] {
  const text = emails.map((e) => `${e.from} ${e.subject} ${e.snippet}`).join('\n');
  return [
    {
      id: 'ctx-system',
      label: 'System Prompt',
      tokenCount: 700,
      content: 'Receipts & subscriptions assistant instructions.',
    },
    {
      id: 'ctx-skill',
      label: 'Skill: receipts-assistant',
      tokenCount: 420,
      content: 'Extract receipts and recurring subscriptions from purchase emails.',
    },
    {
      id: 'ctx-inbox',
      label: `Purchases Payload (${emails.length} emails)`,
      tokenCount: estimateTokens(text),
      content: `Fetched ${emails.length} purchase emails from Gmail.`,
    },
  ];
}

/**
 * Run the receipts agent: authenticate, fetch purchase emails, extract receipts
 * + subscriptions with Gemini, and stream logs + context + result. Any failure
 * is streamed as an error log followed by `done` — never thrown to the caller.
 */
export const runReceiptsAgent: AgentRunner = async (send, ctx) => {
  const { userId, apiKey, model, maxEmails, skillContent } = ctx;
  try {
    send(logEvent('info', 'system', 'Authenticating with Google Workspace...'));

    const refreshToken = getRefreshToken(userId);
    if (!refreshToken) {
      throw new Error(
        'Google OAuth token is missing a refresh token. Please revoke access in your Google Account and reconnect.',
      );
    }

    const emails = await fetchEmails(userId, PURCHASES_QUERY, maxEmails);

    const baseBlocks = purchasesContext(emails);
    send({ type: 'context', snapshot: snapshot(baseBlocks) });
    send(
      logEvent(
        'info',
        'tool_result',
        `Found ${emails.length} purchase emails. Connecting to Gemini...`,
      ),
    );

    if (emails.length === 0) {
      send({
        type: 'result',
        payload: { summary: 'No purchase emails found in your inbox.', items: [] },
      });
      send(logEvent('success', 'model_response', 'Nothing to extract — no purchases found.'));
      send({ type: 'done' });
      return;
    }

    const result = await extractReceipts(emails, apiKey, model, skillContent, (_attempt, delayMs) => {
      send(
        logEvent(
          'warn',
          'system',
          `Gemini is busy (high demand) — retrying in ${Math.max(1, Math.round(delayMs / 1000))}s…`,
        ),
      );
    });

    const geminiBlock: ContextBlock = {
      id: 'ctx-gemini',
      label: 'Gemini Response',
      tokenCount: estimateTokens(JSON.stringify(result)),
      content: result.summary,
    };
    send({ type: 'context', snapshot: snapshot([...baseBlocks, geminiBlock]) });

    send(logEvent('action', 'tool_result', 'AI processing complete. Preparing payload...'));
    send({ type: 'result', payload: result });
    send(
      logEvent(
        'success',
        'model_response',
        `Extracted ${result.items.length} receipts & subscriptions`,
      ),
    );
    send({ type: 'done' });
  } catch (err) {
    console.error('[receiptsRunner] run failed:', err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'An unexpected error occurred during execution';
    send(logEvent('error', 'system', message));
    send({ type: 'done' });
  }
};
