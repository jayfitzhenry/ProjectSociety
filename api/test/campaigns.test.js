import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFake } from './fake-repo.js';
import { call } from './helpers.js';
import {
  createCampaign, getCampaign, patchCampaign, deleteCampaign, regenerateCode, joinCampaign, removeMember,
  attachCharacter, getMemberCharacter, putCrew, sendHome,
} from '../src/handlers/campaigns.js';
import { createCharacter, putCharacter } from '../src/handlers/characters.js';
import { getMe } from '../src/handlers/me.js';

let db;
let cid;
let code;
let bobChar;

/** alice runs a campaign; bob joined and attached Rook; carol is an outsider with her own character. */
beforeEach(async () => {
  db = useFake();
  cid = (await call(createCampaign, { user: 'alice', method: 'POST', body: { name: 'Ward 9', crew: { pot: 5, log: [] } } })).body.id;
  code = (await call(getCampaign, { user: 'alice', params: { cid } })).body.campaign.joinCode;
  await call(joinCampaign, { user: 'bob', method: 'POST', body: { code } });
  bobChar = (await call(createCharacter, { user: 'bob', method: 'POST', body: { name: 'Rook', chips: 30, marks: 0, contacts: [{ type: 'Fence', name: 'Old Mo' }], notes: 'secret' } })).body;
  bobChar = (await call(attachCharacter, { user: 'bob', method: 'PUT', params: { id: bobChar.id }, body: { campaignId: cid } })).body;
});

const crewEtag = async () => (await call(getCampaign, { user: 'alice', params: { cid } })).body.crew._etag;

test('creating a campaign makes the caller DM and lists it on their home screen', async () => {
  const me = (await call(getMe, { user: 'alice' })).body;
  assert.deepEqual(me.campaigns, [{ campaignId: cid, name: 'Ward 9', role: 'dm' }]);
});

test('members can open the campaign; outsiders cannot', async () => {
  assert.equal((await call(getCampaign, { user: 'bob', params: { cid } })).status, 200);
  assert.equal((await call(getCampaign, { user: 'carol', params: { cid } })).status, 403);
});

test('only the DM sees the join code', async () => {
  assert.equal((await call(getCampaign, { user: 'alice', params: { cid } })).body.campaign.joinCode, code);
  assert.equal((await call(getCampaign, { user: 'bob', params: { cid } })).body.campaign.joinCode, undefined);
});

test('the DM gets full crewmate sheets; players get only a summary', async () => {
  const dm = (await call(getCampaign, { user: 'alice', params: { cid } })).body.roster;
  assert.equal(dm[0].notes, 'secret');
  await call(joinCampaign, { user: 'dave', method: 'POST', body: { code } });
  const player = (await call(getCampaign, { user: 'dave', params: { cid } })).body.roster;
  assert.equal(player[0].name, 'Rook');
  assert.equal(player[0].notes, undefined);
  assert.equal(player[0].chips, undefined);
  assert.deepEqual(player[0].contacts, [{ type: 'Fence' }]);
});

