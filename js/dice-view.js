// Dice roller: build a pool from modifier sources, see the exact odds, roll it.
import {
  roll, distribution, pct, signed, poolLabel, renderRoll, netOf, PENALTY_CAP,
} from './dice.js';
import { esc } from './store.js';

const SOURCES = {
  test: [
    { id: 'trait', label: '🧬 Covering trait', n: 1 },
    { id: 'tool', label: '🧰 Tool', n: 1 },
    { id: 'easy', label: '🟢 Easy test', n: 1 },
    { id: 'help', label: '🤝 Helper', n: 1 },
    { id: 'bribe', label: '💸 Bribe', n: 1 },
    { id: 'consumable', label: '🔂 Consumable', n: 1 },
    { id: 'hall3', label: '📚 Hall III (gang helps)', n: 1 },
    { id: 'hard', label: '🔴 Hard test', n: -1 },
    { id: 'knowhow', label: '❓ No trait, needs know-how', n: -1 },
    { id: 'conspicuous', label: '📢 Conspicuous gear (sneaking)', n: -1 },
  ],
  hit: [
    { id: 'trait', label: '🧬 Brawler / Marksman', n: 1 },
    { id: 'aim', label: '🎯 Aim', n: 1 },
    { id: 'deadeye', label: '🎯 Aim with Dead Eye', n: 2 },
    { id: 'ghost', label: '🌑 Ghost (from Hide)', n: 1 },
    { id: 'long', label: '📏 Long range', n: -1 },
    { id: 'smoke', label: '💨 Through smoke', n: -1 },
    { id: 'cover', label: '🧱 Cover, darkness or moving vehicle', n: -1 },
  ],
  wound: [
    { id: 'w1', label: '🗡️ Weapon +1', n: 1, group: 'weapon' },
    { id: 'w2', label: '🗡️ Weapon +2', n: 2, group: 'weapon' },
    { id: 'crit', label: '💥 Critical hit', n: 1 },
    { id: 'ghost', label: '🌑 Ghost (from Hide)', n: 1 },
    { id: 'overpressure', label: '⚙️ Overpressure', n: 1 },
    { id: 'a1', label: '🧥 Armour -1', n: -1, group: 'armour' },
    { id: 'a2', label: '🛡️ Armour -2', n: -2, group: 'armour' },
    { id: 'fire', label: '🔥 Fire', n: -1 },
    { id: 'fireproof', label: '🧯 Fireproof vs Fire', n: -1 },
  ],
  // Survival roll (actions.md › Dying): a Medic test made by a crewmate after the combat.
  survival: [
    { id: 'medic', label: '🩹 Roller has Medic', n: 1, group: 'medic' },
    { id: 'nomedic', label: '❓ Roller has no Medic', n: -1, group: 'medic' },
    { id: 'satchel', label: "🎒 Medic's satchel", n: 1 },
    { id: 'dressing', label: '🩹 Field dressing', n: 1 },
    { id: 'stabilised', label: '🫀 Stabilised in the fight', n: 1 },
    { id: 'clinic3', label: '🏥 Clinic III', n: 1 },
    { id: 'hardtokill', label: '🫀 Hard to Kill (dying character)', n: 1 },
  ],
};
const MODES = [['test', '🧠 Test'], ['hit', '🎯 To Hit'], ['wound', '🩸 To Wound'], ['survival', '🫀 Survival']];

const ui = {
  mode: 'test',
  on: { test: new Set(), hit: new Set(), wound: new Set(), survival: new Set() },
  shaken: 0,
  extraPlus: 0,
  extraMinus: 0,
  last: null,
  history: [],
};

function totals() {
  const src = SOURCES[ui.mode].filter((s) => ui.on[ui.mode].has(s.id));
  let plus = ui.extraPlus;
  let minus = ui.extraMinus + (ui.mode === 'survival' ? 0 : ui.shaken);
  src.forEach((s) => { if (s.n > 0) plus += s.n; else minus += -s.n; });
  return { src, plus, minus, raw: plus - minus, net: netOf(plus, minus) };
}

