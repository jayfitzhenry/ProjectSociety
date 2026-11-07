// Counting dice for the Project Society dice system (dice_system.md, dice_modifiers.md).
// The app doesn't roll: players roll real dice. This only works out how many to roll.
// Roll 2D6 plus one extra die per point of net modifier, keep the two highest (bonus)
// or the two lowest (penalty). 7+ passes. The net is capped at -3, after cancelling.

export const PENALTY_CAP = -3;

/** Cancel first, then cap. */
export function netOf(plus, minus) {
  return Math.max(plus - minus, PENALTY_CAP);
}

export const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** How many dice to roll at a net modifier, and which two to keep. */
export function pool(net) {
  const n = Math.max(net, PENALTY_CAP);
  return {
    net: n,
    count: 2 + Math.abs(n),
    keep: n > 0 ? 'keep the two highest' : n < 0 ? 'keep the two lowest' : 'add them up',
  };
}

export const poolLabel = (net) => {
  const p = pool(net);
  return p.net === 0 ? '2D6' : `${p.count}D6, ${p.keep}`;
};
