// NPCs: the people the crew meets. The DM keeps a short description, a stat line shaped like the
// enemy table in the Actions rules, wounds filled during a fight, and private notes. Marking an NPC
// "known" shows players its name, role and description. The server strips everything else: this
// view never receives stats or DM notes for a player.
import { api } from './api.js';
import { state, esc, toast, isDm } from './store.js';
import { MAX_WOUNDS } from './data.js';
import { renderMarkdown } from './md.js';

const enc = encodeURIComponent;
const ui = { cid: null, npcs: [], dirty: false, timer: null };

const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
const base = () => `#/c/${enc(state.campaign.id)}/npcs`;
const STATUS = { active: 'Active', dead: 'Dead', gone: 'Gone' };
const term = (t, label = t) => `<button type="button" class="term" data-term="${esc(t)}">${esc(label)}</button>`;

/** "3 wounds · +1 · Heavy blade +2 · Armour −1" */
function statLine(n) {
  return [
    `${n.wounds} wound${n.wounds === 1 ? '' : 's'}${n.hurt ? ` (${n.hurt} filled)` : ''}`,
    `To Hit +${n.toHit}`,
    n.weapon,
    n.armour ? `Armour −${n.armour}` : '',
  ].filter(Boolean).join(' · ');
}

const track = (n) => `<span class="boxes-track${n.hurt >= n.wounds ? ' bad' : ''}" aria-hidden="true">${
  Array.from({ length: n.wounds }, (_, i) => `<i class="${i < n.hurt ? 'on' : ''}"></i>`).join('')}</span>`;

// ---------- lists ----------
function dmList() {
  const active = ui.npcs.filter((n) => n.status === 'active');
  const past = ui.npcs.filter((n) => n.status !== 'active');
  const row = (n) => `<li><a href="${base()}/${enc(n.id)}"><span class="row-text">
      <span class="row-title">${esc(n.name || 'Unnamed')}${n.known ? ' <span class="tag">Known</span>' : ''}${n.status !== 'active' ? ` <span class="tag">${STATUS[n.status]}</span>` : ''}</span>
      ${n.role ? `<span class="row-meta">${esc(n.role)}</span>` : ''}
      <span class="row-meta">${esc(statLine(n))}</span>${n.hurt ? track(n) : ''}</span>
      <span class="chev" aria-hidden="true"></span></a></li>`;
  return `<div class="row spread block"><p class="muted" style="margin:0;flex:1 1 240px">Everyone the crew meets. Only you see stats and DM notes. Mark an NPC as known to show players who they are.</p>
      <button type="button" class="btn primary" data-act="new">New NPC</button></div>
    ${active.length ? `<ul class="rows block">${active.map(row).join('')}</ul>` : '<p class="empty">No NPCs yet. Add the foreman, the fence, the handler, the rival.</p>'}
    ${past.length ? `<details class="sect"><summary>Dead or gone<span class="meta">${past.length}</span></summary><div class="sect-body"><ul class="rows">${past.map(row).join('')}</ul></div></details>` : ''}`;
}

function playerList() {
  if (!ui.npcs.length) return '<p class="empty">Nobody yet. When your DM marks someone the crew has met, they appear here.</p>';
  return ui.npcs.map((n) => `<article class="card npc-card">
      <h2>${esc(n.name || 'Unnamed')}${n.status !== 'active' ? ` <span class="tag">${STATUS[n.status]}</span>` : ''}</h2>
      ${n.role ? `<p class="muted">${esc(n.role)}</p>` : ''}
      ${n.about ? `<div class="md">${renderMarkdown(n.about)}</div>` : ''}
    </article>`).join('');
}

// ---------- the DM's editor ----------
function stepper(field, label, value, shown = value) {
  return `<span class="stepper"><button type="button" data-step="${field}" data-n="-1" aria-label="${label} down">−</button><b>${shown}</b><button type="button" data-step="${field}" data-n="1" aria-label="${label} up">+</button></span>`;
}

function choice(field, label, options, value) {
  return `<div class="seg" role="group" aria-label="${label}">${options.map(([v, text]) => `<button type="button" data-set="${field}" data-v="${v}" aria-pressed="${value === v}">${text}</button>`).join('')}</div>`;
}

