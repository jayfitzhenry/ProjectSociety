// Attack calculator: To Hit then To Wound, with exact outcome odds and a full roll.
import { ITEMS } from './data.js';
import {
  roll, distribution, pct, signed, poolLabel, renderRoll, netOf,
} from './dice.js';
import { esc } from './store.js';

const WEAPONS = [{ id: 'unarmed', name: 'Unarmed / improvised', mod: 0, range: 'Melee', rules: [] }, ...ITEMS.filter((i) => i.kind === 'weapon')];
const ARMOURS = [{ id: 'none', name: 'No armour', mod: 0, rules: [] }, ...ITEMS.filter((i) => i.kind === 'armour')];

const ui = {
  weapon: 'pistol',
  armour: 'none',
  trait: false,
  aim: 0, // 0, 1, 2 (Dead Eye)
  long: false,
  smoke: false,
  cover: false,
  ghost: false,
  haymaker: false,
  atkShaken: 0,
  defShaken: 0,
  hitPlus: 0,
  hitMinus: 0,
  woundPlus: 0,
  woundMinus: 0,
  result: null,
};

const weapon = () => WEAPONS.find((w) => w.id === ui.weapon) || WEAPONS[0];
const armour = () => ARMOURS.find((a) => a.id === ui.armour) || ARMOURS[0];

function calc() {
  const w = weapon();
  const a = armour();
  const fire = w.rules.includes('Fire');
  const pierce = w.rules.includes('Pierce');
  const shock = w.rules.includes('Shock');
  const melee = /^Melee/.test(w.range || '');
  const haymaker = ui.haymaker && melee;
  const armourRating = pierce ? Math.min(0, a.mod + 1) : a.mod; // -2 -> -1, -1 -> 0

  const hit = { plus: [], minus: [] };
  if (ui.trait) hit.plus.push(['🧬 Brawler / Marksman', 1]);
  if (ui.aim) hit.plus.push([ui.aim === 2 ? '🎯 Aim (Dead Eye)' : '🎯 Aim', ui.aim]);
  if (ui.ghost) hit.plus.push(['🌑 Ghost', 1]);
  if (ui.hitPlus) hit.plus.push(['⬆️ Other', ui.hitPlus]);
  if (ui.long) hit.minus.push(['📏 Long range', 1]);
  if (ui.smoke) hit.minus.push(['💨 Smoke', 1]);
  if (ui.cover && w.range !== 'Melee') hit.minus.push(['🧱 Cover / darkness / vehicle', 1]);
  if (ui.atkShaken) hit.minus.push([`🩸 Shaken ×${ui.atkShaken}`, ui.atkShaken]);
  if (ui.hitMinus) hit.minus.push(['⬇️ Other', ui.hitMinus]);

  const wound = { plus: [], minus: [] };
  if (w.mod) wound.plus.push([`🗡️ ${w.name}`, w.mod]);
  if (ui.ghost) wound.plus.push(['🌑 Ghost', 1]);
  if (ui.woundPlus) wound.plus.push(['⬆️ Other', ui.woundPlus]);
  if (armourRating) wound.minus.push([`🛡️ ${a.name}${pierce ? ' (Pierced)' : ''}`, -armourRating]);
  if (fire) wound.minus.push(['🔥 Fire', 1]);
  if (fire && a.rules.includes('Fireproof')) wound.minus.push(['🧯 Fireproof', 1]);
  if (ui.atkShaken) wound.minus.push([`🩸 Shaken ×${ui.atkShaken}`, ui.atkShaken]);
  if (ui.woundMinus) wound.minus.push(['⬇️ Other', ui.woundMinus]);

  const sum = (arr) => arr.reduce((s, [, n]) => s + n, 0);
  hit.net = netOf(sum(hit.plus), sum(hit.minus));
  hit.raw = sum(hit.plus) - sum(hit.minus);
  wound.net = netOf(sum(wound.plus), sum(wound.minus));
  wound.raw = sum(wound.plus) - sum(wound.minus);
  wound.critNet = netOf(sum(wound.plus) + 1, sum(wound.minus));
  return { w, a, fire, shock, haymaker, hit, wound };
}

/**
 * Read a wound total for this defender.
 * Shaken overflow (equipment.md): several Shaken are added one at a time, and each one
 * past −3 becomes 1 wound, or a Knock Out for Shock weapons.
 */
function outcome(total, c) {
  if (total >= 12) return c.shock ? { k: 'ko', t: '😵 Knocked Out' } : { k: 'crit', t: '🔴 3 wounds + free attack' };
  if (total >= 7 && !c.shock) return { k: 'wound', t: '🟠 1 wound' };
  // Shaken gained: Shock turns a Wounded result into 2 Shaken; Haymaker turns a Shaken result into 2.
  const gain = total >= 7 ? 2 : c.haymaker ? 2 : 1;
  const room = Math.max(0, 3 - ui.defShaken);
  const shaken = Math.min(gain, room);
  const over = gain - shaken;
  if (over && c.shock) return { k: 'ko', t: '😵 Knocked Out' };
  if (!over) return shaken === 2 ? { k: 'shaken2', t: '🟡🟡 2 Shaken' } : { k: 'shaken', t: '🟡 Shaken' };
  if (!shaken) return over === 2 ? { k: 'wound2', t: '🟠🟠 2 wounds (overflow past −3)' } : { k: 'wound', t: '🟠 1 wound' };
  return { k: 'mixed', t: '🟡 Shaken + 🟠 1 wound (overflow)' };
}

