// Each user doc carries a copy of their campaign list, so the home screen is one point read.
// Membership docs in the campaign partition stay the authority.
import { update } from './repo.js';

export function indexAdd(userId, entry) {
  return update('users', userId, userId, (u) => {
    u.campaigns = (u.campaigns || []).filter((c) => c.campaignId !== entry.campaignId);
    u.campaigns.push(entry);
  });
}

export function indexRemove(userId, campaignId) {
  return update('users', userId, userId, (u) => {
    const before = (u.campaigns || []).length;
    u.campaigns = (u.campaigns || []).filter((c) => c.campaignId !== campaignId);
    if (u.campaigns.length === before) return false;
  });
}

export function indexRename(userId, campaignId, name) {
  return update('users', userId, userId, (u) => {
    const c = (u.campaigns || []).find((x) => x.campaignId === campaignId);
    if (!c || c.name === name) return false;
    c.name = name;
  });
}
