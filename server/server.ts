import { randomUUID } from 'node:crypto';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import {
  buildSteps,
  emailResult,
  snapshot,
  type AgentStreamEvent,
} from './agentStream.ts';
import { authRouter, isGoogleConfigured } from './auth.ts';

const PORT = Number(process.env.PORT) || 3001;
const STEP_INTERVAL_MS = 600;

const app = express();

// The Vite dev server is the only allowed origin for the browser EventSource.
app.use(cors({ origin: 'http://localhost:5173' }));

// Google OAuth routes (/api/auth/google, /api/auth/google/callback).
app.use('/api/auth', authRouter);

app.get('/', (_req, res) => {
  res.type('text/plain').send('Tickys agent server — SSE stream at GET /api/agent/run');
});

/**
 * Server-Sent Events endpoint. Streams a simulated agent run as one JSON
 * object per `data:` frame, then closes the connection.
 */
app.get('/api/agent/run', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const skillName =
    typeof req.query.skill === 'string' && req.query.skill.length > 0
      ? req.query.skill
      : 'email-assistant';

  const send = (event: AgentStreamEvent): void => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const steps = buildSteps(skillName);
  const timers: NodeJS.Timeout[] = [];

  steps.forEach((step, index) => {
    const timer = setTimeout(() => {
      send({
        type: 'log',
        entry: {
          id: randomUUID(),
          timestamp: Date.now(),
          level: step.level,
          type: step.type,
          message: step.message,
        },
      });
      send({ type: 'context', snapshot: snapshot(step.blocks) });

      if (index === steps.length - 1) {
        send({ type: 'result', result: emailResult });
        send({ type: 'done' });
        res.end();
      }
    }, index * STEP_INTERVAL_MS);
    timers.push(timer);
  });

  // Stop the run if the client disconnects early (e.g. component unmount).
  req.on('close', () => {
    timers.forEach(clearTimeout);
  });
});

app.listen(PORT, () => {
  console.log(`[tickys-agent-server] SSE agent runner on http://localhost:${PORT}`);
  console.log(
    `[tickys-agent-server] Google OAuth: ${
      isGoogleConfigured() ? 'configured' : 'NOT configured (set GOOGLE_* in server/.env)'
    }`,
  );
});
