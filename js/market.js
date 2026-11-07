// The Market: everything a character can buy (equipment.md, Price Lists), checked against a character.
// Shows what they own, what they can afford and what's still locked, and buys straight into their gear.
import { ITEMS, MARKETS, KIND_LABEL, SERVICES, MAX_GRAFTS } from './data.js';
import {
  state, save, saveSettings, esc, toast, setTitle, currentCharacter, marketOpen, buyPrice, gearItem,
  crewLevel, openCampaign, closeCampaign,
} from './store.js';
import { session, signedIn } from './auth.js';
import { signed } from './dice.js';
import { addGear } from './characters.js';

const KINDS = { all: 'All', ...KIND_LABEL, service: 'Services' };
const ui = { kind: 'all', canBuy: false };

const term = (t, label = t) => `<button type="button" class="term" data-term="${esc(t)}">${esc(label)}</button>`;
const isMelee = (i) => /melee/i.test(i.range || '');
// Grafts that count as a tool (equipment.md, Refined grafts).
const GRAFT_TOOLS = { lockpicks: 'stillhand', spyglass: 'cleareye' };

function itemStats(i) {
  if (i.kind === 'weapon') return `${signed(i.mod)} To Wound · ${esc(i.range)}`;
  if (i.kind === 'armour') return `${signed(i.mod)} on wound rolls against you`;
  if (i.kind === 'tool') return `+1 dice: ${esc(i.helps)}`;
  return esc(i.effect || '');
}

/** The character's gear of one kind, with the item data. */
const gearOf = (c, kind) => c.gear.map((g) => ({ g, item: gearItem(g) })).filter((x) => x.item.kind === kind);

/** How this item compares with what the character already has. Plain words, never colour alone. */
function compare(c, i) {
  if (i.kind === 'armour') {
    const worn = gearOf(c, 'armour').map((x) => ({ name: x.g.name, mod: x.item.mod }));
    if (c.gear.some((g) => g.item === 'secondskin')) worn.push({ name: 'Second skin', mod: -1 });
    if (!worn.length) return 'You have no armour';
    const best = worn.reduce((a, b) => (b.mod < a.mod ? b : a));
    if (i.mod < best.mod) return `Better than your ${esc(best.name)} (${signed(best.mod)})`;
    if (i.mod === best.mod) return `Same rating as your ${esc(best.name)}`;
    return `Your ${esc(best.name)} is better (${signed(best.mod)})`;
  }
  if (i.kind === 'weapon') {
    const kind = isMelee(i) ? 'melee' : 'ranged';
    const mine = gearOf(c, 'weapon').filter((x) => isMelee(x.item) === isMelee(i));
    if (!mine.length) return `No ${kind} weapon yet`;
    const best = mine.reduce((a, b) => (b.item.mod > a.item.mod ? b : a));
    if (i.mod > best.item.mod) return `Better than your ${esc(best.g.name)} (${signed(best.item.mod)})`;
    if (i.mod === best.item.mod) return `Same rating as your ${esc(best.g.name)}`;
    return `Your ${esc(best.g.name)} is better (${signed(best.item.mod)})`;
  }
  if (i.kind === 'tool' && GRAFT_TOOLS[i.id] && c.gear.some((g) => g.item === GRAFT_TOOLS[i.id])) {
    return 'Your graft already counts as this';
  }
  return '';
}

/** Why this character can't buy the item right now, or '' if they can. */
function blocker(c, i, price) {
  if (!marketOpen(i.market)) return `${MARKETS[i.market].name} market opens at crew level ${MARKETS[i.market].level}`;
  if (i.kind === 'graft') {
    if (c.gear.some((g) => g.item === i.id)) return 'Already grafted';
    const n = gearOf(c, 'graft').length;
    if (n >= MAX_GRAFTS) return `At the limit of ${MAX_GRAFTS} grafts`;
  }
  if (c.chips < price) return `Needs ${price - c.chips}c more`;
  return '';
}

