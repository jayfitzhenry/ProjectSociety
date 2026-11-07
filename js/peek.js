// "Peek": tap any term (a condition, a stat, a trait, a rule name) and its rule slides up from the
// bottom. Tap outside, swipe down or press Escape to close. It never opens by itself.
// Also handles saving a rule to the current character from anywhere in the app.
import {
  GLOSSARY, TRAITS, TALENTS, CONTACTS, ITEMS, SPECIAL_RULES,
} from './data.js';
import { getSection, getDoc, docMeta, norm } from './rules.js';
import {
  state, save, esc, toast, uid, currentCharacter,
} from './store.js';
import { signedIn } from './auth.js';
import { renderMarkdown } from './md.js';

const root = () => document.getElementById('peek-root');
let opener = null;

// ---------- open / close ----------
export function closePeek(restoreFocus = true) {
  const r = root();
  if (!r || !r.firstChild) return;
  r.innerHTML = '';
  document.removeEventListener('keydown', onKey);
  if (restoreFocus && opener?.isConnected) opener.focus();
  opener = null;
}

function onKey(e) { if (e.key === 'Escape') closePeek(); }

function openPeek(html, label) {
  const r = root();
  if (!r.firstChild) opener = document.activeElement;
  r.innerHTML = `<div class="peek-scrim" data-close></div>
    <section class="peek" role="dialog" aria-label="${esc(label)}">
      <div class="peek-handle" data-close-handle><span class="sr-only">Swipe down to close</span></div>
      <div class="peek-body">${html}</div>
      <div class="peek-actions"><button type="button" class="btn quiet" data-close>Close</button></div>
    </section>`;
  document.addEventListener('keydown', onKey);
  const sheet = r.querySelector('.peek');
  sheet.querySelector('h2')?.setAttribute('tabindex', '-1');
  (sheet.querySelector('h2') || sheet).focus({ preventScroll: true });
  bindSwipe(sheet);
}

