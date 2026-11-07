import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call, req } from './helpers.js';
import { getMe, patchMe } from '../src/handlers/me.js';

let db;
beforeEach(() => { db = useFake(); });

test('anonymous callers are refused', async () => {
  const res = await call(getMe, {});
  assert.equal(res.status, 401);
});

test('a forged or malformed principal header is refused', async () => {
  const res = await getMe(req({ headers: { 'x-ms-client-principal': 'not-base64-json' } }), {});
  assert.equal(res.status, 401);
  const noRole = Buffer.from(JSON.stringify({ userId: 'abc', userRoles: ['anonymous'] })).toString('base64');
  assert.equal((await getMe(req({ headers: { 'x-ms-client-principal': noRole } }), {})).status, 401);
});

test('first sign-in creates the user, without exposing an email as the display name', async () => {
  const res = await call(getMe, { user: 'u1', provider: 'aad', details: 'sam@example.com' });
  assert.equal(res.status, 200);
  assert.equal(res.body.id, 'u1');
  assert.equal(res.body.displayName, 'sam');
  assert.equal(res.body.nameConfirmed, false);
  assert.ok(await db.read('users', 'u1', 'u1'));
  // Second call returns the same doc.
  assert.equal((await call(getMe, { user: 'u1' })).body.displayName, 'sam');
});

test('a user can rename themselves; the name is confirmed', async () => {
  const res = await call(patchMe, { user: 'u1', method: 'PATCH', body: { displayName: '  Ash  ' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.displayName, 'Ash');
  assert.equal(res.body.nameConfirmed, true);
});

test('an empty display name is refused', async () => {
  const res = await call(patchMe, { user: 'u1', method: 'PATCH', body: { displayName: '   ' } });
  assert.equal(res.status, 400);
});

test('the user id always comes from the principal, never the body', async () => {
  await call(patchMe, { user: 'u1', method: 'PATCH', body: { id: 'u2', displayName: 'Mallory' } });
  assert.equal(await db.read('users', 'u2', 'u2'), null);
  assert.equal((await db.read('users', 'u1', 'u1')).displayName, 'Mallory');
});
