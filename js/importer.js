// Bringing old data in, and backups out. Import always adds to the account; it never replaces anything.
import { api } from './api.js';
import { OLD_KEY, migrateSave, migrateCharacter, loadCharacters } from './store.js';

const DONE_KEY = 'project-society:imported';

/** The pre-sign-in save in this browser, if there is one the user hasn't imported or dismissed. */
export function pendingLocalSave() {
  if (localStorage.getItem(DONE_KEY)) return null;
  try {
    const s = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
    return s && (s.characters || []).length ? s : null;
  } catch {
    return null;
  }
}

export const dismissLocalSave = () => localStorage.setItem(DONE_KEY, String(Date.now()));

/** Turn a backup (old v1 save or a v2 export) into the import request body. */
export function toImport(data) {
  if (data?.app === 'project-society' && data.version === 2) {
    return { characters: (data.characters || []).map(migrateCharacter), notes: data.notes || [] };
  }
  if (data && Array.isArray(data.characters)) {
    return { characters: migrateSave(data).characters, notes: [] };
  }
  throw new Error('This isn\'t a Project Society save file.');
}

export async function importData(data) {
  const res = await api('import', { method: 'POST', body: toImport(data) });
  await loadCharacters();
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
