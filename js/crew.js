// Crew sheet: Community, the Pot, Exposure, Trust, jobs, Homecoming, raids and downtime.
import {
  PROJECTS, JOBS, EXPOSURE_EVENTS, TRUST_EVENTS, FAVOURS, HARDSHIP_EVENTS, MAX_COMMUNITY, HOMECOMING_STEPS,
  communityBand, exposureBand, trustBand, communityCost,
} from './data.js';
import {
  state, save, esc, toast, log, clamp, community, needPerJob, crewLevel, charLevel, hasContact,
  replaceState, resetAll, marketOpen,
} from './store.js';
import { roll, rollD6, renderRoll, netOf, distribution, pct, signed, poolLabel } from './dice.js';

const ui = { hardship: null, hardshipEvent: null, raidCheck: null, raidTest: null, onJob: null };

const crew = () => state.crew;
const alive = () => state.characters.filter((c) => c.created && !c.dead);

function favoursAvailable() {
  const c = crew();
  if (c.exposure >= 10) return 0;
  let n = trustBand(c.trust).favours;
  if (c.exposure >= 7) n -= 1;
  return Math.max(0, n);
}

function setExposure(next, reason) {
  const c = crew();
  let n = clamp(next, 0, 10);
  if (n >= 10 && c.exposure < 10 && c.projects.safehouse >= 3 && !c.safehouseUsed) {
    if (confirm('Exposure would reach 10. Use Safehouse III (once per campaign) to set it to 8 instead?')) {
      c.safehouseUsed = true;
      n = 8;
      log('🏚️ Safehouse III: the crew disappears for a while. Exposure set to 8.');
    }
  }
  const delta = n - c.exposure;
  if (delta === 0) return;
  if (c.job) c.job.exposure = Math.max(0, c.job.exposure + delta);
  if (n >= 10 && c.exposure < 10) {
    c.trust = clamp(c.trust - 2, 0, 10);
    log('🔴 BURNED. Antioch cuts the crew loose. Trust −2.');
    toast('🔴 Burned! Trust −2');
  }
  c.exposure = n;
  log(`👁️ Exposure ${signed(delta)} → ${n}${reason ? ` (${reason})` : ''}`);
}

function setTrust(next, reason) {
  const c = crew();
  const n = clamp(next, 0, 10);
  const delta = n - c.trust;
  if (!delta) return;
  c.trust = n;
  log(`🤝 Trust ${signed(delta)} → ${n}${reason ? ` (${reason})` : ''}`);
}

/** Set the Need due at this Homecoming. Debt doubles it once, then it's paid off. */
function setNeedDue() {
  const c = crew();
  c.needDue = needPerJob();
  c.needPaid = 0;
  if (c.debt) { c.debt = false; log(`💰 Debt: this Homecoming's Need is doubled (${c.needDue}c).`); }
}

function meter(value, max, kind) {
  return `<div class="meter m-${kind}">${Array.from({ length: max + 1 }, (_, i) => `<button type="button" class="pip ${i <= value ? 'on' : ''} ${i === value ? 'cur' : ''}" data-meter="${kind}" data-v="${i}" title="${i}">${i}</button>`).join('')}</div>`;
}

// ---------- sections ----------
function tracks() {
  const c = crew();
  const com = community();
  const band = communityBand(com);
  const eb = exposureBand(c.exposure);
  const tb = trustBand(c.trust);
  const next = com + 1;
  return `<div class="track-grid">
    <section class="card track">
      <h3>🏠 Community <b class="big-num">${com}</b><span class="muted">/10</span></h3>
      <div class="band">${band.icon} <b>${band.name}</b> · Need <b>${needPerJob()}c</b>${c.debt ? ' <span class="tag neg">doubled: Debt</span>' : ''}</div>
      <p class="muted small">${band.text}</p>
      <div class="pot">🏺 Pot <b>${c.pot}c</b>${com < MAX_COMMUNITY ? ` <span class="muted small">· next point costs ${communityCost(next)}c</span>` : ''}
        <span class="inline-step"><input type="number" id="pot-amt" value="10" min="1" class="num-input" aria-label="amount">
        <button type="button" class="tiny" data-pot="-1">−</button><button type="button" class="tiny" data-pot="1">+</button></span></div>
      ${com < MAX_COMMUNITY && c.pot >= communityCost(next) ? '<div class="callout good small">🏗️ The Pot can build a tier. Click the next tier of any project below.</div>' : ''}
      <label class="check small"><input type="checkbox" data-flag="waterCut" ${c.waterCut ? 'checked' : ''}> 💧 Water is cut</label>
    </section>
    <section class="card track">
      <h3>🔦 Exposure <b class="big-num">${c.exposure}</b><span class="muted">/10</span></h3>
      ${meter(c.exposure, 10, 'exposure')}
      <div class="band">${eb.icon} <b>${eb.name}</b></div>
      <p class="muted small">${eb.text}</p>
    </section>
    <section class="card track">
      <h3>🤝 Trust <b class="big-num">${c.trust}</b><span class="muted">/10</span></h3>
      ${meter(c.trust, 10, 'trust')}
      <div class="band">${tb.icon} <b>${tb.name}</b> · <b>${favoursAvailable()}</b> favour${favoursAvailable() === 1 ? '' : 's'} per job</div>
      <p class="muted small">${tb.text}</p>
      ${c.trust >= 9 ? `<label class="check small"><input type="checkbox" data-flag="confidantUsed" ${c.confidantUsed ? 'checked' : ''}> 🗝️ Confidant blame used (−3 Exposure)</label>
        ${c.confidantUsed ? '' : '<button type="button" class="tiny" data-act="confidant">Use it now: −3 Exposure</button>'}` : ''}
    </section>
  </div>`;
}

