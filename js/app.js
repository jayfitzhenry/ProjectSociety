// App shell: sign-in check and the hash router.
import { renderRules } from './rules.js';
import { renderDice } from './dice-view.js';
import { renderCombat } from './combat.js';
import { renderCharacters } from './characters.js';
import { renderCrew } from './crew.js';
import { renderHome } from './home.js';
import { initAuth, signedIn, renderAccount, renderSignIn } from './auth.js';

const app = document.getElementById('app');

const routes = {
  '': renderHome,
  rules: renderRules,
  dice: renderDice,
  combat: renderCombat,
  characters: renderCharacters,
  crew: renderCrew,
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
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
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

await initAuth();
renderAccount();
window.addEventListener('hashchange', route);
route();
