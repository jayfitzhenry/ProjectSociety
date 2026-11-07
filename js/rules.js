// Rules reader: renders the rules .md files live, with contents, cross-links,
// full-text search and a player view that hides GM-only material.
import { RULE_DOCS } from './data.js';
import { state, save, esc } from './store.js';
import { isDmAnywhere } from './auth.js';

// Players always get player view. Only a DM (of any campaign) can show GM-only sections.
// This is cosmetic: the .md files are public. See the README for moving GM text behind the API.
const playerView = () => !isDmAnywhere() || state.settings.playerView;

const raw = new Map(); // docId -> markdown
const rendered = new Map(); // docId -> { html, toc, title }

export const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');

async function fetchDoc(id) {
  if (raw.has(id)) return raw.get(id);
  const res = await fetch(`${id}.md`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${id}.md (${res.status})`);
  const text = await res.text();
  raw.set(id, text);
  return text;
}

function isGmHeading(text) {
  return /\bGM\s+only\b/i.test(text);
}

function renderDoc(id, md) {
  const html = window.marked.parse(md, { gfm: true });
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;
  const toc = [];
  const used = new Set();
  let title = '';

  root.querySelectorAll('h1,h2,h3,h4').forEach((h) => {
    const text = h.textContent.trim();
    let key = norm(text) || 'section';
    let k = key;
    let i = 2;
    while (used.has(k)) k = `${key}${i++}`;
    used.add(k);
    h.id = `h-${k}`;
    h.dataset.anchor = k;
    if (h.tagName === 'H1') title = text;
    if (h.tagName === 'H2' || h.tagName === 'H3') {
      if (!/^📑\s*contents$/i.test(text)) toc.push({ level: Number(h.tagName[1]), text, anchor: k });
    }
    const a = document.createElement('a');
    a.className = 'h-link';
    a.href = `#/rules/${id}/${k}`;
    a.textContent = '#';
    a.title = 'Link to this section';
    h.appendChild(a);
  });

  // Rewrite links to other rules docs and in-page anchors.
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (a.classList.contains('h-link')) return;
    const m = href.match(/^([\w-]+)\.md(?:#(.*))?$/);
    if (m && RULE_DOCS.some((d) => d.id === m[1])) {
      a.setAttribute('href', `#/rules/${m[1]}${m[2] ? `/${norm(decodeURIComponent(m[2]))}` : ''}`);
    } else if (href.startsWith('#')) {
      a.setAttribute('href', `#/rules/${id}/${norm(decodeURIComponent(href.slice(1)))}`);
    } else if (/^https?:/.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });

  // Make wide tables scroll on small screens.
  root.querySelectorAll('table').forEach((t) => {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    t.replaceWith(wrap);
    wrap.appendChild(t);
  });

  // Mark GM-only material: whole sections under a "GM Only" heading, and GM-only callouts.
  const nodes = Array.from(root.children);
  let gmLevel = 0;
  nodes.forEach((n) => {
    const m = n.tagName?.match(/^H([1-6])$/);
    if (m) {
      const lvl = Number(m[1]);
      if (gmLevel && lvl <= gmLevel) gmLevel = 0;
      if (isGmHeading(n.textContent)) gmLevel = lvl;
    }
    if (gmLevel) n.classList.add('gm-only');
  });
  root.querySelectorAll('blockquote').forEach((b) => {
    if (/^\s*🕵️?\s*GM only/i.test(b.textContent) || /GM only/i.test(b.querySelector('strong')?.textContent || '')) {
      b.classList.add('gm-only');
    }
  });
  // Also mark the matching contents entry for GM sections.
  root.querySelectorAll('li').forEach((li) => {
    if (isGmHeading(li.textContent) && li.querySelector('a')) li.classList.add('gm-only');
  });

  const div = document.createElement('div');
  div.appendChild(root.cloneNode(true));
  return { html: div.innerHTML, toc, title };
}

async function getDoc(id) {
  if (rendered.has(id)) return rendered.get(id);
  const md = await fetchDoc(id);
  const r = renderDoc(id, md);
  rendered.set(id, r);
  return r;
}

