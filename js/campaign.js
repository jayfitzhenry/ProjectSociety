// Campaigns: the list (join or create), and one campaign's Material, Crew, Notes and People.
// The Campaign tab opens the campaign you used last, so it's one tap from anywhere.
// Hiding things here is for convenience; the API refuses anything a player isn't allowed to do.
import { api } from './api.js';
import {
  state, esc, toast, openCampaign, isDm, crewLevel, charLevel, attachCharacter, addCharacter, freshCrew,
  saveSettings, setTitle, avatar,
} from './store.js';
import { session, refreshUser, renderAccount } from './auth.js';
import { renderCrew } from './crew.js';
import { renderNotes } from './notes.js';
import { renderMaterial } from './material.js';
import { renderNpcs } from './npcs.js';
import { startPolling, materialUnread } from './poll.js';
import { newCharacter, readOnlySheet } from './characters.js';

const enc = encodeURIComponent;
const ROLE = { dm: 'You run it', player: 'Player' };

const TABS = [['material', 'Material'], ['crew', 'Crew'], ['npcs', 'NPCs'], ['notes', 'Notes'], ['people', 'People']];

function header(tab) {
  const camp = state.campaign;
  return `<div class="page-head">
      <div><h1>${esc(camp.name)}</h1><p class="sub">${isDm() ? 'You run this campaign' : 'Player'} · crew level ${crewLevel()}</p></div>
      ${(session.user.campaigns || []).length > 1 ? '<a class="btn quiet" href="#/c/all">Switch</a>' : ''}
    </div>
    <nav class="tabs" aria-label="Campaign sections">${TABS.map(([id, label]) => `<a href="#/c/${enc(camp.id)}/${id}" ${id === tab ? 'aria-current="page"' : ''}>
      ${label}${id === 'material' && materialUnread() ? ' <span class="new-mark">New</span>' : ''}</a>`).join('')}</nav>`;
}

// ---------- the list of campaigns ----------
function hubView() {
  const list = session.user.campaigns || [];
  const u = session.user;
  return `<div class="page">
    <div class="page-head"><div><h1>Campaigns</h1></div></div>
    ${u.nameConfirmed ? '' : `<section class="block">
      <h2>What should other players call you?</h2>
      <form class="form-row" id="name-form" style="margin-top:8px">
        <label class="sr-only" for="dn">Display name</label>
        <input id="dn" name="displayName" maxlength="40" required value="${esc(u.displayName)}">
        <button class="btn primary">Save</button>
      </form>
      <p class="muted small" style="margin-top:8px">Everyone in your campaigns sees this. Change it later in Settings.</p>
    </section>`}
    ${list.length ? `<ul class="rows block">${list.map((c) => `<li><a href="#/c/${enc(c.campaignId)}">${avatar(c.name)}<span class="row-text">
        <span class="row-title">${esc(c.name)}</span><span class="row-meta">${ROLE[c.role] || c.role}</span></span><span class="chev" aria-hidden="true"></span></a></li>`).join('')}</ul>`
      : '<p class="empty">You\'re not in a campaign yet. Ask your DM for a join code, or run one yourself.</p>'}
    <section class="block">
      <h2>Join a campaign</h2>
      <form class="form-row" id="join-form" style="margin-top:8px">
        <label class="sr-only" for="code">Join code</label>
        <input id="code" name="code" maxlength="8" placeholder="Join code" autocomplete="off" autocapitalize="characters" required>
        <button class="btn primary">Join</button>
      </form>
    </section>
    <section class="block">
      <h2>Run a campaign</h2>
      <form class="form-row" id="create-form" style="margin-top:8px">
        <label class="sr-only" for="cname">Campaign name</label>
        <input id="cname" name="name" maxlength="80" placeholder="Ward 9" required>
        <button class="btn">Create</button>
      </form>
    </section>
  </div>`;
}

function bindHub(el) {
  el.onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button');
    btn.disabled = true;
    try {
      if (f.id === 'join-form') {
        const joined = await api('join', { method: 'POST', body: { code: new FormData(f).get('code') } });
        await refreshUser();
        toast(`Joined ${esc(joined.name)}`);
        location.hash = `#/c/${enc(joined.id)}/people`;
      } else if (f.id === 'create-form') {
        const made = await api('campaigns', { method: 'POST', body: { name: String(new FormData(f).get('name')).trim(), crew: freshCrew() } });
        await refreshUser();
        location.hash = `#/c/${enc(made.id)}/people`;
      } else if (f.id === 'name-form') {
        session.user = await api('me', { method: 'PATCH', body: { displayName: new FormData(f).get('displayName') } });
        renderAccount();
        toast('Saved');
        el.innerHTML = hubView();
      }
    } catch (err) {
      toast(esc(err.message));
    } finally {
      btn.disabled = false;
    }
  };
}

