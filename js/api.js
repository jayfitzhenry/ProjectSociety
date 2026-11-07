// Talks to the API in api/. Same origin, so the Static Web Apps sign-in cookie goes with every call.
// The server does every permission check; nothing here is trusted.

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Call /api/<path>. `etag` becomes If-Match, so a write fails with 412 if someone else saved first.
 * Throws ApiError with a message that's fine to show the player.
 */
export async function api(path, { method = 'GET', body, etag, keepalive } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (etag) headers['If-Match'] = etag;
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method, headers, credentials: 'same-origin', keepalive,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'No connection. Check your signal and try again.', 'offline');
  }
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('ps:signedout'));
    throw new ApiError(401, 'Your sign-in has expired. Sign in again.', 'signin');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const fallback = res.status === 412
      ? 'Someone else changed this. Reload to see their changes.'
      : `The server couldn't do that (${res.status}).`;
    throw new ApiError(res.status, data?.error || fallback, data?.code);
  }
  return data;
}
