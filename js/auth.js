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

/** Re-read the user (their campaign list changes when they create, join or leave). */
export async function refreshUser() {
  session.user = await api('me');
  renderAccount();
  return session.user;
}

/** Is this user a DM in any campaign? */
export const isDmAnywhere = () => (session.user?.campaigns || []).some((c) => c.role === 'dm');

function loginUrl(provider) {
  // Come back to the page they were trying to reach.
  const back = location.hash && location.hash !== '#/signin' ? `/${location.hash}` : '/';
  return `/.auth/login/${provider}?post_login_redirect_uri=${encodeURIComponent(back)}`;
}

/** The account button in the top bar. */
export function renderAccount() {
  const el = document.getElementById('account-link');
  if (el) el.setAttribute('aria-label', session.user ? `Account and settings (${session.user.displayName})` : 'Settings and sign in');
  document.body.classList.toggle('signed-out', !session.user);
  window.dispatchEvent(new CustomEvent('ps:sync'));
}

export function renderSignIn(el) {
  document.getElementById('top-title').textContent = 'Sign in';
  if (session.principal && session.error) {
    el.innerHTML = `<div class="page signin">
      <h1>Project Society</h1>
      <p class="note bad">You're signed in, but the server didn't answer: ${esc(session.error.message)}</p>
      <button type="button" class="btn primary" data-act="retry">Try again</button>
      <a class="btn" href="/.auth/logout?post_logout_redirect_uri=/">Sign out</a>
    </div>`;
    el.onclick = (e) => { if (e.target.closest('[data-act="retry"]')) location.reload(); };
    return;
  }
  el.innerHTML = `<div class="page signin">
    <h1>Project Society</h1>
    <p class="lead">Sign in to keep your characters, campaigns and notes on every device.</p>
    <a class="btn primary" href="${loginUrl('aad')}">Sign in with Microsoft</a>
    <a class="btn" href="${loginUrl('github')}">Sign in with GitHub</a>
    <p class="muted small" style="margin-top:24px">The <a href="#/rules">Rules</a> and <a href="#/search">Search</a> work without an account.</p>
    <p class="muted small">Used the app before sign-in existed? Your old characters are still in that browser.
      Open <b>legacy-export.html</b> on this site in the browser you used, download the file, then import it from Settings after signing in.</p>
  </div>`;
}
