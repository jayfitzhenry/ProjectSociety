// Every HTTP route: Functions route template → handler per method.
// src/functions/index.js registers these with the Functions host.
import { getMe, patchMe } from './handlers/me.js';
import { listCharacters, createCharacter, getCharacter, putCharacter, deleteCharacter } from './handlers/characters.js';
import { listNotes, createNote, putNote, deleteNote } from './handlers/notes.js';
import { exportAll, importAll } from './handlers/transfer.js';
import {
  createCampaign, getCampaign, patchCampaign, deleteCampaign, regenerateCode, joinCampaign, removeMember,
  attachCharacter, getMemberCharacter, putCrew, sendHome,
} from './handlers/campaigns.js';

export const ROUTES = [
  { name: 'me', route: 'me', map: { GET: getMe, PATCH: patchMe } },
  { name: 'characters', route: 'characters', map: { GET: listCharacters, POST: createCharacter } },
  { name: 'character', route: 'characters/{id}', map: { GET: getCharacter, PUT: putCharacter, DELETE: deleteCharacter } },
  { name: 'characterCampaign', route: 'characters/{id}/campaign', map: { PUT: attachCharacter } },
  { name: 'notes', route: 'notes', map: { GET: listNotes, POST: createNote } },
  { name: 'note', route: 'notes/{id}', map: { PUT: putNote, DELETE: deleteNote } },
  { name: 'export', route: 'export', map: { GET: exportAll } },
  { name: 'import', route: 'import', map: { POST: importAll } },
  { name: 'campaigns', route: 'campaigns', map: { POST: createCampaign } },
  { name: 'join', route: 'join', map: { POST: joinCampaign } },
  { name: 'campaign', route: 'campaigns/{cid}', map: { GET: getCampaign, PATCH: patchCampaign, DELETE: deleteCampaign } },
  { name: 'joinCode', route: 'campaigns/{cid}/join-code', map: { POST: regenerateCode } },
  { name: 'member', route: 'campaigns/{cid}/members/{userId}', map: { DELETE: removeMember } },
  { name: 'memberCharacter', route: 'campaigns/{cid}/characters/{ownerId}/{charId}', map: { GET: getMemberCharacter } },
  { name: 'crew', route: 'campaigns/{cid}/crew', map: { PUT: putCrew } },
  { name: 'pot', route: 'campaigns/{cid}/pot', map: { POST: sendHome } },
];