// ---------- people ----------
function charLink(c) {
  const label = `${esc(c.name || 'Unnamed')} <span class="muted small">L${charLevel(c)}${c.dead ? ', dead' : ''}</span>`;
  if (c.ownerId === session.user.id) return `<a href="#/characters/${enc(c.id)}">${label}</a>`;
  if (isDm()) return `<a href="#/c/${enc(state.campaign.id)}/people/${enc(c.ownerId)}/${enc(c.id)}">${label}</a>`;
  return `<span>${label}</span>`;
}

function peopleView() {
  const camp = state.campaign;
  const dm = isDm();
  const roster = state.roster || [];
  const mineHere = state.characters.filter((c) => c.campaignId === camp.id);
  const free = state.characters.filter((c) => !c.campaignId);
  return `
    ${dm ? `<section class="block card">
      <h2>Join code</h2>
      <p class="muted small">Players sign in, open Campaign and enter this code.</p>
      <div class="join-code" aria-label="Join code ${esc(camp.joinCode.split('').join(' '))}">${esc(camp.joinCode)}</div>
      <div class="row">
        <button type="button" class="btn" data-act="copy-code">Copy</button>
        <button type="button" class="btn quiet" data-act="new-code">Make a new code</button>
      </div>
      <p class="muted small" style="margin-top:8px">A new code stops the old one working. People already in stay in.</p>
    </section>` : ''}
    <section class="block">
      <h2>${camp.members.length} ${camp.members.length === 1 ? 'person' : 'people'}</h2>
      <ul class="rows" style="margin-top:8px">${camp.members.map((m) => {
        const chars = roster.filter((c) => c.ownerId === m.userId);
        return `<li><div class="row-main" style="flex-wrap:wrap">
          ${avatar(m.displayName)}<span class="row-text" style="flex:1 1 200px"><span class="row-title">${esc(m.displayName)}${m.role === 'dm' ? ' <span class="tag">DM</span>' : ''}${m.userId === session.user.id ? ' <span class="muted small">(you)</span>' : ''}</span>
            <span class="row-meta">${chars.map(charLink).join(' · ') || 'No character yet'}</span></span>
          ${dm && m.role !== 'dm' ? `<button type="button" class="btn quiet danger" data-remove="${esc(m.userId)}" data-name="${esc(m.displayName)}">Remove</button>` : ''}
        </div></li>`;
      }).join('')}</ul>
    </section>
    <section class="block">
      <h2>Your characters here</h2>
      ${mineHere.length ? `<ul class="rows" style="margin-top:8px">${mineHere.map((c) => `<li><a href="#/characters/${enc(c.id)}">${avatar(c.name || 'Unnamed')}<span class="row-text"><span class="row-title">${esc(c.name || 'Unnamed')}</span>
        <span class="row-meta">${c.created ? `Level ${charLevel(c)}` : 'Still being made'}${c.dead ? ' · dead' : ''}</span></span><span class="chev" aria-hidden="true"></span></a></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}
      <div class="row" style="margin-top:16px">
        <button type="button" class="btn primary" data-act="new-char">New character for this campaign</button>
        ${free.length ? `<label class="sr-only" for="attach">Bring a character</label><select id="attach" data-attach style="width:auto"><option value="">Bring a character…</option>${free.map((c) => `<option value="${esc(c.id)}">${esc(c.name || 'Unnamed')}</option>`).join('')}</select>` : ''}
      </div>
    </section>
    ${dm ? `<section class="block">
      <h2>Campaign settings</h2>
      <form class="form-row" id="rename" style="margin-top:8px"><label class="sr-only" for="rn">Campaign name</label><input id="rn" name="name" maxlength="80" value="${esc(camp.name)}" required><button class="btn">Rename</button></form>
      <p class="muted small" style="margin-top:16px">Deleting removes the crew sheet and all the campaign's material. Characters are kept and leave the campaign.</p>
      <button type="button" class="btn danger" data-act="delete-campaign">Delete campaign</button>
    </section>` : `<section class="block">
      <p class="muted small">Your characters leave with you. Nothing is deleted.</p>
      <button type="button" class="btn danger" data-act="leave">Leave campaign</button>
    </section>`}`;
}

function bindPeople(el, rerender) {
  const camp = state.campaign;
  const busy = async (b, fn) => {
    if (b) b.disabled = true;
    try { await fn(); } catch (err) { toast(esc(err.message)); } finally { if (b) b.disabled = false; }
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
        navigator.clipboard?.writeText(camp.joinCode).then(() => toast('Copied'), () => toast(camp.joinCode));
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
        const typed = prompt(`This deletes ${camp.name}, its crew sheet and all its material. Characters are kept.\n\nType the campaign name to confirm:`);
        if (typed === null) return;
        if (typed.trim() !== camp.name) { toast('The name didn\'t match. Nothing was deleted.'); return; }
        busy(b, async () => {
          await api(`campaigns/${enc(camp.id)}`, { method: 'DELETE' });
          state.characters.forEach((c) => { if (c.campaignId === camp.id) c.campaignId = null; });
          state.settings.lastCampaign = null;
          saveSettings();
          await refreshUser();
          location.hash = '#/c/all';
        });
        break;
      }
      case 'leave':
        if (!confirm(`Leave ${camp.name}? Your characters leave with you.`)) return;
        busy(b, async () => {
          await api(`campaigns/${enc(camp.id)}/members/${enc(session.user.id)}`, { method: 'DELETE' });
          state.settings.lastCampaign = null;
          saveSettings();
          await refreshUser();
          location.hash = '#/c/all';
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
      toast(`${esc(c.name || 'Character')} joined`);
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
      toast('Renamed');
      rerender();
    });
  };
}

async function memberSheet(el, [ownerId, charId]) {
  el.innerHTML = '<p class="muted">Opening the sheet…</p>';
  try {
    const c = await api(`campaigns/${enc(state.campaign.id)}/characters/${enc(ownerId)}/${enc(charId)}`);
    el.innerHTML = `<a class="btn quiet back" href="#/c/${enc(state.campaign.id)}/people">Back to people</a>
      <p class="note">Read only. Only ${esc(state.campaign.members.find((m) => m.userId === ownerId)?.displayName || 'the owner')} can change this sheet.</p>
      ${readOnlySheet(c)}`;
  } catch (err) {
    el.innerHTML = `<p class="note bad">${esc(err.message)}</p>`;
  }
}

// ---------- the view ----------
export async function renderCampaign(el, [cid, tab = 'material', ...rest]) {
  const mine = session.user.campaigns || [];
  if (!cid) {
    // The Campaign tab: straight into the last campaign (or the only one).
    const last = mine.find((c) => c.campaignId === state.settings.lastCampaign) || (mine.length === 1 ? mine[0] : null);
    if (last) { location.replace(`#/c/${enc(last.campaignId)}`); return; }
  }
  if (!cid || cid === 'all') {
    setTitle('Campaigns');
    el.innerHTML = hubView();
    bindHub(el);
    return;
  }
  if (tab === 'members') tab = 'people'; // old links
  if (tab === 'feed' || tab === 'stories') tab = 'material';
  if (state.campaign?.id !== cid) el.innerHTML = '<div class="page"><p class="muted">Opening the campaign…</p></div>';
  try {
    await openCampaign(cid, session.user.id);
    await startPolling(cid);
  } catch (err) {
    if (state.settings.lastCampaign === cid) { state.settings.lastCampaign = null; saveSettings(); }
    el.innerHTML = `<div class="page"><p class="note bad">${esc(err.message)}</p><a class="btn" href="#/c/all">All campaigns</a></div>`;
    return;
  }
  if (state.settings.lastCampaign !== cid) { state.settings.lastCampaign = cid; saveSettings(); }
  if (!TABS.some(([id]) => id === tab)) tab = 'material';
  setTitle(state.campaign.name);
  el.innerHTML = `<div class="page campaign">${header(tab)}<div id="campaign-body"></div></div>`;
  const body = el.querySelector('#campaign-body');
  const rerender = () => renderCampaign(el, [cid, tab, ...rest]);
  if (tab === 'material') renderMaterial(body, rest);
  else if (tab === 'crew') renderCrew(body);
  else if (tab === 'npcs') renderNpcs(body, rest);
  else if (tab === 'notes') renderNotes(body, { campaignId: cid });
  else if (tab === 'people' && rest.length === 2 && isDm()) memberSheet(body, rest);
  else { body.innerHTML = peopleView(); bindPeople(body, rerender); }
}

// Keep the "New" mark on the Material tab current.
window.addEventListener('ps:material', () => {
  const a = document.querySelector('.tabs a[href$="/material"]');
  if (a) a.innerHTML = `Material${materialUnread() ? ' <span class="new-mark">New</span>' : ''}`;
});
