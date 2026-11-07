// The character sheet, the character list and the creation steps.
// The sheet opens on the numbers you need every turn; everything else is one tap away in a section.
import {
  TRAITS, TALENTS, CONTACTS, BACKGROUNDS, STARTING_CHIPS,
  MAX_TRAITS, MAX_CONTACTS, WHY_ANTIOCH, LEVEL_REWARDS, MAX_LEVEL, DICE_MODES, DICE_SOURCES,
  itemById, marksForLevel, talentById, MAX_TALENTS_PER_TRAIT,
} from './data.js';
import {
  state, save, saveSettings, esc, uid, toast, charLevel, maxWounds, crewLevel, sellPrice, gearItem,
  addCharacter, removeCharacter, openCampaign, closeCampaign, attachCharacter, setTitle, currentCharacter, avatar,
} from './store.js';
import { session } from './auth.js';
import { netOf, pool, signed } from './dice.js';
import { renderMarkdown } from './md.js';

const ui = {
  chipsOpen: false, advance: '', readOnly: false,
  open: new Set(), // which sections of the sheet are open
  counter: { mode: 'test', trait: '', on: new Set(), weapon: '', armour: 0, extra: 0 },
  addingRule: false,
};

export const traitsOf = (c) => [...(c.bgTraits || []), c.personalTrait, ...(c.extraTraits || [])].filter(Boolean);
const enc = encodeURIComponent;
const term = (t, label = t) => `<button type="button" class="term" data-term="${esc(t)}">${esc(label)}</button>`;
const SECTIONS = ['dice', 'traits', 'gear', 'rules', 'who', 'notes', 'settings'];

/** A blank character. Its starting level comes from the open campaign's crew, if any. */
export function newCharacter() {
  const startLevel = Math.max(1, crewLevel() - (state.crew.projects.hall >= 2 ? 0 : 1));
  const hasCrew = (state.roster || []).some((c) => c.created && !c.dead);
  return {
    id: uid(), created: false, dead: false, name: '', concept: '', background: '', bgTraits: [], personalTrait: '',
    extraTraits: [], talents: [], contacts: [], marks: hasCrew ? marksForLevel(startLevel) : 0, wounds: 0, shaken: 0,
    scars: [], chips: STARTING_CHIPS, gear: [], dependsOn: '', why: WHY_ANTIOCH[0], notes: '', savedRules: [],
  };
}

function setBackground(c, bgId) {
  const bg = BACKGROUNDS.find((b) => b.id === bgId);
  if (!bg || c.background === bgId) return;
  // Swap out the old kit (and any chips it gave) for the new one.
  const oldBg = BACKGROUNDS.find((b) => b.id === c.background);
  c.gear = c.gear.filter((g) => !g.kit);
  c.chips += (bg.bonusChips || 0) - (oldBg?.bonusChips || 0);
  c.background = bgId;
  c.bgTraits = [];
  if (bg.traits.includes(c.personalTrait)) c.personalTrait = '';
  bg.kit.forEach(([item, qty, name]) => c.gear.push({ id: uid(), item, qty, name: name || itemById(item).name, kit: true }));
}

export function addGear(c, itemId, qty = 1) {
  const item = itemById(itemId);
  const existing = item.kind === 'consumable' && c.gear.find((g) => g.item === itemId);
  if (existing) existing.qty += qty;
  else c.gear.push({ id: uid(), item: itemId, qty, name: item.name });
}

// ---------- list ----------
const campaignName = (cid) => (session.user?.campaigns || []).find((x) => x.campaignId === cid)?.name;

function listView() {
  const chars = state.characters;
  const meta = (c) => {
    if (c.dead) return 'Dead';
    if (!c.created) return 'Still being made';
    return [c.background, `Level ${charLevel(c)}`, c.campaignId ? campaignName(c.campaignId) : ''].filter(Boolean).join(' · ');
  };
  return `<div class="page">
    <div class="page-head"><div><h1>Characters</h1><p class="sub">Saved to your account, on every device.</p></div></div>
    ${chars.length ? `<ul class="rows block">${chars.map((c) => `<li><a href="#/characters/${enc(c.id)}">
        ${avatar(c.name || 'Unnamed')}<span class="row-text"><span class="row-title">${esc(c.name || 'Unnamed')}</span><span class="row-meta">${esc(meta(c))}</span></span>
        ${c.created && !c.dead ? `<span class="row-side num">${c.wounds}/${maxWounds(c)} wounds<br>${c.chips}c</span>` : ''}</a></li>`).join('')}</ul>`
      : '<p class="empty">No characters yet. A new player should finish one in about ten minutes.</p>'}
    <button type="button" class="btn primary" data-act="new">New character</button>
  </div>`;
}

// ---------- creation ----------
function stepHead(n, title, done) {
  return `<h2 class="step-h ${done ? 'done' : ''}" data-step="${n}"><span class="n" aria-hidden="true">${done ? '✓' : n}</span> ${title}${done ? '<span class="sr-only"> (done)</span>' : ''}</h2>`;
}

