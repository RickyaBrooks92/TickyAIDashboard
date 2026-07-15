import type { AgentStreamEvent, ContextBlock } from './agentStream.ts';
import { estimateTokens, logEvent, snapshot } from './agentStream.ts';
import { categorizeInbox } from './ai.ts';
import { fetchUnreadEmails, type ParsedEmail } from './gmail.ts';

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
export async function runEmailAgent(send: Send, userId: string): Promise<void> {
  try {
    send(logEvent('info', 'system', 'Authenticating with Google Workspace...'));

    const emails = await fetchUnreadEmails(userId);
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

    const result = await categorizeInbox(emails);

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
    const message = err instanceof Error ? err.message : 'Unknown error';
    send(logEvent('error', 'system', `Agent run failed: ${message}`));
    send({ type: 'done' });
  }
}
