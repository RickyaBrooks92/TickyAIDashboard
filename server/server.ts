import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { runEmailAgent } from './agentRunner.ts';
import type { AgentStreamEvent } from './agentStream.ts';
import { isGeminiConfigured } from './ai.ts';
import { authRouter, isGoogleConfigured } from './auth.ts';

const PORT = Number(process.env.PORT) || 3001;

const app = express();

// The Vite dev server is the only allowed origin for the browser EventSource.
app.use(cors({ origin: 'http://localhost:5173' }));

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
