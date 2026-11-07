// Campaign material. The DM writes segments (a session, a location, a handout); each segment has
// sections marked "DM only", "Players" (everyone) or "Chosen" (some players), and one switch that
// shares it with the campaign. Players see shared segments with only the sections meant for them.
// The server strips the rest: this view never receives them for a player.
import { api } from './api.js';
import { state, esc, toast, isDm, uid } from './store.js';
import { renderMarkdown } from './md.js';
import { poll, markMaterialRead } from './poll.js';

const enc = encodeURIComponent;
const ui = { cid: null, segs: [], preview: false, dirty: false, timer: null };

const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
const base = () => `#/c/${enc(state.campaign.id)}/material`;
/** Sections at least one player can see once the segment is shared. */
const forSomeone = (x) => x.audience === 'players' || (x.audience === 'some' && x.to?.length > 0);
const playerCount = (s) => s.sections.filter(forSomeone).length;
const players = () => (state.campaign?.members || []).filter((m) => m.role !== 'dm');
const nameOf = (id) => players().find((m) => m.userId === id)?.displayName || 'Someone who left';
const chosenNames = (x) => (x.to || []).map(nameOf).join(', ');

/** New or changed since this player last looked. */
function freshness(s) {
  if (isDm() || !poll.seenBefore) return isDm() ? '' : 'New';
  if (s.playersAt <= poll.seenBefore) return '';
  return s.createdAt > poll.seenBefore ? 'New' : 'Updated';
}

// ---------- lists ----------
function listView() {
  const dm = isDm();
  const live = ui.segs.filter((s) => s.status !== 'archived');
  const archived = ui.segs.filter((s) => s.status === 'archived');
  const row = (s) => {
    const fresh = freshness(s);
    const meta = dm
      ? `${s.shared ? 'Shared' : 'Private'} · ${s.sections.length} section${s.sections.length === 1 ? '' : 's'}${s.shared ? `, ${playerCount(s)} for players` : ''}`
      : `${s.sections.length} section${s.sections.length === 1 ? '' : 's'} · ${when(s.playersAt)}`;
    return `<li><a href="${base()}/${enc(s.id)}"><span class="row-text"><span class="row-title">${esc(s.title || 'Untitled')}</span><span class="row-meta">${meta}</span></span>
      ${fresh ? `<span class="new-mark">${fresh}</span>` : '<span class="chev" aria-hidden="true"></span>'}</a></li>`;
  };
  return `${dm ? `<div class="row spread block"><p class="muted" style="margin:0;flex:1 1 240px">Write your material in segments. Mark each section for you, for the players or for chosen players, then share the segment.</p>
      <button type="button" class="btn primary" data-act="new">New segment</button></div>` : ''}
    ${live.length ? `<ul class="rows block">${live.map(row).join('')}</ul>`
      : `<p class="empty">${dm ? 'No segments yet. Start with this session’s notes, a location or a handout.' : 'Nothing shared yet. When your DM shares a scene, a handout or a secret, it appears here.'}</p>`}
    ${dm && archived.length ? `<details class="sect"><summary>Archived<span class="meta">${archived.length}</span></summary><div class="sect-body"><ul class="rows">${archived.map(row).join('')}</ul></div></details>` : ''}`;
}

// ---------- reading (players, and the DM's preview) ----------
function readView(s, asPlayer) {
  // A player's copy holds only their sections (no audience). The DM's preview filters its own.
  const sections = asPlayer ? s.sections.filter((x) => !x.audience || forSomeone(x)) : s.sections;
  const label = (x) => {
    if (x.forYou) return '<p class="label">Just for you</p>';
    if (x.audience === 'some') return `<p class="label">Only ${esc(chosenNames(x))}</p>`;
    if (x.audience === 'dm') return '<p class="label">DM only</p>';
    return '';
  };
  return `<article class="segment-view">
    <h2 style="margin-top:0">${esc(s.title || 'Untitled')}</h2>
    <p class="muted small">${asPlayer && isDm() ? 'What players see. ' : ''}${when(s.playersAt || s.updatedAt)}</p>
    ${sections.length ? sections.map((x) => `<section class="${x.audience === 'dm' ? 'dm-section' : ''}">
      ${x.title ? `<h2>${esc(x.title)}</h2>` : ''}${label(x)}
      <div class="md">${renderMarkdown(x.body) || '<p class="muted">Empty.</p>'}</div></section>`).join('')
      : '<p class="muted">Nothing for players in this segment yet.</p>'}
  </article>`;
}

