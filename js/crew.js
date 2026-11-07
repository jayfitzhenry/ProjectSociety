// Crew sheet: Community, the Pot, Exposure, Trust, jobs, Homecoming, raids and downtime.
import {
  PROJECTS, JOBS, EXPOSURE_EVENTS, TRUST_EVENTS, FAVOURS, HARDSHIP_EVENTS, MAX_COMMUNITY, HOMECOMING_STEPS,
  communityBand, exposureBand, trustBand, communityCost,
} from './data.js';
import {
  state, save, esc, toast, log, clamp, community, needPerJob, crewLevel, charLevel, hasContact,
  marketOpen, crewChars, isDm, sendChipsHome, plain,
} from './store.js';
import { netOf, signed, poolLabel } from './dice.js';

// Rolls happen with real dice at the table: the sheet says what to roll, then the DM enters the result.
// hardship: null | 'fail' | 'done'; raid: null | 'raided' | 'none' | 'done'
const ui = { hardship: null, hardshipText: '', pressure: false, raid: null, raidText: '', onJob: null };
const term = (t, label = t) => `<button type="button" class="term" data-term="${esc(t)}">${esc(label)}</button>`;

const crew = () => state.crew;
const alive = () => crewChars().filter((c) => c.created && !c.dead);
/** Your own living characters in this campaign: the ones you can send chips home from. */
const mine = () => state.characters.filter((c) => c.campaignId === state.campaign?.id && c.created && !c.dead);

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
      log('Safehouse III: the crew disappears for a while. Exposure set to 8.');
    }
  }
  const delta = n - c.exposure;
  if (delta === 0) return;
  if (c.job) c.job.exposure = Math.max(0, c.job.exposure + delta);
  if (n >= 10 && c.exposure < 10) {
    c.trust = clamp(c.trust - 2, 0, 10);
    log('BURNED. Antioch cuts the crew loose. Trust −2.');
    toast('Burned! Trust −2');
  }
  c.exposure = n;
  log(`Exposure ${signed(delta)} → ${n}${reason ? ` (${reason})` : ''}`);
}

function setTrust(next, reason) {
  const c = crew();
  const n = clamp(next, 0, 10);
  const delta = n - c.trust;
  if (!delta) return;
  c.trust = n;
  log(`Trust ${signed(delta)} → ${n}${reason ? ` (${reason})` : ''}`);
}

/** Set the Need due at this Homecoming. Debt doubles it once, then it's paid off. */
function setNeedDue() {
  const c = crew();
  c.needDue = needPerJob();
  c.needPaid = 0;
  if (c.debt) { c.debt = false; log(`Debt: this Homecoming's Need is doubled (${c.needDue}c).`); }
}

function meter(value, max, kind) {
  return `<div class="meter m-${kind}">${Array.from({ length: max + 1 }, (_, i) => `<button type="button" class="pip ${i <= value ? 'on' : ''} ${i === value ? 'cur' : ''}" data-meter="${kind}" data-v="${i}" title="${i}">${i}</button>`).join('')}</div>`;
}

// ---------- sections ----------
function pips(value, kind, label) {
  return `<div class="pips" role="group" aria-label="${label}">${Array.from({ length: 11 }, (_, i) => `<button type="button" class="${i === value ? 'cur' : ''}" aria-pressed="${i <= value}" data-meter="${kind}" data-v="${i}" aria-label="${label} ${i}">${i}</button>`).join('')}</div>`;
}