function projects() {
  const c = crew();
  const com = community();
  const cost = communityCost(com + 1);
  const starting = com === 2 && !c.log.length;
  return `<section class="card">
    <h3>🧱 Projects <span class="muted small">Community = tiers built (max 10). Build I → II → III. Lost tiers are always the top one.</span></h3>
    ${starting ? '<div class="callout">🆕 New campaign: the district starts with Clinic I and Hall I. <b>Pick one more starting tier</b> (free).</div>' : ''}
    <div class="projects">
      ${PROJECTS.map((p) => `<div class="project">
        <div class="p-name">${p.icon} <b>${p.name}</b></div>
        ${p.tiers.map((t, i) => {
          const tier = i + 1;
          const built = c.projects[p.id] >= tier;
          const isNext = c.projects[p.id] === i;
          const isTop = c.projects[p.id] === tier;
          const can = isNext && com < MAX_COMMUNITY;
          return `<button type="button" class="tier ${built ? 'built' : ''} ${can ? 'next' : ''} ${isTop ? 'top' : ''}" data-tier="${p.id}" data-n="${tier}" ${!built && !can ? 'disabled' : ''}
            title="${built ? (isTop ? 'Click to lose this tier' : 'Built') : can ? (starting ? 'Free starting tier' : `Build for ${cost}c from the Pot`) : 'Build the tier before first'}">
            <span class="roman">${'I'.repeat(tier)}</span><small>${esc(t)}</small></button>`;
        }).join('')}
      </div>`).join('')}
    </div>
  </section>`;
}