// ---------- the DM's editor ----------
const BODY_LABEL = { dm: 'Only you see this', players: 'Players will see this', some: 'Only the chosen players see this' };

/** The checklist of players for a "Chosen" section. Anyone already chosen who has left stays listed. */
function chosenEditor(x, i) {
  const ids = [...new Set([...players().map((m) => m.userId), ...(x.to || [])])];
  if (!ids.length) return '<p class="note small">No players have joined yet. Share the join code from People.</p>';
  return `<fieldset class="chosen"><legend>Who sees section ${i + 1}</legend>
    ${ids.map((id) => `<label class="check"><input type="checkbox" data-to="${esc(id)}" ${(x.to || []).includes(id) ? 'checked' : ''}><span>${esc(nameOf(id))}</span></label>`).join('')}
  </fieldset>`;
}

function sectionEditor(x, i, n) {
  return `<fieldset class="section-ed" data-i="${i}">
    <legend class="sr-only">Section ${i + 1}</legend>
    <div class="row spread">
      <div class="seg" role="group" aria-label="Who sees section ${i + 1}">
        <button type="button" data-aud="dm" aria-pressed="${x.audience === 'dm'}">DM only</button>
        <button type="button" data-aud="players" aria-pressed="${x.audience === 'players'}">Players</button>
        <button type="button" data-aud="some" aria-pressed="${x.audience === 'some'}">Chosen</button>
      </div>
      <span class="row">
        <button type="button" class="icon-btn" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move section ${i + 1} up">↑</button>
        <button type="button" class="icon-btn" data-move="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Move section ${i + 1} down">↓</button>
        <button type="button" class="btn quiet danger" data-delsec aria-label="Delete section ${i + 1}">Delete</button>
      </span>
    </div>
    ${x.audience === 'some' ? chosenEditor(x, i) : ''}
    <label class="field"><span>Section title</span><input data-sf="title" value="${esc(x.title)}" maxlength="200" placeholder="${{ players: 'Read aloud', some: 'A secret', dm: 'What’s really going on' }[x.audience] || ''}"></label>
    <label class="field"><span>${BODY_LABEL[x.audience] || BODY_LABEL.dm}</span>
      <textarea data-sf="body" rows="8" placeholder="Markdown works: **bold**, *italic*, - lists, # headings">${esc(x.body)}</textarea></label>
  </fieldset>`;
}

function editorView(s) {
  return `<div class="seg-editor">
    <div class="row spread block">
      <a class="btn quiet back" href="${base()}">All material</a>
      <div class="seg" role="group" aria-label="View">
        <button type="button" data-act="edit" aria-pressed="${!ui.preview}">Edit</button>
        <button type="button" data-act="preview" aria-pressed="${ui.preview}">As players see it</button>
      </div>
    </div>
    ${ui.preview ? readView(s, true) : `
    <label class="field"><span>Segment title</span><input class="title-input" id="seg-title" value="${esc(s.title)}" maxlength="200" placeholder="Session 3: the pump house"></label>
    <button type="button" class="switch" role="switch" aria-checked="${s.shared ? 'true' : 'false'}" data-act="share">
      <span class="track" aria-hidden="true"></span>
      <span>Shared with players<br><span class="muted small">${s.shared ? `Players see the ${playerCount(s)} section${playerCount(s) === 1 ? '' : 's'} marked Players or Chosen.` : 'Only you can see this segment.'}</span></span>
    </button>
    ${s.sections.map((x, i) => sectionEditor(x, i, s.sections.length)).join('')}
    <div class="row" style="padding:16px 0;border-top:1px solid var(--line)">
      <button type="button" class="btn" data-addsec="dm">Add a DM section</button>
      <button type="button" class="btn" data-addsec="players">Add a player section</button>
    </div>`}
    <p class="save-status" id="seg-status" role="status">${ui.dirty ? 'Unsaved changes…' : `Saved ${when(s.updatedAt)}`}</p>
    <div class="row" style="margin-top:24px">
      <button type="button" class="btn" data-act="archive">${s.status === 'archived' ? 'Unarchive' : 'Archive'}</button>
      <button type="button" class="btn danger" data-act="delete">Delete segment</button>
    </div>
  </div>`;
}

