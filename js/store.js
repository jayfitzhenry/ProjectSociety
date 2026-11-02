// Persistent state in localStorage, plus small shared helpers.
import {
  PROJECTS, levelFromMarks, BASE_WOUNDS, MAX_WOUNDS, itemById, communityBand,
} from './data.js';

const KEY = 'project-society:v1';

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

function fresh() {
  return { version: 1, characters: [], crew: freshCrew(), settings: { playerView: false }, history: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw);
    const base = fresh();
    return {
      ...base,
      ...s,
      crew: { ...base.crew, ...s.crew, projects: { ...base.crew.projects, ...(s.crew?.projects || {}) } },
      settings: { ...base.settings, ...s.settings },
    };
  } catch (e) {
    console.warn('Could not load saved data', e);
    return fresh();
  }
}

export const state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    toast('⚠️ Could not save to this browser');
  }
}

export function replaceState(next) {
  const base = fresh();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, base, next, {
    crew: { ...base.crew, ...(next.crew || {}), projects: { ...base.crew.projects, ...(next.crew?.projects || {}) } },
    settings: { ...base.settings, ...(next.settings || {}) },
  });
  save();
}

export function resetAll() {
  replaceState(fresh());
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

/** "The level most of the crew is at." Ties go to the higher level. */
export function crewLevel() {
  const chars = state.characters.filter((c) => c.created && !c.dead);
  if (!chars.length) return 1;
  const counts = {};
  chars.forEach((c) => { const l = charLevel(c); counts[l] = (counts[l] || 0) + 1; });
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]);
}

export function hasContact(type) {
  return state.characters.some((c) => !c.dead && (c.contacts || []).some((x) => x.type === type));
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
