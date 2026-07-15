import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { runEmailAgent } from './agentRunner.ts';
import type { AgentStreamEvent } from './agentStream.ts';
import { isGeminiConfigured } from './ai.ts';
import { authRouter, isGoogleConfigured } from './auth.ts';
import { trashMessages } from './gmail.ts';

const PORT = Number(process.env.PORT) || 3001;

const app = express();

// The Vite dev server is the only allowed origin for the browser EventSource/fetch.
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Google OAuth routes (/api/auth/google, /api/auth/google/callback).
app.use('/api/auth', authRouter);

app.get('/', (_req, res) => {
  res.type('text/plain').send('Tickys agent server — SSE stream at GET /api/agent/run');
});

/**
 * Server-Sent Events endpoint. Runs the real email agent (Gmail → Gemini) and
 * streams each frame as `data: {json}\n\n`, then closes the connection.
 */
app.get('/api/agent/run', async (req, res) => {
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

  await runEmailAgent(send, 'user_1');

  if (!res.writableEnded) res.end();
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
  console.log(
    `[tickys-agent-server] Gemini: ${
      isGeminiConfigured() ? 'configured' : 'NOT configured (set GEMINI_API_KEY in server/.env)'
    }`,
  );
});
