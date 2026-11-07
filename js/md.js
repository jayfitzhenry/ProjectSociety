// Markdown written by people (campaign material, notes), rendered safely.
// marked doesn't sanitize, and a DM's material is shown in players' browsers, so everything goes through DOMPurify.
// The trusted rules .md files are rendered by rules.js directly.

export function renderMarkdown(src) {
  const html = window.marked.parse(String(src ?? ''), { gfm: true, breaks: true });
  return window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input', 'button'] });
}

// Links in user markdown open in a new tab and can't reach back into the app.
if (window.DOMPurify) {
  window.DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && /^https?:/i.test(node.getAttribute('href') || '')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}
