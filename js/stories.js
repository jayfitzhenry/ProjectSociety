// The DM's stories: session notes, scenes, handouts. Never shown to players; share parts as snippets.
import { api } from './api.js';
import { state, esc, toast } from './store.js';
import { renderMarkdown } from './md.js';
import { feed, shareFormHtml, bindShareForm } from './feed.js';

const enc = encodeURIComponent;
const ui = { cid: null, stories: [], preview: false, sharing: null, dirty: false, saving: null, timer: null, sel: '' };

const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const base = () => `#/c/${enc(state.campaign.id)}/stories`;

function listView() {
  const drafts = ui.stories.filter((s) => s.status !== 'archived');
  const archived = ui.stories.filter((s) => s.status === 'archived');
  const item = (s) => `<li><a href="${base()}/${enc(s.id)}"><b>${esc(s.title || 'Untitled')}</b><span class="muted small">${when(s.updatedAt)}</span></a></li>`;
  return `<section class="card">
      <div class="page-head"><h3>📖 Stories <small class="muted">only you can see these</small></h3>
        <button type="button" class="btn primary small" data-act="new-story">➕ New story</button></div>
      ${drafts.length ? `<ul class="char-list">${drafts.map(item).join('')}</ul>`
        : '<p class="muted">Write session notes, scenes and handouts here, then share the parts your players should see.</p>'}
    </section>
    ${archived.length ? `<details class="card"><summary>🗄️ Archived (${archived.length})</summary><ul class="char-list">${archived.map(item).join('')}</ul></details>` : ''}`;
}

function editorView(s) {
  const shared = feed.items.filter((x) => x.storyId === s.id);
  return `<section class="card story-editor">
    <div class="page-head">
      <a class="btn small ghost" href="${base()}">← All stories</a>
      <div class="seg small"><button type="button" class="${ui.preview ? '' : 'on'}" data-act="write">✏️ Write</button><button type="button" class="${ui.preview ? 'on' : ''}" data-act="preview">👁️ Preview</button></div>
    </div>
    <input class="title-input" id="story-title" value="${esc(s.title)}" placeholder="Title" maxlength="200">
    ${ui.preview ? `<div class="md preview">${renderMarkdown(s.body) || '<p class="muted">Nothing yet.</p>'}</div>`
      : `<textarea id="story-body" rows="18" placeholder="Write in markdown. Select a passage and press Share selection to send it to players.">${esc(s.body)}</textarea>`}
    <div class="actions">
      <button type="button" class="btn primary" data-act="share-sel">📣 Share selection</button>
      <button type="button" class="btn" data-act="share-new">✍️ Share a new block</button>
      <span class="muted small" id="story-status">${ui.dirty ? 'Unsaved changes…' : `Saved ${when(s.updatedAt)}`}</span>
    </div>
    <div id="share-slot"></div>
    <div class="actions small">
      <button type="button" class="btn small" data-act="archive">${s.status === 'archived' ? '📤 Unarchive' : '🗄️ Archive'}</button>
      <button type="button" class="btn small danger" data-act="delete-story">🗑️ Delete</button>
    </div>
  </section>
  ${shared.length ? `<section class="card"><h3>📣 Shared from this story</h3><ul class="plain">${shared.map((x) => `<li>${esc(x.title || x.body.slice(0, 80))} <span class="muted small">${when(x.sharedAt)}</span></li>`).join('')}</ul>
    <a class="btn small" href="#/c/${enc(state.campaign.id)}/feed">Manage in the feed →</a></section>` : ''}`;
}

async function save(s, statusEl) {
  if (!ui.dirty) return;
  ui.dirty = false;
  try {
    const saved = await api(`campaigns/${enc(ui.cid)}/stories/${enc(s.id)}`, {
      method: 'PUT', etag: s._etag, body: { title: s.title, body: s.body, status: s.status },
    });
    s._etag = saved._etag;
    s.updatedAt = saved.updatedAt;
    if (statusEl?.isConnected && !ui.dirty) statusEl.textContent = `Saved ${when(s.updatedAt)}`;
  } catch (err) {
    ui.dirty = true;
    if (statusEl?.isConnected) statusEl.textContent = err.status === 412 ? '⚠️ Changed elsewhere. Copy your text, then reload.' : `⚠️ Not saved: ${err.message}`;
    toast(`⚠️ ${esc(err.message)}`);
  }
}

