import { drawLandmark, material } from './arcade-scenery.js';
import { heroNames } from './progress.js';

const W = 360,
  H = 480,
  R = 6,
  DT = 1 / 120,
  TAU = Math.PI * 2;
const classicBumpers = [
  [88, 136, 23],
  [222, 110, 23],
  [198, 214, 23],
];
export const tables = {
  aqua: {
    title: 'Тайфун',
    world: 'waterpark',
    props: ['wave_pool', 'water_slide', 'typhoon'],
    layout: classicBumpers,
    task: 'Зажги три горки для «Тайфуна»',
    place: 'Аквапарк',
    name: 'Тайфун',
    targets: ['Горка «Волна»', 'Горка «Кобра»', 'Горка «Радуга»'],
    felt: '#17565e',
    deep: '#123448',
    line: '#498f8b',
    light: '#baf7d8',
    accent: '#ffb864',
    lights: ['#fb9665', '#66e6ee', '#fada77'],
  },
  end: {
    title: 'Башня шалкера',
    world: 'end',
    props: ['crystal_spires', 'chorus_grove', 'exit_portal'],
    layout: classicBumpers,
    task: 'Собери три кристалла. Шалкер перенесёт шар наверх',
    place: 'Край',
    name: 'Шалкер',
    targets: ['Кристалл луны', 'Кристалл звёзд', 'Кристалл эха'],
    felt: '#483456',
    deep: '#27243f',
    line: '#9270aa',
    light: '#edc8ff',
    accent: '#e6dc83',
    lights: ['#d795ff', '#99e5ec', '#f4d48c'],
  },
  temple: {
    title: 'Каменный оракул',
    place: 'Храм изумруда',
    name: 'Оракул',
    world: 'temple',
    props: ['brazier', 'stone_mask', 'brazier'],
    targets: ['Восточная чаша', 'Золотая маска', 'Западная чаша'],
    task: 'Зажги два алтаря и маску оракула',
    layout: [
      [71, 120, 18],
      [165, 159, 28],
      [257, 127, 18],
    ],
    guides: [
      [90, 249, 125, 227],
      [223, 228, 255, 246],
    ],
    gravity: 415,
    deep: '#204138',
    line: '#69937b',
    light: '#cfebaa',
    accent: '#efba69',
    lights: ['#e8a66b', '#81e8a2', '#ebda8c'],
  },
  arcade: {
    title: 'Карусель огней',
    place: 'Игровой центр',
    name: 'Карусель',
    world: 'arcade',
    props: ['slide', 'claw', 'carousel'],
    targets: ['Горка', 'Автомат с призами', 'Карусель'],
    task: 'Попади во все три аттракциона',
    layout: [
      [86, 169, 22],
      [169, 109, 20],
      [235, 200, 26],
    ],
    guides: [[66, 243, 104, 225]],
    gravity: 430,
    deep: '#363455',
    line: '#8b739c',
    light: '#d1eaf6',
    accent: '#efa0ae',
    lights: ['#ef9aae', '#80e0d7', '#f3d37b'],
  },
  store: {
    title: 'Склад заказов',
    place: 'Мебельный магазин',
    name: 'Подъёмник',
    world: 'store',
    props: ['living_room', 'warehouse', 'show_kitchen'],
    targets: ['Кресло', 'Склад', 'Кухня'],
    task: 'Собери заказ с трёх полок',
    layout: [
      [71, 143, 21],
      [174, 189, 20],
      [251, 91, 19],
    ],
    guides: [
      [111, 95, 129, 122],
      [212, 243, 249, 251],
    ],
    gravity: 462,
    deep: '#48403b',
    line: '#a1886c',
    light: '#f3dca2',
    accent: '#83c4c1',
    lights: ['#edd282', '#9cd8b4', '#eca17a'],
  },
  nether: {
    title: 'Кузница гастов',
    place: 'Нижний мир',
    name: 'Кузница',
    world: 'nether',
    props: ['basalt_columns', 'crimson_fungi', 'lavafall'],
    targets: ['Базальт', 'Багровый гриб', 'Лавопад'],
    task: 'Разожги три жерла кузницы',
    layout: [
      [85, 99, 21],
      [230, 157, 27],
      [133, 223, 18],
    ],
    guides: [
      [65, 194, 88, 209],
      [255, 105, 268, 80],
    ],
    gravity: 495,
    deep: '#472e39',
    line: '#945d58',
    light: '#ffe09a',
    accent: '#eaa58a',
    lights: ['#ff965f', '#fcbb83', '#e07891'],
  },
  castle: {
    title: 'Ведьмины часы',
    place: 'Замок на Хеллоуин',
    name: 'Полночь',
    world: 'castle',
    props: ['pumpkin_patch', 'cauldron', 'gatehouse'],
    targets: ['Тыквы', 'Котёл', 'Часовая башня'],
    task: 'Разбуди три огня до полуночи',
    layout: [
      [89, 205, 20],
      [141, 98, 24],
      [249, 167, 19],
    ],
    guides: [
      [99, 145, 126, 159],
      [199, 232, 223, 215],
    ],
    gravity: 400,
    deep: '#382f48',
    line: '#877696',
    light: '#d9ebc6',
    accent: '#efaf69',
    lights: ['#efae72', '#a9db91', '#cca9f2'],
  },
};
const walls = [
  [14, 354, 14, 107],
  [14, 107, 26, 65],
  [26, 65, 56, 34],
  [56, 34, 99, 21],
  [99, 21, 250, 21],
  [250, 21, 301, 37],
  [301, 37, 337, 70],
  [337, 70, 347, 108],
  [347, 108, 347, 466],
  [314, 101, 314, 343],
  [314, 343, 285, 380],
  [285, 380, 229, 406],
  [14, 354, 46, 385],
  [46, 385, 91, 406],
  // Slings leave two return lanes on either side of the flippers.
  [49, 302, 58, 348],
  [58, 348, 92, 363],
  [92, 363, 49, 302],
  [278, 298, 268, 347],
  [268, 347, 237, 361],
  [237, 361, 278, 298],
  [77, 193, 49, 220],
  [259, 193, 287, 220],
];
// The hinged one-way gate lifts for the upward serve and directs a returning ball back onto the table.
const laneGate = [314, 101, 345, 78];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ghostBall = () => ({ x: 331, y: 441, vx: 0, vy: 0 });
const FLIP_LENGTH = 62,
  REST = 0.48,
  UP = -0.62;
