import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Stored next to this module (server/tokens.json). Gitignored.
const TOKENS_PATH = fileURLToPath(new URL('./tokens.json', import.meta.url));

/** Persisted OAuth tokens for a single user. */
export interface StoredTokens {
  refreshToken: string;
  scope?: string;
  updatedAt: string; // ISO timestamp
}

/** Token database keyed by user id. */
export type TokenDb = Record<string, StoredTokens>;

function readDb(): TokenDb {
  if (!existsSync(TOKENS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(TOKENS_PATH, 'utf8')) as TokenDb;
  } catch {
    return {};
  }
}

function writeDb(db: TokenDb): void {
  writeFileSync(TOKENS_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
}

/**
 * Persist a user's refresh token.
 * SECURITY: plaintext local-dev storage only. Production must encrypt at rest,
 * scope tokens to a real authenticated user, and never write them to disk in the clear.
 */
export function saveRefreshToken(userId: string, refreshToken: string, scope?: string): void {
  const db = readDb();
  db[userId] = { refreshToken, scope, updatedAt: new Date().toISOString() };
  writeDb(db);
}

/** Read a user's stored refresh token, or null if none. */
export function getRefreshToken(userId: string): string | null {
  return readDb()[userId]?.refreshToken ?? null;
}
