// NPCs: the people the crew meets. The DM keeps a short description, a stat line in the shape of the
// enemy table in actions.md (wounds, To Hit, weapon, armour, notes) and private secrets for each.
// When the DM marks an NPC as known, players see its name, role and description. Nothing else
// leaves the server for a player: not the stats, not the secrets, not the NPCs they haven't met.
import {
  route, ok, created, readJson, requireIfMatch, clean, notFound, now, HttpError,
} from '../lib/http.js';
import { repo } from '../lib/repo.js';
import { checkId, newId, text } from '../lib/validate.js';
import { requireMember, requireDm } from '../lib/access.js';

export const MAX_NPCS = 300;
export const MAX_WOUNDS = 8;
const STATUSES = new Set(['active', 'dead', 'gone']);

/** A whole number in [lo, hi], or the fallback. */
const int = (v, lo, hi, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
};

/** Validate what the DM sent. Unknown fields are dropped. */
export function npcFields(body) {
  const wounds = int(body.wounds, 1, MAX_WOUNDS, 3);
  return {
    name: text(body.name, { max: 80, what: 'The name' }),
    role: text(body.role, { max: 120, what: 'The role' }),
    about: text(body.about, { max: 4000, what: 'The description' }),
    secrets: text(body.secrets, { max: 20_000, what: 'The DM notes' }),
    wounds,
    hurt: int(body.hurt, 0, wounds, 0), // wounds filled right now
    toHit: int(body.toHit, 0, 2, 0),
    armour: int(body.armour, 0, 2, 0), // shown as a penalty: 1 is "-1"
    weapon: text(body.weapon, { max: 120, what: 'The weapon' }),
    notes: text(body.notes, { max: 500, what: 'The notes' }),
    status: STATUSES.has(body.status) ? body.status : 'active',
    known: body.known === true,
  };
}

/** What a player may see of an NPC, or null if they haven't met it. */
export function npcForPlayer(doc) {
  if (!doc.known) return null;
  return { id: doc.id, name: doc.name, role: doc.role, about: doc.about, status: doc.status };
}

export const listNpcs = route(async ({ user, params }) => {
  const m = await requireMember(params.cid, user);
  const r = await repo();
  const docs = (await r.list('campaigns', params.cid, { types: ['npc'], orderBy: 'createdAt' })).map(clean);
  if (m.role === 'dm') return ok(docs);
  return ok(docs.map(npcForPlayer).filter(Boolean));
});

export const createNpc = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const r = await repo();
  const have = await r.list('campaigns', params.cid, { types: ['npc'] });
  if (have.length >= MAX_NPCS) throw new HttpError(413, `At most ${MAX_NPCS} NPCs per campaign.`, 'too_big');
  const t = now();
  const doc = { ...npcFields(await readJson(request, 100_000)), id: newId(), type: 'npc', campaignId: params.cid, createdAt: t, updatedAt: t };
  return created(clean(await r.create('campaigns', doc)));
});

async function npc(cid, nid) {
  const r = await repo();
  const d = await r.read('campaigns', cid, checkId(nid, 'NPC id'));
  if (!d || d.type !== 'npc') throw notFound('NPC not found.');
  return d;
}

export const putNpc = route(async ({ request, user, params }) => {
  await requireDm(params.cid, user);
  const etag = requireIfMatch(request);
  const { _etag, ...existing } = clean(await npc(params.cid, params.nid));
  const doc = { ...existing, ...npcFields(await readJson(request, 100_000)), updatedAt: now() };
  const r = await repo();
  return ok(clean(await r.replace('campaigns', doc, etag)));
});

export const deleteNpc = route(async ({ user, params }) => {
  await requireDm(params.cid, user);
  const d = await npc(params.cid, params.nid);
  const r = await repo();
  await r.remove('campaigns', params.cid, d.id);
  return { status: 204 };
});
