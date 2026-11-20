import { HEROES, WORLDS } from './worlds.js';

const LANES = [-1, 0, 1];
const JUMP_SECONDS = .78;
const LANDING_SECONDS = .16;
const END_OF_LANDING = JUMP_SECONDS + LANDING_SECONDS;
const SLIDE_SECONDS = .82;
const FAST_DROP_SECONDS = .12;
const POWER_DURATION = { kirill: 4, maxim: 4, mom: 4, dad: 3, pasha: 5 };
const COOLDOWN = 30;

// Each row occupies at most two tracks at the same distance. The empty track
// carries an emerald trail. Even at top boost there is time to cross two lanes.
const PATTERNS = [
  ['barrier'], ['arch', 'monster'], ['block', 'barrier'], ['monster'],
  ['barrier', 'arch'], ['block', 'monster'], ['arch'], ['monster', 'barrier'],
];

export function createRun({ worldId = 'temple', heroId = 'kirill', seed = Math.floor(Math.random() * 0x100000000) } = {}, saved = null) {
  const world = WORLDS.find(item => item.id === worldId) ?? WORLDS[0];
  const hero = HEROES.find(item => item.id === heroId) ?? HEROES[0];
  let randomState = seed >>> 0;
  function random() {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let t = Math.imul(randomState ^ randomState >>> 15, randomState | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  // One clock drives the flight arc and the short footfall that follows it.
  let jumpAge = END_OF_LANDING;
  const player = {
    lane: 0, x: 0, jump: 0, slide: 0,
    get jumpProgress() {
      return jumpAge < JUMP_SECONDS ? jumpAge / JUMP_SECONDS : null;
    },
    get landingProgress() {
      if (this.slide > 0 || jumpAge < JUMP_SECONDS || jumpAge >= END_OF_LANDING) return null;
      return (jumpAge - JUMP_SECONDS) / LANDING_SECONDS;
    },
  };
  const pursuer = { type: world.monsters[0], pressure: .82, dance: 0, flee: 0, stun: 0 };
  const state = {
    worldId: world.id, heroId: hero.id, seed: seed >>> 0, status: 'playing',
    distance: 0, speed: 14, time: 0, gems: 0, lives: 3,
    cooldown: 0, powerTime: 0, invulnerable: 0, player, pursuer, objects: [], dragon: null,
  };
  let nextZ = 30, row = 0, sequence = 0;
  const choose = items => items[Math.floor(random() * items.length)];

  function place(kind, lane, z, type = kind) {
    state.objects.push({ id: ++sequence, kind, type, lane, z, hit: false, passed: false,
      dance: 0, stun: 0, flee: 0, active: kind !== 'breath' });
  }

  function fillTrack() {
    while (nextZ < state.distance + 116) {
      const safe = row === 0 ? 0 : choose(LANES);
      const occupied = LANES.filter(lane => lane !== safe);
      if (random() < .5) occupied.reverse();
      // Introduce a world encounter early, then repeat with fresh approach lanes.
      const encounter = row % 6 === 2;
      const pattern = row === 0 ? ['barrier'] : choose(PATTERNS);
      if (encounter && world.id === 'end') {
        place('breath', occupied[0], nextZ, 'dragon_breath');
        place('monster', occupied[1], nextZ, choose(world.monsters));
      } else if (encounter && world.id === 'nether') {
        place('barrier', occupied[0], nextZ, 'fireball');
        place('monster', occupied[0], nextZ + 8, 'ghast');
        place('monster', occupied[1], nextZ, 'magma_cube');
      } else {
        // Signature set pieces pair a themed obstacle with a resident monster.
        const kinds = encounter ? ['block', 'monster'] : pattern;
        kinds.forEach((kind, i) => {
          const type = kind === 'monster' ? choose(world.monsters) : world[kind];
          place(kind, occupied[i], nextZ, type);
        });
      }
      const trailEnd = encounter && world.id === 'nether' ? 10 : 5;
      for (const offset of [-6, 0, trailEnd]) place('gem', safe, nextZ + offset);
      nextZ += 22 + Math.floor(random() * 6);
      row++;
    }
  }
  for (const z of [6, 12, 18]) place('gem', 0, z);
  fillTrack();

  function affectMonsters() {
    for (const obj of state.objects) {
      const dz = obj.z - state.distance;
      if (obj.kind !== 'monster' || obj.passed || dz < 0) continue;
      if (hero.id === 'pasha' && dz <= 32) obj.dance = 5;
      if (hero.id === 'dad' && dz <= 25) obj.flee = Math.max(obj.flee, state.powerTime);
      if (hero.id === 'maxim' && dz <= 11 && Math.abs(obj.lane - player.x) < 1.1) obj.stun = 4;
    }
  }

  function act(action) {
    if (action === 'resume' && state.status === 'paused') { state.status = 'playing'; return true; }
    if (state.status !== 'playing') return false;
    switch (action) {
      case 'pause': state.status = 'paused'; break;
      case 'left': player.lane = Math.max(-1, player.lane - 1); break;
      case 'right': player.lane = Math.min(1, player.lane + 1); break;
      case 'jump':
        if (jumpAge < JUMP_SECONDS) return false;
        player.slide = 0;
        jumpAge = 0;
        break;
      case 'slide':
        if (player.slide > 0) return false;
        // Both halves of the jump arc share the same height. Start descending
        // from the matching point, including when the swipe happens on the way up.
        jumpAge = Math.max(jumpAge, JUMP_SECONDS - jumpAge);
        player.slide = SLIDE_SECONDS;
        break;
      case 'power':
        if (state.cooldown > 0) return false;
        state.cooldown = COOLDOWN;
        state.powerTime = POWER_DURATION[hero.id];
        affectMonsters();
        if (pursuer.pressure > .32) {
          if (hero.id === 'pasha') pursuer.dance = state.powerTime;
          if (hero.id === 'dad') pursuer.flee = state.powerTime;
          if (hero.id === 'maxim') pursuer.stun = state.powerTime;
        }
        break;
      default: return false;
    }
    return true;
  }

  function updateDragon() {
    if (world.id !== 'end') return;
    const breath = state.objects.find(o => o.kind === 'breath' && o.z - state.distance <= 49 && o.z - state.distance > -8);
    if (!breath) { state.dragon = null; return; }
    const remaining = breath.z - state.distance;
    let phase, progress;
    if (remaining > 30) {
      phase = 'warning'; progress = (49 - remaining) / 19;
    } else if (remaining > 12) {
      phase = 'dive'; progress = (30 - remaining) / 18;
    } else {
      phase = 'recover'; progress = (12 - remaining) / 20;
    }
    state.dragon = { lane: breath.lane, z: breath.z, phase, progress };
    breath.active = remaining <= 14;
  }

  function cross(obj) {
    obj.passed = true;
    if (Math.abs(player.x - obj.lane) > .5) return;
    if (obj.kind === 'gem') {
      state.gems++;
      obj.hit = true;
      return;
    }
    if (state.invulnerable > 0 || !obj.active) return;
    switch (obj.kind) {
      case 'monster':
        if (obj.dance > 0 || obj.stun > 0 || obj.flee > 0 || (hero.id === 'mom' && state.powerTime > 0)) return;
        if (player.jump > .48) return;
        break;
      case 'arch': if (player.slide > 0) return; break;
      case 'breath':
      case 'barrier': if (player.jump > .34) return; break;
    }
    obj.hit = true;
    state.lives--;
    state.invulnerable = 1.65;
    pursuer.pressure = 1;
    if (state.lives === 0) {
      pursuer.dance = pursuer.flee = pursuer.stun = 0;
      state.status = 'over';
    }
  }

  const decay = (value, dt) => value <= dt + 1e-9 ? 0 : value - dt;
  function step(dt) {
    state.time += dt;
    state.cooldown = decay(state.cooldown, dt);
    state.powerTime = decay(state.powerTime, dt);
    state.invulnerable = decay(state.invulnerable, dt);
    pursuer.dance = decay(pursuer.dance, dt);
    pursuer.flee = decay(pursuer.flee, dt);
    pursuer.stun = decay(pursuer.stun, dt);
    // The chaser gains ground at a collision. Clean running opens the gap again.
    const escaping = pursuer.dance || pursuer.flee || pursuer.stun || (hero.id === 'mom' && state.powerTime > 0);
    pursuer.pressure = Math.max(.14, pursuer.pressure - dt * (escaping ? .36 : .17));
    const boosted = hero.id === 'kirill' && state.powerTime > 0;
    state.speed = (14 + 8 * state.distance / (state.distance + 700)) * (boosted ? 1.35 : 1);
    state.distance += state.speed * dt;
    const dx = player.lane - player.x;
    player.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * (boosted ? 7.6 : 6));
    player.slide = decay(player.slide, dt);
    const jumpRate = player.slide > 0 ? JUMP_SECONDS / (2 * FAST_DROP_SECONDS) : 1;
    jumpAge = Math.min(END_OF_LANDING, jumpAge + dt * jumpRate);
    const t = Math.min(1, jumpAge / JUMP_SECONDS);
    player.jump = 4 * t * (1 - t);

    fillTrack();
    updateDragon();
    if (state.powerTime > 0 && (hero.id === 'maxim' || hero.id === 'dad')) affectMonsters();
    for (const obj of state.objects) {
      obj.dance = decay(obj.dance, dt);
      obj.stun = decay(obj.stun, dt);
      obj.flee = decay(obj.flee, dt);
      if (!obj.passed && obj.z <= state.distance) cross(obj);
    }
    // Objects stay briefly behind the runner for pass-by animation.
    if (state.objects.some(obj => obj.z < state.distance - 9))
      state.objects = state.objects.filter(obj => obj.z >= state.distance - 9);
  }

  function update(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0 || state.status !== 'playing') return;
    // Keep lane interpolation and collision sampling reliable across render rates.
    for (let remaining = seconds; remaining > 1e-9 && state.status === 'playing';) {
      const dt = Math.min(remaining, 1 / 120);
      step(dt);
      remaining -= dt;
    }
  }

  function snapshot() {
    const { time, distance, speed, gems, lives, cooldown, powerTime, invulnerable } = state;
    return structuredClone({version:1, hero:hero.id, level:world.id, seed:state.seed,
      time, distance, speed, gems, lives, cooldown, powerTime, invulnerable,
      lane:player.lane, x:player.x, slide:player.slide, jumpAge, randomState, nextZ, row, sequence,
      pursuer, objects:state.objects});
  }
  if (saved) {
    ({jumpAge, randomState, nextZ, row, sequence} = saved);
    for (const prop of ['time','distance','speed','gems','lives','cooldown','powerTime','invulnerable']) state[prop] = saved[prop];
    Object.assign(player, {lane:saved.lane, x:saved.x, slide:saved.slide});
    const t = Math.min(1, jumpAge / JUMP_SECONDS);
    player.jump = 4*t*(1-t);
    for (const prop of ['dance','stun','flee','pressure']) pursuer[prop] = saved.pursuer[prop];
    state.objects = structuredClone(saved.objects);
    state.status = 'paused';
    updateDragon();
  }
  return { state, act, update, snapshot };
}

