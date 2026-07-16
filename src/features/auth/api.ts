const STATUS_URL = 'http://localhost:3001/api/auth/status';
const DISCONNECT_URL = 'http://localhost:3001/api/auth/disconnect';

interface StatusResponse {
  connected: boolean;
}

interface DisconnectResponse {
  success: boolean;
}

/**
 * Ask the server whether a Google refresh token is stored. Defaults to `false`
 * if the backend is unreachable so the UI degrades gracefully.
 */
export async function fetchGoogleConnectionStatus(): Promise<boolean> {
  try {
    const response = await fetch(STATUS_URL);
    if (!response.ok) return false;
    const data = (await response.json()) as StatusResponse;
    return data.connected === true;
  } catch {
    return false; // backend unreachable
  }
}

/**
 * Erase the stored Google token on the server. Returns `true` on success,
 * `false` if the request fails.
 */
export async function disconnectGoogleAccount(): Promise<boolean> {
  try {
    const response = await fetch(DISCONNECT_URL, { method: 'POST' });
    if (!response.ok) return false;
    const data = (await response.json()) as DisconnectResponse;
    return data.success === true;
  } catch {
    return false;
  }
}