function statsView(n) {
  const out = n.hurt >= n.wounds;
  return `<section class="card npc-stats" id="npc-stats">
    <h2>Stats</h2>
    <div class="npc-stat"><span class="npc-k">${term('Wounds')}</span>${stepper('wounds', 'Wounds', n.wounds)}</div>
    <div class="npc-stat"><span class="npc-k">Filled</span>
      <span class="npc-hurt">${track(n)}<span class="${out ? 'bad' : 'muted'} small">${out ? 'Out' : `${n.wounds - n.hurt} left`}</span></span>
      ${stepper('hurt', 'Wounds filled', n.hurt)}</div>
    <div class="npc-stat"><span class="npc-k">${term('To Hit')}</span>${choice('toHit', 'To Hit bonus', [[0, '+0'], [1, '+1'], [2, '+2']], n.toHit)}</div>
    <div class="npc-stat"><span class="npc-k">Armour</span>${choice('armour', 'Armour', [[0, 'None'], [1, '−1'], [2, '−2']], n.armour)}</div>
    <label class="field"><span>Weapon</span><input data-f="weapon" value="${esc(n.weapon)}" maxlength="120" placeholder="Cosh +1, or carbine +1"></label>
    <label class="field"><span>Notes</span><input data-f="notes" value="${esc(n.notes)}" maxlength="500" placeholder="Raises the alarm. Has a talent."></label>
    <p class="muted small" style="margin:0"><a href="#/rules/actions/enemies">Enemy rules</a></p>
  </section>`;
}

function editorView(n) {
  return `<div class="npc-editor">
    <div class="row spread block"><a class="btn quiet back" href="${base()}">All NPCs</a></div>
    <label class="field"><span>Name</span><input class="title-input" data-f="name" id="npc-name" value="${esc(n.name)}" maxlength="80" placeholder="Ada Marsh"></label>
    <label class="field"><span>Role</span><input data-f="role" value="${esc(n.role)}" maxlength="120" placeholder="Foreman at the pump house"></label>
    <label class="field"><span>Description${n.known ? ' (players see this)' : ''}</span><textarea data-f="about" rows="3" maxlength="4000" placeholder="What the crew sees: looks, manner, where to find them">${esc(n.about)}</textarea></label>
    <button type="button" class="switch" role="switch" aria-checked="${n.known ? 'true' : 'false'}" data-act="known">
      <span class="track" aria-hidden="true"></span>
      <span>Known to players<br><span class="muted small">${n.known ? 'Players see the name, role and description.' : 'Only you can see this NPC.'}</span></span>
    </button>
    ${statsView(n)}
    <label class="field"><span>DM notes (only you see these)</span><textarea data-f="secrets" rows="5" maxlength="20000" placeholder="What they want, what they hide, who they answer to">${esc(n.secrets)}</textarea></label>
    <div class="field"><span>Status</span>${choice('status', 'Status', Object.entries(STATUS), n.status)}</div>
    <p class="save-status" id="npc-save" role="status">${ui.dirty ? 'Unsaved changes…' : `Saved ${when(n.updatedAt)}`}</p>
    <div class="row" style="margin-top:24px"><button type="button" class="btn danger" data-act="delete">Delete NPC</button></div>
  </div>`;
}

const FIELDS = ['name', 'role', 'about', 'secrets', 'wounds', 'hurt', 'toHit', 'armour', 'weapon', 'notes', 'status', 'known'];
const bodyOf = (n) => Object.fromEntries(FIELDS.map((k) => [k, n[k]]));

let inflight = null;
/** Save the NPC. Saves run one at a time: each needs the ETag the previous one returned. */
async function saveNpc(n, statusEl) {
  while (inflight) await inflight;
  if (!ui.dirty) return;
  ui.dirty = false;
  inflight = (async () => {
    try {
      const saved = await api(`campaigns/${enc(ui.cid)}/npcs/${enc(n.id)}`, { method: 'PUT', etag: n._etag, body: bodyOf(n) });
      n._etag = saved._etag;
      n.updatedAt = saved.updatedAt;
      if (statusEl?.isConnected && !ui.dirty) statusEl.textContent = `Saved ${when(n.updatedAt)}`;
    } catch (err) {
      ui.dirty = true;
      if (statusEl?.isConnected) {
        statusEl.textContent = err.status === 412 ? 'Someone else changed this. Copy your text, then reload.' : `Not saved: ${err.message}`;
      }
      toast(esc(err.message));
    }
  })();
  try { await inflight; } finally { inflight = null; }
}

