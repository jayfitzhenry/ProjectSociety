import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call } from './helpers.js';
import { listNotes, createNote, putNote, deleteNote } from '../src/handlers/notes.js';

beforeEach(() => { useFake(); });

const make = async (user, body) => (await call(createNote, { user, method: 'POST', body })).body;

test('notes are listed for their owner only, filtered by campaign', async () => {
  await make('alice', { title: 'Plan', body: 'x', campaignId: 'c1' });
  await make('alice', { title: 'Loose', body: 'y' });
  await make('bob', { title: 'Bob', body: 'z', campaignId: 'c1' });
  assert.deepEqual((await call(listNotes, { user: 'alice', query: { campaignId: 'c1' } })).body.map((n) => n.title), ['Plan']);
  assert.equal((await call(listNotes, { user: 'alice' })).body.length, 2);
  assert.deepEqual((await call(listNotes, { user: 'bob' })).body.map((n) => n.title), ['Bob']);
});

test('owner can edit and delete a note; others cannot', async () => {
  const n = await make('alice', { title: 'Plan', body: 'x' });
  assert.equal((await call(putNote, { user: 'bob', method: 'PUT', params: { id: n.id }, headers: { 'if-match': n._etag }, body: { title: 'pwned' } })).status, 404);
  assert.equal((await call(deleteNote, { user: 'bob', method: 'DELETE', params: { id: n.id } })).status, 404);
  const ed = await call(putNote, { user: 'alice', method: 'PUT', params: { id: n.id }, headers: { 'if-match': n._etag }, body: { title: 'Plan B', body: 'y' } });
  assert.equal(ed.status, 200);
  assert.equal(ed.body.title, 'Plan B');
  assert.equal(ed.body.ownerId, 'alice');
  assert.equal((await call(deleteNote, { user: 'alice', method: 'DELETE', params: { id: n.id } })).status, 204);
});

test('a note body over the limit is refused', async () => {
  const res = await call(createNote, { user: 'alice', method: 'POST', body: { title: 't', body: 'x'.repeat(100_001) } });
  assert.equal(res.status, 413);
});
