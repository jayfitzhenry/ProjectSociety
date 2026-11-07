// App state, cloud sync and small shared helpers.
// Views mutate `state` and call save(); save() diffs against what the server last confirmed and sends only the changes.
import {
  PROJECTS, levelFromMarks, BASE_WOUNDS, MAX_WOUNDS, itemById, communityBand, talentById,
} from './data.js';
import { api } from './api.js';

export const OLD_KEY = 'project-society:v1'; // the whole app's save from before sign-in
const CREW_KEY = 'project-society:crew'; // the crew sheet on this device, until campaigns arrive
const SETTINGS_KEY = 'project-society:settings';

export function freshCrew() {
  return {
    name: '',
    projects: Object.fromEntries(PROJECTS.map((p) => [p.id, p.id === 'clinic' || p.id === 'hall' ? 1 : 0])),
    pot: 0,
    exposure: 0,
    trust: 3,
    waterCut: false,
    cisternUsed: 0, // Homecomings without water already covered by the Cistern
    safehouseUsed: false,
    startChosen: false, // the free third starting tier has been picked
    confidantUsed: false,
    debt: false, // Hardship event 3: next Need doubled
    forceRaid: false, // Hardship event 2: raid check next Homecoming
    skipRaid: false, // Raid test critical: skip next Raid check
    helpAtHome: false,
    job: null, // { type, exposure, favoursUsed }
    purse: 0, // pay brought home but not yet allocated
    needDue: 0,
    needPaid: 0,
    log: [],
  };
}

// ---------- migrations: bring older shapes up to date ----------
/** Talents used to be stored by trait name; now they're ids. */
export function migrateCharacter(c) {
  c.talents = [...new Set((c.talents || []).map((t) => talentById(t)?.id).filter(Boolean))];
  return c;
}

export function migrateCrew(crew) {
  const base = freshCrew();
  if (!crew) return base;
  // Saves from before startChosen existed: the free starting tier was offered only while the log was empty.
  if (crew.startChosen === undefined) {
    const built = Object.values(crew.projects || {}).reduce((a, v) => a + v, 0);
    crew.startChosen = !(built === 2 && !(crew.log || []).length);
  }
  return { ...base, ...crew, projects: { ...base.projects, ...(crew.projects || {}) } };
}

/** An old whole-app save (version 1, localStorage or file) → { characters, crew }. */
export function migrateSave(s) {
  return {
    characters: (s.characters || []).map((c) => migrateCharacter({ ...c })),
    crew: s.crew ? migrateCrew({ ...s.crew }) : null,
  };
}

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

/** The crew sheet a phase-2 build kept on this device, or the one inside the pre-sign-in save. */
export function localCrew() {
  const own = readLocal(CREW_KEY);
  if (own) return migrateCrew(own);
  const old = readLocal(OLD_KEY)?.crew;
  return old ? migrateCrew(old) : null;
}

export const state = {
  version: 2,
  characters: [], // the signed-in user's characters, from the API
  campaign: null, // the open campaign: { id, name, role, joinCode, members, me, crewEtag }
  crew: freshCrew(), // the open campaign's crew sheet
  roster: null, // the open campaign's characters; yours are the same objects as in state.characters
  settings: { playerView: true, ...readLocal(SETTINGS_KEY) },
  history: [],
};

// ---------- sync ----------
export const sync = { status: 'saved', message: '' };
function setSync(status, message = '') {
  sync.status = status;
  sync.message = message;
  window.dispatchEvent(new CustomEvent('ps:sync'));
}

/** Show the "someone else changed this" banner. Editing stops for that item until reload. */
export function showConflict(what) {
  setSync('conflict', `Someone else changed ${what}. Reload to see their changes.`);
}

const SERVER_KEYS = new Set(['_etag', 'updatedAt', 'createdAt', 'ownerId', 'campaignId']);
const strip = (doc) => Object.fromEntries(Object.entries(doc).filter(([k]) => !SERVER_KEYS.has(k)));
const ser = (doc) => JSON.stringify(strip(doc));

const snaps = new Map(); // character id → what the server last confirmed (serialized)
const blocked = new Set(); // character ids with an unresolved conflict
const snapshot = (c) => snaps.set(c.id, ser(c));

export async function loadCharacters() {
  const list = await api('characters');
  state.characters = list.map(migrateCharacter);
  snaps.clear();
  state.characters.forEach(snapshot);
}

/** Replace a character's fields in place, so views holding the object see the change. */
function adopt(target, doc) {
  Object.keys(target).forEach((k) => { if (!(k in doc)) delete target[k]; });
  Object.assign(target, doc);
}

