// Campaign material ("segments", stored as type 'story'), polling and read markers.
//
// A segment is the DM's: a title, a shared on/off switch and a list of sections. Each section is
// for the DM only, for all the players, or for chosen players. Players only ever receive shared
// segments, and only the sections meant for them: nothing else leaves the server for a player,
// not even who else a chosen-players section went to.
import {
  route, ok, created, readJson, requireIfMatch, clean, badRequest, notFound, now, HttpError,
} from '../lib/http.js';
import { repo, update } from '../lib/repo.js';
import { checkId, newId, text } from '../lib/validate.js';
import { requireMember, requireDm, membershipId } from '../lib/access.js';

export const MAX_SEGMENT = 200_000; // characters across all sections
export const MAX_SECTIONS = 100;
export const MAX_CHOSEN = 50;
const STATUSES = new Set(['draft', 'archived']);
const AUDIENCES = new Set(['dm', 'players', 'some']);
const SECTION_ID = /^[A-Za-z0-9_-]{1,40}$/;

// ---------- shape ----------
/** Older stories had one markdown body. They become a segment with one DM-only section. */
export function normalizeSegment(doc) {
  const out = { ...doc };
  if (!Array.isArray(out.sections)) {
    out.sections = out.body ? [{ id: 's1', title: '', body: String(out.body), audience: 'dm' }] : [];
  }
  delete out.body;
  out.shared = !!out.shared;
  out.status = STATUSES.has(out.status) ? out.status : 'draft';
  return out;
}

/** The chosen players of a section: unique user ids. */
function readChosen(to) {
  if (to === undefined || to === null) return [];
  if (!Array.isArray(to)) throw badRequest('Chosen players must be a list.');
  if (to.length > MAX_CHOSEN) throw badRequest(`At most ${MAX_CHOSEN} chosen players.`);
  return [...new Set(to.map((u) => checkId(u, 'player id')))];
}

/** Validate sections sent by the DM. Accepts the old { body } shape too (old clients, imports). */
export function readSections(body) {
  let list = body.sections;
  if (list === undefined && body.body !== undefined) list = body.body ? [{ id: 's1', title: '', body: body.body, audience: 'dm' }] : [];
  if (list === undefined) list = [];
  if (!Array.isArray(list)) throw badRequest('Sections must be a list.');
  if (list.length > MAX_SECTIONS) throw badRequest(`At most ${MAX_SECTIONS} sections.`);
  const seen = new Set();
  let total = 0;
  const sections = list.map((s, i) => {
    if (!s || typeof s !== 'object') throw badRequest('Each section must be an object.');
    let id = typeof s.id === 'string' && SECTION_ID.test(s.id) ? s.id : `s${i + 1}`;
    while (seen.has(id)) id = `${id}x`;
    seen.add(id);
    const sec = {
      id,
      title: text(s.title, { max: 200, what: 'A section title' }),
      body: text(s.body, { max: MAX_SEGMENT, what: 'A section' }),
      audience: AUDIENCES.has(s.audience) ? s.audience : 'dm',
    };
    if (sec.audience === 'some') sec.to = readChosen(s.to);
    total += sec.title.length + sec.body.length;
    return sec;
  });
  if (total > MAX_SEGMENT) throw new HttpError(413, `This segment is too long (max ${MAX_SEGMENT} characters).`, 'too_big');
  return sections;
}

function segmentFields(body) {
  return {
    title: text(body.title, { max: 200, what: 'The title' }),
    sections: readSections(body),
    status: STATUSES.has(body.status) ? body.status : 'draft',
    shared: body.shared === true,
  };
}

/** Is this section meant for this player? */
const sectionFor = (x, userId) => x.audience === 'players' || (x.audience === 'some' && Array.isArray(x.to) && x.to.includes(userId));

/** What one player may see of a segment, or null if they may see none of it. */
export function forPlayer(doc, userId) {
  const s = normalizeSegment(doc);
  if (!s.shared || s.status === 'archived') return null;
  const sections = s.sections.filter((x) => sectionFor(x, userId)).map(({ id, title, body, audience }) => ({
    id, title, body, ...(audience === 'some' ? { forYou: true } : {}),
  }));
  if (!sections.length) return null;
  const playersAt = s.playersAtBy?.[userId] || s.playersAt || s.createdAt;
  return { id: s.id, title: s.title, sections, createdAt: s.createdAt, playersAt };
}

