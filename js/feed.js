// The snippet feed: what the DM has shared, newest first, with an unread marker.
// Polls every 20 seconds while a campaign is open and the tab is visible, and again on focus.
import { api } from './api.js';
import { state, esc, toast, isDm, refreshFromServer } from './store.js';
import { session } from './auth.js';
import { renderMarkdown } from './md.js';

const POLL_MS = 20_000;
const enc = encodeURIComponent;

export const feed = {
  cid: null,
  items: [], // newest first
  since: null, // latest touchedAt seen: the next poll asks for anything after it
  lastReadAt: null, // the server's read marker
  seenBefore: null, // marker when the feed was opened, so "new" badges stay while reading
};
let timer = null;

const latest = (list) => list.reduce((m, s) => (s.touchedAt > m ? s.touchedAt : m), feed.since || '');
const sortItems = () => feed.items.sort((a, b) => b.sharedAt.localeCompare(a.sharedAt));

export const unreadCount = () => feed.items.filter((s) => s.sharedAt > (feed.lastReadAt || '') && s.sharedBy !== session.user?.id).length;
const isNew = (s) => s.sharedAt > (feed.seenBefore || '') && s.sharedBy !== session.user?.id;

export async function loadFeed(cid) {
  const res = await api(`campaigns/${enc(cid)}/snippets`);
  feed.cid = cid;
  feed.items = res.snippets;
  feed.lastReadAt = res.lastReadAt;
  feed.seenBefore = res.lastReadAt;
  feed.since = latest(res.snippets) || null;
  sortItems();
}

async function pollOnce() {
  if (!feed.cid || document.hidden) return;
  const cid = feed.cid;
  try {
    const res = await api(`campaigns/${enc(cid)}/poll${feed.since ? `?since=${enc(feed.since)}` : ''}`);
    if (feed.cid !== cid) return;
    feed.lastReadAt = res.lastReadAt;
    if (res.snippets.length) {
      res.snippets.forEach((s) => {
        const i = feed.items.findIndex((x) => x.id === s.id);
        if (i >= 0) feed.items[i] = s; else feed.items.push(s);
      });
      feed.since = latest(res.snippets);
      sortItems();
      window.dispatchEvent(new CustomEvent('ps:feed'));
    }
    // The crew sheet changed: pick it up, unless something local is still waiting to be saved.
    if (state.campaign?.id === cid && res.crewEtag && res.crewEtag !== state.campaign.crewEtag) {
      if (await refreshFromServer(session.user.id)) window.dispatchEvent(new CustomEvent('ps:remote'));
    }
  } catch {
    // Offline for a moment: the next poll tries again.
  }
}

const onVisible = () => { if (!document.hidden) pollOnce(); };

/** Start polling a campaign (no-op if it's already the one being polled). */
export async function startPolling(cid) {
  if (feed.cid === cid && timer) return;
  stopPolling();
  await loadFeed(cid);
  timer = setInterval(pollOnce, POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', pollOnce);
}

export function stopPolling() {
  clearInterval(timer);
  timer = null;
  feed.cid = null;
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('focus', pollOnce);
}

async function markRead() {
  if (!unreadCount()) return;
  try {
    feed.lastReadAt = (await api(`campaigns/${enc(feed.cid)}/read`, { method: 'POST' })).lastReadAt;
    window.dispatchEvent(new CustomEvent('ps:feed-read'));
  } catch {
    // Not important enough to bother the player.
  }
}

// ---------- sharing (DM) ----------
const players = () => (state.campaign?.members || []).filter((m) => m.role !== 'dm');

function audiencePicker(current = 'all') {
  const some = Array.isArray(current);
  return `<fieldset class="audience">
    <legend>Who sees it</legend>
    <label class="radio"><input type="radio" name="aud" value="all" ${some ? '' : 'checked'}> 👥 Everyone in the campaign</label>
    <label class="radio"><input type="radio" name="aud" value="some" ${some ? 'checked' : ''}> 🎯 Only…</label>
    <div class="chips audience-people">${players().map((m) => `<label class="chip toggle-chip"><input type="checkbox" name="who" value="${esc(m.userId)}" ${some && current.includes(m.userId) ? 'checked' : ''}> ${esc(m.displayName)}</label>`).join('') || '<span class="muted small">No players have joined yet.</span>'}</div>
  </fieldset>`;
}

function readAudience(form) {
  if (form.querySelector('[name="aud"]:checked')?.value !== 'some') return 'all';
  return [...form.querySelectorAll('[name="who"]:checked')].map((x) => x.value);
}

export function shareFormHtml({ title = '', body = '' } = {}) {
  return `<form class="card share-form" id="share-form">
    <h3>📣 Share with players</h3>
    <input name="title" class="title-input" maxlength="200" placeholder="Title (optional)" value="${esc(title)}">
    <textarea name="body" rows="6" required placeholder="What the players see. Markdown works.">${esc(body)}</textarea>
    ${audiencePicker()}
    <div class="actions">
      <button class="btn primary">📣 Share</button>
      <button type="button" class="btn ghost" data-act="cancel-share">Cancel</button>
    </div>
  </form>`;
}

/** Wire up a share form. Resolves with the new snippet, or null if cancelled. */
export function bindShareForm(form, { storyId = null } = {}) {
  return new Promise((resolve) => {
    form.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="cancel-share"]')) { e.stopPropagation(); resolve(null); }
    });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'who' && e.target.checked) form.querySelector('[name="aud"][value="some"]').checked = true;
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const audience = readAudience(form);
      if (Array.isArray(audience) && !audience.length) { toast('Pick at least one player, or share with everyone.'); return; }
      const btn = form.querySelector('button.primary');
      btn.disabled = true;
      try {
        const s = await api(`campaigns/${enc(state.campaign.id)}/snippets`, {
          method: 'POST', body: { storyId, title: form.title.value, body: form.body.value, audience },
        });
        if (feed.cid === state.campaign.id) { feed.items.unshift(s); feed.since = latest([s]); }
        toast('📣 Shared');
        resolve(s);
      } catch (err) {
        btn.disabled = false;
        toast(`⚠️ ${esc(err.message)}`);
      }
    });
  });
}

