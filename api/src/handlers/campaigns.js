// Campaigns, join codes, membership, the shared crew sheet and the DM's view of attached characters.
// Everything for one campaign lives in one partition of the `campaigns` container.
import { randomInt } from 'node:crypto';
import {
  route, ok, created, readJson, requireIfMatch, clean, badRequest, forbidden, notFound, now, HttpError,
} from '../lib/http.js';
import { repo, update } from '../lib/repo.js';
import { checkId, newId, payload, text } from '../lib/validate.js';
import { requireMember, requireDm, membershipId, ownCharacter, characterSummary } from '../lib/access.js';
import { indexAdd, indexRemove, indexRename } from '../lib/campaign-index.js';
import { ensureUser } from './me.js';

const MAX_CREW = 400_000;
const MAX_NAME = 80;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L
const codePk = (code) => `code:${code}`;

const campaignName = (v) => text(v, { max: MAX_NAME, what: 'The campaign name', required: true }).trim();

// ---------- join codes ----------
/** Reserve a fresh join code pointing at a campaign. Stored as its own tiny partition, so lookup is a point read. */
async function allocateCode(campaignId) {
  const r = await repo();
  for (let i = 0; i < 8; i += 1) {
    const code = Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
    try {
      await r.create('campaigns', { id: code, campaignId: codePk(code), type: 'joincode', target: campaignId, createdAt: now() });
      return code;
    } catch (e) {
      if (e.status !== 409) throw e;
    }
  }
  throw new Error('Could not allocate a join code');
}

// ---------- create ----------
export function crewDoc(campaignId, crew) {
  return { ...payload(crew || {}, MAX_CREW, 'The crew sheet'), id: 'crew', type: 'crew', campaignId, updatedAt: now() };
}

/** Create a campaign with the caller as DM. Shared by POST /campaigns and import. */
export async function createCampaignFor(user, name, crew) {
  const u = await ensureUser(user);
  const r = await repo();
  const id = newId();
  const t = now();
  const joinCode = await allocateCode(id);
  const campaign = { id, campaignId: id, type: 'campaign', name, joinCode, createdBy: user.id, createdAt: t };
  await r.create('campaigns', campaign);
  await r.create('campaigns', {
    id: membershipId(user.id), type: 'membership', campaignId: id, userId: user.id, role: 'dm',
    displayName: u.displayName, characterIds: [], joinedAt: t, lastReadAt: t,
  });
  await r.create('campaigns', crewDoc(id, crew));
  await indexAdd(user.id, { campaignId: id, name, role: 'dm' });
  return campaign;
}

export const createCampaign = route(async ({ request, user }) => {
  const body = await readJson(request);
  const campaign = await createCampaignFor(user, campaignName(body.name), body.crew);
  return created({ id: campaign.id, name: campaign.name, role: 'dm' });
});

// ---------- read ----------
/** Fetch the characters listed on memberships. Point reads, one per character, in each owner's partition. */
async function rosterFor(campaignId, memberships, asDm) {
  const r = await repo();
  const refs = memberships.flatMap((m) => (m.characterIds || []).map((id) => [m.userId, id]));
  const docs = await Promise.all(refs.map(([owner, id]) => r.read('characters', owner, id)));
  return docs
    .filter((c) => c && c.campaignId === campaignId)
    .map((c) => (asDm ? clean(c) : characterSummary(c)));
}

export const getCampaign = route(async ({ user, params }) => {
  const cid = checkId(params.cid, 'campaign id');
  const r = await repo();
  const docs = await r.list('campaigns', cid, { types: ['campaign', 'membership', 'crew'] });
  const me = docs.find((d) => d.type === 'membership' && d.userId === user.id);
  if (!me) throw forbidden("You're not in this campaign.");
  const campaign = docs.find((d) => d.type === 'campaign');
  if (!campaign) throw notFound('Campaign not found.');
  const memberships = docs.filter((d) => d.type === 'membership');
  const isDm = me.role === 'dm';
  return ok({
    campaign: {
      id: campaign.id, name: campaign.name, createdBy: campaign.createdBy, createdAt: campaign.createdAt,
      ...(isDm ? { joinCode: campaign.joinCode } : {}),
    },
    me: { role: me.role, characterIds: me.characterIds || [], lastReadAt: me.lastReadAt || null },
    members: memberships.map((m) => ({
      userId: m.userId, displayName: m.displayName, role: m.role, characterIds: m.characterIds || [], joinedAt: m.joinedAt,
    })),
    crew: clean(docs.find((d) => d.type === 'crew') || null),
    roster: await rosterFor(cid, memberships, isDm),
  });
});

