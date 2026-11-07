// Sign-in state, the sign-in page and the account corner of the header.
// Static Web Apps handles the actual sign-in; /.auth/me says who is signed in.
import { api } from './api.js';
import { esc } from './store.js';

export const session = { principal: null, user: null, error: null };

export async function initAuth() {
  try {
    const r = await fetch('/.auth/me', { cache: 'no-store', credentials: 'same-origin' });
    if (r.ok) session.principal = (await r.json()).clientPrincipal || null;
  } catch {
    // No auth endpoint (e.g. a plain local web server): treat as signed out.
  }
  if (!session.principal) return;
  try {
    session.user = await api('me');
  } catch (e) {
    session.error = e;
  }
}

export const signedIn = () => !!session.user;

/** Is this user a DM in any campaign? */
export const isDmAnywhere = () => (session.user?.campaigns || []).some((c) => c.role === 'dm');

function loginUrl(provider) {
  // Come back to the page they were trying to reach.
  const back = location.hash && location.hash !== '#/signin' ? `/${location.hash}` : '/';
  return `/.auth/login/${provider}?post_login_redirect_uri=${encodeURIComponent(back)}`;
}

export function renderAccount() {
  const el = document.getElementById('account');
  if (!el) return;
  el.innerHTML = session.user
    ? `<span id="sync" class="sync"></span><span class="who" title="Signed in with ${session.user.provider === 'aad' ? 'Microsoft' : 'GitHub'}">👤 <span>${esc(session.user.displayName)}</span></span>
       <a class="signout" href="/.auth/logout?post_logout_redirect_uri=/">Sign out</a>`
    : '<a class="signout" href="#/signin">Sign in</a>';
  window.dispatchEvent(new CustomEvent('ps:sync'));
}

export function renderSignIn(el) {
  if (session.principal && session.error) {
    el.innerHTML = `<div class="page signin"><section class="card signin-card">
      <h1>🎲 Project Society</h1>
      <p class="callout">⚠️ You're signed in, but the server didn't answer: ${esc(session.error.message)}</p>
      <div class="actions"><button type="button" class="btn primary" data-act="retry">Try again</button>
      <a class="btn" href="/.auth/logout?post_logout_redirect_uri=/">Sign out</a></div>
    </section></div>`;
    el.onclick = (e) => { if (e.target.closest('[data-act="retry"]')) location.reload(); };
    return;
  }
  el.innerHTML = `<div class="page signin"><section class="card signin-card">
    <h1>🎲 Project Society</h1>
    <p class="lead">Sign in to keep your characters, campaigns and notes in the cloud, on every device.</p>
    <div class="signin-buttons">
      <a class="btn primary big" href="${loginUrl('aad')}">Sign in with Microsoft</a>
      <a class="btn big" href="${loginUrl('github')}">Sign in with GitHub</a>
    </div>
    <p class="muted small">The <a href="#/rules">Rules</a>, <a href="#/dice">Dice</a> and <a href="#/combat">Combat</a> tools work without an account.</p>
    <p class="muted small">Used the app before sign-in existed? Your old characters are still in that browser.
      Open <b>jayfitzhenry.github.io/ProjectSociety/legacy-export.html</b> in the browser you used, download the file, then import it here after signing in.</p>
  </section></div>`;
}
