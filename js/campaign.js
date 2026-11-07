// A campaign: the shared crew sheet, your notes, members. The DM also gets the join code and member controls.
// Hiding things here is for convenience; the API refuses anything a player isn't allowed to do.
import { api } from './api.js';
import {
  state, esc, toast, openCampaign, isDm, crewLevel, charLevel, attachCharacter, addCharacter,
} from './store.js';
import { session, refreshUser } from './auth.js';
import { renderCrew } from './crew.js';
import { renderNotes } from './notes.js';
import { renderFeed, startPolling, unreadCount } from './feed.js';
import { renderStories } from './stories.js';
import { newCharacter, readOnlySheet } from './characters.js';
import { BACKGROUNDS } from './data.js';

const enc = encodeURIComponent;

function tabsFor() {
  return [
    ['feed', '📣', 'Feed'],
    ['crew', '🏠', 'Crew'],
    ['notes', '📝', 'Notes'],
    ...(isDm() ? [['stories', '📖', 'Stories']] : []),
    ['members', '👥', isDm() ? 'Members' : 'People'],
  ];
}

const badge = () => { const n = unreadCount(); return n ? `<span class="badge" aria-label="${n} unread">${n}</span>` : ''; };

function updateBadge() {
  const a = document.querySelector('.subtabs a[data-tab="feed"]');
  if (a) a.innerHTML = `<span class="ti">📣</span><span class="tt">Feed</span>${badge()}`;
}
window.addEventListener('ps:feed', updateBadge);
window.addEventListener('ps:feed-read', updateBadge);

function header(tab) {
  const camp = state.campaign;
  return `<div class="page-head campaign-head">
      <div><h1>${esc(camp.name)}</h1>
      <div class="muted">${isDm() ? '🎭 You run this campaign' : '🧑 Player'} · crew level ${crewLevel()}</div></div>
    </div>
    <nav class="subtabs" aria-label="Campaign sections">${tabsFor().map(([id, icon, label]) => `<a href="#/c/${enc(camp.id)}/${id}" data-tab="${id}" class="${id === tab ? 'on' : ''}"><span class="ti">${icon}</span><span class="tt">${label}</span>${id === 'feed' ? badge() : ''}</a>`).join('')}</nav>`;
}

// ---------- members ----------
function charLink(c) {
  const bg = BACKGROUNDS.find((b) => b.id === c.background);
  const label = `${c.dead ? '⚰️' : bg?.icon || '🪪'} ${esc(c.name || 'Unnamed')} <span class="muted small">L${charLevel(c)}</span>`;
  if (c.ownerId === session.user.id) return `<a href="#/characters/${enc(c.id)}">${label}</a>`;
  if (isDm()) return `<a href="#/c/${enc(state.campaign.id)}/members/${enc(c.ownerId)}/${enc(c.id)}">${label}</a>`;
  return `<span>${label}</span>`;
}

