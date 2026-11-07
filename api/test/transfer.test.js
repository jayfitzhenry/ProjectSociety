import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call } from './helpers.js';
import { exportAll, importAll } from '../src/handlers/transfer.js';
import { createCharacter } from '../src/handlers/characters.js';

beforeEach(() => { useFake(); });

test('import adds characters to the caller only, with fresh ids', async () => {
  const res = await call(importAll, { user: 'alice', method: 'POST', body: { characters: [{ id: 'old1', name: 'Rook', ownerId: 'bob' }, { id: 'old2', name: 'Wren' }] } });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body.characters.map((c) => c.ownerId), ['alice', 'alice']);
  assert.ok(res.body.characters.every((c) => !c.id.startsWith('old')));
});

test('export contains only the caller\'s data', async () => {
  await call(createCharacter, { user: 'alice', method: 'POST', body: { name: 'Rook' } });
  await call(createCharacter, { user: 'bob', method: 'POST', body: { name: 'Wren' } });
  const res = await call(exportAll, { user: 'alice' });
  assert.equal(res.body.version, 2);
  assert.deepEqual(res.body.characters.map((c) => c.name), ['Rook']);
});

test('an invalid import writes nothing', async () => {
  const res = await call(importAll, { user: 'alice', method: 'POST', body: { characters: [{ name: 'ok' }, 'not an object'] } });
  assert.equal(res.status, 400);
  assert.equal((await call(exportAll, { user: 'alice' })).body.characters.length, 0);
});
