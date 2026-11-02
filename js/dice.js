// Dice engine for the Project Society dice system (dice_system.md).
// Roll 2D6 plus one extra die per point of net modifier, keep the two highest
// (advantage) or lowest (disadvantage). 7+ passes. Net is capped at -3.

export const PENALTY_CAP = -3;

/** Cancel first, then cap. */
export function netOf(plus, minus) {
  return Math.max(plus - minus, PENALTY_CAP);
}

function d6() {
  // Unbiased die using crypto when available.
  if (globalThis.crypto?.getRandomValues) {
    const buf = new Uint8Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= 252);
    return (buf[0] % 6) + 1;
  }
  return 1 + Math.floor(Math.random() * 6);
}

export function rollD6() { return d6(); }

/** Roll a pool at the given net modifier. */
export function roll(net) {
  const n = Math.max(net, PENALTY_CAP);
  const count = 2 + Math.abs(n);
  const dice = Array.from({ length: count }, d6);
  const order = dice.map((v, i) => [v, i]).sort((a, b) => (n >= 0 ? b[0] - a[0] : a[0] - b[0]));
  const kept = [order[0][1], order[1][1]];
  const a = dice[kept[0]];
  const b = dice[kept[1]];
  const total = a + b;
  return { net: n, dice, kept, total, pass: total >= 7, crit: a === 6 && b === 6, fumble: a === 1 && b === 1 };
}

const cache = new Map();
/**
 * Exact distribution of the kept total at a net modifier.
 * Closed form for the top two of k dice, mirrored (v -> 7 - v) for keep-lowest.
 */
export function distribution(net) {
  const n = Math.max(net, PENALTY_CAP);
  if (cache.has(n)) return cache.get(n);
  const k = 2 + Math.abs(n);
  const N = 6 ** k;
  const sums = Array(13).fill(0);
  let crit = 0;
  let fumble = 0;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= a; b++) {
      const count = a === b
        ? a ** k - (a - 1) ** k - k * (a - 1) ** (k - 1)
        : k * (b ** (k - 1) - (b - 1) ** (k - 1));
      const p = count / N;
      // a >= b are the highest two dice. For keep-lowest, mirror faces.
      const [x, y] = n >= 0 ? [a, b] : [7 - a, 7 - b];
      sums[x + y] += p;
      if (x === 6 && y === 6) crit += p;
      if (x === 1 && y === 1) fumble += p;
    }
  }
  const pass = sums.slice(7).reduce((s, v) => s + v, 0);
  const result = {
    net: n,
    dice: k,
    sums,
    pass,
    fail: 1 - pass,
    crit,
    fumble,
    shaken: sums.slice(2, 7).reduce((s, v) => s + v, 0),
    wound: sums.slice(7, 12).reduce((s, v) => s + v, 0),
    critWound: sums[12],
  };
  cache.set(n, result);
  return result;
}

export const pct = (p, digits = 1) => {
  if (p > 0 && p < 0.0005) return '~0%';
  if (p < 1 && p > 0.9995) return '~100%';
  return `${(p * 100).toFixed(digits)}%`;
};

export const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

export const poolLabel = (net) => {
  const n = Math.max(net, PENALTY_CAP);
  if (n === 0) return '2D6';
  return `${2 + Math.abs(n)}D6 keep ${n > 0 ? 'highest' : 'lowest'} two`;
};

/** Injury Table reading of a wound roll total. */
export function injury(total) {
  if (total >= 12) return { key: 'crit', icon: '🔴', label: 'Critical Wound', text: '3 wounds and a free attack' };
  if (total >= 7) return { key: 'wound', icon: '🟠', label: 'Wounded', text: '1 wound' };
  return { key: 'shaken', icon: '🟡', label: 'Shaken', text: '-1 dice until the end of combat (at -3, 1 wound instead)' };
}

const PIPS = {
  1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};
export function dieFace(v, kept = true, extraClass = '') {
  const pips = Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i + 1) ? 'on' : ''}"></i>`).join('');
  return `<span class="die ${kept ? 'kept' : 'dropped'} ${extraClass}" title="${v}${kept ? ' (kept)' : ''}" aria-label="${v}">${pips}</span>`;
}

/** HTML for a roll result. mode: 'test' | 'hit' | 'wound' | 'survival' */
export function renderRoll(r, mode = 'test', opts = {}) {
  const dice = r.dice.map((v, i) => dieFace(v, r.kept.includes(i), opts.animate ? 'roll-in' : '')).join('');
  let verdict;
  if (mode === 'wound') {
    const inj = injury(r.total);
    verdict = `<span class="verdict v-${inj.key}">${inj.icon} ${inj.label}</span><span class="muted">${inj.text}</span>`;
  } else if (mode === 'survival') {
    verdict = r.pass
      ? `<span class="verdict v-pass">✅ Survives</span><span class="muted">${r.crit ? '−2 wounds, no Scar' : '−1 wound, gain a Scar'}</span>`
      : '<span class="verdict v-fail">⚰️ Dies</span>';
  } else {
    const word = mode === 'hit' ? (r.pass ? 'Hit' : 'Miss') : r.pass ? 'Pass' : 'Fail';
    verdict = `<span class="verdict ${r.pass ? 'v-pass' : 'v-fail'}">${r.pass ? '✅' : '❌'} ${word}</span>`;
  }
  const flags = [];
  if (r.crit) {
    const critText = { hit: ': +1 dice on the wound roll', test: ': the DM narrates, you get a say', survival: ': survives without a Scar' }[mode] || '';
    flags.push(`<span class="flag crit">💥 Critical${critText}</span>`);
  }
  if (r.fumble) flags.push(`<span class="flag fumble">💀 Fumble${mode === 'survival' ? ': just a fail out of combat' : ': in combat, the turn ends'}</span>`);
  return `<div class="roll-result">
    <div class="dice-row">${dice}</div>
    <div class="roll-total"><b>${r.total}</b> ${verdict}</div>
    <div class="roll-meta muted">${poolLabel(r.net)} · net ${signed(r.net)}</div>
    ${flags.join('')}
  </div>`;
}