async function putCharacter(c, body, etag) {
  const saved = migrateCharacter(await api(`characters/${encodeURIComponent(c.id)}`, { method: 'PUT', body, etag }));
  return saved;
}

/**
 * Save one character. On a 412 (the DM's awards changed it, or another device did), refetch,
 * keep both sides' changes if they touched different fields, otherwise stop and ask for a reload.
 */
async function flushCharacter(c, keepalive) {
  const sent = ser(c);
  if (snaps.get(c.id) === sent || blocked.has(c.id)) return;
  const body = strip(c);
  try {
    const saved = await api(`characters/${encodeURIComponent(c.id)}`, { method: 'PUT', body, etag: c._etag, keepalive });
    c._etag = saved._etag;
    c.updatedAt = saved.updatedAt;
    snaps.set(c.id, sent);
  } catch (e) {
    if (e.status !== 412) throw e;
    const base = JSON.parse(snaps.get(c.id));
    const local = JSON.parse(sent);
    const fresh = migrateCharacter(await api(`characters/${encodeURIComponent(c.id)}`));
    const theirs = strip(fresh);
    const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(theirs)]);
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const mine = [...keys].filter((k) => !same(local[k], base[k]));
    if (mine.some((k) => !same(theirs[k], base[k]))) {
      blocked.add(c.id);
      showConflict(c.name || 'this character');
      return;
    }
    const merged = { ...theirs, ...Object.fromEntries(mine.map((k) => [k, local[k]])) };
    const saved = await putCharacter(c, merged, fresh._etag);
    snaps.set(c.id, ser(saved));
    adopt(c, saved);
    window.dispatchEvent(new CustomEvent('ps:remote'));
  }
}

let timer = null;
let running = null;
let again = false;

async function flush(keepalive = false) {
  clearTimeout(timer);
  if (running) { again = true; return running; }
  running = (async () => {
    try {
      for (const c of [...state.characters]) await flushCharacter(c, keepalive);
      await flushCrew(keepalive);
      if (sync.status !== 'conflict') setSync('saved');
    } catch (e) {
      setSync('error', e.message);
    }
  })();
  await running;
  running = null;
  if (again) { again = false; return flush(keepalive); }
  return undefined;
}

export function save() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  } catch {
    // Private mode or full storage: settings just won't persist.
  }
  if (sync.status !== 'conflict') setSync('saving');
  clearTimeout(timer);
  timer = setTimeout(flush, 600);
}

/** Send anything unsaved now (leaving the page, switching apps). */
export const flushNow = () => flush(true);
window.addEventListener('pagehide', flushNow);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushNow(); });

export async function addCharacter(c) {
  const saved = migrateCharacter(await api('characters', { method: 'POST', body: c }));
  state.characters.push(saved);
  snapshot(saved);
  return saved;
}

export async function removeCharacter(id) {
  await api(`characters/${encodeURIComponent(id)}`, { method: 'DELETE' });
  state.characters = state.characters.filter((x) => x.id !== id);
  snaps.delete(id);
}

export const forgetLocalCrew = () => localStorage.removeItem(CREW_KEY);

// ---------- campaigns ----------
const CREW_SERVER_KEYS = new Set(['_etag', 'id', 'type', 'campaignId', 'updatedAt']);
const crewFrom = (doc) => migrateCrew(Object.fromEntries(Object.entries(doc || {}).filter(([k]) => !CREW_SERVER_KEYS.has(k))));
const AWARD_FIELDS = ['marks', 'chips', 'wounds', 'shaken'];
const awardValues = (c) => Object.fromEntries(AWARD_FIELDS.map((k) => [k, Number(c[k]) || 0]));

let crewSnap = null; // the crew sheet as the server last confirmed it (serialized)
let crewBlocked = false;
const rosterSnaps = new Map(); // crewmate character id → award fields as last confirmed

export const isDm = () => state.campaign?.role === 'dm';
const myId = () => state.campaign?.myId;

function applyCampaign(data, myUserId) {
  const { campaign, me, members } = data;
  state.campaign = {
    id: campaign.id, name: campaign.name, joinCode: campaign.joinCode, createdBy: campaign.createdBy,
    role: me.role, me, members, myId: myUserId, crewEtag: data.crew?._etag || null,
  };
  state.crew = crewFrom(data.crew);
  crewSnap = JSON.stringify(state.crew);
  crewBlocked = false;
  rosterSnaps.clear();
  const others = data.roster.filter((c) => c.ownerId !== myUserId).map((c) => (me.role === 'dm' ? migrateCharacter(c) : c));
  if (me.role === 'dm') others.forEach((c) => rosterSnaps.set(c.id, awardValues(c)));
  state.roster = [...others, ...state.characters.filter((c) => c.campaignId === campaign.id)];
}