// ---------- DM: rename, delete, join code ----------
export const patchCampaign = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const name = campaignName((await readJson(request, 10_000)).name);
  const saved = await update('campaigns', params.cid, params.cid, (c) => { c.name = name; });
  const r = await repo();
  const members = await r.list('campaigns', params.cid, { types: ['membership'] });
  await Promise.all(members.map((m) => indexRename(m.userId, params.cid, name)));
  return ok({ id: saved.id, name: saved.name });
});

/** Take a character out of a campaign without deleting it. */
async function detach(ownerId, characterId, campaignId) {
  await update('characters', ownerId, characterId, (c) => {
    if (c.campaignId !== campaignId) return false;
    c.campaignId = null;
    c.updatedAt = now();
  });
}

async function removeMembership(campaignId, m) {
  const r = await repo();
  await Promise.all((m.characterIds || []).map((id) => detach(m.userId, id, campaignId)));
  await r.remove('campaigns', campaignId, m.id);
  await indexRemove(m.userId, campaignId);
}

export const deleteCampaign = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const r = await repo();
  const docs = await r.list('campaigns', params.cid, {});
  const campaign = docs.find((d) => d.type === 'campaign');
  for (const m of docs.filter((d) => d.type === 'membership')) await removeMembership(params.cid, m);
  if (campaign?.joinCode) await r.remove('campaigns', codePk(campaign.joinCode), campaign.joinCode);
  for (const d of docs.filter((x) => x.type !== 'membership')) await r.remove('campaigns', params.cid, d.id);
  return { status: 204 };
});

export const regenerateCode = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const r = await repo();
  const code = await allocateCode(params.cid);
  let old = null;
  await update('campaigns', params.cid, params.cid, (c) => { old = c.joinCode; c.joinCode = code; });
  if (old) await r.remove('campaigns', codePk(old), old);
  return ok({ joinCode: code });
});

// ---------- join, leave, remove ----------
export const joinCampaign = route(async ({ request, user }) => {
  const code = String((await readJson(request, 1000)).code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) throw badRequest('Join codes are 6 letters and numbers.');
  const r = await repo();
  const link = await r.read('campaigns', codePk(code), code);
  if (!link) throw notFound("That join code doesn't match a campaign. Ask your DM for the current one.");
  const campaign = await r.read('campaigns', link.target, link.target);
  if (!campaign || campaign.joinCode !== code) throw notFound("That join code doesn't match a campaign. Ask your DM for the current one.");
  const existing = await r.read('campaigns', campaign.id, membershipId(user.id));
  if (existing) return ok({ id: campaign.id, name: campaign.name, role: existing.role });
  const u = await ensureUser(user);
  const t = now();
  await r.create('campaigns', {
    id: membershipId(user.id), type: 'membership', campaignId: campaign.id, userId: user.id, role: 'player',
    displayName: u.displayName, characterIds: [], joinedAt: t, lastReadAt: '1970-01-01T00:00:00.000Z',
  });
  await indexAdd(user.id, { campaignId: campaign.id, name: campaign.name, role: 'player' });
  return created({ id: campaign.id, name: campaign.name, role: 'player' });
});

/** The DM removes someone, or a player leaves. Their characters are detached, never deleted. */
export const removeMember = route(async ({ user, params }) => {
  const me = await requireMember(params.cid, user);
  const target = checkId(params.userId, 'user id');
  const self = target === user.id;
  if (self && me.role === 'dm') throw badRequest("The DM can't leave their own campaign. Delete it instead.");
  if (!self && me.role !== 'dm') throw forbidden('Only the DM can remove players.');
  const r = await repo();
  const m = self ? me : await r.read('campaigns', params.cid, membershipId(target));
  if (!m) throw notFound('That person is not in this campaign.');
  await removeMembership(params.cid, m);
  return { status: 204 };
});

// ---------- characters in a campaign ----------
/** Attach one of your characters to a campaign you're in, or detach it (campaignId null). */
export const attachCharacter = route(async ({ request, user, params }) => {
  const c = await ownCharacter(user, params.id);
  const body = await readJson(request, 1000);
  const target = body.campaignId ? checkId(body.campaignId, 'campaign id') : null;
  if (target) await requireMember(target, user);
  if (c.campaignId && c.campaignId !== target) {
    await update('campaigns', c.campaignId, membershipId(user.id), (m) => {
      m.characterIds = (m.characterIds || []).filter((x) => x !== c.id);
    });
  }
  if (target) {
    await update('campaigns', target, membershipId(user.id), (m) => {
      if ((m.characterIds || []).includes(c.id)) return false;
      m.characterIds = [...(m.characterIds || []), c.id];
    });
  }
  const saved = await update('characters', user.id, c.id, (doc) => { doc.campaignId = target; doc.updatedAt = now(); });
  return ok(clean(saved));
});

