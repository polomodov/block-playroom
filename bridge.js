import { drawLandmark, material } from './arcade-scenery.js';
// Elastic deck joints distribute the moving load to adjacent spans, struts and suspension cables.
export const crossings = [
  {
    name: 'Базальтовый ручей',
    bays: 3,
    load: 16,
    limit: 10.2,
    posts: [1, 2],
    ropes: [],
    stock: [1, 0],
    hint: 'Положи три настила. Под одним из стыков добавь деревянную опору.',
  },
  {
    name: 'Огненный разлом',
    bays: 5,
    load: 18,
    limit: 12.4,
    posts: [1, 2],
    ropes: [3, 4],
    stock: [1, 1],
    hint: 'В скале слева есть место для опоры, а справа стоят мачты для троса. Распредели нагрузку между ними.',
  },
  {
    name: 'Дорога к порталу',
    bays: 6,
    load: 22,
    limit: 13.8,
    posts: [2, 3, 4],
    ropes: [1, 2, 4, 5],
    stock: [1, 2],
    hint: 'Тяжёлая вагонетка с кристаллами! Поддержи и середину, и длинные пролёты по краям.',
  },
  {
    name: 'Две базальтовые сваи', bays: 6, load: 21, limit: 15,
    posts: [1, 2, 4, 5], ropes: [], stock: [2, 0],
    hint: 'Две опоры на шесть настилов. Раздели переправу на короткие пролёты.',
  },
  {
    name: 'Подвесной перевал', bays: 6, load: 23, limit: 16.8,
    posts: [], ropes: [1, 2, 3, 4, 5], stock: [0, 2],
    hint: 'Под мостом нет ни одной скалы. Подхвати настил двумя тросами с береговых мачт.',
  },
  {
    name: 'Путь к кузнице', bays: 7, load: 27, limit: 18.5,
    posts: [1, 3, 5], ropes: [2, 4, 6], stock: [2, 1],
    hint: 'Вагонетка везёт руду. Две деревянные опоры несут основной вес, трос страхует длинный пролёт.',
  },
  {
    name: 'Обсидиановый виадук', bays: 7, load: 30, limit: 21,
    posts: [2, 4, 5], ropes: [1, 3, 6], stock: [1, 2],
    hint: 'Самый тяжёлый груз. Для двух тросов выбери стыки, которые далеко от единственной опоры.',
  },
];
const heroIds = ['kirill', 'maxim', 'mom', 'dad', 'pasha'];
export function newBridge(level = 0, score = 0) {
  const n = crossings[level].bays;
  return {
    version: 1,
    level,
    score,
    deck: Array(n).fill(false),
    supports: Array(n + 1).fill(''),
    phase: 'build',
    cart: 0,
    peak: 0,
    reason: '',
  };
}
function stockUsed(s, type) {
  return s.supports.filter((value) => value === type).length;
}
export function togglePart(s, type, i) {
  if (s.phase !== 'build' || !Number.isInteger(i)) return false;
  const c = crossings[s.level];
  if (type === 'deck' && i >= 0 && i < c.bays) {
    s.deck[i] = !s.deck[i];
    return true;
  }
  if (type !== 'post' && type !== 'rope') return false;
  const allowed = type === 'post' ? c.posts : c.ropes,
    limit = c.stock[type === 'post' ? 0 : 1];
  if (!allowed.includes(i)) return false;
  if (s.supports[i] === type) {
    s.supports[i] = '';
    return true;
  }
  if (stockUsed(s, type) >= limit) return false;
  s.supports[i] = type;
  return true;
}
// Solve vertical elastic equilibrium with fixed abutments. A fractional cart position splits
// its axle load across the two neighbouring joints, so sag changes smoothly as it rolls.
export function deflections(s, position = s.cart) {
  const c = crossings[s.level],
    n = c.bays,
    up = [],
    rhs = [],
    y = Array(n + 1).fill(0);
  for (let i = 1; i < n; i++) {
    const left = s.deck[i - 1] ? 1 : 0,
      right = s.deck[i] ? 1 : 0;
    const base = s.supports[i] === 'post' ? 8 : s.supports[i] === 'rope' ? 5 : 0;
    const d = Math.max(0.08, left + right + base - left * (up[i - 1] || 0));
    up[i] = right / d;
    rhs[i] =
      ((left + right) * 0.55 + c.load * Math.max(0, 1 - Math.abs(position - i)) + left * (rhs[i - 1] || 0)) /
      d;
  }
  for (let i = n - 1; i > 0; i--) y[i] = rhs[i] + up[i] * y[i + 1];
  return y;
}
export function startBridge(s) {
  if (s.phase !== 'build') return;
  s.phase = 'test';
  s.cart = 0;
  s.peak = 0;
  s.reason = '';
}
export function advanceBridge(s, delta) {
  if (s.phase !== 'test' || !Number.isFinite(delta) || delta <= 0) return;
  const c = crossings[s.level],
    end = Math.min(c.bays, s.cart + delta * 0.85);
  // Small spatial steps also catch failures if a slow frame skips over a missing span.
  while (s.cart < end && s.phase === 'test') {
    s.cart = Math.min(end, s.cart + 0.025);
    const j = Math.min(c.bays - 1, Math.floor(s.cart)),
      f = s.cart - j;
    if (!s.deck[j]) {
      s.phase = 'broken';
      s.reason = 'gap';
      break;
    }
    const y = deflections(s);
    // Only the loaded span carries the cart. A disconnected joint farther ahead
    // can be unsupported, but does not prematurely break the entry ramp.
    const sag = y[j] * (1 - f) + y[j + 1] * f;
    s.peak = Math.max(s.peak, sag / c.limit);
    if (sag > c.limit) {
      s.phase = 'broken';
      s.reason = 'sag';
    }
  }
  if (s.phase === 'test' && s.cart >= c.bays) {
    s.phase = 'passed';
  }
}
export function repairBridge(s) {
  if (s.phase === 'broken') {
    s.phase = 'build';
    s.cart = 0;
    s.peak = 0;
    s.reason = '';
  }
}
export function restoreBridge(o) {
  if (!o || o.version !== 1 || !Number.isInteger(o.level) || !crossings[o.level]) return newBridge();
  const c = crossings[o.level],
    bad = () => newBridge();
  if (
    !Array.isArray(o.deck) ||
    o.deck.length !== c.bays ||
    !o.deck.every((v) => typeof v === 'boolean') ||
    !Array.isArray(o.supports) ||
    o.supports.length !== c.bays + 1 ||
    !Number.isSafeInteger(o.score) ||
    o.score < 0 ||
    !['build', 'test', 'passed', 'broken'].includes(o.phase) ||
    !Number.isFinite(o.cart) ||
    o.cart < 0 ||
    o.cart > c.bays ||
    !Number.isFinite(o.peak) ||
    o.peak < 0 ||
    !['', 'gap', 'sag'].includes(o.reason)
  )
    return bad();
  const s = newBridge(o.level, o.score);
  for (const [i, t] of o.supports.entries()) if (t !== '' && !togglePart(s, t, i)) return bad();
  s.deck = [...o.deck];
  s.phase = o.phase;
  s.cart = o.cart;
  s.peak = o.peak;
  s.reason = o.reason;
  return s;
}
const W = 740,
  H = 346,
  startX = 108,
  endX = 632,
  deckY = 171;
