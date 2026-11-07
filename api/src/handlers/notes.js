// Private notes: owner only, always. Filtered by campaign or character inside the owner's partition.
import { route, ok, created, readJson, requireIfMatch, clean, notFound, now } from '../lib/http.js';
import { repo } from '../lib/repo.js';
import { checkId, optionalId, newId, text, MAX_NOTE_BODY, MAX_TITLE } from '../lib/validate.js';

function fields(body) {
  return {
    title: text(body.title, { max: MAX_TITLE, what: 'The title' }),
    body: text(body.body, { max: MAX_NOTE_BODY, what: 'The note' }),
    campaignId: optionalId(body.campaignId, 'campaign id'),
    characterId: optionalId(body.characterId, 'character id'),
  };
}

export const listNotes = route(async ({ user, query }) => {
  const r = await repo();
  const opts = { orderBy: 'updatedAt' };
  if (query.get('campaignId')) opts.campaignId = checkId(query.get('campaignId'), 'campaign id');
  let list = await r.list('notes', user.id, opts);
  const characterId = query.get('characterId');
  if (characterId) list = list.filter((n) => n.characterId === characterId);
  return ok(list.map(clean));
});

export function newNoteDoc(ownerId, body) {
  const t = now();
  return { ...fields(body), id: newId(), ownerId, createdAt: t, updatedAt: t };
}

export const createNote = route(async ({ request, user }) => {
  const r = await repo();
  return created(clean(await r.create('notes', newNoteDoc(user.id, await readJson(request, 200_000)))));
});

async function own(user, id) {
  const r = await repo();
  const doc = await r.read('notes', user.id, checkId(id, 'note id'));
  if (!doc) throw notFound('Note not found.');
  return doc;
}

export const putNote = route(async ({ request, user, params }) => {
  const etag = requireIfMatch(request);
  const existing = await own(user, params.id);
  const { _etag, ...base } = clean(existing);
  const doc = { ...base, ...fields(await readJson(request, 200_000)), updatedAt: now() };
  const r = await repo();
  return ok(clean(await r.replace('notes', doc, etag)));
});

export const deleteNote = route(async ({ user, params }) => {
  const existing = await own(user, params.id);
  const r = await repo();
  await r.remove('notes', user.id, existing.id);
  return { status: 204 };
});