function stepper(id, value, min, max, label) {
  return `<div class="stepper" data-stepper="${id}">
    <span class="lbl">${label}</span>
    <button type="button" data-step="-1" ${value <= min ? 'disabled' : ''} aria-label="decrease">−</button>
    <b>${value}</b>
    <button type="button" data-step="1" ${value >= max ? 'disabled' : ''} aria-label="increase">+</button>
  </div>`;
}

function oddsPanel(net) {
  const d = distribution(net);
  const maxP = Math.max(...d.sums.slice(2));
  const bars = d.sums.slice(2).map((p, i) => {
    const s = i + 2;
    const cls = ui.mode === 'wound' ? (s >= 12 ? 'b-crit' : s >= 7 ? 'b-wound' : 'b-shaken') : s >= 7 ? 'b-pass' : 'b-fail';
    return `<div class="bar ${cls}" title="${s}: ${pct(p)}"><span style="height:${(p / maxP) * 100}%"></span><small>${s}</small></div>`;
  }).join('');
  const stats = ui.mode === 'wound'
    ? `<div class="stat"><b>${pct(d.shaken)}</b><small>🟡 Shaken (2–6)</small></div>
       <div class="stat"><b>${pct(d.wound)}</b><small>🟠 1 wound (7–11)</small></div>
       <div class="stat"><b>${pct(d.critWound)}</b><small>🔴 3 wounds + attack</small></div>
       <div class="stat"><b>${pct(d.fumble)}</b><small>💀 Fumble</small></div>`
    : `<div class="stat big-stat"><b>${pct(d.pass)}</b><small>${{ hit: 'to hit', survival: 'to survive' }[ui.mode] || 'to pass'} (7+)</small></div>
       <div class="stat"><b>${pct(d.crit)}</b><small>💥 Critical</small></div>
       <div class="stat"><b>${pct(d.fumble)}</b><small>💀 Fumble</small></div>`;
  return `<div class="odds"><div class="stats">${stats}</div><div class="bars">${bars}</div></div>`;
}

