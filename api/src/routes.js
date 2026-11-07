// Every HTTP route: Functions route template → handler per method.
// src/functions/index.js registers these with the Functions host.
import { getMe, patchMe } from './handlers/me.js';
import { listCharacters, createCharacter, getCharacter, putCharacter, deleteCharacter } from './handlers/characters.js';
import { listNotes, createNote, putNote, deleteNote } from './handlers/notes.js';
import { exportAll, importAll } from './handlers/transfer.js';

export const ROUTES = [
  { name: 'me', route: 'me', map: { GET: getMe, PATCH: patchMe } },
  { name: 'characters', route: 'characters', map: { GET: listCharacters, POST: createCharacter } },
  { name: 'character', route: 'characters/{id}', map: { GET: getCharacter, PUT: putCharacter, DELETE: deleteCharacter } },
  { name: 'notes', route: 'notes', map: { GET: listNotes, POST: createNote } },
  { name: 'note', route: 'notes/{id}', map: { PUT: putNote, DELETE: deleteNote } },
  { name: 'export', route: 'export', map: { GET: exportAll } },
  { name: 'import', route: 'import', map: { POST: importAll } },
];
