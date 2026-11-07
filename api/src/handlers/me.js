// The signed-in user: created on first sign-in, holds their display name, settings and campaign list.
import { route, ok, readJson, badRequest, now } from '../lib/http.js';
import { defaultDisplayName } from '../lib/auth.js';
import { repo, update } from '../lib/repo.js';

export function publicUser(u) {
  return {
    id: u.id,
    provider: u.provider,
    displayName: u.displayName,
    nameConfirmed: !!u.nameConfirmed,
    settings: u.settings || {},
    campaigns: u.campaigns || [],
  };
}

/** The user doc for the caller, created the first time they sign in. */
export async function ensureUser(user) {
  const r = await repo();
  const existing = await r.read('users', user.id, user.id);
  if (existing) return existing;
  const doc = {
    id: user.id,
    provider: user.provider,
    displayName: defaultDisplayName(user),
    nameConfirmed: false,
    createdAt: now(),
    settings: { playerView: true },
    campaigns: [],
  };
  try {
    return await r.create('users', doc);
  } catch (e) {
    if (e.status === 409) return r.read('users', user.id, user.id);
    throw e;
  }
}

export const getMe = route(async ({ user }) => ok(publicUser(await ensureUser(user))));

export const patchMe = route(async ({ request, user }) => {
  const body = await readJson(request, 10_000);
  await ensureUser(user);
  let renamed = null;
  if (body.displayName !== undefined) {
    renamed = String(body.displayName).trim().slice(0, 40);
    if (!renamed) throw badRequest('Pick a name other players will see.');
  }
  const saved = await update('users', user.id, user.id, (u) => {
    if (renamed) { u.displayName = renamed; u.nameConfirmed = true; }
    if (body.settings && typeof body.settings === 'object') {
      if (typeof body.settings.playerView === 'boolean') u.settings = { ...u.settings, playerView: body.settings.playerView };
    }
  });
  // Memberships carry a copy of the name so a campaign page is one partition read.
  if (renamed) {
    await Promise.all((saved.campaigns || []).map((c) => update('campaigns', c.campaignId, `m:${user.id}`, (m) => {
      if (m.displayName === renamed) return false;
      m.displayName = renamed;
    })));
  }
  return ok(publicUser(saved));
});
