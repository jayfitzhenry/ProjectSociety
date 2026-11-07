// HTML to markdown, for the rich editor in campaign material. It reads the editor's own content and
// anything pasted into it (an AI chat, a document, a web page). Only what renderMarkdown draws back is
// kept: headings, paragraphs, bold, italic, strikethrough, code, links, images, lists, quotes, rules and
// tables. Anything else keeps its text and loses its formatting. Callers sanitize pasted HTML first.

const BLOCK = new Set(['ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DETAILS', 'DIV', 'DL', 'DT', 'FIGCAPTION', 'FIGURE',
  'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'SUMMARY',
  'TABLE', 'UL']);
const isBlock = (n) => n.nodeType === 1 && BLOCK.has(n.tagName);
const BLOCK_SEL = [...BLOCK].join(',');
/** An inline element holding blocks (Google Docs wraps a whole paste in one b): read it as a container. */
const holdsBlocks = (n) => n.nodeType === 1 && !isBlock(n) && n.querySelector(BLOCK_SEL);
const url = (u) => u.replace(/[()\s]/g, (c) => ({ '(': '%28', ')': '%29' }[c] || '%20'));
const SAFE_URL = /^(https?:|mailto:)/i;

/** Escape characters that would otherwise turn plain text into formatting. */
const escapeText = (t) => t.replace(/([\\`*_[\]<~|])/g, '\\$1');

/** Tidy one block's lines, and escape line starts that markdown would read as a list, heading or quote. */
function tidy(s) {
  return s.split('\n').map((l) => l.trim()
    .replace(/^([#>+-])(?=\s|$)/, '\\$1')
    .replace(/^(\d+)([.)])(?=\s|$)/, '$1\\$2')
    .replace(/^([=-]{2,})$/, '\\$1'))
    .join('\n').replace(/^\n+|\n+$/g, '');
}

/** Put a marker round text, keeping the edge spaces outside (markdown ignores "** bold **"). */
function wrap(marker, inner) {
  const [, lead, core, trail] = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return core ? `${lead}${marker}${core}${marker}${trail}` : inner;
}

const kids = (n) => [...n.childNodes].map(inline).join('');

/** Bold or italic set by style (Google Docs, Word). Google Docs wraps everything in a b of normal weight. */
function styled(n, text) {
  const st = n.style || {};
  const w = st.fontWeight;
  let out = text;
  if (w === 'bold' || Number(w) >= 600) out = wrap('**', out);
  if (st.fontStyle === 'italic') out = wrap('*', out);
  return out;
}

function inline(n) {
  if (n.nodeType === 3) return escapeText(n.nodeValue.replace(/\s+/g, ' '));
  if (n.nodeType !== 1) return '';
  if (isBlock(n)) return `\n${block(n, '\n')}\n`;
  switch (n.tagName) {
    case 'BR': return '\n';
    case 'B': case 'STRONG': {
      const w = n.style?.fontWeight;
      return w === 'normal' || (w && Number(w) < 600) ? kids(n) : wrap('**', kids(n));
    }
    case 'EM': case 'I': case 'CITE': return wrap('*', kids(n));
    case 'DEL': case 'S': case 'STRIKE': return wrap('~~', kids(n));
    case 'CODE': case 'KBD': case 'SAMP': {
      const t = n.textContent.replace(/\s+/g, ' ');
      if (!t.trim()) return t;
      const ticks = '`'.repeat(Math.max(0, ...(t.match(/`+/g) || []).map((m) => m.length)) + 1);
      return t.includes('`') ? `${ticks} ${t} ${ticks}` : `\`${t}\``;
    }
    case 'A': {
      const text = kids(n);
      const href = n.getAttribute('href') || '';
      return SAFE_URL.test(href) && text.trim() ? `[${text.trim()}](${url(href)})` : text;
    }
    case 'IMG': {
      const src = n.getAttribute('src') || '';
      return /^https?:/i.test(src) ? `![${escapeText(n.getAttribute('alt') || '')}](${url(src)})` : '';
    }
    case 'SPAN': case 'FONT': return styled(n, kids(n));
    case 'SCRIPT': case 'STYLE': case 'TEMPLATE': return '';
    default: return kids(n);
  }
}

/** A container's children as blocks: runs of inline content become paragraphs. */
function blocks(parent, sep = '\n\n') {
  const out = [];
  let run = '';
  const flush = () => { const t = tidy(run); if (t) out.push(t); run = ''; };
  for (const n of parent.childNodes) {
    if (isBlock(n)) { flush(); const b = block(n, sep); if (b) out.push(b); } else if (holdsBlocks(n)) {
      flush(); const b = blocks(n, sep); if (b) out.push(b);
    } else run += inline(n);
  }
  flush();
  return out.join(sep);
}

function list(n) {
  const ordered = n.tagName === 'OL';
  let k = Number(n.getAttribute('start')) || 1;
  const out = [];
  for (const c of n.childNodes) {
    if (c.nodeType === 1 && (c.tagName === 'UL' || c.tagName === 'OL')) {
      // A list straight inside a list (Google Docs does this) belongs to the item before it.
      const sub = list(c).replace(/^/gm, '   ');
      if (out.length) out[out.length - 1] += `\n${sub}`; else out.push(sub);
      continue;
    }
    if (c.nodeType !== 1 && !c.nodeValue?.trim()) continue;
    const marker = ordered ? `${k++}. ` : '- ';
    const body = c.nodeType === 1 && c.tagName === 'LI' ? blocks(c, '\n') : tidy(inline(c));
    out.push(marker + body.replace(/\n/g, `\n${' '.repeat(marker.length)}`));
  }
  return out.join('\n');
}

function table(n) {
  const rows = [...n.querySelectorAll('tr')].filter((r) => r.closest('table') === n)
    .map((r) => [...r.children].filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
      .map((c) => blocks(c, ' ').replace(/\n/g, ' ').trim()));
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const line = (r) => `| ${Array.from({ length: width }, (_, i) => r[i] || '').join(' | ')} |`;
  return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join('\n');
}

function block(n, sep) {
  switch (n.tagName) {
    case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6': {
      const t = tidy(kids(n)).replace(/\n/g, ' ').replace(/^\\(?=[#>+-])/, '');
      return t ? `${'#'.repeat(Number(n.tagName[1]))} ${t}` : '';
    }
    case 'HR': return '---';
    case 'UL': case 'OL': return list(n);
    case 'TABLE': return table(n);
    case 'PRE': {
      const t = n.textContent.replace(/\n$/, '');
      const fence = '`'.repeat(Math.max(3, ...(t.match(/`{3,}/g) || []).map((m) => m.length + 1)));
      return `${fence}\n${t}\n${fence}`;
    }
    case 'BLOCKQUOTE': {
      const t = blocks(n);
      return t ? t.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n') : '';
    }
    default: return blocks(n, sep);
  }
}

/** Markdown for a node's contents (an element or a fragment). */
export function htmlToMarkdown(root) {
  return blocks(root).replace(/\n{3,}/g, '\n\n').trim();
}
