// App shell: sign-in check, the hash router and the bottom navigation.
import { renderRules } from './rules.js';
import { renderSheet, renderCharacters } from './characters.js';
import { renderCampaign } from './campaign.js';
import { stopPolling } from './poll.js';
import { renderSearch } from './search.js';
import { renderMarket } from './market.js';
import { RULE_DOCS } from './data.js';
import { renderAccountPage } from './account.js';
import { initPeek, closePeek } from './peek.js';
import { initAuth, signedIn, renderAccount, renderSignIn, session } from './auth.js';
import { loadCharacters, refreshFromServer, sync, esc, setTitle } from './store.js';

const app = document.getElementById('app');

const routes = {
  sheet: renderSheet,
  characters: renderCharacters,
  rules: renderRules,
  search: renderSearch,
  market: renderMarket,
  c: renderCampaign,
  account: renderAccountPage,
  signin: renderSignIn,
};

// Usable without an account. Everything else needs sign-in (and the API checks again).
const PUBLIC = new Set(['rules', 'search', 'market', 'signin', 'account']);
// Which bottom-nav destination each route belongs to.
const TAB = { sheet: 'sheet', characters: 'sheet', market: 'market', rules: 'rules', c: 'c', search: 'search' };
// Pages in the World group (the lore) belong to the Lore tab, not Rules.
const LORE = new Set(RULE_DOCS.filter((d) => d.group === 'world').map((d) => d.id));
const tabOf = (name, rest) => (name === 'rules' && LORE.has(rest[0]) ? 'lore' : TAB[name]);

let lastRoute = null;
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  let [name, ...rest] = parts;
  // Old links: the dice and combat tools became the Dice Modifiers page.
  if (name === 'dice' || name === 'combat') { location.replace('#/rules/dice_modifiers'); return; }
  // Old links: World History became the History section of the Lore page.
  if (name === 'rules' && rest[0] === 'world_history') { location.replace('#/rules/lore/history'); return; }
  if (name === 'lore') { location.replace(`#/rules/lore${rest[0] ? `/${rest[0]}` : ''}`); return; }
  if (!name) name = signedIn() ? 'sheet' : 'rules';
  let view = routes[name];
  if (!view) { name = signedIn() ? 'sheet' : 'rules'; view = routes[name]; }
  if (!signedIn() && !PUBLIC.has(name)) view = renderSignIn;
  if (signedIn() && name === 'signin') { name = 'sheet'; view = renderSheet; }
  if (name !== 'c') stopPolling();
  closePeek(false);

  const tab = tabOf(name, rest);
  document.querySelectorAll('[data-tab]').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  // Moving within one rules page (to a section) keeps the page and its handlers.
  const samePage = name === 'rules' && lastRoute?.[0] === 'rules' && rest[0] && lastRoute[1] === rest[0];
  if (!samePage) {
    app.onclick = null; app.onchange = null; app.oninput = null; app.onsubmit = null;
    window.scrollTo(0, 0);
    // Screen readers: announce the new page by moving focus to it (not on the first load).
    if (lastRoute) app.focus({ preventScroll: true });
  }
  lastRoute = [name, ...rest];
  document.body.dataset.view = name;
  setTitle('Project Society');
  view(app, rest);
}

window.addEventListener('ps:signedout', () => {
  location.hash = '#/signin';
  location.reload();
});

// Save status in the top bar, and the conflict banner.
function renderSync() {
  const el = document.getElementById('sync');
  if (el) {
    el.textContent = signedIn() ? { saved: 'Saved', saving: 'Saving…', error: 'Not saved', conflict: 'Conflict' }[sync.status] : '';
    el.title = sync.message || '';
    el.className = `sync ${sync.status}`;
  }
  const banner = document.getElementById('banner');
  const show = sync.status === 'conflict' || sync.status === 'error';
  banner.hidden = !show;
  if (show) {
    banner.innerHTML = `<span>${esc(sync.message)}</span>
      <button type="button" class="btn" data-act="reload">${sync.status === 'conflict' ? 'Reload' : 'Try again'}</button>`;
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
  if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) return;
  if (/\/(material|notes)\//.test(location.hash)) return; // editors: nothing there depends on it
  if (document.querySelector('.peek')) return; // don't pull the page out from under an open sheet
  lastRoute = null;
  route();
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
initPeek();
renderAccount();
renderSync();
window.addEventListener('hashchange', route);
route();
