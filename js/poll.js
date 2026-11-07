// While a campaign is open: check every 20 seconds (and when the app comes back into view)
// whether the crew sheet changed or the DM shared new material.
import { api } from './api.js';
import { state, isDm, refreshFromServer } from './store.js';
import { session } from './auth.js';

const POLL_MS = 20_000;
const enc = encodeURIComponent;

export const poll = {
  cid: null,
  materialAt: null, // when players' material last changed
  lastReadAt: null, // this member's read marker on the server
  seenBefore: null, // the marker when the material was opened, so "New" stays while reading
};
let timer = null;

/** New or changed material this player hasn't looked at yet. */
export const materialUnread = () => !isDm() && !!poll.materialAt && poll.materialAt > (poll.lastReadAt || '');

/** Update the unread marks. `fresh`: the material itself changed (not just the read marker). */
function showBadge(fresh) {
  const a = document.querySelector('.bottomnav a[data-tab="c"] .nav-icon');
  a?.classList.toggle('badge-dot', materialUnread());
  window.dispatchEvent(new CustomEvent('ps:material', { detail: { fresh } }));
}

async function pollOnce() {
  if (!poll.cid || document.hidden) return;
  const cid = poll.cid;
  try {
    const res = await api(`campaigns/${enc(cid)}/poll`);
    if (poll.cid !== cid) return;
    const changed = res.materialAt !== poll.materialAt;
    poll.materialAt = res.materialAt;
    poll.lastReadAt = res.lastReadAt;
    if (changed) showBadge(true);
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
  if (poll.cid === cid && timer) return;
  stopPolling();
  poll.cid = cid;
  poll.lastReadAt = state.campaign?.me?.lastReadAt || null;
  poll.seenBefore = poll.lastReadAt;
  await pollOnce();
  timer = setInterval(pollOnce, POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', pollOnce);
}

export function stopPolling() {
  clearInterval(timer);
  timer = null;
  poll.cid = null;
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('focus', pollOnce);
}

/** The player has seen the material: move their read marker. */
export async function markMaterialRead() {
  if (!materialUnread()) return;
  try {
    poll.lastReadAt = (await api(`campaigns/${enc(poll.cid)}/read`, { method: 'POST' })).lastReadAt;
    showBadge(false);
  } catch {
    // Not important enough to bother the player.
  }
}
