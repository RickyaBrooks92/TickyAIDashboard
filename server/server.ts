import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { runEmailAgent } from './agentRunner.ts';
import { logEvent, type AgentRunRequest, type AgentStreamEvent } from './agentStream.ts';
import { authRouter, isGoogleConfigured } from './auth.ts';
import { trashMessages } from './gmail.ts';
import { clearTokens, getRefreshToken } from './tokenStore.ts';

const PORT = Number(process.env.PORT) || 3001;

/** Default Gemini model when the request omits one. */
const DEFAULT_MODEL = 'gemini-2.5-flash';

const app = express();

// The Vite dev server is the only allowed origin for the browser EventSource/fetch.
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Google OAuth routes (/api/auth/google, /api/auth/google/callback).
app.use('/api/auth', authRouter);

/** Connection status: true when we hold a refresh token for the user. */
app.get('/api/auth/status', (_req, res) => {
  res.json({ connected: getRefreshToken('user_1') !== null });
});

/** Disconnect: erase the stored token so the user can re-authenticate cleanly. */
app.post('/api/auth/disconnect', (_req, res) => {
  clearTokens();
  res.json({ success: true });
});

app.get('/', (_req, res) => {
  res.type('text/plain').send('Tickys agent server — SSE stream at POST /api/agent/run');
});

/**
 * Server-Sent Events endpoint (POST so the browser can send the BYOK key as a
 * header). Runs the real email agent and streams each frame as `data: {json}\n\n`.
 * The AI key arrives per request via `x-ai-provider-key` and is never logged.
 */
app.post('/api/agent/run', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  const send = (event: AgentStreamEvent): void => {
    if (closed || res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const headerKey = req.headers['x-ai-provider-key'];
  const apiKey = typeof headerKey === 'string' ? headerKey.trim() : '';
  if (!apiKey) {
    send(
      logEvent(
        'error',
        'system',
        'No AI provider key — add your Gemini API key in Settings (the gear icon).',
      ),
    );
    send({ type: 'done' });
    res.end();
    return;
  }

  // Pick the model from the request body, falling back to a safe default.
  const body = req.body as AgentRunRequest;
  const model =
    typeof body?.model === 'string' && body.model.trim().length > 0
      ? body.model.trim()
      : DEFAULT_MODEL;

  try {
    await runEmailAgent(send, 'user_1', apiKey, model);
  } catch (err) {
    // runEmailAgent handles its own errors; this guards against anything unexpected.
    console.error('[server] /api/agent/run crashed:', err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'An unexpected error occurred during execution';
    send(logEvent('error', 'system', message));
    send({ type: 'done' });
  } finally {
    // Always terminate the stream so the browser's fetchEventSource stops waiting.
    if (!res.writableEnded) res.end();
  }
});

/** Validate an untrusted POST body into a `string[]` of message ids. */
function parseTrashBody(body: unknown): string[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const ids: unknown = (body as Record<string, unknown>).messageIds;
  if (!Array.isArray(ids)) return null;
  if (!ids.every((id): id is string => typeof id === 'string')) return null;
  return ids;
}

/** Human-in-the-loop action: move approved emails to the Gmail trash. */
app.post('/api/agent/trash', async (req, res) => {
  const messageIds = parseTrashBody(req.body);
  if (!messageIds) {
    res.status(400).json({ ok: false, error: 'messageIds must be an array of strings' });
    return;
  }

  try {
    await trashMessages('user_1', messageIds);
    res.status(200).json({ ok: true, trashed: messageIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

app.listen(PORT, () => {
  console.log(`[tickys-agent-server] SSE agent runner on http://localhost:${PORT}`);
  console.log(
    `[tickys-agent-server] Google OAuth: ${
      isGoogleConfigured() ? 'configured' : 'NOT configured (set GOOGLE_* in server/.env)'
    }`,
  );
  console.log('[tickys-agent-server] AI key: per-request (BYOK via x-ai-provider-key header)');
});
