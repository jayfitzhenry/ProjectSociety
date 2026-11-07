// The rules wiki: renders the rules .md files live, with grouped pages, an A-Z topic index,
// tappable glossary terms, a search index and a player view that hides GM-only material.
import { RULE_DOCS, RULE_GROUPS, GLOSSARY } from './data.js';
import { state, saveSettings, esc, plain, setTitle } from './store.js';
import { isDmAnywhere, signedIn } from './auth.js';

// Players always get player view. Only a DM (of any campaign) can show GM-only sections.
// This is cosmetic: the .md files are public. See the README for moving GM text behind the API.
export const playerView = () => !isDmAnywhere() || state.settings.playerView;

const raw = new Map(); // docId -> markdown
const rendered = new Map(); // docId -> { html, toc, title, lead }

export const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');
export const docMeta = (id) => RULE_DOCS.find((d) => d.id === id);

async function fetchDoc(id) {
  if (raw.has(id)) return raw.get(id);
  const res = await fetch(`${id}.md`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Couldn't load ${id}.md (${res.status})`);
  const text = await res.text();
  raw.set(id, text);
  return text;
}

const isGmHeading = (text) => /\bGM\s+only\b/i.test(text);
const headingLevel = (n) => Number(n?.tagName?.match(/^H([1-6])$/)?.[1] || 0);
/** Heading text without emoji, the "#" and "Project Society — ". */
export const cleanTitle = (t) => plain(t).replace(/^Project Society\s*[—-]\s*/, '');

// ---------- glossary terms inside the rules text ----------
// Common words that are also glossary terms aren't underlined in running text: too many false hits.
const NO_AUTOLINK = new Set(['Roll', 'Test', 'Tests', 'Move', 'Help', 'Helper', 'Helping', 'Hard', 'Easy', 'Level', 'Hide',
  'Aim', 'Aiming', 'Cover', 'Darkness', 'Tier', 'Project', 'Projects', 'Trait', 'Traits', 'Background', 'Backgrounds',
  'Tool', 'Tools', 'Market', 'Markets', 'Advantage', 'Disadvantage', 'Wound', 'Wounds', 'wounds', 'Healing', 'Activation',
  'Chips', 'critical', 'fumble', 'net dice', 'Raid', 'Raids', 'Lie low']);

let termRe = null;
const termOf = new Map(); // spelling -> glossary term
function termRegex() {
  if (termRe) return termRe;
  GLOSSARY.forEach((g) => [g.term, ...(g.aliases || [])].forEach((w) => { if (!NO_AUTOLINK.has(w)) termOf.set(w, g.term); }));
  const words = [...termOf.keys()].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  termRe = new RegExp(`(?<![\\w-])(${words.join('|')})(?![\\w-])`, 'g');
  return termRe;
}

/** Underline the first use of each glossary term in each section (not where the term is defined). */
function linkTerms(root) {
  const re = termRegex();
  let used = new Set();
  let here = new Set(); // anchors of the current h2 and h3
  Array.from(root.children).forEach((block) => {
    const lvl = headingLevel(block);
    if (lvl) {
      if (lvl <= 2) { used = new Set(); here = new Set(); }
      if (lvl === 3) here = new Set([...here].slice(0, 1));
      here.add(block.dataset.anchor);
      return;
    }
    if (block.matches('pre, .designer')) return;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest('a, code, pre, summary, button, h1, h2, h3, h4') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const text = node.nodeValue;
      re.lastIndex = 0;
      let m;
      let last = 0;
      const frag = document.createDocumentFragment();
      let changed = false;
      while ((m = re.exec(text))) {
        const term = termOf.get(m[1]);
        const g = GLOSSARY.find((x) => x.term === term);
        if (used.has(term) || here.has(g.anchor)) continue;
        used.add(term);
        frag.append(text.slice(last, m.index));
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'term';
        b.dataset.term = term;
        b.textContent = m[1];
        frag.append(b);
        last = m.index + m[1].length;
        changed = true;
      }
      if (!changed) return;
      frag.append(text.slice(last));
      node.replaceWith(frag);
    });
  });
}

/** Strip emoji used as icons from the rules text (not from code blocks, where they'd break the diagrams). */
function stripIcons(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('pre') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const v = n.nodeValue.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '');
    if (v !== n.nodeValue) n.nodeValue = v.replace(/^\s+(?=\S)/, n.previousSibling ? ' ' : '');
  });
}

