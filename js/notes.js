// Private notes. Only their owner can ever read them (the API enforces it).
import { api } from './api.js';
import { esc, toast } from './store.js';
import { renderMarkdown } from './md.js';

const ui = { notes: [], openId: null, preview: false, scope: null };

const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function listView() {
  return `<div class="row spread block"><p class="muted" style="margin:0;flex:1 1 240px">Only you can see your notes.</p>
      <button type="button" class="btn primary" data-act="new-note">New note</button></div>
    ${ui.notes.length ? `<ul class="rows">${ui.notes.map((n) => `<li><button type="button" class="row-main" data-open="${n.id}">
      <span class="row-text"><span class="row-title">${esc(n.title || 'Untitled')}</span><span class="row-meta">${when(n.updatedAt)}</span></span><span class="chev" aria-hidden="true"></span></button></li>`).join('')}</ul>`
      : '<p class="empty">No notes yet. Jot down names, leads, debts, anything you want to remember.</p>'}`;
}

function editorView(n) {
  return `<div class="row spread block">
      <button type="button" class="btn quiet back" data-act="back">All notes</button>
      <div class="seg" role="group" aria-label="View"><button type="button" data-act="write" aria-pressed="${!ui.preview}">Write</button><button type="button" data-act="preview" aria-pressed="${ui.preview}">Preview</button></div>
    </div>
    <label class="field"><span>Title</span><input class="title-input" id="note-title" value="${esc(n.title)}" maxlength="200"></label>
    ${ui.preview ? `<div class="md block">${renderMarkdown(n.body) || '<p class="muted">Nothing yet.</p>'}</div>`
      : `<label class="field"><span>Note</span><textarea id="note-body" rows="14" placeholder="Markdown works: **bold**, *italic*, - lists, # headings">${esc(n.body)}</textarea></label>`}
    <div class="row">
      <button type="button" class="btn primary" data-act="save-note">Save</button>
      <button type="button" class="btn danger" data-act="delete-note">Delete</button>
      <span class="save-status" id="note-status" role="status">${n.updatedAt ? `Saved ${when(n.updatedAt)}` : ''}</span>
    </div>`;
}

/** Render the notes for a scope ({ campaignId } or {}) into el. */
export async function renderNotes(el, scope = {}) {
  ui.scope = scope;
  ui.openId = null;
  el.innerHTML = '<p class="muted">Opening your notes…</p>';
  try {
    const q = scope.campaignId ? `?campaignId=${encodeURIComponent(scope.campaignId)}` : '';
    ui.notes = await api(`notes${q}`);
  } catch (e) {
    el.innerHTML = `<p class="note bad">${esc(e.message)}</p>`;
    return;
  }
  const current = () => ui.notes.find((n) => n.id === ui.openId);
  // Keep what's typed in the editor on the note object between redraws.
  const capture = () => {
    const n = current();
    if (!n) return;
    const t = el.querySelector('#note-title');
    const b = el.querySelector('#note-body');
    if (t) n.title = t.value;
    if (b) n.body = b.value;
  };
  const draw = () => { el.innerHTML = current() ? editorView(current()) : listView(); };
  draw();

  el.onclick = async (e) => {
    const open = e.target.closest('[data-open]');
    if (open) { ui.openId = open.dataset.open; ui.preview = false; draw(); return; }
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const n = current();
    switch (b.dataset.act) {
      case 'new-note': {
        b.disabled = true;
        try {
          const made = await api('notes', { method: 'POST', body: { title: '', body: '', campaignId: scope.campaignId || null } });
          ui.notes.unshift(made);
          ui.openId = made.id;
          ui.preview = false;
          draw();
          el.querySelector('#note-title')?.focus();
        } catch (err) { b.disabled = false; toast(esc(err.message)); }
        return;
      }
      case 'back': capture(); ui.openId = null; draw(); return;
      case 'write': capture(); ui.preview = false; draw(); return;
      case 'preview': capture(); ui.preview = true; draw(); return;
      case 'save-note': {
        capture();
        b.disabled = true;
        try {
          const saved = await api(`notes/${encodeURIComponent(n.id)}`, { method: 'PUT', etag: n._etag, body: { title: n.title, body: n.body, campaignId: n.campaignId, characterId: n.characterId } });
          Object.assign(n, saved);
          ui.notes.sort((a, z) => z.updatedAt.localeCompare(a.updatedAt));
          toast('Saved');
          draw();
        } catch (err) {
          b.disabled = false;
          toast(esc(err.message));
        }
        return;
      }
      case 'delete-note':
        if (!confirm(`Delete "${n.title || 'Untitled'}"?`)) return;
        try {
          await api(`notes/${encodeURIComponent(n.id)}`, { method: 'DELETE' });
          ui.notes = ui.notes.filter((x) => x.id !== n.id);
          ui.openId = null;
          draw();
        } catch (err) { toast(esc(err.message)); }
        return;
      default:
    }
  };
}
