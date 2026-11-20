import { LEVELS } from './levels.js?v=end-family-1';
import { advanceEffects, BLAST_LIFETIME, monsterSpeed, resetSkill, startDancing } from './monster-rules.js?v=living-worlds-1';
import { createDragon, flyDragon } from './dragon-rules.js?v=dragon-flight-1';

// Positions use tile centers as integer coordinates. All clocks use active game seconds.
const STEPS = {
  left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
};
const REVERSE = { left: 'right', right: 'left', up: 'down', down: 'up' };

function actor([x, y]) {
  return { x, y, dir: null, target: null };
}

function reverse(actor) {
  const [dx, dy] = STEPS[actor.dir];
  actor.target = [actor.target[0] - dx, actor.target[1] - dy];
  actor.dir = REVERSE[actor.dir];
}

function countdown(value, seconds) {
  return value <= seconds + 1e-8 ? 0 : value - seconds;
}

const TIMERS = ['time', 'cooldown', 'invulnerable', 'levitation', 'slow', 'rideRemaining', 'boost', 'attack', 'fear', 'invisible'];
const LIVE_FIELDS = [...TIMERS, 'lives', 'player', 'monsters', 'dragon', 'effects', 'blastBursts', 'lastPickup', 'solo', 'guitarStartedAt'];
const direction = d => typeof d === 'string' && Object.hasOwn(STEPS, d);
const numbers = (obj, ...keys) => obj && keys.every(k => Number.isFinite(obj[k]));
const cellsAre = (cells, check) => Array.isArray(cells) && cells.every(check);
const pick = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj[k]]));

function validProgress(p, state) {
  if (!p || !TIMERS.every(k => Number.isFinite(p[k]) && p[k] >= 0) ||
      !Number.isInteger(p.lives) || p.lives < 1 || p.lives > 3 ||
      typeof p.waiting !== 'boolean' || !(p.queued === null || direction(p.queued)) ||
      (p.rideRemaining > 0 && !state.ride)) return false;
  const point = o => numbers(o, 'x', 'y') && o.x >= 0 && o.x < state.width && o.y >= 0 && o.y < state.height;
  const tile = c => Array.isArray(c) && c.length >= 2 && c.slice(0, 2).every(Number.isInteger) && state.map[c[1]]?.[c[0]] === '.';
  function validActor(a, airborne = false) {
    if (!point(a) || !(a.dir === null || direction(a.dir))) return false;
    if (a.target === null) return airborne || tile([a.x, a.y]);
    if (!tile(a.target) || !direction(a.dir)) return false;
    const [tx, ty] = a.target, [dx, dy] = STEPS[a.dir];
    const distance = (tx - a.x) * dx + (ty - a.y) * dy;
    return tile([tx - dx, ty - dy]) && Math.abs((tx - a.x) * dy - (ty - a.y) * dx) < 1e-6 &&
      distance >= -1e-6 && distance <= 1 + 1e-6;
  }
  if (!validActor(p.player) || !Array.isArray(p.gems) || !p.gems.length ||
      new Set(p.gems).size !== p.gems.length || !p.gems.every(id => state.gems.has(id))) return false;

  function validMonster(m, i) {
    if (!validActor(m, Boolean(m?.leap)) || m.type !== state.monsters[i].type ||
        !numbers(m, 'stun', 'dance', 'skillCooldown', 'windup')) return false;
    if (m.leap !== null && !(m.type === 'magma_cube' && tile(m.leap?.from) &&
        tile(m.leap?.to) && numbers(m.leap, 'progress') && m.leap.progress >= 0 && m.leap.progress <= 1)) return false;
    if (m.cells !== null && !cellsAre(m.cells, tile)) return false;
    if (m.windup === 0) return m.aim === null;
    if (!point(m.aim) || !tile([m.aim.x, m.aim.y])) return false;
    if (['creeper', 'elder_guardian', 'wither_skeleton', 'pumpkin_guard'].includes(m.type) && !m.cells?.length) return false;
    return ['creeper', 'elder_guardian', 'enderman'].includes(m.type) || direction(m.aim.dir);
  }
  if (!Array.isArray(p.monsters) || p.monsters.length !== state.monsters.length || !p.monsters.every(validMonster)) return false;
  const area = ['blast', 'pulse', 'lantern', 'wither_slash'];
  const projectiles = ['fireball', 'shulker_bolt', 'arrow', 'ember'];
  if (!Array.isArray(p.effects) || !p.effects.every(e => point(e) && numbers(e, 'remaining') &&
      (area.includes(e.type) ? cellsAre(e.cells, tile) : projectiles.includes(e.type) ? direction(e.dir) :
        ['slow_pool', 'dragon_breath'].includes(e.type)))) return false;
  if (!Array.isArray(p.blastBursts) || !p.blastBursts.every(b => point(b) && numbers(b, 'at') && cellsAre(b.cells, tile))) return false;
  if (!(p.lastPickup === null || (point(p.lastPickup) && numbers(p.lastPickup, 'time'))) ||
      !(p.guitarStartedAt === null || Number.isFinite(p.guitarStartedAt)) ||
      !(p.solo === null || (point(p.solo) && numbers(p.solo, 'age', 'front', 'radius', 'speed') &&
        cellsAre(p.solo.cells, c => tile(c) && Number.isInteger(c[2]))))) return false;
  const d = p.dragon;
  if (!state.dragon) return d === null;
  return numbers(d, 'x', 'y', 'altitude', 'pitch', 'dive', 'age', 'cooldown', 'windup') &&
    ['left','right'].includes(d.dir) && ['patrol','warning','dive','breathing','climb'].includes(d.phase) &&
    cellsAre(d.cells, tile) && (d.phase === 'patrol' || numbers(d, 'fromX', 'fromY', 'entryX', 'entryY', 'passDirection')) &&
    (['patrol','climb'].includes(d.phase) || d.cells.length > 0);
}