function line(ctx, x, y, xx, yy, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(xx, yy);
  ctx.stroke();
}
function polygon(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
const fallDuration = 0.92;
function brokenSpan(s) {
  return Math.min(s.deck.length - 1, Math.floor(s.cart));
}
function repairTip(s) {
  const c = crossings[s.level];
  const options = [];
  for (const [type, joints] of [
    ['post', c.posts],
    ['rope', c.ropes],
  ]) {
    for (const joint of joints) if (!s.supports[joint]) options.push({ type, joint });
  }
  options.sort((a, b) => Math.abs(a.joint - s.cart) - Math.abs(b.joint - s.cart));
  const closest = options[0];
  if (!closest) return 'Вернись к чертежу и переставь опоры.';
  const { type, joint } = closest;
  const available = stockUsed(s, type) < c.stock[type === 'post' ? 0 : 1];
  const verb = available ? (type === 'post' ? 'Поставь' : 'Натяни') : 'Переставь';
  return (
    verb +
    (type === 'post' ? ' опору ▲' : ' трос ◇') +
    ' между участками ' +
    joint +
    ' и ' +
    (joint + 1) +
    '.'
  );
}
function brokenDeckHalf(g, x, y, dx, depth, tilt) {
  const length = Math.hypot(dx, depth);
  g.save();
  g.translate(x, y);
  g.scale(Math.sign(dx), 1);
  g.rotate(Math.atan2(depth, Math.abs(dx)) + tilt);
  polygon(
    g,
    [
      [0, -4],
      [length - 5, -4],
      [length + 3, -2],
      [length - 4, 1],
      [length + 1, 3],
      [length - 7, 6],
      [length - 2, 9],
      [0, 10],
    ],
    '#684632',
  );
  polygon(
    g,
    [
      [0, -5],
      [length - 5, -5],
      [length + 3, -2],
      [length - 4, 0],
      [length, 2],
      [0, 3],
    ],
    '#e0a566',
  );
  line(g, 0, -4, length - 7, -4, 2, '#f5c985');
  for (let peg = 14; peg < length - 7; peg += 20) line(g, peg, -4, peg, 3, 2, '#76503b');
  line(g, length - 7, 4, length - 2, 6, 2, '#ffdb99');
  g.restore();
}
function lavaSplash(g, x, y, impact) {
  if (impact <= 0) return;
  const reach = Math.sin(impact * Math.PI * 0.75);
  for (let i = 0; i < 9; i++) {
    const sign = i % 2 ? -1 : 1;
    const radius = (14 + i * 4) * reach;
    const height = (5 + (i % 4) * 5) * reach;
    rect(g, x + sign * radius, y - height, 3 + (i % 3), 3, i % 2 ? '#ffc759' : '#ffe58a');
  }
  line(g, x - 20 * reach, y + 1, x - 4 * reach, y, 3, '#ffd680');
  line(g, x + 8 * reach, y + 2, x + 33 * reach, y + 1, 3, '#ffc954');
}
function drawBridge(g, s, img, figures, hero, time, collapse) {
  const c = crossings[s.level],
    pitch = (endX - startX) / c.bays,
    sx = (i) => startX + i * pitch;
  const testing = s.phase !== 'build',
    sag = deflections(s, testing ? s.cart : -10).map((v) => Math.min(27, v));
  const dy = (i) => deckY + sag[i];
  const broken = s.phase === 'broken';
  const bay = brokenSpan(s);
  const split = Math.min(0.78, Math.max(0.22, s.cart - bay));
  const fold = Math.min(1, Math.max(0, (collapse - 0.08) / 0.65)) ** 1.25;
  const drop = Math.min(1, Math.max(0, (collapse - (s.reason === 'sag' ? 0.17 : 0)) / 0.68));
  g.imageSmoothingEnabled = false;
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#3b243b');
  grad.addColorStop(0.52, '#853923');
  grad.addColorStop(1, '#ff832e');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  if (img.naturalWidth) {
    g.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight / 3, 0, 0, W, H);
  }
  // On the far bank the lava pours past basalt stacks; the crossing remains in the foreground.
  drawLandmark(g, 'basalt_columns', 35, 111, 154);
  drawLandmark(g, 'lavafall', 210, 123, 183);
  drawLandmark(g, 'basalt_columns', 478, 125, 160);
  drawLandmark(g, 'crimson_fungi', 570, 130, 151);
  g.save();
  g.globalAlpha = 0.58;
  polygon(
    g,
    [
      [0, 244],
      [90, 254],
      [185, 242],
      [294, 262],
      [409, 249],
      [522, 256],
      [635, 244],
      [740, 255],
      [740, H],
      [0, H],
    ],
    g.createPattern(material('nether', '~'), 'repeat'),
  );
  g.restore();
  for (let i = 0; i < 12; i++) {
    const x = ((i * 137 + time * (4 + (i % 3))) % 800) - 40,
      y = 263 + ((i * 47) % 82);
    line(g, x, y, x + 8 + ((i * 29) % 24), y, 2, i % 2 ? '#ffd05b' : '#ea782d');
  }
  for (const x of [startX, endX]) {
    const dir = x === startX ? -1 : 1;
    polygon(
      g,
      [
        [x + dir * 161, deckY - 5],
        [x, deckY - 5],
        [x - dir * 9, deckY + 12],
        [x + dir * 8, 233],
        [x + dir * 31, 249],
        [x + dir * 55, H],
        [x + dir * 161, H],
      ],
      g.createPattern(material('nether', '#'), 'repeat'),
    );
    line(g, x + dir * 117, deckY - 4, x, deckY - 4, 8, '#dfa367');
    for (let i = 0; i < 10; i++) {
      let y = deckY + 14 + i * 15;
      line(g, x + dir * (6 + Math.max(0, i - 3) * 5), y, x + dir * (36 + i * 5), y, 3, '#744951');
    }
  }
  for (const i of c.posts) {
    const x = sx(i),
      y = deckY + 63;
    polygon(
      g,
      [
        [x - 26, 302],
        [x - 13, y],
        [x + 7, y - 5],
        [x + 17, y + 6],
        [x + 26, 301],
      ],
      '#634049',
    );
    line(g, x - 13, y, x + 9, y - 4, 4, '#d28865');
    if (s.supports[i] === 'post') {
      line(g, x - 11, y, x, dy(i) + 2, 9, '#c18d55');
      line(g, x + 9, y - 2, x, dy(i) + 2, 7, '#8e6147');
    }
  }
  for (const i of c.ropes) {
    const x = sx(i),
      side = i < c.bays / 2 ? startX : endX,
      top = deckY - 76;
    line(g, side, deckY, side, top, 7, '#53474c');
    line(g, side - 8, top, side + 8, top, 4, '#c0a381');
    if (s.supports[i] === 'rope') {
      line(g, side, top, x, dy(i) + 2, 5, '#4f4a49');
      line(g, side, top - 1, x, dy(i), 2.5, '#fae0a4');
    }
  }
  for (let j = 0; j < c.bays; j++) {
    const x = sx(j),
      xx = sx(j + 1),
      y = dy(j),
      yy = dy(j + 1);
    if (!s.deck[j]) {
      if (!testing) {
        g.setLineDash([7, 5]);
        line(g, x, deckY, xx, deckY, 2, '#fff1bf9c');
        g.setLineDash([]);
      }
      continue;
    }
    if (broken && s.reason === 'sag' && j === bay) {
      const depth = (yy - y) * split;
      brokenDeckHalf(g, x, y, pitch * split, depth, fold * 1.13);
      brokenDeckHalf(g, xx, yy, -pitch * (1 - split), depth - (yy - y), fold * 1.21);
      if (fold < 1 && collapse > 0.08) {
        for (let i = 0; i < 5; i++) {
          rect(g, sx(j + split) + (i - 2) * 11 * fold, y + depth + 6 + (57 + i * 9) * fold, 5, 3, '#ffd297');
        }
      }
      continue;
    }
    line(g, x, y + 5, xx, yy + 5, 12, '#684632');
    line(g, x, y, xx, yy, 8, '#d9a266');
    for (let p = 0.12; p < 1; p += 0.17) {
      const ax = x + pitch * p,
        ay = y + (yy - y) * p;
      line(g, ax, ay - 5, ax, ay + 3, 2, '#704b35');
    }
  }
  const spot = s.phase === 'build' ? -0.24 : s.cart;
  const j = Math.min(c.bays - 1, Math.max(0, Math.floor(spot)));
  const f = Math.max(0, spot - j);
  const trackY = s.phase === 'build' ? deckY : dy(j) * (1 - f) + dy(j + 1) * f;
  const groundY = 294;
  const fallX = sx(bay + (s.reason === 'gap' ? 0.35 : split));
  const cx = sx(spot) + (broken ? (fallX - sx(spot)) * Math.sin((drop * Math.PI) / 2) : 0);
  const cy = trackY + (broken ? (groundY - trackY) * drop * drop : 0);
  const slope = Math.atan2(dy(j + 1) - dy(j), pitch);
  g.save();
  g.translate(cx, cy);
  g.rotate(slope + (broken ? (s.reason === 'gap' ? 0.82 : -0.66) * drop : 0));
  if (figures.naturalWidth) {
    const h = figures.naturalHeight / 2,
      w = figures.naturalWidth / 5;
    g.drawImage(figures, Math.max(0, heroIds.indexOf(hero)) * w, 0, w, h * 0.7, -15, -41, 28, 35);
  }
  polygon(
    g,
    [
      [-23, -24],
      [22, -24],
      [17, -8],
      [-17, -8],
    ],
    '#425363',
  );
  rect(g, -23, -24, 45, 4, '#d2d7c8');
  rect(g, -16, -16, 32, 3, '#81928d');
  for (const x of [-12, 12]) {
    g.fillStyle = '#332e37';
    g.beginPath();
    g.arc(x, -4, 5, 0, 7);
    g.fill();
    rect(g, x - 1, -5, 2, 2, '#ebc889');
  }
  g.restore();
  if (broken) lavaSplash(g, cx, groundY + 3, Math.min(1, Math.max(0, (collapse - 0.85) / 0.15)));
}
export function mount(host, { players = [], saved, save, finish }) {
  let s = restoreBridge(saved),
    paused = false,
    disposed = false,
    frame = 0,
    last = 0,
    elapsed = 0,
    autosave = 0;
  let collapse = s.phase === 'broken' ? 1 : 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = players[0] || 'kirill';
  host.innerHTML =
    '<section class="br-game"><header><small>Инженерная мастерская · Нижний мир</small><h2></h2><p class="br-hint"></p></header><div class="br-work"><div class="br-board"><canvas width="740" height="346" aria-label="Переправа над лавой"></canvas><div class="br-places" role="group" aria-label="Части моста"></div></div><div class="br-controls"><div class="br-parts"></div><div class="br-meter"><span class="br-meter-label"></span><span class="br-gauge" aria-hidden="true"><i></i></span><meter min="0" max="1" value="0" aria-label="Наибольший прогиб настила"></meter></div><p class="br-status" role="status"></p><button class="br-go" type="button"></button></div></div></section>';
  const q = (t) => host.querySelector(t),
    g = q('canvas').getContext('2d'),
    places = q('.br-places'),
    go = q('.br-go'),
    board = q('.br-board'),
    meter = q('.br-meter'),
    meterLabel = q('.br-meter-label'),
    gauge = q('meter');
  const img = new Image();
  img.src = new URL('./assets/realm-panoramas.webp', import.meta.url);
  const actors = new Image();
  actors.src = new URL('./assets/maze-figures.webp', import.meta.url);
  const snap = () => save({ ...s, deck: [...s.deck], supports: [...s.supports] });
  function updateMeter() {
    const gap = s.phase === 'broken' && s.reason === 'gap';
    const fraction = Math.min(1, s.peak);
    const percent = Math.round(s.peak * 100);
    meter.dataset.state = gap
      ? 'gap'
      : s.reason === 'sag'
        ? 'overload'
        : fraction >= 0.75
          ? 'warning'
          : 'normal';
    meterLabel.textContent = gap
      ? 'Нет настила'
      : (s.reason === 'sag' ? 'Перегрузка' : 'Прогиб') + ' · ' + percent + '%';
    meter.style.setProperty('--load', fraction * 100 + '%');
    gauge.hidden = gap;
    gauge.value = fraction;
    gauge.setAttribute('aria-valuetext', percent + '% от предела');
  }
  function paint() {
    if (s.phase === 'broken') board.dataset.collapse = collapse === 1 ? 'settled' : 'falling';
    else delete board.dataset.collapse;
    drawBridge(g, s, img, actors, hero, motion.matches ? 0 : elapsed, collapse);
  }
  function update(message = '') {
    const c = crossings[s.level];
    q('h2').textContent = (s.level + 1) + '/' + crossings.length + ' · ' + c.name;
    q('.br-hint').textContent = c.hint;
    q('.br-parts').textContent =
      'Настилы ' +
      s.deck.filter(Boolean).length +
      '/' +
      c.bays +
      ' · Опоры ' +
      stockUsed(s, 'post') +
      '/' +
      c.stock[0] +
      (c.stock[1] ? ' · Тросы ' + stockUsed(s, 'rope') + '/' + c.stock[1] : '');
    places.replaceChildren();
    const sockets = (type, ids, label, mark, y) => {
      ids.forEach((i) => {
        const active = type === 'deck' ? s.deck[i] : s.supports[i] === type;
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.part = type;
        b.dataset.joint = i;
        b.setAttribute('aria-label', label + ' ' + (type === 'deck' ? i + 1 : i));
        b.setAttribute('aria-pressed', active);
        b.textContent = active ? '✓' : mark;
        b.title = label + ' ' + (type === 'deck' ? i + 1 : i);
        b.style.left =
          ((startX + ((i + (type === 'deck' ? 0.5 : 0)) * (endX - startX)) / c.bays) / W) * 100 + '%';
        b.style.top = y + '%';
        b.addEventListener('click', () => {
          if (paused || disposed) return;
          const ok = togglePart(s, type, i);
          update(ok ? '' : 'Все детали этого вида заняты. Нажми на установленную, чтобы перенести её.');
          places
            .querySelector('[data-part="' + type + '"][data-joint="' + i + '"]')
            ?.focus({ preventScroll: true });
          snap();
        });
        places.append(b);
      });
    };
    if (s.phase === 'build') {
      sockets(
        'deck',
        Array.from({ length: c.bays }, (_, i) => i),
        'Настил',
        '＋',
        49,
      );
      sockets('post', c.posts, 'Опора', '▲', 70);
      sockets('rope', c.ropes, 'Трос', '◇', 25);
    }
    const span = brokenSpan(s) + 1;
    board.dataset.phase = s.phase;
    q('.br-status').textContent =
      message ||
      {
        build: 'Нажимай ＋ для настила, ▲ для опоры, ◇ для троса. Повторное нажатие снимает деталь.',
        test: 'Вагонетка на мосту. Следи за прогибом.',
        broken:
          s.reason === 'gap'
            ? 'Вагонетка провалилась. На участке ' + span + ' нет настила. Добавь настил ' + span + '.'
            : 'Настил сломался на участке ' + span + '. ' + repairTip(s),
        passed: 'Вагонетка на другом берегу. Мост выдержал!',
      }[s.phase];
    go.disabled = s.phase === 'test';
    go.textContent = {
      build: 'Пустить вагонетку',
      test: 'Проверка моста…',
      broken: 'Вернуться к чертежу',
      passed: s.level === crossings.length - 1 ? 'Завершить стройку' : 'Следующая переправа',
    }[s.phase];
    updateMeter();
    paint();
  }
  go.addEventListener('click', () => {
    if (paused || disposed) return;
    if (s.phase === 'broken') {
      repairBridge(s);
      collapse = 0;
    } else if (s.phase === 'passed') {
      const score =
        s.score +
        100 +
        10 * (crossings[s.level].stock.reduce((a, b) => a + b, 0) - s.supports.filter(Boolean).length);
      if (s.level === crossings.length - 1) {
        paused = true;
        finish({ summary: 'Переправы через лаву: ' + crossings.length + ' из ' + crossings.length + ' · ' + score + ' очков', score });
        return;
      }
      s = newBridge(s.level + 1, score);
    } else if (s.phase === 'build') startBridge(s);
    update();
    snap();
  });
  function loop(t) {
    if (paused || disposed) return;
    const dt = last ? Math.min(0.12, (t - last) / 1000) : 0;
    last = t;
    elapsed += dt;
    if (s.phase === 'test') {
      advanceBridge(s, dt);
      updateMeter();
      autosave += dt;
      if (s.phase !== 'test') {
        if (s.phase === 'broken') collapse = motion.matches ? 1 : 0;
        update();
        snap();
      } else if (autosave >= 1) {
        autosave = 0;
        snap();
      }
    }
    if (s.phase === 'broken') collapse = motion.matches ? 1 : Math.min(1, collapse + dt / fallDuration);
    paint();
    frame = requestAnimationFrame(loop);
  }
  update();
  snap();
  frame = requestAnimationFrame(loop);
  return {
    pause() {
      if (!disposed) {
        paused = true;
        cancelAnimationFrame(frame);
        snap();
      }
    },
    resume() {
      if (paused && !disposed) {
        paused = false;
        last = 0;
        frame = requestAnimationFrame(loop);
      }
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      host.replaceChildren();
    },
  };
}
