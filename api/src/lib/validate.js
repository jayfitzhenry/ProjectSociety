// Input checks shared by handlers. The browser's copy of a doc is never trusted for ownership fields.
import { randomUUID } from 'node:crypto';
import { badRequest, HttpError } from './http.js';

export const newId = () => randomUUID();

const ID = /^[A-Za-z0-9_:-]{1,100}$/;
export function checkId(id, what = 'id') {
  if (typeof id !== 'string' || !ID.test(id)) throw badRequest(`Invalid ${what}.`);
  return id;
}

export function optionalId(v, what) {
  if (v === undefined || v === null || v === '') return null;
  return checkId(v, what);
}

export function text(v, { max, what, required = false }) {
  const s = v === undefined || v === null ? '' : String(v);
  if (required && !s.trim()) throw badRequest(`${what} is required.`);
  if (s.length > max) throw new HttpError(413, `${what} is too long (max ${max} characters).`, 'too_big');
  return s;
}

/** Fields the server owns on any doc; whatever the browser sends for these is dropped. */
const SERVER_FIELDS = new Set(['id', 'ownerId', 'campaignId', 'createdAt', 'updatedAt', 'type', 'userId', 'role']);

/** A plain object with server-owned and Cosmos fields removed, refused if too big. */
export function payload(body, maxBytes, what = 'This') {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Expected an object.');
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith('_') || SERVER_FIELDS.has(k)) continue;
    out[k] = v;
  }
  if (JSON.stringify(out).length > maxBytes) throw new HttpError(413, `${what} is too big to save.`, 'too_big');
  return out;
}

export const MAX_CHARACTER = 64_000;
export const MAX_NOTE_BODY = 100_000;
export const MAX_TITLE = 200;
