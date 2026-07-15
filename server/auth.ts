import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { google } from 'googleapis';
import { saveRefreshToken } from './tokenStore.ts';

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const MOCK_USER_ID = 'user_1';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const NOT_CONFIGURED_MSG =
  'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ' +
  'GOOGLE_REDIRECT_URI in server/.env (see server/.env.example).';

/** Frontend origin the callback returns to. Read lazily so dotenv is loaded first. */
function frontendUrl(): string {
  return process.env.FRONTEND_URL ?? 'http://localhost:5173';
}

/** True when all three Google OAuth env vars are present. */
export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

/** Build an OAuth2 client from env, or null if unconfigured (graceful local dev). */
function getOAuthClient(): OAuth2Client | null {
  if (!isGoogleConfigured()) return null;
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

// In-memory CSRF state store: state -> createdAt (ms). Consumed once on callback.
const pendingStates = new Map<string, number>();

function rememberState(state: string): void {
  pendingStates.set(state, Date.now());
}

/** Verify a state value is known and unexpired, consuming it either way. */
function consumeState(state: string): boolean {
  const createdAt = pendingStates.get(state);
  if (createdAt === undefined) return false;
  pendingStates.delete(state);
  return Date.now() - createdAt <= STATE_TTL_MS;
}

export const authRouter = Router();

// Step 1 — start consent: redirect the browser to Google's OAuth screen.
authRouter.get('/google', (_req, res) => {
  const client = getOAuthClient();
  if (!client) {
    res.status(503).type('text/plain').send(NOT_CONFIGURED_MSG);
    return;
  }

  const state = randomUUID();
  rememberState(state);

  const url = client.generateAuthUrl({
    access_type: 'offline', // request a refresh token
    prompt: 'consent', // force a refresh token even on re-consent
    scope: GMAIL_SCOPES,
    state, // CSRF protection, verified on the callback
  });

  res.redirect(url);
});

// Step 2 — consent callback: exchange the code for tokens, store the refresh token.
authRouter.get('/google/callback', async (req, res) => {
  // User denied consent or Google returned an error.
  if (typeof req.query.error === 'string') {
    res.redirect(`${frontendUrl()}?auth=error`);
    return;
  }

  const client = getOAuthClient();
  if (!client) {
    res.status(503).type('text/plain').send(NOT_CONFIGURED_MSG);
    return;
  }

  const code = req.query.code;
  const state = req.query.state;
  if (typeof code !== 'string' || typeof state !== 'string' || !consumeState(state)) {
    res.redirect(`${frontendUrl()}?auth=error`);
    return;
  }

  try {
    const { tokens } = await client.getToken(code);
    if (tokens.refresh_token) {
      saveRefreshToken(MOCK_USER_ID, tokens.refresh_token, tokens.scope ?? undefined);
    } else {
      // Happens if the account already granted access without prompt=consent.
      console.warn('[auth] no refresh_token returned — re-consent to obtain one');
    }
    res.redirect(`${frontendUrl()}?auth=success`);
  } catch (err) {
    console.error('[auth] token exchange failed:', err);
    res.redirect(`${frontendUrl()}?auth=error`);
  }
});
