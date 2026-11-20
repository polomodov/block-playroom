// Dragon, markers and persistent breath live in course coordinates as the camera scrolls.
const WARNING = 1.25, DIVE = 1.2, RECOVER = 1.1, CLOUD_DURATION = 3;
const RADIUS = 12, HEIGHT = 14, MUZZLE_REACH = 22;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

export function createDragon(level, player) {
  if (level.id !== 'end') return null;
  return {
    phase: 'patrol', age: 0, duration: 2.2, engaged: false,
    x: player.x + 120, y: 45, dir: -1, attackDir: -1, pitch: 0,
    fromX: 0, fromY: 0, fromPitch: 0, targets: [], clouds: [],
  };
}

function transition(d, phase, duration) {
  d.fromX = d.x;
  d.fromY = d.y;
  d.fromPitch = d.pitch;
  d.phase = phase;
  d.duration = duration;
  d.age = 0;
}

function takeAim(d, level, player) {
  const cx = player.x + player.w / 2, feet = player.y + player.h;
  let floor;
  for (const p of level.platforms) {
    if (cx >= p.x && cx < p.x + p.w && p.y >= feet - .1 && (!floor || p.y < floor.y)) floor = p;
  }
  if (!floor) return; // A player over the void has no landing point to mark.
  const min = floor.x + RADIUS, max = floor.x + floor.w - RADIUS;
  const center = clamp(cx, min, max);
  const positions = [center - 32, center, center + 32].filter(x => x >= min && x <= max);
  // Keep the attack run visible even when the camera is pinned at the course edges.
  if (center < 110) d.attackDir = -1;
  else if (center > level.width - 110) d.attackDir = 1;
  else d.attackDir = d.x > center ? -1 : 1;
  if (d.attackDir < 0) positions.reverse();
  d.targets = positions.map(x => ({ x, y: floor.y, radius: RADIUS, height: HEIGHT, released: false }));
  transition(d, 'warning', WARNING);
}

function touchesBreath(player, cloud) {
  const cy = cloud.y - cloud.height / 2;
  const dx = clamp(cloud.x, player.x, player.x + player.w) - cloud.x;
  const dy = clamp(cy, player.y, player.y + player.h) - cy;
  return (dx / cloud.radius) ** 2 + (dy / (cloud.height / 2)) ** 2 < 1;
}

export function advanceDragon(state, dt, protectedPlayer) {
  const d = state.dragon;
  if (!d) return false;
  const { level, player, time } = state;
  for (const c of d.clouds) c.age += dt;
  if (d.clouds.some(c => c.age >= c.duration)) d.clouds = d.clouds.filter(c => c.age < c.duration);

  d.age += dt;
  const t = Math.min(1, d.age / d.duration);
  if (d.phase === 'patrol') {
    const cx = player.x + player.w / 2;
    const orbitX = clamp(cx + 104 * Math.cos(time * .88), 30, level.width - 30);
    const dx = orbitX - d.x;
    d.x += dx * Math.min(1, dt * 2.4);
    if (Math.abs(dx) > 2) d.dir = Math.sign(dx);
    d.y += (47 + 9 * Math.sin(time * 1.65) - d.y) * Math.min(1, dt * 3);
    d.pitch += (.08 * Math.cos(time * 1.65) - d.pitch) * Math.min(1, dt * 3);
    if (!d.engaged) {
      d.engaged = Math.abs(player.vx) > 3 || !player.onGround;
      d.age = 0;
    }
    if (d.age >= d.duration && !protectedPlayer) takeAim(d, level, player);
  } else if (d.phase === 'warning') {
    const first = d.targets[0];
    const windup = smooth(t);
    const entryX = first.x - d.attackDir * 89;
    d.dir = t < .82 ? Math.sign(entryX - d.fromX) || d.attackDir : d.attackDir;
    d.x = lerp(d.fromX, entryX, windup);
    d.y = lerp(d.fromY, Math.max(27, first.y - 112), windup) - 9 * Math.sin(Math.PI * t);
    d.pitch = lerp(d.fromPitch, .28, windup);
    if (t === 1) transition(d, 'dive', DIVE);
  } else if (d.phase === 'dive') {
    const first = d.targets[0], last = d.targets.at(-1);
    const low = first.y - 27;
    if (t < .5) {
      const descent = t * 2;
      d.x = lerp(d.fromX, first.x - d.dir * MUZZLE_REACH, descent);
      d.y = lerp(d.fromY, low, smooth(descent));
      d.pitch = lerp(d.fromPitch, .12, descent) + .58 * Math.sin(Math.PI * descent);
    } else {
      const sweep = (t - .5) * 2;
      d.x = lerp(first.x - d.dir * MUZZLE_REACH, last.x - d.dir * (MUZZLE_REACH - 10), sweep);
      d.y = low - 2 * Math.sin(Math.PI * sweep);
      d.pitch = .12 - .18 * sweep;
      const mouthX = d.x + d.dir * MUZZLE_REACH;
      for (const mark of d.targets) {
        if (mark.released || (mouthX - mark.x) * d.dir < 0) continue;
        mark.released = true;
        d.clouds.push({ x: mark.x, y: mark.y, radius: mark.radius, height: mark.height, age: 0, duration: CLOUD_DURATION });
      }
    }
    if (t === 1) {
      d.targets = [];
      transition(d, 'recover', RECOVER);
    }
  } else {
    const climb = smooth(t);
    const endX = clamp(d.fromX + d.dir * 88, 24, level.width - 24);
    d.x = lerp(d.fromX, endX, climb);
    d.y = lerp(d.fromY, 45, climb);
    d.pitch = lerp(d.fromPitch, 0, t) - .72 * Math.sin(Math.PI * t);
    if (t === 1) transition(d, 'patrol', 3.2);
  }
  return !protectedPlayer && d.clouds.some(c => touchesBreath(player, c));
}
