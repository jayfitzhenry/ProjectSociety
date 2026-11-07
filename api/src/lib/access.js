// Permission checks. Every rule about who may do what lives here or in a handler that calls these.
import { forbidden, notFound } from './http.js';
import { repo } from './repo.js';
import { checkId } from './validate.js';

export const membershipId = (userId) => `m:${userId}`;

export async function membershipOf(campaignId, userId) {
  const r = await repo();
  return r.read('campaigns', campaignId, membershipId(userId));
}

/** The caller's membership, or 403. */
export async function requireMember(campaignId, user) {
  checkId(campaignId, 'campaign id');
  const m = await membershipOf(campaignId, user.id);
  if (!m || m.type !== 'membership') throw forbidden("You're not in this campaign.");
  return m;
}

/** The caller's membership if they're the DM, or 403. */
export async function requireDm(campaignId, user) {
  const m = await requireMember(campaignId, user);
  if (m.role !== 'dm') throw forbidden('Only the DM can do that.');
  return m;
}

/** A character the caller owns, or 404. */
export async function ownCharacter(user, id) {
  const r = await repo();
  const c = await r.read('characters', user.id, checkId(id, 'character id'));
  if (!c) throw notFound('Character not found.');
  return c;
}

/** What other players may see of a crewmate: enough for crew level and markets, nothing more. */
export function characterSummary(c) {
  return {
    id: c.id,
    ownerId: c.ownerId,
    name: c.name || '',
    background: c.background || '',
    marks: c.marks || 0,
    created: !!c.created,
    dead: !!c.dead,
    contacts: (c.contacts || []).map((k) => ({ type: k.type })),
  };
}
