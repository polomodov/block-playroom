import { LEVELS } from './levels.js?v=living-worlds-1';
import { advanceAction, advanceMonsterEffects, interruptAction } from './enemy-actions.js?v=living-worlds-1';
import { createDragon, advanceDragon } from './dragon-rules.js?v=dragon-flight-1';

const RUN_SPEED = 132;
const JUMP_SPEED = 322;
const GRAVITY = 830;
const PLAYER_W = 13, PLAYER_H = 19;
const FIRST_CHORD = 26, SOLO_RADIUS = 120, WAVE_DURATION = .6;

// Width, height and patrol speed are in logical pixels and pixels per second.
// Hoppers spring from the bank. Flying creatures keep a little space below them.
const beasts = {
  zombie: [14,18,22], creeper: [13,16,27], slime: [16,12,23,'hop'], skeleton: [13,18,29],
  drowned: [14,17,22], guardian: [16,13,26,'float'], spider: [17,10,37], witch: [14,19,25],
  magma_cube: [16,12,16], ghast: [21,24,12,'drift'], blaze: [13,16,20,'float'], ghost: [14,15,25,'float'],
  pumpkin_guard: [16,18,21], enderman: [13,21,30], shulker: [15,13,0],
};
const powers = { kirill: 4, maxim: .35, mom: 4, dad: 3, pasha: 1.2 };
const overlaps = (a, b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const approaches = (value, target, delta) => value < target ? Math.min(target,value+delta) : Math.max(target,value-delta);
const remaining = (value,dt) => value <= dt+1e-8 ? 0 : value-dt;

const playerFields = ['x', 'y', 'vx', 'vy', 'facing'];
const enemyFields = ['x', 'y', 'vx', 'baseY', 'minX', 'maxX', 'facing', 'phase', 'stun', 'dance', 'actionCooldown'];
const runFields = ['lives', 'collected', 'time', 'cooldown', 'invulnerable', 'abilityTime', 'checkpointReached',
  'guitarStartedAt', 'solo', 'dragon', 'monsterEffects'];
const pick = (value, fields) => Object.fromEntries(fields.map(key => [key, value[key]]));
const numbers = (value, fields) => value != null && fields.every(key => Number.isFinite(value[key]));
const facing = value => value === 1 || value === -1;
const timed = value => numbers(value, ['age', 'duration']) && value.age >= 0 && value.duration > 0;

const actions = {
  draw: 'skeleton', release: 'skeleton', fuse: 'creeper', blinkOut: 'enderman', blinkIn: 'enderman',
  inhale: 'ghast', exhale: 'ghast', compress: 'magma_cube', vault: 'magma_cube', land: 'magma_cube',
};
function validAction(a, type) {
  if (a === null) return true;
  if (!timed(a) || typeof a.kind !== 'string' || actions[a.kind] !== type) return false;
  if (a.kind === 'blinkOut') return numbers(a, ['toX', 'patrolLeft', 'patrolRight']);
  if (a.kind === 'inhale') return numbers(a, ['dx', 'dy']);
  if (a.kind === 'compress' || a.kind === 'vault') {
    return numbers(a.landing, ['x', 'y', 'minX', 'maxX']) && facing(a.landing.dir) &&
      (a.kind === 'compress' || numbers(a, ['fromX', 'fromY']));
  }
  return true;
}
function validEffect(e) {
  if (!timed(e) || !numbers(e, ['x', 'y'])) return false;
  switch (e.kind) {
    case 'arrow': case 'portal': return facing(e.dir);
    case 'fireball': return numbers(e, ['vx', 'vy']);
    case 'blast': return Number.isFinite(e.radius) && e.radius > 0;
    case 'cinders': return true;
    default: return false;
  }
}
function validDragon(d, levelId) {
  if (levelId !== 'end') return d === null;
  const spot = c => numbers(c, ['x', 'y', 'radius', 'height']) && c.radius > 0 && c.height > 0;
  return timed(d) && numbers(d, ['x', 'y', 'pitch', 'fromX', 'fromY', 'fromPitch']) &&
    typeof d.engaged === 'boolean' && facing(d.dir) && facing(d.attackDir) &&
    ['patrol', 'warning', 'dive', 'recover'].includes(d.phase) &&
    Array.isArray(d.targets) && d.targets.length <= 3 && d.targets.every(t => spot(t) && typeof t.released === 'boolean') &&
    (!['warning', 'dive'].includes(d.phase) || d.targets.length > 0) &&
    Array.isArray(d.clouds) && d.clouds.length <= 3 && d.clouds.every(c => spot(c) && timed(c));
}

function validProgress(p, level) {
  if (!numbers(p, ['time','cooldown','invulnerable','abilityTime']) || p.time < 0 || p.cooldown < 0 ||
      p.invulnerable < 0 || p.abilityTime < 0 ||
      !Number.isInteger(p.lives) || p.lives < 1 || p.lives > 3 || typeof p.checkpointReached !== 'boolean') return false;
  if (!numbers(p.player, playerFields) || !facing(p.player.facing) || typeof p.player.onGround !== 'boolean' ||
      p.player.x < 0 || p.player.x > level.width - PLAYER_W || p.player.y > level.height + 20) return false;
  if (!numbers(p.input, ['coyote','jumpBuffer']) || typeof p.input.heldJump !== 'boolean' ||
      typeof p.input.heldAbility !== 'boolean' || p.input.coyote < 0 || p.input.jumpBuffer < 0) return false;
  if (!Array.isArray(p.gems) || p.gems.length !== level.gems.length || !p.gems.every(v => typeof v === 'boolean') ||
      p.collected !== p.gems.filter(Boolean).length) return false;
  if (!Array.isArray(p.enemies) || p.enemies.length !== level.enemies.length ||
      !p.enemies.every((e,i) => numbers(e, enemyFields) && e.type === level.enemies[i].type && facing(e.facing) &&
        typeof e.alive === 'boolean' && validAction(e.action, e.type))) return false;
  return (p.guitarStartedAt === null || Number.isFinite(p.guitarStartedAt)) &&
    (p.solo === null || (numbers(p.solo, ['x','y','age','radius','front']) && p.solo.radius > 0 && p.solo.front >= 0)) &&
    validDragon(p.dragon, level.id) && Array.isArray(p.monsterEffects) && p.monsterEffects.length <= 64 &&
    p.monsterEffects.every(validEffect);
}

export function restoreRun(save) {
  const level = LEVELS.find(l => l.id === save?.level);
  if (!level || save.version !== 1 || typeof save.hero !== 'string' || !Object.hasOwn(powers, save.hero) ||
      !validProgress(save.progress, level)) return null;
  return createRun(level.id, save.hero, structuredClone(save.progress));
}

function spawnEnemy(def, index) {
  const [w,h,speed,motion] = beasts[def.type];
  const hover = motion === 'drift' ? 72 : motion === 'float' ? 14 : 0;
  return { ...def, y: def.y-h-hover, baseY: def.y-h, w, h, speed, motion,
    vx: index%2 ? speed : -speed, facing: index%2 ? 1 : -1,
    phase: index*.53, alive: true, stun: 0, dance: 0, action: null, actionCooldown: 0 };
}

export function createRun(levelId = 'temple', heroId = 'kirill', progress = null) {
  const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
  if (!Object.hasOwn(powers,heroId)) heroId = 'kirill';
  const player = { ...level.spawn, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, facing: 1, onGround: true };
  const state = {
    level, heroId, player, lives: 3, collected: 0, cooldown: 0, time: 0, status: 'playing',
    dragon: createDragon(level, player),
    gems: level.gems.map(g => ({ ...g, taken: false })), enemies: level.enemies.map(spawnEnemy),
    monsterEffects: [], checkpointReached: false, invulnerable: 0, abilityTime: 0, solo: null, guitarStartedAt: null,
  };
  let coyote = 0, jumpBuffer = 0, heldJump = false, heldAbility = false;
  if (progress) {
    Object.assign(state, pick(progress, runFields));
    Object.assign(player, pick(progress.player, [...playerFields, 'onGround']));
    state.gems.forEach((gem,i) => { gem.taken = progress.gems[i]; });
    state.enemies.forEach((enemy,i) => Object.assign(enemy, pick(progress.enemies[i], [...enemyFields, 'alive', 'action'])));
    ({coyote, jumpBuffer, heldJump, heldAbility} = progress.input);
  }

  function snapshot() {
    if (state.status !== 'playing') return null;
    return { version: 1, hero: heroId, level: level.id, progress: structuredClone({
      ...pick(state, runFields), player: pick(player, [...playerFields, 'onGround']),
      gems: state.gems.map(gem => gem.taken),
      enemies: state.enemies.map(enemy => pick(enemy, [...enemyFields, 'type', 'alive', 'action'])),
      input: {coyote, jumpBuffer, heldJump, heldAbility},
    }) };
  }

  function loseLife() {
    state.lives--;
    state.abilityTime = 0;
    state.solo = null;
    state.guitarStartedAt = null;
    state.monsterEffects = state.monsterEffects.filter(e => e.kind !== 'arrow' && e.kind !== 'fireball');
    for (const enemy of state.enemies) {
      enemy.dance = 0;
      interruptAction(enemy);
    }
    if (state.lives === 0) {
      state.status = 'lost';
      return;
    }
    const spawn = state.checkpointReached
      ? { x: level.checkpoint.x - PLAYER_W/2, y: level.checkpoint.y - PLAYER_H } : level.spawn;
    Object.assign(player,spawn,{ vx: 0, vy: 0, onGround: true, facing: 1 });
    state.dragon = createDragon(level, player);
    state.invulnerable = 1.6;
    coyote = jumpBuffer = 0;
  }

  function movePlayer(dt, input) {
    const dir = Number(!!input.right) - Number(!!input.left);
    const boost = heroId === 'kirill' && state.abilityTime > 0;
    player.vx = approaches(player.vx,dir*(boost ? 184 : RUN_SPEED),dt*(dir ? 1060 : 1370));
    if (dir) player.facing = dir;
    if (player.onGround) coyote = .11;
    else coyote = remaining(coyote,dt);
    if (jumpBuffer > 0 && coyote > 0) {
      player.vy = input.jump ? -JUMP_SPEED : -154;
      player.onGround = false;
      coyote = jumpBuffer = 0;
    } else jumpBuffer = remaining(jumpBuffer,dt);

    const lastX = player.x;
    player.x = Math.max(0, Math.min(level.width-player.w, player.x + player.vx*dt));
    for (const p of level.platforms) {
      if (p.kind === 'ledge' || !overlaps(player,p)) continue;
      if (player.vx > 0 && lastX+player.w <= p.x+.001) player.x = p.x-player.w;
      else if (player.vx < 0 && lastX >= p.x+p.w-.001) player.x = p.x+p.w;
      else continue;
      player.vx = 0;
    }

    const lastY = player.y;
    player.vy = Math.min(470,player.vy+GRAVITY*dt);
    player.y += player.vy*dt;
    player.onGround = false;
    for (const p of level.platforms) {
      if (player.x+player.w <= p.x || player.x >= p.x+p.w) continue;
      if (player.vy >= 0 && lastY+player.h <= p.y+.001 && player.y+player.h >= p.y) {
        player.y = p.y-player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (p.kind !== 'ledge' && player.vy < 0 && lastY >= p.y+p.h-.001 && player.y <= p.y+p.h) {
        player.y = p.y+p.h;
        player.vy = 0;
      }
    }
    return lastY+player.h;
  }

  function moveEnemy(enemy, dt, frightened) {
    if (frightened) enemy.facing = enemy.x+enemy.w/2 >= player.x+player.w/2 ? 1 : -1;
    // Even the normally anchored shulker scoots to safety when Dad shouts.
    const speed = frightened ? Math.max(20,enemy.speed)*1.65 : enemy.speed;
    enemy.vx = enemy.facing*speed;
    enemy.x = Math.max(enemy.minX,Math.min(enemy.maxX,enemy.x+enemy.vx*dt));
    if (!frightened && (enemy.x === enemy.minX || enemy.x === enemy.maxX)) {
      enemy.facing = enemy.x === enemy.minX ? 1 : -1;
    }
    enemy.phase += dt;
    if (enemy.motion === 'drift') enemy.y = enemy.baseY-72-3*Math.sin(enemy.phase*2.1);
    if (enemy.motion === 'float') enemy.y = enemy.baseY-14-4*Math.sin(enemy.phase*2.4);
    if (enemy.motion === 'hop') {
      const t = enemy.phase % 1.9;
      enemy.y = enemy.baseY - (t < .62 ? 15*Math.sin(Math.PI*t/.62) : 0);
    }
  }

  // Music spreads from where Pasha played the first chord, even as he runs on.
  function advanceSolo(dt) {
    const solo = state.solo;
    if (!solo) return null;
    const spreading = solo.age < WAVE_DURATION - 1e-8;
    solo.age += dt;
    solo.front = FIRST_CHORD + (solo.radius - FIRST_CHORD) * Math.min(1, solo.age / WAVE_DURATION);
    return spreading ? solo : null;
  }

  function enemies(dt, previousFeet, wave) {
    const active = state.abilityTime > 0;
    const protectedByPower = active && (heroId === 'dad' || heroId === 'mom');
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.dance = remaining(enemy.dance,dt);
      if (wave && enemy.dance === 0 && enemy.action?.kind !== 'vault') {
        const dx = enemy.x+enemy.w/2-wave.x, dy = enemy.y+enemy.h/2-wave.y;
        if (Math.hypot(dx,dy) <= wave.front + 1e-8) {
          enemy.dance = 5;
          interruptAction(enemy);
          enemy.vx = 0;
        }
      }
      if (enemy.dance > 0) continue;
      enemy.stun = remaining(enemy.stun,dt);
      if (active && heroId === 'maxim' && enemy.action?.kind !== 'vault' &&
          Math.abs(enemy.x+enemy.w/2-player.x-player.w/2) < 34 && Math.abs(enemy.y-player.y) < 24) {
        enemy.stun = 4;
      }
      const holdingPose = advanceAction(enemy,state,dt,protectedByPower || enemy.stun > 0 || state.invulnerable > 0);
      if (!holdingPose && !enemy.stun) moveEnemy(enemy,dt,active && heroId === 'dad');
      if (!enemy.alive || enemy.stun > 0 || !overlaps(player,enemy)) continue;
      if (enemy.action?.kind === 'blinkIn') continue;
      if (player.vy > 0 && previousFeet <= enemy.y+4) {
        enemy.alive = false;
        interruptAction(enemy);
        player.y = enemy.y-player.h;
        player.vy = -185;
        player.onGround = false;
        coyote = 0;
      } else if (enemy.type !== 'creeper' && !protectedByPower && state.invulnerable === 0) {
        loseLife();
        return;
      }
    }
    const protectedPlayer = protectedByPower || state.invulnerable > 0;
    if (advanceMonsterEffects(state,dt,protectedPlayer) || advanceDragon(state,dt,protectedPlayer)) loseLife();
  }

  function step(dt,input) {
    state.time += dt;
    state.invulnerable = remaining(state.invulnerable,dt);
    state.cooldown = remaining(state.cooldown,dt);
    const previousFeet = movePlayer(dt,input);
    if (player.y > level.height+20) {
      loseLife();
      return;
    }
    const cx = player.x+player.w/2, cy = player.y+player.h/2;
    for (const gem of state.gems) {
      if (!gem.taken && Math.abs(gem.x-cx) < player.w/2+4 && Math.abs(gem.y-cy) < player.h/2+4) {
        gem.taken = true;
        state.collected++;
      }
    }
    if (cx >= level.checkpoint.x && player.y+player.h <= level.checkpoint.y+3) state.checkpointReached = true;
    if (cx >= level.flag.x && player.y+player.h <= level.flag.y+3) {
      state.status = 'won';
      return;
    }
    const wave = advanceSolo(dt);
    enemies(dt,previousFeet,wave);
    state.abilityTime = remaining(state.abilityTime,dt);
    if (!state.abilityTime) state.solo = null;
  }

  function update(dt,input = {}) {
    if (state.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    if (input.jump && !heldJump) jumpBuffer = .14;
    if (!input.jump && heldJump && player.vy < -154) player.vy = -154;
    const canPlay = heroId !== 'pasha' || player.y+player.h <= level.height;
    if (input.ability && !heldAbility && state.cooldown === 0 && canPlay) {
      state.abilityTime = powers[heroId];
      state.cooldown = 30;
      if (heroId === 'pasha') {
        state.guitarStartedAt = state.time;
        state.solo = { x: player.x+player.w/2, y: player.y+player.h/2,
          age: 0, front: FIRST_CHORD, radius: SOLO_RADIUS };
      }
    }
    heldJump = !!input.jump;
    heldAbility = !!input.ability;
    // Small steps keep short ledges and fast falls consistent across display refresh rates.
    while (dt > 1e-8 && state.status === 'playing') {
      const slice = Math.min(1/120,dt);
      step(slice,input);
      dt -= slice;
    }
  }
  return { state, update, snapshot };
}
