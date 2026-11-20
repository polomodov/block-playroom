import { paintPinball } from './pinball-art.js';
import { collectionProgress, heroNames } from './progress.js';
import { announce, newPinballRules, pinballFeatures, resetBank, restorePinballRules, scoreRollovers, skillPower, stepPinballTimers } from './pinball-rules.js';
export { pinballFeatures, skillPower };


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
  // The thinner guides meet the tops of the flipper pivots without a trapping lip.
  [285, 380, 229, 403],
  [14, 354, 46, 385],
  [46, 385, 91, 403],
  // Slings leave two return lanes on either side of the flippers.
  [49, 302, 58, 348],
  [58, 348, 92, 363],
  pinballFeatures.slings[0],
  [278, 298, 268, 347],
  [268, 347, 237, 361],
  pinballFeatures.slings[1],
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
    ...newPinballRules(),
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
  return { ...structuredClone(saved), ...restorePinballRules(saved) };
}
export function launchPinball(s, power = s.power) {
  if (s.phase !== 'serve' || !Number.isFinite(power)) return false;
  s.power = clamp(Math.round(power), 55, 100);
  s.skillArmed = true;
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
  const impact = -(ball.vx * nx + ball.vy * ny);
  bounce(ball, nx, ny, -angularSpeed * dy * pos, angularSpeed * dx * pos, angularSpeed ? 0.83 : 0.68);
  return impact;
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
function capture(s, notify) {
  s.phase = 'ride';
  s.skillArmed = false;
  s.ride = 1.2;
  s.bonus++;
  s.score += s.table === 'end' ? 125 : 250;
  announce(s, notify, 'ride');
}
export function tickPinball(s, left = false, right = false, notify) {
  if (s.phase === 'done') return;
  const previous = [...s.angles];
  for (let i = 0; i < 2; i++) {
    const target = (i ? right : left) ? UP : REST;
    s.angles[i] += clamp(target - s.angles[i], -15 * DT, 7 * DT);
  }
  if (s.phase === 'serve') return;
  s.ticks++;
  stepPinballTimers(s, DT, notify);
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
  const oldX = b.x, oldY = b.y;
  b.vy += (theme.gravity ?? 445) * DT;
  b.x += b.vx * DT;
  b.y += b.vy * DT;
  b.vx *= 0.99964;
  b.vy *= 0.99988;
  for (const wall of walls) {
    const impact = segment(b, ...wall, 2);
    if (!(impact > 20)) continue;
    const side = pinballFeatures.slings.indexOf(wall);
    if (side < 0 || s.slings[side] > 0) continue;
    const inward = side ? -1 : 1;
    const [x1, y1, x2, y2] = wall;
    const edgeX = x1 + (x2 - x1) * (b.y - y1) / (y2 - y1);
    if ((b.x - edgeX) * inward <= 0) continue;
    b.vx += inward * 110;
    b.vy = Math.min(-80, b.vy - 55);
    s.slings[side] = .24;
    s.score += 15 * s.multiplier;
    announce(s, notify, 'sling', side);
  }
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
    announce(s, notify, 'bumper', i);
    if (s.hits === 7) {
      s.hits = 0;
      s.score += 125;
      capture(s, notify);
      return;
    }
  }
  if (s.table === 'end' && !s.lock && Math.hypot(b.x - 153, b.y - 184) < 18) {
    capture(s, notify);
    return;
  }
  scoreRollovers(s, oldX, oldY, notify);
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > 820) {
    b.vx *= 820 / speed;
    b.vy *= 820 / speed;
  }
  if (b.y > H + R) {
    if (b.x > 314) {
      s.phase = 'serve';
      announce(s, notify, 'return');
    } else {
      --s.balls;
      s.phase = s.balls ? 'serve' : 'done';
      resetBank(s);
      s.multiplier = 1;
      announce(s, notify, 'drain');
    }
    s.skillArmed = false;
    s.ball = ghostBall();
    s.angles = [REST, REST];
  }
}
const geometry = { walls, laneGate, flipper, ...pinballFeatures };
const formatScore = new Intl.NumberFormat('ru-RU');
const bestKey = id => 'family-games:' + new URL('.', import.meta.url).pathname + ':pinball-best:' + id;
function previousBest(id) {
  let best = 0;
  try { best = Number(localStorage.getItem(bestKey(id))) || 0; } catch { /* Private session. */ }
  // Earlier editions stored the table title in the shared history.
  for (const round of collectionProgress().results) {
    if (round.mode === 'pinball' && round.summary.startsWith(tables[id].title + ' ·') && Number.isSafeInteger(round.score)) {
      best = Math.max(best, round.score);
    }
  }
  return Number.isSafeInteger(best) && best > 0 ? best : 0;
}

