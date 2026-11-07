import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call } from './helpers.js';
import { createCampaign, getCampaign, joinCampaign, removeMember } from '../src/handlers/campaigns.js';
import {
  listStories, createStory, putStory, deleteStory, poll, markRead,
} from '../src/handlers/stories.js';

let cid;

/** alice is DM; bob and carol are players; erin is an outsider. */
beforeEach(async () => {
  useFake();
  cid = (await call(createCampaign, { user: 'alice', method: 'POST', body: { name: 'Ward 9' } })).body.id;
  const code = (await call(getCampaign, { user: 'alice', params: { cid } })).body.campaign.joinCode;
  await call(joinCampaign, { user: 'bob', method: 'POST', body: { code } });
  await call(joinCampaign, { user: 'carol', method: 'POST', body: { code } });
});

const make = (body, user = 'alice') => call(createStory, { user, method: 'POST', params: { cid }, body });
const list = (user) => call(listStories, { user, params: { cid } });
const put = (s, body, user = 'alice') => call(putStory, { user, method: 'PUT', params: { cid, sid: s.id }, headers: { 'if-match': s._etag }, body });
const tick = () => new Promise((r) => setTimeout(r, 5));

const mixed = {
  title: 'The pump house',
  shared: true,
  sections: [
    { id: 'a', title: 'Read aloud', body: 'Steam everywhere.', audience: 'players' },
    { id: 'b', title: 'Twist', body: 'The foreman is Antioch.', audience: 'dm' },
  ],
};

test('segments: the DM can create, list, edit and delete', async () => {
  const s = (await make({ title: 'Session 1', sections: [{ title: 'Notes', body: 'x', audience: 'dm' }] })).body;
  assert.equal(s.status, 'draft');
  assert.equal(s.shared, false);
  assert.equal(s.sections[0].audience, 'dm');
  assert.equal((await list('alice')).body.length, 1);
  const ed = await put(s, { title: 'Session 1', sections: s.sections, status: 'archived' });
  assert.equal(ed.body.status, 'archived');
  assert.equal((await call(deleteStory, { user: 'alice', method: 'DELETE', params: { cid, sid: s.id } })).status, 204);
});

test('segments: players can never write; outsiders can never read', async () => {
  const s = (await make(mixed)).body;
  assert.equal((await make({ title: 'x' }, 'bob')).status, 403);
  assert.equal((await put(s, { title: 'x' }, 'bob')).status, 403);
  assert.equal((await call(deleteStory, { user: 'bob', method: 'DELETE', params: { cid, sid: s.id } })).status, 403);
  assert.equal((await list('erin')).status, 403);
  await call(removeMember, { user: 'alice', method: 'DELETE', params: { cid, userId: 'bob' } });
  assert.equal((await list('bob')).status, 403);
});

test('segments: players see shared segments, and only their player sections', async () => {
  await make(mixed);
  const bob = (await list('bob')).body;
  assert.equal(bob.length, 1);
  assert.deepEqual(bob[0].sections, [{ id: 'a', title: 'Read aloud', body: 'Steam everywhere.' }]);
  assert.ok(!JSON.stringify(bob).includes('Antioch'), 'DM-only text never reaches a player');
  assert.equal(bob[0].shared, undefined);
  assert.equal((await list('alice')).body[0].sections.length, 2);
});

test('segments: unshared, archived or DM-only segments are hidden from players', async () => {
  await make({ ...mixed, shared: false });
  await make({ ...mixed, status: 'archived' });
  await make({ title: 'All secret', shared: true, sections: [{ body: 'twist', audience: 'dm' }] });
  assert.equal((await list('bob')).body.length, 0);
  assert.equal((await list('alice')).body.length, 3);
});

test('segments: sharing and player-visible edits move the material marker; DM-only edits do not', async () => {
  const s = (await make({ ...mixed, shared: false })).body;
  const p0 = (await call(poll, { user: 'bob', params: { cid } })).body;
  assert.equal(p0.materialAt, null);
  await tick();
  const shared = (await put(s, { ...mixed, shared: true })).body;
  const p1 = (await call(poll, { user: 'bob', params: { cid } })).body;
  assert.ok(p1.materialAt);
  assert.equal(shared.playersAt, p1.materialAt);
  assert.equal((await list('bob')).body[0].playersAt, p1.materialAt);
  await tick();
  const dmEdit = (await put(shared, { ...mixed, sections: [mixed.sections[0], { ...mixed.sections[1], body: 'changed' }] })).body;
  assert.equal((await call(poll, { user: 'bob', params: { cid } })).body.materialAt, p1.materialAt);
  await tick();
  await put(dmEdit, { ...mixed, sections: [{ ...mixed.sections[0], body: 'More steam.' }, mixed.sections[1]] });
  assert.ok((await call(poll, { user: 'bob', params: { cid } })).body.materialAt > p1.materialAt);
});