function renderDoc(id, md) {
  const html = window.marked.parse(md, { gfm: true });
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;
  const used = new Set();
  let title = '';

  // Mark GM-only material first (it's found by its icon): sections under a "GM Only" heading, and GM-only callouts.
  let gmLevel = 0;
  Array.from(root.children).forEach((n) => {
    const lvl = headingLevel(n);
    if (lvl) {
      if (gmLevel && lvl <= gmLevel) gmLevel = 0;
      if (isGmHeading(n.textContent)) gmLevel = lvl;
    }
    if (gmLevel) n.classList.add('gm-only');
  });
  root.querySelectorAll('blockquote').forEach((b) => {
    if (/^\s*\S*\s*GM only/i.test(b.textContent) || /GM only/i.test(b.querySelector('strong')?.textContent || '')) b.classList.add('gm-only');
  });

  stripIcons(root);

  // Task lists (- [x] in the markdown) are read-only checkboxes: give each a name.
  root.querySelectorAll('li > input[type="checkbox"]').forEach((i) => { i.setAttribute('aria-label', i.hasAttribute('checked') ? 'Done' : 'Not done'); });

  // Headings: stable anchors (letters and digits of the heading), plus Link and Save actions.
  root.querySelectorAll('h1,h2,h3,h4').forEach((h) => {
    const text = cleanTitle(h.textContent);
    h.textContent = text;
    const key = norm(text) || 'section';
    let k = key;
    let i = 2;
    while (used.has(k)) k = `${key}${i++}`;
    used.add(k);
    h.id = `h-${k}`;
    h.dataset.anchor = k;
    if (h.tagName === 'H1') { title = text; return; }
    if (h.tagName === 'H2' || h.tagName === 'H3') {
      const acts = document.createElement('span');
      acts.className = 'h-actions';
      acts.innerHTML = `<button type="button" class="save" data-save-rule="${id}/${k}" aria-label="Save “${esc(text)}” to your character">Save</button>`;
      h.appendChild(acts);
    }
  });

  // The page's own contents list is replaced by the app's; drop it.
  const kids = () => Array.from(root.children);
  const contents = kids().find((n) => n.tagName === 'H2' && /^contents$/i.test(n.dataset.anchor));
  if (contents) {
    let n = contents;
    while (n && !(headingLevel(n) && headingLevel(n) <= 2 && n !== contents)) { const next = n.nextElementSibling; n.remove(); n = next; }
  }
  // Remove the H1 (the page draws its own title) and horizontal rules (headings separate sections already).
  root.querySelector('h1')?.remove();
  root.querySelectorAll('hr').forEach((x) => x.remove());

  // Design decisions are for the authors: fold them away.
  kids().filter((n) => n.tagName === 'H2' && /designdecisions/.test(n.dataset.anchor)).forEach((h) => {
    const d = document.createElement('details');
    d.className = 'designer';
    d.innerHTML = `<summary>Designer's notes: ${esc(h.firstChild.textContent)}</summary>`;
    const move = [];
    let n = h.nextElementSibling;
    while (n && !(headingLevel(n) === 2) && !(n.tagName === 'P' && n.querySelector('sub'))) { move.push(n); n = n.nextElementSibling; }
    h.replaceWith(d);
    d.append(h, ...move);
  });

  // Rewrite links to other rules pages and in-page anchors.
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    const m = href.match(/^([\w-]+)\.md(?:#(.*))?$/);
    if (m && docMeta(m[1])) {
      a.setAttribute('href', `#/rules/${m[1]}${m[2] ? `/${norm(decodeURIComponent(m[2]))}` : ''}`);
    } else if (href.startsWith('#')) {
      a.setAttribute('href', `#/rules/${id}/${norm(decodeURIComponent(href.slice(1)))}`);
    } else if (/^https?:/.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });

  // Wide tables scroll sideways on small screens.
  root.querySelectorAll('table').forEach((t) => {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Table');
    t.replaceWith(wrap);
    wrap.appendChild(t);
  });

  // Diagrams (pre blocks) scroll sideways too, so keyboards need to reach them (WCAG 2.1.1).
  root.querySelectorAll('pre').forEach((pre) => {
    pre.tabIndex = 0;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', 'Diagram');
  });

  linkTerms(root);

  const toc = Array.from(root.querySelectorAll('h2, h3'))
    .filter((h) => !h.closest('.designer'))
    .map((h) => ({ level: Number(h.tagName[1]), text: h.firstChild.textContent, anchor: h.dataset.anchor, gm: h.classList.contains('gm-only') }));
  const div = document.createElement('div');
  div.appendChild(root.cloneNode(true));
  return { html: div.innerHTML, toc, title: title || docMeta(id)?.title || id };
}

export async function getDoc(id) {
  if (rendered.has(id)) return rendered.get(id);
  const r = renderDoc(id, await fetchDoc(id));
  rendered.set(id, r);
  return r;
}

/** One section of a page (a heading and what follows, up to the next heading of the same level). */
export async function getSection(docId, anchor, { maxBlocks = 6 } = {}) {
  const doc = await getDoc(docId);
  const tpl = document.createElement('template');
  tpl.innerHTML = doc.html;
  const h = tpl.content.querySelector(`[data-anchor="${CSS.escape(anchor)}"]`);
  if (!h) return null;
  const lvl = headingLevel(h);
  const out = [];
  let more = false;
  let n = h.nextElementSibling;
  while (n && !(headingLevel(n) && headingLevel(n) <= lvl)) {
    if (out.length >= maxBlocks) { more = true; break; }
    if (!(playerView() && n.classList.contains('gm-only'))) out.push(n.outerHTML);
    n = n.nextElementSibling;
  }
  return { title: h.firstChild.textContent, html: out.join(''), more, docTitle: docMeta(docId)?.title || doc.title, gm: h.classList.contains('gm-only') };
}

// ---------- search index ----------
let index = null;
export async function buildIndex() {
  if (index) return index;
  const entries = [];
  await Promise.all(RULE_DOCS.map(async (d) => {
    const doc = await getDoc(d.id);
    const tpl = document.createElement('template');
    tpl.innerHTML = doc.html;
    let current = { doc: d, title: doc.title, anchor: '', text: '', gm: false, level: 1 };
    const push = () => { if (current.text.trim() || current.anchor) entries.push(current); };
    const walk = (nodes) => nodes.forEach((n) => {
      if (n.tagName === 'DETAILS' && n.classList.contains('designer')) return;
      if (/^H[1-4]$/.test(n.tagName)) {
        push();
        current = { doc: d, title: n.firstChild.textContent, anchor: n.dataset.anchor, text: '', gm: n.classList.contains('gm-only'), level: Number(n.tagName[1]) };
      } else {
        current.text += ` ${n.textContent}`;
        if (n.classList?.contains('gm-only')) current.gm = true;
      }
    });
    walk(Array.from(tpl.content.children));
    push();
  }));
  index = entries;
  return index;
}

// ---------- views ----------
const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

function searchBox(placeholder = 'Search rules, terms and your sheet') {
  return `<form class="search-box" role="search" id="rules-search-form">
    ${SEARCH_ICON}
    <label class="sr-only" for="rules-q">Search</label>
    <input type="search" id="rules-q" placeholder="${placeholder}" autocomplete="off" enterkeyhint="search">
  </form>`;
}

function bindSearchBox(el) {
  const go = (q) => { location.hash = `#/search/${encodeURIComponent(q)}`; };
  el.querySelector('#rules-search-form').onsubmit = (e) => { e.preventDefault(); go(el.querySelector('#rules-q').value.trim()); };
  // Typing jumps straight to the search page, which keeps the text and the focus.
  el.querySelector('#rules-q').oninput = (e) => { if (e.target.value.trim()) go(e.target.value); };
}

/** Every section heading and glossary term, A to Z. */
async function topics() {
  const idx = await buildIndex();
  const hideGm = playerView();
  const seen = new Set();
  const list = [];
  GLOSSARY.forEach((g) => { seen.add(norm(g.term)); list.push({ title: g.term, term: g.term, where: docMeta(g.doc)?.title }); });
  idx.filter((e) => e.anchor && e.level >= 2 && e.level <= 3 && !(hideGm && e.gm))
    .filter((e) => !/^(contents|workedexamples?|example|openquestions|designdecisions.*)$/.test(e.anchor))
    .forEach((e) => {
      const k = norm(e.title);
      if (seen.has(k) || e.title.length < 3) return;
      seen.add(k);
      list.push({ title: e.title, href: `#/rules/${e.doc.id}/${e.anchor}`, where: e.doc.title });
    });
  return list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

function azHtml(list) {
  const groups = new Map();
  list.forEach((t) => {
    const L = /[a-z]/i.test(t.title[0]) ? t.title[0].toUpperCase() : '#';
    if (!groups.has(L)) groups.set(L, []);
    groups.get(L).push(t);
  });
  const letters = [...groups.keys()];
  return `<nav class="az-jump" aria-label="Jump to letter">${letters.map((L) => `<a href="#" data-az="${L}">${L}</a>`).join('')}</nav>
    ${letters.map((L) => `<h3 class="az-letter" id="az-${L}">${L}</h3>
      <ul class="az-list">${groups.get(L).map((t) => `<li>${t.term
        ? `<button type="button" data-term="${esc(t.term)}">${esc(t.title)} <small>${esc(t.where || '')}</small></button>`
        : `<a href="${t.href}">${esc(t.title)} <small>${esc(t.where)}</small></a>`}</li>`).join('')}</ul>`).join('')}`;
}

// Line icons for the tiles on the Rules home (decoration: each tile has its title).
const svg = (d) => `<span class="tile-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${d}</svg></span>`;
const DOC_ICONS = {
  quick_start: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  dice_modifiers: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 10h6M10 7v6M12 17h5"/>',
  getting_started: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  dice_system: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/>',
  character_creation: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  actions: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  equipment: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  progression: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  community: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  exposure_and_trust: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  world_history: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
};
const AZ_ICON = '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>';
const BOOK_ICON = '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/>';

function homeView() {
  return `<div class="page">
    <div class="page-head"><div><h1>Rules</h1><p class="sub">New to the game? Start with the Quick Start.</p></div></div>
    ${searchBox()}
    <p class="block"><a class="tile wide" href="#/rules/a-z">${svg(AZ_ICON)}<span><b>Topics A to Z</b><small>Every term and rule section, in one list</small></span><span class="chev" aria-hidden="true"></span></a></p>
    ${RULE_GROUPS.map((g) => {
      const docs = RULE_DOCS.filter((d) => d.group === g.id);
      return `<section class="block" aria-labelledby="g-${g.id}">
        <h2 class="label" id="g-${g.id}">${esc(g.title)}</h2>
        <ul class="tiles">${docs.map((d) => `<li><a class="tile" href="#/rules/${d.id}">${svg(DOC_ICONS[d.id] || BOOK_ICON)}<b>${esc(d.title)}</b>
          <small data-blurb="${d.id}"></small></a></li>`).join('')}</ul>
      </section>`;
    }).join('')}
  </div>`;
}

function azView() {
  return `<div class="page">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/rules">Rules</a></nav>
    <div class="page-head"><div><h1>Topics A to Z</h1><p class="sub">Every glossary term and rule section. Tap a term to read it here.</p></div></div>
    <div id="az"><p class="muted">Gathering topics…</p></div>
  </div>`;
}

function tocList(doc, id) {
  return `<ul class="toc">${doc.toc.map((t) => `<li class="l${t.level} ${t.gm ? 'gm-only' : ''}"><a href="#/rules/${id}/${t.anchor}">${esc(t.text)}</a></li>`).join('')}</ul>`;
}

function gmToggle() {
  if (!isDmAnywhere()) return '';
  return `<button type="button" class="switch" role="switch" aria-checked="${state.settings.playerView ? 'true' : 'false'}" data-player-view>
    <span class="track" aria-hidden="true"></span><span>Player view <span class="muted small">hides GM-only sections</span></span></button>`;
}

function docView(id, doc) {
  const meta = docMeta(id);
  const i = RULE_DOCS.indexOf(meta);
  const prev = RULE_DOCS[i - 1];
  const next = RULE_DOCS[i + 1];
  const group = RULE_GROUPS.find((g) => g.id === meta.group);
  return `<div class="page wide rules-layout has-toc">
    <article>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#/rules">Rules</a> · ${esc(group?.title || '')}</nav>
      <h1>${esc(meta.title)}</h1>
      <details class="sect toc-inline"><summary>On this page <span class="meta">${doc.toc.filter((t) => t.level === 2).length} sections</span></summary>
        <div class="sect-body">${tocList(doc, id)}${gmToggle() ? `<div style="margin-top:16px">${gmToggle()}</div>` : ''}</div></details>
      <div class="md" id="rules-body">${doc.html}</div>
      <nav class="doc-nav" aria-label="Other pages">
        ${prev ? `<a href="#/rules/${prev.id}"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="next" href="#/rules/${next.id}"><span>Next</span>${esc(next.title)}</a>` : ''}
      </nav>
    </article>
    <aside class="toc-side" aria-label="On this page">
      <p class="label">On this page</p>
      ${tocList(doc, id)}
      ${gmToggle() ? `<div style="margin-top:16px">${gmToggle()}</div>` : ''}
    </aside>
  </div>`;
}

function bindDoc(el) {
  el.onclick = (e) => {
    const sw = e.target.closest('[data-player-view]');
    if (sw) {
      state.settings.playerView = !state.settings.playerView;
      saveSettings();
      document.body.classList.toggle('player-view', playerView());
      el.querySelectorAll('[data-player-view]').forEach((x) => x.setAttribute('aria-checked', String(state.settings.playerView)));
    }
  };
}

export async function renderRules(el, [docId, anchor]) {
  document.body.classList.toggle('player-view', playerView());
  document.body.classList.toggle('signed-out', !signedIn());
  if (docId === 'a-z') {
    setTitle('Topics A to Z');
    delete el.dataset.doc;
    el.innerHTML = azView();
    el.onclick = (e) => {
      const L = e.target.closest('[data-az]');
      if (L) { e.preventDefault(); el.querySelector(`#az-${CSS.escape(L.dataset.az)}`)?.scrollIntoView({ block: 'start' }); }
    };
    window.scrollTo(0, 0);
    try {
      const list = await topics();
      const az = el.querySelector('#az');
      if (az) az.innerHTML = azHtml(list);
    } catch (e) {
      const az = el.querySelector('#az');
      if (az) az.innerHTML = `<p class="note bad">${esc(e.message)}</p>`;
    }
    return;
  }
  if (!docId) {
    setTitle('Rules');
    el.innerHTML = homeView();
    bindSearchBox(el);
    el.onclick = null;
    RULE_DOCS.forEach(async (d) => {
      try {
        const md = await fetchDoc(d.id);
        const line = md.split('\n').find((l) => l.startsWith('> '));
        const target = el.querySelector(`[data-blurb="${d.id}"]`);
        if (target && line) target.textContent = plain(line.replace(/^>\s*/, '').replace(/\*\*/g, ''));
      } catch { /* the page link still works */ }
    });
    return;
  }

  const meta = docMeta(docId);
  if (!meta) { el.innerHTML = '<div class="page"><p>There\'s no rules page here.</p><a class="btn" href="#/rules">All rules</a></div>'; return; }
  setTitle(meta.title);

  // Same page already on screen? Just scroll to the section.
  if (el.querySelector(`#rules-body`) && el.dataset.doc === docId) { scrollToAnchor(el, anchor); return; }
  el.dataset.doc = docId;
  el.innerHTML = `<div class="page"><h1>${esc(meta.title)}</h1><p class="muted">Opening…</p></div>`;
  try {
    const doc = await getDoc(docId);
    if (el.dataset.doc !== docId) return;
    el.innerHTML = docView(docId, doc);
    bindDoc(el);
    scrollToAnchor(el, anchor);
  } catch (e) {
    el.innerHTML = `<div class="page"><p class="note bad"><b>Couldn't load the rules.</b> ${esc(e.message)}</p>
      <p class="muted">If you opened index.html straight from disk, serve the folder instead, for example <code>python3 -m http.server</code>, then open <code>http://localhost:8000</code>.</p></div>`;
  }
}
// Leaving the rules: forget which page was drawn, so coming back redraws it.
window.addEventListener('hashchange', () => {
  if (!location.hash.startsWith('#/rules/')) delete document.getElementById('app').dataset.doc;
});

function scrollToAnchor(el, anchor) {
  el.querySelectorAll('.toc a').forEach((a) => a.classList.toggle('active', !!anchor && a.getAttribute('href').endsWith(`/${anchor}`)));
  if (!anchor) { window.scrollTo(0, 0); return; }
  const target = el.querySelector(`#h-${CSS.escape(anchor)}`)
    || Array.from(el.querySelectorAll('#rules-body [data-anchor]')).find((h) => h.dataset.anchor.startsWith(anchor));
  if (!target) return;
  let d = target.closest('details');
  while (d) { d.open = true; d = d.parentElement.closest('details'); }
  el.querySelector('.toc-inline')?.removeAttribute('open');
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  target.classList.add('flash');
  setTimeout(() => target.classList.remove('flash'), 1600);
}
