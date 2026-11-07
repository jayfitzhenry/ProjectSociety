import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call } from './helpers.js';
import { listCharacters, createCharacter, getCharacter, putCharacter, deleteCharacter } from '../src/handlers/characters.js';

let db;
beforeEach(() => { db = useFake(); });

const make = async (user, body = { name: 'Rook', chips: 30 }) => (await call(createCharacter, { user, method: 'POST', body })).body;

test('create: owner and ids come from the server, not the body', async () => {
  const res = await call(createCharacter, { user: 'alice', method: 'POST', body: { name: 'Rook', ownerId: 'bob', id: 'x', campaignId: 'c1', _etag: 'z' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.ownerId, 'alice');
  assert.notEqual(res.body.id, 'x');
  assert.equal(res.body.campaignId, null);
  assert.ok(res.body._etag);
});

test('list returns only your own characters', async () => {
  await make('alice');
  await make('bob', { name: 'Wren' });
  const res = await call(listCharacters, { user: 'alice' });
  assert.deepEqual(res.body.map((c) => c.name), ['Rook']);
});

test('owner can read; another user cannot', async () => {
  const c = await make('alice');
  assert.equal((await call(getCharacter, { user: 'alice', params: { id: c.id } })).status, 200);
  assert.equal((await call(getCharacter, { user: 'bob', params: { id: c.id } })).status, 404);
});

test('owner can update with the current ETag; another user cannot', async () => {
  const c = await make('alice');
  const mine = await call(putCharacter, { user: 'alice', method: 'PUT', params: { id: c.id }, headers: { 'if-match': c._etag }, body: { ...c, chips: 5 } });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.chips, 5);
  const theirs = await call(putCharacter, { user: 'bob', method: 'PUT', params: { id: c.id }, headers: { 'if-match': mine.body._etag }, body: { ...c, chips: 999 } });
  assert.equal(theirs.status, 404);
  assert.equal((await db.read('characters', 'alice', c.id)).chips, 5);
});

test('update with a stale ETag is a 412 conflict; no ETag is refused', async () => {
  const c = await make('alice');
  await call(putCharacter, { user: 'alice', method: 'PUT', params: { id: c.id }, headers: { 'if-match': c._etag }, body: { ...c, chips: 1 } });
  const stale = await call(putCharacter, { user: 'alice', method: 'PUT', params: { id: c.id }, headers: { 'if-match': c._etag }, body: { ...c, chips: 2 } });
  assert.equal(stale.status, 412);
  assert.equal(stale.body.code, 'conflict');
  const none = await call(putCharacter, { user: 'alice', method: 'PUT', params: { id: c.id }, body: { ...c } });
  assert.equal(none.status, 428);
});

test('update cannot move a character into a campaign or to another owner', async () => {
  const c = await make('alice');
  const res = await call(putCharacter, { user: 'alice', method: 'PUT', params: { id: c.id }, headers: { 'if-match': c._etag }, body: { ...c, campaignId: 'c9', ownerId: 'bob' } });
  assert.equal(res.body.campaignId, null);
  assert.equal(res.body.ownerId, 'alice');
});

test('oversized characters are refused', async () => {
  const res = await call(createCharacter, { user: 'alice', method: 'POST', body: { name: 'x'.repeat(70_000) } });
  assert.equal(res.status, 413);
});

test('owner can delete; another user cannot', async () => {
  const c = await make('alice');
  assert.equal((await call(deleteCharacter, { user: 'bob', method: 'DELETE', params: { id: c.id } })).status, 404);
  assert.ok(await db.read('characters', 'alice', c.id));
  assert.equal((await call(deleteCharacter, { user: 'alice', method: 'DELETE', params: { id: c.id } })).status, 204);
  assert.equal(await db.read('characters', 'alice', c.id), null);
});
