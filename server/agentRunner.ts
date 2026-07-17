import type { AgentStreamEvent, ContextBlock, ParsedEmail } from './agentStream.ts';
import { estimateTokens, logEvent, snapshot } from './agentStream.ts';
import { categorizeInbox } from './ai.ts';
import { fetchUnreadEmails } from './gmail.ts';
import { getRefreshToken } from './tokenStore.ts';

type Send = (event: AgentStreamEvent) => void;

function inboxContext(emails: ParsedEmail[]): ContextBlock[] {
  const inboxText = emails.map((e) => `${e.from} ${e.subject} ${e.snippet}`).join('\n');
  return [
    {
      id: 'ctx-system',
      label: 'System Prompt',
      tokenCount: 900,
      content: 'Email cleanup assistant system instructions.',
    },
    {
      id: 'ctx-skill',
      label: 'Skill: email-assistant',
      tokenCount: 480,
      content: 'Analyze the inbox, summarize, and flag cleanup targets.',
    },
    {
      id: 'ctx-inbox',
      label: `Inbox Payload (${emails.length} emails)`,
      tokenCount: estimateTokens(inboxText),
      content: `Fetched ${emails.length} unread emails from Gmail.`,
    },
  ];
}

/**
 * Run the real email agent: authenticate, fetch unread Gmail, categorize with
 * Gemini, and stream logs + context + the final result over `send`. Any failure
 * is streamed as an error log followed by `done` — never thrown to the caller.
 */
export async function runEmailAgent(
  send: Send,
  userId: string,
  apiKey: string,
  model: string,
  maxEmails: number,
): Promise<void> {
  try {
    send(logEvent('info', 'system', 'Authenticating with Google Workspace...'));

    // Validate the stored OAuth token before doing any work: a token with no
    // refresh_token can't be used for offline Gmail access.
    const refreshToken = getRefreshToken(userId);
    if (!refreshToken) {
      throw new Error(
        'Google OAuth token is missing a refresh token. Please revoke access in your Google Account and reconnect.',
      );
    }

    const emails = await fetchUnreadEmails(userId, maxEmails);

    // Surface the raw inbox to the UI immediately, before Gemini processing.
    send({ type: 'inbox_fetched', payload: emails });

    const baseBlocks = inboxContext(emails);
    send({ type: 'context', snapshot: snapshot(baseBlocks) });
    send(
      logEvent(
        'info',
        'tool_result',
        `Fetched ${emails.length} unread emails. Connecting to Gemini...`,
      ),
    );

    if (emails.length === 0) {
      send({
        type: 'result',
        result: { summary: 'No unread emails to review — your inbox is clear.', flaggedForDeletion: [] },
      });
      send(logEvent('success', 'model_response', 'Nothing to do — no unread mail.'));
      send({ type: 'done' });
      return;
    }

    const result = await categorizeInbox(emails, apiKey, model, (_attempt, delayMs) => {
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
    send({ type: 'result', result });
    send(
      logEvent(
        'success',
        'model_response',
        `Summary report generated (${result.flaggedForDeletion.length} flagged for cleanup)`,
      ),
    );
    send({ type: 'done' });
  } catch (err) {
    // Log the full error (with stack) to the server console only — never to the client.
    console.error('[agentRunner] run failed:', err);
    // Send ONLY the message down the SSE stream (no stack-trace leak).
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'An unexpected error occurred during execution';
    send(logEvent('error', 'system', message));
    send({ type: 'done' });
  }
}
