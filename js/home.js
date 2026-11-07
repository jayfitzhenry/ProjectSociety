// Home screen after sign-in: your campaigns and characters, plus the quick roll.
import { traitsOf } from './characters.js';
import { state, esc, toast, charLevel, maxWounds } from './store.js';
import { BACKGROUNDS, traitIcon } from './data.js';
import { roll, renderRoll } from './dice.js';
import { api } from './api.js';
import { session, renderAccount } from './auth.js';
import { pendingLocalSave, dismissLocalSave, importData, readFile, downloadBackup } from './importer.js';

const ROLE = { dm: '🎭 DM', player: '🧑 Player' };

function nameCard() {
  if (session.user.nameConfirmed) return '';
  return `<section class="card">
    <h3>👋 What should other players call you?</h3>
    <form class="form-row" id="name-form">
      <input name="displayName" maxlength="40" required value="${esc(session.user.displayName)}" aria-label="Display name">
      <button class="btn primary">Save</button>
    </form>
    <p class="muted small">This is shown to everyone in your campaigns. You can change it later.</p>
  </section>`;
}

function importCard() {
  const old = pendingLocalSave();
  if (!old) return '';
  const names = old.characters.map((c) => esc(c.name || 'Unnamed')).join(', ');
  return `<section class="card import-card">
    <h3>📦 Found data from before sign-in</h3>
    <p>This browser has <b>${old.characters.length}</b> character(s) saved locally: ${names}.</p>
    <p class="muted small">Import adds them to your account. The copy in this browser isn't deleted.</p>
    <div class="actions">
      <button type="button" class="btn primary" data-act="import-local">⬆️ Import into my account</button>
      <button type="button" class="btn ghost" data-act="dismiss-local">Not now</button>
    </div>
  </section>`;
}

function backupCard() {
  return `<section class="card">
    <h3>💾 Backup</h3>
    <p class="muted small">Download everything in your account as a file, or import a backup (including a save from the old, pre-sign-in app). Importing adds; it never replaces.</p>
    <div class="actions">
      <button type="button" class="btn" data-act="export">⬇️ Export</button>
      <label class="btn">⬆️ Import a backup file<input type="file" id="import-file" accept="application/json,.json" hidden></label>
    </div>
  </section>`;
}

function campaignsCard() {
  const list = session.user.campaigns || [];
  return `<section class="card">
    <h3>🏠 Campaigns</h3>
    ${list.length ? `<ul class="char-list">${list.map((c) => `<li><a href="#/c/${encodeURIComponent(c.campaignId)}">
      <b>${esc(c.name)}</b><span class="muted small">${ROLE[c.role] || c.role}</span></a></li>`).join('')}</ul>`
      : '<p class="muted">You\'re not in a campaign yet.</p>'}
  </section>`;
}

function charactersCard() {
  const chars = state.characters.filter((x) => x.created && !x.dead);
  return `<section class="card">
    <h3>🧰 Characters</h3>
    ${chars.length ? `<ul class="char-list">${chars.map((x) => `<li><a href="#/characters/${x.id}">
      <b>${BACKGROUNDS.find((b) => b.id === x.background)?.icon || '🪪'} ${esc(x.name)}</b>
      <span class="muted small">L${charLevel(x)} · 🩸 ${x.wounds}/${maxWounds(x)} · 🪙 ${x.chips}c · ${traitsOf(x).map(traitIcon).join('')}</span></a></li>`).join('')}</ul>`
      : '<p class="muted">No characters yet. <a href="#/characters">Make one →</a></p>'}
  </section>`;
}

export function renderHome(el) {
  el.innerHTML = `<div class="page home">
    <div class="page-head">
      <h1>👋 ${esc(session.user.displayName)}</h1>
      <button type="button" class="btn primary" id="home-roll">🎲 Roll 2D6</button>
    </div>
    <div id="home-roll-out"></div>
    ${nameCard()}
    ${importCard()}
    <div class="cols">${campaignsCard()}${charactersCard()}</div>
    <div class="card-grid">
      <a class="card link-card" href="#/rules"><div class="big">📜</div><b>Rules</b><small class="muted">Every rulebook, searchable and cross-linked</small></a>
      <a class="card link-card" href="#/dice"><div class="big">🎲</div><b>Dice Roller</b><small class="muted">Build a pool, see the exact odds, roll</small></a>
      <a class="card link-card" href="#/combat"><div class="big">⚔️</div><b>Attack Calculator</b><small class="muted">Weapon vs armour, To Hit and To Wound</small></a>
    </div>
    ${backupCard()}
  </div>`;
  el.querySelector('#home-roll').onclick = () => {
    el.querySelector('#home-roll-out').innerHTML = renderRoll(roll(0), 'test', { animate: true });
  };
  const done = (res) => {
    toast(`⬆️ Imported ${res.characters.length} character(s)${res.notes ? ` and ${res.notes} note(s)` : ''}`);
    renderHome(el);
  };
  el.onclick = async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'dismiss-local') { dismissLocalSave(); renderHome(el); return; }
    b.disabled = true;
    try {
      if (b.dataset.act === 'import-local') { const res = await importData(pendingLocalSave()); dismissLocalSave(); done(res); }
      if (b.dataset.act === 'export') await downloadBackup();
    } catch (err) {
      toast(`⚠️ ${esc(err.message)}`);
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
      toast(`⚠️ ${esc(err.message)}`);
    }
  };
  el.querySelector('#name-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = new FormData(e.target).get('displayName');
    try {
      session.user = await api('me', { method: 'PATCH', body: { displayName } });
      renderAccount();
      renderHome(el);
      toast('✅ Saved');
    } catch (err) {
      toast(`⚠️ ${esc(err.message)}`);
    }
  });
}