test('segments: a stale ETag is a 412 conflict', async () => {
  const s = (await make({ title: 'A' })).body;
  await put(s, { title: 'B' });
  assert.equal((await put(s, { title: 'C' })).status, 412);
});

test('segments: old single-body stories read as one DM-only section', async () => {
  const s = (await make({ title: 'Old', body: 'twist' })).body;
  assert.deepEqual(s.sections, [{ id: 's1', title: '', body: 'twist', audience: 'dm' }]);
  assert.equal((await list('bob')).body.length, 0);
});

test('segments: bad sections are refused', async () => {
  assert.equal((await make({ title: 'x', sections: 'nope' })).status, 400);
  assert.equal((await make({ title: 'x', sections: Array.from({ length: 101 }, () => ({ body: '' })) })).status, 400);
  assert.equal((await make({ title: 'x', sections: [{ body: 'x'.repeat(200_001) }] })).status, 413);
});

test('poll: members get the crew ETag; outsiders are refused', async () => {
  assert.ok((await call(poll, { user: 'bob', params: { cid } })).body.crewEtag);
  assert.equal((await call(poll, { user: 'erin', params: { cid } })).status, 403);
});

test('read marker: members can set their own', async () => {
  assert.equal((await call(markRead, { user: 'bob', method: 'POST', params: { cid } })).status, 200);
  assert.ok((await call(poll, { user: 'bob', params: { cid } })).body.lastReadAt > '2000');
  assert.equal((await call(markRead, { user: 'erin', method: 'POST', params: { cid } })).status, 403);
});

const secret = {
  title: 'Letters',
  shared: true,
  sections: [
    { id: 'a', title: 'For all', body: 'A storm is coming.', audience: 'players' },
    { id: 'c', title: 'For Carol', body: 'Your sister is alive.', audience: 'some', to: ['carol'] },
  ],
};

test('chosen players: a chosen player sees their section, marked as just for them', async () => {
  await make(secret);
  const carol = (await list('carol')).body[0];
  assert.deepEqual(carol.sections.map((x) => x.id), ['a', 'c']);
  assert.equal(carol.sections[1].forYou, true);
  assert.ok(!JSON.stringify(carol).includes('"to"'), 'a player never sees who else a section went to');
  assert.equal(carol.sections[0].forYou, undefined);
});

test('chosen players: everyone else is refused the section, and the DM sees who it went to', async () => {
  await make(secret);
  const bob = (await list('bob')).body;
  assert.deepEqual(bob[0].sections.map((x) => x.id), ['a']);
  assert.ok(!JSON.stringify(bob).includes('sister'), 'a section for Carol never reaches Bob');
  await make({ title: 'Only Carol', shared: true, sections: [secret.sections[1]] });
  assert.equal((await list('bob')).body.length, 1, 'a segment with nothing for Bob is hidden from him');
  assert.equal((await list('carol')).body.length, 2);
  const letters = (await list('alice')).body.find((x) => x.title === 'Letters');
  assert.deepEqual(letters.sections[1].to, ['carol']);
});

test('chosen players: a secret for one player is not new for anyone else', async () => {
  const s = (await make({ ...secret, sections: [secret.sections[0]] })).body;
  const bob0 = (await call(poll, { user: 'bob', params: { cid } })).body.materialAt;
  const carol0 = (await call(poll, { user: 'carol', params: { cid } })).body.materialAt;
  const bobAt = (await list('bob')).body[0].playersAt;
  await tick();
  await put(s, secret);
  assert.equal((await call(poll, { user: 'bob', params: { cid } })).body.materialAt, bob0);
  assert.equal((await list('bob')).body[0].playersAt, bobAt);
  assert.ok((await call(poll, { user: 'carol', params: { cid } })).body.materialAt > carol0);
  assert.ok((await list('carol')).body[0].playersAt > bobAt);
});

test('chosen players: bad lists are refused', async () => {
  const bad = (to) => make({ title: 'x', sections: [{ body: 'x', audience: 'some', to }] });
  assert.equal((await bad('carol')).status, 400);
  assert.equal((await bad(['../x'])).status, 400);
  assert.equal((await bad(Array.from({ length: 51 }, (_, i) => `u${i}`))).status, 400);
  assert.deepEqual((await bad(['carol', 'carol'])).body.sections[0].to, ['carol']);
});
