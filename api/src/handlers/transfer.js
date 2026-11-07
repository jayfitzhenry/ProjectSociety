// Export everything the caller owns; import an old save or an export. Import only ever adds.
import { route, ok, created, readJson, clean, badRequest, now } from '../lib/http.js';
import { repo } from '../lib/repo.js';
import { newCharacterDoc } from './characters.js';
import { newNoteDoc } from './notes.js';

const LIMITS = { characters: 50, notes: 300 };

export const exportAll = route(async ({ user }) => {
  const r = await repo();
  const [characters, notes] = await Promise.all([
    r.list('characters', user.id, { orderBy: 'createdAt' }),
    r.list('notes', user.id, { orderBy: 'updatedAt' }),
  ]);
  return ok({ app: 'project-society', version: 2, exportedAt: now(), characters: characters.map(clean), notes: notes.map(clean) });
});

export const importAll = route(async ({ request, user }) => {
  const body = await readJson(request, 4_000_000);
  const characters = Array.isArray(body.characters) ? body.characters : [];
  const notes = Array.isArray(body.notes) ? body.notes : [];
  if (characters.length > LIMITS.characters) throw badRequest(`At most ${LIMITS.characters} characters per import.`);
  if (notes.length > LIMITS.notes) throw badRequest(`At most ${LIMITS.notes} notes per import.`);
  // Validate everything before writing anything.
  const charDocs = characters.map((c) => newCharacterDoc(user.id, c));
  // Imported notes lose campaign/character links: those ids belonged to the old copies.
  const noteDocs = notes.map((n) => newNoteDoc(user.id, { title: n.title, body: n.body }));
  const r = await repo();
  const saved = [];
  for (const d of charDocs) saved.push(clean(await r.create('characters', d)));
  for (const d of noteDocs) await r.create('notes', d);
  return created({ characters: saved, notes: noteDocs.length });
});