function tracks() {
  const c = crew();
  const com = community();
  const band = communityBand(com);
  const eb = exposureBand(c.exposure);
  const tb = trustBand(c.trust);
  const next = com + 1;
  return `<div class="tracks">
    <section class="track">
      <p class="label">${term('Community')}</p>
      <p class="hero num">${com}<small>/10</small></p>
      <div class="bar" aria-hidden="true"><i style="width:${com * 10}%"></i></div>
      <p><b>${band.name}</b> · ${term('Need')} <b class="num">${needPerJob()}c</b>${c.debt ? ' <span class="tag">doubled: Debt</span>' : ''}</p>
      <p class="muted small">${band.text}</p>
      <p>${term('Pot')} <b class="num">${c.pot}c</b>${com < MAX_COMMUNITY ? ` <span class="muted small">· the next tier costs ${communityCost(next)}c</span>` : ''}</p>
      <div class="row"><label class="sr-only" for="pot-amt">Amount</label><input type="number" id="pot-amt" value="10" min="1" class="narrow" inputmode="numeric">
        <button type="button" class="btn" data-pot="-1">Take out</button><button type="button" class="btn" data-pot="1">Put in</button></div>
      <label class="check"><input type="checkbox" data-flag="waterCut" ${c.waterCut ? 'checked' : ''}> The water is cut</label>
    </section>
    <section class="track">
      <p class="label">${term('Exposure')}</p>
      <p class="hero num">${c.exposure}<small>/10</small></p>
      ${pips(c.exposure, 'exposure', 'Exposure')}
      <p><b>${eb.name}</b></p><p class="muted small">${eb.text}</p>
    </section>
    <section class="track">
      <p class="label">${term('Trust')}</p>
      <p class="hero num">${c.trust}<small>/10</small></p>
      ${pips(c.trust, 'trust', 'Trust')}
      <p><b>${tb.name}</b> · <b class="num">${favoursAvailable()}</b> ${term('Favours', `favour${favoursAvailable() === 1 ? '' : 's'}`)} per job</p>
      <p class="muted small">${tb.text}</p>
      ${c.trust >= 9 ? `<label class="check"><input type="checkbox" data-flag="confidantUsed" ${c.confidantUsed ? 'checked' : ''}> Confidant blame used (−3 Exposure)</label>
        ${c.confidantUsed ? '' : '<button type="button" class="btn" data-act="confidant">Use it now: −3 Exposure</button>'}` : ''}
    </section>
  </div>`;
}

function projects() {
  const c = crew();
  const com = community();
  const cost = communityCost(com + 1);
  const starting = com === 2 && !c.startChosen && isDm();
  return `<section class="block">
    <h2>${term('Projects')}</h2>
    <p class="muted small">Community is the number of tiers built (at most 10). Build I, then II, then III. Lost tiers are always the top one.</p>
    ${starting ? '<p class="note good">New campaign: the district starts with Clinic I and Hall I. <b>Pick one more starting tier</b>, free.</p>' : ''}
    ${PROJECTS.map((p) => `<div class="project">
      <b>${esc(p.name)}</b>
      <div class="tiers">${p.tiers.map((t, i) => {
        const tier = i + 1;
        const built = c.projects[p.id] >= tier;
        const isNext = c.projects[p.id] === i;
        const isTop = c.projects[p.id] === tier;
        const can = isNext && com < MAX_COMMUNITY;
        const what = built ? (isTop ? 'built. Tap to lose it' : 'built') : can ? (starting ? 'free starting tier' : `build for ${cost}c`) : 'build the tier before it first';
        // The visible text stays in the accessible name, in order (WCAG 2.5.3); the rest is for screen readers.
        return `<button type="button" class="tier ${built ? 'built' : ''} ${can ? 'next' : ''}" data-tier="${p.id}" data-n="${tier}" ${!built && !can ? 'disabled' : ''}>`
          + `<span class="sr-only">${esc(p.name)} </span><b>${'I'.repeat(tier)}${built ? '<span aria-hidden="true"> ✓</span>' : ''}</b> ${esc(t)}<span class="sr-only">. ${what}</span></button>`;
      }).join('')}</div>
    </div>`).join('')}
  </section>`;
}

