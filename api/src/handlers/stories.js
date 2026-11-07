// Stories (DM only) and the snippets the DM shares from them (members, filtered by audience).
import {
  route, ok, created, readJson, requireIfMatch, clean, badRequest, notFound, now,
} from '../lib/http.js';
import { repo, update } from '../lib/repo.js';
import { checkId, optionalId, newId, text } from '../lib/validate.js';
import { requireMember, requireDm, membershipId } from '../lib/access.js';

const MAX_STORY = 200_000;
const MAX_SNIPPET = 50_000;
const STATUSES = new Set(['draft', 'archived']);

// ---------- stories: DM only ----------
function storyFields(body) {
  return {
    title: text(body.title, { max: 200, what: 'The title' }),
    body: text(body.body, { max: MAX_STORY, what: 'The story' }),
    status: STATUSES.has(body.status) ? body.status : 'draft',
  };
}

export const listStories = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const r = await repo();
  return ok((await r.list('campaigns', params.cid, { types: ['story'], orderBy: 'updatedAt' })).map(clean));
});

export const createStory = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const t = now();
  const doc = { ...storyFields(await readJson(request)), id: newId(), type: 'story', campaignId: params.cid, createdAt: t, updatedAt: t };
  const r = await repo();
  return created(clean(await r.create('campaigns', doc)));
});

async function story(cid, sid) {
  const r = await repo();
  const s = await r.read('campaigns', cid, checkId(sid, 'story id'));
  if (!s || s.type !== 'story') throw notFound('Story not found.');
  return s;
}

export const putStory = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const etag = requireIfMatch(request);
  const { _etag, ...existing } = clean(await story(params.cid, params.sid));
  const doc = { ...existing, ...storyFields(await readJson(request)), updatedAt: now() };
  const r = await repo();
  return ok(clean(await r.replace('campaigns', doc, etag)));
});

export const deleteStory = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const s = await story(params.cid, params.sid);
  const r = await repo();
  await r.remove('campaigns', params.cid, s.id);
  return { status: 204 };
});

// ---------- snippets ----------
/** 'all', or a non-empty list of current members' ids. */
async function checkAudience(cid, audience) {
  if (audience === 'all') return 'all';
  if (!Array.isArray(audience) || !audience.length || audience.length > 100) throw badRequest('Choose who sees this: everyone, or at least one player.');
  const r = await repo();
  const members = new Set((await r.list('campaigns', cid, { types: ['membership'] })).map((m) => m.userId));
  const ids = [...new Set(audience.map((id) => checkId(id, 'user id')))];
  if (ids.some((id) => !members.has(id))) throw badRequest('Everyone you share with must be in the campaign.');
  return ids;
}

/** What a player gets: no list of who else it went to. */
const forPlayer = (s) => {
  const { audience, ...rest } = clean(s);
  return { ...rest, shared: audience === 'all' ? 'all' : 'you' };
};

const visibleTo = (m) => (m.role === 'dm' ? {} : { audienceFor: m.userId });
const shape = (m) => (m.role === 'dm' ? clean : forPlayer);

export const listSnippets = route(async ({ user, params }) => {
  const m = await requireMember(params.cid, user);
  const r = await repo();
  const list = await r.list('campaigns', params.cid, { types: ['snippet'], orderBy: 'sharedAt', limit: 200, ...visibleTo(m) });
  return ok({ snippets: list.map(shape(m)), lastReadAt: m.lastReadAt || null });
});

export const createSnippet = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const body = await readJson(request);
  const t = now();
  const doc = {
    id: newId(),
    type: 'snippet',
    campaignId: params.cid,
    storyId: optionalId(body.storyId, 'story id'),
    title: text(body.title, { max: 200, what: 'The title' }),
    body: text(body.body, { max: MAX_SNIPPET, what: 'The snippet', required: true }),
    audience: await checkAudience(params.cid, body.audience),
    sharedBy: user.id,
    sharedAt: t,
    touchedAt: t,
  };
  const r = await repo();
  return created(clean(await r.create('campaigns', doc)));
});

export const patchSnippet = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const body = await readJson(request);
  const audience = body.audience === undefined ? undefined : await checkAudience(params.cid, body.audience);
  const saved = await update('campaigns', params.cid, checkId(params.id, 'snippet id'), (s) => {
    if (s.type !== 'snippet') throw notFound('Snippet not found.');
    const t = now();
    if (body.title !== undefined) s.title = text(body.title, { max: 200, what: 'The title' });
    if (body.body !== undefined) s.body = text(body.body, { max: MAX_SNIPPET, what: 'The snippet', required: true });
    if (audience !== undefined && JSON.stringify(audience) !== JSON.stringify(s.audience)) {
      s.audience = audience;
      s.sharedAt = t; // re-shared: new readers see it as new
    }
    s.editedAt = t;
    s.touchedAt = t;
  });
  if (!saved) throw notFound('Snippet not found.');
  return ok(clean(saved));
});

export const deleteSnippet = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const r = await repo();
  const s = await r.read('campaigns', params.cid, checkId(params.id, 'snippet id'));
  if (!s || s.type !== 'snippet') throw notFound('Snippet not found.');
  await r.remove('campaigns', params.cid, s.id);
  return { status: 204 };
});

// ---------- polling ----------
/**
 * Called every ~20 seconds while a campaign is open: snippets shared or edited since `since`
 * (only ones the caller may see), the crew sheet's ETag, and the caller's read marker.
 * Three cheap single-partition reads.
 */
export const poll = route(async ({ user, params, query }) => {
  const m = await requireMember(params.cid, user);
  const since = query.get('since');
  if (since && !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(since)) throw badRequest('Invalid since.');
  const r = await repo();
  const [crew, list] = await Promise.all([
    r.read('campaigns', params.cid, 'crew'),
    r.list('campaigns', params.cid, { types: ['snippet'], orderBy: 'touchedAt', limit: 100, ...(since ? { touchedAfter: since } : {}), ...visibleTo(m) }),
  ]);
  return ok({ crewEtag: crew?._etag || null, snippets: list.map(shape(m)), lastReadAt: m.lastReadAt || null, now: now() });
});

export const markRead = route(async ({ user, params }) => {
  await requireMember(params.cid, user);
  const t = now();
  await update('campaigns', params.cid, membershipId(user.id), (m) => { m.lastReadAt = t; });
  return ok({ lastReadAt: t });
});
