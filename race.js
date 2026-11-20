import { heroNames } from './progress.js';

// Distance around the closed spline is measured in pixels. Ghost and driver use the same coordinates.
const WIDTH = 720,
  HEIGHT = 420,
  ROAD = 25,
  TICK = 1 / 60,
  SAMPLE = 6,
  TAU = Math.PI * 2;
const points = [
  [358, 321],
  [231, 354],
  [102, 327],
  [65, 239],
  [100, 137],
  [163, 92],
  [244, 109],
  [322, 155],
  [399, 131],
  [464, 78],
  [575, 74],
  [654, 128],
  [658, 215],
  [588, 246],
  [511, 229],
  [455, 284],
];
const key = 'family-games:playroom:race:waterpark-loop:1';
const colors = { kirill: '#29d3c1', maxim: '#ad83ff', mom: '#ffb347', dad: '#648cff', pasha: '#f9c652' };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function curve(a, b, c, d, t) {
  return (
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
  );
}
const path = [];
for (let i = 0; i < points.length; i++) {
  const p = [-1, 0, 1, 2].map((n) => points[(i + n + points.length) % points.length]);
  for (let j = 0; j < 18; j++) {
    const t = j / 18,
      [x, y] = [0, 1].map((axis) => curve(...p.map((pt) => pt[axis]), t));
    const prev = path.at(-1);
    path.push({ x, y, s: prev ? prev.s + Math.hypot(x - prev.x, y - prev.y) : 0 });
  }
}
path.push({
  ...path[0],
  s: path.at(-1).s + Math.hypot(path[0].x - path.at(-1).x, path[0].y - path.at(-1).y),
});
export const courseLength = path.at(-1).s;
function roadAt(distance, side = 0) {
  const s = ((distance % courseLength) + courseLength) % courseLength;
  let lo = 0,
    hi = path.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (path[mid].s <= s) lo = mid;
    else hi = mid;
  }
  const a = path[lo],
    b = path[hi],
    len = b.s - a.s,
    t = (s - a.s) / len,
    tx = (b.x - a.x) / len,
    ty = (b.y - a.y) / len;
  return {
    x: a.x + (b.x - a.x) * t - ty * side,
    y: a.y + (b.y - a.y) * t + tx * side,
    angle: Math.atan2(ty, tx),
  };
}
const pads = [0.09, 0.31, 0.49, 0.68, 0.86].map((fraction, i) => ({
  s: fraction * courseLength,
  side: [-10, 11, -12, 10, -8][i],
}));
const puddles = [0.18, 0.41, 0.61, 0.79, 0.94].map((fraction, i) => ({
  s: fraction * courseLength,
  side: [10, -9, 11, -10, 3][i],
}));
export function newRace(hero = 'kirill') {
  return {
    v: 1,
    hero: Object.hasOwn(heroNames, hero) ? hero : 'kirill',
    phase: 'grid',
    ticks: 0,
    s: 0,
    side: -9,
    speed: 0,
    boost: 0,
    splash: 0,
    pads: 0,
    samples: [[0, -9]],
  };
}
function validSamples(arr) {
  return (
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.length < 2500 &&
    arr.every(
      (pt, i) =>
        Array.isArray(pt) &&
        pt.length === 2 &&
        pt.every(Number.isInteger) &&
        pt[0] >= 0 &&
        pt[0] <= Math.ceil(courseLength) &&
        Math.abs(pt[1]) <= ROAD &&
        (!i || pt[0] >= arr[i - 1][0]),
    )
  );
}
export function restoreRace(data, hero) {
  if (
    !data ||
    data.v !== 1 ||
    data.hero !== hero ||
    !['grid', 'run'].includes(data.phase) ||
    !validSamples(data.samples) ||
    !Number.isInteger(data.ticks) ||
    data.ticks < 0 ||
    data.samples.length !== Math.floor(data.ticks / SAMPLE) + 1 ||
    !Number.isInteger(data.pads) ||
    data.pads < 0 ||
    data.pads > pads.length ||
    !['s', 'side', 'speed', 'boost', 'splash'].every((k) => Number.isFinite(data[k])) ||
    data.s < 0 ||
    data.s >= courseLength ||
    Math.abs(data.side) > ROAD ||
    data.speed < 0 ||
    data.speed > 160 ||
    data.boost < 0 ||
    data.boost > 1.31 ||
    data.splash < 0 ||
    data.splash > 0.86
  )
    return newRace(hero);
  return structuredClone(data);
}
export function drive(state, steering = 0, brake = false) {
  if (state.phase !== 'run') return;
  const angle = roadAt(state.s).angle,
    next = roadAt(state.s + 12).angle;
  const bend = Math.atan2(Math.sin(next - angle), Math.cos(next - angle)) / 12;
  const drift = clamp(-bend * state.speed * state.speed * 0.22, -38, 38);
  state.side = clamp(state.side + (clamp(steering, -1, 1) * 63 + drift) * TICK, -ROAD + 4, ROAD - 4);
  let target = brake ? 48 : 99;
  if (state.boost > 0 && !brake) target = 148;
  if (state.splash > 0) target = Math.min(target, 47);
  if (Math.abs(state.side) > ROAD - 7) target = Math.min(target, 58);
  state.speed += (target - state.speed) * TICK * 2.5;
  const previous = state.s;
  // Covering the inside line of a bend takes less time.
  state.s = Math.min(courseLength, state.s + (state.speed * TICK) / clamp(1 - bend * state.side, 0.75, 1.35));
  state.boost = Math.max(0, state.boost - TICK);
  state.splash = Math.max(0, state.splash - TICK);
  for (const pad of pads)
    if (previous < pad.s && state.s >= pad.s && Math.abs(state.side - pad.side) < 10) {
      state.boost = 1.3;
      state.pads++;
    }
  for (const puddle of puddles)
    if (previous < puddle.s && state.s >= puddle.s && Math.abs(state.side - puddle.side) < 10)
      state.splash = 0.85;
  state.ticks++;
  if (state.ticks % SAMPLE === 0 || state.s === courseLength)
    state.samples.push([Math.round(state.s), Math.round(state.side) || 0]);
  if (state.s === courseLength) state.phase = 'finish';
}
export function raceRecord(state) {
  return { v: 1, hero: state.hero, ticks: state.ticks, samples: state.samples.map((pt) => [...pt]) };
}
export function validRecord(record) {
  return (
    !!record &&
    record.v === 1 &&
    Object.hasOwn(heroNames, record.hero) &&
    Number.isInteger(record.ticks) &&
    record.ticks > 0 &&
    validSamples(record.samples) &&
    record.samples.length === Math.ceil(record.ticks / SAMPLE) + 1 &&
    record.samples.at(-1)[0] === Math.round(courseLength)
  );
}
export function ghostAt(record, tick) {
  const time = clamp(tick, 0, record.ticks),
    i = Math.min(Math.floor(time / SAMPLE), record.samples.length - 2);
  const a = record.samples[i],
    b = record.samples[i + 1],
    t = (time - i * SAMPLE) / Math.min(SAMPLE, record.ticks - i * SAMPLE);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
const seconds = (ticks) => (ticks / 60).toFixed(2).replace('.', ',') + ' с';

function circle(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = color;
  g.fill();
}
function stroke(g, color, width, draw) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  draw();
  g.stroke();
}
function paintCourse(g) {
  const water = g.createLinearGradient(0, 0, WIDTH, HEIGHT);
  water.addColorStop(0, '#17496a');
  water.addColorStop(0.55, '#167d8a');
  water.addColorStop(1, '#19465c');
  g.fillStyle = water;
  g.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 230; i++) {
    const x = (i * 131.7) % WIDTH,
      y = (i * 71.13) % HEIGHT;
    stroke(g, i % 3 ? '#7ee2d232' : '#c2ffdf70', 2, () => {
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 5, y + 3, x + 11 + (i % 9), y);
    });
  }
  for (const [x, y, scale] of [
    [44, 55, 0.8],
    [304, 42, 0.7],
    [356, 381, 0.75],
    [684, 319, 1],
    [182, 220, 0.85],
  ]) {
    g.save();
    g.translate(x, y);
    g.scale(scale, scale);
    circle(g, 2, 4, 18, '#235668');
    circle(g, 0, 0, 17, '#e8c97c');
    for (let k = 0; k < 8; k++) {
      g.rotate(TAU / 8);
      g.fillStyle = k % 2 ? '#286a46' : '#3a9b57';
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(-11, -13, 0, -23);
      g.quadraticCurveTo(6, -12, 0, 0);
      g.fill();
    }
    g.restore();
  }
  const line = () => {
    g.moveTo(path[0].x, path[0].y);
    for (const p of path) g.lineTo(p.x, p.y);
    g.closePath();
  };
  g.lineJoin = 'round';
  stroke(g, '#0c3e4c', ROAD * 2 + 12, line);
  stroke(g, '#fff2c2', ROAD * 2 + 6, line);
  g.setLineDash([12, 14]);
  stroke(g, '#f98d68', ROAD * 2 + 6, line);
  g.setLineDash([]);
  stroke(g, '#345461', ROAD * 2, line);
  stroke(g, '#456573', ROAD * 2 - 7, line);
  g.setLineDash([5, 11]);
  stroke(g, '#d5e4d65c', 1.3, line);
  g.setLineDash([]);
  const gate = roadAt(0);
  g.save();
  g.translate(gate.x, gate.y);
  g.rotate(gate.angle);
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 10; j++) {
      g.fillStyle = (i + j) % 2 ? '#1d3440' : '#fff1d1';
      g.fillRect(i * 5 - 5, j * 5 - 25, 5, 5);
    }
  g.restore();
  for (const p of puddles) {
    const t = roadAt(p.s, p.side);
    g.save();
    g.translate(t.x, t.y);
    g.rotate(t.angle - 0.2);
    g.fillStyle = '#60bdde';
    g.beginPath();
    g.ellipse(0, 0, 10, 6, 0, 0, TAU);
    g.fill();
    stroke(g, '#c6f5f5', 1.4, () => {
      g.moveTo(-6, 0);
      g.lineTo(-1, -1);
    });
    g.restore();
  }
  for (const p of pads) {
    const t = roadAt(p.s, p.side);
    g.save();
    g.translate(t.x, t.y);
    g.rotate(t.angle);
    g.fillStyle = '#205957';
    g.fillRect(-9, -9, 19, 18);
    for (const x of [-4, 3])
      stroke(g, '#a5ff92', 3, () => {
        g.moveTo(x - 3, -5);
        g.lineTo(x + 2, 0);
        g.lineTo(x - 3, 5);
      });
    g.restore();
  }
  // Spiral slide in the infield.
  function slide() {
    g.moveTo(370, 218);
    for (let i = 0; i < 140; i++) {
      const a = i * 0.072,
        r = 4 + i * 0.21;
      g.lineTo(370 + Math.cos(a) * r * 1.4, 218 + Math.sin(a) * r * 0.66);
    }
    g.bezierCurveTo(305, 210, 338, 269, 265, 264);
  }
  g.lineCap = 'round';
  stroke(g, '#1c5368', 15, slide);
  stroke(g, '#ffbb58', 12, slide);
  stroke(g, '#e38845', 5, slide);
  g.lineCap = 'butt';
}
function kart(g, t, hero, ghost, boost) {
  g.save();
  g.translate(t.x, t.y);
  g.rotate(t.angle);
  g.scale(1.12, 1.12);
  g.globalAlpha = ghost ? 0.54 : 1;
  if (boost) {
    g.fillStyle = '#fee680';
    g.beginPath();
    g.moveTo(-9, -4);
    g.lineTo(-22, 0);
    g.lineTo(-9, 4);
    g.fill();
  }
  g.fillStyle = '#172a35';
  g.fillRect(-7, -8, 5, 16);
  g.fillRect(3, -8, 5, 16);
  g.fillStyle = ghost ? '#d0f6ff' : colors[hero];
  g.beginPath();
  g.roundRect(-11, -6, 22, 12, 4);
  g.fill();
  g.fillStyle = '#304154';
  g.fillRect(-3, -4, 6, 8);
  circle(g, -1, 0, 3, ghost ? '#fff' : '#e4ae80');
  g.fillStyle = '#fff2a8';
  g.fillRect(8, -4, 2, 2);
  g.fillRect(8, 2, 2, 2);
  if (!ghost) {
    g.strokeStyle = '#fff3d4';
    g.lineWidth = 1;
    g.strokeRect(-10, -4, 3, 8);
  }
  g.restore();
}
export function mount(host, { players, saved, save, finish }) {
  const hero = players[0],
    s = restoreRace(saved, hero);
  let ghost = null;
  try {
    const record = JSON.parse(localStorage.getItem(key));
    if (validRecord(record)) ghost = record;
  } catch {}
  if (ghost && s.phase === 'grid' && s.ticks === 0) {
    s.side = ghost.samples[0][1] <= 0 ? 9 : -9;
    s.samples[0] = [0, s.side];
  }
  host.innerHTML =
    '<section class="race-game"><div class="race-top"><div><small>Аквапарк</small><h2>Кольцо «Тайфун»</h2></div><div class="race-clock"></div></div><div class="race-ribbon"><span class="race-driver"></span><span class="race-ghost"></span></div><canvas class="race-track" width="720" height="420" aria-label="Вид сверху на кольцевую трассу"></canvas><p class="race-status" aria-live="polite"></p><div class="race-controls"><button type="button" data-drive="left" aria-label="Руль влево">◀ Влево</button><button type="button" data-drive="brake">Тормоз</button><button type="button" data-drive="right" aria-label="Руль вправо">Вправо ▶</button></div><button class="race-go" type="button">Старт</button><p class="race-help">Газ автоматический. Руль — стрелки ← →, тормоз — ↓. Зелёные стрелки ускоряют, лужи и бортики замедляют. На финише передай устройство следующему гонщику.</p></section>';
  const q = (x) => host.querySelector(x),
    g = q('canvas').getContext('2d'),
    clock = q('.race-clock'),
    status = q('.race-status'),
    go = q('.race-go');
  const layer = document.createElement('canvas');
  layer.width = WIDTH;
  layer.height = HEIGHT;
  paintCourse(layer.getContext('2d'));
  const portrait = document.createElement('span');
  portrait.className = 'face face-' + s.hero;
  q('.race-driver').append(portrait, document.createTextNode('За рулём · ' + heroNames[s.hero]));
  q('.race-ghost').textContent = ghost
    ? 'Запись · ' + heroNames[ghost.hero] + ' · ' + seconds(ghost.ticks)
    : 'Первый заезд запишет соперника';
  const abort = new AbortController(),
    opt = { signal: abort.signal };
  const pressed = new Set(),
    keys = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      ArrowDown: 'brake',
      KeyS: 'brake',
    };
  let paused = false,
    stopped = false,
    frame,
    then = null,
    debt = 0;
  const persist = () => {
    if (!stopped) save(structuredClone(s));
  };
  function paint() {
    g.drawImage(layer, 0, 0);
    if (ghost) {
      g.save();
      g.setLineDash([3, 4]);
      stroke(g, '#bbf5ffb8', 2, () => {
        for (let age = 48; age >= 0; age -= SAMPLE) {
          const point = roadAt(...ghostAt(ghost, s.ticks - age));
          if (age === 48) g.moveTo(point.x, point.y);
          else g.lineTo(point.x, point.y);
        }
      });
      g.restore();
      const [d, l] = ghostAt(ghost, s.ticks);
      kart(g, roadAt(d, l), ghost.hero, true, false);
    }
    kart(g, roadAt(s.s, s.side), s.hero, false, s.boost > 0);
    clock.textContent = seconds(s.ticks);
    const text =
      s.phase === 'grid'
        ? 'Один круг до клетчатой черты'
        : s.boost > 0
          ? 'Разгон!'
          : s.splash > 0
            ? 'Вода под колёсами'
            : Math.abs(s.side) > ROAD - 7
              ? 'У бортика медленнее'
              : 'Круг · ' + Math.floor((s.s / courseLength) * 100) + '%';
    if (status.textContent !== text) status.textContent = text;
    go.hidden = s.phase !== 'grid';
  }
  function run(now) {
    if (paused || stopped) return;
    if (then !== null && s.phase === 'run') {
      debt += Math.min(0.1, (now - then) / 1000);
      while (debt >= TICK && s.phase === 'run') {
        drive(s, Number(pressed.has('right')) - Number(pressed.has('left')), pressed.has('brake'));
        debt -= TICK;
        if (s.ticks % 60 === 0 && s.phase === 'run') persist();
      }
    }
    then = now;
    paint();
    if (s.phase === 'finish') {
      stopped = true;
      try {
        localStorage.setItem(key, JSON.stringify(raceRecord(s)));
      } catch {}
      const diff = ghost ? s.ticks - ghost.ticks : 0;
      const comparison = ghost
        ? diff === 0
          ? ' · ничья'
          : ' · ' + (diff < 0 ? 'быстрее' : 'медленнее') + ' на ' + seconds(Math.abs(diff))
        : '';
      finish({ summary: 'Круг за ' + seconds(s.ticks) + comparison, score: Math.round(100000 / s.ticks) });
      return;
    }
    frame = requestAnimationFrame(run);
  }
  go.addEventListener(
    'click',
    () => {
      if (paused || s.phase !== 'grid') return;
      s.phase = 'run';
      then = null;
      paint();
      persist();
    },
    opt,
  );
  for (const b of host.querySelectorAll('[data-drive]')) {
    const action = b.dataset.drive;
    b.addEventListener(
      'pointerdown',
      (e) => {
        if (paused) return;
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        pressed.add(action);
        b.classList.add('held');
      },
      opt,
    );
    b.addEventListener(
      'lostpointercapture',
      () => {
        pressed.delete(action);
        b.classList.remove('held');
      },
      opt,
    );
  }
  document.addEventListener(
    'keydown',
    (e) => {
      if (!paused && !stopped && Object.hasOwn(keys, e.code)) {
        e.preventDefault();
        pressed.add(keys[e.code]);
      }
    },
    opt,
  );
  document.addEventListener('keyup', (e) => pressed.delete(keys[e.code]), opt);
  const clear = () => {
    pressed.clear();
    host.querySelectorAll('.held').forEach((b) => b.classList.remove('held'));
  };
  window.addEventListener('blur', clear, opt);
  persist();
  paint();
  frame = requestAnimationFrame(run);
  return {
    pause() {
      paused = true;
      clear();
      cancelAnimationFrame(frame);
      then = null;
      persist();
    },
    resume() {
      if (!paused || stopped) return;
      paused = false;
      then = null;
      frame = requestAnimationFrame(run);
    },
    destroy() {
      stopped = true;
      abort.abort();
      cancelAnimationFrame(frame);
    },
  };
}
