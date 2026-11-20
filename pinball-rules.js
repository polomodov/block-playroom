// Centres and radii in logical playfield pixels. The slings are the two
// powered faces of the triangular rubber assemblies, ordered left, right.
export const pinballFeatures = {
  bank: [[72, 271, 13], [155, 254, 13], [235, 270, 13]],
  jackpot: [164, 56, 19],
  skill: [218, 36, 9],
  slings: [[92, 363, 49, 302], [237, 361, 278, 298]],
};
export const skillPower = {
  aqua: [71, 77], end: [62, 68], temple: [57, 63], arcade: [60, 66],
  store: [65, 71], nether: [76, 82], castle: [66, 72],
};

const windowSeconds = 18;
export function newPinballRules() {
  return { bank: 0, jackpotTime: 0, multiplier: 1, jackpots: 0, slings: [0, 0],
    skillArmed: false, lastSkillTick: -1000, lastJackpotTick: -1000 };
}

// Rehydrate old v1 tables with an unlit feature bank; these lamps are independent
// of the original three pop bumpers, whose progress stays in saved.hits.
export function restorePinballRules(saved) {
  const defaults = newPinballRules();
  const valid = (value, low, high) => Number.isFinite(value) && value >= low && value <= high;
  const bank = saved.bank;
  if (Number.isInteger(bank) && valid(bank, 0, 7)) defaults.bank = bank;
  if (defaults.bank === 7) {
    if (valid(saved.jackpotTime, Number.EPSILON, windowSeconds)) defaults.jackpotTime = saved.jackpotTime;
    else defaults.bank = 0;
  }
  if (Number.isInteger(saved.multiplier) && valid(saved.multiplier, 1, 4)) defaults.multiplier = saved.multiplier;
  if (Number.isSafeInteger(saved.jackpots) && saved.jackpots >= 0) defaults.jackpots = saved.jackpots;
  if (Array.isArray(saved.slings) && saved.slings.length === 2 && saved.slings.every(s => valid(s, 0, .24))) {
    defaults.slings = [...saved.slings];
  }
  defaults.skillArmed = saved.phase === 'play' && saved.skillArmed === true;
  for (const key of ['lastSkillTick', 'lastJackpotTick']) {
    if (Number.isSafeInteger(saved[key]) && valid(saved[key], -1000, saved.ticks)) defaults[key] = saved[key];
  }
  return defaults;
}

export function announce(state, notify, kind, index) {
  state.event = (kind === 'bumper' ? 'hit' : kind) + (index ?? '');
  notify?.(kind, index);
}

export function resetBank(s) {
  s.bank = 0;
  s.jackpotTime = 0;
}

export function stepPinballTimers(s, dt, notify) {
  for (let i = 0; i < 2; i++) s.slings[i] = Math.max(0, s.slings[i] - dt);
  // Players cannot steer during a captured ride.
  if (!s.jackpotTime || s.phase !== 'play') return;
  s.jackpotTime = Math.max(0, s.jackpotTime - dt);
  if (s.jackpotTime < 1e-9) {
    resetBank(s);
    s.multiplier = 1;
    announce(s, notify, 'expired');
  }
}

function rolledOver(ball, [x, y, radius]) {
  return (ball.x - x) ** 2 + (ball.y - y) ** 2 <= radius ** 2;
}

export function scoreRollovers(s, oldX, oldY, notify) {
  const b = s.ball;
  const [x, y, r] = pinballFeatures.skill;
  if (s.skillArmed && oldX >= x && b.x < x) {
    s.skillArmed = false;
    const atY = oldY + (b.y - oldY) * (x - oldX) / (b.x - oldX);
    const [low, high] = skillPower[s.table];
    if (s.power >= low && s.power <= high && Math.abs(atY - y) <= r) {
      s.score += 150 * s.multiplier;
      s.lastSkillTick = s.ticks;
      announce(s, notify, 'skill');
    }
  }
  if (s.skillArmed && b.x < 310 && b.y > 110) s.skillArmed = false;

  if (s.jackpotTime > 0) {
    if (rolledOver(b, pinballFeatures.jackpot)) {
      s.score += 500 * s.multiplier;
      s.jackpots++;
      s.multiplier = Math.min(4, s.multiplier + 1);
      s.lastJackpotTick = s.ticks;
      resetBank(s);
      // The top scoop kicks the ball back towards the lower playfield.
      const [x, y, r] = pinballFeatures.jackpot;
      Object.assign(b, { x: x + 7, y: y + r + 6, vx: 95, vy: 192 });
      announce(s, notify, 'jackpot');
    }
    return;
  }

  for (const [i, target] of pinballFeatures.bank.entries()) {
    if ((s.bank & (1 << i)) || !rolledOver(b, target)) continue;
    s.bank |= 1 << i;
    s.score += 60 * s.multiplier;
    announce(s, notify, 'target', i);
    if (s.bank === 7) {
      s.jackpotTime = windowSeconds;
      announce(s, notify, 'armed');
    }
  }
}