function odds(c) {
  const buckets = {};
  const add = (k, t, p) => { buckets[k] = buckets[k] || { t, p: 0 }; buckets[k].p += p; };
  let pHit;
  let pCrit;
  let pFumble;
  if (c.fire) { pHit = 1; pCrit = 0; pFumble = 0; } else {
    const dh = distribution(c.hit.net);
    pHit = dh.pass; pCrit = dh.crit; pFumble = dh.fumble;
  }
  add('miss', '❌ Miss', 1 - pHit);
  const dw = distribution(c.wound.net);
  const dc = distribution(c.wound.critNet);
  for (let s = 2; s <= 12; s++) {
    const p = (pHit - pCrit) * dw.sums[s] + pCrit * dc.sums[s];
    const o = outcome(s, c);
    add(o.k, o.t, p);
  }
  return { pHit, pCrit, pFumble, buckets };
}

function opt(list, sel) {
  return list.map((i) => {
    const special = (i.rules || []).filter((r) => !['Concealable', 'Conspicuous', 'Refined', 'Consumable'].includes(r));
    return `<option value="${i.id}" ${i.id === sel ? 'selected' : ''}>${esc(i.name)} (${signed(i.mod)})${special.length ? ` · ${special.join(', ')}` : ''}</option>`;
  }).join('');
}

function stepper(id, label, max = 3) {
  return `<div class="stepper" data-stepper="${id}" data-max="${max}"><span class="lbl">${label}</span>
    <button type="button" data-step="-1" ${ui[id] <= 0 ? 'disabled' : ''}>−</button><b>${ui[id]}</b>
    <button type="button" data-step="1" ${ui[id] >= max ? 'disabled' : ''}>+</button></div>`;
}

const toggle = (id, label) => `<label class="check"><input type="checkbox" data-tog="${id}" ${ui[id] ? 'checked' : ''}> ${label}</label>`;

function breakdown(part, crit) {
  const rows = [...part.plus.map(([l, n]) => `<tr><td>${esc(l)}</td><td class="pos">+${n}</td></tr>`),
    ...part.minus.map(([l, n]) => `<tr><td>${esc(l)}</td><td class="neg">−${n}</td></tr>`)];
  if (crit) rows.push('<tr><td>💥 Critical hit</td><td class="pos">+1</td></tr>');
  return `<table class="mini"><tbody>${rows.join('') || '<tr><td class="muted">No modifiers</td><td>0</td></tr>'}
    <tr class="tot"><td>Net${part.raw < -3 ? ' (capped)' : ''}</td><td>${signed(crit ? part.critNet : part.net)}</td></tr></tbody></table>`;
}

