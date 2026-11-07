import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call } from './helpers.js';
import { createCampaign, getCampaign, joinCampaign, removeMember } from '../src/handlers/campaigns.js';
import {
  listStories, createStory, putStory, deleteStory, listSnippets, createSnippet, patchSnippet, deleteSnippet, poll, markRead,
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

const share = (body, user = 'alice') => call(createSnippet, { user, method: 'POST', params: { cid }, body });
const feed = async (user) => (await call(listSnippets, { user, params: { cid } }));

test('stories: the DM can create, list, edit and delete', async () => {
  const s = (await call(createStory, { user: 'alice', method: 'POST', params: { cid }, body: { title: 'Session 1', body: 'The pump house…' } })).body;
  assert.equal(s.status, 'draft');
  assert.equal((await call(listStories, { user: 'alice', params: { cid } })).body.length, 1);
  const ed = await call(putStory, { user: 'alice', method: 'PUT', params: { cid, sid: s.id }, headers: { 'if-match': s._etag }, body: { title: 'Session 1', body: 'v2', status: 'archived' } });
  assert.equal(ed.body.status, 'archived');
  assert.equal((await call(deleteStory, { user: 'alice', method: 'DELETE', params: { cid, sid: s.id } })).status, 204);
});

test('stories: players and outsiders are refused, for reading and writing', async () => {
  const s = (await call(createStory, { user: 'alice', method: 'POST', params: { cid }, body: { title: 'Secret', body: 'twist' } })).body;
  assert.equal((await call(listStories, { user: 'bob', params: { cid } })).status, 403);
  assert.equal((await call(listStories, { user: 'erin', params: { cid } })).status, 403);
  assert.equal((await call(createStory, { user: 'bob', method: 'POST', params: { cid }, body: { title: 'x' } })).status, 403);
  assert.equal((await call(putStory, { user: 'bob', method: 'PUT', params: { cid, sid: s.id }, headers: { 'if-match': s._etag }, body: { title: 'x' } })).status, 403);
  assert.equal((await call(deleteStory, { user: 'bob', method: 'DELETE', params: { cid, sid: s.id } })).status, 403);
});

test('stories: a stale ETag is a 412 conflict', async () => {
  const s = (await call(createStory, { user: 'alice', method: 'POST', params: { cid }, body: { title: 'A' } })).body;
  await call(putStory, { user: 'alice', method: 'PUT', params: { cid, sid: s.id }, headers: { 'if-match': s._etag }, body: { title: 'B' } });
  assert.equal((await call(putStory, { user: 'alice', method: 'PUT', params: { cid, sid: s.id }, headers: { 'if-match': s._etag }, body: { title: 'C' } })).status, 412);
});

test('snippets: only the DM can share', async () => {
  assert.equal((await share({ body: 'hi', audience: 'all' })).status, 201);
  assert.equal((await share({ body: 'hi', audience: 'all' }, 'bob')).status, 403);
  assert.equal((await share({ body: 'hi', audience: 'all' }, 'erin')).status, 403);
});

test('snippets: players receive only what is shared with all or with them', async () => {
  await share({ title: 'Everyone', body: 'a', audience: 'all' });
  await share({ title: 'Bob only', body: 'b', audience: ['bob'] });
  await share({ title: 'Carol only', body: 'c', audience: ['carol'] });
  const bob = (await feed('bob')).body.snippets;
  assert.deepEqual(bob.map((s) => s.title).sort(), ['Bob only', 'Everyone']);
  assert.ok(bob.every((s) => s.audience === undefined), 'players never see the audience list');
  assert.deepEqual(bob.map((s) => s.shared).sort(), ['all', 'you']);
  assert.equal((await feed('alice')).body.snippets.length, 3);
});

test('snippets: outsiders and removed members get nothing', async () => {
  await share({ body: 'a', audience: 'all' });
  assert.equal((await feed('erin')).status, 403);
  await call(removeMember, { user: 'alice', method: 'DELETE', params: { cid, userId: 'bob' } });
  assert.equal((await feed('bob')).status, 403);
  assert.equal((await call(poll, { user: 'bob', params: { cid } })).status, 403);
});

test('snippets: the audience must be campaign members', async () => {
  assert.equal((await share({ body: 'x', audience: ['erin'] })).status, 400);
  assert.equal((await share({ body: 'x', audience: [] })).status, 400);
});

test('snippets: editing and unsharing are DM only; widening the audience re-shares', async () => {
  const s = (await share({ body: 'x', audience: ['carol'] })).body;
  assert.equal((await call(patchSnippet, { user: 'bob', method: 'PATCH', params: { cid, id: s.id }, body: { audience: 'all' } })).status, 403);
  await new Promise((r) => setTimeout(r, 5));
  const ed = await call(patchSnippet, { user: 'alice', method: 'PATCH', params: { cid, id: s.id }, body: { audience: ['carol', 'bob'] } });
  assert.equal(ed.status, 200);
  assert.ok(ed.body.sharedAt > s.sharedAt);
  assert.equal((await feed('bob')).body.snippets.length, 1);
  assert.equal((await call(deleteSnippet, { user: 'bob', method: 'DELETE', params: { cid, id: s.id } })).status, 403);
  assert.equal((await call(deleteSnippet, { user: 'alice', method: 'DELETE', params: { cid, id: s.id } })).status, 204);
  assert.equal((await feed('bob')).body.snippets.length, 0);
});

test('poll: returns only new snippets the caller may see, plus the crew ETag', async () => {
  const first = (await call(poll, { user: 'bob', params: { cid } })).body;
  assert.ok(first.crewEtag);
  await new Promise((r) => setTimeout(r, 5));
  await share({ title: 'new for all', body: 'a', audience: 'all' });
  await share({ title: 'carol', body: 'b', audience: ['carol'] });
  const next = (await call(poll, { user: 'bob', params: { cid }, query: { since: first.now } })).body;
  assert.deepEqual(next.snippets.map((s) => s.title), ['new for all']);
});

test('read marker: members can set their own', async () => {
  assert.equal((await call(markRead, { user: 'bob', method: 'POST', params: { cid } })).status, 200);
  assert.ok((await feed('bob')).body.lastReadAt > '2000');
  assert.equal((await call(markRead, { user: 'erin', method: 'POST', params: { cid } })).status, 403);
});
