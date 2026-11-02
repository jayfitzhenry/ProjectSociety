// Character creation wizard and in-play character sheet.
import {
  TRAITS, TALENTS, CONTACTS, BACKGROUNDS, ITEMS, MARKETS, KIND_LABEL, SPECIAL_RULES, STARTING_CHIPS,
  MAX_TRAITS, MAX_CONTACTS, MAX_GRAFTS, WHY_ANTIOCH, LEVEL_REWARDS, MAX_LEVEL, itemById, traitIcon,
  marksForLevel,
} from './data.js';
import {
  state, save, esc, uid, toast, charLevel, maxWounds, crewLevel, marketOpen, buyPrice, sellPrice, gearItem,
} from './store.js';
import { roll, renderRoll, netOf, poolLabel, distribution, pct, signed } from './dice.js';

const ui = { shopOpen: false, shopKind: 'weapon', editing: false, roll: { trait: '', tool: false, easy: 0, help: false, extra: 0 }, lastRoll: null, advance: '' };

export const traitsOf = (c) => [...(c.bgTraits || []), c.personalTrait, ...(c.extraTraits || [])].filter(Boolean);

function newCharacter() {
  const startLevel = Math.max(1, crewLevel() - (state.crew.projects.hall >= 2 ? 0 : 1));
  const hasCrew = state.characters.some((c) => c.created && !c.dead);
  return {
    id: uid(), created: false, dead: false, name: '', concept: '', background: '', bgTraits: [], personalTrait: '',
    extraTraits: [], talents: [], contacts: [], marks: hasCrew ? marksForLevel(startLevel) : 0, wounds: 0, shaken: 0,
    scars: [], chips: STARTING_CHIPS, gear: [], dependsOn: '', why: WHY_ANTIOCH[0], notes: '',
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

function addGear(c, itemId, qty = 1) {
  const item = itemById(itemId);
  const stackable = ['consumable'].includes(item.kind);
  const existing = stackable && c.gear.find((g) => g.item === itemId);
  if (existing) existing.qty += qty;
  else c.gear.push({ id: uid(), item: itemId, qty, name: item.name });
}

// ---------- list ----------
function listView() {
  const chars = state.characters;
  const cl = crewLevel();
  return `<div class="page">
    <div class="page-head">
      <h1>🧰 Characters</h1>
      <div class="actions"><button type="button" class="btn primary" data-act="new">➕ New character</button></div>
    </div>
    <p class="lead">Crew level <b>${cl}</b>. Characters are saved in this browser. Use <a href="#/crew">Crew › Save data</a> to export or import them.</p>
    ${chars.length ? `<div class="card-grid">${chars.map((c) => {
      const bg = BACKGROUNDS.find((b) => b.id === c.background);
      const mw = maxWounds(c);
      return `<a class="card link-card char-card ${c.dead ? 'dead' : ''}" href="#/characters/${c.id}">
        <div class="big">${c.dead ? '⚰️' : bg?.icon || '🪪'}</div>
        <b>${esc(c.name || 'Unnamed')}</b>
        <small class="muted">${c.created ? `${esc(c.background)} · Level ${charLevel(c)}` : '✏️ In creation'}</small>
        ${c.created ? `<div class="mini-stats"><span title="Wounds">🩸 ${c.wounds}/${mw}</span><span title="Shaken">🟡 ${c.shaken}</span><span title="Chips">🪙 ${c.chips}c</span></div>
        <small class="muted">${traitsOf(c).map((t) => `${traitIcon(t)} ${t}`).join(' · ')}</small>` : ''}
      </a>`;
    }).join('')}</div>` : `<div class="card empty"><p>No characters yet.</p><p class="muted">A new player should finish in about ten minutes.</p>
      <button type="button" class="btn primary" data-act="new">➕ Create the first character</button></div>`}
  </div>`;
}

// ---------- creation ----------
function stepHead(n, title, done) {
  return `<h2 class="step-h ${done ? 'done' : ''}"><span class="num">${done ? '✓' : n}</span> ${title}</h2>`;
}

function creationView(c) {
  const bg = BACKGROUNDS.find((b) => b.id === c.background);
  const traits = traitsOf(c);
  const ready = c.name.trim() && bg && c.bgTraits.length === 2 && c.personalTrait;
  const lvl = charLevel(c);
  return `<div class="page creation">
    <div class="page-head">
      <h1>🪪 New character</h1>
      <div class="actions"><a class="btn" href="#/characters">← All characters</a><button type="button" class="btn danger" data-act="delete">Discard</button></div>
    </div>

    <section class="card">
      ${stepHead(1, 'Name and concept', c.name.trim())}
      <div class="form-row">
        <label class="field"><span>Name</span><input data-f="name" value="${esc(c.name)}" placeholder="Dace"></label>
        <label class="field grow"><span>Who are you, in one sentence?</span><input data-f="concept" value="${esc(c.concept)}" placeholder="A foundry hand who knows every boiler on Cistern Row."></label>
      </div>
      <details class="small-details"><summary>Joining later, or a replacement? Starting level: <b>${lvl}</b></summary>
        <p class="muted small">New and replacement characters start at <b>crew level − 1</b> (the full crew level with Hall II), with the Marks for that level and an advance for each level from 2 up.</p>
        <label class="field inline"><span>Start at level</span><select data-f="startLevel">${Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => `<option ${l === lvl ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </details>
    </section>

    <section class="card">
      ${stepHead(2, 'Background: choose one, then take 2 of its 3 traits', bg && c.bgTraits.length === 2)}
      <div class="bg-grid">
        ${BACKGROUNDS.map((b) => `<button type="button" class="bg-card ${b.id === c.background ? 'on' : ''}" data-bg="${esc(b.id)}">
          <div class="bg-title">${b.icon} <b>${b.id}</b></div>
          <div class="muted small">${b.who}</div>
          <div class="small">${b.traits.map((t) => `${traitIcon(t)} ${t}`).join(' · ')}</div>
        </button>`).join('')}
      </div>
      ${bg ? `<h3>Pick 2 traits from ${bg.icon} ${bg.id}</h3>
        <div class="chips">${bg.traits.map((t) => `<button type="button" class="chip ${c.bgTraits.includes(t) ? 'on' : ''}" data-bgtrait="${t}">${traitIcon(t)} ${t}</button>`).join('')}</div>` : ''}
    </section>

    <section class="card">
      ${stepHead(3, 'Personal trait: one more, from any background', c.personalTrait)}
      <p class="muted">This is what makes you more than your job.</p>
      <div class="trait-grid">
        ${TRAITS.map((t) => {
          const taken = c.bgTraits.includes(t.id);
          return `<button type="button" class="trait-card ${c.personalTrait === t.id ? 'on' : ''}" data-ptrait="${t.id}" ${taken ? 'disabled' : ''}>
            <b>${t.icon} ${t.id}</b><small>${esc(t.covers)}</small><small class="muted">✗ ${esc(t.not)}</small></button>`;
        }).join('')}
      </div>
    </section>

    <section class="card">
      ${stepHead(4, 'Wounds', true)}
      <p>Every character starts with <b>${maxWounds(c)} wounds</b>${lvl >= 4 ? ' (5, plus Hardened)' : ''}. Fill the last box and you're <b>Dying</b>.</p>
    </section>

    <section class="card">
      ${stepHead(5, 'Kit and chips', !!bg)}
      ${bg ? '' : '<p class="muted">Choose a background first to get its starting kit.</p>'}
      ${gearTable(c, true)}
      <div class="chips-line">🪙 <b>${c.chips}c</b> to spend on the market now, or keep.</div>
      ${shopView(c)}
    </section>

    <section class="card">
      ${stepHead(6, 'Ties to home', c.dependsOn.trim())}
      <label class="field"><span>Who at home depends on you?</span><input data-f="dependsOn" value="${esc(c.dependsOn)}" placeholder="Old Merren, who taught me the boilers"></label>
      <div class="field"><span>Why do you still work for Antioch?</span>
        ${WHY_ANTIOCH.map((w) => `<label class="radio"><input type="radio" name="why" data-why="${esc(w)}" ${c.why === w ? 'checked' : ''}> <i>${esc(w)}</i></label>`).join('')}
        <label class="radio"><input type="radio" name="why" data-why="__custom" ${!WHY_ANTIOCH.includes(c.why) ? 'checked' : ''}> Your own:
          <input data-f="whyCustom" value="${WHY_ANTIOCH.includes(c.why) ? '' : esc(c.why)}" placeholder="Because…"></label>
      </div>
    </section>

    <section class="card finish">
      <div>
        <b>${esc(c.name || 'Unnamed')}</b> · ${bg ? `${bg.icon} ${bg.id}` : 'no background'} · Level ${lvl}
        <div class="muted small">${traits.map((t) => `${traitIcon(t)} ${t}`).join(' · ') || 'No traits yet'}</div>
      </div>
      <button type="button" class="btn primary big" data-act="finish" ${ready ? '' : 'disabled'}>✅ Finish character</button>
      ${ready ? '' : '<p class="muted small">Needs a name, a background with 2 traits, and a personal trait.</p>'}
    </section>
  </div>`;
}

// ---------- gear & shop ----------
function itemStats(item) {
  if (item.kind === 'weapon') return `<b>${signed(item.mod)}</b> wound · ${esc(item.range)}`;
  if (item.kind === 'armour') return `<b>${signed(item.mod)}</b> vs wounds`;
  if (item.kind === 'tool') return `<b>+1</b> ${esc(item.helps)}`;
  return esc(item.effect || '');
}

function rulesTags(rules = []) {
  return rules.map((r) => `<span class="tag" title="${esc(SPECIAL_RULES[r] || '')}">${esc(r)}</span>`).join('');
}

function gearTable(c, creation = false) {
  if (!c.gear.length) return '<p class="muted">No gear.</p>';
  return `<div class="table-wrap"><table class="gear">
    <thead><tr><th>Item</th><th>Stats</th><th>Rules</th><th>Qty</th><th></th></tr></thead>
    <tbody>${c.gear.map((g) => {
      const item = gearItem(g);
      const usable = ['consumable', 'weapon'].includes(item.kind) && (item.kind === 'consumable' || item.rules.includes('Consumable'));
      return `<tr>
        <td><b>${esc(g.name)}</b>${g.name !== item.name ? `<div class="muted small">${esc(item.name)}</div>` : ''}${g.kit && creation ? ' <span class="tag kit">kit</span>' : ''}</td>
        <td class="small">${itemStats(item)}</td>
        <td>${rulesTags(item.rules)}</td>
        <td class="qty">${item.kind === 'consumable' ? `<button type="button" class="tiny" data-gq="${g.id}" data-n="-1">−</button> ${g.qty} <button type="button" class="tiny" data-gq="${g.id}" data-n="1">+</button>` : g.qty > 1 ? g.qty : ''}</td>
        <td class="row-acts">
          ${usable && !creation ? `<button type="button" class="tiny" data-use="${g.id}">Use</button>` : ''}
          ${item.kind !== 'graft' ? `<button type="button" class="tiny" data-sell="${g.id}" title="Sell one for ${sellPrice(item, c)}c">Sell ${sellPrice(item, c)}c</button>` : ''}
          <button type="button" class="tiny ghost" data-drop="${g.id}" title="Remove without selling">✕</button>
        </td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function shopView(c) {
  if (!ui.shopOpen) return '<button type="button" class="btn" data-act="shop">🛒 Open the market</button>';
  const kinds = Object.keys(KIND_LABEL);
  const items = ITEMS.filter((i) => i.kind === ui.shopKind);
  const grafts = c.gear.filter((g) => gearItem(g).kind === 'graft').length;
  return `<div class="shop">
    <div class="shop-head"><b>🛒 Market</b> <span class="muted small">${Object.entries(MARKETS).map(([k, m]) => `${m.icon} ${m.name} ${marketOpen(k) ? '✅' : `🔒 L${m.level}`}`).join(' · ')}</span>
      <button type="button" class="tiny ghost" data-act="shop">Close ✕</button></div>
    <div class="seg small">${kinds.map((k) => `<button type="button" data-shopkind="${k}" class="${k === ui.shopKind ? 'on' : ''}">${KIND_LABEL[k]}</button>`).join('')}</div>
    ${ui.shopKind === 'armour' ? '<p class="muted small">Wear one piece only.</p>' : ''}
    ${ui.shopKind === 'tool' ? '<p class="muted small">Only one tool counts per roll, on top of a trait.</p>' : ''}
    ${ui.shopKind === 'graft' ? `<p class="muted small">Permanent, illegal, at most ${MAX_GRAFTS}. Found = +2 Exposure. You have ${grafts}.</p>` : ''}
    <div class="table-wrap"><table class="shop-table"><tbody>
      ${items.map((i) => {
        const open = marketOpen(i.market);
        const price = buyPrice(i);
        const graftFull = i.kind === 'graft' && (grafts >= MAX_GRAFTS || c.gear.some((g) => g.item === i.id));
        const can = open && c.chips >= price && !graftFull;
        return `<tr class="${open ? '' : 'locked'}">
          <td>${MARKETS[i.market].icon} <b>${esc(i.name)}</b></td>
          <td class="small">${itemStats(i)}</td>
          <td>${rulesTags(i.rules)}</td>
          <td class="price">${price !== i.price ? `<s class="muted">${i.price}</s> ` : ''}${price}c</td>
          <td><button type="button" class="tiny ${can ? 'primary' : ''}" data-buy="${i.id}" ${can ? '' : 'disabled'}>${open ? 'Buy' : '🔒'}</button></td>
        </tr>`;
      }).join('')}
    </tbody></table></div>
  </div>`;
}

// ---------- sheet ----------
function boxes(n, filled, attr, cls = '') {
  return Array.from({ length: n }, (_, i) => `<button type="button" class="box ${cls} ${i < filled ? 'on' : ''}" ${attr}="${i + 1}" aria-label="${i + 1}"></button>`).join('');
}

function advancesView(c) {
  const lvl = charLevel(c);
  const available = lvl - 1;
  const used = (c.extraTraits?.length || 0) + (c.talents?.length || 0) + (c.contacts?.length || 0);
  const free = available - used;
  const traits = traitsOf(c);
  let picker = '';
  if (free > 0) {
    const opts = [];
    if (traits.length < MAX_TRAITS) opts.push(['trait', '🧬 New trait']);
    if (traits.some((t) => !c.talents.includes(t))) opts.push(['talent', '🌟 Talent']);
    if (c.contacts.length < MAX_CONTACTS) opts.push(['contact', '🤝 Contact']);
    picker = `<div class="advance-picker">
      <div class="seg small">${opts.map(([k, l]) => `<button type="button" data-advtype="${k}" class="${ui.advance === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${ui.advance === 'trait' ? `<div class="chips">${TRAITS.filter((t) => !traits.includes(t.id)).map((t) => `<button type="button" class="chip" data-addtrait="${t.id}" title="${esc(t.covers)}">${t.icon} ${t.id}</button>`).join('')}</div><p class="muted small">Describe how you learned it.</p>` : ''}
      ${ui.advance === 'talent' ? `<div class="list">${traits.filter((t) => !c.talents.includes(t)).map((t) => `<button type="button" class="list-btn" data-addtalent="${t}"><b>${TALENTS[t].name}</b> <span class="muted">(${traitIcon(t)} ${t})</span><br><small>${esc(TALENTS[t].effect)}</small></button>`).join('')}</div>` : ''}
      ${ui.advance === 'contact' ? `<div class="list">${CONTACTS.filter((k) => !c.contacts.some((x) => x.type === k.id)).map((k) => `<button type="button" class="list-btn" data-addcontact="${k.id}"><b>${k.icon} ${k.id}</b> <span class="muted">${esc(k.who)}</span><br><small>${esc(k.effect)}</small></button>`).join('')}</div>` : ''}
    </div>`;
  }
  return `<div class="advances">
    <div class="adv-count ${free > 0 ? 'has' : ''}">⭐ Advances: <b>${used}</b> of <b>${available}</b> used${free > 0 ? ` · <b>${free} to choose</b>` : ''}</div>
    ${picker}
  </div>`;
}

function quickRoll(c) {
  const r = ui.roll;
  const traits = traitsOf(c);
  const tools = c.gear.filter((g) => gearItem(g).kind === 'tool' || ['stillhand', 'cleareye'].includes(g.item));
  let plus = 0;
  let minus = c.shaken;
  if (r.trait === '__knowhow') minus += 1; else if (r.trait) plus += 1;
  if (r.tool) plus += 1;
  if (r.easy > 0) plus += 1;
  if (r.easy < 0) minus += 1;
  if (r.help) plus += 1;
  if (r.extra > 0) plus += r.extra; else minus += -r.extra;
  const net = netOf(plus, minus);
  const d = distribution(net);
  return `<div class="quick-roll">
    <div class="form-row">
      <label class="field"><span>Trait</span><select data-qr="trait">
        <option value="" ${r.trait === '' ? 'selected' : ''}>No trait: anyone could try (0)</option>
        <option value="__knowhow" ${r.trait === '__knowhow' ? 'selected' : ''}>No trait: needs know-how (−1)</option>
        ${traits.map((t) => `<option value="${t}" ${r.trait === t ? 'selected' : ''}>${traitIcon(t)} ${t} (+1)</option>`).join('')}
      </select></label>
      <label class="field"><span>Difficulty</span><select data-qr="easy">
        <option value="1" ${r.easy === 1 ? 'selected' : ''}>🟢 Easy (+1)</option>
        <option value="0" ${r.easy === 0 ? 'selected' : ''}>Normal</option>
        <option value="-1" ${r.easy === -1 ? 'selected' : ''}>🔴 Hard (−1)</option>
      </select></label>
    </div>
    <div class="checks">
      <label class="check"><input type="checkbox" data-qr="tool" ${r.tool ? 'checked' : ''}> 🧰 Tool (+1)${tools.length ? ` <span class="muted small">${tools.map((g) => esc(g.name)).join(', ')}</span>` : ''}</label>
      <label class="check"><input type="checkbox" data-qr="help" ${r.help ? 'checked' : ''}> 🤝 Helper (+1)</label>
      <label class="field inline"><span>Other</span><select data-qr="extra">${[-3, -2, -1, 0, 1, 2, 3].map((n) => `<option value="${n}" ${r.extra === n ? 'selected' : ''}>${signed(n)}</option>`).join('')}</select></label>
      ${c.shaken ? `<span class="tag neg">🟡 Shaken −${c.shaken}</span>` : ''}
    </div>
    <div class="qr-go"><button type="button" class="btn primary" data-act="qroll">🎲 Roll ${poolLabel(net)}</button>
      <span class="muted">net ${signed(net)} · <b>${pct(d.pass)}</b> to pass</span></div>
    ${ui.lastRoll ? renderRoll(ui.lastRoll, 'test', { animate: true }) : ''}
  </div>`;
}

function sheetView(c) {
  const bg = BACKGROUNDS.find((b) => b.id === c.background);
  const lvl = charLevel(c);
  const mw = maxWounds(c);
  const dying = c.wounds >= mw;
  const nextMarks = lvl < MAX_LEVEL ? marksForLevel(lvl + 1) : null;
  const weapons = c.gear.filter((g) => gearItem(g).kind === 'weapon');
  const armour = c.gear.filter((g) => gearItem(g).kind === 'armour');
  return `<div class="page sheet ${c.dead ? 'is-dead' : ''}">
    <div class="page-head">
      <div>
        <h1>${c.dead ? '⚰️' : bg?.icon || '🪪'} ${esc(c.name)}</h1>
        <div class="muted">${esc(c.concept)}</div>
      </div>
      <div class="actions no-print">
        <a class="btn" href="#/characters">← All</a>
        <button type="button" class="btn" data-act="print">🖨️ Print</button>
        <button type="button" class="btn" data-act="edit">${ui.editing ? '✅ Done editing' : '✏️ Edit'}</button>
      </div>
    </div>
    ${c.dead ? '<div class="callout bad">⚰️ This character is dead. Make a new one: they join at crew level − 1.</div>' : ''}
    ${dying && !c.dead ? `<div class="callout bad"><b>🫀 Dying.</b> Can't act or take more wounds. After the combat, someone makes a survival roll (a Medic test).
      <div class="actions"><a class="btn" href="#/rules/actions/dying">Rules</a><button type="button" class="btn" data-act="survive">✅ Survived (−1 wound, gain a Scar)</button><button type="button" class="btn" data-act="survivecrit">💥 Critical (−2 wounds, no Scar)</button><button type="button" class="btn danger" data-act="die">⚰️ Died</button></div></div>` : ''}
    ${ui.editing ? `<section class="card">
      <div class="form-row">
        <label class="field"><span>Name</span><input data-f="name" value="${esc(c.name)}"></label>
        <label class="field grow"><span>Concept</span><input data-f="concept" value="${esc(c.concept)}"></label>
      </div>
      <div class="actions"><button type="button" class="btn" data-act="recreate">↩️ Back to creation steps</button>
      ${c.dead ? '<button type="button" class="btn" data-act="undead">Undo death</button>' : ''}
      <button type="button" class="btn danger" data-act="delete">🗑️ Delete character</button></div>
    </section>` : ''}

    <div class="sheet-grid">
      <section class="card">
        <h3>📇 Who</h3>
        <dl class="kv">
          <dt>Background</dt><dd>${bg ? `${bg.icon} ${esc(bg.id)}` : '—'}</dd>
          <dt>Level</dt><dd><b>${lvl}</b> <span class="muted small">${esc(LEVEL_REWARDS[lvl])}</span></dd>
          <dt>Marks</dt><dd><span class="inline-step"><button type="button" class="tiny" data-marks="-1">−</button> <b>${c.marks}</b> <button type="button" class="tiny" data-marks="1">+</button></span>
            ${nextMarks !== null ? `<span class="muted small">${nextMarks - c.marks} to level ${lvl + 1}</span>` : '<span class="muted small">max level</span>'}</dd>
          <dt>Depends on me</dt><dd>${esc(c.dependsOn) || '—'}</dd>
          <dt>Why Antioch</dt><dd><i>${esc(c.why)}</i></dd>
        </dl>
      </section>

      <section class="card">
        <h3>🩸 Wounds <span class="muted small">${c.wounds}/${mw}</span></h3>
        <div class="boxes">${boxes(mw, c.wounds, 'data-wound', 'wound')}</div>
        <h3>🟡 Shaken <span class="muted small">${c.shaken ? `−${c.shaken} dice until the end of combat` : 'clears after combat'}</span></h3>
        <div class="boxes">${boxes(3, c.shaken, 'data-shaken', 'shaken')}</div>
        <div class="actions small">
          <button type="button" class="btn small" data-act="clearshaken">End of combat (clear Shaken)</button>
        </div>
        <h3>🩻 Scars</h3>
        ${c.scars.length ? `<ul class="scars">${c.scars.map((s, i) => `<li>${esc(s)} <button type="button" class="tiny ghost" data-delscar="${i}">✕</button></li>`).join('')}</ul>` : '<p class="muted small">None. Yet.</p>'}
        <div class="form-row"><input id="scar-input" placeholder="Two fingers on her left hand don't bend any more."><button type="button" class="btn small" data-act="addscar">Add</button></div>
      </section>

      <section class="card">
        <h3>🧬 Traits</h3>
        <ul class="traits">${traitsOf(c).map((t) => {
          const def = TRAITS.find((x) => x.id === t);
          return `<li><b>${def.icon} ${t}</b> ${t === c.personalTrait ? '<span class="tag">personal</span>' : ''}${(c.extraTraits || []).includes(t) ? `<span class="tag">advance</span>${ui.editing ? ` <button type="button" class="tiny ghost" data-deltrait="${t}">✕</button>` : ''}` : ''}<br><small class="muted">${esc(def.covers)}</small></li>`;
        }).join('')}</ul>
        ${c.talents.length ? `<h3>🌟 Talents</h3><ul class="traits">${c.talents.map((t) => `<li><b>${TALENTS[t].name}</b> <span class="muted small">(${t})</span>${ui.editing ? ` <button type="button" class="tiny ghost" data-deltalent="${t}">✕</button>` : ''}<br><small>${esc(TALENTS[t].effect)}</small></li>`).join('')}</ul>` : ''}
        ${c.contacts.length ? `<h3>🤝 Contacts</h3><ul class="traits">${c.contacts.map((k, i) => {
          const def = CONTACTS.find((x) => x.id === k.type);
          return `<li><b>${def.icon} ${k.type}</b> <input class="inline-input" data-contactname="${i}" value="${esc(k.name)}" placeholder="their name">${ui.editing ? ` <button type="button" class="tiny ghost" data-delcontact="${i}">✕</button>` : ''}<br><small>${esc(def.effect)}</small></li>`;
        }).join('')}</ul>` : ''}
        ${advancesView(c)}
      </section>

      <section class="card">
        <h3>🎲 Quick roll</h3>
        ${quickRoll(c)}
        ${weapons.length || armour.length ? `<div class="combat-summary small">
          ${weapons.map((g) => `🗡️ ${esc(g.name)} <b>${signed(gearItem(g).mod)}</b>`).join(' · ')}
          ${armour.length ? ` · ${armour.map((g) => `🛡️ ${esc(g.name)} <b>${signed(gearItem(g).mod)}</b>`).join(' · ')}` : ''}
          · <a href="#/combat">Attack calculator →</a></div>` : ''}
      </section>
    </div>

    <section class="card">
      <div class="gear-head">
        <h3>🎒 Gear</h3>
        <div class="chips-ctl">🪙 <b>${c.chips}c</b>
          <input type="number" id="chip-amt" value="5" min="1" class="num-input" aria-label="amount">
          <button type="button" class="tiny" data-chips="-1">− Spend</button>
          <button type="button" class="tiny" data-chips="1">+ Gain</button>
        </div>
      </div>
      ${gearTable(c)}
      <div class="no-print">${shopView(c)}</div>
    </section>

    <section class="card">
      <h3>📝 Notes</h3>
      <textarea data-f="notes" rows="4" placeholder="Anything else worth remembering…">${esc(c.notes)}</textarea>
    </section>
  </div>`;
}

// ---------- controller ----------
export function renderCharacters(el, [id]) {
  ui.lastRoll = null;
  const draw = () => {
    const c = id && state.characters.find((x) => x.id === id);
    if (id && !c) { el.innerHTML = '<div class="page"><p>Character not found.</p><a class="btn" href="#/characters">← All characters</a></div>'; return; }
    const y = window.scrollY;
    el.innerHTML = !c ? listView() : c.created ? sheetView(c) : creationView(c);
    window.scrollTo(0, y);
  };
  draw();
  const current = () => state.characters.find((x) => x.id === id);
  const commit = () => { save(); draw(); };

  el.oninput = (e) => {
    const c = current();
    if (!c) return;
    const f = e.target.dataset.f;
    if (f && ['name', 'concept', 'dependsOn', 'notes'].includes(f)) { c[f] = e.target.value; save(); }
    if (f === 'whyCustom') { c.why = e.target.value; save(); }
    if (e.target.dataset.contactname !== undefined) { c.contacts[Number(e.target.dataset.contactname)].name = e.target.value; save(); }
  };
  el.onchange = (e) => {
    const c = current();
    if (!c) return;
    const t = e.target;
    if (t.dataset.f === 'name' || t.dataset.f === 'dependsOn') { if (!c.created) draw(); return; }
    if (t.dataset.f === 'startLevel') { c.marks = marksForLevel(Number(t.value)); commit(); return; }
    if (t.dataset.why) {
      if (t.dataset.why === '__custom') c.why = el.querySelector('[data-f="whyCustom"]').value || 'Because…';
      else c.why = t.dataset.why;
      commit();
      return;
    }
    if (t.dataset.qr) {
      const k = t.dataset.qr;
      ui.roll[k] = t.type === 'checkbox' ? t.checked : k === 'trait' ? t.value : Number(t.value);
      draw();
    }
  };

  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    const c = current();

    if (d.act === 'new') {
      const n = newCharacter();
      state.characters.push(n);
      save();
      ui.shopOpen = false;
      location.hash = `#/characters/${n.id}`;
      return;
    }
    if (!c) return;

    switch (d.act) {
      case 'delete':
        if (confirm(`Delete ${c.name || 'this character'} for good?`)) {
          state.characters = state.characters.filter((x) => x.id !== c.id);
          save();
          location.hash = '#/characters';
        }
        return;
      case 'finish':
        c.created = true; ui.shopOpen = false; toast(`✅ ${esc(c.name)} is ready`); commit(); return;
      case 'recreate': c.created = false; ui.editing = false; commit(); return;
      case 'edit': ui.editing = !ui.editing; draw(); return;
      case 'print': window.print(); return;
      case 'shop': ui.shopOpen = !ui.shopOpen; draw(); return;
      case 'clearshaken': c.shaken = 0; commit(); return;
      case 'addscar': {
        const v = el.querySelector('#scar-input').value.trim();
        if (v) { c.scars.push(v); commit(); }
        return;
      }
      case 'survive': c.wounds = Math.max(0, maxWounds(c) - 1); c.scars.push('A new scar (describe it)'); toast('🫀 Survived. Describe the Scar.'); commit(); return;
      case 'survivecrit': c.wounds = Math.max(0, maxWounds(c) - 2); toast('💥 Survived without a Scar'); commit(); return;
      case 'die': if (confirm(`${c.name} dies?`)) { c.dead = true; commit(); } return;
      case 'undead': c.dead = false; commit(); return;
      case 'qroll': {
        const r = ui.roll;
        let plus = 0;
        let minus = c.shaken;
        if (r.trait === '__knowhow') minus += 1; else if (r.trait) plus += 1;
        if (r.tool) plus += 1;
        if (r.easy > 0) plus += 1;
        if (r.easy < 0) minus += 1;
        if (r.help) plus += 1;
        if (r.extra > 0) plus += r.extra; else minus += -r.extra;
        ui.lastRoll = roll(netOf(plus, minus));
        draw();
        return;
      }
      default: break;
    }

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
    if (d.shopkind) { ui.shopKind = d.shopkind; draw(); return; }
    if (d.buy) {
      const item = itemById(d.buy);
      const price = buyPrice(item);
      if (c.chips < price) return;
      c.chips -= price;
      addGear(c, item.id);
      toast(`🛒 Bought ${esc(item.name)} for ${price}c`);
      commit();
      return;
    }
    if (d.sell || d.drop || d.use) {
      const g = c.gear.find((x) => x.id === (d.sell || d.drop || d.use));
      if (!g) return;
      const item = gearItem(g);
      if (d.sell) { c.chips += sellPrice(item, c); toast(`🏷️ Sold ${esc(g.name)} for ${sellPrice(item, c)}c`); }
      if (d.use) {
        if (g.item === 'boilerblack') c.shaken = Math.max(0, c.shaken - 1);
        if (g.item === 'stitchglue') c.wounds = Math.max(0, c.wounds - 1);
        if (g.item === 'salve') c.wounds = Math.max(0, c.wounds - 2);
        toast(`🔂 Used ${esc(g.name)}${item.effect ? `: ${esc(item.effect)}` : ''}`);
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
    if (d.wound) {
      const n = Number(d.wound);
      c.wounds = c.wounds === n ? n - 1 : n;
      commit();
      return;
    }
    if (d.shaken) {
      const n = Number(d.shaken);
      c.shaken = c.shaken === n ? n - 1 : n;
      commit();
      return;
    }
    if (d.marks) {
      const before = charLevel(c);
      c.marks = Math.max(0, c.marks + Number(d.marks));
      const after = charLevel(c);
      if (after > before) toast(`📈 Level ${after}! ${esc(LEVEL_REWARDS[after])}`);
      commit();
      return;
    }
    if (d.chips) {
      const amt = Math.max(0, Number(el.querySelector('#chip-amt').value) || 0);
      c.chips = Math.max(0, c.chips + Number(d.chips) * amt);
      commit();
      return;
    }
    if (d.delscar !== undefined) { c.scars.splice(Number(d.delscar), 1); commit(); return; }
    if (d.advtype) { ui.advance = ui.advance === d.advtype ? '' : d.advtype; draw(); return; }
    if (d.addtrait) { c.extraTraits.push(d.addtrait); ui.advance = ''; toast(`🧬 Learned ${d.addtrait}. How did you learn it?`); commit(); return; }
    if (d.addtalent) { c.talents.push(d.addtalent); ui.advance = ''; commit(); return; }
    if (d.addcontact) { c.contacts.push({ type: d.addcontact, name: '' }); ui.advance = ''; commit(); return; }
    if (d.deltrait) { c.extraTraits = c.extraTraits.filter((t) => t !== d.deltrait); c.talents = c.talents.filter((t) => t !== d.deltrait); commit(); return; }
    if (d.deltalent) { c.talents = c.talents.filter((t) => t !== d.deltalent); commit(); return; }
    if (d.delcontact !== undefined) { c.contacts.splice(Number(d.delcontact), 1); commit(); }
  };
}