// ---------- search ----------
let index = null;
async function buildIndex() {
  if (index) return index;
  const entries = [];
  await Promise.all(RULE_DOCS.map(async (d) => {
    const doc = await getDoc(d.id);
    const tpl = document.createElement('template');
    tpl.innerHTML = doc.html;
    let current = { doc: d, title: doc.title, anchor: '', text: '', gm: false };
    const push = () => { if (current.text.trim()) entries.push(current); };
    Array.from(tpl.content.children).forEach((n) => {
      if (/^H[1-4]$/.test(n.tagName)) {
        push();
        current = { doc: d, title: n.textContent.replace(/#$/, '').trim(), anchor: n.dataset.anchor, text: '', gm: n.classList.contains('gm-only') };
      } else {
        current.text += ` ${n.textContent}`;
        if (n.classList.contains('gm-only')) current.gm = true;
      }
    });
    push();
  }));
  index = entries;
  return index;
}

function snippet(text, terms) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  let pos = lower.indexOf(terms[0]);
  if (pos < 0) pos = 0;
  const start = Math.max(0, pos - 60);
  let s = esc(clean.slice(start, start + 200));
  terms.forEach((t) => {
    if (!t) return;
    s = s.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
  });
  return (start > 0 ? '…' : '') + s + (start + 200 < clean.length ? '…' : '');
}

async function search(q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const idx = await buildIndex();
  const hideGm = playerView();
  return idx
    .filter((e) => !(hideGm && e.gm))
    .map((e) => {
      const hay = `${e.title} ${e.text}`.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return null;
      const score = terms.reduce((s, t) => s + (e.title.toLowerCase().includes(t) ? 5 : 0) + (hay.split(t).length - 1), 0);
      return { ...e, score, snip: snippet(e.text, terms) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

// ---------- views ----------
function sidebar(activeId, toc) {
  return `<aside class="rules-side">
    <div class="side-block">
      <input type="search" id="rules-search" placeholder="🔎 Search all rules…" autocomplete="off">
    </div>
    <nav class="side-block doc-list">
      ${RULE_DOCS.map((d) => `<a href="#/rules/${d.id}" class="${d.id === activeId ? 'active' : ''}">${d.icon} ${d.title}</a>`).join('')}
    </nav>
    ${toc ? `<nav class="side-block toc">
      <div class="side-title">On this page</div>
      ${toc.map((t) => `<a class="toc-l${t.level} ${isGmHeading(t.text) ? 'gm-only' : ''}" href="#/rules/${activeId}/${t.anchor}">${esc(t.text)}</a>`).join('')}
    </nav>` : ''}
    ${isDmAnywhere() ? `<label class="side-block toggle">
      <input type="checkbox" id="player-view" ${state.settings.playerView ? 'checked' : ''}>
      <span>🙈 Player view <small class="muted">(hide GM-only sections)</small></span>
    </label>` : ''}
  </aside>`;
}

function bindSidebar(el) {
  const input = el.querySelector('#rules-search');
  const results = el.querySelector('#rules-results');
  const body = el.querySelector('#rules-body');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value.trim();
      if (!q) { results.hidden = true; body.hidden = false; return; }
      const hits = await search(q);
      results.innerHTML = `<h2>Search: “${esc(q)}”</h2>${hits.length ? hits.map((h) => `
        <a class="search-hit" href="#/rules/${h.doc.id}/${h.anchor}">
          <div><span class="muted">${h.doc.icon} ${h.doc.title}</span> › <b>${esc(h.title)}</b></div>
          <div class="snip">${h.snip}</div>
        </a>`).join('') : '<p class="muted">No matches.</p>'}`;
      results.hidden = false;
      body.hidden = true;
    }, 150);
  });
  el.querySelector('#player-view')?.addEventListener('change', (e) => {
    state.settings.playerView = e.target.checked;
    save();
    document.body.classList.toggle('player-view', state.settings.playerView);
  });
  results?.addEventListener('click', (e) => {
    if (e.target.closest('a')) { input.value = ''; results.hidden = true; body.hidden = false; }
  });
}

export async function renderRules(el, [docId, anchor]) {
  document.body.classList.toggle('player-view', playerView());
  if (!docId) {
    el.innerHTML = `<div class="rules-layout">
      ${sidebar(null, null)}
      <article class="rules-main">
        <div id="rules-results" class="md" hidden></div>
        <div id="rules-body">
          <h1>📜 Rulebook</h1>
          <p class="lead">Every rule, rendered straight from the project's markdown files. Search across all of them from the sidebar.</p>
          <div class="card-grid">
            ${RULE_DOCS.map((d) => `<a class="card link-card" href="#/rules/${d.id}"><div class="big">${d.icon}</div><b>${d.title}</b><small class="muted" data-blurb="${d.id}"></small></a>`).join('')}
          </div>
        </div>
      </article>
    </div>`;
    bindSidebar(el);
    // Fill in each doc's tagline (its first blockquote line).
    RULE_DOCS.forEach(async (d) => {
      try {
        const md = await fetchDoc(d.id);
        const line = md.split('\n').find((l) => l.startsWith('> '));
        const target = el.querySelector(`[data-blurb="${d.id}"]`);
        if (target && line) target.textContent = line.replace(/^>\s*/, '').replace(/\*\*/g, '');
      } catch { /* ignore */ }
    });
    return;
  }

  const meta = RULE_DOCS.find((d) => d.id === docId);
  if (!meta) { el.innerHTML = '<p>Unknown rules document.</p>'; return; }

  // Same doc already on screen? Just scroll.
  const existing = el.querySelector(`.rules-main[data-doc="${docId}"]`);
  if (existing) { scrollTo(el, anchor); return; }

  el.innerHTML = `<div class="rules-layout">${sidebar(docId, null)}<article class="rules-main" data-doc="${docId}"><p class="muted">Loading…</p></article></div>`;
  try {
    const doc = await getDoc(docId);
    el.innerHTML = `<div class="rules-layout">
      ${sidebar(docId, doc.toc)}
      <article class="rules-main" data-doc="${docId}">
        <div id="rules-results" class="md" hidden></div>
        <div id="rules-body" class="md">${doc.html}</div>
      </article>
    </div>`;
    bindSidebar(el);
    scrollTo(el, anchor);
  } catch (e) {
    el.querySelector('.rules-main').innerHTML = `<div class="callout bad"><b>Couldn't load the rules.</b><p>${esc(e.message)}</p>
      <p class="muted">If you opened index.html straight from disk, serve the folder instead, e.g. <code>python3 -m http.server</code>, then open <code>http://localhost:8000</code>.</p></div>`;
  }
}

function scrollTo(el, anchor) {
  el.querySelectorAll('.toc a').forEach((a) => a.classList.toggle('active', !!anchor && a.getAttribute('href').endsWith(`/${anchor}`)));
  if (!anchor) { window.scrollTo(0, 0); return; }
  const target = el.querySelector(`#h-${CSS.escape(anchor)}`)
    || Array.from(el.querySelectorAll('[data-anchor]')).find((h) => h.dataset.anchor.startsWith(anchor));
  if (target) {
    // Open any <details> the heading sits in.
    target.closest('details')?.setAttribute('open', '');
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    target.classList.add('flash');
    setTimeout(() => target.classList.remove('flash'), 1600);
  }
}
