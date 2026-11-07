// One search box for everything: your character, the rules saved to it, glossary terms and the rules.
// Results are grouped by type. The query lives in the address (#/search/<query>), so Back returns to it.
import {
  GLOSSARY, TRAITS, TALENTS, CONTACTS, ITEMS, SPECIAL_RULES, BACKGROUNDS,
} from './data.js';
import { buildIndex, playerView } from './rules.js';
import { esc, setTitle, currentCharacter, gearItem } from './store.js';
import { signedIn } from './auth.js';

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function snippet(text, terms, width = 160) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  let pos = Math.max(0, lower.indexOf(terms[0]));
  const start = Math.max(0, pos - 50);
  let s = esc(clean.slice(start, start + width));
  terms.forEach((t) => { if (t) s = s.replace(new RegExp(`(${escRe(esc(t))})`, 'gi'), '<mark>$1</mark>'); });
  return (start > 0 ? '…' : '') + s + (start + width < clean.length ? '…' : '');
}

const matches = (hay, terms) => { const h = String(hay).toLowerCase(); return terms.every((t) => h.includes(t)); };
const score = (title, hay, terms) => terms.reduce((s, t) => s + (String(title).toLowerCase().includes(t) ? 10 : 0)
  + (String(title).toLowerCase().startsWith(t) ? 5 : 0) + (String(hay).toLowerCase().split(t).length - 1), 0);

/** Everything on the current character that could be looked for, as labelled fields. */
function sheetFields(c) {
  const bg = BACKGROUNDS.find((b) => b.id === c.background);
  const traits = [...(c.bgTraits || []), c.personalTrait, ...(c.extraTraits || [])].filter(Boolean);
  const out = [
    { label: 'Name', text: c.name, sect: '' },
    { label: 'Concept', text: c.concept, sect: '' },
    { label: 'Background', text: bg ? `${bg.id}: ${bg.who}` : '', sect: 'who' },
    ...traits.map((t) => ({ label: 'Trait', text: `${t}: ${TRAITS.find((x) => x.id === t)?.covers || ''}`, sect: 'traits' })),
    ...(c.talents || []).map((id) => TALENTS.find((t) => t.id === id)).filter(Boolean).map((t) => ({ label: 'Talent', text: `${t.name}: ${t.effect}`, sect: 'traits' })),
    ...(c.contacts || []).map((k) => ({ label: 'Contact', text: `${k.type}${k.name ? ` (${k.name})` : ''}: ${CONTACTS.find((x) => x.id === k.type)?.effect || ''}`, sect: 'traits' })),
    ...(c.gear || []).map((g) => ({ label: 'Gear', text: `${g.name}${g.qty > 1 ? ` ×${g.qty}` : ''}: ${gearItem(g).effect || gearItem(g).helps || (gearItem(g).rules || []).join(', ')}`, sect: 'gear' })),
    ...(c.scars || []).map((s) => ({ label: 'Scar', text: s, sect: 'who' })),
    { label: 'Depends on', text: c.dependsOn, sect: 'who' },
    { label: 'Why Antioch', text: c.why, sect: 'who' },
    { label: 'Notes', text: c.notes, sect: 'notes' },
  ];
  return out.filter((f) => f.text);
}

/** Every tappable term: the glossary, plus traits, talents, contacts, gear and special rules. */
function allTerms() {
  return [
    ...GLOSSARY.map((g) => ({ term: g.term, also: (g.aliases || []).join(' '), kind: 'Rule term' })),
    ...TRAITS.map((t) => ({ term: t.id, also: t.covers, kind: 'Trait' })),
    ...TALENTS.map((t) => ({ term: t.name, also: t.effect, kind: 'Talent' })),
    ...CONTACTS.map((k) => ({ term: k.id, also: k.effect, kind: 'Contact' })),
    ...Object.entries(SPECIAL_RULES).map(([k, v]) => ({ term: k, also: v, kind: 'Special rule' })),
    ...ITEMS.map((i) => ({ term: i.name, also: i.effect || i.helps || '', kind: i.kind[0].toUpperCase() + i.kind.slice(1) })),
  ];
}