function oddsTable(current) {
  const rows = [];
  for (let n = -3; n <= 5; n++) {
    const d = distribution(n);
    rows.push(`<tr class="${n === current ? 'hl' : ''}"><td><b>${signed(n)}</b>${n === -3 ? ' 🧢' : ''}</td><td>${poolLabel(n)}</td>
      <td><b>${pct(d.pass)}</b></td><td>${pct(d.crit)}</td><td>${pct(d.fumble)}</td>
      <td>${pct(d.shaken)}</td><td>${pct(d.wound)}</td><td>${pct(d.critWound)}</td></tr>`);
  }
  return `<div class="table-wrap"><table class="odds-table">
    <thead><tr><th>Net</th><th>Pool</th><th>Pass 7+</th><th>💥 Crit</th><th>💀 Fumble</th><th>🟡 Shaken</th><th>🟠 Wound</th><th>🔴 12</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}

function view() {
  const t = totals();
  const capped = t.raw < PENALTY_CAP;
  return `<div class="page dice-page">
    <h1>🎲 Dice Roller</h1>
    <p class="lead">Roll <b>2D6</b>, score <b>7+</b>. Modifiers add dice, never change the target. Cancel first, then cap at <b>−3</b>.</p>
    <div class="cols">
      <section class="card">
        <div class="seg" role="tablist">
          ${MODES.map(([m, l]) => `<button type="button" data-mode="${m}" class="${ui.mode === m ? 'on' : ''}">${l}</button>`).join('')}
        </div>
        <div class="chips">
          ${SOURCES[ui.mode].map((s) => `<button type="button" class="chip ${s.n > 0 ? 'pos' : 'neg'} ${ui.on[ui.mode].has(s.id) ? 'on' : ''}" data-src="${s.id}">
            ${esc(s.label)} <b>${signed(s.n)}</b></button>`).join('')}
        </div>
        ${ui.mode === 'survival' ? '<p class="muted small">Made after the combat by a crewmate in reach. ✅ Survives: −1 wound and a Scar. 💥 Critical: −2 wounds, no Scar. ❌ Dies. A Quickening draught passes it automatically. <a href="#/rules/actions/dying">Rules</a></p>' : ''}
        <div class="steppers">
          ${ui.mode === 'survival' ? '' : stepper('shaken', ui.shaken, 0, 3, '🩸 Roller is Shaken')}
          ${stepper('extraPlus', ui.extraPlus, 0, 9, '⬆️ Other +dice')}
          ${stepper('extraMinus', ui.extraMinus, 0, 9, '⬇️ Other −dice')}
        </div>
        <div class="calc">
          <span class="pos">+${t.plus}</span> <span class="neg">−${t.minus}</span> =
          <b>${signed(t.raw)}</b>${capped ? ` → <b>🧢 ${PENALTY_CAP}</b> <small class="muted">(capped)</small>` : ''}
          <div class="muted">${poolLabel(t.net)}</div>
        </div>
        <div class="actions">
          <button type="button" class="btn primary big" data-act="roll">🎲 Roll ${poolLabel(t.net).split(' ')[0]}</button>
          <button type="button" class="btn" data-act="clear">Clear</button>
        </div>
        <div id="roll-out" aria-live="polite">${ui.last ? renderRoll(ui.last.r, ui.last.mode, { animate: true }) : '<p class="muted center">Roll to see the dice.</p>'}</div>
      </section>
      <section class="card">
        <h3>Odds at net ${signed(t.net)}</h3>
        ${oddsPanel(t.net)}
        ${ui.history.length ? `<h3>Recent rolls</h3><ol class="history">${ui.history.map((h) => `<li>
          <span class="muted">${h.label}</span> <b>${h.r.total}</b> ${h.text}
          <small class="muted">[${h.r.dice.map((v, i) => (h.r.kept.includes(i) ? `<b>${v}</b>` : v)).join(' ')}]</small></li>`).join('')}</ol>` : ''}
      </section>
    </div>
    <section class="card">
      <h3>📊 Odds at a glance</h3>
      ${oddsTable(t.net)}
    </section>
  </div>`;
}

function describe(r, mode) {
  if (mode === 'wound') return r.total >= 12 ? '🔴 Critical Wound' : r.total >= 7 ? '🟠 Wounded' : '🟡 Shaken';
  if (mode === 'survival') return r.crit ? '💥 Survives, no Scar' : r.pass ? '✅ Survives' : '⚰️ Dies';
  const base = mode === 'hit' ? (r.pass ? '✅ Hit' : '❌ Miss') : r.pass ? '✅ Pass' : '❌ Fail';
  return base + (r.crit ? ' 💥' : '') + (r.fumble ? ' 💀' : '');
}

export function renderDice(el, [mode] = []) {
  if (mode && SOURCES[mode] && mode !== ui.mode) { ui.mode = mode; ui.last = null; }
  const draw = () => { el.innerHTML = view(); };
  draw();
  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.mode) { ui.mode = b.dataset.mode; ui.last = null; draw(); return; }
    if (b.dataset.src) {
      const set = ui.on[ui.mode];
      const src = SOURCES[ui.mode].find((s) => s.id === b.dataset.src);
      if (set.has(src.id)) set.delete(src.id);
      else {
        // One choice per group (weapon, armour); aim and Dead Eye are exclusive.
        SOURCES[ui.mode].forEach((s) => {
          if ((src.group && s.group === src.group) || (['aim', 'deadeye'].includes(src.id) && ['aim', 'deadeye'].includes(s.id))) set.delete(s.id);
        });
        set.add(src.id);
      }
      draw();
      return;
    }
    const st = b.closest('[data-stepper]');
    if (st) {
      const key = st.dataset.stepper;
      const max = key === 'shaken' ? 3 : 9;
      ui[key] = Math.max(0, Math.min(max, ui[key] + Number(b.dataset.step)));
      draw();
      return;
    }
    if (b.dataset.act === 'clear') {
      ui.on[ui.mode].clear(); ui.shaken = 0; ui.extraPlus = 0; ui.extraMinus = 0; ui.last = null; draw(); return;
    }
    if (b.dataset.act === 'roll') {
      const t = totals();
      const r = roll(t.net);
      ui.last = { r, mode: ui.mode };
      const label = { test: '🧠', hit: '🎯', wound: '🩸', survival: '🫀' }[ui.mode];
      ui.history.unshift({ r, label: `${label} ${signed(t.net)}`, text: describe(r, ui.mode) });
      ui.history = ui.history.slice(0, 12);
      draw();
    }
  };
}