// ---------- controller ----------
export async function renderNpcs(el, [nid]) {
  if (ui.cid !== state.campaign.id || !nid) {
    el.innerHTML = '<p class="muted">Opening the NPCs…</p>';
    try {
      ui.npcs = await api(`campaigns/${enc(state.campaign.id)}/npcs`);
      ui.cid = state.campaign.id;
    } catch (err) {
      el.innerHTML = `<p class="note bad">${esc(err.message)}</p>`;
      return;
    }
  }
  if (!isDm()) { el.innerHTML = playerList(); el.onclick = null; return; }

  const n = nid && ui.npcs.find((x) => x.id === nid);
  if (nid && !n) { el.innerHTML = `<p class="note">That NPC isn't here any more. <a href="${base()}">All NPCs</a></p>`; return; }
  if (!n) {
    el.innerHTML = dmList();
    el.oninput = null;
    el.onclick = async (e) => {
      const b = e.target.closest('button[data-act="new"]');
      if (!b) return;
      b.disabled = true;
      try {
        const made = await api(`campaigns/${enc(state.campaign.id)}/npcs`, { method: 'POST', body: { name: '', wounds: 3 } });
        ui.npcs.push(made);
        location.hash = `${base()}/${enc(made.id)}`;
      } catch (err) { b.disabled = false; toast(esc(err.message)); }
    };
    return;
  }

  el.innerHTML = editorView(n);
  if (!n.name) el.querySelector('#npc-name')?.focus();
  const status = () => el.querySelector('#npc-save');
  const schedule = (delay = 1000) => {
    ui.dirty = true;
    if (status()) status().textContent = 'Unsaved changes…';
    clearTimeout(ui.timer);
    ui.timer = setTimeout(() => saveNpc(n, status()), delay);
  };
  const flush = () => { clearTimeout(ui.timer); return saveNpc(n, status()); };
  window.addEventListener('pagehide', flush, { once: true });
  const leave = () => {
    if (el.isConnected && location.hash.startsWith(`${base()}/${enc(n.id)}`)) return;
    flush();
    window.removeEventListener('hashchange', leave);
  };
  window.addEventListener('hashchange', leave);

  // Redraw just the stats card, keeping focus on the button that was pressed.
  const redrawStats = (sel) => {
    el.querySelector('#npc-stats').outerHTML = statsView(n);
    if (sel) el.querySelector(sel)?.focus();
  };

  el.oninput = (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    n[f] = e.target.value;
    schedule();
  };

  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.step) {
      const f = b.dataset.step;
      const d = Number(b.dataset.n);
      if (f === 'wounds') {
        n.wounds = Math.max(1, Math.min(MAX_WOUNDS, n.wounds + d));
        n.hurt = Math.min(n.hurt, n.wounds);
      } else {
        n.hurt = Math.max(0, Math.min(n.wounds, n.hurt + d));
      }
      schedule(400);
      redrawStats(`[data-step="${f}"][data-n="${d}"]`);
      return;
    }
    if (b.dataset.set) {
      const f = b.dataset.set;
      n[f] = f === 'status' ? b.dataset.v : Number(b.dataset.v);
      schedule(400);
      if (f === 'status') {
        el.querySelectorAll('[data-set="status"]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      } else redrawStats(`[data-set="${f}"][data-v="${b.dataset.v}"]`);
      return;
    }
    switch (b.dataset.act) {
      case 'known':
        n.known = !n.known;
        schedule(0);
        await flush();
        el.innerHTML = editorView(n);
        el.querySelector('[data-act="known"]')?.focus();
        toast(n.known ? 'Players can see this NPC' : 'Hidden from players');
        return;
      case 'delete':
        if (!confirm(`Delete ${n.name || 'this NPC'}? This can't be undone.`)) return;
        try {
          clearTimeout(ui.timer);
          ui.dirty = false;
          await api(`campaigns/${enc(ui.cid)}/npcs/${enc(n.id)}`, { method: 'DELETE' });
          ui.npcs = ui.npcs.filter((x) => x.id !== n.id);
          location.hash = base();
        } catch (err) { toast(esc(err.message)); }
        return;
      default:
    }
  };
}
