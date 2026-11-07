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

test('import of an old save: the crew becomes a new campaign the importer runs, with the characters attached', async () => {
  const { getCampaign } = await import('../src/handlers/campaigns.js');
  const res = await call(importAll, { user: 'alice', method: 'POST', body: {
    characters: [{ name: 'Rook' }], campaigns: [{ name: 'Ward 9', crew: { pot: 40 }, attachCharacters: true }],
  } });
  assert.equal(res.status, 201);
  const cid = res.body.campaigns[0].id;
  const c = (await call(getCampaign, { user: 'alice', params: { cid } })).body;
  assert.equal(c.me.role, 'dm');
  assert.equal(c.crew.pot, 40);
  assert.deepEqual(c.roster.map((x) => x.name), ['Rook']);
});

test('export includes the crew and stories of campaigns you run, not ones you play in', async () => {
  const { createCampaign } = await import('../src/handlers/campaigns.js');
  await call(createCampaign, { user: 'alice', method: 'POST', body: { name: 'Mine', crew: { pot: 3 } } });
  await call(createCampaign, { user: 'bob', method: 'POST', body: { name: 'Theirs' } });
  const res = await call(exportAll, { user: 'alice' });
  assert.deepEqual(res.body.campaigns.map((c) => [c.name, c.crew.pot]), [['Mine', 3]]);
});

test('import: segments come back unshared, and old single-body stories become DM-only sections', async () => {
  const { listStories } = await import('../src/handlers/stories.js');
  const res = await call(importAll, { user: 'alice', method: 'POST', body: { campaigns: [{ name: 'Old', stories: [
    { title: 'Body', body: 'twist' },
    { title: 'Sections', shared: true, sections: [{ title: 'Hi', body: 'hello', audience: 'players' }] },
  ] }] } });
  assert.equal(res.status, 201);
  const cid = res.body.campaigns[0].id;
  const segs = (await call(listStories, { user: 'alice', params: { cid } })).body;
  assert.deepEqual(segs.map((s) => [s.title, s.shared, s.sections[0].audience]).sort(), [['Body', false, 'dm'], ['Sections', false, 'players']]);
});

test('import: sections for chosen players come back DM only', async () => {
  const { listStories } = await import('../src/handlers/stories.js');
  const res = await call(importAll, { user: 'alice', method: 'POST', body: { campaigns: [{ name: 'Old', stories: [
    { title: 'Secret', shared: true, sections: [{ title: 'For Carol', body: 'x', audience: 'some', to: ['carol'] }] },
  ] }] } });
  const segs = (await call(listStories, { user: 'alice', params: { cid: res.body.campaigns[0].id } })).body;
  assert.deepEqual(segs[0].sections[0], { id: 's1', title: 'For Carol', body: 'x', audience: 'dm' });
});