function jobCard() {
  const c = crew();
  if (c.exposure >= 10) {
    return `<section class="card"><h3>💼 Jobs</h3><div class="callout bad">🔴 <b>Burned.</b> No jobs from the handler. ${c.trust >= 5
      ? 'Trust is 5+: the handler offers a <b>penance job</b> (Dangerous, unpaid). Success sets Exposure to 6 and brings back the water and jobs.<div class="actions"><button type="button" class="btn" data-act="penance">✅ Penance job succeeded</button></div>'
      : 'Trust is below 5. The crew is on its own. A rival house may make an offer.'}</div></section>`;
  }
  if (!c.job) {
    return `<section class="card">
      <h3>💼 Job</h3>
      <p class="muted">Start a job to track Exposure as it happens. Favours this job: <b>${favoursAvailable()}</b>.</p>
      <div class="job-types">${Object.entries(JOBS).map(([k, j]) => `<button type="button" class="job-btn" data-startjob="${k}">
        <b>${j.icon} ${j.name}</b><span>${j.pay}c · ${j.marks} Mark${j.marks > 1 ? 's' : ''}</span><small class="muted">${j.examples}</small></button>`).join('')}</div>
      <p class="muted small">Or <button type="button" class="linklike" data-act="lielow">🫥 lie low</button> instead: −${c.projects.safehouse >= 2 ? 3 : 2} Exposure, no pay, the Need is still due.</p>
    </section>`;
  }
  const j = JOBS[c.job.type];
  const clean = c.job.exposure <= 1;
  const on = ui.onJob || new Set(alive().map((x) => x.id));
  ui.onJob = on;
  return `<section class="card job-live">
    <h3>💼 On the job: ${j.icon} ${j.name} <span class="muted small">${j.pay}c · ${j.marks} Marks</span></h3>
    <div class="job-status">Exposure gained: <b>${c.job.exposure}</b> ${clean ? '<span class="tag pos">✨ still clean</span>' : '<span class="tag neg">not clean</span>'} · Favours: <b>${favoursAvailable()}</b></div>
    <div class="chips">${EXPOSURE_EVENTS.map((ev, i) => `<button type="button" class="chip neg" data-expev="${i}">${ev.icon} ${ev.text} <b>+${ev.n}</b></button>`).join('')}</div>
    <details class="small-details"><summary>🎁 Favours</summary><ul class="favours">${FAVOURS.map((f) => `<li>${f.icon} <b>${f.name}</b>: ${f.text}</li>`).join('')}</ul></details>
    ${alive().length ? `<div class="field"><span>Who's on the job (they earn Marks)</span><div class="chips">${alive().map((x) => `<button type="button" class="chip ${on.has(x.id) ? 'on' : ''}" data-onjob="${x.id}">${esc(x.name)}</button>`).join('')}</div></div>` : ''}
    <div class="actions">
      <button type="button" class="btn primary" data-endjob="success">✅ Objective completed</button>
      <button type="button" class="btn danger" data-endjob="fail">❌ Objective failed</button>
      <button type="button" class="btn ghost" data-act="canceljob">Cancel job</button>
    </div>
  </section>`;
}

function endJob(outcome) {
  const c = crew();
  const j = JOBS[c.job.type];
  const clean = c.job.exposure <= 1;
  const hot = c.exposure >= 7 && c.exposure < 10;
  let pay = outcome === 'success' ? j.pay : Math.floor(j.pay / 2);
  const parts = [`${j.icon} ${j.name} ${outcome === 'success' ? '✅' : '❌ half pay'} ${pay}c`];
  if (clean) { pay += 10; parts.push('✨ clean +10c'); }
  if (hot) { pay -= 10; parts.push('🟠 Hot −10c'); }
  pay = Math.max(0, pay);
  const marks = outcome === 'success' ? j.marks + (clean ? 1 : 0) : 1;
  const team = alive().filter((x) => ui.onJob?.has(x.id));
  const levelled = [];
  team.forEach((x) => {
    const before = charLevel(x);
    x.marks += marks;
    if (charLevel(x) > before) levelled.push(`${x.name} → L${charLevel(x)}`);
  });
  if (outcome === 'success') setTrust(c.trust + 1, 'objective completed');
  else setTrust(c.trust - 1, 'objective failed');
  if (clean) setTrust(c.trust + 1, 'clean job');
  c.purse += pay;
  setNeedDue();
  c.job = null;
  ui.onJob = null;
  log(`💼 Job done: ${parts.join(', ')} = ${pay}c. ${marks} Mark${marks > 1 ? 's' : ''} each${team.length ? ` (${team.map((x) => x.name).join(', ')})` : ''}.`);
  if (levelled.length) log(`📈 Level up in downtime: ${levelled.join(', ')}`);
  toast(`💼 ${pay}c brought home · ${marks} Marks each${levelled.length ? ` · 📈 ${levelled.join(', ')}` : ''}`);
}

function hardshipMods() {
  const c = crew();
  const mods = [];
  if (c.needPaid >= c.needDue / 2 && c.needPaid > 0) mods.push(['🪙 Paid at least half the Need', 1]);
  if (c.needPaid === 0) mods.push(['🚫 Paid nothing', -1]);
  if (c.helpAtHome) mods.push(['🏠 Help at Home', 1]);
  if (c.projects.hall >= 1) mods.push(['📚 Hall I+', 1]);
  if (hasContact('Gang Elder')) mods.push(['🧓 Gang Elder contact', 1]);
  return mods;
}

function raidReasons() {
  const c = crew();
  const r = [];
  if (c.exposure >= 4) r.push('Exposure 4+');
  if (community() >= 7) r.push('Community 7+');
  if (c.forceRaid) r.push('Families leave event');
  return r;
}

function raidTestMods() {
  const c = crew();
  const mods = [];
  if (c.projects.watch) mods.push([`👁️ Watch ${'I'.repeat(c.projects.watch)}`, c.projects.watch]);
  if (c.helpAtHome) mods.push(['🏠 Help at Home', 1]);
  if (c.exposure >= 7) mods.push(['🔥 Exposure Hot', -1]);
  return mods;
}

function modsNet(mods) {
  const plus = mods.filter(([, n]) => n > 0).reduce((s, [, n]) => s + n, 0);
  const minus = mods.filter(([, n]) => n < 0).reduce((s, [, n]) => s - n, 0);
  return netOf(plus, minus);
}

function modsTable(mods) {
  const net = modsNet(mods);
  return `<table class="mini"><tbody>${mods.map(([l, n]) => `<tr><td>${l}</td><td class="${n > 0 ? 'pos' : 'neg'}">${signed(n)}</td></tr>`).join('') || '<tr><td class="muted">No modifiers</td><td>0</td></tr>'}
    <tr class="tot"><td>Net · ${poolLabel(net)}</td><td>${signed(net)} · ${pct(distribution(net).pass)}</td></tr></tbody></table>`;
}

function homecoming() {
  const c = crew();
  const com = community();
  const due = c.needDue;
  const short = Math.max(0, due - c.needPaid);
  const active = c.purse > 0 || due > 0 || ui.hardship || ui.raidCheck;
  const reasons = raidReasons();
  const cisternCovers = c.projects.cistern >= 3 || (c.projects.cistern === 2 && c.cisternUsed < 3) || (c.projects.cistern === 1 && c.cisternUsed < 1);
  if (!active) {
    return `<section class="card"><h3>🪙 Homecoming</h3><p class="muted">After a job, the pay comes here and you work through seven steps:</p>
      <div class="chips">${HOMECOMING_STEPS.map((x, i) => `<span class="chip static"><b>${i + 1}</b> ${x}</span>`).join('')}</div>
      <p class="muted small">Finish a job, lie low, or <button type="button" class="linklike" data-act="manualpay">bring pay home by hand</button>.</p></section>`;
  }
  const team = alive();
  const cost = communityCost(com + 1);
  return `<section class="card homecoming">
    <h3>🪙 Homecoming <span class="muted small">Pay brought home: <b>${c.purse}c</b></span></h3>
    <p class="muted small">Work down the list. Losses come before building, so you can see what needs rebuilding.</p>
    <ol class="steps">
      <li class="${c.needPaid >= due ? 'done' : ''}">
        <b>💧 Pay the Need</b> <span class="muted small">from the pay, then the Pot</span> ${com === 0 ? '<span class="muted">Collapsed: there\'s no Need.</span>' : `<span>${c.needPaid}/${due}c paid</span>
        ${short > 0 ? `<div class="actions small">
          <button type="button" class="btn small" data-payneed="${short}">Pay ${short}c${c.purse < short ? ' (rest from the Pot)' : ''}</button>
          ${Math.ceil(due / 2) - c.needPaid > 0 && Math.ceil(due / 2) < due ? `<button type="button" class="btn small" data-payneed="${Math.ceil(due / 2) - c.needPaid}">Pay half (${Math.ceil(due / 2) - c.needPaid}c)</button>` : ''}
          <button type="button" class="btn small ghost" data-act="skipneed">Don't pay (Hardship test)</button></div>` : ' ✅'}`}
      </li>
      ${c.hardshipDue || ui.hardship ? `<li><b>🎲 Hardship test</b>: the Need wasn't met.
        ${ui.hardship ? ui.hardship : `${modsTable(hardshipMods())}
        <div class="actions small"><button type="button" class="btn small primary" data-act="hardship">🎲 Roll Hardship</button></div>`}
      </li>` : ''}
      <li>
        <b>🛡️ Raid check</b> ${c.skipRaid ? '<span class="muted">Skipped this time (the district drove the last raiders off).</span>' : reasons.length ? `<span class="tag neg">due: ${reasons.join(', ')}</span>` : '<span class="muted">Not due.</span>'}
        ${!c.skipRaid && reasons.length ? `<div class="actions small"><button type="button" class="btn small" data-act="raidcheck">🎲 Raid check${c.exposure >= 7 ? ' (+1 dice, Hot)' : ''}</button></div>` : ''}
        ${ui.raidCheck || ''}
      </li>
      ${c.waterCut ? `<li><b>💧 Water cut</b> ${cisternCovers ? `<span class="tag pos">Cistern covers it</span>${c.projects.cistern < 3 ? ' <button type="button" class="tiny" data-act="cisternuse">Mark Homecoming used</button>' : ''}` : '<span class="tag neg">−1 Community</span> <span class="muted small">The crew chooses: tap the top tier of a project.</span>'}</li>` : ''}
      <li>
        <b>🏺 Fill the Pot</b>
        <div class="form-row"><input type="number" id="to-pot" min="0" max="${c.purse}" value="0" class="num-input"> <button type="button" class="btn small" data-act="topot">Send to the Pot</button>
        <span class="muted small">Pot: ${c.pot}c${com < MAX_COMMUNITY ? ` / ${communityCost(com + 1)}c for Community ${com + 1}` : ''}</span></div>
      </li>
      <li class="${com < MAX_COMMUNITY && c.pot >= cost ? '' : 'done'}">
        <b>🏗️ Build</b> ${com >= MAX_COMMUNITY ? '<span class="muted small">Community is 10. Nothing left to build.</span>'
          : c.pot >= cost ? `<span class="tag pos">The Pot can pay ${cost}c</span> <span class="muted small">Tap the next tier of any project above.</span>`
            : `<span class="muted small">Next tier costs ${cost}c. ${cost - c.pot}c more needed.</span>`}
      </li>
      <li>
        <b>💰 Split the rest</b> ${team.length ? `<span class="muted small">${c.purse}c between ${team.length}: ${Math.floor(c.purse / team.length)}c each, ${c.purse % team.length}c left over goes to the Pot</span>
        <div class="actions small"><button type="button" class="btn small primary" data-act="split" ${c.purse ? '' : 'disabled'}>Split equally</button></div>` : '<span class="muted">No characters yet.</span>'}
      </li>
    </ol>
    <div class="actions"><button type="button" class="btn" data-act="endhome">✅ Homecoming done → downtime</button></div>
  </section>`;
}

function downtime() {
  const c = crew();
  const clinic = c.projects.clinic;
  const com = community();
  const recovery = com === 0 ? '1' : clinic >= 2 ? 'all' : clinic === 1 ? '2' : '1';
  return `<section class="card">
    <h3>🏠 Downtime</h3>
    <ol class="steps">
      <li><b>🩹 Recovery</b>: every character removes <b>${recovery}</b> wound${recovery === '1' ? '' : 's'}.
        <button type="button" class="btn small" data-act="recovery">Apply to everyone</button></li>
      <li><b>🧑‍🔧 Downtime actions</b>, one each:
        <div class="actions small">
          <button type="button" class="btn small" data-act="keepquiet">🤫 Keep Quiet (−${c.projects.safehouse >= 1 ? 2 : 1} Exposure)</button>
          <label class="check"><input type="checkbox" data-flag="helpAtHome" ${c.helpAtHome ? 'checked' : ''}> 🏠 Someone took Help at Home</label>
        </div>
        <p class="muted small">🛌 Recover: 2 more wounds · 🪙 Odd Jobs: 5c · 🔎 Seek Out: a Specialist item at double price. Do these on the character sheets.</p></li>
      <li><b>📈 Level up</b>: ${alive().map((x) => `${esc(x.name)} L${charLevel(x)}`).join(' · ') || '—'} <span class="muted small">(crew level ${crewLevel()})</span></li>
      <li><b>🛒 Shop</b>: ${['works', 'specialist', 'refined'].map((m) => `${{ works: '🔩 Works', specialist: '🧨 Specialist', refined: '✨ Refined' }[m]} ${marketOpen(m) ? '✅' : '🔒'}`).join(' · ')} <span class="muted small">(from each character sheet)</span></li>
      <li><b>👁️ Things go quiet</b>: −1 Exposure. <button type="button" class="btn small" data-act="quiet">Apply</button></li>
    </ol>
    <div class="actions small">
      <button type="button" class="btn small" data-act="cleaner">🧹 Cleaner (−1 Exposure, 20c)</button>
      <button type="button" class="btn small" data-act="cleanup">🎁 Clean-up favour (−1)</button>
    </div>
  </section>`;
}

function manual() {
  return `<section class="card">
    <h3>🧮 Adjust by hand</h3>
    <div class="two">
      <div><h4>🔦 Exposure</h4><div class="chips">${EXPOSURE_EVENTS.map((ev, i) => `<button type="button" class="chip neg small" data-expev="${i}">${ev.icon} ${ev.text} +${ev.n}</button>`).join('')}</div></div>
      <div><h4>🤝 Trust</h4><div class="chips">${TRUST_EVENTS.map((ev, i) => `<button type="button" class="chip ${ev.n > 0 ? 'pos' : 'neg'} small" data-trustev="${i}">${ev.icon} ${ev.text} ${signed(ev.n)}</button>`).join('')}</div></div>
    </div>
  </section>`;
}

function dataCard() {
  return `<section class="card" id="save-data">
    <h3>💾 Save data</h3>
    <p class="muted small">Everything is saved in this browser automatically. Export a file to back it up or move it to another device.</p>
    <div class="actions">
      <button type="button" class="btn" data-act="export">⬇️ Export</button>
      <label class="btn">⬆️ Import<input type="file" id="import-file" accept="application/json,.json" hidden></label>
      <button type="button" class="btn danger" data-act="reset">🗑️ Start a new campaign</button>
    </div>
  </section>`;
}

function logCard() {
  const l = crew().log;
  return `<section class="card">
    <h3>📜 Log</h3>
    ${l.length ? `<ol class="log">${l.slice(0, 60).map((e) => `<li><small class="muted">${new Date(e.t).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</small> ${esc(e.text)}</li>`).join('')}</ol>` : '<p class="muted">Nothing yet.</p>'}
  </section>`;
}

function view() {
  const c = crew();
  return `<div class="page crew">
    <div class="page-head">
      <h1>🏠 Crew</h1>
      <input class="crew-name" data-f="crewname" value="${esc(c.name)}" placeholder="Name the crew or district…">
    </div>
    ${tracks()}
    ${projects()}
    <div class="cols">${jobCard()}${homecoming()}</div>
    ${downtime()}
    ${manual()}
    <div class="cols">${logCard()}${dataCard()}</div>
  </div>`;
}

function loseTier(projectId) {
  const c = crew();
  const p = PROJECTS.find((x) => x.id === projectId);
  c.projects[projectId] -= 1;
  log(`📉 Lost ${p.icon} ${p.name} ${'I'.repeat(c.projects[projectId] + 1)}. Community ${community()}.`);
}

export function renderCrew(el) {
  const draw = () => { const y = window.scrollY; el.innerHTML = view(); window.scrollTo(0, y); };
  draw();
  const commit = () => { save(); draw(); };

  el.oninput = (e) => {
    if (e.target.dataset.f === 'crewname') { crew().name = e.target.value; save(); }
  };
  el.onchange = (e) => {
    const t = e.target;
    if (t.dataset.flag) {
      crew()[t.dataset.flag] = t.checked;
      if (t.dataset.flag === 'waterCut') {
        log(t.checked ? '🚱 Antioch cuts the water.' : '💧 The water is back.');
        if (!t.checked) crew().cisternUsed = 0; // the Cistern's count starts again with the next cut
      }
      commit();
      return;
    }
    if (t.id === 'import-file' && t.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data.crew || !Array.isArray(data.characters)) throw new Error('Not a Project Society save file');
          if (confirm('Replace everything in this browser with the imported file?')) { replaceState(data); toast('⬆️ Imported'); draw(); }
        } catch (err) { toast(`⚠️ ${esc(err.message)}`); }
      };
      reader.readAsText(t.files[0]);
    }
  };

  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    const c = crew();

    if (d.meter) {
      const v = Number(d.v);
      if (d.meter === 'exposure') setExposure(v === c.exposure ? v - 1 : v, 'by hand');
      else setTrust(v === c.trust ? v - 1 : v, 'by hand');
      commit();
      return;
    }
    if (d.pot) {
      const amt = Math.max(0, Number(el.querySelector('#pot-amt').value) || 0);
      c.pot = Math.max(0, c.pot + Number(d.pot) * amt);
      log(`🏺 Pot ${Number(d.pot) > 0 ? '+' : '−'}${amt}c → ${c.pot}c`);
      commit();
      return;
    }
    if (d.tier) {
      const p = PROJECTS.find((x) => x.id === d.tier);
      const n = Number(d.n);
      const com = community();
      if (c.projects[p.id] >= n) {
        if (c.projects[p.id] === n && confirm(`Lose ${p.name} ${'I'.repeat(n)}? (Community −1)`)) loseTier(p.id);
        commit();
        return;
      }
      if (com >= MAX_COMMUNITY) { toast('Community is at 10. No district can have everything.'); return; }
      const cost = communityCost(com + 1);
      const starting = com === 2 && !c.log.length;
      if (starting) {
        c.projects[p.id] = n;
        log(`🆕 Starting tier chosen: ${p.icon} ${p.name} I. Community 3.`);
      } else if (c.pot >= cost) {
        if (!confirm(`Build ${p.name} ${'I'.repeat(n)} for ${cost}c from the Pot?`)) return;
        c.pot -= cost;
        c.projects[p.id] = n;
        log(`🏗️ Built ${p.icon} ${p.name} ${'I'.repeat(n)} for ${cost}c. Community ${com + 1}.`);
        toast(`🏗️ ${p.name} ${'I'.repeat(n)} built`);
      } else {
        if (!confirm(`The Pot has ${c.pot}c of ${cost}c. Add ${p.name} ${'I'.repeat(n)} anyway (no payment)?`)) return;
        c.projects[p.id] = n;
        log(`✏️ Added ${p.icon} ${p.name} ${'I'.repeat(n)} by hand. Community ${com + 1}.`);
      }
      commit();
      return;
    }
    if (d.startjob) {
      c.job = { type: d.startjob, exposure: 0 };
      ui.onJob = null;
      log(`💼 Started a ${JOBS[d.startjob].name} job.`);
      commit();
      return;
    }
    if (d.onjob) {
      if (ui.onJob.has(d.onjob)) ui.onJob.delete(d.onjob); else ui.onJob.add(d.onjob);
      draw();
      return;
    }
    if (d.expev !== undefined) {
      const ev = EXPOSURE_EVENTS[Number(d.expev)];
      setExposure(c.exposure + ev.n, ev.text);
      commit();
      return;
    }
    if (d.trustev !== undefined) {
      const ev = TRUST_EVENTS[Number(d.trustev)];
      setTrust(c.trust + ev.n, ev.text);
      commit();
      return;
    }
    if (d.endjob) { endJob(d.endjob); ui.hardship = null; ui.raidCheck = null; c.hardshipDue = false; commit(); return; }
    if (d.payneed) {
      let amt = Number(d.payneed);
      const fromPurse = Math.min(c.purse, amt);
      c.purse -= fromPurse;
      amt -= fromPurse;
      const fromPot = Math.min(c.pot, amt);
      c.pot -= fromPot;
      const paid = fromPurse + fromPot;
      c.needPaid += paid;
      log(`💧 Paid ${paid}c of the Need${fromPot ? ` (${fromPot}c from the Pot)` : ''}. ${c.needPaid}/${c.needDue}c.`);
      c.hardshipDue = c.needPaid < c.needDue;
      commit();
      return;
    }

    switch (d.act) {
      case 'skipneed': c.hardshipDue = true; log(`💧 The Need wasn't met (${c.needPaid}/${c.needDue}c).`); commit(); break;
      case 'manualpay': {
        const v = Number(prompt('How many chips did the crew bring home?', '60'));
        if (v > 0) { c.purse += v; setNeedDue(); log(`🪙 ${v}c brought home.`); commit(); }
        break;
      }
      case 'hardship': {
        const mods = hardshipMods();
        const r = roll(modsNet(mods));
        let out = renderRoll(r, 'test', { animate: true });
        if (r.crit) { c.pot += 10; out += '<p class="callout good">💥 The community pulls together. Nothing is lost, and <b>10c</b> goes into the Pot.</p>'; log('🎲 Hardship: critical! +10c to the Pot.'); } else if (r.pass) { out += '<p class="callout good">✅ The community makes do. Nothing is lost.</p>'; log('🎲 Hardship: passed.'); } else {
          const ev = HARDSHIP_EVENTS[rollD6() - 1];
          out += `<p class="callout bad">❌ <b>−1 Community.</b> The crew chooses a tier to lose: click the top tier of a project.</p>
            <p class="callout">🎲 Event ${ev.roll}: ${ev.icon} <b>${ev.name}</b>. ${ev.text}</p>`;
          if (ev.roll === 2) c.forceRaid = true;
          if (ev.roll === 3) c.debt = true;
          if (ev.roll === 6) out += '<div class="actions small"><button type="button" class="btn small" data-act="pressurepay">Pay 15c (pay first, then the Pot)</button><span class="muted small">or lose one more tier</span></div>';
          log(`🎲 Hardship failed: −1 Community. Event ${ev.roll}: ${ev.name}.`);
        }
        c.hardshipDue = false;
        ui.hardship = out;
        commit();
        break;
      }
      case 'raidcheck': {
        const r = roll(c.exposure >= 7 ? 1 : 0);
        let out = `<div class="sub">Raid check</div>${renderRoll(r, 'test', { animate: true })}`;
        c.forceRaid = false;
        if (r.pass) {
          const mods = raidTestMods();
          out += `<p class="callout bad">🛡️ <b>The district is raided.</b> ${c.projects.watch >= 3 ? 'With Watch III the crew can defend in person instead (play the combat).' : ''}</p>${modsTable(mods)}
            <div class="actions small"><button type="button" class="btn small primary" data-act="raidtest">🎲 Raid test</button>
            <button type="button" class="btn small" data-act="raidwon">⚔️ Crew defended and won</button></div>`;
          log('🛡️ Raid check: the district is raided.');
        } else {
          out += '<p class="callout good">No raid this time.</p>';
          log('🛡️ Raid check: no raid.');
        }
        ui.raidCheck = out;
        commit();
        break;
      }
      case 'raidtest': {
        const r = roll(modsNet(raidTestMods()));
        const burned = c.exposure >= 10;
        let out = renderRoll(r, 'test', { animate: true });
        if (r.crit) { c.skipRaid = true; out += '<p class="callout good">💥 Driven off before Antioch arrives. Skip the next Raid check.</p>'; log('🛡️ Raid test: critical. Skip the next Raid check.'); } else if (r.pass) { out += '<p class="callout good">✅ Some damage, then Antioch\'s elite arrives, late as always. Nothing lost.</p>'; log('🛡️ Raid test: passed.'); } else {
          out += `<p class="callout bad">❌ <b>−${burned ? 2 : 1} Community.</b> The DM chooses which tier${burned ? 's' : ''}: click the top tier of a project.</p>`;
          log(`🛡️ Raid test failed: −${burned ? 2 : 1} Community.`);
        }
        ui.raidCheck = (ui.raidCheck || '').replace(/<div class="actions small"><button type="button" class="btn small primary" data-act="raidtest">[\s\S]*?<\/div>/, '') + `<div class="sub">Raid test</div>${out}`;
        commit();
        break;
      }
      case 'pressurepay': {
        const fromPurse = Math.min(c.purse, 15);
        const fromPot = Math.min(c.pot, 15 - fromPurse);
        if (fromPurse + fromPot < 15) { toast('Not enough in the pay and the Pot. Characters can chip in from their sheets, or lose a tier.'); break; }
        c.purse -= fromPurse; c.pot -= fromPot;
        log(`💧 Pressure drop: paid 15c${fromPot ? ` (${fromPot}c from the Pot)` : ''}.`);
        ui.hardship = (ui.hardship || '').replace(/<div class="actions small"><button type="button" class="btn small" data-act="pressurepay">[\s\S]*?<\/div>/, '<p class="callout good small">💧 Paid 15c. The pumps are running again.</p>');
        commit();
        break;
      }
      case 'raidwon': log('⚔️ The crew defended the district and won. Nothing lost.'); ui.raidCheck = '<p class="callout good">⚔️ The crew won on home ground. Nothing lost.</p>'; commit(); break;
      case 'cisternuse': c.cisternUsed += 1; log('💧 The Cistern covered a Homecoming without water.'); commit(); break;
      case 'topot': {
        const v = clamp(Number(el.querySelector('#to-pot').value) || 0, 0, c.purse);
        if (!v) break;
        c.purse -= v; c.pot += v;
        log(`🏺 Sent ${v}c home to the Pot → ${c.pot}c.`);
        commit();
        break;
      }
      case 'split': {
        const team = alive();
        if (!team.length || !c.purse) break;
        const each = Math.floor(c.purse / team.length);
        const rest = c.purse % team.length;
        team.forEach((x) => { x.chips += each; });
        c.pot += rest;
        log(`💰 Split ${c.purse}c: ${each}c each${rest ? `, ${rest}c to the Pot` : ''}.`);
        c.purse = 0;
        commit();
        break;
      }
      case 'endhome':
        if (c.purse > 0 && !confirm(`${c.purse}c hasn't been allocated. Put it in the Pot?`)) break;
        c.pot += c.purse; c.purse = 0; c.needDue = 0; c.needPaid = 0; c.hardshipDue = false; c.helpAtHome = false;
        if (c.skipRaid && !ui.raidCheck) c.skipRaid = false;
        ui.hardship = null; ui.raidCheck = null;
        log('🏠 Homecoming done.');
        commit();
        break;
      case 'recovery': {
        const clinic = c.projects.clinic;
        const com = community();
        alive().forEach((x) => {
          if (com > 0 && clinic >= 2) x.wounds = 0; else x.wounds = Math.max(0, x.wounds - (com > 0 && clinic === 1 ? 2 : 1));
          x.shaken = 0;
        });
        log('🩹 Downtime Recovery applied.');
        toast('🩹 Recovery applied to every character');
        commit();
        break;
      }
      case 'keepquiet': setExposure(c.exposure - (c.projects.safehouse >= 1 ? 2 : 1), 'Keep Quiet'); commit(); break;
      case 'quiet': setExposure(c.exposure - 1, 'things go quiet'); commit(); break;
      case 'cleaner': setExposure(c.exposure - 1, 'Cleaner, 20c'); commit(); break;
      case 'cleanup': setExposure(c.exposure - 1, 'Clean-up favour'); commit(); break;
      case 'confidant': c.confidantUsed = true; setExposure(c.exposure - 3, 'the handler takes the blame'); commit(); break;
      case 'lielow': {
        setExposure(c.exposure - (c.projects.safehouse >= 2 ? 3 : 2), 'lying low');
        setNeedDue();
        log('🫥 The crew lies low. No pay, but the Need is due.');
        commit();
        break;
      }
      case 'canceljob': if (confirm('Cancel this job? Exposure already gained stays.')) { c.job = null; commit(); } break;
      case 'penance': c.exposure = 6; c.waterCut = false; c.cisternUsed = 0; log('⚖️ Penance job succeeded. Exposure 6, the water is back, jobs start again.'); commit(); break;
      case 'export': {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `project-society-${(c.name || 'crew').replace(/\W+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        break;
      }
      case 'reset':
        if (confirm('Delete every character and reset the crew? Export first if you want a backup.')) { resetAll(); ui.hardship = null; ui.raidCheck = null; draw(); }
        break;
      default: break;
    }
  };
}