// ---------- the feed view ----------
const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function audienceLabel(s) {
  if (!isDm()) return s.shared === 'all' ? '👥 Shared with everyone' : '🎯 Shared with you';
  if (s.audience === 'all') return '👥 Everyone';
  const names = s.audience.map((id) => state.campaign.members.find((m) => m.userId === id)?.displayName || 'someone who left');
  return `🎯 ${names.map(esc).join(', ')}`;
}

function snippetCard(s, ui) {
  const editing = ui.audienceFor === s.id;
  return `<article class="card snippet ${isNew(s) ? 'unread' : ''}" data-id="${esc(s.id)}">
    <header>
      ${isNew(s) ? '<span class="new-dot" title="New">New</span>' : ''}
      ${s.title ? `<h3>${esc(s.title)}</h3>` : ''}
      <div class="muted small">${when(s.sharedAt)} · ${audienceLabel(s)}${s.editedAt && s.editedAt !== s.sharedAt ? ' · edited' : ''}</div>
    </header>
    <div class="md snippet-body">${renderMarkdown(s.body)}</div>
    ${isDm() ? (editing ? `<form class="audience-form" data-id="${esc(s.id)}">${audiencePicker(s.audience)}
        <div class="actions"><button class="btn small primary">Save</button><button type="button" class="btn small ghost" data-act="cancel-aud">Cancel</button></div></form>`
      : `<div class="actions small no-print">
        <button type="button" class="btn small" data-act="audience" data-id="${esc(s.id)}">🎯 Change who sees it</button>
        <button type="button" class="btn small danger" data-act="unshare" data-id="${esc(s.id)}">Unshare</button>
      </div>`) : ''}
  </article>`;
}

export function renderFeed(el) {
  const ui = { sharing: false, audienceFor: null };
  const draw = () => {
    el.innerHTML = `
      ${isDm() ? (ui.sharing ? shareFormHtml() : `<div class="actions"><button type="button" class="btn primary" data-act="share-new">✍️ Share something new</button>
        <a class="btn" href="#/c/${enc(state.campaign.id)}/stories">📖 From a story</a></div>`) : ''}
      ${feed.items.length ? feed.items.map((s) => snippetCard(s, ui)).join('')
        : `<section class="card empty"><p>📭 Nothing shared yet.</p><p class="muted">${isDm()
          ? 'Share a scene, a handout or a rumour with everyone, or with chosen players.'
          : 'When your DM shares scenes, handouts or secrets with you, they appear here.'}</p></section>`}`;
    if (ui.sharing) {
      const form = el.querySelector('#share-form');
      form.querySelector('textarea').focus();
      bindShareForm(form).then(() => { ui.sharing = false; draw(); });
    }
  };
  draw();
  // Reading the feed marks it read; the "New" badges stay until you leave.
  setTimeout(markRead, 1500);

  const onFeed = () => { if (el.isConnected && !ui.sharing && !ui.audienceFor) { draw(); setTimeout(markRead, 1500); } };
  window.addEventListener('ps:feed', onFeed);
  const cleanup = () => { if (!el.isConnected) { window.removeEventListener('ps:feed', onFeed); window.removeEventListener('hashchange', cleanup); } };
  window.addEventListener('hashchange', cleanup);

  el.onclick = async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const s = feed.items.find((x) => x.id === b.dataset.id);
    switch (b.dataset.act) {
      case 'share-new': ui.sharing = true; draw(); return;
      case 'audience': ui.audienceFor = s.id; draw(); return;
      case 'cancel-aud': ui.audienceFor = null; draw(); return;
      case 'unshare':
        if (!confirm('Unshare this? Players stop seeing it. The story it came from is untouched.')) return;
        try {
          await api(`campaigns/${enc(state.campaign.id)}/snippets/${enc(s.id)}`, { method: 'DELETE' });
          feed.items = feed.items.filter((x) => x.id !== s.id);
          draw();
        } catch (err) { toast(`⚠️ ${esc(err.message)}`); }
        return;
      default:
    }
  };
  el.onsubmit = async (e) => {
    if (!e.target.classList.contains('audience-form')) return;
    e.preventDefault();
    const audience = readAudience(e.target);
    if (Array.isArray(audience) && !audience.length) { toast('Pick at least one player, or share with everyone.'); return; }
    try {
      const saved = await api(`campaigns/${enc(state.campaign.id)}/snippets/${enc(e.target.dataset.id)}`, { method: 'PATCH', body: { audience } });
      feed.items = feed.items.map((x) => (x.id === saved.id ? saved : x));
      sortItems();
      ui.audienceFor = null;
      toast('🎯 Updated');
      draw();
    } catch (err) { toast(`⚠️ ${esc(err.message)}`); }
  };
}