function jobCard() {
  const c = crew();
  if (c.exposure >= 10) {
    return `<section class="block"><h2>Jobs</h2><p class="note bad"><b>Burned.</b> No jobs from the handler. ${c.trust >= 5
      ? 'Trust is 5 or more: the handler offers a penance job (Dangerous, unpaid). Success sets Exposure to 6 and brings back the water and jobs.</p><button type="button" class="btn" data-act="penance">Penance job succeeded</button>'
      : 'Trust is below 5. The crew is on its own. A rival house may make an offer.</p>'}</section>`;
  }
  if (!c.job) {
    return `<section class="block">
      <h2>Job</h2>
      <p class="muted">Start a job to track Exposure as it happens. Favours this job: <b class="num">${favoursAvailable()}</b>.</p>
      <ul class="rows">${Object.entries(JOBS).map(([k, j]) => `<li><button type="button" class="row-main" data-startjob="${k}">
        <span class="row-text"><span class="row-title">${j.name}</span><span class="row-meta">${j.examples}</span></span><span class="row-side num">${j.pay}c<br>${j.marks} Mark${j.marks > 1 ? 's' : ''}</span></button></li>`).join('')}</ul>
      <p class="muted small" style="margin-top:8px">Or <button type="button" class="linklike" data-act="lielow">lie low</button> instead: −${c.projects.safehouse >= 2 ? 3 : 2} Exposure, no pay, and the Need is still due.</p>
    </section>`;
  }
  const j = JOBS[c.job.type];
  const clean = c.job.exposure <= 1;
  const on = ui.onJob || new Set(alive().map((x) => x.id));
  ui.onJob = on;
  return `<section class="block">
    <h2>On the job: ${j.name} <span class="muted small">${j.pay}c · ${j.marks} Marks</span></h2>
    <p>Exposure gained: <b class="num">${c.job.exposure}</b> · ${clean ? `still a ${term('Clean job', 'clean job')}` : 'not clean'} · Favours: <b class="num">${favoursAvailable()}</b></p>
    <p class="label">Something went wrong</p>
    <div class="opts block">${EXPOSURE_EVENTS.map((ev, i) => `<button type="button" class="opt" data-expev="${i}" aria-pressed="false">${esc(ev.text)} <span class="n">+${ev.n}</span></button>`).join('')}</div>
    <details class="sect"><summary>Favours</summary><div class="sect-body"><ul class="plain">${FAVOURS.map((f) => `<li><b>${esc(f.name)}</b>: ${esc(f.text)}</li>`).join('')}</ul></div></details>
    ${alive().length ? `<p class="label" style="margin-top:16px">Who's on the job (they earn Marks)</p><div class="opts block">${alive().map((x) => `<button type="button" class="opt" data-onjob="${x.id}" aria-pressed="${on.has(x.id)}">${esc(x.name)}</button>`).join('')}</div>` : ''}
    <div class="row">
      <button type="button" class="btn primary" data-endjob="success">Objective completed</button>
      <button type="button" class="btn danger" data-endjob="fail">Objective failed</button>
      <button type="button" class="btn quiet" data-act="canceljob">Cancel the job</button>
    </div>
  </section>`;
}

function endJob(outcome) {
  const c = crew();
  const j = JOBS[c.job.type];
  const clean = c.job.exposure <= 1;
  const hot = c.exposure >= 7 && c.exposure < 10;
  let pay = outcome === 'success' ? j.pay : Math.floor(j.pay / 2);
  const parts = [`${j.name} ${outcome === 'success' ? 'completed' : 'failed, half pay'} ${pay}c`];
  if (clean) { pay += 10; parts.push('clean +10c'); }
  if (hot) { pay -= 10; parts.push('Hot −10c'); }
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
  log(`Job done: ${parts.join(', ')} = ${pay}c. ${marks} Mark${marks > 1 ? 's' : ''} each${team.length ? ` (${team.map((x) => x.name).join(', ')})` : ''}.`);
  if (levelled.length) log(`Level up in downtime: ${levelled.join(', ')}`);
  toast(`${pay}c brought home · ${marks} Marks each${levelled.length ? ` · ${esc(levelled.join(', '))}` : ''}`);
}

function hardshipMods() {
  const c = crew();
  const mods = [];
  if (c.needPaid >= c.needDue / 2 && c.needPaid > 0) mods.push(['Paid at least half the Need', 1]);
  if (c.needPaid === 0) mods.push(['Paid nothing', -1]);
  if (c.helpAtHome) mods.push(['Help at Home', 1]);
  if (c.projects.hall >= 1) mods.push(['Hall I or better', 1]);
  if (hasContact('Gang Elder')) mods.push(['Gang Elder contact', 1]);
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
  if (c.projects.watch) mods.push([`Watch ${'I'.repeat(c.projects.watch)}`, c.projects.watch]);
  if (c.helpAtHome) mods.push(['Help at Home', 1]);
  if (c.exposure >= 7) mods.push(['Exposure Hot', -1]);
  return mods;
}

function modsNet(mods) {
  const plus = mods.filter(([, n]) => n > 0).reduce((s, [, n]) => s + n, 0);
  const minus = mods.filter(([, n]) => n < 0).reduce((s, [, n]) => s - n, 0);
  return netOf(plus, minus);
}

/** What to roll: the modifiers, then the dice. */
function rollBox(mods, target = '7+ passes') {
  const net = modsNet(mods);
  return `<ul class="breakdown">${mods.map(([l, n]) => `<li><span>${esc(l)}</span><b>${signed(n)}</b></li>`).join('') || '<li><span class="muted">No modifiers</span><b>0</b></li>'}</ul>
    <p>Roll <b>${poolLabel(net)}</b>. ${target}.</p>`;
}

function hardshipStep() {
  if (ui.hardship === 'done') return `<p class="note good">${ui.hardshipText}</p>${ui.pressure ? pressureRow() : ''}`;
  if (ui.hardship === 'fail') {
    return `<p class="note bad"><b>Failed: −1 Community.</b> The crew chooses a tier to lose: tap the top tier of a project above.</p>
      <p>Roll <b>1D6</b> for the Hardship event:</p>
      <ul class="rows">${HARDSHIP_EVENTS.map((ev) => `<li><button type="button" class="row-main" data-hevent="${ev.roll}"><span class="row-text"><span class="row-title">${ev.roll}. ${esc(ev.name)}</span><span class="row-meta">${esc(ev.text)}</span></span></button></li>`).join('')}</ul>`;
  }
  return `${rollBox(hardshipMods())}
    <div class="row"><span class="muted small">Result:</span>
      <button type="button" class="btn" data-hardship="crit">Double 6</button>
      <button type="button" class="btn" data-hardship="pass">Passed</button>
      <button type="button" class="btn" data-hardship="fail">Failed</button></div>`;
}

function pressureRow() {
  return `<div class="row"><button type="button" class="btn" data-act="pressurepay">Pay 15c (from the pay, then the Pot)</button><span class="muted small">or lose one more tier</span></div>`;
}

function raidStep() {
  const c = crew();
  if (ui.raid === 'none' || ui.raid === 'done') return `<p class="note ${ui.raid === 'done' && /lose|−/.test(ui.raidText) ? 'bad' : 'good'}">${ui.raidText}</p>`;
  if (ui.raid === 'raided') {
    return `<p class="note bad"><b>The district is raided.</b>${c.projects.watch >= 3 ? ' With Watch III the crew can defend in person instead: play the fight.' : ''}</p>
      <p class="label">Raid test</p>
      ${rollBox(raidTestMods())}
      <div class="row"><span class="muted small">Result:</span>
        <button type="button" class="btn" data-raidtest="crit">Double 6</button>
        <button type="button" class="btn" data-raidtest="pass">Passed</button>
        <button type="button" class="btn" data-raidtest="fail">Failed</button>
        ${c.projects.watch >= 3 ? '<button type="button" class="btn" data-act="raidwon">Crew defended and won</button>' : ''}</div>`;
  }
  return `<p>Roll <b>${poolLabel(c.exposure >= 7 ? 1 : 0)}</b>${c.exposure >= 7 ? ' (+1, Exposure is Hot)' : ''}. On 7 or more, the district is raided.</p>
    <div class="row"><button type="button" class="btn" data-raidcheck="raided">7 or more: raided</button><button type="button" class="btn" data-raidcheck="none">6 or less: no raid</button></div>`;
}

function homecoming() {
  const c = crew();
  const com = community();
  const due = c.needDue;
  const short = Math.max(0, due - c.needPaid);
  const active = c.purse > 0 || due > 0 || ui.hardship || ui.raid;
  const reasons = raidReasons();
  const cisternCovers = c.projects.cistern >= 3 || (c.projects.cistern === 2 && c.cisternUsed < 3) || (c.projects.cistern === 1 && c.cisternUsed < 1);
  if (!active) {
    return `<section class="block"><h2>${term('Homecoming')}</h2><p class="muted">After a job, the pay comes here and you work through seven steps: ${HOMECOMING_STEPS.join(', ')}.</p>
      <p class="muted small">Finish a job, lie low, or <button type="button" class="linklike" data-act="manualpay">bring pay home by hand</button>.</p></section>`;
  }
  const team = alive();
  const cost = communityCost(com + 1);
  return `<section class="block">
    <h2>${term('Homecoming')} <span class="muted small">pay brought home: <b class="num">${c.purse}c</b></span></h2>
    <p class="muted small">Work down the list. Losses come before building, so you can see what needs rebuilding.</p>
    <ol class="steps-list">
      <li class="${c.needPaid >= due ? 'done' : ''}">
        <b>Pay the ${term('Need')}</b> <span class="muted small">from the pay, then the Pot</span><br>
        ${com === 0 ? '<span class="muted">Collapsed: there\'s no Need.</span>' : `<span class="num">${c.needPaid}/${due}c paid</span>
        ${short > 0 ? `<div class="row" style="margin-top:8px">
          <button type="button" class="btn" data-payneed="${short}">Pay ${short}c${c.purse < short ? ' (the rest from the Pot)' : ''}</button>
          ${Math.ceil(due / 2) - c.needPaid > 0 && Math.ceil(due / 2) < due ? `<button type="button" class="btn" data-payneed="${Math.ceil(due / 2) - c.needPaid}">Pay half (${Math.ceil(due / 2) - c.needPaid}c)</button>` : ''}
          ${team.length ? '<button type="button" class="btn" data-act="chipin">Characters chip in…</button>' : ''}
          <button type="button" class="btn quiet" data-act="skipneed">Don't pay (Hardship test)</button></div>` : ' · paid'}`}
      </li>
      ${c.hardshipDue || ui.hardship ? `<li><b>${term('Hardship', 'Hardship test')}</b>: the Need wasn't met.${hardshipStep()}</li>` : ''}
      <li class="${ui.raid === 'done' || ui.raid === 'none' ? 'done' : ''}">
        <b>${term('Raid', 'Raid check')}</b> ${c.skipRaid ? '<span class="muted">Skipped this time: the district drove the last raiders off.</span>' : reasons.length ? `<span class="tag">due: ${reasons.join(', ')}</span>` : '<span class="muted">Not due.</span>'}
        ${!c.skipRaid && (reasons.length || ui.raid) ? raidStep() : ''}
      </li>
      ${c.waterCut ? `<li><b>Water cut</b> ${cisternCovers ? `<span class="tag">the Cistern covers it</span>${c.projects.cistern < 3 ? ' <button type="button" class="btn quiet" data-act="cisternuse">Mark this Homecoming used</button>' : ''}` : '<span class="tag">−1 Community</span> <span class="muted small">The crew chooses: tap the top tier of a project.</span>'}</li>` : ''}
      <li>
        <b>Fill the ${term('Pot')}</b>
        <div class="row" style="margin-top:8px"><label class="sr-only" for="to-pot">Chips to the Pot</label><input type="number" id="to-pot" min="0" max="${c.purse}" value="0" class="narrow" inputmode="numeric"> <button type="button" class="btn" data-act="topot">Send to the Pot</button>
        <span class="muted small">Pot: ${c.pot}c${com < MAX_COMMUNITY ? ` of ${communityCost(com + 1)}c for Community ${com + 1}` : ''}</span></div>
      </li>
      <li class="${com < MAX_COMMUNITY && c.pot >= cost ? '' : 'done'}">
        <b>Build</b> ${com >= MAX_COMMUNITY ? '<span class="muted small">Community is 10. Nothing left to build.</span>'
          : c.pot >= cost ? `<span class="tag">the Pot can pay ${cost}c</span> <span class="muted small">Tap the next tier of any project above.</span>`
            : `<span class="muted small">The next tier costs ${cost}c: ${cost - c.pot}c more needed.</span>`}
      </li>
      <li>
        <b>Split the rest</b> ${team.length ? `<span class="muted small">${c.purse}c between ${team.length}: ${Math.floor(c.purse / team.length)}c each, and ${c.purse % team.length}c left over goes to the Pot</span>
        <div class="row" style="margin-top:8px"><button type="button" class="btn primary" data-act="split" ${c.purse ? '' : 'disabled'}>Split equally</button></div>` : '<span class="muted">No characters yet.</span>'}
      </li>
    </ol>
    <button type="button" class="btn" data-act="endhome">Homecoming done: on to downtime</button>
  </section>`;
}

function downtime() {
  const c = crew();
  const clinic = c.projects.clinic;
  const com = community();
  const recovery = com === 0 ? '1' : clinic >= 2 ? 'all' : clinic === 1 ? '2' : '1';
  return `<section class="block">
    <h2>${term('Downtime')}</h2>
    <ol class="steps-list">
      <li><b>Recovery</b>: every character removes <b>${recovery}</b> wound${recovery === '1' ? '' : 's'}.
        <div class="row" style="margin-top:8px"><button type="button" class="btn" data-act="recovery">Apply to everyone</button></div></li>
      <li><b>Downtime actions</b>, one each:
        <div class="row" style="margin-top:8px">
          <button type="button" class="btn" data-act="keepquiet">Keep Quiet (−${c.projects.safehouse >= 1 ? 2 : 1} Exposure)</button>
          <label class="check"><input type="checkbox" data-flag="helpAtHome" ${c.helpAtHome ? 'checked' : ''}> Someone took Help at Home</label>
        </div>
        <p class="muted small">Recover (2 more wounds), Odd Jobs (5c) and Seek Out (a Specialist item at double price) happen on the character sheets.</p></li>
      <li><b>Level up</b>: ${alive().map((x) => `${esc(x.name)} L${charLevel(x)}`).join(' · ') || '—'} <span class="muted small">(crew level ${crewLevel()})</span></li>
      <li><b>Shop</b>: ${['works', 'specialist', 'refined'].map((m) => `${{ works: 'Works', specialist: 'Specialist', refined: 'Refined' }[m]} ${marketOpen(m) ? 'open' : 'locked'}`).join(' · ')} <span class="muted small">(from each character sheet)</span></li>
      <li><b>Things go quiet</b>: −1 Exposure. <button type="button" class="btn" data-act="quiet">Apply</button></li>
    </ol>
    <div class="row">
      <button type="button" class="btn" data-act="cleaner">Cleaner (−1 Exposure, 20c)</button>
      <button type="button" class="btn" data-act="cleanup">Clean-up favour (−1)</button>
    </div>
  </section>`;
}

function manual() {
  return `<details class="sect"><summary>Adjust Exposure and Trust by event</summary><div class="sect-body grid2">
    <div><p class="label">Exposure</p><div class="opts">${EXPOSURE_EVENTS.map((ev, i) => `<button type="button" class="opt" data-expev="${i}" aria-pressed="false">${esc(ev.text)} <span class="n">+${ev.n}</span></button>`).join('')}</div></div>
    <div><p class="label">Trust</p><div class="opts">${TRUST_EVENTS.map((ev, i) => `<button type="button" class="opt" data-trustev="${i}" aria-pressed="false">${esc(ev.text)} <span class="n">${signed(ev.n)}</span></button>`).join('')}</div></div>
  </div></details>`;
}

function sendHomeCard() {
  const own = mine();
  if (!own.length) return '';
  return `<section class="block">
    <h2>Send chips home</h2>
    <p class="muted small">Chips sent home go into the Pot and belong to the district. They can't be taken back.</p>
    <form class="form-row" id="send-home">
      ${own.length > 1 ? `<label class="field"><span>From</span><select name="characterId">${own.map((x) => `<option value="${x.id}">${esc(x.name)} (${x.chips}c)</option>`).join('')}</select></label>`
        : `<input type="hidden" name="characterId" value="${own[0].id}"><span class="muted">${esc(own[0].name)} has <b class="num">${own[0].chips}c</b></span>`}
      <label class="field"><span>Chips</span><input class="narrow" name="chips" type="number" min="1" step="1" inputmode="numeric" required></label>
      <button class="btn primary">Send home</button>
    </form>
  </section>`;
}

function logCard() {
  const l = crew().log;
  return `<details class="sect"><summary>Log<span class="meta">${l.length} entries</span></summary><div class="sect-body">
    ${l.length ? `<ol class="log">${l.slice(0, 60).map((e) => `<li><time>${new Date(e.t).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</time>${esc(plain(e.text))}</li>`).join('')}</ol>` : '<p class="muted">Nothing yet.</p>'}
  </div></details>`;
}

function view() {
  const c = crew();
  const dm = isDm();
  return `<div class="crew">
    ${dm ? '' : '<p class="note">The DM runs the crew sheet. You can see everything, and send your own chips home.</p>'}
    ${sendHomeCard()}
    <fieldset ${dm ? '' : 'disabled'}>
    <label class="field"><span>Crew or district name</span><input class="title-input" data-f="crewname" value="${esc(c.name)}" placeholder="Name the crew or district…"></label>
    ${tracks()}
    ${dm ? `${jobCard()}${homecoming()}` : ''}
    ${projects()}
    ${dm ? `${downtime()}${manual()}` : ''}
    </fieldset>
    ${logCard()}
  </div>`;
}

function loseTier(projectId) {
  const c = crew();
  const p = PROJECTS.find((x) => x.id === projectId);
  c.projects[projectId] -= 1;
  log(`Lost ${p.name} ${'I'.repeat(c.projects[projectId] + 1)}. Community ${community()}.`);
}

export function renderCrew(el) {
  const draw = () => { const y = window.scrollY; el.innerHTML = view(); window.scrollTo(0, y); };
  draw();
  const commit = () => { save(); draw(); };

  el.oninput = (e) => {
    if (e.target.dataset.f === 'crewname' && isDm()) { crew().name = e.target.value; save(); }
  };
  el.onsubmit = async (e) => {
    if (e.target.id !== 'send-home') return;
    e.preventDefault();
    const f = new FormData(e.target);
    const who = state.characters.find((x) => x.id === f.get('characterId'));
    const chips = Math.floor(Number(f.get('chips')));
    if (!who || !(chips > 0)) return;
    if (chips > who.chips) { toast(`${esc(who.name)} only has ${who.chips}c`); return; }
    if (!confirm(`Send ${chips}c from ${who.name} home to the Pot? It can't be taken back.`)) return;
    try {
      await sendChipsHome(who, chips);
      toast(`${chips}c sent home`);
      draw();
    } catch (err) {
      toast(`${esc(err.message)}`);
    }
  };
  el.onchange = (e) => {
    const t = e.target;
    if (t.dataset.flag) {
      crew()[t.dataset.flag] = t.checked;
      if (t.dataset.flag === 'waterCut') {
        log(t.checked ? ' Antioch cuts the water.' : ' The water is back.');
        if (!t.checked) crew().cisternUsed = 0; // the Cistern's count starts again with the next cut
      }
      commit();
      return;
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
      log(`Pot ${Number(d.pot) > 0 ? '+' : '−'}${amt}c → ${c.pot}c`);
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
      const starting = com === 2 && !c.startChosen && isDm();
      if (starting) {
        c.projects[p.id] = n;
        c.startChosen = true;
        log(`Starting tier chosen: ${p.name} I. Community 3.`);
      } else if (c.pot >= cost) {
        if (!confirm(`Build ${p.name} ${'I'.repeat(n)} for ${cost}c from the Pot?`)) return;
        c.pot -= cost;
        c.projects[p.id] = n;
        log(`Built ${p.name} ${'I'.repeat(n)} for ${cost}c. Community ${com + 1}.`);
        toast(`${p.name} ${'I'.repeat(n)} built`);
      } else {
        if (!confirm(`The Pot has ${c.pot}c of ${cost}c. Add ${p.name} ${'I'.repeat(n)} anyway (no payment)?`)) return;
        c.projects[p.id] = n;
        log(`Added ${p.name} ${'I'.repeat(n)} by hand. Community ${com + 1}.`);
      }
      commit();
      return;
    }
    if (d.startjob) {
      c.job = { type: d.startjob, exposure: 0 };
      ui.onJob = null;
      log(`Started a ${JOBS[d.startjob].name} job.`);
      commit();
      return;
    }
    if (d.onjob) {
      if (!ui.onJob) ui.onJob = new Set();
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
    if (d.endjob) { endJob(d.endjob); ui.hardship = null; ui.raid = null; c.hardshipDue = false; commit(); return; }
    if (d.payneed) {
      let amt = Number(d.payneed);
      const fromPurse = Math.min(c.purse, amt);
      c.purse -= fromPurse;
      amt -= fromPurse;
      const fromPot = Math.min(c.pot, amt);
      c.pot -= fromPot;
      const paid = fromPurse + fromPot;
      c.needPaid += paid;
      log(`Paid ${paid}c of the Need${fromPot ? ` (${fromPot}c from the Pot)` : ''}. ${c.needPaid}/${c.needDue}c.`);
      c.hardshipDue = c.needPaid < c.needDue;
      commit();
      return;
    }

    // Results of real dice, entered by the DM.
    if (d.hardship) {
      if (d.hardship === 'crit') { c.pot += 10; ui.hardship = 'done'; ui.hardshipText = 'Double 6: the community pulls together. Nothing is lost, and 10c goes into the Pot.'; log('Hardship: critical. +10c to the Pot.'); }
      if (d.hardship === 'pass') { ui.hardship = 'done'; ui.hardshipText = 'Passed: the community makes do. Nothing is lost.'; log('Hardship: passed.'); }
      if (d.hardship === 'fail') { ui.hardship = 'fail'; log('Hardship failed: −1 Community.'); }
      c.hardshipDue = false;
      commit();
      return;
    }
    if (d.hevent) {
      const ev = HARDSHIP_EVENTS[Number(d.hevent) - 1];
      if (ev.roll === 2) c.forceRaid = true;
      if (ev.roll === 3) c.debt = true;
      ui.pressure = ev.roll === 6;
      ui.hardship = 'done';
      ui.hardshipText = `Hardship failed: −1 Community. Event ${ev.roll}, ${ev.name}: ${ev.text}`;
      log(`Hardship event ${ev.roll}: ${ev.name}.`);
      commit();
      return;
    }
    if (d.raidcheck) {
      c.forceRaid = false;
      if (d.raidcheck === 'raided') { ui.raid = 'raided'; log('Raid check: the district is raided.'); } else { ui.raid = 'none'; ui.raidText = 'No raid this time.'; log('Raid check: no raid.'); }
      commit();
      return;
    }
    if (d.raidtest) {
      const burned = c.exposure >= 10;
      ui.raid = 'done';
      if (d.raidtest === 'crit') { c.skipRaid = true; ui.raidText = 'Double 6: driven off before Antioch arrives. Skip the next Raid check.'; log('Raid test: critical. Skip the next Raid check.'); }
      if (d.raidtest === 'pass') { ui.raidText = 'Passed: some damage, then Antioch\'s elite arrives, late as always. Nothing lost.'; log('Raid test: passed.'); }
      if (d.raidtest === 'fail') { ui.raidText = `Failed: lose ${burned ? 2 : 1} tier${burned ? 's' : ''}. The DM chooses: tap the top tier of a project.`; log(`Raid test failed: −${burned ? 2 : 1} Community.`); }
      commit();
      return;
    }

    switch (d.act) {
      case 'chipin': {
        const short = Math.max(0, c.needDue - c.needPaid);
        const v = Math.min(short, Math.floor(Number(prompt(`How many chips do the characters pay from their own pockets? (${short}c still due)\nTake them off the character sheets as well.`, String(short))) || 0));
        if (v <= 0) break;
        c.needPaid += v;
        c.hardshipDue = c.needPaid < c.needDue;
        log(`Characters chipped in ${v}c of the Need. ${c.needPaid}/${c.needDue}c.`);
        commit();
        break;
      }
      case 'skipneed': c.hardshipDue = true; log(`The Need wasn't met (${c.needPaid}/${c.needDue}c).`); commit(); break;
      case 'manualpay': {
        const v = Number(prompt('How many chips did the crew bring home?', '60'));
        if (v > 0) { c.purse += v; setNeedDue(); log(`${v}c brought home.`); commit(); }
        break;
      }
      case 'pressurepay': {
        const fromPurse = Math.min(c.purse, 15);
        const fromPot = Math.min(c.pot, 15 - fromPurse);
        if (fromPurse + fromPot < 15) { toast('Not enough in the pay and the Pot. Characters can chip in from their sheets, or lose a tier.'); break; }
        c.purse -= fromPurse; c.pot -= fromPot;
        log(`Pressure drop: paid 15c${fromPot ? ` (${fromPot}c from the Pot)` : ''}.`);
        ui.pressure = false;
        ui.hardshipText += ' Paid 15c: the pumps are running again.';
        commit();
        break;
      }
      case 'raidwon': log('The crew defended the district and won. Nothing lost.'); ui.raid = 'done'; ui.raidText = 'The crew won on home ground. Nothing lost.'; commit(); break;
      case 'cisternuse': c.cisternUsed += 1; log('The Cistern covered a Homecoming without water.'); commit(); break;
      case 'topot': {
        const v = clamp(Number(el.querySelector('#to-pot').value) || 0, 0, c.purse);
        if (!v) break;
        c.purse -= v; c.pot += v;
        log(`Sent ${v}c home to the Pot → ${c.pot}c.`);
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
        log(`Split ${c.purse}c: ${each}c each${rest ? `, ${rest}c to the Pot` : ''}.`);
        c.purse = 0;
        commit();
        break;
      }
      case 'endhome':
        if (c.purse > 0 && !confirm(`${c.purse}c hasn't been allocated. Put it in the Pot?`)) break;
        c.pot += c.purse; c.purse = 0; c.needDue = 0; c.needPaid = 0; c.hardshipDue = false; c.helpAtHome = false;
        if (c.skipRaid && !ui.raid) c.skipRaid = false;
        ui.hardship = null; ui.raid = null; ui.pressure = false;
        log('Homecoming done.');
        commit();
        break;
      case 'recovery': {
        const clinic = c.projects.clinic;
        const com = community();
        alive().forEach((x) => {
          if (com > 0 && clinic >= 2) x.wounds = 0; else x.wounds = Math.max(0, x.wounds - (com > 0 && clinic === 1 ? 2 : 1));
          x.shaken = 0;
        });
        log('Downtime Recovery applied.');
        toast('Recovery applied to every character');
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
        log('The crew lies low. No pay, but the Need is due.');
        commit();
        break;
      }
      case 'canceljob': if (confirm('Cancel this job? Exposure already gained stays.')) { c.job = null; commit(); } break;
      case 'penance': c.exposure = 6; c.waterCut = false; c.cisternUsed = 0; log('Penance job succeeded. Exposure 6, the water is back, jobs start again.'); commit(); break;
      default: break;
    }
  };
}

