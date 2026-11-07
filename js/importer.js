// Bringing old data in, and backups out. Import always adds to the account; it never replaces anything.
import { api } from './api.js';
import {
  OLD_KEY, migrateSave, migrateCharacter, migrateCrew, loadCharacters, localCrew, forgetLocalCrew,
} from './store.js';
import { refreshUser } from './auth.js';

const DONE_KEY = 'project-society:imported';

const hasContent = (crew) => !!crew && !!(crew.name || crew.pot || (crew.log || []).length);

/**
 * What this browser still holds from before sign-in: characters from the old save,
 * and the crew sheet (which becomes a campaign you run). Null if nothing is waiting.
 */
export function pendingLocalSave() {
  if (localStorage.getItem(DONE_KEY)) return null;
  let old = null;
  try { old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null'); } catch { old = null; }
  const characters = old?.characters || [];
  const crew = localCrew();
  if (!characters.length && !hasContent(crew)) return null;
  return { version: 1, characters, crew: hasContent(crew) ? crew : null };
}

export function dismissLocalSave() {
  localStorage.setItem(DONE_KEY, String(Date.now()));
  forgetLocalCrew();
}

/** Turn a backup (old v1 save or a v2 export) into the import request body. */
export function toImport(data) {
  if (data?.app === 'project-society' && data.version === 2) {
    return {
      characters: (data.characters || []).map(migrateCharacter),
      notes: data.notes || [],
      campaigns: (data.campaigns || []).map((c) => ({ name: c.name, crew: migrateCrew(c.crew), stories: c.stories || [], npcs: c.npcs || [] })),
    };
  }
  if (data && Array.isArray(data.characters)) {
    const { characters, crew } = migrateSave(data);
    // One device, one crew: the characters were the crew, so they go into the new campaign with it.
    const campaigns = hasContent(crew) ? [{ name: crew.name || 'My crew', crew, attachCharacters: true }] : [];
    return { characters, notes: [], campaigns };
  }
  throw new Error('This isn\'t a Project Society save file.');
}

export async function importData(data) {
  const res = await api('import', { method: 'POST', body: toImport(data) });
  await Promise.all([loadCharacters(), refreshUser()]);
  return res;
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)); } catch { reject(new Error('That file isn\'t valid JSON.')); }
    };
    reader.onerror = () => reject(new Error('Couldn\'t read that file.'));
    reader.readAsText(file);
  });
}

export async function downloadBackup() {
  const data = await api('export');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `project-society-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
