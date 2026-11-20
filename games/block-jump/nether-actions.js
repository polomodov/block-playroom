// Lava jumps use adjacent bank edges, so a cube always lands on solid terrain.
function landingAcrossGap(cube, level) {
  const banks = level.platforms;
  const index = banks.findIndex(p => p.kind !== 'ledge' && cube.x >= p.x &&
    cube.x + cube.w <= p.x + p.w && Math.abs(cube.baseY + cube.h - p.y) < .1);
  if (index < 0) return null;
  const from = banks[index];
  for (const dir of [-1, 1]) {
    const to = banks[index + dir];
    if (!to || to.kind === 'ledge') continue;
    const gap = dir > 0 ? to.x - from.x - from.w : from.x - to.x - to.w;
    const runup = dir > 0 ? from.x + from.w - cube.x - cube.w : cube.x - from.x;
    if (gap <= 0 || gap > 54 || runup > 43) continue;
    const x = dir > 0 ? to.x + 7 : to.x + to.w - cube.w - 7;
    return { dir, x, y: to.y - cube.h, minX: Math.max(to.x + 3, x - 18),
      maxX: Math.min(to.x + to.w - cube.w - 3, x + 18) };
  }
  return null;
}

function startCharge(enemy, state) {
  const cx = enemy.x + enemy.w / 2, cy = enemy.y + enemy.h / 2;
  const dx = state.player.x + state.player.w / 2 - cx, dy = state.player.y + state.player.h / 2 - cy;
  if (Math.abs(dx) > 160 || Math.abs(dy) > 105) return;
  if (enemy.type === 'ghast') {
    enemy.facing = dx < 0 ? -1 : 1;
    const length = Math.max(1, Math.hypot(dx, dy));
    enemy.action = {kind: 'inhale', age: 0, duration: 1.12, dx: dx/length, dy: dy/length};
  } else {
    const landing = landingAcrossGap(enemy, state.level);
    if (!landing) return;
    enemy.facing = landing.dir;
    enemy.action = {kind: 'compress', age: 0, duration: .62, landing};
  }
  enemy.vx = 0;
}

export function advanceNetherAction(enemy, state, dt, suppressed) {
  enemy.actionCooldown = Math.max(0, enemy.actionCooldown - dt);
  if (suppressed && enemy.action?.kind !== 'vault') {
    if (enemy.action) {
      enemy.action = null;
      enemy.actionCooldown = .8;
    }
    return false;
  }
  if (!enemy.action && !enemy.actionCooldown) startCharge(enemy, state);
  const a = enemy.action;
  if (!a) return false;
  a.age = Math.min(a.duration, a.age + dt);
  if (a.kind === 'vault') {
    const p = a.age / a.duration;
    enemy.x = a.fromX + (a.landing.x - a.fromX) * p;
    enemy.y = a.fromY + (a.landing.y - a.fromY) * p - 4 * 34 * p * (1 - p);
  }
  if (a.age + 1e-8 < a.duration) return true;
  if (a.kind === 'compress') {
    enemy.action = {kind: 'vault', age: 0, duration: .78, fromX: enemy.x, fromY: enemy.y, landing: a.landing};
  } else if (a.kind === 'vault') {
    enemy.baseY = enemy.y = a.landing.y;
    enemy.x = a.landing.x;
    enemy.minX = a.landing.minX;
    enemy.maxX = a.landing.maxX;
    enemy.action = {kind: 'land', age: 0, duration: .27};
    state.monsterEffects.push({kind: 'cinders', x: enemy.x+enemy.w/2, y: enemy.y+enemy.h, age: 0, duration: .39});
  } else if (a.kind === 'inhale') {
    state.monsterEffects.push({kind: 'fireball', x: enemy.x+enemy.w/2+enemy.facing*7.2,
      y: enemy.y+enemy.h-10, vx: a.dx*91, vy: a.dy*91, age: 0, duration: 1.92});
    enemy.action = {kind: 'exhale', age: 0, duration: .31};
  } else {
    enemy.actionCooldown = a.kind === 'exhale' ? 3.6 : 2.15;
    enemy.action = null;
  }
  return true;
}

function touchesBall(rect, fx) {
  const nearestX = Math.max(rect.x, Math.min(fx.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(fx.y, rect.y + rect.h));
  return Math.hypot(nearestX - fx.x, nearestY - fx.y) < 3.4;
}

export function moveFireball(fx, state, dt, protectedPlayer) {
  fx.x += fx.vx * dt;
  fx.y += fx.vy * dt;
  if (state.level.platforms.some(p => touchesBall(p, fx))) return 'terrain';
  return !protectedPlayer && touchesBall(state.player, fx) ? 'player' : null;
}
