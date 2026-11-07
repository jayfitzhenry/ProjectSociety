// Campaign material. The DM writes segments (a session, a location, a handout); each segment has
// sections marked "DM only", "Players" (everyone) or "Chosen" (some players), and one switch that
// shares it with the campaign. Players see shared segments with only the sections meant for them.
// The server strips the rest: this view never receives them for a player.
import { api } from './api.js';
import { state, esc, toast, isDm, uid } from './store.js';
import { renderMarkdown } from './md.js';
import { htmlToMarkdown } from './html-md.js';
import { poll, markMaterialRead } from './poll.js';

const enc = encodeURIComponent;
// mode: 'rich' (formatted editor), 'source' (the markdown itself) or 'preview' (as players see it).
// New lines in the rich editor are paragraphs (Chrome would make divs).
document.execCommand('defaultParagraphSeparator', false, 'p');
const ui = { cid: null, segs: [], mode: 'rich', dirty: false, timer: null, range: null };

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

const PLACEHOLDER = { players: 'Read aloud', some: 'A secret', dm: 'What’s really going on' };
const FORMATS = [['bold', 'B', 'Bold'], ['italic', 'I', 'Italic'], ['heading', 'H', 'Heading'],
  ['ul', 'List', 'Bulleted list'], ['ol', 'Numbered', 'Numbered list'], ['quote', 'Quote', 'Quote']];

/** The section's text: a formatted editor (stored as markdown) or the markdown itself. */
function bodyEditor(x, i) {
  const label = BODY_LABEL[x.audience] || BODY_LABEL.dm;
  if (ui.mode === 'source') {
    return `<label class="field"><span>${label}</span>
      <textarea data-sf="body" rows="8" placeholder="Markdown works: **bold**, *italic*, - lists, # headings">${esc(x.body)}</textarea></label>`;
  }
  return `<div class="field"><span id="sb-${i}">${label}</span>
    <div class="fmt-bar" role="group" aria-label="Formatting for section ${i + 1}">
      ${FORMATS.map(([f, text, name]) => `<button type="button" class="fmt fmt-${f}" data-fmt="${f}" aria-label="${name}" title="${name}">${text}</button>`).join('')}
    </div>
    <div class="rich md" data-sf="body" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="sb-${i}"
      data-placeholder="Write here, or paste from an AI chat or a document: formatting comes with it.">${renderMarkdown(x.body)}</div></div>`;
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
    <label class="field"><span>Section title</span><input data-sf="title" value="${esc(x.title)}" maxlength="200" placeholder="${PLACEHOLDER[x.audience] || ''}"></label>
    ${bodyEditor(x, i)}
  </fieldset>`;
}

function editorView(s) {
  return `<div class="seg-editor">
    <div class="row spread block">
      <a class="btn quiet back" href="${base()}">All material</a>
      <div class="seg" role="group" aria-label="View">
        <button type="button" data-act="edit" aria-pressed="${ui.mode === 'rich'}">Edit</button>
        <button type="button" data-act="source" aria-pressed="${ui.mode === 'source'}">Markdown</button>
        <button type="button" data-act="preview" aria-pressed="${ui.mode === 'preview'}">Player view</button>
      </div>
    </div>
    ${ui.mode === 'preview' ? readView(s, true) : `
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
  ui.mode = ui.mode === 'source' ? 'source' : 'rich';
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

  const secOf = (node) => s.sections[Number(node.closest('[data-i]').dataset.i)];
  const syncRich = (ed) => { secOf(ed).body = htmlToMarkdown(ed); schedule(); };

  // Pasted or dropped content arrives as clean markdown, then shows formatted. Rich text (an AI chat,
  // a document, a web page) brings its formatting; plain text is read as markdown, so an AI tool's
  // "copy" button works too.
  const insertFrom = (e, data) => {
    const ed = e.target.closest?.('.rich');
    if (!ed || !data) return;
    const html = data.getData('text/html');
    const text = data.getData('text/plain');
    if (!html && !text) return;
    e.preventDefault();
    if (e.type === 'drop') {
      const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
      if (range) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range); }
    }
    const md = html ? htmlToMarkdown(window.DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true, FORBID_TAGS: ['style', 'form', 'input', 'button', 'svg', 'math'] })) : text;
    if (!md.trim()) return;
    if (!md.includes('\n') && !html && !/[*_`#>[~|\\]|^\s*([-+]|\d+[.)])\s/.test(md)) {
      document.execCommand('insertText', false, md);
    } else {
      let out = renderMarkdown(md).trim();
      if (!md.includes('\n')) out = out.replace(/^<p>([\s\S]*)<\/p>$/, '$1'); // one line stays inside the paragraph
      document.execCommand('insertHTML', false, out);
    }
    syncRich(ed);
  };
  el.onpaste = (e) => insertFrom(e, e.clipboardData);
  el.ondrop = (e) => insertFrom(e, e.dataTransfer);

  // Formatting buttons act on the editor's selection: keep it when a button is pressed, and remember it
  // when focus leaves (a keyboard user tabs to the buttons).
  el.onmousedown = (e) => { if (e.target.closest('[data-fmt]')) e.preventDefault(); };
  el.onfocusout = (e) => {
    if (!e.target.classList?.contains('rich')) return;
    const sel = getSelection();
    ui.range = sel.rangeCount && e.target.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
  };
  const format = (ed, f) => {
    if (document.activeElement !== ed) {
      ed.focus();
      const sel = getSelection();
      sel.removeAllRanges();
      if (ui.range && ed.contains(ui.range.startContainer)) sel.addRange(ui.range);
      else { const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); sel.addRange(r); }
    }
    const sel = getSelection();
    const at = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement;
    const inside = (sel2) => { const b = at?.closest(sel2); return b && ed.contains(b) ? b : null; };
    if (f === 'bold' || f === 'italic') document.execCommand(f);
    else if (f === 'ul') document.execCommand('insertUnorderedList');
    else if (f === 'ol') document.execCommand('insertOrderedList');
    else if (f === 'heading') document.execCommand('formatBlock', false, inside('h1,h2,h3,h4,h5,h6') ? '<p>' : '<h3>');
    else if (f === 'quote') {
      const q = inside('blockquote');
      if (q) { q.replaceWith(...q.childNodes); } else document.execCommand('formatBlock', false, '<blockquote>');
    }
    syncRich(ed);
  };

  // Enter on an empty line of a quote leaves the quote, as it does in a list.
  el.onkeydown = (e) => {
    const ed = e.target.closest?.('.rich');
    if (!ed || e.key !== 'Enter' || e.shiftKey) return;
    const node = getSelection().anchorNode;
    const q = (node?.nodeType === 1 ? node : node?.parentElement)?.closest('blockquote');
    if (!q || !ed.contains(q) || q.textContent.trim()) return;
    e.preventDefault();
    const para = document.createElement('p');
    para.append(document.createElement('br'));
    q.replaceWith(para);
    const r = document.createRange(); r.setStart(para, 0); r.collapse(true);
    getSelection().removeAllRanges(); getSelection().addRange(r);
    syncRich(ed);
  };

  el.oninput = (e) => {
    if (e.target.classList?.contains('rich')) { syncRich(e.target); return; }
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
    if (b.dataset.fmt) { format(sec.querySelector('.rich'), b.dataset.fmt); return; }
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
      case 'edit': ui.mode = 'rich'; draw(); return;
      case 'source': ui.mode = 'source'; draw(); return;
      case 'preview': ui.mode = 'preview'; draw(); return;
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