export function restoreRun(saved) {
  const finite = (n, min=0, max=Number.MAX_SAFE_INTEGER) => Number.isFinite(n) && n >= min && n <= max;
  const uint = n => Number.isInteger(n) && finite(n, 0, 0xffffffff);
  const world = WORLDS.find(w => w.id === saved?.level);
  if (!world || saved.version !== 1 || !HEROES.some(h => h.id === saved.hero)) return null;
  const numbers = ['time','distance','speed','gems','cooldown','powerTime','invulnerable','row','sequence'];
  if (!numbers.every(k => finite(saved[k])) || !uint(saved.seed) || !uint(saved.randomState)
      || !Number.isInteger(saved.lives) || !finite(saved.lives, 1, 3)
      || !finite(saved.nextZ, saved.distance, saved.distance + 150)
      || !LANES.includes(saved.lane) || !finite(saved.x, -1, 1)
      || !finite(saved.jumpAge, 0, END_OF_LANDING) || !finite(saved.slide, 0, SLIDE_SECONDS)) return null;
  if (!saved.pursuer || !['pressure','dance','flee','stun'].every(k => finite(saved.pursuer[k]))) return null;
  const kinds = ['gem','arch','monster','barrier','block','breath'];
  const types = ['gem','dragon_breath','fireball',world.arch,world.block,world.barrier,...world.monsters];
  if (!Array.isArray(saved.objects) || saved.objects.length > 120 || !saved.objects.every(o =>
    o && kinds.includes(o.kind) && types.includes(o.type) && uint(o.id) && LANES.includes(o.lane)
      && finite(o.z, Math.max(0,saved.distance-10), saved.distance+150)
      && ['dance','stun','flee'].every(k=>finite(o[k]))
      && ['active','hit','passed'].every(k=>typeof o[k]==='boolean'))) return null;
  return createRun({worldId:world.id, heroId:saved.hero, seed:saved.seed}, saved);
}