const effects = {
  bumper: 'pin-bumper', ride: 'pin-bonus', drain: 'pin-drain', sling: 'pin-sling',
  target: 'pin-target', skill: 'pin-skill', armed: 'pin-armed', jackpot: 'pin-jackpot',
};
const cueOrder = ['jackpot', 'drain', 'armed', 'ride', 'skill', 'target', 'bumper', 'sling'];

export function mount(host, { players, saved, save, finish, cue = () => {} }) {
  const hero = players[0];
  let s = restorePinball(saved, hero);
  host.innerHTML = `
    <section class="pin-game">
      <div class="pin-machine">
        <div class="pin-marquee">
          <div class="pin-readout"><span>Очки</span><strong class="pin-score"></strong></div>
          <div class="pin-readout pin-factor"><span>Множитель</span><strong></strong></div>
          <div class="pin-readout pin-stock"><span>Шары</span><div class="pin-balls"></div></div>
        </div>
        <div class="pin-field"><canvas width="720" height="960" aria-label="Игровое поле пинбола с левой и правой лопатками"></canvas></div>
        <div class="pin-ticker"><span class="pin-status" role="status"></span><b class="pin-countdown" aria-hidden="true" hidden></b></div>
        <div class="pin-controls">
          <button type="button" class="pin-left" aria-label="Левый флиппер"><i aria-hidden="true">◀</i> Левый</button>
          <button type="button" class="pin-launch" aria-label="Запустить шар. Удерживай для выбора силы">Пуск</button>
          <button type="button" class="pin-right" aria-label="Правый флиппер">Правый <i aria-hidden="true">▶</i></button>
        </div>
      </div>
      <aside class="pin-panel">
        <header class="pin-backglass"><span class="pin-place"></span><h2 class="pin-title"></h2></header>
        <div class="pin-operator"><span class="pin-player"><span class="face"></span><b></b></span><span>Рекорд стола <strong class="pin-best"></strong></span></div>
        <label class="pin-table">Выбор стола<select></select></label>
        <section class="pin-contract">
          <h3 class="pin-objective"></h3>
          <div class="pin-targets" aria-label="Горящие мишени"></div>
          <p class="pin-mission"></p>
        </section>
        <div class="pin-serving"><label class="pin-power">Сила подачи <output></output><span class="pin-track"><span></span></span>
          <input type="range" min="55" max="100" aria-label="Сила подачи"></label>
          <p class="pin-skill-tip"></p></div>
        <details class="pin-rules"><summary>Как играть</summary><p>Удерживай «Пуск» или пробел и отпусти для подачи. Короткое нажатие запускает шар с выбранной силой.</p><p>Стрелки ← и → поднимают лопатки. На экране можно держать сразу две кнопки или нажимать на две половины стола.</p><p class="pin-task"></p></details>
      </aside>
    </section>`;
  const q = selector => host.querySelector(selector);
  const root = q('.pin-game'), canvas = q('canvas'), g = canvas.getContext('2d');
  const table = q('select'), power = q('input'), launch = q('.pin-launch'), controls = [q('.pin-left'), q('.pin-right')];
  const lamps = ['I','II','III'].map(label => {
    const lamp = document.createElement('span');
    lamp.textContent = label;
    q('.pin-targets').append(lamp);
    return lamp;
  });
  for (const [id, choice] of Object.entries(tables)) table.add(new Option(choice.place + ' · ' + choice.title, id));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController(), opt = { signal: abort.signal };
  const holders = [new Set(), new Set()], flick = [0, 0], pending = new Set();
  let frame, last = null, debt = 0, paused = false, stopped = false, charge = null;
  let savedAt = 0, previousPhase = s.phase, hud = '', lastEffect = -Infinity, best = previousBest(s.table);
  // Keep the table picker within reach above the field on a phone.
  const portrait = matchMedia('(max-width: 640px) and (orientation: portrait)');
  const picker = q('.pin-table');
  function placePicker() {
    if (portrait.matches) root.prepend(picker);
    else q('.pin-operator').after(picker);
  }
  portrait.addEventListener('change', placePicker, opt);
  placePicker();
  const persist = () => { if (!stopped) save(structuredClone(s)); };
  q('.pin-player .face').className = 'face face-' + hero;
  q('.pin-player b').textContent = heroNames[hero];
  const chargePower = now => {
    if (!charge || now - charge.start < 160) return s.power;
    return 55 + Math.round(45 * Math.min(1, (now - charge.start - 160) / 1000));
  };
  const msgs = {
    ready: 'Шар на пружине · удерживай «Пуск»', launch: 'Проведи шар через мишени I, II и III', skill: 'Точная подача!',
    drain: 'Шар потерян · следующая подача', return: 'Шар вернулся на пружину',
    armed: 'Джекпот открыт! Целься в верхнее кольцо', jackpot: 'Джекпот!',
    expired: 'Время вышло · снова зажги три мишени',
    sling0: 'Отскок слева', sling1: 'Отскок справа',
  };
  function paint(now = performance.now()) {
    const strength = chargePower(now), theme = tables[s.table];
    paintPinball(g, s, theme, geometry, { charge: charge ? (strength - 55) / 45 : 0, reducedMotion: motion.matches });
    const seconds = Math.ceil(s.jackpotTime);
    const signature = [s.table, s.phase, s.score, s.balls, s.hits, s.bank, s.event, seconds, s.multiplier, strength, !!charge, best].join('|');
    if (signature === hud) return;
    hud = signature;
    root.dataset.table = s.table;
    root.dataset.phase = s.phase;
    root.classList.toggle('pin-armed', seconds > 0);
    root.style.setProperty('--pin-lamp', theme.lights[1]);
    table.value = s.table;
    table.disabled = s.launches > 0;
    q('.pin-place').textContent = theme.place;
    q('.pin-title').textContent = theme.title;
    q('.pin-score').textContent = formatScore.format(s.score);
    q('.pin-factor strong').textContent = '×' + s.multiplier;
    const stock = q('.pin-balls');
    if (stock.dataset.count !== String(s.balls)) {
      stock.dataset.count = s.balls;
      stock.setAttribute('aria-label', 'Шаров осталось: ' + s.balls);
      stock.replaceChildren(...Array.from({ length: 3 }, (_, i) => {
        const ball = document.createElement('i');
        if (i < s.balls) ball.className = 'live';
        return ball;
      }));
    }
    q('.pin-best').textContent = formatScore.format(best);
    q('.pin-task').textContent = theme.task + '. Серия попаданий в бамперы включает аттракцион «' + theme.name + '».';
    q('.pin-objective').textContent = seconds ? 'Джекпот · ' + seconds + ' с' : 'Зажги три мишени';
    q('.pin-mission').textContent = seconds ? 'Отправь шар в светящееся кольцо наверху.' : 'Мишени I, II и III открывают верхнее кольцо джекпота.';
    let lit = 0;
    lamps.forEach((lamp, i) => {
      const on = Boolean(seconds || s.bank & (1 << i));
      lamp.classList.toggle('lit', on);
      if (on) lit++;
    });
    q('.pin-targets').setAttribute('aria-label', 'Горит мишеней: ' + lit + ' из 3');
    let message = msgs[s.event];
    if (s.event.startsWith('hit')) message = theme.targets[Number(s.event.slice(-1))];
    if (s.event.startsWith('target')) message = 'Мишень ' + ['I', 'II', 'III'][Number(s.event.slice(-1))] + ' горит';
    if (s.event === 'ride') message = theme.name + '! Бонус за бамперы';
    const status = q('.pin-status');
    if (status.textContent !== (message || 'Шар в игре')) status.textContent = message || 'Шар в игре';
    const countdown = q('.pin-countdown');
    countdown.hidden = !seconds;
    countdown.textContent = seconds ? 'Джекпот · ' + seconds + ' с' : '';
    power.value = s.power;
    const [low, high] = skillPower[s.table];
    q('output').textContent = strength + '%';
    root.style.setProperty('--pin-fill', ((strength - 55) / 45 * 100) + '%');
    root.style.setProperty('--pin-low', ((low - 55) / 45 * 100) + '%');
    root.style.setProperty('--pin-high', ((high - 55) / 45 * 100) + '%');
    q('.pin-skill-tip').textContent = 'Точная подача · ' + low + '–' + high + '%';
    power.disabled = launch.disabled = s.phase !== 'serve';
    launch.classList.toggle('held', Boolean(charge));
    launch.textContent = charge ? strength + '%' : 'Пуск';
  }
  function loop(now) {
    if (paused || stopped) return;
    if (last !== null) {
      debt += Math.min(0.1, (now - last) / 1000);
      while (debt >= DT && s.phase !== 'done') {
        tickPinball(s, holders[0].size > 0 || flick[0] > 0, holders[1].size > 0 || flick[1] > 0, event => pending.add(event));
        for (let i = 0; i < 2; i++) flick[i] = Math.max(0, flick[i] - 1);
        debt -= DT;
      }
      const effect = cueOrder.find(event => pending.has(event));
      if (effect && (effect !== 'bumper' || now - lastEffect >= 80)) {
        cue(effects[effect]);
        lastEffect = now;
      }
      pending.clear();
    }
    last = now;
    paint(now);
    if (s.phase === 'done') {
      stopped = true;
      const record = s.score > Math.max(best, previousBest(s.table));
      if (record) {
        try { localStorage.setItem(bestKey(s.table), String(s.score)); } catch { /* Shared history also records the result. */ }
      }
      finish({ score: s.score, summary: tables[s.table].title + ' · ' + formatScore.format(s.score) +
        ' очк. · джекпотов ' + s.jackpots + (record ? ' · Новый рекорд!' : '') });
      return;
    }
    if ((s.phase !== 'serve' && now - savedAt >= 900) || (s.phase === 'serve' && previousPhase !== 'serve')) {
      persist();
      savedAt = now;
    }
    previousPhase = s.phase;
    frame = requestAnimationFrame(loop);
  }
  table.addEventListener('change', () => {
    if (paused || s.launches) return;
    charge = null;
    s = newPinball(hero, table.value);
    best = previousBest(s.table);
    paint();
    persist();
  }, opt);
  power.addEventListener('input', () => {
    if (paused || s.phase !== 'serve') return;
    s.power = Number(power.value);
    paint();
    persist();
  }, opt);
  const shoot = strength => {
    if (paused || stopped || !launchPinball(s, strength)) return;
    cue('pin-launch');
    const cabinet = q('.pin-machine');
    if (cabinet.getBoundingClientRect().top < 0 && cabinet.offsetHeight <= window.innerHeight) {
      cabinet.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    paint();
    persist();
  };
  const wind = owner => {
    if (!paused && !stopped && s.phase === 'serve' && !charge) {
      charge = { owner, start: performance.now() };
      paint();
    }
  };
  const unwind = (owner, fire) => {
    if (charge?.owner !== owner) return;
    const strength = chargePower(performance.now());
    charge = null;
    if (fire) shoot(strength);
    else paint();
  };
  launch.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    launch.setPointerCapture(e.pointerId);
    wind(e.pointerId);
  }, opt);
  launch.addEventListener('pointerup', e => unwind(e.pointerId, true), opt);
  launch.addEventListener('lostpointercapture', e => unwind(e.pointerId, false), opt);
  launch.addEventListener('click', e => { if (!e.detail) shoot(s.power); }, opt);
  const toggle = (i, owner, on) => {
    if (on) {
      if (!holders[i].size) { flick[i] = 9; cue('pin-flipper'); }
      holders[i].add(owner);
    } else holders[i].delete(owner);
    controls[i].classList.toggle('held', holders[i].size > 0);
  };
  function bindFlippers(element, side) {
    element.addEventListener('pointerdown', e => {
      if (paused || stopped || e.button !== 0) return;
      e.preventDefault();
      element.setPointerCapture(e.pointerId);
      toggle(side(e), e.pointerId, true);
    }, opt);
    element.addEventListener('lostpointercapture', e => {
      toggle(0, e.pointerId, false);
      toggle(1, e.pointerId, false);
    }, opt);
  }
  controls.forEach((button, i) => {
    bindFlippers(button, () => i);
    button.addEventListener('click', e => {
      if (e.detail || paused || stopped) return;
      toggle(i, 'button', true);
      toggle(i, 'button', false);
    }, opt);
  });
  bindFlippers(canvas, e => e.clientX < canvas.getBoundingClientRect().left + canvas.clientWidth / 2 ? 0 : 1);
  const sides = { ArrowLeft: 0, KeyA: 0, ArrowRight: 1, KeyD: 1 };
  document.addEventListener('keydown', e => {
    if (paused || stopped || e.altKey || e.ctrlKey || e.metaKey || ['INPUT', 'SELECT', 'SUMMARY'].includes(e.target.tagName)) return;
    if (Object.hasOwn(sides, e.code)) {
      e.preventDefault();
      toggle(sides[e.code], e.code, true);
    }
    if (e.code === 'Space' && (e.target.tagName !== 'BUTTON' || e.target === launch || controls.includes(e.target))) {
      e.preventDefault();
      if (!e.repeat) wind('keyboard');
    }
  }, opt);
  document.addEventListener('keyup', e => {
    if (Object.hasOwn(sides, e.code)) toggle(sides[e.code], e.code, false);
    if (e.code === 'Space' && charge?.owner === 'keyboard') { e.preventDefault(); unwind('keyboard', true); }
  }, opt);
  const release = () => {
    charge = null;
    flick.fill(0);
    for (let i = 0; i < 2; i++) { holders[i].clear(); controls[i].classList.remove('held'); }
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
