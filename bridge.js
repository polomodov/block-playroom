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
function drawBridge(g, s, img, figures, hero, time) {
  const c = crossings[s.level],
    pitch = (endX - startX) / c.bays,
    sx = (i) => startX + i * pitch;
  const testing = s.phase !== 'build',
    sag = deflections(s, testing ? s.cart : -10).map((v) => Math.min(27, v));
  const dy = (i) => deckY + sag[i];
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#3b243b');
  grad.addColorStop(0.52, '#853923');
  grad.addColorStop(1, '#ff832e');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  if (img.naturalWidth) {
    g.save();
    g.globalAlpha = 0.71;
    g.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight / 3, 0, 0, W, 156);
    g.restore();
  }
  for (let i = 0; i < 13; i++) {
    const x = i * 63 + Math.sin(i * 1.5) * 30,
      y = 118 + Math.sin(i * 9) * 24;
    polygon(
      g,
      [
        [x - 44, 230],
        [x - 26, y + 16],
        [x, y],
        [x + 20, y + 12],
        [x + 36, 230],
      ],
      '#642f35',
    );
  }
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
    '#ed6730',
  );
  for (let i = 0; i < 29; i++) {
    const x = ((i * 137 + time * (4 + (i % 3))) % 800) - 40,
      y = 263 + ((i * 47) % 82);
    line(g, x, y, x + 12 + ((i * 29) % 74), y, 2 + (i % 4), i % 2 ? '#ffae41' : '#c54932');
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
      '#493342',
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
    line(g, x, y + 5, xx, yy + 5, 12, '#684632');
    line(g, x, y, xx, yy, 8, '#d9a266');
    for (let p = 0.12; p < 1; p += 0.17) {
      const ax = x + pitch * p,
        ay = y + (yy - y) * p;
      line(g, ax, ay - 5, ax, ay + 3, 2, '#704b35');
    }
  }
  let spot = s.phase === 'build' ? -0.24 : s.cart;
  let j = Math.min(c.bays - 1, Math.max(0, Math.floor(spot))),
    f = Math.max(0, spot - j);
  const cx = sx(spot),
    cy = (s.phase === 'build' ? deckY : dy(j) * (1 - f) + dy(j + 1) * f) + (s.phase === 'broken' ? 12 : 0);
  g.save();
  g.translate(cx, cy);
  g.rotate(s.phase === 'broken' ? 0.22 : Math.atan2(dy(j + 1) - dy(j), pitch));
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
}
export function mount(host, { players = [], saved, save, finish }) {
  let s = restoreBridge(saved),
    paused = false,
    disposed = false,
    frame = 0,
    last = 0,
    elapsed = 0,
    autosave = 0;
  const hero = players[0] || 'kirill';
  host.innerHTML =
    '<section class="br-game"><header><small>Инженерная мастерская · Нижний мир</small><h2></h2><p class="br-hint"></p></header><div class="br-work"><div class="br-board"><canvas width="740" height="346" aria-label="Переправа над лавой"></canvas><div class="br-places" role="group" aria-label="Части моста"></div></div><div class="br-controls"><div class="br-parts"></div><div class="br-meter"><span>Прогиб настила</span><meter min="0" max="1" value="0"></meter></div><p class="br-status" role="status"></p><button class="br-go" type="button"></button></div></div></section>';
  const q = (t) => host.querySelector(t),
    g = q('canvas').getContext('2d'),
    places = q('.br-places'),
    go = q('.br-go');
  const img = new Image();
  img.src = new URL('./assets/realm-panoramas.webp', import.meta.url);
  const actors = new Image();
  actors.src = new URL('./assets/maze-figures.webp', import.meta.url);
  const snap = () => save({ ...s, deck: [...s.deck], supports: [...s.supports] });
  function update(message = '') {
    const c = crossings[s.level];
    q('h2').textContent = s.level + 1 + '/3 · ' + c.name;
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
    const span = Math.min(c.bays, Math.floor(s.cart) + 1);
    q('.br-status').textContent =
      message ||
      {
        build: 'Нажимай ＋ для настила, ▲ для опоры, ◇ для троса. Повторное нажатие снимает деталь.',
        test: 'Вагонетка на мосту. Следи за прогибом.',
        broken:
          s.reason === 'gap'
            ? 'На участке ' + span + ' нет настила. Вернись к чертежу.'
            : 'Настил прогнулся у участка ' +
              span +
              '. Переставь опору или натяни трос ближе к середине пролёта.',
        passed: 'Вагонетка на другом берегу. Мост выдержал!',
      }[s.phase];
    go.disabled = s.phase === 'test';
    go.textContent = {
      build: 'Пустить вагонетку',
      test: 'Проверка моста…',
      broken: 'Вернуться к чертежу',
      passed: s.level === 2 ? 'Завершить стройку' : 'Следующая переправа',
    }[s.phase];
    q('meter').value = s.peak;
    drawBridge(g, s, img, actors, hero, elapsed);
  }
  go.addEventListener('click', () => {
    if (paused || disposed) return;
    if (s.phase === 'broken') repairBridge(s);
    else if (s.phase === 'passed') {
      const score =
        s.score +
        100 +
        10 * (crossings[s.level].stock.reduce((a, b) => a + b, 0) - s.supports.filter(Boolean).length);
      if (s.level === crossings.length - 1) {
        paused = true;
        finish({ summary: 'Построены три моста через лаву · ' + score + ' очков', score });
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
      q('meter').value = s.peak;
      autosave += dt;
      if (s.phase !== 'test') {
        update();
        snap();
      } else if (autosave >= 1) {
        autosave = 0;
        snap();
      }
    }
    drawBridge(g, s, img, actors, hero, elapsed);
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
