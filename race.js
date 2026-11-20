import { material, drawLandmark, landmarkAtlas } from './arcade-scenery.js';
import { heroNames } from './progress.js';

// Distance around the closed spline is measured in pixels. Ghost and driver use the same coordinates.
const WIDTH = 720,
  HEIGHT = 420,
  ROAD = 25,
  TICK = 1 / 60,
  SAMPLE = 6,
  TAU = Math.PI * 2;
const typhoonPoints = [
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
const defaultCourse = 'waterpark';
const ghostKey = (id) =>
  'family-games:playroom:race:' + (id === defaultCourse ? 'waterpark-loop' : id) + ':1';
const colors = { kirill: '#29d3c1', maxim: '#ad83ff', mom: '#ffb347', dad: '#648cff', pasha: '#f9c652' };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function curve(a, b, c, d, t) {
  return (
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
  );
}
const layouts = {
  waterpark: {
    name: 'Кольцо «Тайфун»',
    world: 'Аквапарк',
    points: typhoonPoints,
    props: ['water_slide', 'typhoon', 'wave_pool'],
    obstacle: 'лужа',
    ink: '#60bdde',
    boosts: [0.09, 0.31, 0.49, 0.68, 0.86],
    traps: [0.18, 0.41, 0.61, 0.79, 0.94],
  },
  temple: {
    name: 'Ворота изумруда',
    world: 'Храм изумруда',
    points: [
      [350, 355],
      [158, 350],
      [71, 278],
      [79, 130],
      [195, 70],
      [288, 116],
      [361, 190],
      [434, 130],
      [526, 70],
      [641, 125],
      [647, 282],
      [538, 348],
    ],
    props: ['brazier', 'stone_mask', 'brazier'],
    obstacle: 'мох',
    ink: '#7fa657',
    boosts: [0.08, 0.28, 0.62, 0.84],
    traps: [0.16, 0.35, 0.49, 0.7, 0.93],
  },
  arcade: {
    name: 'Карусельный вираж',
    world: 'Игровой центр',
    points: [
      [336, 348],
      [180, 348],
      [99, 284],
      [154, 207],
      [79, 139],
      [125, 68],
      [268, 70],
      [343, 132],
      [436, 72],
      [591, 76],
      [652, 154],
      [582, 212],
      [650, 281],
      [569, 343],
      [446, 303],
    ],
    props: ['slide', 'carousel', 'claw'],
    obstacle: 'россыпь шариков',
    ink: '#da87bb',
    boosts: [0.08, 0.22, 0.4, 0.58, 0.76, 0.91],
    traps: [0.15, 0.33, 0.48, 0.69, 0.84],
  },
  store: {
    name: 'Между стеллажами',
    world: 'Мебельный магазин',
    points: [
      [320, 348],
      [112, 344],
      [77, 295],
      [75, 118],
      [105, 75],
      [286, 74],
      [311, 103],
      [313, 196],
      [386, 218],
      [425, 177],
      [426, 99],
      [477, 73],
      [613, 75],
      [652, 113],
      [650, 302],
      [605, 349],
    ],
    props: ['show_kitchen', 'warehouse', 'living_room'],
    obstacle: 'картон',
    ink: '#c28c55',
    boosts: [0.06, 0.27, 0.48, 0.68, 0.87],
    traps: [0.14, 0.34, 0.43, 0.63, 0.8, 0.95],
  },
  nether: {
    name: 'Базальтовая подкова',
    world: 'Нижний мир',
    points: [
      [330, 354],
      [187, 329],
      [73, 265],
      [94, 194],
      [189, 182],
      [218, 125],
      [159, 77],
      [292, 57],
      [418, 89],
      [491, 166],
      [588, 135],
      [647, 170],
      [634, 277],
      [528, 342],
      [438, 297],
    ],
    props: ['basalt_columns', 'lavafall', 'crimson_fungi'],
    obstacle: 'магма',
    ink: '#ff803f',
    boosts: [0.09, 0.32, 0.6, 0.8],
    traps: [0.17, 0.26, 0.43, 0.52, 0.69, 0.88, 0.95],
  },
  castle: {
    name: 'Серпантин у башен',
    world: 'Замок на Хеллоуин',
    points: [
      [389, 345],
      [255, 358],
      [183, 307],
      [91, 321],
      [64, 229],
      [99, 101],
      [171, 74],
      [248, 146],
      [317, 143],
      [371, 82],
      [461, 66],
      [535, 140],
      [624, 119],
      [664, 221],
      [611, 314],
      [490, 286],
    ],
    props: ['pumpkin_patch', 'gatehouse', 'cauldron'],
    obstacle: 'паутина',
    ink: '#c8b8ce',
    boosts: [0.12, 0.37, 0.65, 0.89],
    traps: [0.07, 0.22, 0.42, 0.56, 0.75, 0.94],
  },
  end: {
    name: 'Орбита Края',
    world: 'Край',
    points: [
      [357, 354],
      [216, 311],
      [119, 333],
      [72, 257],
      [130, 178],
      [97, 107],
      [187, 69],
      [295, 123],
      [396, 81],
      [538, 70],
      [643, 115],
      [628, 211],
      [557, 234],
      [549, 318],
      [461, 344],
    ],
    props: ['chorus_grove', 'exit_portal', 'crystal_spires'],
    obstacle: 'дыхание дракона',
    ink: '#b67ce0',
    boosts: [0.07, 0.24, 0.45, 0.64, 0.83],
    traps: [0.13, 0.31, 0.39, 0.52, 0.72, 0.89, 0.97],
  },
};
function prepareCourse(id, layout) {
  const { points } = layout;
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
  const length = path.at(-1).s;
  const place = (list, sides) =>
    list.map((fraction, i) => ({ s: fraction * length, side: sides[i % sides.length] }));
  return {
    ...layout,
    id,
    path,
    length,
    pads: place(layout.boosts, [-10, 11, -12, 10, -8]),
    puddles: place(layout.traps, [10, -9, 11, -10, 3]),
  };
}
export const courses = Object.fromEntries(
  Object.entries(layouts).map(([id, layout]) => [id, prepareCourse(id, layout)]),
);
export const courseLength = courses[defaultCourse].length;
function roadAt(course, distance, side = 0) {
  const { path, length: courseLength } = course;
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
export function newRace(hero = 'kirill', course = defaultCourse) {
  return {
    v: 1,
    hero: Object.hasOwn(heroNames, hero) ? hero : 'kirill',
    course: Object.hasOwn(courses, course) ? course : defaultCourse,
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
function validSamples(arr, course) {
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
        pt[0] <= Math.ceil(course.length) &&
        Math.abs(pt[1]) <= ROAD &&
        (!i || pt[0] >= arr[i - 1][0]),
    )
  );
}
export function restoreRace(data, hero) {
  const id = data?.course ?? defaultCourse;
  const course = courses[id];
  if (
    !Object.hasOwn(courses, id) ||
    !data ||
    data.v !== 1 ||
    data.hero !== hero ||
    !['grid', 'run'].includes(data.phase) ||
    !validSamples(data.samples, course) ||
    !Number.isInteger(data.ticks) ||
    data.ticks < 0 ||
    data.samples.length !== Math.floor(data.ticks / SAMPLE) + 1 ||
    !Number.isInteger(data.pads) ||
    data.pads < 0 ||
    data.pads > course.pads.length ||
    !['s', 'side', 'speed', 'boost', 'splash'].every((k) => Number.isFinite(data[k])) ||
    data.s < 0 ||
    data.s >= course.length ||
    Math.abs(data.side) > ROAD ||
    data.speed < 0 ||
    data.speed > 160 ||
    data.boost < 0 ||
    data.boost > 1.31 ||
    data.splash < 0 ||
    data.splash > 0.86
  )
    return newRace(hero);
  return { ...structuredClone(data), course: id };
}
export function drive(state, steering = 0, brake = false) {
  if (state.phase !== 'run') return;
  const course = courses[state.course ?? defaultCourse];
  const { length: courseLength, pads, puddles } = course;
  const angle = roadAt(course, state.s).angle,
    next = roadAt(course, state.s + 12).angle;
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
  return {
    v: 1,
    course: state.course ?? defaultCourse,
    hero: state.hero,
    ticks: state.ticks,
    samples: state.samples.map((pt) => [...pt]),
  };
}
export function validRecord(record, id = record?.course ?? defaultCourse) {
  const course = courses[id];
  return (
    !!record &&
    Object.hasOwn(courses, id) &&
    (record.course ?? defaultCourse) === id &&
    record.v === 1 &&
    Object.hasOwn(heroNames, record.hero) &&
    Number.isInteger(record.ticks) &&
    record.ticks > 0 &&
    validSamples(record.samples, course) &&
    record.samples.length === Math.ceil(record.ticks / SAMPLE) + 1 &&
    record.samples.at(-1)[0] === Math.round(course.length)
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

function stroke(g, color, width, draw) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  draw();
  g.stroke();
}
function parasolDeck(g, x, y) {
  g.save();
  g.translate(x, y);
  g.fillStyle = '#1f5461';
  g.fillRect(-26, 4, 58, 27);
  g.fillStyle = '#827059';
  g.fillRect(-29, 0, 58, 27);
  for (let i = 0; i < 5; i++) {
    g.fillStyle = i % 2 ? '#bc9f72' : '#c8ae7b';
    g.fillRect(-28, i * 5, 56, 4);
  }
  g.fillStyle = '#584e43';
  g.fillRect(-2, -10, 4, 28);
  g.fillStyle = '#f4d9a6';
  g.fillRect(-1, -10, 2, 26);
  for (let row = 0; row < 6; row++) {
    const radius = 4 + row * 3;
    g.fillStyle = row === 5 ? '#a95044' : '#df6851';
    g.fillRect(-radius, -20 + row * 3, radius * 2, 3);
    g.fillStyle = '#ffda85';
    g.fillRect(-Math.floor(radius / 2), -20 + row * 3, Math.ceil(radius / 2), 3);
  }
  g.restore();
}
function paintCourse(g, course) {
  const { id, path, pads, puddles } = course;
  g.imageSmoothingEnabled = false;
  g.fillStyle = { temple: '#637e56', arcade: '#4d5272', castle: '#524657' }[id] ?? '#385158';
  g.fillRect(0, 0, WIDTH, HEIGHT);
  g.fillStyle = g.createPattern(material(id, id === 'nether' ? '~' : '#'), 'repeat');
  g.fillRect(0, 0, WIDTH, HEIGHT);
  // The rides are painted before the road, so they never obscure the driving line.
  if (id === 'waterpark') {
    parasolDeck(g, 68, 49);
    parasolDeck(g, 575, 349);
    parasolDeck(g, 629, 365);
  }
  drawLandmark(g, course.props[0], 126, 137, 136);
  drawLandmark(g, course.props[1], 266, 157, 175);
  drawLandmark(g, course.props[2], 500, 112, 130);
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
  stroke(g, g.createPattern(material(id), 'repeat'), ROAD * 2 - 5, line);
  g.setLineDash([5, 11]);
  stroke(g, '#d5e4d65c', 1.3, line);
  g.setLineDash([]);
  const gate = roadAt(course, 0);
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
    const t = roadAt(course, p.s, p.side);
    g.save();
    g.translate(t.x, t.y);
    g.rotate(t.angle - 0.2);
    g.fillStyle = course.ink;
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
    const t = roadAt(course, p.s, p.side);
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
  g.fillRect(-10, -5, 19, 10);
  g.fillRect(-8, -6, 15, 12);
  g.fillStyle = '#c5dcdb';
  g.fillRect(-10, -5, 18, 1);
  g.fillStyle = '#375961';
  g.fillRect(-10, 4, 18, 2);
  g.fillStyle = '#304154';
  g.fillRect(-3, -4, 6, 8);
  g.fillStyle = ghost ? '#e5ffff' : '#e4ae80';
  g.fillRect(-3, -2, 5, 4);
  g.fillStyle = ghost ? '#b5d9da' : '#4d3d34';
  g.fillRect(-4, -3, 3, 6);
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
export function mount(host, { players, saved, save, finish, cue = () => {} }) {
  const hero = players[0];
  let s = restoreRace(saved, hero),
    course = courses[s.course],
    ghost = null;
  host.innerHTML =
    '<section class="race-game"><div class="race-top"><div><small class="race-world"></small><h2></h2></div><div class="race-clock"></div></div><label class="race-course">Трасса <select></select></label><div class="race-ribbon"><span class="race-driver"></span><span class="race-ghost"></span></div><canvas class="race-track" width="720" height="420" aria-label="Вид сверху на кольцевую трассу"></canvas><p class="race-status" aria-live="polite"></p><div class="race-controls"><button type="button" data-drive="left" aria-label="Руль влево">◀ Влево</button><button type="button" data-drive="brake">Тормоз</button><button type="button" data-drive="right" aria-label="Руль вправо">Вправо ▶</button></div><button class="race-go" type="button">Старт</button><p class="race-help">Газ автоматический. Руль — стрелки ← →, тормоз — ↓. Зелёные стрелки ускоряют. Препятствия и бортики замедляют. На финише передай устройство следующему гонщику.</p></section>';
  const q = (x) => host.querySelector(x),
    g = q('canvas').getContext('2d'),
    clock = q('.race-clock'),
    status = q('.race-status'),
    go = q('.race-go'),
    selector = q('.race-course select');
  for (const item of Object.values(courses))
    selector.add(new Option(item.world + ' · ' + item.name, item.id));
  const layer = document.createElement('canvas');
  layer.width = WIDTH;
  layer.height = HEIGHT;
  const courseContext = layer.getContext('2d');
  const atlas = landmarkAtlas();
  const portrait = document.createElement('span');
  portrait.className = 'face face-' + s.hero;
  q('.race-driver').append(portrait, document.createTextNode('За рулём · ' + heroNames[s.hero]));
  function selectCourse() {
    course = courses[s.course];
    ghost = null;
    try {
      const record = JSON.parse(localStorage.getItem(ghostKey(course.id)));
      if (validRecord(record, course.id)) ghost = record;
    } catch {}
    if (ghost && s.phase === 'grid') {
      s.side = ghost.samples[0][1] <= 0 ? 9 : -9;
      s.samples[0] = [0, s.side];
    }
    selector.value = course.id;
    q('.race-world').textContent = course.world;
    q('h2').textContent = course.name;
    q('.race-ghost').textContent = ghost
      ? 'Запись · ' + heroNames[ghost.hero] + ' · ' + seconds(ghost.ticks)
      : 'Первый заезд запишет соперника';
    paintCourse(courseContext, course);
  }
  selectCourse();
  const abort = new AbortController(),
    opt = { signal: abort.signal };
  atlas.addEventListener(
    'load',
    () => {
      paintCourse(courseContext, course);
      paint();
    },
    opt,
  );
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
          const point = roadAt(course, ...ghostAt(ghost, s.ticks - age));
          if (age === 48) g.moveTo(point.x, point.y);
          else g.lineTo(point.x, point.y);
        }
      });
      g.restore();
      const [d, l] = ghostAt(ghost, s.ticks);
      kart(g, roadAt(course, d, l), ghost.hero, true, false);
    }
    kart(g, roadAt(course, s.s, s.side), s.hero, false, s.boost > 0);
    clock.textContent = seconds(s.ticks);
    const text =
      s.phase === 'grid'
        ? 'Один круг до клетчатой черты'
        : s.boost > 0
          ? 'Разгон!'
          : s.splash > 0
            ? 'Помеха · ' + course.obstacle
            : Math.abs(s.side) > ROAD - 7
              ? 'У бортика медленнее'
              : 'Круг · ' + Math.floor((s.s / course.length) * 100) + '%';
    if (status.textContent !== text) status.textContent = text;
    go.hidden = s.phase !== 'grid';
    selector.disabled = s.phase !== 'grid';
  }
  function run(now) {
    if (paused || stopped) return;
    if (then !== null && s.phase === 'run') {
      const pads = s.pads, splash = s.splash;
      debt += Math.min(0.1, (now - then) / 1000);
      while (debt >= TICK && s.phase === 'run') {
        drive(s, Number(pressed.has('right')) - Number(pressed.has('left')), pressed.has('brake'));
        debt -= TICK;
        if (s.ticks % 60 === 0 && s.phase === 'run') persist();
      }
      if (s.phase === 'finish') cue('race-finish');
      else if (s.pads > pads) cue('race-boost');
      else if (s.splash > splash) cue('race-skid');
    }
    then = now;
    paint();
    if (s.phase === 'finish') {
      stopped = true;
      try {
        localStorage.setItem(ghostKey(course.id), JSON.stringify(raceRecord(s)));
      } catch {}
      const diff = ghost ? s.ticks - ghost.ticks : 0;
      const comparison = ghost
        ? diff === 0
          ? ' · ничья'
          : ' · ' + (diff < 0 ? 'быстрее' : 'медленнее') + ' на ' + seconds(Math.abs(diff))
        : '';
      finish({
        summary: course.name + ' · Круг за ' + seconds(s.ticks) + comparison,
        score: Math.round(100000 / s.ticks),
      });
      return;
    }
    frame = requestAnimationFrame(run);
  }
  selector.addEventListener(
    'change',
    () => {
      if (paused || s.phase !== 'grid') return;
      s = newRace(hero, selector.value);
      selectCourse();
      paint();
      persist();
    },
    opt,
  );
  go.addEventListener(
    'click',
    () => {
      if (paused || s.phase !== 'grid') return;
      s.phase = 'run';
      cue('race-start');
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
      if (!paused && !stopped && s.phase === 'run' && Object.hasOwn(keys, e.code)) {
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