export async function renderStories(el, [sid]) {
  if (ui.cid !== state.campaign.id || !sid) {
    el.innerHTML = '<p class="muted">Loading stories…</p>';
    try {
      ui.stories = await api(`campaigns/${enc(state.campaign.id)}/stories`);
      ui.cid = state.campaign.id;
    } catch (err) {
      el.innerHTML = `<p class="callout bad">⚠️ ${esc(err.message)}</p>`;
      return;
    }
  }
  const s = sid && ui.stories.find((x) => x.id === sid);
  if (sid && !s) { el.innerHTML = `<p class="callout">Story not found. <a href="${base()}">All stories</a></p>`; return; }
  ui.sharing = null;
  const draw = () => {
    el.innerHTML = s ? editorView(s) : listView();
    if (s && ui.sharing !== null) {
      const slot = el.querySelector('#share-slot');
      slot.innerHTML = shareFormHtml({ title: s.title, body: ui.sharing });
      slot.querySelector('textarea').focus();
      bindShareForm(slot.querySelector('form'), { storyId: s.id }).then(() => { ui.sharing = null; draw(); });
    }
  };
  draw();
  if (!s) {
    el.onclick = async (e) => {
      const b = e.target.closest('[data-act="new-story"]');
      if (!b) return;
      b.disabled = true;
      try {
        const made = await api(`campaigns/${enc(state.campaign.id)}/stories`, { method: 'POST', body: { title: '', body: '' } });
        ui.stories.unshift(made);
        location.hash = `${base()}/${enc(made.id)}`;
      } catch (err) { b.disabled = false; toast(`⚠️ ${esc(err.message)}`); }
    };
    return;
  }

  // Autosave a moment after typing stops, and when leaving the page.
  const status = () => el.querySelector('#story-status');
  const schedule = () => {
    ui.dirty = true;
    if (status()) status().textContent = 'Unsaved changes…';
    clearTimeout(ui.timer);
    ui.timer = setTimeout(() => save(s, status()), 1500);
  };
  const flush = () => { clearTimeout(ui.timer); save(s, status()); };
  window.addEventListener('pagehide', flush, { once: true });
  // Remember the selection: on phones, tapping a button can clear it.
  const remember = () => {
    const t = el.querySelector('#story-body');
    if (t && document.activeElement === t) ui.sel = t.value.slice(t.selectionStart, t.selectionEnd);
  };
  document.addEventListener('selectionchange', remember);
  const leave = () => {
    if (el.isConnected && location.hash.startsWith(`${base()}/${enc(s.id)}`)) return;
    flush();
    window.removeEventListener('hashchange', leave);
    document.removeEventListener('selectionchange', remember);
  };
  window.addEventListener('hashchange', leave);

  el.oninput = (e) => {
    if (e.target.id === 'story-title') { s.title = e.target.value; schedule(); }
    if (e.target.id === 'story-body') { s.body = e.target.value; schedule(); }
  };

  el.onclick = async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    switch (b.dataset.act) {
      case 'write': ui.preview = false; draw(); return;
      case 'preview': flush(); ui.preview = true; draw(); return;
      case 'share-sel': {
        const t = el.querySelector('#story-body');
        const sel = t ? t.value.slice(t.selectionStart, t.selectionEnd) : '';
        const text = (sel || ui.sel).trim();
        if (!text) { toast('Select some text in the story first, or use Share a new block.'); return; }
        flush();
        ui.sharing = text; draw(); return;
      }
      case 'share-new': flush(); ui.sharing = ''; draw(); return;
      case 'archive':
        s.status = s.status === 'archived' ? 'draft' : 'archived';
        ui.dirty = true;
        await save(s, status());
        draw();
        return;
      case 'delete-story':
        if (!confirm(`Delete "${s.title || 'Untitled'}"? Snippets already shared from it stay shared.`)) return;
        try {
          clearTimeout(ui.timer);
          ui.dirty = false;
          await api(`campaigns/${enc(ui.cid)}/stories/${enc(s.id)}`, { method: 'DELETE' });
          ui.stories = ui.stories.filter((x) => x.id !== s.id);
          location.hash = base();
        } catch (err) { toast(`⚠️ ${esc(err.message)}`); }
        return;
      default:
    }
  };
}
