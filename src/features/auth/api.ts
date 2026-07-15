/** Backend endpoint reporting whether a Google account is connected. */
const STATUS_URL = 'http://localhost:3001/api/auth/status';

interface StatusResponse {
  connected: boolean;
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
