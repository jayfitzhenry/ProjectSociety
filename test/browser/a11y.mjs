// Accessibility check: walks the app on a phone-sized screen as a visitor, a DM and two players,
// and runs axe-core (WCAG 2.0, 2.1 and 2.2, levels A and AA) on every screen, in both themes.
// Exits 1 if axe finds anything.
//
//   cd test/browser && npm install && npm test
//
// Needs Chrome or Chromium. Set CHROME to its path if it isn't /usr/bin/chromium.
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';
import { startServer } from './server.mjs';

const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');
const PORT = Number(process.env.PORT || 8799);
const B = `http://localhost:${PORT}`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const THEMES = ['dark', 'light'];

const server = await startServer(PORT);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = []; // { screen, theme, id, impact, help, nodes }
const errors = []; // page errors and failed API calls: the walk itself went wrong
let screens = 0;

async function newUser(name) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  p.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400) errors.push(`${name}: ${r.request().method()} ${r.url()} ${r.status()}`);
  });
  if (name !== 'visitor') await p.goto(`${B}/login?as=${name}`);
  await p.goto(`${B}/#/rules`);
  await wait(800);
  return p;
}

const go = async (p, hash) => { await p.goto(`${B}/${hash}`); await wait(900); };
const tap = async (p, sel) => { await p.$eval(sel, (e) => e.scrollIntoView({ block: 'center' })); await p.click(sel); await wait(400); };

async function setTheme(p, theme) {
  await p.evaluate((t) => {
    const k = 'project-society:settings';
    const s = JSON.parse(localStorage.getItem(k) || '{}');
    localStorage.setItem(k, JSON.stringify({ ...s, theme: t }));
    document.documentElement.dataset.theme = t;
  }, theme);
}

/** Run axe on what's on screen now, in each theme. Opens every collapsed section first. */
async function scan(p, screen, { openAll = true } = {}) {
  if (openAll) await p.$$eval('details:not([open])', (els) => els.forEach((d) => { d.open = true; }));
  for (const theme of THEMES) {
    await setTheme(p, theme);
    await wait(150);
    if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ path: AXE });
    const res = await p.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
    screens += 1;
    for (const v of res.violations) {
      problems.push({ screen, theme, id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary.split('\n').slice(1).join(' ').trim()}`) });
    }
  }
  await setTheme(p, 'dark');
}

// ---------- a visitor ----------
const visitor = await newUser('visitor');
await scan(visitor, 'Rules: contents');
for (const doc of ['quick_start', 'dice_modifiers', 'dice_system', 'actions', 'equipment', 'world_history']) {
  await go(visitor, `#/rules/${doc}`);
  await scan(visitor, `Rules: ${doc}`);
}
await go(visitor, '#/rules/dice_system');
await tap(visitor, '#rules-body .term');
await scan(visitor, 'Term sheet (peek)', { openAll: false });
await visitor.keyboard.press('Escape');
await go(visitor, '#/search/shaken');
await scan(visitor, 'Search');
await go(visitor, '#/signin');
await scan(visitor, 'Sign in');
await go(visitor, '#/account');
await scan(visitor, 'Settings, signed out');

// ---------- the DM ----------
const dm = await newUser('alice');
await go(dm, '#/sheet');
await scan(dm, 'First visit');
await tap(dm, '[data-act="new"]');
await dm.type('[data-f="name"]', 'Dace');
await tap(dm, '[data-bg="Foundry Hand"]');
await tap(dm, '[data-bgtrait="Craftsperson"]');
await tap(dm, '[data-bgtrait="Mechanic"]');
await tap(dm, '[data-ptrait="Medic"]');
await dm.type('[data-f="dependsOn"]', 'Old Merren');
await scan(dm, 'Character creation');
await tap(dm, '[data-act="finish"]');
await wait(600);
await scan(dm, 'Character sheet');
await go(dm, '#/characters');
await scan(dm, 'Characters');
await go(dm, '#/c');
await scan(dm, 'Campaigns: none yet');
await dm.type('#cname', 'Ward 9');
await tap(dm, '#create-form button');
await wait(1200);
const code = await dm.$eval('.join-code', (e) => e.textContent.trim());

// ---------- two players join ----------
for (const name of ['bob', 'carol']) {
  const p = await newUser(name);
  await go(p, '#/c');
  await p.type('#code', code);
  await tap(p, '#join-form button');
  await wait(1200);
  if (name === 'carol') await scan(p, 'Campaign, just joined');
  await p.close();
}

// ---------- the DM writes material ----------
await go(dm, '#/c');
const cid = await dm.evaluate(() => location.hash.split('/')[2]);
await go(dm, `#/c/${cid}/people`);
await scan(dm, 'People (DM)');
await go(dm, `#/c/${cid}/material`);
await scan(dm, 'Material: empty (DM)');
await tap(dm, '[data-act="new"]');
await wait(800);
await dm.type('#seg-title', 'Session 1: the pump house');
await dm.type('[data-i="0"] [data-sf="body"]', 'The foreman works for Antioch.');
await tap(dm, '[data-addsec="players"]');
await dm.type('[data-i="1"] [data-sf="body"]', 'Steam hangs over the **pump house**.');
await tap(dm, '[data-addsec="dm"]');
await tap(dm, '[data-i="2"] [data-aud="some"]');
await tap(dm, '[data-i="2"] [data-to="carol"]');
await dm.type('[data-i="2"] [data-sf="body"]', 'Your sister is alive.');
await wait(1500);
await tap(dm, '[data-act="share"]');
await wait(800);
await scan(dm, 'Segment editor (DM)');
await tap(dm, '[data-act="preview"]');
await scan(dm, 'Segment preview (DM)');
await go(dm, `#/c/${cid}/material`);
await scan(dm, 'Material list (DM)');
await go(dm, `#/c/${cid}/crew`);
await scan(dm, 'Crew sheet (DM)');
await go(dm, `#/c/${cid}/notes`);
await scan(dm, 'Notes');
await go(dm, '#/account');
await scan(dm, 'Settings, signed in');

// ---------- a player reads it ----------
const carol = await newUser('carol');
await go(carol, `#/c/${cid}/material`);
await scan(carol, 'Material list (player)');
await tap(carol, '.rows a');
await wait(600);
await scan(carol, 'Segment (player, with a section just for them)');
await go(carol, `#/c/${cid}/crew`);
await scan(carol, 'Crew sheet (player)');

await browser.close();
server.close();

// ---------- report ----------
const out = [`axe-core: ${screens} scans (${screens / THEMES.length} screens × ${THEMES.length} themes), tags ${TAGS.join(', ')}`];
if (errors.length) out.push('', 'The walk itself hit errors:', ...errors.map((e) => `  ${e}`));
if (!problems.length) out.push('', 'No accessibility violations found.');
for (const v of problems) {
  out.push('', `✗ [${v.impact}] ${v.id} on "${v.screen}" (${v.theme}): ${v.help}`, ...v.nodes.slice(0, 5).map((n) => `    ${n}`));
  if (v.nodes.length > 5) out.push(`    …and ${v.nodes.length - 5} more`);
}
console.log(out.join('\n'));
process.exit(problems.length || errors.length ? 1 : 0);
