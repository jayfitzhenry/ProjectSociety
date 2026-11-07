// HTTP plumbing shared by every handler: errors, JSON bodies, the sign-in check.
import { principalFrom } from './auth.js';

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg) => new HttpError(400, msg, 'bad_request');
export const forbidden = (msg = "You don't have access to that.") => new HttpError(403, msg, 'forbidden');
export const notFound = (msg = 'Not found.') => new HttpError(404, msg, 'not_found');
export const conflict = () => new HttpError(412, 'Someone else changed this. Reload to see their changes.', 'conflict');

export const json = (status, body, headers) => ({ status, jsonBody: body, ...(headers ? { headers } : {}) });
export const ok = (body) => json(200, body);
export const created = (body) => json(201, body);

const MAX_BODY = 1_000_000;

/** Parse a JSON body, refusing anything oversized or malformed. */
export async function readJson(request, max = MAX_BODY) {
  const text = await request.text();
  if (text.length > max) throw new HttpError(413, 'That is too big to save.', 'too_big');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw badRequest('The request body is not valid JSON.');
  }
}

/** The ETag the browser last saw. Required for any write that could clobber someone else's change. */
export function requireIfMatch(request) {
  const etag = request.headers.get('if-match');
  if (!etag) throw new HttpError(428, 'Missing If-Match header.', 'precondition_required');
  return etag;
}

/** Remove Cosmos bookkeeping before a doc goes to the browser. `_etag` stays: the browser sends it back. */
export function clean(doc) {
  if (!doc) return doc;
  const { _rid, _self, _attachments, _ts, ...rest } = doc;
  return rest;
}

export const now = () => new Date().toISOString();

/**
 * Wrap a handler: resolve the signed-in user from the platform header (never from the body),
 * and turn thrown HttpErrors into JSON responses.
 */
export function route(fn) {
  return async (request, context) => {
    try {
      const user = principalFrom(request);
      if (!user) throw new HttpError(401, 'Please sign in.', 'signin');
      const res = await fn({ request, context, user, params: request.params || {}, query: request.query || new URLSearchParams() });
      return res ?? { status: 204 };
    } catch (e) {
      if (e instanceof HttpError) return json(e.status, { error: e.message, code: e.code });
      context?.error?.(e);
      return json(500, { error: 'Something went wrong on the server. Try again in a moment.', code: 'server' });
    }
  };
}

/** One Functions route, several methods. */
export function methods(map) {
  return async (request, context) => {
    const fn = map[request.method];
    if (!fn) return json(405, { error: 'Method not allowed.', code: 'method' });
    return fn(request, context);
  };
}