async function results(q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return null;
  const out = { sheet: [], saved: [], terms: [], rules: [] };
  const c = signedIn() && currentCharacter();
  if (c) {
    out.sheet = sheetFields(c).filter((f) => matches(`${f.label} ${f.text}`, terms))
      .map((f) => ({ ...f, href: `#/characters/${encodeURIComponent(c.id)}${f.sect ? `/${f.sect}` : ''}`, snip: snippet(f.text, terms) })).slice(0, 8);
    out.saved = (c.savedRules || []).filter((r) => matches(`${r.title} ${r.text} ${r.source}`, terms))
      .map((r) => ({ ...r, snip: snippet(r.text, terms) }));
  }
  out.terms = allTerms().filter((t) => matches(`${t.term} ${t.also}`, terms))
    .map((t) => ({ ...t, s: score(t.term, t.also, terms) })).sort((a, b) => b.s - a.s).slice(0, 10);
  const idx = await buildIndex();
  const hideGm = playerView();
  out.rules = idx.filter((e) => !(hideGm && e.gm))
    .map((e) => (matches(`${e.title} ${e.text}`, terms) ? { ...e, s: score(e.title, e.text, terms), snip: snippet(e.text, terms) } : null))
    .filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 25);
  return { out, c };
}

function group(title, items) {
  if (!items.length) return '';
  return `<section class="results-group"><h2>${esc(title)} <span class="muted">${items.length}</span></h2><ul class="rows">${items.join('')}</ul></section>`;
}

function resultsHtml(r) {
  if (!r) {
    return `<p class="muted">Search your character sheet, the rules saved to it, game terms and every rules page.</p>
      <p class="muted small">Try: <button type="button" class="linklike" data-q="Shaken">Shaken</button>,
      <button type="button" class="linklike" data-q="cover">cover</button>,
      <button type="button" class="linklike" data-q="survival roll">survival roll</button>,
      <button type="button" class="linklike" data-q="Homecoming">Homecoming</button></p>`;
  }
  const { out, c } = r;
  const html = [
    group(c ? `On ${c.name || 'your sheet'}` : 'Your sheet', out.sheet.map((f) => `<li><a href="${f.href}"><span class="row-text"><span class="row-meta">${esc(f.label)}</span><span>${f.snip}</span></span><span class="chev" aria-hidden="true"></span></a></li>`)),
    group('Saved rules', out.saved.map((x) => `<li><button type="button" class="row-main" data-peek-saved="${esc(x.id)}"><span class="row-text"><span class="row-title">${esc(x.title)}</span><span class="snip">${x.snip}</span></span><span class="row-side">${x.active ? 'Active' : ''}</span></button></li>`)),
    group('Terms', out.terms.map((t) => `<li><button type="button" class="row-main" data-term="${esc(t.term)}"><span class="row-text"><span class="row-title">${esc(t.term)}</span><span class="row-meta">${esc(t.kind)}</span></span></button></li>`)),
    group('Rules', out.rules.map((h) => `<li><a href="#/rules/${h.doc.id}${h.anchor ? `/${h.anchor}` : ''}"><span class="row-text"><span class="row-meta">${esc(h.doc.title)}</span><span class="row-title">${esc(h.title)}</span><span class="snip">${h.snip}</span></span></a></li>`)),
  ].join('');
  return html || '<p class="muted">Nothing matches. Try fewer words, or a different spelling.</p>';
}

export function renderSearch(el, [query = '']) {
  setTitle('Search');
  el.innerHTML = `<div class="page">
    <form class="search-box" role="search" id="search-form">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <label class="sr-only" for="q">Search everything</label>
      <input type="search" id="q" value="${esc(query)}" placeholder="Search your sheet, terms and rules" autocomplete="off" enterkeyhint="search">
    </form>
    <div id="results" aria-live="polite"></div>
  </div>`;
  const input = el.querySelector('#q');
  const out = el.querySelector('#results');
  let n = 0;
  const run = async () => {
    const q = input.value.trim();
    const mine = ++n;
    history.replaceState(null, '', `#/search${q ? `/${encodeURIComponent(q)}` : ''}`);
    try {
      const r = await results(q);
      if (mine === n) out.innerHTML = resultsHtml(r);
    } catch (e) {
      out.innerHTML = `<p class="note bad">${esc(e.message)}</p>`;
    }
  };
  let timer;
  input.oninput = () => { clearTimeout(timer); timer = setTimeout(run, 120); };
  el.querySelector('#search-form').onsubmit = (e) => { e.preventDefault(); input.blur(); run(); };
  el.onclick = (e) => {
    const b = e.target.closest('[data-q]');
    if (b) { input.value = b.dataset.q; run(); }
  };
  run();
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
}