/** Drag the sheet down to close it. */
function bindSwipe(sheet) {
  let startY = null;
  let dy = 0;
  sheet.addEventListener('touchstart', (e) => {
    const onHandle = e.target.closest('[data-close-handle]');
    if (!onHandle && sheet.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    dy = 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (startY === null) return;
    dy = e.touches[0].clientY - startY;
    if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (startY === null) return;
    startY = null;
    if (dy > 80) closePeek(); else sheet.style.transform = '';
  });
}

// ---------- what a term means ----------
let defs = null;
/** Short definitions from the glossaries in getting_started.md and dice_system.md. */
async function definitions() {
  if (defs) return defs;
  defs = new Map();
  const grab = async (docId) => {
    const doc = await getDoc(docId);
    const tpl = document.createElement('template');
    tpl.innerHTML = doc.html;
    const h = tpl.content.querySelector('[data-anchor="glossary"]');
    let n = h?.nextElementSibling;
    while (n && !/^H[1-3]$/.test(n.tagName)) {
      n.querySelectorAll('tbody tr').forEach((tr) => {
        const [a, b] = tr.querySelectorAll('td');
        if (a && b) a.textContent.split(/\s*[/,]\s*/).forEach((t) => defs.set(norm(t.replace(/\(.*\)/, '')), b.innerHTML));
      });
      n.querySelectorAll('li').forEach((li) => {
        const m = li.innerHTML.match(/^<strong>(.+?)<\/strong>:\s*([\s\S]*)$/);
        if (m) m[1].split(/\s*[/,]\s*/).forEach((t) => defs.set(norm(t), m[2]));
      });
      n = n.nextElementSibling;
    }
  };
  await Promise.all(['getting_started', 'dice_system'].map((d) => grab(d).catch(() => {})));
  return defs;
}

const findGlossary = (t) => GLOSSARY.find((g) => norm(g.term) === norm(t) || (g.aliases || []).some((a) => norm(a) === norm(t)));
const signedN = (n) => (n > 0 ? `+${n}` : `${n}`);

/** The parts of a peek for a term: title, short text, where the full rule lives. */
async function lookup(term) {
  const trait = TRAITS.find((x) => x.id === term);
  if (trait) {
    const talents = TALENTS.filter((x) => x.trait === trait.id);
    return {
      title: trait.id, kind: 'Trait', doc: 'character_creation', anchor: 'traitlist',
      text: `<p><b>Covers:</b> ${esc(trait.covers)}</p><p class="muted"><b>Not:</b> ${esc(trait.not)}</p>
        <p class="muted small">A covering trait gives +1 dice. One trait per roll.</p>
        ${talents.length ? `<p class="label">Talents</p><ul class="plain">${talents.map((t) => `<li><b>${esc(t.name)}</b>: ${esc(t.effect)}</li>`).join('')}</ul>` : ''}`,
      save: `Covers: ${trait.covers}. Not: ${trait.not}.`,
    };
  }
  const talent = TALENTS.find((x) => x.name === term || x.id === term);
  if (talent) {
    return {
      title: talent.name, kind: talent.trait ? `${talent.trait} talent` : 'General talent', doc: 'progression', anchor: talent.trait ? 'traittalents' : 'generaltalents',
      text: `<p>${esc(talent.effect)}</p>`, save: talent.effect,
    };
  }
  if (SPECIAL_RULES[term]) {
    return { title: term, kind: 'Special rule', doc: 'equipment', anchor: 'tagsspecialrules', text: `<p>${esc(SPECIAL_RULES[term])}</p>`, save: SPECIAL_RULES[term] };
  }
  const contact = CONTACTS.find((x) => x.id === term);
  if (contact) {
    return { title: contact.id, kind: 'Contact', doc: 'progression', anchor: 'contacts', text: `<p class="muted">${esc(contact.who)}</p><p>${esc(contact.effect)}</p>`, save: contact.effect };
  }
  const item = ITEMS.find((x) => x.name === term || x.id === term);
  if (item) {
    const stat = item.kind === 'weapon' ? `${signedN(item.mod)} dice To Wound · ${item.range}`
      : item.kind === 'armour' ? `${signedN(item.mod)} dice on wound rolls against you`
        : item.kind === 'tool' ? `+1 dice: ${item.helps}` : item.effect;
    return {
      title: item.name, kind: item.kind[0].toUpperCase() + item.kind.slice(1), doc: 'equipment', anchor: 'pricelists',
      text: `<p>${esc(stat)}</p>${item.rules?.length ? `<ul class="plain">${item.rules.map((r) => `<li><button type="button" class="term" data-term="${esc(r)}">${esc(r)}</button>: ${esc(SPECIAL_RULES[r] || '')}</li>`).join('')}</ul>` : ''}
        <p class="muted small">${item.price}c</p>`,
      save: stat,
    };
  }
  const g = findGlossary(term);
  if (!g) return null;
  const [d, sec] = await Promise.all([definitions(), getSection(g.doc, g.anchor, { maxBlocks: 3 })]);
  const def = d.get(norm(g.term)) || (g.aliases || []).map((a) => d.get(norm(a))).find(Boolean);
  return {
    title: g.term, kind: sec ? `${docMeta(g.doc)?.title} · ${sec.title}` : docMeta(g.doc)?.title, doc: g.doc, anchor: g.anchor,
    text: `${def ? `<p>${def.replace(/^\s*([a-z])/, (m) => m.toUpperCase())}</p>` : ''}${sec ? `<div class="md">${sec.html}</div>${sec.more ? '<p class="muted small">The full rule goes on.</p>' : ''}` : ''}`,
    save: def ? htmlText(def) : sec ? excerpt(sec.html) : '',
  };
}

function htmlText(html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  return t.content.textContent.replace(/\s+/g, ' ').trim();
}

/** A short plain-text version of a rules section, to keep on a character sheet. */
function excerpt(html, max = 600) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const lines = [];
  for (const n of Array.from(tpl.content.children)) {
    if (n.matches('.table-wrap, table')) {
      n.querySelectorAll('tbody tr').forEach((tr) => lines.push(`- ${Array.from(tr.cells).map((c) => c.textContent.trim()).join(': ')}`));
    } else if (n.matches('ul, ol')) {
      n.querySelectorAll(':scope > li').forEach((li) => lines.push(`- ${li.textContent.trim()}`));
    } else if (!n.matches('details, pre')) {
      lines.push(n.textContent.trim());
    }
    if (lines.join('\n').length > max) break;
  }
  const text = lines.filter(Boolean).join('\n');
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}