let inflight = null;
/** Save the segment. Saves run one at a time: each needs the ETag the previous one returned. */
async function saveSeg(s, statusEl) {
  while (inflight) await inflight;
  if (!ui.dirty) return;
  ui.dirty = false;
  inflight = putSeg(s, statusEl);
  try { await inflight; } finally { inflight = null; }
}

async function putSeg(s, statusEl) {
  try {
    const saved = await api(`campaigns/${enc(ui.cid)}/stories/${enc(s.id)}`, {
      method: 'PUT', etag: s._etag, body: { title: s.title, sections: s.sections, status: s.status, shared: s.shared },
    });
    s._etag = saved._etag;
    s.updatedAt = saved.updatedAt;
    s.playersAt = saved.playersAt;
    if (statusEl?.isConnected && !ui.dirty) statusEl.textContent = `Saved ${when(s.updatedAt)}`;
  } catch (err) {
    ui.dirty = true;
    if (statusEl?.isConnected) {
      statusEl.textContent = err.status === 412 ? 'Someone else changed this. Copy your text, then reload.' : `Not saved: ${err.message}`;
    }
    toast(esc(err.message));
  }
}

// ---------- controller ----------
export async function renderMaterial(el, [sid]) {
  if (ui.cid !== state.campaign.id || !sid) {
    el.innerHTML = '<p class="muted">Opening the material…</p>';
    try {
      ui.segs = await api(`campaigns/${enc(state.campaign.id)}/stories`);
      ui.cid = state.campaign.id;
    } catch (err) {
      el.innerHTML = `<p class="note bad">${esc(err.message)}</p>`;
      return;
    }
  }
  const s = sid && ui.segs.find((x) => x.id === sid);
  if (sid && !s) { el.innerHTML = `<p class="note">That segment isn't here any more. <a href="${base()}">All material</a></p>`; return; }

  if (!s || !isDm()) {
    el.innerHTML = s ? `<a class="btn quiet back" href="${base()}">All material</a>${readView(s, true)}` : listView();
    if (!isDm()) setTimeout(markMaterialRead, 1500);
    el.onclick = async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'new') {
        b.disabled = true;
        try {
          const made = await api(`campaigns/${enc(state.campaign.id)}/stories`, {
            method: 'POST', body: { title: '', shared: false, sections: [{ id: uid(), title: '', body: '', audience: 'dm' }] },
          });
          ui.segs.push(made);
          location.hash = `${base()}/${enc(made.id)}`;
        } catch (err) { b.disabled = false; toast(esc(err.message)); }
      }
    };
    // Something new arrived while reading the list: show it.
    const onMaterial = async (e) => {
      if (!el.isConnected || sid || !e.detail?.fresh) return;
      try { ui.segs = await api(`campaigns/${enc(state.campaign.id)}/stories`); el.innerHTML = listView(); } catch { /* next time */ }
    };
    window.addEventListener('ps:material', onMaterial);
    const cleanup = () => { window.removeEventListener('ps:material', onMaterial); window.removeEventListener('hashchange', cleanup); };
    window.addEventListener('hashchange', cleanup);
    return;
  }

  // The DM's editor. Players may have joined since the campaign opened: the Chosen lists need them.
  try {
    const fresh = await api(`campaigns/${enc(state.campaign.id)}`);
    if (fresh?.members && state.campaign?.id === ui.cid) state.campaign.members = fresh.members;
  } catch { /* the list we have will do */ }
  if (!el.isConnected || !location.hash.startsWith(`${base()}/${enc(s.id)}`)) return;
  ui.preview = false;
  const draw = () => { el.innerHTML = editorView(s); };
  draw();
  const status = () => el.querySelector('#seg-status');
  const schedule = () => {
    ui.dirty = true;
    if (status()) status().textContent = 'Unsaved changes…';
    clearTimeout(ui.timer);
    ui.timer = setTimeout(() => saveSeg(s, status()), 1200);
  };
  const flush = () => { clearTimeout(ui.timer); return saveSeg(s, status()); };
  window.addEventListener('pagehide', flush, { once: true });
  const leave = () => {
    if (el.isConnected && location.hash.startsWith(`${base()}/${enc(s.id)}`)) return;
    flush();
    window.removeEventListener('hashchange', leave);
  };
  window.addEventListener('hashchange', leave);

  el.oninput = (e) => {
    if (e.target.id === 'seg-title') { s.title = e.target.value; schedule(); return; }
    if (e.target.dataset.to) {
      const x = s.sections[Number(e.target.closest('[data-i]').dataset.i)];
      const to = new Set(x.to || []);
      if (e.target.checked) to.add(e.target.dataset.to); else to.delete(e.target.dataset.to);
      x.to = [...to];
      schedule();
      return;
    }
    const f = e.target.dataset.sf;
    if (f) { s.sections[Number(e.target.closest('[data-i]').dataset.i)][f] = e.target.value; schedule(); }
  };

  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const sec = b.closest('[data-i]');
    const i = sec ? Number(sec.dataset.i) : -1;
    if (b.dataset.aud) {
      const x = s.sections[i];
      x.audience = b.dataset.aud;
      if (x.audience === 'some') x.to = x.to || []; else delete x.to;
      schedule(); draw();
      el.querySelector(`[data-i="${i}"] [data-aud="${x.audience}"]`)?.focus();
      return;
    }
    if (b.dataset.move) {
      const j = i + Number(b.dataset.move);
      [s.sections[i], s.sections[j]] = [s.sections[j], s.sections[i]];
      schedule(); draw();
      el.querySelector(`[data-i="${j}"] [data-move="${b.dataset.move}"]`)?.focus();
      return;
    }
    if (b.dataset.delsec !== undefined) {
      const x = s.sections[i];
      if ((x.body || x.title) && !confirm(`Delete the section “${x.title || 'Untitled'}”?`)) return;
      s.sections.splice(i, 1);
      schedule(); draw();
      return;
    }
    if (b.dataset.addsec) {
      s.sections.push({ id: uid(), title: '', body: '', audience: b.dataset.addsec });
      schedule(); draw();
      el.querySelector(`[data-i="${s.sections.length - 1}"] input`)?.focus();
      return;
    }
    switch (b.dataset.act) {
      case 'edit': ui.preview = false; draw(); return;
      case 'preview': ui.preview = true; draw(); return;
      case 'share':
        if (!s.shared && !playerCount(s) && !confirm('No section is marked Players or for chosen players yet, so players won’t see anything. Share anyway?')) return;
        s.shared = !s.shared;
        schedule(); await flush(); draw();
        toast(s.shared ? 'Shared with players' : 'Players can no longer see this');
        return;
      case 'archive':
        s.status = s.status === 'archived' ? 'draft' : 'archived';
        schedule(); await flush(); draw();
        return;
      case 'delete':
        if (!confirm(`Delete “${s.title || 'Untitled'}” and all its sections? Players stop seeing it too.`)) return;
        try {
          clearTimeout(ui.timer);
          ui.dirty = false;
          await api(`campaigns/${enc(ui.cid)}/stories/${enc(s.id)}`, { method: 'DELETE' });
          ui.segs = ui.segs.filter((x) => x.id !== s.id);
          location.hash = base();
        } catch (err) { toast(esc(err.message)); }
        return;
      default:
    }
  };
}
