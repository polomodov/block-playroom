// Positions are in tiles. Only a deposited cloud on a marked floor tile can hurt the hero.
const WARNING = 1.35;
const DIVE = .85;
const CLIMB = 1.15;
const HIGH = 1.75;
const LOW = .5;
export const BREATH_REACH = 1.25;
const SWEEP_SPEED = 6.8;
export const BREATH_LIFETIME = 3;

const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

export function createDragon() {
  return {
    x: 2, y: 3.5, dir: 'right', altitude: HIGH, pitch: 0, dive: 0,
    phase: 'patrol', age: 0, cooldown: 2.1, windup: 0, cells: [], lastDrop: null,
  };
}

function beginPhase(dragon, phase) {
  dragon.phase = phase;
  dragon.age = 0;
  dragon.fromX = dragon.x;
  dragon.fromY = dragon.y;
}

function startPass(state, dragon) {
  const x = Math.round(state.player.x), row = Math.round(state.player.y);
  const floor = [...state.map[row]].flatMap((tile, col) => tile === '.' ? [col] : []);
  floor.sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
  for (const col of floor) {
    if (dragon.cells.every(([other]) => Math.abs(col - other) >= 2)) dragon.cells.push([col, row]);
    if (dragon.cells.length === 3) break;
  }
  if (!dragon.cells.length) return;
  dragon.cells.sort(([a], [b]) => a - b);
  const first = dragon.cells[0][0], last = dragon.cells.at(-1)[0];
  // Leave room inside the board for the approach, even beside an outer wall.
  const comingFromLeft = last > state.width - 5 || (first >= 4 && dragon.x < (first + last) / 2);
  if (!comingFromLeft) dragon.cells.reverse();
  dragon.passDirection = comingFromLeft ? 1 : -1;
  dragon.entryX = dragon.cells[0][0] - dragon.passDirection * (BREATH_REACH + 4.1);
  dragon.entryY = Math.max(2.3, row - 2.2);
  dragon.dir = dragon.entryX >= dragon.x ? 'right' : 'left';
  dragon.windup = WARNING;
  dragon.lastDrop = null;
  beginPhase(dragon, 'warning');
}

export function flyDragon(state, seconds, playerHasMoved) {
  const dragon = state.dragon;
  const canBreathe = playerHasMoved && !state.invisible && !state.fear;
  if (!canBreathe && dragon.phase !== 'patrol') {
    dragon.cells = [];
    dragon.lastDrop = null;
    dragon.windup = 0;
    dragon.cooldown = 2.1;
    beginPhase(dragon, 'patrol');
  }
  dragon.age += seconds;
  const dir = dragon.dir === 'right' ? 1 : -1;
  if (dragon.phase === 'patrol') {
    dragon.x += dir * 3.6 * seconds;
    if (dragon.x > state.width - 1.2) dragon.dir = 'left';
    if (dragon.x < .2) dragon.dir = 'right';
    const lane = state.height * (.43 + .20 * Math.sin(state.time * .48));
    dragon.y = mix(dragon.y, lane, seconds * .85);
    dragon.altitude = mix(dragon.altitude, HIGH, seconds * 3);
    dragon.pitch = mix(dragon.pitch, 0, seconds * 4);
    dragon.dive = mix(dragon.dive, 0, seconds * 4);
    if (canBreathe) dragon.cooldown = Math.max(0, dragon.cooldown - seconds);
    if (canBreathe && dragon.cooldown === 0) startPass(state, dragon);
  } else if (dragon.phase === 'warning') {
    const t = Math.min(1, dragon.age / WARNING);
    dragon.windup = Math.max(0, WARNING - dragon.age);
    dragon.x = mix(dragon.fromX, dragon.entryX, smooth(t));
    dragon.y = mix(dragon.fromY, dragon.entryY, smooth(t));
    dragon.altitude = HIGH + .35 * Math.sin(t * Math.PI);
    dragon.pitch = -.17 * Math.sin(t * Math.PI);
    if (t === 1) {
      dragon.dir = dragon.passDirection > 0 ? 'right' : 'left';
      beginPhase(dragon, 'dive');
    }
  } else if (dragon.phase === 'dive') {
    const t = Math.min(1, dragon.age / DIVE), arc = Math.sin(t * Math.PI);
    const [x, row] = dragon.cells[0];
    dragon.x = mix(dragon.fromX, x - dir * BREATH_REACH, t * (.35 + .65 * t));
    dragon.y = mix(dragon.fromY, row, smooth(t));
    dragon.altitude = mix(HIGH, LOW, smooth(t));
    dragon.pitch = .58 * arc + .09 * t;
    dragon.dive = .88 * arc + .18 * t;
    if (t === 1) beginPhase(dragon, 'breathing');
  } else if (dragon.phase === 'breathing') {
    dragon.x += dir * SWEEP_SPEED * seconds;
    const [x, y] = dragon.cells[0];
    if ((dragon.x + dir * BREATH_REACH - x) * dir >= 0) {
      state.effects.push({ type: 'dragon_breath', x, y, remaining: BREATH_LIFETIME });
      dragon.lastDrop = { x, y, at: state.time };
      dragon.cells.shift();
      if (!dragon.cells.length) beginPhase(dragon, 'climb');
    }
  } else if (dragon.phase === 'climb') {
    const t = Math.min(1, dragon.age / CLIMB), arc = Math.sin(t * Math.PI);
    const room = dir > 0 ? state.width - 2 - dragon.fromX : dragon.fromX - 1;
    dragon.x = dragon.fromX + dir * Math.min(4, Math.max(0, room)) * t;
    dragon.y = mix(dragon.fromY, state.height * .45, smooth(t) * .55);
    dragon.altitude = mix(LOW, HIGH, smooth(t));
    dragon.pitch = .09 * (1 - t) - .52 * arc;
    dragon.dive = .18 * (1 - t);
    if (t === 1) {
      dragon.cooldown = 3.7;
      dragon.lastDrop = null;
      beginPhase(dragon, 'patrol');
    }
  }
}
