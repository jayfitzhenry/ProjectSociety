// App shell: sign-in check and the hash router.
import { renderRules } from './rules.js';
import { renderDice } from './dice-view.js';
import { renderCombat } from './combat.js';
import { renderCharacters } from './characters.js';
import { renderCampaign } from './campaign.js';
import { renderHome } from './home.js';
import { initAuth, signedIn, renderAccount, renderSignIn, session } from './auth.js';
import { loadCharacters, refreshFromServer, sync, esc } from './store.js';

const app = document.getElementById('app');

const routes = {
  '': renderHome,
  rules: renderRules,
  dice: renderDice,
  combat: renderCombat,
  characters: renderCharacters,
  c: renderCampaign,
  crew: (el) => { location.hash = '#/'; },
  signin: renderSignIn,
};

// Usable without an account. Everything else needs sign-in (and the API checks again).
const PUBLIC = new Set(['rules', 'dice', 'combat', 'signin']);

let lastRoute = '';
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const [name, ...rest] = parts;
  let view = routes[name] || renderHome;
  if (!signedIn() && !PUBLIC.has(name)) view = renderSignIn;
  if (signedIn() && name === 'signin') view = renderHome;
  const tabName = name === 'c' ? '' : name;
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tabName));
  // Clear handlers left by the previous view.
  const sameRulesDoc = name === 'rules' && lastRoute.startsWith(`rules/${rest[0] || ''}`) && rest[0];
  if (!sameRulesDoc) {
    app.onclick = null; app.onchange = null; app.oninput = null; app.onsubmit = null;
    window.scrollTo(0, 0);
  }
  lastRoute = parts.join('/');
  document.body.dataset.view = name || 'home';
  document.body.classList.toggle('signed-out', !signedIn());
  view(app, rest);
}

window.addEventListener('ps:signedout', () => {
  location.hash = '#/signin';
  location.reload();
});

// Save status in the header, and the conflict banner.
function renderSync() {
  const el = document.getElementById('sync');
  if (el) {
    const label = { saved: '☁️ Saved', saving: '⏳ Saving…', error: '⚠️ Not saved', conflict: '⚠️ Conflict' }[sync.status];
    el.textContent = signedIn() ? label : '';
    el.title = sync.message || '';
    el.className = `sync ${sync.status}`;
  }
  const banner = document.getElementById('banner');
  const show = sync.status === 'conflict' || sync.status === 'error';
  banner.hidden = !show;
  if (show) {
    banner.innerHTML = `<span>${sync.status === 'conflict' ? '⚠️' : '📡'} ${esc(sync.message)}</span>
      <button type="button" class="btn small" data-act="reload">${sync.status === 'conflict' ? 'Reload' : 'Retry'}</button>`;
  }
}
document.getElementById('banner').onclick = (e) => {
  if (!e.target.closest('[data-act="reload"]')) return;
  if (sync.status === 'conflict') location.reload();
  else import('./store.js').then((m) => m.flushNow());
};
window.addEventListener('ps:sync', renderSync);

// Something changed underneath the current view (a merged save): redraw unless the player is typing.
window.addEventListener('ps:remote', () => {
  const a = document.activeElement;
  if (!a || !['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) route();
});

// Coming back to the app: pick up what others changed (DM awards, the crew sheet, crewmates).
let refreshing = false;
async function refresh() {
  if (!signedIn() || refreshing || document.hidden) return;
  refreshing = true;
  try {
    if (await refreshFromServer(session.user.id)) window.dispatchEvent(new CustomEvent('ps:remote'));
  } catch {
    // Offline or signed out: the next save or action will say so.
  } finally {
    refreshing = false;
  }
}
window.addEventListener('focus', refresh);
document.addEventListener('visibilitychange', refresh);

await initAuth();
if (session.user) {
  try {
    await loadCharacters();
  } catch (e) {
    session.error = e;
    session.user = null;
  }
}
renderAccount();
renderSync();
window.addEventListener('hashchange', route);
route();
