import { advanceNetherAction, moveFireball } from './nether-actions.js?v=living-worlds-1';

// Distances are measured in course pixels. Warnings and their effects share the same clock.
const bowRange = 104;
const arrowSpeed = 116;
const blastRadius = 26;

function lineBlocked(level, x1, x2, y) {
  const left = Math.min(x1, x2), right = Math.max(x1, x2);
  return level.platforms.some(p => y > p.y && y < p.y + p.h && right >= p.x && left <= p.x + p.w);
}

function pose(enemy, kind, duration) {
  enemy.action = { kind, age: 0, duration };
  enemy.vx = 0;
}

export function interruptAction(enemy) {
  if (enemy.action && enemy.action.kind !== 'vault') {
    enemy.action = null;
    enemy.actionCooldown = .8;
  }
}

function startAction(enemy, state) {
  const player = state.player;
  const cx = enemy.x + enemy.w / 2, cy = enemy.y + enemy.h / 2;
  const targetX = player.x + player.w / 2;
  const dx = targetX - cx, dy = player.y + player.h / 2 - cy;
  const facing = dx >= 0 ? 1 : -1;
  if (enemy.type === 'skeleton') {
    if (Math.abs(dx) > bowRange || Math.abs(dy) > 15) return;
    if (lineBlocked(state.level, cx, targetX, enemy.y + enemy.h * .45)) return;
    enemy.facing = facing;
    pose(enemy, 'draw', .74);
  } else if (enemy.type === 'creeper') {
    if (Math.hypot(dx, dy) > 48) return;
    enemy.facing = facing;
    pose(enemy, 'fuse', .84);
  } else if (enemy.type === 'enderman') {
    if (Math.abs(dx) > 93 || Math.abs(dy) > 48) return;
    const bank = state.level.platforms.find(p =>
      p.kind !== 'ledge' && Math.abs(p.y - (enemy.y + enemy.h)) < .1 &&
      enemy.x >= p.x && enemy.x + enemy.w <= p.x + p.w);
    if (!bank) return;
    const leftEdge = bank.x + 3, rightEdge = bank.x + bank.w - enemy.w - 3;
    const candidates = [Math.max(leftEdge, enemy.x - 56), Math.min(rightEdge, enemy.x + 56)];
    const clear = candidates.filter(x => Math.abs(x - enemy.x) >= 24 &&
      Math.abs(x + enemy.w / 2 - targetX) >= 27);
    if (!clear.length) return;
    const toX = clear.reduce((a, b) =>
      Math.abs(a + enemy.w / 2 - targetX) > Math.abs(b + enemy.w / 2 - targetX) ? a : b);
    enemy.facing = facing;
    pose(enemy, 'blinkOut', .52);
    enemy.action.toX = toX;
    // Re-anchor the same patrol at the destination so the next walking frame never snaps back.
    const span = Math.min(rightEdge - leftEdge, enemy.maxX - enemy.minX);
    enemy.action.patrolLeft = Math.max(leftEdge, Math.min(rightEdge - span, toX - span / 2));
    enemy.action.patrolRight = enemy.action.patrolLeft + span;
  }
}

export function advanceAction(enemy, state, dt, suppressed) {
  if (enemy.type === 'ghast' || enemy.type === 'magma_cube') return advanceNetherAction(enemy, state, dt, suppressed);
  if (enemy.type !== 'creeper' && enemy.type !== 'skeleton' && enemy.type !== 'enderman') return false;
  if (suppressed) interruptAction(enemy);
  enemy.actionCooldown = Math.max(0, enemy.actionCooldown - dt);
  if (suppressed || enemy.actionCooldown > 0) return false;
  if (!enemy.action) startAction(enemy, state);
  const action = enemy.action;
  if (!action) return false;
  action.age = Math.min(action.duration, action.age + dt);
  if (action.age + 1e-8 < action.duration) return true;

  const x = enemy.x + enemy.w / 2, y = enemy.y + enemy.h / 2;
  switch (action.kind) {
    case 'draw':
      state.monsterEffects.push({ kind: 'arrow', x: x + enemy.facing * 10,
        y: enemy.y + enemy.h * .45, dir: enemy.facing, age: 0, duration: bowRange / arrowSpeed });
      pose(enemy, 'release', .19);
      break;
    case 'fuse':
      state.monsterEffects.push({ kind: 'blast', x, y, radius: blastRadius, age: 0, duration: .46 });
      enemy.alive = false;
      enemy.action = null;
      break;
    case 'blinkOut': {
      // The runner may have taken the marked position since the warning began.
      const distance = Math.abs(action.toX + enemy.w / 2 - (state.player.x + state.player.w / 2));
      if (distance >= 20) {
        state.monsterEffects.push({ kind: 'portal', x, y, dir: enemy.facing, age: 0, duration: .42 });
        enemy.x = action.toX;
        enemy.minX = action.patrolLeft;
        enemy.maxX = action.patrolRight;
        pose(enemy, 'blinkIn', .42);
        break;
      }
      enemy.action = null;
      enemy.actionCooldown = 1.1;
      break;
    }
    default:
      enemy.action = null;
      enemy.actionCooldown = action.kind === 'release' ? 2.3 : 3.1;
  }
  return true;
}

export function advanceMonsterEffects(state, dt, protectedPlayer) {
  const player = state.player;
  let hit = false;
  for (let i = state.monsterEffects.length - 1; i >= 0; i--) {
    const effect = state.monsterEffects[i];
    const step = Math.min(dt, effect.duration - effect.age);
    if (effect.kind === 'fireball') {
      const impact = moveFireball(effect, state, step, protectedPlayer);
      if (impact) {
        hit ||= impact === 'player';
        Object.assign(effect, {kind: 'cinders', age: 0, duration: .34});
        continue;
      }
    } else if (effect.kind === 'arrow') {
      const nextX = effect.x + effect.dir * arrowSpeed * step;
      const cx = Math.max(player.x, Math.min(nextX, player.x + player.w));
      const crossedHero = Math.min(effect.x, nextX) <= player.x + player.w &&
        Math.max(effect.x, nextX) >= player.x && effect.y >= player.y && effect.y <= player.y + player.h;
      if (crossedHero && !protectedPlayer && !lineBlocked(state.level, effect.x, cx, effect.y)) {
        hit = true;
        state.monsterEffects.splice(i, 1);
        continue;
      }
      if (lineBlocked(state.level, effect.x, nextX, effect.y)) {
        state.monsterEffects.splice(i, 1);
        continue;
      }
      effect.x = nextX;
    } else if (effect.kind === 'blast' && effect.age === 0 && !protectedPlayer) {
      // Only the first shockwave deals damage. The remaining smoke is safe to cross.
      const x = Math.max(player.x, Math.min(effect.x, player.x + player.w));
      const y = Math.max(player.y, Math.min(effect.y, player.y + player.h));
      if (Math.hypot(x - effect.x, y - effect.y) <= effect.radius) hit = true;
    }
    effect.age += step;
    if (effect.age + 1e-8 >= effect.duration) state.monsterEffects.splice(i, 1);
  }
  return hit;
}