/** Load a campaign (crew sheet, members, roster) and make it the open one. */
export async function openCampaign(cid, myUserId, { force = false } = {}) {
  if (!force && state.campaign?.id === cid) return state.campaign;
  await flushNow();
  applyCampaign(await api(`campaigns/${encodeURIComponent(cid)}`), myUserId);
  return state.campaign;
}

/** No campaign open: a character on its own is its own crew. */
export function closeCampaign(alone = null) {
  state.campaign = null;
  state.crew = freshCrew();
  state.roster = alone ? [alone] : [];
  crewSnap = null;
  rosterSnaps.clear();
}

/** Crewmates' Marks, chips, wounds and Shaken the DM changed from the crew sheet, as deltas. */
function pendingAwards() {
  if (!isDm()) return [];
  return (state.roster || []).filter((c) => rosterSnaps.has(c.id)).map((c) => {
    const before = rosterSnaps.get(c.id);
    const now = awardValues(c);
    const delta = Object.fromEntries(AWARD_FIELDS.map((k) => [k, now[k] - before[k]]).filter(([, v]) => v));
    return Object.keys(delta).length ? { ownerId: c.ownerId, characterId: c.id, ...delta, sent: now } : null;
  }).filter(Boolean);
}

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Someone else saved the crew sheet first (often a player sending chips home).
 * Keep both sides when they changed different things; the Pot adds up; the log is merged.
 * Only a real clash (both changed the same thing) stops and asks for a reload.
 */
function mergeCrew(base, local, theirs) {
  const merged = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(theirs)]);
  for (const k of keys) {
    if (k === 'log') {
      const seen = new Set();
      merged.log = [...(theirs.log || []), ...(local.log || [])]
        .filter((e) => { const id = `${e.t}|${e.text}`; if (seen.has(id)) return false; seen.add(id); return true; })
        .sort((a, b) => b.t - a.t).slice(0, 200);
    } else if (k === 'pot') {
      merged.pot = (theirs.pot || 0) + ((local.pot || 0) - (base.pot || 0));
    } else if (sameJson(local[k], base[k])) {
      merged[k] = theirs[k];
    } else if (sameJson(theirs[k], base[k]) || sameJson(theirs[k], local[k])) {
      merged[k] = local[k];
    } else {
      return null;
    }
  }
  return merged;
}

async function flushCrew(keepalive, retried = false) {
  const camp = state.campaign;
  if (!camp || camp.role !== 'dm' || crewBlocked) return;
  const sent = JSON.stringify(state.crew);
  const awards = pendingAwards();
  if (sent === crewSnap && !awards.length) return;
  try {
    const res = await api(`campaigns/${encodeURIComponent(camp.id)}/crew`, {
      method: 'PUT', etag: camp.crewEtag, keepalive,
      body: { crew: state.crew, awards: awards.map(({ sent: _, ...a }) => a) },
    });
    camp.crewEtag = res.crew._etag;
    crewSnap = sent;
    awards.forEach((a) => rosterSnaps.set(a.characterId, a.sent));
    res.awards.filter((a) => !a.ok).forEach((a) => rosterSnaps.delete(a.characterId));
  } catch (e) {
    if (e.status !== 412 || retried) throw e;
    const fresh = await api(`campaigns/${encodeURIComponent(camp.id)}`);
    const theirs = crewFrom(fresh.crew);
    const merged = mergeCrew(JSON.parse(crewSnap), JSON.parse(sent), theirs);
    if (!merged) {
      crewBlocked = true;
      showConflict('the crew sheet');
      return;
    }
    camp.crewEtag = fresh.crew._etag;
    crewSnap = JSON.stringify(theirs);
    Object.keys(state.crew).forEach((k) => delete state.crew[k]);
    Object.assign(state.crew, merged);
    window.dispatchEvent(new CustomEvent('ps:remote'));
    await flushCrew(keepalive, true);
  }
}

/** Attach one of your characters to a campaign (or detach it with null). */
export async function attachCharacter(c, campaignId) {
  await flushNow();
  const saved = migrateCharacter(await api(`characters/${encodeURIComponent(c.id)}/campaign`, { method: 'PUT', body: { campaignId } }));
  adopt(c, saved);
  snapshot(c);
  return c;
}