export function newPinball(hero = 'kirill', table = 'aqua') {
  return {
    v: 1,
    hero: Object.hasOwn(heroNames, hero) ? hero : 'kirill',
    table: Object.hasOwn(tables, table) ? table : 'aqua',
    phase: 'serve',
    balls: 3,
    score: 0,
    hits: 0,
    bonus: 0,
    launches: 0,
    ticks: 0,
    power: 70,
    ball: ghostBall(),
    angles: [REST, REST],
    flash: [0, 0, 0],
    ride: 0,
    lock: 0,
    event: 'ready',
  };
}
const phases = ['serve', 'play', 'ride', 'done'];
export function restorePinball(saved, hero) {
  const between = (x, a, b) => Number.isFinite(x) && x >= a && x <= b;
  if (
    !saved ||
    saved.v !== 1 ||
    saved.hero !== hero ||
    !Object.hasOwn(tables, saved.table) ||
    !phases.includes(saved.phase) ||
    ![saved.balls, saved.hits, saved.score, saved.bonus, saved.ticks, saved.launches].every(
      Number.isSafeInteger,
    ) ||
    !between(saved.balls, 1, 3) ||
    saved.phase === 'done' ||
    !between(saved.hits, 0, 7) ||
    saved.score < 0 ||
    saved.bonus < 0 ||
    saved.ticks < 0 ||
    saved.launches < 0 ||
    !between(saved.power, 55, 100) ||
    !saved.ball ||
    !between(saved.ball.x, -20, W + 20) ||
    !between(saved.ball.y, -20, H + 20) ||
    !between(saved.ball.vx, -1000, 1000) ||
    !between(saved.ball.vy, -1000, 1000) ||
    !between(saved.ride, 0, 1.2) ||
    !between(saved.lock, 0, 2) ||
    !Array.isArray(saved.angles) ||
    saved.angles.length !== 2 ||
    !saved.angles.every((a) => between(a, UP - 1e-8, REST + 1e-8)) ||
    !Array.isArray(saved.flash) ||
    saved.flash.length !== 3 ||
    !saved.flash.every((a) => between(a, 0, 1)) ||
    typeof saved.event !== 'string'
  )
    return newPinball(hero);
  return structuredClone(saved);
}
export function launchPinball(s) {
  if (s.phase !== 'serve') return false;
  s.phase = 'play';
  s.launches++;
  s.ball = ghostBall();
  s.ball.vy = -620 - s.power * 1.65;
  s.event = 'launch';
  return true;
}
function bounce(ball, nx, ny, sx, sy, restitution) {
  const speed = (ball.vx - sx) * nx + (ball.vy - sy) * ny;
  if (speed < 0) {
    ball.vx -= (1 + restitution) * speed * nx;
    ball.vy -= (1 + restitution) * speed * ny;
  }
}
// Resolve a capsule collision with the velocity of the touched point on a rotating flipper.
function segment(ball, x1, y1, x2, y2, radius, angularSpeed = 0) {
  const dx = x2 - x1,
    dy = y2 - y1,
    pos = clamp(((ball.x - x1) * dx + (ball.y - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  const x = x1 + dx * pos,
    y = y1 + dy * pos;
  const dist = Math.hypot(ball.x - x, ball.y - y);
  if (dist >= radius + R) return;
  const nx = dist > 0.00001 ? (ball.x - x) / dist : dy / Math.hypot(dx, dy);
  const ny = dist > 0.00001 ? (ball.y - y) / dist : -dx / Math.hypot(dx, dy);
  ball.x = x + nx * (radius + R);
  ball.y = y + ny * (radius + R);
  bounce(ball, nx, ny, -angularSpeed * dy * pos, angularSpeed * dx * pos, angularSpeed ? 0.83 : 0.68);
}
export function flipper(i, angle) {
  const x = i ? 229 : 91,
    y = 406,
    dir = i ? -1 : 1;
  return [x, y, x + dir * FLIP_LENGTH * Math.cos(angle), y + FLIP_LENGTH * Math.sin(angle)];
}
function orbit(s) {
  const t = 1.2 - s.ride,
    a = t * 8,
    r = 30 * Math.max(0, 1 - t / 1.2);
  return { x: 153 + Math.cos(a) * r, y: 184 + Math.sin(a) * r * 0.67 };
}
function capture(s) {
  s.phase = 'ride';
  s.ride = 1.2;
  s.event = 'ride';
  s.bonus++;
  s.score += s.table === 'end' ? 125 : 250;
}
export function tickPinball(s, left = false, right = false) {
  if (s.phase === 'done') return;
  const previous = [...s.angles];
  for (let i = 0; i < 2; i++) {
    const target = (i ? right : left) ? UP : REST;
    s.angles[i] += clamp(target - s.angles[i], -15 * DT, 7 * DT);
  }
  if (s.phase === 'serve') return;
  s.ticks++;
  s.lock = Math.max(0, s.lock - DT);
  for (let i = 0; i < 3; i++) s.flash[i] = Math.max(0, s.flash[i] - DT);
  const b = s.ball;
  if (s.phase === 'ride') {
    s.ride = Math.max(0, s.ride - DT);
    Object.assign(b, orbit(s), { vx: 0, vy: 0 });
    if (s.ride === 0) {
      s.phase = 'play';
      s.lock = 2;
      Object.assign(
        b,
        s.table === 'end' ? { x: 68, y: 71, vx: 330, vy: -105 } : { x: 155, y: 161, vx: 158, vy: -470 },
      );
    }
    return;
  }
  const theme = tables[s.table];
  b.vy += (theme.gravity ?? 445) * DT;
  b.x += b.vx * DT;
  b.y += b.vy * DT;
  b.vx *= 0.99964;
  b.vy *= 0.99988;
  for (const w of walls) segment(b, ...w, 2);
  for (const rail of theme.guides ?? []) segment(b, ...rail, 2);
  if (b.vy > 0) segment(b, ...laneGate, 2);
  for (let i = 0; i < 2; i++) {
    const speed = ((s.angles[i] - previous[i]) * (i ? -1 : 1)) / DT;
    segment(b, ...flipper(i, s.angles[i]), 4.5, speed);
  }
  for (const [i, [x, y, radius]] of theme.layout.entries()) {
    const dx = b.x - x,
      dy = b.y - y,
      dist = Math.hypot(dx, dy);
    if (dist >= radius + R) continue;
    const nx = dist ? dx / dist : 0,
      ny = dist ? dy / dist : -1;
    b.x = x + nx * (radius + R);
    b.y = y + ny * (radius + R);
    if (s.flash[i] > 0) {
      bounce(b, nx, ny, 0, 0, 0.88);
      continue;
    }
    const tangential = clamp(-ny * b.vx + nx * b.vy, -135, 135);
    b.vx = nx * 327 - ny * tangential;
    b.vy = ny * 327 + nx * tangential;
    s.score += s.hits & (1 << i) ? 10 : 35;
    s.hits |= 1 << i;
    s.flash[i] = 0.24;
    s.event = 'hit' + i;
    if (s.hits === 7) {
      s.hits = 0;
      s.score += 125;
      capture(s);
      return;
    }
  }
  if (s.table === 'end' && !s.lock && Math.hypot(b.x - 153, b.y - 184) < 18) {
    capture(s);
    return;
  }
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > 820) {
    b.vx *= 820 / speed;
    b.vy *= 820 / speed;
  }
  if (b.y > H + R) {
    if (b.x > 314) {
      s.phase = 'serve';
      s.event = 'return';
    } else {
      --s.balls;
      s.phase = s.balls ? 'serve' : 'done';
      s.event = 'drain';
    }
    s.ball = ghostBall();
    s.angles = [REST, REST];
  }
}
function circle(g, x, y, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}
function line(g, coords, width, color) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(coords[0], coords[1]);
  g.lineTo(coords[2], coords[3]);
  g.stroke();
}
function paintBoard(g, s) {
  const theme = tables[s.table];
  g.save();
  g.imageSmoothingEnabled = false;
  g.fillStyle = g.createPattern(material(theme.world), 'repeat');
  g.fillRect(0, 0, W, H);
  // The inlaid scenery is below the rails, ball and scoring lamps.
  g.globalAlpha = 0.76;
  drawLandmark(g, theme.props[0], 45, 19, 102, 76);
  drawLandmark(g, theme.props[1], 225, 31, 82, 61);
  g.globalAlpha = 1;
  // Painted return chutes lead the eye from the bumpers to the flippers.
  g.strokeStyle = theme.line;
  g.lineWidth = 3;
  g.globalAlpha = 0.65;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.moveTo(62 + i * 9, 164);
    g.bezierCurveTo(21, 267, 211, 241 + i * 12, 146 + i * 10, 321);
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = s.ticks / 120;
  drawLandmark(g, theme.props[2], 105, 144, 96, 72);
  g.strokeStyle = theme.light;
  g.lineWidth = 1.5;
  for (let j = 0; j < 3; j++) {
    const a = (j * TAU) / 3 + t * 0.38;
    g.beginPath();
    g.ellipse(153, 202, 49, 12, 0, a, a + 0.95);
    g.stroke();
  }
  g.fillStyle = '#fff1cb';
  g.font = 'bold 12px system-ui';
  g.textAlign = 'center';
  g.fillText(theme.name.toUpperCase(), 154, 285);
  for (let i = 0; i < 3; i++) {
    circle(g, 130 + i * 24, 301, 5, s.hits & (1 << i) ? theme.lights[i] : '#172c37');
  }
  for (const w of [...walls, ...(theme.guides ?? [])]) {
    line(g, [w[0] + 1, w[1] + 2, w[2] + 1, w[3] + 2], 7, '#102735');
    line(g, w, 5, theme.line);
    line(g, w, 2, theme.light);
  }
  const gateOpen = s.phase === 'play' && s.ball.vy < 0 && s.ball.x > 314 && Math.abs(s.ball.y - 91) < 30;
  line(g, gateOpen ? [345, 47, 345, 78] : laneGate, 3, theme.light);
  circle(g, 345, 78, 3, theme.line);
  for (const [i, [x, y, r]] of theme.layout.entries()) {
    const flash = s.flash[i] / 0.24;
    circle(g, x + 2, y + 4, r + 3, '#172635');
    circle(g, x, y, r + 2, theme.line);
    circle(g, x, y, r, flash ? '#fff7cd' : theme.lights[i]);
    circle(g, x, y, r - 5, theme.deep);
    const target = theme.props[i];
    drawLandmark(g, target, x - r + 3, y - r + 4, 2 * r - 6, 2 * r - 10);
    g.fillStyle = flash ? '#fff3be' : theme.lights[i];
    g.fillRect(x - 4, y + r - 5, 8, 2);
  }
  for (let i = 0; i < 2; i++) {
    const f = flipper(i, s.angles[i]);
    line(g, [f[0], f[1] + 2, f[2], f[3] + 2], 12, '#152533');
    line(g, f, 10, i ? theme.accent : theme.light);
    line(g, [f[0], f[1] - 2, f[2], f[3] - 2], 2, '#fff4cc');
    circle(g, f[0], f[1], 5, '#657380');
    circle(g, f[0] - 1, f[1] - 1, 2, '#d2e3df');
  }
  line(g, [331, 456, 331, 441], 9, theme.accent);
  for (let y = 446; y < 464; y += 4) line(g, [324, y, 337, y - 1], 1, '#ebecb7');
  if (s.phase !== 'done') {
    const b = s.ball;
    circle(g, b.x + 1.5, b.y + 2, R + 1, '#132330aa');
    const metal = g.createRadialGradient(b.x - 2.4, b.y - 3, 1, b.x, b.y, R + 1);
    metal.addColorStop(0, '#fffcef');
    metal.addColorStop(0.4, '#d6ecf1');
    metal.addColorStop(0.7, '#8baaaf');
    metal.addColorStop(1, '#415078');
    circle(g, b.x, b.y, R, metal);
  }
  g.restore();
}
export function mount(host, { players, saved, save, finish, cue = () => {} }) {
  const hero = players[0];
  let s = restorePinball(saved, hero);
  host.innerHTML =
    '<section class="pin-game"><div class="pin-field"><canvas width="360" height="480" aria-label="Стол пинбола с двумя флипперами и тремя мишенями"></canvas><div class="pin-controls"><button type="button" class="pin-left" aria-label="Левый флиппер">◀ Левый</button><button type="button" class="pin-right" aria-label="Правый флиппер">Правый ▶</button></div></div><div class="pin-panel"><label class="pin-table">Стол <select></select></label><div class="pin-header"><small class="pin-player"><span class="face"></span><span></span></small><h2 class="pin-title"></h2></div><div class="pin-scorebar"><span class="pin-score"></span><span class="pin-balls"></span></div><p class="pin-task"></p><p class="pin-status" role="status"></p><label class="pin-power">Сила запуска <output></output><input type="range" min="55" max="100"></label><button class="pin-launch" type="button">Запустить шар</button><p class="pin-help">Нажимай два флиппера под столом. На клавиатуре — ← и →, пробел запускает шар.</p></div></section>';
  const q = (x) => host.querySelector(x),
    g = q('canvas').getContext('2d'),
    table = q('select'),
    status = q('.pin-status'),
    score = q('.pin-score'),
    balls = q('.pin-balls'),
    power = q('input'),
    launch = q('.pin-launch');
  for (const [id, choice] of Object.entries(tables))
    table.add(new Option(choice.place + ' · ' + choice.title, id));
  const abort = new AbortController(),
    opt = { signal: abort.signal },
    held = [false, false],
    flick = [0, 0];
  let paused = false,
    stopped = false,
    frame,
    last = null,
    debt = 0;
  const persist = () => {
    if (!stopped) save(structuredClone(s));
  };
  q('.pin-player .face').className = 'face face-' + s.hero;
  let previousHud = '';
  function paint() {
    paintBoard(g, s);
    const hud = [s.table, s.phase, s.power, s.score, s.launches, s.balls, s.hits, s.event].join('|');
    if (hud === previousHud) return;
    previousHud = hud;
    table.value = s.table;
    table.disabled = s.launches > 0;
    q('.pin-player span:last-child').textContent = heroNames[s.hero] + ' · ' + tables[s.table].place;
    q('.pin-title').textContent = tables[s.table].title;
    score.textContent = 'Очки · ' + s.score;
    balls.textContent = 'Шары · ' + s.balls;
    const count = [1, 2, 4].filter((bit) => s.hits & bit).length;
    q('.pin-task').textContent = tables[s.table].task + ' · ' + count + '/3';
    const msg = {
      ready: 'Выбери стол и запускай шар.',
      launch: 'Шар в игре',
      ride: tables[s.table].name + '! Бонус × ' + s.bonus,
      drain: 'Шар ушёл. Ещё одна подача!',
      return: 'Шар вернулся в пусковой канал.',
    };
    const text = msg[s.event] || tables[s.table].targets[Number(s.event.slice(-1))] || 'Шар в игре';
    if (status.textContent !== text) status.textContent = text;
    power.value = s.power;
    q('output').textContent = s.power + '%';
    power.disabled = launch.disabled = s.phase !== 'serve';
  }
  function loop(now) {
    if (paused || stopped) return;
    if (last !== null) {
      const balls = s.balls, bonus = s.bonus, points = s.score;
      debt += Math.min(0.1, (now - last) / 1000);
      while (debt >= DT && s.phase !== 'done') {
        // A quick tap between animation frames still delivers one full strike.
        tickPinball(s, held[0] || flick[0] > 0, held[1] || flick[1] > 0);
        flick[0] = Math.max(0, flick[0] - 1);
        flick[1] = Math.max(0, flick[1] - 1);
        debt -= DT;
      }
      if (s.balls < balls) cue('pin-drain');
      else if (s.bonus > bonus) cue('pin-bonus');
      else if (s.score > points && now - lastBumper >= 80) {
        cue('pin-bumper');
        lastBumper = now;
      }
    }
    last = now;
    paint();
    if (s.phase === 'done') {
      stopped = true;
      finish({
        score: s.score,
        summary: tables[s.table].title + ' · ' + s.score + ' очк. · бонусов ' + s.bonus,
      });
      return;
    }
    if (s.phase !== 'serve' && now - savedAt >= 900) {
      persist();
      savedAt = now;
    } else if (s.phase === 'serve' && previousPhase !== 'serve') persist();
    previousPhase = s.phase;
    frame = requestAnimationFrame(loop);
  }
  let lastBumper = -Infinity,
    savedAt = 0,
    previousPhase = s.phase;
  table.addEventListener(
    'change',
    () => {
      if (paused || s.launches) return;
      s = newPinball(hero, table.value);
      paint();
      persist();
    },
    opt,
  );
  power.addEventListener(
    'input',
    () => {
      if (!paused && s.phase === 'serve') {
        s.power = Number(power.value);
        paint();
        persist();
      }
    },
    opt,
  );
  const shoot = () => {
    if (!paused && launchPinball(s)) {
      cue('pin-launch');
      paint();
      persist();
    }
  };
  launch.addEventListener('click', shoot, opt);
  const controls = [q('.pin-left'), q('.pin-right')];
  const toggle = (index, on) => {
    if (on && !held[index]) {
      flick[index] = 9;
      cue('pin-flipper');
    }
    held[index] = on;
    controls[index].classList.toggle('held', on);
  };
  controls.forEach((b, i) => {
    b.addEventListener(
      'pointerdown',
      (e) => {
        if (paused) return;
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        toggle(i, true);
      },
      opt,
    );
    b.addEventListener('lostpointercapture', () => toggle(i, false), opt);
  });
  const dirs = { ArrowLeft: 0, KeyA: 0, ArrowRight: 1, KeyD: 1 };
  document.addEventListener(
    'keydown',
    (e) => {
      if (
        paused ||
        stopped ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        ['INPUT', 'SELECT'].includes(e.target.tagName)
      )
        return;
      if (Object.hasOwn(dirs, e.code)) {
        e.preventDefault();
        toggle(dirs[e.code], true);
      }
      if (e.code === 'Space' && !e.repeat && (e.target.tagName !== 'BUTTON' || host.contains(e.target))) {
        e.preventDefault();
        shoot();
      }
    },
    opt,
  );
  document.addEventListener(
    'keyup',
    (e) => {
      if (Object.hasOwn(dirs, e.code)) toggle(dirs[e.code], false);
    },
    opt,
  );
  const release = () => {
    flick.fill(0);
    toggle(0, false);
    toggle(1, false);
  };
  window.addEventListener('blur', release, opt);
  paint();
  persist();
  frame = requestAnimationFrame(loop);
  return {
    pause() {
      paused = true;
      release();
      cancelAnimationFrame(frame);
      last = null;
      persist();
    },
    resume() {
      if (!paused || stopped) return;
      paused = false;
      last = null;
      frame = requestAnimationFrame(loop);
    },
    destroy() {
      stopped = true;
      cancelAnimationFrame(frame);
      abort.abort();
    },
  };
}
