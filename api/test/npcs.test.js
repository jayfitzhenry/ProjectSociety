import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call } from './helpers.js';
import { createCampaign, getCampaign, joinCampaign, removeMember, deleteCampaign } from '../src/handlers/campaigns.js';
import { listNpcs, createNpc, putNpc, deleteNpc } from '../src/handlers/npcs.js';
import { exportAll, importAll } from '../src/handlers/transfer.js';
import { repo } from '../src/lib/repo.js';

let cid;

/** alice is DM; bob is a player; erin is an outsider. */
beforeEach(async () => {
  useFake();
  cid = (await call(createCampaign, { user: 'alice', method: 'POST', body: { name: 'Ward 9' } })).body.id;
  const code = (await call(getCampaign, { user: 'alice', params: { cid } })).body.campaign.joinCode;
  await call(joinCampaign, { user: 'bob', method: 'POST', body: { code } });
});

const make = (body, user = 'alice') => call(createNpc, { user, method: 'POST', params: { cid }, body });
const list = (user) => call(listNpcs, { user, params: { cid } });
const put = (n, body, user = 'alice') => call(putNpc, { user, method: 'PUT', params: { cid, nid: n.id }, headers: { 'if-match': n._etag }, body });
const del = (n, user = 'alice') => call(deleteNpc, { user, method: 'DELETE', params: { cid, nid: n.id } });

const foreman = {
  name: 'Ada Marsh', role: 'Foreman at the pump house', about: 'Soot to the elbows. Never smiles.',
  secrets: 'Reports to Antioch every Sunday.', wounds: 3, toHit: 1, weapon: 'Heavy blade +2', armour: 1, notes: 'Raises the alarm',
};

test('npcs: the DM can create, list, edit and delete', async () => {
  const n = (await make(foreman)).body;
  assert.equal(n.name, 'Ada Marsh');
  assert.equal(n.wounds, 3);
  assert.equal(n.hurt, 0);
  assert.equal(n.status, 'active');
  assert.equal(n.known, false);
  assert.equal((await list('alice')).body.length, 1);
  const ed = (await put(n, { ...foreman, hurt: 2, status: 'dead' })).body;
  assert.equal(ed.hurt, 2);
  assert.equal(ed.status, 'dead');
  assert.equal((await del(ed)).status, 204);
  assert.equal((await list('alice')).body.length, 0);
});

test('npcs: players can never write; outsiders can never read', async () => {
  const n = (await make(foreman)).body;
  assert.equal((await make(foreman, 'bob')).status, 403);
  assert.equal((await put(n, foreman, 'bob')).status, 403);
  assert.equal((await del(n, 'bob')).status, 403);
  assert.equal((await list('erin')).status, 403);
  assert.equal((await make(foreman, 'erin')).status, 403);
  await call(removeMember, { user: 'alice', method: 'DELETE', params: { cid, userId: 'bob' } });
  assert.equal((await list('bob')).status, 403);
});

test('npcs: players see known NPCs only, without stats or secrets', async () => {
  await make(foreman);
  await make({ ...foreman, name: 'Tobin', known: true });
  const bob = (await list('bob')).body;
  assert.equal(bob.length, 1);
  assert.deepEqual(Object.keys(bob[0]).sort(), ['about', 'id', 'name', 'role', 'status']);
  assert.equal(bob[0].name, 'Tobin');
  const raw = JSON.stringify(bob);
  assert.ok(!raw.includes('Antioch') && !raw.includes('Heavy blade'), 'stats and secrets never reach a player');
});

test('npcs: stats are kept in range', async () => {
  const n = (await make({ name: 'x', wounds: 99, hurt: 50, toHit: 7, armour: -3, status: 'zombie', known: 'yes' })).body;
  assert.equal(n.wounds, 8);
  assert.equal(n.hurt, 8);
  assert.equal(n.toHit, 2);
  assert.equal(n.armour, 0);
  assert.equal(n.status, 'active');
  assert.equal(n.known, false);
  assert.equal((await make({ name: 'x'.repeat(81) })).status, 413);
});

test('npcs: server fields from the browser are ignored', async () => {
  const n = (await make({ ...foreman, id: 'mine', campaignId: 'other', type: 'story' })).body;
  assert.notEqual(n.id, 'mine');
  assert.equal(n.campaignId, cid);
  assert.equal(n.type, 'npc');
});

test('npcs: a stale ETag is a 412 conflict; a missing one is refused', async () => {
  const n = (await make(foreman)).body;
  await put(n, { ...foreman, hurt: 1 });
  assert.equal((await put(n, { ...foreman, hurt: 2 })).status, 412);
  assert.equal((await call(putNpc, { user: 'alice', method: 'PUT', params: { cid, nid: n.id }, body: foreman })).status, 428);
});

test('npcs: an NPC id from another campaign is not found', async () => {
  const other = (await call(createCampaign, { user: 'alice', method: 'POST', body: { name: 'Other' } })).body.id;
  const n = (await make(foreman)).body;
  assert.equal((await call(deleteNpc, { user: 'alice', method: 'DELETE', params: { cid: other, nid: n.id } })).status, 404);
});

test('npcs: export and import carry them, unknown to players', async () => {
  await make({ ...foreman, known: true });
  const out = (await call(exportAll, { user: 'alice' })).body;
  assert.equal(out.campaigns[0].npcs[0].name, 'Ada Marsh');
  const res = (await call(importAll, { user: 'alice', method: 'POST', body: { campaigns: out.campaigns } })).body;
  const imported = (await call(listNpcs, { user: 'alice', params: { cid: res.campaigns[0].id } })).body;
  assert.equal(imported.length, 1);
  assert.equal(imported[0].secrets, foreman.secrets);
  assert.equal(imported[0].known, false);
});

test('npcs: deleted with the campaign', async () => {
  await make(foreman);
  assert.equal((await call(deleteCampaign, { user: 'alice', method: 'DELETE', params: { cid } })).status, 204);
  assert.equal((await (await repo()).list('campaigns', cid, { types: ['npc'] })).length, 0);
});