const playerSig = (doc, userId) => {
  const v = doc && forPlayer(doc, userId);
  return v ? JSON.stringify([v.title, v.sections]) : '';
};

/** The players in a campaign (one single-partition query). */
async function playerIds(cid) {
  const r = await repo();
  return (await r.list('campaigns', cid, { types: ['membership'] })).filter((m) => m.role !== 'dm').map((m) => m.userId);
}

/**
 * Mark the segment as new for every player whose view of it changed, and move those players'
 * material markers so their polls notice. Other players see no change at all.
 */
async function stampPlayers(cid, before, doc, t) {
  const changed = (await playerIds(cid)).filter((u) => forPlayer(doc, u) && playerSig(before, u) !== playerSig(doc, u));
  if (!changed.length) return [];
  doc.playersAt = t;
  doc.playersAtBy = { ...(doc.playersAtBy || {}) };
  for (const u of changed) doc.playersAtBy[u] = t;
  return changed;
}

async function bumpMaterial(cid, users, t) {
  await Promise.all(users.map((u) => update('campaigns', cid, membershipId(u), (m) => {
    if (m.type !== 'membership') return false;
    m.materialAt = t;
  })));
}

// ---------- segments ----------
export const listStories = route(async ({ user, params }) => {
  const m = await requireMember(params.cid, user);
  const r = await repo();
  const docs = (await r.list('campaigns', params.cid, { types: ['story'], orderBy: 'createdAt' })).map(clean);
  if (m.role === 'dm') return ok(docs.map(normalizeSegment));
  return ok(docs.map((d) => forPlayer(d, m.userId)).filter(Boolean));
});

export const createStory = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const t = now();
  const fields = segmentFields(await readJson(request, 1_000_000));
  const doc = { ...fields, id: newId(), type: 'story', campaignId: params.cid, createdAt: t, updatedAt: t };
  const changed = await stampPlayers(params.cid, null, doc, t);
  const r = await repo();
  const saved = clean(await r.create('campaigns', doc));
  await bumpMaterial(params.cid, changed, t);
  return created(normalizeSegment(saved));
});

async function story(cid, sid) {
  const r = await repo();
  const s = await r.read('campaigns', cid, checkId(sid, 'segment id'));
  if (!s || s.type !== 'story') throw notFound('Segment not found.');
  return s;
}

export const putStory = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const etag = requireIfMatch(request);
  const { _etag, ...existing } = clean(await story(params.cid, params.sid));
  const t = now();
  const doc = { ...normalizeSegment(existing), ...segmentFields(await readJson(request, 1_000_000)), updatedAt: t };
  // A player sees something new only when what they can see changed.
  const changed = await stampPlayers(params.cid, existing, doc, t);
  const r = await repo();
  const saved = clean(await r.replace('campaigns', doc, etag));
  await bumpMaterial(params.cid, changed, t);
  return ok(normalizeSegment(saved));
});

export const deleteStory = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const s = await story(params.cid, params.sid);
  const r = await repo();
  await r.remove('campaigns', params.cid, s.id);
  return { status: 204 };
});

// ---------- polling ----------
/**
 * Called every ~20 seconds while a campaign is open: the crew sheet's ETag, when the caller's
 * material last changed, and the caller's read marker. Two point reads plus the membership read.
 */
export const poll = route(async ({ user, params }) => {
  const m = await requireMember(params.cid, user);
  const r = await repo();
  const [crew, campaign] = await Promise.all([
    r.read('campaigns', params.cid, 'crew'),
    r.read('campaigns', params.cid, params.cid),
  ]);
  // Each player has their own material marker. Campaigns from before chosen-player sections kept
  // one marker on the campaign doc: use whichever is later.
  const materialAt = [m.materialAt, campaign?.materialAt].filter(Boolean).sort().pop() || null;
  return ok({ crewEtag: crew?._etag || null, materialAt, lastReadAt: m.lastReadAt || null, now: now() });
});

export const markRead = route(async ({ user, params }) => {
  await requireMember(params.cid, user);
  const t = now();
  await update('campaigns', params.cid, membershipId(user.id), (m) => { m.lastReadAt = t; });
  return ok({ lastReadAt: t });
});