/** Send chips from your own character to the Pot. */
export async function sendChipsHome(c, chips) {
  await flushNow();
  const res = await api(`campaigns/${encodeURIComponent(state.campaign.id)}/pot`, { method: 'POST', body: { characterId: c.id, chips } });
  adopt(c, migrateCharacter(res.character));
  snapshot(c);
  if (!isDm() || JSON.stringify(state.crew) === crewSnap) {
    state.crew = crewFrom(res.crew);
    crewSnap = JSON.stringify(state.crew);
    state.campaign.crewEtag = res.crew._etag;
  }
  return res;
}

const unsaved = () => sync.status === 'saving' || running
  || (crewSnap !== null && JSON.stringify(state.crew) !== crewSnap)
  || pendingAwards().length
  || state.characters.some((c) => snaps.get(c.id) !== ser(c));

/**
 * Pick up other people's changes (the DM's awards, a crewmate levelling up, the crew sheet)
 * when nothing local is waiting to be saved. Returns true if anything changed.
 */
export async function refreshFromServer(myUserId) {
  if (unsaved() || sync.status === 'conflict') return false;
  let changed = false;
  const list = await api('characters');
  if (unsaved()) return false;
  for (const fresh of list) {
    const c = state.characters.find((x) => x.id === fresh.id);
    if (!c) { state.characters.push(migrateCharacter(fresh)); snapshot(fresh); changed = true; continue; }
    if (c._etag !== fresh._etag) { adopt(c, migrateCharacter(fresh)); snapshot(c); changed = true; }
  }
  const ids = new Set(list.map((x) => x.id));
  if (state.characters.some((c) => !ids.has(c.id))) { state.characters = state.characters.filter((c) => ids.has(c.id)); changed = true; }
  if (state.campaign) {
    const data = await api(`campaigns/${encodeURIComponent(state.campaign.id)}`);
    if (unsaved()) return changed;
    const rosterSig = (r) => JSON.stringify((r || []).map((c) => [c.id, c._etag || c.marks, c.name, c.dead]));
    if (data.crew?._etag !== state.campaign.crewEtag || rosterSig(data.roster) !== rosterSig((state.roster || []).filter((c) => c.ownerId !== myUserId))
      || data.members.length !== state.campaign.members.length) {
      applyCampaign(data, myUserId);
      changed = true;
    }
  }
  return changed;
}

// ---------- helpers ----------
export const uid = () => Math.random().toString(36).slice(2, 10);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

export function log(text) {
  state.crew.log.unshift({ t: Date.now(), text });
  state.crew.log = state.crew.log.slice(0, 200);
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- derived values ----------
export const community = (crew = state.crew) => Object.values(crew.projects).reduce((s, v) => s + v, 0);

export function charLevel(c) {
  return levelFromMarks(c.marks || 0);
}

export function maxWounds(c) {
  const lvl = charLevel(c);
  let w = BASE_WOUNDS + (lvl >= 4 ? 1 : 0) + (lvl >= 8 ? 1 : 0);
  if ((c.gear || []).some((g) => g.item === 'sinew')) w += 1;
  return Math.min(w, MAX_WOUNDS);
}

/** The characters that make up the crew. */
export const crewChars = () => state.roster ?? state.characters;

/** "The level most of the crew is at." Ties go to the higher level. */
export function crewLevel() {
  const chars = crewChars().filter((c) => c.created && !c.dead);
  if (!chars.length) return 1;
  const counts = {};
  chars.forEach((c) => { const l = charLevel(c); counts[l] = (counts[l] || 0) + 1; });
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]);
}

export function hasContact(type) {
  return crewChars().some((c) => !c.dead && (c.contacts || []).some((x) => x.type === type));
}

export function marketOpen(market) {
  const lvl = crewLevel();
  if (market === 'works') return true;
  if (market === 'specialist') return lvl >= 3 || state.crew.projects.workshop >= 3;
  if (market === 'refined') return lvl >= 6 || hasContact('Sunk Dealer');
  return false;
}

/** Shop price after Workshop discounts (20% off, rounded up). */
export function buyPrice(item) {
  const ws = state.crew.projects.workshop;
  const discounted = (item.market === 'works' && ws >= 2) || (item.market === 'specialist' && ws >= 3);
  return discounted ? Math.ceil(item.price * 0.8) : item.price;
}

export function sellPrice(item, owner) {
  const good = state.crew.projects.workshop >= 1 || (owner?.contacts || []).some((x) => x.type === 'Fence');
  return Math.floor(item.price * (good ? 0.75 : 0.5));
}

export function needPerJob() {
  const c = community();
  const base = communityBand(c).need;
  return state.crew.debt ? base * 2 : base;
}

export function gearItem(g) {
  return itemById(g.item) || { name: g.name || 'Item', kind: 'other', price: 0, rules: [] };
}