export function restoreGame(save) {
  if (save?.version !== 1 || typeof save.level !== 'string' || !Object.hasOwn(LEVELS, save.level)) return null;
  return createGame(save.hero, save.level, save);
}

export function createGame(hero = 'kirill', levelId = 'temple', save = null) {
  const state = {
    hero: ['kirill', 'maxim', 'mom', 'dad', 'pasha'].includes(hero) ? hero : 'kirill',
    status: 'ready', lives: 3, time: 0, cooldown: 0,
  };
  let level;
  let queued;
  let waiting;
  const fields = new Map();
  const tileKey = (x, y) => y * state.width + x;
  const isFloor = (x, y) => state.map[y]?.[x] === '.';

  function exits(x, y) {
    return Object.keys(STEPS).filter(dir => {
      const [dx, dy] = STEPS[dir];
      return isFloor(x + dx, y + dy);
    });
  }

  // Reuse the shortest corridor distance from each target to every other tile.
  function distancesFrom(x, y) {
    const key = tileKey(x, y);
    if (fields.has(key)) return fields.get(key);
    const distances = new Int16Array(state.width * state.height).fill(-1);
    distances[key] = 0;
    const queue = [[x, y]];
    for (let head = 0; head < queue.length; head++) {
      const [cx, cy] = queue[head];
      for (const dir of exits(cx, cy)) {
        const [dx, dy] = STEPS[dir];
        const next = tileKey(cx + dx, cy + dy);
        if (distances[next] !== -1) continue;
        distances[next] = distances[tileKey(cx, cy)] + 1;
        queue.push([cx + dx, cy + dy]);
      }
    }
    fields.set(key, distances);
    return distances;
  }

  function distance(x, y, tx, ty) {
    return distancesFrom(x, y)[tileKey(tx, ty)];
  }

  function resetPositions() {
    state.player = actor(level.start);
    state.lastPickup = null;
    state.monsters = level.monsters.map(beast => ({
      ...actor(beast.start), type: beast.type, stun: 0, dance: 0,
    }));
    state.monsters.forEach(resetSkill);
    state.dragon = level.dragon ? createDragon() : null;
    state.effects = [];
    state.levitation = 0;
    state.slow = 0;
    state.rideRemaining = 0;
    state.solo = null;
    state.guitarStartedAt = null;
    state.boost = 0;
    state.attack = 0;
    state.fear = 0;
    state.invisible = 0;
    queued = null;
    waiting = true;
  }

  function loadLevel(id) {
    level = LEVELS[id];
    state.levelId = id;
    state.map = level.map;
    state.width = level.map[0].length;
    state.height = level.map.length;
    state.decorations = level.decorations;
    // A burst stays at its original cell if the player respawns on the impact frame.
    state.blastBursts = [];
    state.bridges = level.bridges ?? [];
    state.ride = level.ride ?? null;
    fields.clear();
    state.gems = new Set();
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        if (isFloor(x, y) && (x + y) % 2 === 1) state.gems.add(tileKey(x, y));
      }
    }
    state.totalGems = state.gems.size;
    state.collected = 0;
    state.invulnerable = 0;
    resetPositions();
  }
  loadLevel(Object.hasOwn(LEVELS, levelId) ? levelId : 'temple');

  if (save) {
    const p = save.progress;
    if (state.hero !== save.hero || !validProgress(p, state)) return null;
    Object.assign(state, structuredClone(pick(p, LIVE_FIELDS)));
    state.gems = new Set(p.gems);
    state.collected = state.totalGems - state.gems.size;
    state.status = 'paused';
    queued = p.queued;
    waiting = p.waiting;
  }

  function snapshot() {
    if (!['playing', 'paused'].includes(state.status)) return null;
    const progress = structuredClone(pick(state, LIVE_FIELDS));
    return { version: 1, hero: state.hero, level: state.levelId,
      progress: { ...progress, gems: [...state.gems], queued, waiting } };
  }

  function nextSnapshot() {
    if (state.status !== 'won' || !level.next) return null;
    const next = createGame(state.hero, level.next);
    Object.assign(next.state, pick(state, ['time', 'lives', 'cooldown']));
    next.start();
    return next.snapshot();
  }

  function turn(dir) {
    if (state.status !== 'playing' || !Object.hasOwn(STEPS, dir)) return;
    const player = state.player;
    // A reversal can happen between tiles. Perpendicular turns wait for a junction.
    if (player.target && REVERSE[player.dir] === dir) {
      reverse(player);
      queued = null;
      return;
    }
    queued = dir;
  }

  // Finish each edge exactly at its tile center before choosing the next turn.
  function move(actor, distance, choose, arrive) {
    while (distance > 1e-8) {
      if (!actor.target) {
        const dir = choose(actor, exits(actor.x, actor.y));
        if (!dir) {
          actor.dir = null;
          return;
        }
        actor.dir = dir;
        const [dx, dy] = STEPS[dir];
        actor.target = [actor.x + dx, actor.y + dy];
      }
      const [tx, ty] = actor.target;
      const remaining = Math.abs(tx - actor.x) + Math.abs(ty - actor.y);
      if (distance + 1e-8 < remaining) {
        const [dx, dy] = STEPS[actor.dir];
        actor.x += dx * distance;
        actor.y += dy * distance;
        return;
      }
      actor.x = tx;
      actor.y = ty;
      actor.target = null;
      distance -= remaining;
      if (arrive) arrive(tx, ty);
    }
  }

  function steerPlayer(player, options) {
    const ride = state.ride;
    if (ride && queued === ride.direction && player.x === ride.entry[0] && player.y === ride.entry[1]) {
      state.rideRemaining = ride.duration;
      queued = null;
      waiting = false;
      return null;
    }
    if (options.includes(queued)) {
      const dir = queued;
      queued = null;
      waiting = false;
      return dir;
    }
    return options.includes(player.dir) ? player.dir : null;
  }

  function steerMonster(monster, options, index) {
    // Frightened monsters can turn back at any junction to get farther away.
    if (state.fear === 0 && options.length > 1) {
      options = options.filter(dir => dir !== REVERSE[monster.dir]);
    }
    const beast = level.monsters[index];
    let x = Math.round(state.player.x);
    let y = Math.round(state.player.y);
    // Patrol breaks open escape routes. The spider occasionally aims one tile ahead.
    const guarding = beast.type === 'guardian' && distance(x, y, ...beast.patrol) > 5;
    const patrolTime = beast.type !== 'zombie' && beast.type !== 'guardian' && (state.time + index * 3) % 19 > 13;
    if (state.invisible > 0 || (state.fear === 0 && (guarding || patrolTime))) {
      [x, y] = beast.patrol;
    } else if (state.fear === 0 && beast.type === 'spider' && state.player.dir) {
      const [dx, dy] = STEPS[state.player.dir];
      if (isFloor(x + dx, y + dy)) {
        x += dx;
        y += dy;
      }
    }
    const distances = distancesFrom(x, y);
    function cost(dir) {
      const [dx, dy] = STEPS[dir];
      return distances[tileKey(monster.x + dx, monster.y + dy)];
    }
    if (state.fear > 0) {
      return options.reduce((best, dir) => cost(dir) > cost(best) ? dir : best);
    }
    return options.reduce((best, dir) => cost(dir) < cost(best) ? dir : best);
  }

  function collect(x, y) {
    if (!state.gems.delete(tileKey(x, y))) return;
    state.collected++;
    state.lastPickup = { x, y, time: state.time };
    if (!state.gems.size) state.status = 'won';
  }

  function hitNearby() {
    for (const monster of state.monsters) {
      if (monster.stun > 0) continue;
      const dx = state.player.x - monster.x;
      const dy = state.player.y - monster.y;
      // Within this reach a one-tile wall cannot separate the two corridors.
      if (Math.abs(dx) + Math.abs(dy) <= 1.55) monster.stun = 4;
    }
  }

  function playSolo() {
    const x = Math.round(state.player.x), y = Math.round(state.player.y);
    const distances = distancesFrom(x, y);
    // The opening chord reaches the next tile immediately, even during a close chase.
    const radius = 6, speed = (radius - 1) / 0.6;
    const cells = [];
    distances.forEach((steps, tile) => {
      if (steps >= 0 && steps <= radius) {
        cells.push([tile % state.width, Math.floor(tile / state.width), steps]);
      }
    });
    state.guitarStartedAt = state.time;
    state.solo = { x, y, age: 0, front: 1, radius, speed, cells };
    advanceSolo(0);
  }

  function advanceSolo(seconds) {
    const solo = state.solo;
    if (!solo) return;
    const expanding = solo.front < solo.radius;
    solo.age += seconds;
    if (expanding) {
      solo.front = Math.min(solo.radius, 1 + solo.age * solo.speed);
      const distances = distancesFrom(solo.x, solo.y);
      for (const monster of state.monsters) {
        const steps = distances[tileKey(Math.round(monster.x), Math.round(monster.y))];
        if (!monster.leap && monster.dance === 0 && steps >= 0 && steps <= solo.front + 1e-8) {
          startDancing(monster);
        }
      }
    }
    if (solo.age >= 1.1 - 1e-8) state.solo = null;
  }

  function activate() {
    if (state.status !== 'playing' || state.cooldown > 0 || state.rideRemaining > 0) return false;
    state.cooldown = 30;
    switch (state.hero) {
      case 'pasha':
        playSolo();
        break;
      case 'kirill':
        state.boost = 4;
        break;
      case 'maxim':
        state.attack = 0.32;
        hitNearby();
        break;
      case 'mom':
        state.levitation = 0;
        state.slow = 0;
        state.invisible = 4;
        break;
      case 'dad': {
        state.levitation = 0;
        state.slow = 0;
        state.fear = 3;
        waiting = false;
        const distances = distancesFrom(Math.round(state.player.x), Math.round(state.player.y));
        for (const monster of state.monsters) {
          if (!monster.target) continue;
          const [x, y] = monster.target;
          const [dx, dy] = STEPS[monster.dir];
          if (distances[tileKey(x, y)] < distances[tileKey(x - dx, y - dy)]) {
            reverse(monster);
          }
        }
        break;
      }
    }
    return true;
  }

  function step(seconds) {
    state.time += seconds;
    while (state.blastBursts.length && state.time - state.blastBursts[0].at >= BLAST_LIFETIME) {
      state.blastBursts.shift();
    }
    const speed = (state.boost > 0 ? 6.2 : 3.8) * (state.slow > 0 ? 0.65 : 1);
    state.slow = countdown(state.slow, seconds);
    state.levitation = countdown(state.levitation, seconds);
    state.cooldown = countdown(state.cooldown, seconds);
    state.boost = countdown(state.boost, seconds);
    state.invulnerable = countdown(state.invulnerable, seconds);
    if (state.rideRemaining === 0) move(state.player, seconds * speed, steerPlayer, collect);
    if (state.rideRemaining > 0) {
      state.rideRemaining = countdown(state.rideRemaining, seconds);
      if (state.rideRemaining === 0) {
        [state.player.x, state.player.y] = state.ride.exit;
        collect(state.player.x, state.player.y);
      }
    }
    if (state.status === 'won') return;
    for (const monster of state.monsters) monster.dance = countdown(monster.dance, seconds);
    advanceSolo(seconds);
    state.monsters.forEach((monster, index) => {
      if (waiting) {
        monster.stun = countdown(monster.stun, seconds);
        return;
      }
      const definition = level.monsters[index];
      const speedFactor = monsterSpeed(state, index, definition, seconds, isFloor, distance);
      monster.stun = countdown(monster.stun, seconds);
      if (speedFactor > 0) {
        move(monster, seconds * definition.speed * speedFactor,
          (actor, options) => steerMonster(actor, options, index));
      }
    });
    if (state.attack > 0) hitNearby();
    if (state.dragon) flyDragon(state, seconds, !waiting);
    const effectHit = advanceEffects(state, seconds, isFloor);
    state.attack = countdown(state.attack, seconds);
    state.invisible = countdown(state.invisible, seconds);
    state.fear = countdown(state.fear, seconds);
    if (waiting || state.rideRemaining > 0 || state.invulnerable > 0 || state.invisible > 0 || state.fear > 0) return;
    const touched = state.monsters.some(monster => monster.dance === 0 && monster.type !== 'shulker' && monster.type !== 'creeper' && !monster.leap && monster.stun === 0 &&
      Math.hypot(monster.x - state.player.x, monster.y - state.player.y) < 0.58);
    if (!touched && !effectHit) return;
    if (--state.lives === 0) {
      state.status = 'lost';
      return;
    }
    state.invulnerable = 2;
    resetPositions();
  }

  return {
    state, turn, activate, snapshot, nextSnapshot,
    nextLevel() {
      if (state.status !== 'won' || !level.next) return false;
      loadLevel(level.next);
      state.status = 'playing';
      return true;
    },
    start() { if (state.status === 'ready') state.status = 'playing'; },
    pause() { if (state.status === 'playing') state.status = 'paused'; },
    resume() { if (state.status === 'paused') state.status = 'playing'; },
    update(seconds) {
      if (!Number.isFinite(seconds)) return;
      // Small steps keep collision checks reliable even on slower mobile displays.
      while (state.status === 'playing' && seconds > 1e-8) {
        const slice = Math.min(seconds, 1 / 60);
        step(slice);
        seconds -= slice;
      }
    },
  };
}