function view() {
  const c = calc();
  const o = odds(c);
  const order = ['miss', 'shaken', 'shaken2', 'mixed', 'wound', 'wound2', 'crit', 'ko'];
  const unwieldy = c.w.rules.includes('Unwieldy');
  return `<div class="page">
    <h1>⚔️ Attack Calculator</h1>
    <p class="lead">To Hit (7+), then To Wound read on the Injury Table. Traits help To Hit only. Damage comes from gear.</p>
    <div class="cols">
      <section class="card">
        <h3>🗡️ Attacker</h3>
        <label class="field"><span>Weapon</span><select data-sel="weapon">${opt(WEAPONS, ui.weapon)}</select></label>
        ${c.w.rules.length ? `<p class="muted small">${c.w.range ? `${esc(c.w.range)} · ` : ''}${c.w.rules.map(esc).join(', ')}</p>` : `<p class="muted small">${esc(c.w.range || '')}</p>`}
        ${c.fire ? '<div class="callout">🔥 <b>Fire:</b> no To Hit roll. Every model on the line is hit, friend or foe. Aiming and Marksman don\'t help.</div>' : ''}
        ${c.shock ? '<div class="callout">⚡ <b>Shock:</b> never wounds. Shaken past −3 Knocks Out instead.</div>' : ''}
        ${c.w.rules.includes('Blast') ? '<div class="callout">💣 <b>Blast:</b> on a hit, every model within 2" is hit too. Roll To Wound for each.</div>' : ''}
        ${unwieldy ? '<div class="callout">🏋️ <b>Unwieldy:</b> no Move and Attack in the same turn, but you can use your Move to Aim.</div>' : ''}
        <div class="checks">
          ${toggle('trait', '🧬 Covering trait (Brawler / Marksman) <b>+1</b>')}
          ${toggle('long', '📏 Long range (beyond half) <b>−1</b>')}
          ${toggle('smoke', '💨 Shooting through smoke <b>−1</b>')}
          ${toggle('cover', '🧱 Cover, darkness or a moving vehicle (ranged only) <b>−1</b>')}
          ${toggle('ghost', '🌑 Ghost: attacking from Hide <b>+1 / +1</b>')}
          ${/^Melee/.test(c.w.range || '') ? toggle('haymaker', '👊 Haymaker: a Shaken result gives 2 Shaken') : ''}
        </div>
        <div class="seg small">
          ${[[0, 'No aim'], [1, '🎯 Aim +1'], [2, '🎯 Dead Eye +2']].map(([v, l]) => `<button type="button" data-aim="${v}" class="${ui.aim === v ? 'on' : ''}">${l}</button>`).join('')}
        </div>
        <div class="steppers">
          ${stepper('atkShaken', '🩸 Attacker Shaken')}
          ${stepper('hitPlus', '⬆️ Other +dice To Hit', 9)}
          ${stepper('hitMinus', '⬇️ Other −dice To Hit', 9)}
          ${stepper('woundPlus', '⬆️ Other +dice To Wound', 9)}
          ${stepper('woundMinus', '⬇️ Other −dice To Wound', 9)}
        </div>
        <h3>🛡️ Target</h3>
        <label class="field"><span>Armour</span><select data-sel="armour">${opt(ARMOURS, ui.armour)}</select></label>
        <div class="steppers">${stepper('defShaken', '🩸 Target Shaken')}</div>
      </section>
      <section class="card">
        <div class="two">
          <div><h4>🎯 To Hit</h4>${c.fire ? '<p class="muted">Automatic (Fire)</p>' : `${breakdown(c.hit)}<p class="muted small">${poolLabel(c.hit.net)}</p>`}</div>
          <div><h4>🩸 To Wound</h4>${breakdown(c.wound)}<p class="muted small">${poolLabel(c.wound.net)}</p></div>
        </div>
        <h3>Outcome odds</h3>
        <div class="outcomes">
          ${order.filter((k) => o.buckets[k] && o.buckets[k].p > 0.00001).map((k) => `<div class="outcome o-${k}">
            <span>${o.buckets[k].t}</span><b>${pct(o.buckets[k].p)}</b>
            <i style="width:${o.buckets[k].p * 100}%"></i></div>`).join('')}
        </div>
        ${c.fire ? '' : `<p class="muted small">Hit ${pct(o.pHit)} · 💥 critical hit ${pct(o.pCrit)} (wound roll at ${signed(c.wound.critNet)}) · 💀 fumble ${pct(o.pFumble)} ends the turn</p>`}
        <div class="actions"><button type="button" class="btn primary big" data-act="attack">⚔️ Roll the attack</button></div>
        <div id="attack-out" aria-live="polite">${ui.result || ''}</div>
      </section>
    </div>
  </div>`;
}

function doAttack() {
  const c = calc();
  const steps = [];
  let critHit = false;
  if (c.fire) {
    steps.push('<div class="step"><h4>🎯 To Hit</h4><p>🔥 Fire: automatic hit.</p></div>');
  } else {
    const h = roll(c.hit.net);
    steps.push(`<div class="step"><h4>🎯 To Hit</h4>${renderRoll(h, 'hit', { animate: true })}</div>`);
    if (!h.pass) {
      if (h.fumble) steps.push('<p class="callout bad">💀 Fumble: the attacker\'s turn ends now.</p>');
      return steps.join('');
    }
    critHit = h.crit;
    if (h.fumble) steps.push('<p class="callout bad">💀 Fumble: apply the result, then the turn ends.</p>');
  }
  const w = roll(critHit ? c.wound.critNet : c.wound.net);
  const o = outcome(w.total, c);
  steps.push(`<div class="step"><h4>🩸 To Wound${critHit ? ' (+1 from critical hit)' : ''}</h4>${renderRoll(w, 'wound', { animate: true })}
    <p class="verdict-line"><b>${o.t}</b></p>
    ${o.k === 'crit' ? '<p class="callout good">⚡ <b>Free attack</b>: a full attack from To Hit, any target. One per turn, and it can\'t chain.</p>' : ''}
    ${w.fumble ? '<p class="callout bad">💀 Fumble: the attacker\'s turn ends after this.</p>' : ''}</div>`);
  return steps.join('');
}

export function renderCombat(el) {
  const draw = () => { el.innerHTML = view(); };
  draw();
  el.onchange = (e) => {
    const t = e.target;
    if (t.dataset.sel) { ui[t.dataset.sel] = t.value; ui.result = null; draw(); }
    if (t.dataset.tog) { ui[t.dataset.tog] = t.checked; ui.result = null; draw(); }
  };
  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.aim !== undefined) { ui.aim = Number(b.dataset.aim); ui.result = null; draw(); return; }
    const st = b.closest('[data-stepper]');
    if (st) {
      const k = st.dataset.stepper;
      ui[k] = Math.max(0, Math.min(Number(st.dataset.max), ui[k] + Number(b.dataset.step)));
      ui.result = null;
      draw();
      return;
    }
    if (b.dataset.act === 'attack') { ui.result = doAttack(); draw(); }
  };
}

