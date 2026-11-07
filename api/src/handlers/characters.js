// Characters: owner only. (The DM's read-only view of attached characters is in campaigns.js.)
import { route, ok, created, readJson, requireIfMatch, clean, notFound, now } from '../lib/http.js';
import { repo, update } from '../lib/repo.js';
import { checkId, newId, payload, MAX_CHARACTER } from '../lib/validate.js';

export const listCharacters = route(async ({ user }) => {
  const r = await repo();
  const list = await r.list('characters', user.id, { orderBy: 'createdAt' });
  return ok(list.map(clean));
});

export function newCharacterDoc(ownerId, body) {
  const t = now();
  return { ...payload(body, MAX_CHARACTER, 'This character'), id: newId(), ownerId, campaignId: null, createdAt: t, updatedAt: t };
}

export const createCharacter = route(async ({ request, user }) => {
  const r = await repo();
  const doc = await r.create('characters', newCharacterDoc(user.id, await readJson(request)));
  return created(clean(doc));
});

async function own(user, id) {
  const r = await repo();
  const doc = await r.read('characters', user.id, checkId(id, 'character id'));
  if (!doc) throw notFound('Character not found.');
  return doc;
}

export const getCharacter = route(async ({ user, params }) => ok(clean(await own(user, params.id))));

export const putCharacter = route(async ({ request, user, params }) => {
  const etag = requireIfMatch(request);
  const existing = await own(user, params.id);
  const doc = {
    ...payload(await readJson(request), MAX_CHARACTER, 'This character'),
    id: existing.id,
    ownerId: user.id,
    campaignId: existing.campaignId ?? null, // changed only through the attach endpoint
    createdAt: existing.createdAt,
    updatedAt: now(),
  };
  const r = await repo();
  return ok(clean(await r.replace('characters', doc, etag)));
});

export const deleteCharacter = route(async ({ user, params }) => {
  const existing = await own(user, params.id);
  if (existing.campaignId) {
    await update('campaigns', existing.campaignId, `m:${user.id}`, (m) => {
      m.characterIds = (m.characterIds || []).filter((x) => x !== existing.id);
    });
  }
  const r = await repo();
  await r.remove('characters', user.id, existing.id);
  return { status: 204 };
});