function itemRow(c, i) {
  const price = buyPrice(i);
  const owned = c ? c.gear.filter((g) => g.item === i.id).reduce((n, g) => n + (g.qty || 1), 0) : 0;
  const why = c ? blocker(c, i, price) : '';
  const cmp = c && !owned ? compare(c, i) : '';
  const status = [
    owned ? `<b>You have ${owned > 1 || i.kind === 'consumable' ? `${owned}` : 'one'}</b>` : '',
    cmp,
    why,
  ].filter(Boolean).join(' · ');
  return `<li><div class="row-main mk-row">
    <span class="row-text">
      <span class="row-title">${term(i.name)}</span>
      <span class="row-meta">${itemStats(i)}${i.rules?.length ? ` · ${i.rules.map((r) => term(r)).join(', ')}` : ''} · ${esc(MARKETS[i.market].name)}</span>
      ${status ? `<span class="row-meta mk-status">${status}</span>` : ''}
    </span>
    <span class="mk-buy">
      <span class="num">${price !== i.price ? `<s class="muted" aria-label="was ${i.price}c">${i.price}c</s> ` : ''}${price}c</span>
      ${c ? `<button type="button" class="btn" data-buy="${i.id}" ${why ? 'disabled' : ''} aria-label="Buy ${esc(i.name)} for ${price}c">Buy</button>` : ''}
    </span>
  </div></li>`;
}

function serviceRow(c, s) {
  const why = c && s.price != null && c.chips < s.price ? `Needs ${s.price - c.chips}c more` : '';
  return `<li><div class="row-main mk-row">
    <span class="row-text">
      <span class="row-title">${esc(s.name)}</span>
      <span class="row-meta">${esc(s.effect)}</span>
      ${why ? `<span class="row-meta mk-status">${why}</span>` : ''}
    </span>
    <span class="mk-buy">
      <span class="num">${s.price == null ? 'Takes half' : `${s.price}c`}</span>
      ${c && s.price != null ? `<button type="button" class="btn" data-pay="${s.id}" ${why ? 'disabled' : ''} aria-label="Pay ${s.price}c for ${esc(s.name)}">Pay</button>` : ''}
    </span>
  </div></li>`;
}

const KIND_NOTES = {
  armour: 'Wear one piece only.',
  tool: 'Only one tool counts per roll, on top of a trait.',
  graft: `Permanent and illegal, at most ${MAX_GRAFTS}. Being found with one is +2 Exposure.`,
  service: 'Paid for, not carried. Paying takes the chips; the DM applies the effect.',
};

function kindSection(c, kind) {
  let rows;
  if (kind === 'service') {
    rows = SERVICES.filter((s) => !c || !ui.canBuy || (s.price != null && c.chips >= s.price)).map((s) => serviceRow(c, s));
  } else {
    rows = ITEMS.filter((i) => i.kind === kind)
      .filter((i) => !c || !ui.canBuy || !blocker(c, i, buyPrice(i)))
      .map((i) => itemRow(c, i));
  }
  if (!rows.length) return '';
  return `<section class="block" aria-labelledby="mk-${kind}">
    <h2 id="mk-${kind}">${esc(KINDS[kind])}</h2>
    ${KIND_NOTES[kind] ? `<p class="muted small">${esc(KIND_NOTES[kind])}</p>` : ''}
    <ul class="rows">${rows.join('')}</ul>
  </section>`;
}

function whoView(c) {
  if (!signedIn()) {
    return `<p class="note">Browsing the price list. <a href="#/signin">Sign in</a> and make a character to check it against your sheet and buy.</p>`;
  }
  if (!c) return '<p class="note">Make a character to check the market against your sheet and buy. <a href="#/characters">Characters</a></p>';
  const mine = state.characters.filter((x) => !x.dead);
  const level = crewLevel();
  return `<div class="card mk-who">
    <div class="row spread">
      ${mine.length > 1 ? `<label class="field mk-pick"><span>Buying for</span>
        <select id="mk-char">${mine.map((x) => `<option value="${esc(x.id)}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name || 'New character')}${x.created ? '' : ' (being made)'}</option>`).join('')}</select></label>`
        : `<div><span class="label">Buying for</span><p class="row-title">${esc(c.name || 'New character')}</p></div>`}
      <div class="mk-chips"><span class="label">Chips</span><p class="hero num">${c.chips}<small>c</small></p></div>
    </div>
    <p class="muted small">Crew level ${level} · ${Object.entries(MARKETS).map(([k, m]) => `${esc(m.name)} ${marketOpen(k) ? 'open' : `opens at level ${m.level}`}`).join(' · ')}</p>
    <div class="row spread">
      <button type="button" class="switch" role="switch" aria-checked="${ui.canBuy}" data-canbuy>
        <span class="track" aria-hidden="true"></span><span>Only what I can buy now</span></button>
      <a class="btn quiet" href="#/characters/${encodeURIComponent(c.id)}/gear">Gear on the sheet</a>
    </div>
  </div>`;
}