function membersView() {
  const camp = state.campaign;
  const dm = isDm();
  const roster = state.roster || [];
  const mineHere = state.characters.filter((c) => c.campaignId === camp.id);
  const free = state.characters.filter((c) => !c.campaignId);
  return `
    ${dm ? `<section class="card">
      <h3>🔑 Join code</h3>
      <p class="muted small">Players sign in, choose <b>Join campaign</b> and enter this code.</p>
      <div class="join-code">${esc(camp.joinCode)}</div>
      <div class="actions">
        <button type="button" class="btn small" data-act="copy-code">📋 Copy</button>
        <button type="button" class="btn small" data-act="new-code">🔄 New code</button>
      </div>
      <p class="muted small">A new code stops the old one working. People already in stay in.</p>
    </section>` : ''}
    <section class="card">
      <h3>👥 ${camp.members.length} ${camp.members.length === 1 ? 'person' : 'people'}</h3>
      <ul class="member-list">${camp.members.map((m) => {
        const chars = roster.filter((c) => c.ownerId === m.userId);
        return `<li>
          <div><b>${esc(m.displayName)}</b> ${m.role === 'dm' ? '<span class="tag">🎭 DM</span>' : ''}${m.userId === session.user.id ? ' <span class="muted small">(you)</span>' : ''}
            <div class="member-chars">${chars.map(charLink).join(' · ') || '<span class="muted small">No character yet</span>'}</div></div>
          ${dm && m.role !== 'dm' ? `<button type="button" class="btn small danger" data-remove="${esc(m.userId)}" data-name="${esc(m.displayName)}">Remove</button>` : ''}
        </li>`;
      }).join('')}</ul>
    </section>
    <section class="card">
      <h3>🧰 Your characters here</h3>
      ${mineHere.length ? `<ul class="char-list">${mineHere.map((c) => `<li><a href="#/characters/${enc(c.id)}"><b>${esc(c.name || 'Unnamed')}</b><span class="muted small">${c.created ? `Level ${charLevel(c)}` : '✏️ In creation'}${c.dead ? ' · ⚰️ dead' : ''}</span></a></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}
      <div class="actions">
        <button type="button" class="btn primary" data-act="new-char">➕ New character for this campaign</button>
        ${free.length ? `<select data-attach aria-label="Bring a character"><option value="">Bring a character…</option>${free.map((c) => `<option value="${esc(c.id)}">${esc(c.name || 'Unnamed')}</option>`).join('')}</select>` : ''}
      </div>
    </section>
    ${dm ? `<section class="card">
      <h3>⚙️ Campaign</h3>
      <form class="form-row" id="rename"><input name="name" maxlength="80" value="${esc(camp.name)}" aria-label="Campaign name" required><button class="btn">Rename</button></form>
      <div class="actions"><button type="button" class="btn danger" data-act="delete-campaign">🗑️ Delete campaign</button></div>
      <p class="muted small">Deleting removes the crew sheet and everything shared in it. Characters are kept and leave the campaign.</p>
    </section>` : `<section class="card">
      <div class="actions"><button type="button" class="btn danger" data-act="leave">🚪 Leave campaign</button></div>
      <p class="muted small">Your characters leave with you. Nothing is deleted.</p>
    </section>`}`;
}

function bindMembers(el, rerender) {
  const camp = state.campaign;
  const busy = async (b, fn) => {
    if (b) b.disabled = true;
    try { await fn(); } catch (err) { toast(`⚠️ ${esc(err.message)}`); } finally { if (b) b.disabled = false; }
  };
  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.remove) {
      if (!confirm(`Remove ${b.dataset.name} from ${camp.name}? Their characters leave the campaign but aren't deleted.`)) return;
      busy(b, async () => {
        await api(`campaigns/${enc(camp.id)}/members/${enc(b.dataset.remove)}`, { method: 'DELETE' });
        await openCampaign(camp.id, session.user.id, { force: true });
        toast('Removed');
        rerender();
      });
      return;
    }
    switch (b.dataset.act) {
      case 'copy-code':
        navigator.clipboard?.writeText(camp.joinCode).then(() => toast('📋 Copied'), () => toast(camp.joinCode));
        break;
      case 'new-code':
        if (!confirm('Make a new join code? The current one stops working.')) return;
        busy(b, async () => {
          camp.joinCode = (await api(`campaigns/${enc(camp.id)}/join-code`, { method: 'POST' })).joinCode;
          rerender();
        });
        break;
      case 'new-char':
        busy(b, async () => {
          const c = await addCharacter(newCharacter());
          await attachCharacter(c, camp.id);
          location.hash = `#/characters/${enc(c.id)}`;
        });
        break;
      case 'delete-campaign': {
        const typed = prompt(`This deletes ${camp.name}, its crew sheet and everything shared in it. Characters are kept.\n\nType the campaign name to confirm:`);
        if (typed === null) return;
        if (typed.trim() !== camp.name) { toast('Name didn\'t match. Nothing deleted.'); return; }
        busy(b, async () => {
          await api(`campaigns/${enc(camp.id)}`, { method: 'DELETE' });
          state.characters.forEach((c) => { if (c.campaignId === camp.id) c.campaignId = null; });
          await refreshUser();
          location.hash = '#/';
        });
        break;
      }
      case 'leave':
        if (!confirm(`Leave ${camp.name}? Your characters leave with you.`)) return;
        busy(b, async () => {
          await api(`campaigns/${enc(camp.id)}/members/${enc(session.user.id)}`, { method: 'DELETE' });
          await refreshUser();
          location.hash = '#/';
          location.reload(); // characters changed on the server
        });
        break;
      default:
    }
  };
  el.onchange = (e) => {
    if (e.target.dataset.attach === undefined || !e.target.value) return;
    const c = state.characters.find((x) => x.id === e.target.value);
    busy(e.target, async () => {
      await attachCharacter(c, camp.id);
      await openCampaign(camp.id, session.user.id, { force: true });
      toast(`🏠 ${esc(c.name || 'Character')} joined`);
      rerender();
    });
  };
  el.onsubmit = (e) => {
    if (e.target.id !== 'rename') return;
    e.preventDefault();
    const name = new FormData(e.target).get('name');
    busy(e.target.querySelector('button'), async () => {
      camp.name = (await api(`campaigns/${enc(camp.id)}`, { method: 'PATCH', body: { name } })).name;
      await refreshUser();
      toast('✅ Renamed');
      rerender();
    });
  };
}

async function memberSheet(el, [ownerId, charId]) {
  el.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const c = await api(`campaigns/${enc(state.campaign.id)}/characters/${enc(ownerId)}/${enc(charId)}`);
    el.innerHTML = `<p class="callout">👁️ Read-only. Only ${esc(state.campaign.members.find((m) => m.userId === ownerId)?.displayName || 'the owner')} can change this sheet.</p>
      <a class="btn small" href="#/c/${enc(state.campaign.id)}/members">← Members</a>
      ${readOnlySheet(c)}`;
  } catch (err) {
    el.innerHTML = `<p class="callout bad">⚠️ ${esc(err.message)}</p>`;
  }
}

// ---------- the view ----------
export async function renderCampaign(el, [cid, tab = 'feed', ...rest]) {
  if (!cid) { location.hash = '#/'; return; }
  if (state.campaign?.id !== cid) el.innerHTML = '<div class="page"><p class="muted">Loading campaign…</p></div>';
  try {
    await openCampaign(cid, session.user.id);
    await startPolling(cid);
  } catch (err) {
    el.innerHTML = `<div class="page"><section class="card empty">
      <p>⚠️ ${esc(err.message)}</p>
      <a class="btn" href="#/">← Home</a></section></div>`;
    return;
  }
  if (!tabsFor().some(([id]) => id === tab)) tab = 'feed';
  el.innerHTML = `<div class="page campaign">${header(tab)}<div id="campaign-body"></div></div>`;
  const body = el.querySelector('#campaign-body');
  const rerender = () => renderCampaign(el, [cid, tab, ...rest]);
  if (tab === 'feed') renderFeed(body);
  else if (tab === 'stories') renderStories(body, rest);
  else if (tab === 'crew') renderCrew(body);
  else if (tab === 'notes') renderNotes(body, { campaignId: cid });
  else if (tab === 'members' && rest.length === 2 && isDm()) memberSheet(body, rest);
  else { body.innerHTML = membersView(); bindMembers(body, rerender); }
}