/** DM only: read-only copy of a character attached to their campaign. */
export const getMemberCharacter = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const r = await repo();
  const c = await r.read('characters', checkId(params.ownerId, 'owner id'), checkId(params.charId, 'character id'));
  if (!c || c.campaignId !== params.cid) throw notFound('That character is not in this campaign.');
  return ok(clean(c));
});

// ---------- the crew sheet ----------
const AWARD_FIELDS = { marks: [0, 10_000], chips: [0, 1_000_000], wounds: [0, 20], shaken: [0, 20] };

function checkAwards(list) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > 50) throw badRequest('Invalid awards.');
  return list.map((a) => {
    const out = { ownerId: checkId(a?.ownerId, 'owner id'), characterId: checkId(a?.characterId, 'character id') };
    for (const k of Object.keys(AWARD_FIELDS)) {
      if (a[k] === undefined) continue;
      if (!Number.isInteger(a[k]) || Math.abs(a[k]) > 10_000) throw badRequest(`Invalid ${k} award.`);
      out[k] = a[k];
    }
    return out;
  });
}

/**
 * Apply crew results (Marks, pay, recovery) to characters attached to this campaign.
 * Deltas, so they merge with whatever the owner changed meanwhile. Characters elsewhere are skipped.
 */
async function applyAwards(campaignId, awards) {
  const results = [];
  for (const a of awards) {
    let skipped = false;
    const saved = await update('characters', a.ownerId, a.characterId, (c) => {
      if (c.campaignId !== campaignId) { skipped = true; return false; }
      for (const [k, [lo, hi]] of Object.entries(AWARD_FIELDS)) {
        if (a[k] !== undefined) c[k] = Math.max(lo, Math.min(hi, (Number(c[k]) || 0) + a[k]));
      }
      c.updatedAt = now();
    });
    if (!saved || skipped) results.push({ characterId: a.characterId, ok: false });
    else results.push({ characterId: a.characterId, ok: true, character: clean(saved) });
  }
  return results;
}

/** DM only. Replaces the crew sheet if nobody else saved since the DM loaded it, then applies awards. */
export const putCrew = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const etag = requireIfMatch(request);
  const body = await readJson(request);
  const awards = checkAwards(body.awards);
  const r = await repo();
  const saved = await r.replace('campaigns', crewDoc(params.cid, body.crew), etag);
  return ok({ crew: clean(saved), awards: await applyAwards(params.cid, awards) });
});

/** Any member: send chips from one of your own characters in this campaign to the Pot. */
export const sendHome = route(async ({ request, user, params }) => {
  await requireMember(params.cid, user);
  const body = await readJson(request, 1000);
  const chips = body.chips;
  if (!Number.isInteger(chips) || chips < 1 || chips > 1_000_000) throw badRequest('Send a whole number of chips.');
  const c = await ownCharacter(user, body.characterId);
  if (c.campaignId !== params.cid) throw forbidden('That character is not in this campaign.');
  if (c.dead) throw badRequest('The dead send nothing home.');
  const after = await update('characters', user.id, c.id, (doc) => {
    if ((doc.chips || 0) < chips) throw new HttpError(400, `${doc.name || 'That character'} only has ${doc.chips || 0}c.`, 'bad_request');
    doc.chips -= chips;
    doc.updatedAt = now();
  });
  let crew;
  try {
    crew = await update('campaigns', params.cid, 'crew', (k) => {
      k.pot = (Number(k.pot) || 0) + chips;
      k.log = [{ t: Date.now(), text: `🏺 ${c.name || 'Someone'} sent ${chips}c home. Pot ${k.pot}c.` }, ...(k.log || [])].slice(0, 200);
      k.updatedAt = now();
    });
    if (!crew) throw notFound('Crew sheet not found.');
  } catch (e) {
    // Give the chips back rather than lose them.
    await update('characters', user.id, c.id, (doc) => { doc.chips = (doc.chips || 0) + chips; });
    throw e;
  }
  return ok({ character: clean(after), crew: clean(crew) });
});
