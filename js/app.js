// App shell: hash router and the home dashboard.
import { renderRules } from './rules.js';
import { renderDice } from './dice-view.js';
import { renderCombat } from './combat.js';
import { renderCharacters, traitsOf } from './characters.js';
import { renderCrew } from './crew.js';
import {
  state, esc, community, charLevel, maxWounds, crewLevel, needPerJob,
} from './store.js';
import {
  communityBand, exposureBand, trustBand, BACKGROUNDS, traitIcon,
} from './data.js';
import { roll, renderRoll } from './dice.js';

const app = document.getElementById('app');

function home(el) {
  const c = state.crew;
  const com = community();
  const cb = communityBand(com);
  const eb = exposureBand(c.exposure);
  const tb = trustBand(c.trust);
  const chars = state.characters.filter((x) => x.created && !x.dead);
  el.innerHTML = `<div class="page home">
    <section class="hero">
      <h1>🎲 Project Society</h1>
      <p class="tagline">One roll, one rule: roll <b>2D6</b>, score <b>7 or more</b> to pass.<br>
      <span class="muted">Modifiers change how many dice you roll. They never change the target number.</span></p>
      <div class="hero-roll">
        <button type="button" class="btn primary big" id="home-roll">🎲 Roll 2D6</button>
        <div id="home-roll-out"></div>
      </div>
    </section>

    <div class="card-grid">
      <a class="card link-card" href="#/rules"><div class="big">📜</div><b>Rules</b><small class="muted">Every rulebook, searchable and cross-linked</small></a>
      <a class="card link-card" href="#/dice"><div class="big">🎲</div><b>Dice Roller</b><small class="muted">Build a pool, see the exact odds, roll</small></a>
      <a class="card link-card" href="#/combat"><div class="big">⚔️</div><b>Attack Calculator</b><small class="muted">Weapon vs armour, To Hit and To Wound</small></a>
      <a class="card link-card" href="#/characters"><div class="big">🧰</div><b>Characters</b><small class="muted">Create in ten minutes, track in play</small></a>
      <a class="card link-card" href="#/crew"><div class="big">🏠</div><b>Crew</b><small class="muted">Community, Exposure, Trust, jobs, Homecoming</small></a>
    </div>

    <div class="cols">
      <section class="card">
        <h3>🏠 ${esc(c.name) || 'The crew'} <small class="muted">crew level ${crewLevel()}</small></h3>
        <div class="snapshot">
          <a href="#/crew"><b>${com}</b><small>${cb.icon} Community · ${cb.name}</small></a>
          <a href="#/crew"><b>${c.pot}c</b><small>🏺 Pot · Need ${needPerJob()}c</small></a>
          <a href="#/crew"><b>${c.exposure}</b><small>${eb.icon} Exposure · ${eb.name}</small></a>
          <a href="#/crew"><b>${c.trust}</b><small>${tb.icon} Trust · ${tb.name}</small></a>
        </div>
        ${c.job ? `<p class="callout">💼 A job is in progress. <a href="#/crew">Track it →</a></p>` : ''}
      </section>
      <section class="card">
        <h3>🧰 Characters</h3>
        ${chars.length ? `<ul class="char-list">${chars.map((x) => `<li><a href="#/characters/${x.id}">
          <b>${BACKGROUNDS.find((b) => b.id === x.background)?.icon || '🪪'} ${esc(x.name)}</b>
          <span class="muted small">L${charLevel(x)} · 🩸 ${x.wounds}/${maxWounds(x)} · 🪙 ${x.chips}c · ${traitsOf(x).map(traitIcon).join('')}</span></a></li>`).join('')}</ul>`
          : '<p class="muted">No characters yet. <a href="#/characters">Make one →</a></p>'}
      </section>
    </div>
  </div>`;
  el.querySelector('#home-roll').onclick = () => {
    el.querySelector('#home-roll-out').innerHTML = renderRoll(roll(0), 'test', { animate: true });
  };
}

const routes = {
  '': home,
  rules: renderRules,
  dice: renderDice,
  combat: renderCombat,
  characters: renderCharacters,
  crew: renderCrew,
};

let lastRoute = '';
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const [name, ...rest] = parts;
  const view = routes[name] || home;
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
  // Clear handlers left by the previous view.
  const sameRulesDoc = name === 'rules' && lastRoute.startsWith(`rules/${rest[0] || ''}`) && rest[0];
  if (!sameRulesDoc) {
    app.onclick = null; app.onchange = null; app.oninput = null;
    window.scrollTo(0, 0);
  }
  lastRoute = parts.join('/');
  document.body.dataset.view = name || 'home';
  view(app, rest);
}

window.addEventListener('hashchange', route);
route();