function creationView(c) {
  const bg = BACKGROUNDS.find((b) => b.id === c.background);
  const traits = traitsOf(c);
  const ready = c.name.trim() && bg && c.bgTraits.length === 2 && c.personalTrait;
  const lvl = charLevel(c);
  return `<div class="page creation">
    <div class="page-head"><div><h1>New character</h1><p class="sub">Six steps, about ten minutes. Tap any underlined word to read its rule.</p></div>
      <a class="btn quiet" href="#/characters">All characters</a></div>

    <section class="step">
      ${stepHead(1, 'Name and concept', c.name.trim())}
      <label class="field"><span>Name</span><input data-f="name" value="${esc(c.name)}" placeholder="Dace" autocomplete="off"></label>
      <label class="field"><span>Who are you, in one sentence?</span><input data-f="concept" value="${esc(c.concept)}" placeholder="A foundry hand who knows every boiler on Cistern Row."></label>
      <details class="sect"><summary>Joining later, or a replacement? <span class="meta">Level ${lvl}</span></summary>
        <div class="sect-body"><p class="muted small">New and replacement characters start at crew level − 1 (the full crew level with Hall II), with the Marks for that level and an advance for each level from 2 up.</p>
        <label class="field"><span>Start at level</span><select data-f="startLevel">${Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => `<option ${l === lvl ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      </details>
    </section>

    <section class="step">
      ${stepHead(2, 'Background: choose one, then 2 of its 3 traits', bg && c.bgTraits.length === 2)}
      <div class="pick-grid">
        ${BACKGROUNDS.map((b) => `<button type="button" class="pick" data-bg="${esc(b.id)}" aria-pressed="${b.id === c.background}">
          <b>${esc(b.id)}</b><small>${esc(b.who)}</small><small>${b.traits.map(esc).join(' · ')}</small></button>`).join('')}
      </div>
      ${bg ? `<p class="label" style="margin-top:24px">Pick 2 traits from ${esc(bg.id)}</p>
        <div class="opts">${bg.traits.map((t) => `<button type="button" class="opt" data-bgtrait="${esc(t)}" aria-pressed="${c.bgTraits.includes(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
    </section>

    <section class="step">
      ${stepHead(3, 'Personal trait: one more, from any background', c.personalTrait)}
      <p class="muted">This is what makes you more than your job.</p>
      <div class="pick-grid">
        ${TRAITS.map((t) => `<button type="button" class="pick" data-ptrait="${esc(t.id)}" aria-pressed="${c.personalTrait === t.id}" ${c.bgTraits.includes(t.id) ? 'disabled' : ''}>
          <b>${esc(t.id)}</b><small>${esc(t.covers)}</small><small>Not: ${esc(t.not)}</small></button>`).join('')}
      </div>
    </section>

    <section class="step">
      ${stepHead(4, 'Wounds', true)}
      <p>Every character starts with <b>${maxWounds(c)} ${term('Wounds', 'wounds')}</b>. Fill the last box and you're ${term('Dying')}.</p>
    </section>

    <section class="step">
      ${stepHead(5, 'Kit and chips', !!bg)}
      ${bg ? '' : '<p class="muted">Choose a background first to get its starting kit.</p>'}
      ${gearList(c, true)}
      <p><b class="num">${c.chips}c</b> to spend on the market now, or keep.</p>
      ${shopLink(c)}
    </section>

    <section class="step">
      ${stepHead(6, 'Ties to home', c.dependsOn.trim())}
      <label class="field"><span>Who at home depends on you?</span><input data-f="dependsOn" value="${esc(c.dependsOn)}" placeholder="Old Merren, who taught me the boilers"></label>
      <fieldset class="field"><legend>Why do you still work for Antioch?</legend>
        ${WHY_ANTIOCH.map((w) => `<label class="check"><input type="radio" name="why" data-why="${esc(w)}" ${c.why === w ? 'checked' : ''}> <i>${esc(w)}</i></label>`).join('')}
        <label class="check"><input type="radio" name="why" data-why="__custom" ${!WHY_ANTIOCH.includes(c.why) ? 'checked' : ''}> Your own</label>
        <input data-f="whyCustom" aria-label="Your own reason" value="${WHY_ANTIOCH.includes(c.why) ? '' : esc(c.why)}" placeholder="Because…">
      </fieldset>
    </section>

    <section class="step">
      <p><b>${esc(c.name || 'Unnamed')}</b> · ${bg ? esc(bg.id) : 'no background'} · Level ${lvl}<br>
        <span class="muted">${traits.map(esc).join(' · ') || 'No traits yet'}</span></p>
      <div class="row">
        <button type="button" class="btn primary" data-act="finish" ${ready ? '' : 'disabled'}>Finish character</button>
        <button type="button" class="btn danger" data-act="delete">Discard</button>
      </div>
      ${ready ? '' : '<p class="muted small" style="margin-top:8px">Needs a name, a background with 2 traits, and a personal trait.</p>'}
    </section>
  </div>`;
}

/** Refresh the step ticks and the Finish button without redrawing the page. */
function updateCreation(el, c) {
  const bg = BACKGROUNDS.find((b) => b.id === c.background);
  const ready = c.name.trim() && bg && c.bgTraits.length === 2 && c.personalTrait;
  const fin = el.querySelector('[data-act="finish"]');
  if (fin) fin.disabled = !ready;
  [[1, c.name.trim()], [6, c.dependsOn.trim()]].forEach(([n, done]) => {
    const h = el.querySelector(`[data-step="${n}"]`);
    if (!h) return;
    h.classList.toggle('done', !!done);
    h.querySelector('.n').textContent = done ? '✓' : n;
  });
}

// ---------- gear & market ----------
function itemStats(item) {
  if (item.kind === 'weapon') return `${signed(item.mod)} To Wound · ${esc(item.range)}`;
  if (item.kind === 'armour') return `${signed(item.mod)} on wound rolls against you`;
  if (item.kind === 'tool') return `+1 ${esc(item.helps)}`;
  return esc(item.effect || '');
}

const ruleTerms = (rules = []) => rules.map((r) => term(r)).join(', ');

function gearList(c, creation = false) {
  if (!c.gear.length) return '<p class="muted">No gear.</p>';
  const ro = ui.readOnly;
  return `<ul class="rows block">${c.gear.map((g) => {
    const item = gearItem(g);
    const usable = !creation && (item.kind === 'consumable' || (item.rules || []).includes('Consumable'));
    return `<li><div class="row-main" style="flex-wrap:wrap">
      <span class="row-text" style="flex:1 1 200px">
        <span class="row-title">${item.id ? term(item.name, g.name) : esc(g.name)}${g.qty > 1 && item.kind !== 'consumable' ? ` ×${g.qty}` : ''}${g.kit && creation ? ' <span class="tag">kit</span>' : ''}</span>
        <span class="row-meta">${itemStats(item)}${item.rules?.length ? ` · ${ruleTerms(item.rules)}` : ''}</span>
      </span>
      ${ro ? (item.kind === 'consumable' ? `<span class="num">×${g.qty}</span>` : '') : `<span class="row">
        ${item.kind === 'consumable' ? `<span class="stepper"><button type="button" data-gq="${g.id}" data-n="-1" aria-label="One fewer ${esc(g.name)}">−</button><b>${g.qty}</b><button type="button" data-gq="${g.id}" data-n="1" aria-label="One more ${esc(g.name)}">+</button></span>` : ''}
        ${usable ? `<button type="button" class="btn" data-use="${g.id}">Use</button>` : ''}
        ${item.kind !== 'graft' ? `<button type="button" class="btn quiet" data-sell="${g.id}">Sell ${sellPrice(item, c)}c</button>` : ''}
        <button type="button" class="btn quiet" data-drop="${g.id}" aria-label="Remove ${esc(g.name)} without selling">Remove</button>
      </span>`}
    </div></li>`;
  }).join('')}</ul>`;
}

/** The market is its own page; the sheet links to it for this character. */
function shopLink(c) {
  if (ui.readOnly) return '';
  return `<a class="btn" href="#/market/${enc(c.id)}">Open the market</a>`;
}

// ---------- dice counter ----------
function hasTalent(c, id) { return (c.talents || []).includes(id); }
const owns = (c, id) => c.gear.some((g) => g.item === id);
const weaponsOf = (c) => [{ id: '', name: 'Unarmed or improvised', mod: 0, range: 'Melee', rules: [] },
  ...c.gear.filter((g) => gearItem(g).kind === 'weapon').map((g) => ({ ...gearItem(g), name: g.name, gid: g.id }))];

/** Everything that counts for this roll: [label, n, auto?] */
function counterParts(c) {
  const k = ui.counter;
  const parts = [];
  const traits = traitsOf(c);
  const weapons = weaponsOf(c);
  const w = weapons.find((x) => (x.gid || '') === k.weapon) || weapons[0];
  const melee = /^Melee/.test(w.range || '');
  if (k.mode === 'test') {
    if (k.trait === '__knowhow') parts.push(['No trait, needs know-how', -1]);
    else if (k.trait) parts.push([k.trait, 1]);
  }
  if (k.mode === 'hit' && k.on.has('trait')) parts.push([melee ? 'Brawler' : 'Marksman', 1]);
  if (k.mode === 'wound') {
    if (w.mod) parts.push([w.name, w.mod, true]);
    const pierce = (w.rules || []).includes('Pierce');
    const armour = pierce ? Math.min(0, k.armour + 1) : k.armour;
    if (armour) parts.push([`Target's armour${pierce ? ' (Pierced)' : ''}`, armour]);
    if ((w.rules || []).includes('Fire')) parts.push(['Fire', -1, true]);
  }
  if (k.mode === 'survival') {
    parts.push(traits.includes('Medic') ? ['You have Medic', 1, true] : ['No Medic trait', -1, true]);
  }
  DICE_SOURCES[k.mode].forEach((s) => {
    if (!k.on.has(s.id)) return;
    if (s.id === 'trait') return;
    let n = s.n;
    if (s.id === 'aim' && hasTalent(c, 'deadeye')) n = 2;
    parts.push([s.id === 'aim' && n === 2 ? 'Aim (Dead Eye)' : s.label, n]);
  });
  if (k.mode !== 'survival' && c.shaken) parts.push([`Shaken ×${c.shaken}`, -c.shaken, true]);
  if (k.extra) parts.push(['Other', k.extra]);
  return { parts, w, melee, weapons };
}

function counterView(c) {
  const k = ui.counter;
  const { parts, w, melee, weapons } = counterParts(c);
  const plus = parts.filter(([, n]) => n > 0).reduce((s, [, n]) => s + n, 0);
  const minus = parts.filter(([, n]) => n < 0).reduce((s, [, n]) => s - n, 0);
  const net = netOf(plus, minus);
  const p = pool(net);
  const traits = traitsOf(c);
  const opt = (s) => {
    if (s.talent && !hasTalent(c, s.talent)) return '';
    if (s.fire && !(w.rules || []).includes('Fire')) return '';
    if (s.id === 'cover' && melee) return '';
    if (s.id === 'trait' && !traits.includes(melee ? 'Brawler' : 'Marksman')) return '';
    const n = s.id === 'aim' && hasTalent(c, 'deadeye') ? 2 : s.n;
    const label = s.id === 'trait' ? (melee ? 'Brawler' : 'Marksman') : s.id === 'aim' && n === 2 ? 'Aim (Dead Eye)' : s.label;
    return `<button type="button" class="opt" data-src="${s.id}" aria-pressed="${k.on.has(s.id)}">${esc(label)} <span class="n">${signed(n)}</span></button>`;
  };
  const tools = c.gear.filter((g) => gearItem(g).kind === 'tool').map((g) => g.name);
  return `<div class="seg" role="tablist" aria-label="Kind of roll" style="margin-bottom:16px">${DICE_MODES.map((m) => `<button type="button" role="tab" data-mode="${m.id}" aria-selected="${k.mode === m.id}">${m.title}</button>`).join('')}</div>
    ${k.mode === 'test' ? `<label class="field"><span>Which trait covers it?</span><select data-counter="trait">
        <option value="" ${k.trait === '' ? 'selected' : ''}>None: anyone could try (0)</option>
        <option value="__knowhow" ${k.trait === '__knowhow' ? 'selected' : ''}>None, and it needs know-how (−1)</option>
        ${traits.map((t) => `<option value="${esc(t)}" ${k.trait === t ? 'selected' : ''}>${esc(t)} (+1)</option>`).join('')}
      </select></label>` : ''}
    ${k.mode === 'hit' || k.mode === 'wound' ? `<label class="field"><span>Weapon</span><select data-counter="weapon">
        ${weapons.map((x) => `<option value="${esc(x.gid || '')}" ${(x.gid || '') === k.weapon ? 'selected' : ''}>${esc(x.name)}${x.mod ? ` (${signed(x.mod)} To Wound)` : ''}</option>`).join('')}
      </select></label>` : ''}
    ${k.mode === 'wound' ? `<fieldset class="field"><legend>Target's armour</legend><div class="seg">${[[0, 'None'], [-1, '−1'], [-2, '−2']].map(([v, l]) => `<button type="button" data-armour="${v}" aria-pressed="${k.armour === v}">${l}</button>`).join('')}</div></fieldset>` : ''}
    <div class="opts" style="margin-bottom:16px">${DICE_SOURCES[k.mode].map(opt).join('')}</div>
    ${k.mode === 'test' && tools.length ? `<p class="muted small">Your tools: ${tools.map(esc).join(', ')}</p>` : ''}
    <div class="row"><span class="muted small">Other bonuses or penalties</span>
      <span class="stepper"><button type="button" data-extra="-1" aria-label="One more penalty">−</button><b>${signed(k.extra)}</b><button type="button" data-extra="1" aria-label="One more bonus">+</button></span></div>
    <div class="counter-out" aria-live="polite">
      <span class="hero">${p.count}D6</span><span>${p.keep}${k.mode === 'wound' ? '' : ', need 7+'}</span>
      <span class="counter-math">+${plus} −${minus} = net ${signed(plus - minus)}${plus - minus < net ? `, capped at ${signed(net)}` : ''}</span>
    </div>
    ${parts.length ? `<ul class="breakdown">${parts.map(([l, n, auto]) => `<li><span>${esc(l)}${auto ? ' <span class="muted">(from your sheet)</span>' : ''}</span><b>${signed(n)}</b></li>`).join('')}</ul>` : ''}
    ${k.mode === 'wound' ? `<p class="small">Read the total on the ${term('Injury Table')}: 2–6 ${term('Shaken')}, 7–11 one wound, 12 three wounds and a free attack.</p>` : ''}
    ${k.mode === 'hit' ? `<p class="muted small">A double 6 is a ${term('Critical', 'critical hit')}: +1 on the wound roll. A double 1 ends your turn.</p>` : ''}
    <p class="small"><a href="#/rules/dice_modifiers">Every bonus and penalty, and how they add up</a></p>
    <button type="button" class="btn quiet" data-act="counter-clear">Clear</button>`;
}

// ---------- saved rules ----------
function savedRulesView(c) {
  const list = c.savedRules || [];
  const ro = ui.readOnly;
  if (ro) {
    return list.length ? `<ul class="rows">${list.map((r) => `<li><div class="row-text" style="padding:8px 0">
      <span class="row-title">${esc(r.title)}${r.active ? ' <span class="tag">active</span>' : ''}</span><span class="row-meta">${esc(r.source || 'Their own rule')}</span>
      <div class="md small">${renderMarkdown(r.text)}</div></div></li>`).join('')}</ul>` : '<p class="muted">No saved rules.</p>';
  }
  return `${list.length ? `<ul class="rows block">${list.map((r) => `<li><div class="row-main">
      <button type="button" class="row-text linklike" style="text-decoration:none;color:inherit;text-align:left" data-peek-saved="${esc(r.id)}">
        <span class="row-title">${esc(r.title)}</span><span class="row-meta">${esc(r.source || 'Your own rule')}</span></button>
      ${ro ? (r.active ? '<span class="row-side">Active</span>' : '') : `<span class="row">
        <button type="button" class="switch" role="switch" aria-checked="${r.active ? 'true' : 'false'}" data-toggle-saved="${esc(r.id)}" aria-label="${esc(r.title)} active"><span class="track" aria-hidden="true"></span></button>
        <button type="button" class="btn quiet" data-delrule="${esc(r.id)}" aria-label="Remove ${esc(r.title)}">Remove</button></span>`}
    </div></li>`).join('')}</ul>`
    : '<p class="muted">No saved rules yet. Tap <b>Save</b> next to any rule in the Rules tab, or on a term, to keep it here.</p>'}
    <p class="muted small">Active rules show at the top of the sheet.</p>
    ${ro ? '' : ui.addingRule ? `<form id="add-rule" class="block">
      <label class="field"><span>Title</span><input name="title" maxlength="120" required placeholder="Holding the doorway"></label>
      <label class="field"><span>What it says</span><textarea name="text" rows="4" maxlength="2000" required placeholder="While I hold a doorway, enemies can't pass me without a Stunt."></textarea></label>
      <label class="field"><span>Source</span><input name="source" maxlength="120" placeholder="Agreed with the DM, session 3"></label>
      <div class="row"><button class="btn primary">Save rule</button><button type="button" class="btn quiet" data-act="cancel-rule">Cancel</button></div>
    </form>` : '<button type="button" class="btn" data-act="add-rule">Write your own rule</button>'}`;
}

// ---------- advances ----------
function advancesView(c) {
  const lvl = charLevel(c);
  const available = lvl - 1;
  const used = (c.extraTraits?.length || 0) + (c.talents?.length || 0) + (c.contacts?.length || 0);
  const free = available - used;
  const traits = traitsOf(c);
  const openTalents = TALENTS.filter((t) => !c.talents.includes(t.id)
    && (!t.trait || (traits.includes(t.trait) && c.talents.filter((x) => talentById(x)?.trait === t.trait).length < MAX_TALENTS_PER_TRAIT)));
  let picker = '';
  if (free > 0 && !ui.readOnly) {
    const opts = [];
    if (traits.length < MAX_TRAITS) opts.push(['trait', 'New trait']);
    if (openTalents.length) opts.push(['talent', 'Talent']);
    if (c.contacts.length < MAX_CONTACTS) opts.push(['contact', 'Contact']);
    picker = `<div class="seg" style="margin:8px 0 16px">${opts.map(([k, l]) => `<button type="button" data-advtype="${k}" aria-pressed="${ui.advance === k}">${l}</button>`).join('')}</div>
      ${ui.advance === 'trait' ? `<div class="opts">${TRAITS.filter((t) => !traits.includes(t.id)).map((t) => `<button type="button" class="opt" data-addtrait="${esc(t.id)}" aria-pressed="false">${esc(t.id)}</button>`).join('')}</div><p class="muted small">Say how you learned it.</p>` : ''}
      ${ui.advance === 'talent' ? `<ul class="rows">${openTalents.map((t) => `<li><button type="button" class="row-main" data-addtalent="${t.id}"><span class="row-text"><span class="row-title">${esc(t.name)} <span class="muted small">${t.trait ? esc(t.trait) : 'general'}</span></span><span class="row-meta">${esc(t.effect)}</span></span></button></li>`).join('')}</ul>` : ''}
      ${ui.advance === 'contact' ? `<ul class="rows">${CONTACTS.filter((k) => !c.contacts.some((x) => x.type === k.id)).map((k) => `<li><button type="button" class="row-main" data-addcontact="${esc(k.id)}"><span class="row-text"><span class="row-title">${esc(k.id)} <span class="muted small">${esc(k.who)}</span></span><span class="row-meta">${esc(k.effect)}</span></span></button></li>`).join('')}</ul>` : ''}`;
  }
  return `<p style="margin-top:24px"><span class="label">${term('Advances')}</span><br><b class="num">${used}</b> of <b class="num">${available}</b> used${free > 0 ? ` · <b>${free} to choose</b>` : ''}</p>${picker}`;
}

function traitsView(c) {
  const ro = ui.readOnly;
  const rows = traitsOf(c).map((t) => {
    const def = TRAITS.find((x) => x.id === t);
    const tag = t === c.personalTrait ? 'personal' : (c.extraTraits || []).includes(t) ? 'advance' : 'background';
    return `<li><div class="row-main"><span class="row-text"><span class="row-title">${term(t)} <span class="tag">${tag}</span></span><span class="row-meta">${esc(def?.covers || '')}</span></span>
      ${!ro && ui.editing && (c.extraTraits || []).includes(t) ? `<button type="button" class="btn quiet" data-deltrait="${esc(t)}">Remove</button>` : ''}</div></li>`;
  });
  return `<ul class="rows">${rows.join('')}</ul>
    ${c.talents.length ? `<p class="label" style="margin-top:24px">${term('Talents')}</p><ul class="rows">${c.talents.map(talentById).filter(Boolean).map((t) => `<li><div class="row-main"><span class="row-text"><span class="row-title">${esc(t.name)} <span class="muted small">${esc(t.trait || 'general')}</span></span><span class="row-meta">${esc(t.effect)}</span></span>
      ${!ro && ui.editing ? `<button type="button" class="btn quiet" data-deltalent="${t.id}">Remove</button>` : ''}</div></li>`).join('')}</ul>` : ''}
    ${c.contacts.length ? `<p class="label" style="margin-top:24px">${term('Contacts')}</p><ul class="rows">${c.contacts.map((k, i) => {
      const def = CONTACTS.find((x) => x.id === k.type);
      return `<li><div class="row-main" style="flex-wrap:wrap"><span class="row-text" style="flex:1 1 200px"><span class="row-title">${term(k.type)}</span><span class="row-meta">${esc(def?.effect || '')}</span></span>
        ${ro ? `<span>${esc(k.name)}</span>` : `<input data-contactname="${i}" value="${esc(k.name)}" placeholder="Their name" aria-label="${esc(k.type)}'s name" style="flex:1 1 140px">`}
        ${!ro && ui.editing ? `<button type="button" class="btn quiet" data-delcontact="${i}">Remove</button>` : ''}</div></li>`;
    }).join('')}</ul>` : ''}
    ${advancesView(c)}
    ${ro ? '' : `<button type="button" class="btn quiet" data-act="edit">${ui.editing ? 'Done removing' : 'Remove traits, talents or contacts'}</button>`}`;
}

// ---------- the sheet ----------
function vital(label, hero, hint, controls, hintBad = false) {
  return `<div class="vital"><span class="label">${label}</span>${hero}<span class="hint ${hintBad ? 'bad' : ''}">${hint}</span>${controls}</div>`;
}

function stepper(attr, what, readOnly) {
  if (readOnly) return '';
  return `<span class="stepper"><button type="button" ${attr}="-1" aria-label="${what} down">−</button><button type="button" ${attr}="1" aria-label="${what} up">+</button></span>`;
}

function sect(id, title, meta, body) {
  return `<details class="sect" data-sect="${id}" id="sect-${id}" ${ui.open.has(id) ? 'open' : ''}>
    <summary>${title}<span class="meta">${meta}</span></summary><div class="sect-body">${body}</div></details>`;
}

function sheetView(c) {
  const bg = BACKGROUNDS.find((b) => b.id === c.background);
  const lvl = charLevel(c);
  const mw = maxWounds(c);
  const dying = c.wounds >= mw && !c.dead;
  const nextMarks = lvl < MAX_LEVEL ? marksForLevel(lvl + 1) : null;
  const weapons = c.gear.filter((g) => gearItem(g).kind === 'weapon');
  const armour = c.gear.filter((g) => gearItem(g).kind === 'armour');
  const active = (c.savedRules || []).filter((r) => r.active);
  const ro = ui.readOnly;
  const traits = traitsOf(c);
  const camp = c.campaignId ? campaignName(c.campaignId) : '';
  const free = (lvl - 1) - ((c.extraTraits?.length || 0) + (c.talents?.length || 0) + (c.contacts?.length || 0));
  return `<div class="page sheet">
    <div class="sheet-head">
      ${avatar(c.name || 'Unnamed', 'lg')}
      <div class="who"><h1>${esc(c.name || 'Unnamed')}</h1>
        <p class="pills">${[bg ? esc(bg.id) : '', `Level ${lvl}`, camp ? esc(camp) : '', c.dead ? 'Dead' : ''].filter(Boolean).map((x) => `<span class="tag">${x}</span>`).join('')}</p></div>
      ${ro ? '' : '<a class="btn quiet" href="#/characters">Switch</a>'}
    </div>
    ${c.dead ? '<p class="note bad"><b>This character is dead.</b> Make a new one: they join at crew level − 1.</p>' : ''}
    ${dying ? `<div class="note bad"><p><b>Dying.</b> You can't act or take more wounds. After the fight, a crewmate makes a ${term('Survival roll', 'survival roll')}.</p>
      ${ro ? '' : `<div class="row"><button type="button" class="btn" data-act="count-survival">Count the survival roll</button>
        <button type="button" class="btn" data-act="survive">Survived: −1 wound, gain a Scar</button>
        <button type="button" class="btn" data-act="survivecrit">Critical: −2 wounds, no Scar</button>
        <button type="button" class="btn danger" data-act="die">Died</button></div>`}</div>` : ''}

    <section class="vitals card" aria-label="At a glance">
      ${vital(term('Wounds'), `<span class="hero num">${c.wounds}<small>/${mw}</small></span>
        <span class="boxes-track ${mw - c.wounds <= 1 ? 'bad' : ''}" aria-hidden="true">${Array.from({ length: mw }, (_, i) => `<i class="${i < c.wounds ? 'on' : ''}"></i>`).join('')}</span>`,
        dying ? 'Dying' : `${mw - c.wounds} until Dying`, stepper('data-wounds', 'Wounds', ro), dying)}
      ${vital(term('Shaken'), `<span class="hero num">${c.shaken}</span>`, c.shaken ? `−${c.shaken} dice on every roll` : 'Clears after the fight', stepper('data-shaken', 'Shaken', ro))}
      ${vital(term('Chips'), ro ? `<span class="hero num">${c.chips}<small>c</small></span>`
        : `<button type="button" class="hero-btn" data-act="chips" aria-expanded="${ui.chipsOpen}" aria-controls="chips-adjust"><span class="hero num">${c.chips}<small>c</small></span></button>`, ro ? '' : 'Tap to spend or gain', '')}
      ${vital(term('Level'), `<span class="hero num">${lvl}</span>${nextMarks !== null
        ? `<span class="bar" aria-hidden="true"><i style="width:${Math.round(100 * Math.min(1, (c.marks - marksForLevel(lvl)) / Math.max(1, nextMarks - marksForLevel(lvl))))}%"></i></span>` : ''}`, nextMarks !== null ? `${c.marks} ${term('Marks')}, ${nextMarks - c.marks} to level ${lvl + 1}` : `${c.marks} Marks, top level`, stepper('data-marks', 'Marks', ro))}
    </section>
    ${ui.chipsOpen && !ro ? `<div class="adjust" id="chips-adjust">
      <label class="sr-only" for="chip-amt">Amount</label><input type="number" id="chip-amt" class="narrow" value="5" min="1" inputmode="numeric">
      <button type="button" class="btn" data-chips="-1">Spend</button><button type="button" class="btn" data-chips="1">Gain</button>
      <button type="button" class="btn quiet" data-act="chips">Done</button></div>` : ''}

    <div class="glance">
      <div class="glance-row"><span class="label">Traits</span><div>${traits.map((t) => term(t)).join('') || '<span class="muted">None</span>'}</div></div>
      ${weapons.length ? `<div class="glance-row"><span class="label">Attack</span><div>${weapons.map((g) => `<span>${term(gearItem(g).name, g.name)} <span class="num">${signed(gearItem(g).mod)}</span></span>`).join('')}</div></div>` : ''}
      ${armour.length ? `<div class="glance-row"><span class="label">Armour</span><div>${armour.map((g) => `<span>${term(gearItem(g).name, g.name)} <span class="num">${signed(gearItem(g).mod)}</span></span>`).join('')}</div></div>` : ''}
      ${active.length ? `<div class="glance-row"><span class="label">Rules</span><div class="strip">${active.map((r) => (ro ? `<span class="tag">${esc(r.title)}</span>` : `<button type="button" class="term-chip" data-peek-saved="${esc(r.id)}">${esc(r.title)}</button>`)).join('')}</div></div>` : ''}
    </div>

    ${ro ? '' : sect('dice', 'Count your dice', '', counterView(c))}
    ${sect('traits', 'Traits and advances', `${traits.length} traits${free > 0 ? `, ${free} to choose` : ''}`, traitsView(c))}
    ${sect('gear', 'Gear', `${c.gear.length} items`, `${gearList(c)}${shopLink(c)}`)}
    ${sect('rules', 'Saved rules', `${(c.savedRules || []).length} saved${active.length ? `, ${active.length} active` : ''}`, savedRulesView(c))}
    ${sect('who', 'Background and ties', bg ? esc(bg.id) : '', `<dl class="facts">
        <dt>Concept</dt><dd>${esc(c.concept) || '—'}</dd>
        <dt>${term('Background')}</dt><dd>${bg ? `${esc(bg.id)}<br><span class="muted small">${esc(bg.who)}</span>` : '—'}</dd>
        <dt>Depends on me</dt><dd>${esc(c.dependsOn) || '—'}</dd>
        <dt>Why Antioch</dt><dd><i>${esc(c.why)}</i></dd>
        <dt>Level ${lvl}</dt><dd class="muted small">${esc(LEVEL_REWARDS[lvl])}</dd>
      </dl>
      <p class="label" style="margin-top:24px">${term('Scars')}</p>
      ${c.scars.length ? `<ul class="rows">${c.scars.map((s, i) => `<li><div class="row-main"><span>${esc(s)}</span>${ro ? '' : `<button type="button" class="btn quiet" data-delscar="${i}" aria-label="Remove scar">Remove</button>`}</div></li>`).join('')}</ul>` : '<p class="muted small">None. Yet.</p>'}
      ${ro ? '' : `<div class="form-row" style="margin-top:8px"><input id="scar-input" aria-label="New scar" placeholder="Two fingers on her left hand don't bend any more."><button type="button" class="btn" data-act="addscar">Add scar</button></div>`}`)}
    ${sect('notes', 'Notes', c.notes ? 'Written' : '', ro ? `<div class="md">${renderMarkdown(c.notes) || '<p class="muted">No notes.</p>'}</div>`
      : `<label class="sr-only" for="char-notes">Notes</label><textarea id="char-notes" data-f="notes" rows="6" placeholder="Anything worth remembering: names, debts, leads…">${esc(c.notes)}</textarea>`)}
    ${ro ? '' : sect('settings', 'Character settings', '', `
      <label class="field"><span>Name</span><input data-f="name" value="${esc(c.name)}"></label>
      <label class="field"><span>Concept</span><input data-f="concept" value="${esc(c.concept)}"></label>
      <label class="field"><span>Campaign</span><select data-campaign>
        <option value="">Not in a campaign</option>
        ${(session.user?.campaigns || []).map((x) => `<option value="${esc(x.campaignId)}" ${x.campaignId === c.campaignId ? 'selected' : ''}>${esc(x.name)}${x.role === 'dm' ? ' (you run it)' : ''}</option>`).join('')}
      </select></label>
      <div class="row">
        ${c.campaignId ? `<a class="btn" href="#/c/${enc(c.campaignId)}">Open the campaign</a>` : ''}
        <button type="button" class="btn" data-act="print">Print</button>
        <button type="button" class="btn" data-act="recreate">Back to the creation steps</button>
        ${c.dead ? '<button type="button" class="btn" data-act="undead">Undo death</button>' : ''}
        <button type="button" class="btn danger" data-act="delete">Delete character</button>
      </div>`)}
  </div>`;
}

/** A character sheet the DM can look at but not change. */
export function readOnlySheet(c) {
  ui.readOnly = true;
  const html = c.created ? sheetView(c) : '<p class="muted">This character is still being made.</p>';
  ui.readOnly = false;
  return html;
}

// ---------- controller ----------
/** The Sheet tab: the current character, or the list if there isn't one. */
export function renderSheet(el, [sectId]) {
  const c = currentCharacter();
  renderCharacters(el, c ? [c.id, sectId] : []);
}

export function renderCharacters(el, [id, sectId]) {
  if (sectId && SECTIONS.includes(sectId)) ui.open.add(sectId);
  const draw = () => {
    const c = id && state.characters.find((x) => x.id === id);
    if (id && !c) { el.innerHTML = '<div class="page"><p>That character isn\'t here.</p><a class="btn" href="#/characters">All characters</a></div>'; return; }
    if (c && state.settings.currentChar !== c.id) { state.settings.currentChar = c.id; saveSettings(); }
    setTitle(c ? (c.name || 'New character') : 'Characters');
    // Prices, markets and starting level depend on the crew this character belongs to.
    if (c && c.campaignId && state.campaign?.id !== c.campaignId) {
      el.innerHTML = `<div class="page"><h1>${esc(c.name || 'Character')}</h1><p class="muted">Opening the crew…</p></div>`;
      openCampaign(c.campaignId, session.user.id).then(draw).catch((err) => {
        closeCampaign(c);
        toast(esc(err.message));
        el.innerHTML = c.created ? sheetView(c) : creationView(c);
      });
      return;
    }
    if (c && !c.campaignId) closeCampaign(c);
    const y = window.scrollY;
    el.innerHTML = !c ? listView() : c.created ? sheetView(c) : creationView(c);
    window.scrollTo(0, y);
  };
  draw();
  if (sectId && SECTIONS.includes(sectId)) requestAnimationFrame(() => el.querySelector(`#sect-${sectId}`)?.scrollIntoView({ block: 'start' }));

  const current = () => state.characters.find((x) => x.id === id);
  const commit = () => { save(); draw(); };

  // Remember which sections are open across redraws. (toggle doesn't bubble: listen once, capturing.)
  if (!el.dataset.sectBound) {
    el.dataset.sectBound = '1';
    el.addEventListener('toggle', (e) => {
      const d = e.target;
      if (!d.dataset?.sect) return;
      if (d.open) ui.open.add(d.dataset.sect); else ui.open.delete(d.dataset.sect);
    }, true);
  }

  const onSaved = () => { if (el.isConnected && current()) draw(); };
  window.addEventListener('ps:saved-rules', onSaved);
  const cleanup = () => { window.removeEventListener('ps:saved-rules', onSaved); window.removeEventListener('hashchange', cleanup); };
  window.addEventListener('hashchange', cleanup);

  el.oninput = (e) => {
    const c = current();
    if (!c) return;
    const f = e.target.dataset.f;
    if (f && ['name', 'concept', 'dependsOn', 'notes'].includes(f)) { c[f] = e.target.value; save(); }
    if (f === 'name') setTitle(c.name || 'New character');
    if (f === 'whyCustom') { c.why = e.target.value; save(); }
    if (e.target.dataset.contactname !== undefined) { c.contacts[Number(e.target.dataset.contactname)].name = e.target.value; save(); }
  };
  el.onchange = (e) => {
    const c = current();
    if (!c) return;
    const t = e.target;
    if (t.dataset.campaign !== undefined) {
      t.disabled = true;
      attachCharacter(c, t.value || null)
        .then(() => { toast(t.value ? 'Joined the campaign' : 'Left the campaign'); draw(); })
        .catch((err) => { toast(esc(err.message)); draw(); });
      return;
    }
    // During creation, typing only updates what depends on it: a full redraw here would swallow the tap that caused the blur.
    if (t.dataset.f === 'name' || t.dataset.f === 'dependsOn') { if (!c.created) updateCreation(el, c); return; }
    if (t.dataset.f === 'startLevel') { c.marks = marksForLevel(Number(t.value)); commit(); return; }
    if (t.dataset.why) {
      if (t.dataset.why === '__custom') c.why = el.querySelector('[data-f="whyCustom"]').value || 'Because…';
      else c.why = t.dataset.why;
      commit();
      return;
    }
    if (t.dataset.counter) { ui.counter[t.dataset.counter] = t.value; draw(); }
  };
  el.onsubmit = (e) => {
    if (e.target.id !== 'add-rule') return;
    e.preventDefault();
    const c = current();
    const f = new FormData(e.target);
    c.savedRules = c.savedRules || [];
    c.savedRules.unshift({ id: uid(), key: `own:${uid()}`, title: String(f.get('title')).trim(), text: String(f.get('text')).trim(), source: String(f.get('source') || '').trim(), active: true });
    ui.addingRule = false;
    toast('Rule saved. It shows at the top of the sheet while it\'s active.');
    commit();
  };

  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    const c = current();

    if (d.act === 'new') {
      b.disabled = true;
      closeCampaign(); // made from the list, it isn't in a campaign yet
      addCharacter(newCharacter())
        .then((n) => { location.hash = `#/characters/${n.id}`; })
        .catch((err) => { b.disabled = false; toast(esc(err.message)); });
      return;
    }
    if (!c) return;

    switch (d.act) {
      case 'delete':
        if (confirm(`Delete ${c.name || 'this character'} for good?`)) {
          removeCharacter(c.id)
            .then(() => { if (state.settings.currentChar === c.id) { state.settings.currentChar = null; saveSettings(); } location.hash = '#/characters'; })
            .catch((err) => toast(esc(err.message)));
        }
        return;
      case 'finish': c.created = true; toast(`${esc(c.name)} is ready`); commit(); window.scrollTo(0, 0); return;
      case 'recreate': c.created = false; ui.editing = false; commit(); return;
      case 'edit': ui.editing = !ui.editing; draw(); return;
      case 'print': ui.open = new Set(SECTIONS.filter((s) => s !== 'dice' && s !== 'settings')); draw(); window.print(); return;
      case 'chips': ui.chipsOpen = !ui.chipsOpen; draw(); if (ui.chipsOpen) el.querySelector('#chip-amt')?.select(); return;
      case 'add-rule': ui.addingRule = true; draw(); el.querySelector('#add-rule input')?.focus(); return;
      case 'cancel-rule': ui.addingRule = false; draw(); return;
      case 'counter-clear': ui.counter.on.clear(); ui.counter.trait = ''; ui.counter.extra = 0; ui.counter.armour = 0; draw(); return;
      case 'count-survival':
        ui.counter.mode = 'survival'; ui.counter.on = new Set(owns(c, 'satchel') ? ['satchel'] : []);
        ui.open.add('dice'); draw(); el.querySelector('#sect-dice')?.scrollIntoView({ block: 'start' }); return;
      case 'addscar': {
        const v = el.querySelector('#scar-input').value.trim();
        if (v) { c.scars.push(v); commit(); }
        return;
      }
      case 'survive': c.wounds = Math.max(0, maxWounds(c) - 1); c.scars.push('A new scar (describe it)'); toast('Survived. Describe the Scar.'); ui.open.add('who'); commit(); return;
      case 'survivecrit': c.wounds = Math.max(0, maxWounds(c) - 2); toast('Survived without a Scar'); commit(); return;
      case 'die': if (confirm(`${c.name} dies?`)) { c.dead = true; commit(); } return;
      case 'undead': c.dead = false; commit(); return;
      default: break;
    }

    // dice counter
    if (d.mode) { ui.counter.mode = d.mode; ui.counter.on = new Set(); draw(); return; }
    if (d.src) {
      const set = ui.counter.on;
      const src = DICE_SOURCES[ui.counter.mode].find((s) => s.id === d.src);
      if (set.has(src.id)) set.delete(src.id);
      else {
        DICE_SOURCES[ui.counter.mode].forEach((s) => { if (src.group && s.group === src.group) set.delete(s.id); });
        set.add(src.id);
      }
      draw();
      return;
    }
    if (d.armour !== undefined) { ui.counter.armour = Number(d.armour); draw(); return; }
    if (d.extra) { ui.counter.extra = Math.max(-5, Math.min(5, ui.counter.extra + Number(d.extra))); draw(); return; }

    // creation
    if (d.bg) { setBackground(c, d.bg); commit(); return; }
    if (d.bgtrait) {
      const i = c.bgTraits.indexOf(d.bgtrait);
      if (i >= 0) c.bgTraits.splice(i, 1);
      else {
        if (c.bgTraits.length >= 2) c.bgTraits.shift();
        c.bgTraits.push(d.bgtrait);
        if (c.personalTrait === d.bgtrait) c.personalTrait = '';
      }
      commit();
      return;
    }
    if (d.ptrait) { c.personalTrait = c.personalTrait === d.ptrait ? '' : d.ptrait; commit(); return; }

    // gear
    if (d.sell || d.drop || d.use) {
      const g = c.gear.find((x) => x.id === (d.sell || d.drop || d.use));
      if (!g) return;
      const item = gearItem(g);
      if (d.sell) { c.chips += sellPrice(item, c); toast(`Sold ${esc(g.name)} for ${sellPrice(item, c)}c`); }
      if (d.use) {
        if (g.item === 'boilerblack') c.shaken = Math.max(0, c.shaken - 1);
        if (g.item === 'stitchglue') c.wounds = Math.max(0, c.wounds - 1);
        if (g.item === 'salve') c.wounds = Math.max(0, c.wounds - 2);
        toast(`Used ${esc(g.name)}${item.effect ? `: ${esc(item.effect)}` : ''}`);
      }
      g.qty -= 1;
      if (g.qty <= 0 || d.drop) c.gear = c.gear.filter((x) => x !== g);
      commit();
      return;
    }
    if (d.gq) {
      const g = c.gear.find((x) => x.id === d.gq);
      g.qty += Number(d.n);
      if (g.qty <= 0) c.gear = c.gear.filter((x) => x !== g);
      commit();
      return;
    }

    // vitals
    if (d.wounds) { c.wounds = Math.max(0, Math.min(maxWounds(c), c.wounds + Number(d.wounds))); commit(); return; }
    if (d.shaken) {
      const next = c.shaken + Number(d.shaken);
      // Shaken past −3 becomes a wound (dice_system.md, Injury Table).
      if (next > 3) { c.wounds = Math.min(maxWounds(c), c.wounds + 1); toast('Already at −3 Shaken: that\'s 1 wound instead'); } else c.shaken = Math.max(0, next);
      commit();
      return;
    }
    if (d.marks) {
      const before = charLevel(c);
      c.marks = Math.max(0, c.marks + Number(d.marks));
      const after = charLevel(c);
      if (after > before) toast(`Level ${after}! ${esc(LEVEL_REWARDS[after])}`);
      commit();
      return;
    }
    if (d.chips) {
      const amt = Math.max(0, Math.floor(Number(el.querySelector('#chip-amt').value)) || 0);
      c.chips = Math.max(0, c.chips + Number(d.chips) * amt);
      commit();
      return;
    }

    // saved rules (the active switch is handled by peek.js, so it works inside the sheet too)
    if (d.delrule) {
      const r = (c.savedRules || []).find((x) => x.id === d.delrule);
      if (r && confirm(`Remove “${r.title}” from this sheet?`)) { c.savedRules = c.savedRules.filter((x) => x !== r); commit(); }
      return;
    }

    // other sections
    if (d.delscar !== undefined) { c.scars.splice(Number(d.delscar), 1); commit(); return; }
    if (d.advtype) { ui.advance = ui.advance === d.advtype ? '' : d.advtype; draw(); return; }
    if (d.addtrait) { c.extraTraits.push(d.addtrait); ui.advance = ''; toast(`Learned ${esc(d.addtrait)}. How did you learn it?`); commit(); return; }
    if (d.addtalent) { c.talents.push(d.addtalent); ui.advance = ''; commit(); return; }
    if (d.addcontact) { c.contacts.push({ type: d.addcontact, name: '' }); ui.advance = ''; commit(); return; }
    if (d.deltrait) { c.extraTraits = c.extraTraits.filter((t) => t !== d.deltrait); c.talents = c.talents.filter((t) => talentById(t)?.trait !== d.deltrait); commit(); return; }
    if (d.deltalent) { c.talents = c.talents.filter((t) => t !== d.deltalent); commit(); return; }
    if (d.delcontact !== undefined) { c.contacts.splice(Number(d.delcontact), 1); commit(); }
  };
}