function saveButton(key) {
  const c = signedIn() && currentCharacter();
  if (!c) return '';
  const has = (c.savedRules || []).some((r) => r.key === key);
  return has ? `<span class="muted small">Saved to ${esc(c.name || 'your character')}</span>`
    : `<button type="button" class="btn" data-save-term="${esc(key)}">Save to ${esc(c.name || 'my character')}</button>`;
}

export async function peekTerm(term) {
  const info = await lookup(term);
  if (!info) { toast(`No rule found for “${esc(term)}”`); return; }
  openPeek(`<h2>${esc(info.title)}</h2>
    <p class="from small muted">${esc(info.kind || '')}</p>
    ${info.text}
    <div class="peek-actions">
      <a class="btn" href="#/rules/${info.doc}/${info.anchor}">Open the full rule</a>
      ${saveButton(`term:${info.title}`)}
    </div>`, info.title);
}

function peekSaved(id) {
  const c = currentCharacter();
  const r = (c?.savedRules || []).find((x) => x.id === id);
  if (!r) return;
  openPeek(`<h2>${esc(r.title)}</h2>
    ${r.source ? `<p class="from small muted">${esc(r.source)}</p>` : ''}
    <div class="md">${renderMarkdown(r.text)}</div>
    <div class="peek-actions">
      ${r.href ? `<a class="btn" href="${esc(r.href)}">Open the full rule</a>` : ''}
      <button type="button" class="switch" role="switch" aria-checked="${r.active ? 'true' : 'false'}" data-toggle-saved="${esc(r.id)}">
        <span class="track" aria-hidden="true"></span><span>Active</span></button>
    </div>`, r.title);
}

// ---------- saving rules to a character ----------
function addSaved(c, rule) {
  c.savedRules = c.savedRules || [];
  if (c.savedRules.some((r) => r.key === rule.key)) { toast(`Already on ${esc(c.name)}'s sheet`); return; }
  c.savedRules.unshift({ id: uid(), active: true, ...rule });
  save();
  toast(`Saved to ${esc(c.name || 'your character')}. It's on the sheet.`);
  window.dispatchEvent(new CustomEvent('ps:saved-rules'));
}

async function saveSection(key) {
  const c = currentCharacter();
  if (!signedIn() || !c) { toast(signedIn() ? 'Make a character first, then save rules to it.' : 'Sign in to save rules to a character.'); return; }
  const [docId, anchor] = key.split('/');
  const sec = await getSection(docId, anchor, { maxBlocks: 4 });
  if (!sec) return;
  addSaved(c, { key: `rule:${key}`, title: sec.title, text: excerpt(sec.html), source: `${sec.docTitle} · ${sec.title}`, href: `#/rules/${docId}/${anchor}` });
}

async function saveTerm(key) {
  const c = currentCharacter();
  if (!c) return;
  const info = await lookup(key.replace(/^term:/, ''));
  if (!info) return;
  addSaved(c, { key, title: info.title, text: info.save, source: info.kind || '', href: `#/rules/${info.doc}/${info.anchor}` });
  closePeek();
}

// ---------- wiring ----------
export function initPeek() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-close]') && root().contains(t)) { closePeek(); return; }
    const term = t.closest('[data-term]');
    if (term) { e.preventDefault(); peekTerm(term.dataset.term); return; }
    const saved = t.closest('[data-peek-saved]');
    if (saved) { e.preventDefault(); peekSaved(saved.dataset.peekSaved); return; }
    const sec = t.closest('[data-save-rule]');
    if (sec) { e.preventDefault(); saveSection(sec.dataset.saveRule); return; }
    const st = t.closest('[data-save-term]');
    if (st) { e.preventDefault(); saveTerm(st.dataset.saveTerm); return; }
    const tog = t.closest('[data-toggle-saved]');
    if (tog) {
      const c = currentCharacter();
      const r = (c?.savedRules || []).find((x) => x.id === tog.dataset.toggleSaved);
      if (!r) return;
      r.active = !r.active;
      tog.setAttribute('aria-checked', String(r.active));
      save();
      window.dispatchEvent(new CustomEvent('ps:saved-rules'));
      return;
    }
    // A link inside the sheet navigates: close it on the way.
    if (t.closest('.peek a[href^="#"]')) closePeek(false);
  });
}
