// Settings: theme, your name, your characters, backup and import, and signing out.
// Reached from the gear button in the top bar. Works signed out too (theme only).
import { api } from './api.js';
import {
  state, saveSettings, esc, toast, setTitle, charLevel,
} from './store.js';
import { session, renderAccount, signedIn } from './auth.js';
import { pendingLocalSave, dismissLocalSave, importData, readFile, downloadBackup } from './importer.js';

const THEMES = [['dark', 'Dark'], ['light', 'Light'], ['system', 'Match device']];

export function applyTheme() {
  const t = state.settings.theme;
  const light = t === 'light' || (t === 'system' && matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#faf9f6' : '#0f1012');
}

function importBlock() {
  const old = pendingLocalSave();
  if (!old) return '';
  const names = old.characters.map((c) => esc(c.name || 'Unnamed')).join(', ');
  return `<section class="block">
    <h2>Data from before sign-in</h2>
    <p>This browser has ${old.characters.length ? `${old.characters.length} character(s) (${names})` : 'no characters'}${old.crew ? ` and the crew sheet for ${esc(old.crew.name || 'your crew')}` : ''}.</p>
    <p class="muted small">Importing adds the characters to your account${old.crew ? ' and turns the crew sheet into a new campaign that you run' : ''}. The copy in this browser isn't deleted.</p>
    <div class="row"><button type="button" class="btn primary" data-act="import-local">Import into my account</button>
      <button type="button" class="btn quiet" data-act="dismiss-local">Not now</button></div>
  </section>`;
}

function view() {
  const u = session.user;
  return `<div class="page">
    <div class="page-head"><div><h1>Settings</h1>${u ? `<p class="sub">Signed in with ${u.provider === 'aad' ? 'Microsoft' : 'GitHub'}</p>` : ''}</div></div>

    <section class="block" aria-labelledby="theme-h">
      <h2 id="theme-h">Appearance</h2>
      <div class="seg" role="group" aria-label="Theme" style="margin-top:16px">${THEMES.map(([k, l]) => `<button type="button" data-theme="${k}" aria-pressed="${state.settings.theme === k}">${l}</button>`).join('')}</div>
    </section>

    ${u ? `${importBlock()}
    <section class="block" aria-labelledby="name-h">
      <h2 id="name-h">Your name</h2>
      <p class="muted small">Everyone in your campaigns sees this.</p>
      <form class="form-row" id="name-form">
        <label class="sr-only" for="dn">Display name</label>
        <input id="dn" name="displayName" maxlength="40" required value="${esc(u.displayName)}">
        <button class="btn">Save</button>
      </form>
    </section>

    <section class="block" aria-labelledby="chars-h">
      <div class="row spread"><h2 id="chars-h">Characters</h2><a class="btn quiet" href="#/characters">Manage</a></div>
      <ul class="rows" style="margin-top:8px">${state.characters.map((c) => `<li><a href="#/characters/${encodeURIComponent(c.id)}"><span class="row-text">
        <span class="row-title">${esc(c.name || 'Unnamed')}</span><span class="row-meta">${c.dead ? 'Dead' : c.created ? `Level ${charLevel(c)}` : 'Still being made'}</span></span>
        ${state.settings.currentChar === c.id ? '<span class="row-side">On the Sheet tab</span>' : ''}</a></li>`).join('') || '<li><p class="muted" style="padding:8px 0">None yet.</p></li>'}</ul>
    </section>

    <section class="block" aria-labelledby="backup-h">
      <h2 id="backup-h">Backup</h2>
      <p class="muted small">Download everything in your account as a file, or import a backup (including a save from the old, pre-sign-in app). Importing adds; it never replaces.</p>
      <div class="row">
        <button type="button" class="btn" data-act="export">Download a backup</button>
        <label class="btn">Import a backup<input type="file" id="import-file" accept="application/json,.json" hidden></label>
      </div>
    </section>

    <section class="block"><a class="btn" href="/.auth/logout?post_logout_redirect_uri=/">Sign out</a></section>`
    : `<section class="block"><h2>Account</h2><p class="muted">Sign in to keep characters and campaigns.</p><a class="btn primary" href="#/signin">Sign in</a></section>`}
  </div>`;
}

export function renderAccountPage(el) {
  setTitle('Settings');
  const draw = () => { el.innerHTML = view(); };
  draw();
  const done = (res) => {
    const made = res.campaigns?.length ? ` and ${res.campaigns.length} campaign(s)` : '';
    toast(`Imported ${res.characters.length} character(s)${res.notes ? `, ${res.notes} note(s)` : ''}${made}`);
    draw();
  };
  el.onclick = async (e) => {
    const t = e.target.closest('[data-theme]');
    if (t) { state.settings.theme = t.dataset.theme; saveSettings(); applyTheme(); draw(); return; }
    const b = e.target.closest('button[data-act]');
    if (!b || !signedIn()) return;
    if (b.dataset.act === 'dismiss-local') { dismissLocalSave(); draw(); return; }
    b.disabled = true;
    try {
      if (b.dataset.act === 'import-local') { const res = await importData(pendingLocalSave()); dismissLocalSave(); done(res); }
      if (b.dataset.act === 'export') await downloadBackup();
    } catch (err) {
      toast(esc(err.message));
    } finally {
      b.disabled = false;
    }
  };
  el.onchange = async (e) => {
    if (e.target.id !== 'import-file' || !e.target.files[0]) return;
    try {
      const data = await readFile(e.target.files[0]);
      if (!confirm('Add everything in this file to your account?')) return;
      done(await importData(data));
    } catch (err) {
      toast(esc(err.message));
    }
  };
  el.onsubmit = async (e) => {
    if (e.target.id !== 'name-form') return;
    e.preventDefault();
    const displayName = new FormData(e.target).get('displayName');
    try {
      session.user = await api('me', { method: 'PATCH', body: { displayName } });
      renderAccount();
      toast('Saved');
      draw();
    } catch (err) {
      toast(esc(err.message));
    }
  };
}

// Follow the device when set to "match device".
matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => { if (state.settings.theme === 'system') applyTheme(); });