function view(c) {
  const kinds = ui.kind === 'all' ? [...Object.keys(KIND_LABEL), 'service'] : [ui.kind];
  const body = kinds.map((k) => kindSection(c, k)).join('');
  return `<div class="page">
    <div class="page-head"><div><h1>Market</h1>
      <p class="sub">Everything for sale in the Works, the Specialist dealers and the Sunk. ${term('Markets', 'How markets open')}</p></div></div>
    ${whoView(c)}
    <div class="seg mk-kinds" role="group" aria-label="Show">${Object.entries(KINDS).map(([k, label]) => `<button type="button" data-kind="${k}" aria-pressed="${ui.kind === k}">${esc(label)}</button>`).join('')}</div>
    ${body || '<p class="muted block">Nothing here this character can buy right now.</p>'}
  </div>`;
}

/** Who's shopping: the sheet the Sheet tab opens, unless that character has died. */
function buyer() {
  if (!signedIn()) return null;
  const c = currentCharacter();
  if (c && !c.dead) return c;
  return state.characters.find((x) => !x.dead && x.created) || state.characters.find((x) => !x.dead) || null;
}

export function renderMarket(el, [charId]) {
  setTitle('Market');
  if (charId && state.characters.some((x) => x.id === charId) && state.settings.currentChar !== charId) {
    state.settings.currentChar = charId;
    saveSettings();
  }
  const draw = () => {
    const c = buyer();
    // Prices and which markets are open depend on the crew this character belongs to.
    if (c && c.campaignId && state.campaign?.id !== c.campaignId) {
      el.innerHTML = '<div class="page"><h1>Market</h1><p class="muted">Opening the crew…</p></div>';
      openCampaign(c.campaignId, session.user.id).then(draw).catch((err) => { closeCampaign(c); toast(esc(err.message)); el.innerHTML = view(c); });
      return;
    }
    if (c && !c.campaignId) closeCampaign(c);
    const y = window.scrollY;
    el.innerHTML = view(c);
    window.scrollTo(0, y);
  };
  draw();

  el.onclick = (e) => {
    const b = e.target.closest('button, [data-kind]');
    if (!b) return;
    const d = b.dataset;
    if (d.kind) { ui.kind = d.kind; draw(); return; }
    if (d.canbuy !== undefined) { ui.canBuy = !ui.canBuy; draw(); return; }
    const c = buyer();
    if (!c) return;
    if (d.buy) {
      const item = ITEMS.find((i) => i.id === d.buy);
      const price = buyPrice(item);
      if (!item || blocker(c, item, price)) return;
      c.chips -= price;
      addGear(c, item.id);
      save();
      toast(`Bought ${esc(item.name)} for ${price}c. ${esc(c.name || 'Your character')} has ${c.chips}c left`);
      draw();
      return;
    }
    if (d.pay) {
      const s = SERVICES.find((x) => x.id === d.pay);
      if (!s || s.price == null || c.chips < s.price) return;
      c.chips -= s.price;
      save();
      toast(`Paid ${s.price}c for ${esc(s.name)}. ${c.chips}c left`);
      draw();
    }
  };
  el.onchange = (e) => {
    if (e.target.id !== 'mk-char') return;
    state.settings.currentChar = e.target.value;
    saveSettings();
    draw();
  };
}