test('joining: a valid code joins as a player; a wrong code is refused', async () => {
  const ok = await call(joinCampaign, { user: 'carol', method: 'POST', body: { code: code.toLowerCase() } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.role, 'player');
  assert.equal((await call(joinCampaign, { user: 'erin', method: 'POST', body: { code: 'ZZZZZZ' } })).status, 404);
});

test('regenerating the code: DM allowed, player refused; the old code stops working', async () => {
  assert.equal((await call(regenerateCode, { user: 'bob', method: 'POST', params: { cid } })).status, 403);
  const res = await call(regenerateCode, { user: 'alice', method: 'POST', params: { cid } });
  assert.equal(res.status, 200);
  assert.notEqual(res.body.joinCode, code);
  assert.equal((await call(joinCampaign, { user: 'carol', method: 'POST', body: { code } })).status, 404);
  assert.equal((await call(joinCampaign, { user: 'carol', method: 'POST', body: { code: res.body.joinCode } })).status, 201);
});

test('renaming: DM allowed (members\' home screens follow), player refused', async () => {
  assert.equal((await call(patchCampaign, { user: 'bob', method: 'PATCH', params: { cid }, body: { name: 'Mine' } })).status, 403);
  assert.equal((await call(patchCampaign, { user: 'alice', method: 'PATCH', params: { cid }, body: { name: 'Ward 10' } })).status, 200);
  assert.equal((await call(getMe, { user: 'bob' })).body.campaigns[0].name, 'Ward 10');
});

test('attaching: only to a campaign you are in, only your own character', async () => {
  const carols = (await call(createCharacter, { user: 'carol', method: 'POST', body: { name: 'Vex' } })).body;
  assert.equal((await call(attachCharacter, { user: 'carol', method: 'PUT', params: { id: carols.id }, body: { campaignId: cid } })).status, 403);
  assert.equal((await call(attachCharacter, { user: 'carol', method: 'PUT', params: { id: bobChar.id }, body: { campaignId: null } })).status, 404);
  const detached = await call(attachCharacter, { user: 'bob', method: 'PUT', params: { id: bobChar.id }, body: { campaignId: null } });
  assert.equal(detached.body.campaignId, null);
  assert.deepEqual((await call(getCampaign, { user: 'alice', params: { cid } })).body.roster, []);
});

test('a player can have more than one character in a campaign', async () => {
  const second = (await call(createCharacter, { user: 'bob', method: 'POST', body: { name: 'Wren' } })).body;
  await call(attachCharacter, { user: 'bob', method: 'PUT', params: { id: second.id }, body: { campaignId: cid } });
  const roster = (await call(getCampaign, { user: 'alice', params: { cid } })).body.roster;
  assert.deepEqual(roster.map((c) => c.name).sort(), ['Rook', 'Wren']);
});

test('DM can read an attached character; not one outside the campaign; players cannot', async () => {
  const p = { cid, ownerId: 'bob', charId: bobChar.id };
  assert.equal((await call(getMemberCharacter, { user: 'alice', params: p })).body.name, 'Rook');
  assert.equal((await call(getMemberCharacter, { user: 'bob', params: p })).status, 403);
  const carols = (await call(createCharacter, { user: 'carol', method: 'POST', body: { name: 'Vex' } })).body;
  assert.equal((await call(getMemberCharacter, { user: 'alice', params: { cid, ownerId: 'carol', charId: carols.id } })).status, 404);
});

test('the DM can read but never write a player\'s character directly', async () => {
  const res = await call(putCharacter, { user: 'alice', method: 'PUT', params: { id: bobChar.id }, headers: { 'if-match': bobChar._etag }, body: { name: 'Hacked' } });
  assert.equal(res.status, 404);
});

test('crew: DM saves with the current ETag; players are refused', async () => {
  const etag = await crewEtag();
  assert.equal((await call(putCrew, { user: 'bob', method: 'PUT', params: { cid }, headers: { 'if-match': etag }, body: { crew: { pot: 999 } } })).status, 403);
  const res = await call(putCrew, { user: 'alice', method: 'PUT', params: { cid }, headers: { 'if-match': etag }, body: { crew: { pot: 10, exposure: 3 } } });
  assert.equal(res.status, 200);
  assert.equal(res.body.crew.exposure, 3);
});

test('crew: a stale ETag is a 412 conflict and changes nothing', async () => {
  const etag = await crewEtag();
  await call(putCrew, { user: 'alice', method: 'PUT', params: { cid }, headers: { 'if-match': etag }, body: { crew: { pot: 10 } } });
  const res = await call(putCrew, { user: 'alice', method: 'PUT', params: { cid }, headers: { 'if-match': etag }, body: { crew: { pot: 50 }, awards: [{ ownerId: 'bob', characterId: bobChar.id, marks: 2 }] } });
  assert.equal(res.status, 412);
  assert.equal((await db.read('characters', 'bob', bobChar.id)).marks, 0);
});

test('awards: applied as deltas to attached characters only', async () => {
  const carols = (await call(createCharacter, { user: 'carol', method: 'POST', body: { name: 'Vex', chips: 0 } })).body;
  const res = await call(putCrew, {
    user: 'alice', method: 'PUT', params: { cid }, headers: { 'if-match': await crewEtag() },
    body: { crew: { pot: 5 }, awards: [
      { ownerId: 'bob', characterId: bobChar.id, marks: 2, chips: 15, wounds: -3 },
      { ownerId: 'carol', characterId: carols.id, chips: 500 },
    ] },
  });
  assert.equal(res.status, 200);
  const rook = await db.read('characters', 'bob', bobChar.id);
  assert.deepEqual([rook.marks, rook.chips, rook.wounds], [2, 45, 0]);
  assert.equal((await db.read('characters', 'carol', carols.id)).chips, 0);
  assert.deepEqual(res.body.awards.map((a) => a.ok), [true, false]);
});

test('awards: only the DM can send them', async () => {
  await call(joinCampaign, { user: 'carol', method: 'POST', body: { code } });
  const res = await call(putCrew, { user: 'carol', method: 'PUT', params: { cid }, headers: { 'if-match': await crewEtag() }, body: { crew: {}, awards: [{ ownerId: 'bob', characterId: bobChar.id, chips: 100 }] } });
  assert.equal(res.status, 403);
});

test('sending chips home: own attached character only, never more than it has', async () => {
  const ok = await call(sendHome, { user: 'bob', method: 'POST', params: { cid }, body: { characterId: bobChar.id, chips: 10 } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.character.chips, 20);
  assert.equal(ok.body.crew.pot, 15);
  assert.match(ok.body.crew.log[0].text, /Rook sent 10c home/);
  assert.equal((await call(sendHome, { user: 'bob', method: 'POST', params: { cid }, body: { characterId: bobChar.id, chips: 21 } })).status, 400);
  assert.equal((await call(sendHome, { user: 'alice', method: 'POST', params: { cid }, body: { characterId: bobChar.id, chips: 1 } })).status, 404);
  assert.equal((await call(sendHome, { user: 'carol', method: 'POST', params: { cid }, body: { characterId: bobChar.id, chips: 1 } })).status, 403);
});

test('removing a member: DM allowed; the character is detached, not deleted', async () => {
  assert.equal((await call(removeMember, { user: 'alice', method: 'DELETE', params: { cid, userId: 'bob' } })).status, 204);
  const rook = await db.read('characters', 'bob', bobChar.id);
  assert.ok(rook);
  assert.equal(rook.campaignId, null);
  assert.equal((await call(getCampaign, { user: 'bob', params: { cid } })).status, 403);
  assert.deepEqual((await call(getMe, { user: 'bob' })).body.campaigns, []);
});

test('removing a member: players cannot remove others; players can leave; the DM cannot leave', async () => {
  await call(joinCampaign, { user: 'carol', method: 'POST', body: { code } });
  assert.equal((await call(removeMember, { user: 'carol', method: 'DELETE', params: { cid, userId: 'bob' } })).status, 403);
  assert.equal((await call(removeMember, { user: 'carol', method: 'DELETE', params: { cid, userId: 'carol' } })).status, 204);
  assert.equal((await call(removeMember, { user: 'alice', method: 'DELETE', params: { cid, userId: 'alice' } })).status, 400);
});

test('deleting a campaign: DM allowed, player refused; characters survive, detached', async () => {
  assert.equal((await call(deleteCampaign, { user: 'bob', method: 'DELETE', params: { cid } })).status, 403);
  assert.equal((await call(deleteCampaign, { user: 'alice', method: 'DELETE', params: { cid } })).status, 204);
  assert.equal((await db.read('characters', 'bob', bobChar.id)).campaignId, null);
  assert.equal((await db.list('campaigns', cid, {})).length, 0);
  assert.equal((await call(joinCampaign, { user: 'carol', method: 'POST', body: { code } })).status, 404);
  assert.deepEqual((await call(getMe, { user: 'alice' })).body.campaigns, []);
});
