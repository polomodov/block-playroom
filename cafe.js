import { monsterPortrait } from './maze-portraits.js';
import { heroNames } from './progress.js';

export const menu = [
  { name: 'Вафля', plural: 'Вафли', tool: 'Вафельница', time: 3.6, shelf: 7, color: '#edb35a' },
  { name: 'Блин', plural: 'Блины', tool: 'Сковорода', time: 2.8, shelf: 6, color: '#f7cb84' },
  { name: 'Лимонад', plural: 'Лимонад', tool: 'Кувшин', time: 2.2, shelf: 11, color: '#98cb76' },
];
const guests = [
  ['Скелет', 'skeleton'],
  ['Ведьма', 'witch'],
  ['Паук', 'spider'],
  ['Зомби', 'zombie'],
  ['Шалкер', 'shulker'],
  ['Эндермен', 'enderman'],
];
export const shifts = [
  {
    name: 'Завтрак перед каруселью',
    needed: 3,
    interval: 8,
    patience: 31,
    orders: [[0], [2], [1, 2], [0, 0]],
  },
  {
    name: 'После горок',
    needed: 4,
    interval: 7,
    patience: 29,
    orders: [
      [1, 2],
      [0, 0],
      [2, 2],
      [0, 1],
      [1, 2],
    ],
  },
  {
    name: 'Вечерний аншлаг',
    needed: 5,
    interval: 6,
    patience: 27,
    orders: [
      [0, 2],
      [1, 1],
      [2, 0],
      [0, 1, 2],
      [1, 2],
      [0, 0, 0],
    ],
  },
  {
    name: 'Пикник у «Тайфуна»', place: 'Киоск аквапарка', scene: 'waterpark', needed: 5, interval: 6, patience: 28,
    orders: [[2, 2], [0, 2], [1, 2, 2], [0, 0, 2], [2, 2, 2], [0, 1, 2]],
  },
  {
    name: 'Обед на складе', place: 'Столовая мебельного магазина', scene: 'store', needed: 6, interval: 6, patience: 30,
    orders: [[1, 1], [0, 2], [0, 0], [1, 0, 2], [1, 1, 2], [0, 1], [2, 2, 0]],
  },
  {
    name: 'Полночные сладости', place: 'Буфет в замке', scene: 'castle', needed: 6, interval: 5.5, patience: 31,
    orders: [[0, 0], [1, 1, 1], [2, 2], [0, 0, 2], [1, 0, 1], [0, 1, 2], [0, 1, 1]],
  },
  {
    name: 'Ужин у портала', place: 'Кафе Края', scene: 'end', needed: 7, interval: 5.5, patience: 32,
    orders: [[2, 1, 2], [0, 0], [1, 1, 0], [0, 2, 1], [0, 2, 0], [1, 1, 2], [2, 0, 1], [0, 0, 1]],
  },
];
export function newCafe(shift = 0, previous = 0) {
  return {
    version: 1,
    shift,
    time: 0,
    phase: 'brief',
    sent: 0,
    lost: 0,
    burnt: 0,
    previous,
    tray: [0, 0, 0],
    stoves: [null, null, null],
    orders: [],
  };
}
const validCount = (n, max = 9999) => Number.isSafeInteger(n) && n >= 0 && n <= max;
export function restoreCafe(v) {
  if (
    !v ||
    v.version !== 1 ||
    !validCount(v.shift, shifts.length - 1) ||
    !['brief', 'open', 'won', 'retry'].includes(v.phase)
  )
    return newCafe();
  const shift = shifts[v.shift],
    size = shift.orders.length;
  if (
    !Number.isFinite(v.time) ||
    v.time < 0 ||
    !validCount(v.sent, size) ||
    !validCount(v.lost, size) ||
    !validCount(v.previous) ||
    !validCount(v.burnt) ||
    !Array.isArray(v.tray) ||
    v.tray.length !== 3 ||
    !v.tray.every((n) => validCount(n, 3)) ||
    !Array.isArray(v.stoves) ||
    v.stoves.length !== 3 ||
    !v.stoves.every((t) => t === null || (Number.isFinite(t) && t >= 0 && t <= v.time)) ||
    !Array.isArray(v.orders) ||
    v.orders.length > size ||
    !v.orders.every(
      (status, i) => ['waiting', 'served', 'left'].includes(status) && i * shift.interval <= v.time,
    ) ||
    v.sent !== v.orders.filter((x) => x === 'served').length ||
    v.lost !== v.orders.filter((x) => x === 'left').length
  )
    return newCafe();
  return { ...v, tray: [...v.tray], stoves: [...v.stoves], orders: [...v.orders] };
}
export function advanceCafe(s, dt) {
  if (s.phase !== 'open' || !Number.isFinite(dt) || dt < 0) return;
  s.time += dt;
  const level = shifts[s.shift];
  while (s.orders.length < level.orders.length && s.time >= s.orders.length * level.interval)
    s.orders.push('waiting');
  for (let i = 0; i < s.orders.length; i++) {
    if (s.orders[i] === 'waiting' && s.time >= i * level.interval + level.patience) {
      s.orders[i] = 'left';
      s.lost++;
    }
  }
  if (level.orders.length - s.lost < level.needed) s.phase = 'retry';
}
export function stovePhase(s, i) {
  const t = s.stoves[i],
    dish = menu[i];
  if (t === null) return 'empty';
  const elapsed = s.time - t;
  return elapsed < dish.time ? 'making' : elapsed < dish.time + dish.shelf ? 'ready' : 'spoiled';
}
export function useStation(s, i) {
  if (s.phase !== 'open' || !Number.isInteger(i) || !menu[i]) return '';
  const phase = stovePhase(s, i);
  if (phase === 'empty') {
    s.stoves[i] = s.time;
    return 'Готовится ' + menu[i].name.toLowerCase() + '.';
  }
  if (phase === 'making') return 'Ещё немного…';
  if (phase === 'spoiled') {
    s.burnt++;
    s.stoves[i] = null;
    return 'Посуду очистили. Можно готовить снова.';
  }
  if (s.tray[i] >= 3) return 'На подносе уже три порции. Отдай заказ гостю.';
  s.tray[i]++;
  s.stoves[i] = null;
  return menu[i].name + ' на подносе.';
}
export function ticket(s, i) {
  return shifts[s.shift].orders[i];
}
const quantities = (items) => [0, 1, 2].map((dish) => items.filter((n) => n === dish).length);
export function serve(s, i) {
  if (s.phase !== 'open' || s.orders[i] !== 'waiting') return false;
  const recipe = quantities(ticket(s, i));
  if (recipe.some((n, j) => s.tray[j] < n)) return false;
  s.tray = s.tray.map((n, j) => n - recipe[j]);
  s.orders[i] = 'served';
  s.sent++;
  if (s.sent >= shifts[s.shift].needed) s.phase = 'won';
  return true;
}
const pretty = (items) =>
  quantities(items)
    .map((n, i) => (n ? (n > 1 ? n + ' × ' : '') + menu[i].name.toLowerCase() : ''))
    .filter(Boolean)
    .join(' + ');
function dishPicture(i) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 68;
  canvas.setAttribute('aria-hidden', 'true');
  const g = canvas.getContext('2d');
  g.fillStyle = '#3c3544';
  g.beginPath();
  g.ellipse(49, 57, 35, 6, 0, 0, Math.PI * 2);
  g.fill();
  const rect = (x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  function oval(x, y, rx, ry, col) {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  }
  if (i === 0) {
    for (let d = 1; d >= 0; d--) {
      g.save();
      g.translate(45 + d * 3, 38 + d * 8);
      g.rotate(-0.21);
      rect(-26, -19, 52, 34, '#99522e');
      rect(-26, -22, 52, 32, '#ffd582');
      for (let x = 0; x < 5; x++)
        for (let y = 0; y < 3; y++) {
          rect(-22 + x * 10, -18 + y * 9, 6, 5, '#bd7a37');
          rect(-21 + x * 10, -17 + y * 9, 5, 4, '#e5a34c');
        }
      g.restore();
    }
  } else if (i === 1) {
    oval(45, 49, 34, 8, '#737a8c');
    oval(44, 47, 32, 7, '#afb7bd');
    for (let n = 0; n < 3; n++) {
      oval(45, 45 - n * 6, 26, 9, '#ae6a3e');
      oval(45, 42 - n * 6, 26, 8, '#f7c77c');
    }
    rect(39, 25, 12, 5, '#ffff99');
    rect(49, 30, 10, 3, '#a75d30');
    rect(56, 31, 5, 9, '#9b522c');
  } else {
    rect(30, 17, 34, 35, '#dcf1dd');
    rect(33, 28, 28, 25, '#83bb57');
    rect(36, 32, 4, 15, '#d2f399');
    rect(51, 11, 3, 23, '#e58470');
    rect(52, 9, 10, 3, '#f6ad95');
    oval(29, 23, 9, 8, '#e9c150');
    oval(29, 23, 7, 6, '#fff09a');
    rect(32, 53, 30, 3, '#b4d1bc');
  }
  return canvas;
}
export function mount(host, { saved, players, save, finish }) {
  let s = restoreCafe(saved),
    paused = false,
    disposed = false,
    frame = 0,
    last = null,
    lastSave = 0,
    paintedAt = -1;
  const events = new AbortController(),
    opts = { signal: events.signal },
    hero = players[0];
  host.innerHTML =
    '<section class="cafe-game"><header class="cafe-banner"><span class="cafe-avatar" aria-hidden="true"></span><div><small>Кафе игрового центра</small><h2></h2><p class="cafe-chef"></p></div></header><div class="cafe-body"><div class="cafe-hud"></div><p class="cafe-note" role="status"></p><div class="cafe-main"><section><h3>Кухня</h3><div class="cafe-stations"></div><h3>Поднос</h3><div class="cafe-tray"></div></section><section><h3>Заказы гостей</h3><div class="cafe-orders"></div></section></div><button type="button" class="cafe-next"></button></div></section>';
  const q = (sel) => host.querySelector(sel),
    note = q('.cafe-note'),
    next = q('.cafe-next');
  q('.cafe-avatar').classList.add('face', 'face-' + hero);
  const stoveButtons = menu.map((food, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.stove = i;
    b.className = 'cafe-stove';
    const name = document.createElement('strong'),
      label = document.createElement('span'),
      bar = document.createElement('progress');
    name.textContent = food.tool;
    bar.max = 1;
    b.append(dishPicture(i), name, bar, label);
    q('.cafe-stations').append(b);
    b.addEventListener('click', () => cook(i), opts);
    return { b, label, bar };
  });
  const dishTray = menu.map((food, i) => {
    const d = document.createElement('span');
    d.style.setProperty('--dish', food.color);
    q('.cafe-tray').append(d);
    return d;
  });
  const orderList = q('.cafe-orders'),
    orderEls = new Map();
  function render() {
    const level = shifts[s.shift];
    q('h2').textContent = level.name;
    const banner = q('.cafe-banner');
    banner.dataset.scene = level.scene || 'arcade';
    banner.querySelector('small').textContent = level.place || 'Кафе игрового центра';
    q('.cafe-chef').textContent = 'Сегодня готовит ' + heroNames[hero];
    q('.cafe-hud').textContent =
      'Смена ' +
      (s.shift + 1) +
      ' из ' + shifts.length + ' · Гостей обслужено ' +
      s.sent +
      ' / ' +
      level.needed +
      (s.lost ? ' · Ушли ' + s.lost : '');
    next.hidden = s.phase === 'open';
    next.textContent =
      s.phase === 'brief'
        ? 'Открыть кафе'
        : s.phase === 'retry'
          ? 'Повторить смену'
          : s.shift === shifts.length - 1
            ? 'Закрыть кафе'
            : 'Следующая смена';
    for (let i = 0; i < menu.length; i++) {
      const { b, bar, label } = stoveButtons[i],
        p = stovePhase(s, i),
        elapsed = s.time - s.stoves[i];
      b.dataset.state = p;
      b.disabled = s.phase !== 'open';
      label.textContent =
        p === 'empty' ? 'Готовить' : p === 'making' ? 'Готовится…' : p === 'ready' ? 'Забрать' : 'Очистить';
      b.setAttribute('aria-label', menu[i].name + ' · ' + label.textContent);
      bar.value =
        p === 'empty'
          ? 0
          : p === 'making'
            ? elapsed / menu[i].time
            : p === 'ready'
              ? 1 - (elapsed - menu[i].time) / menu[i].shelf
              : 1;
      dishTray[i].textContent = menu[i].plural + ' × ' + s.tray[i];
    }
    const visible = s.orders.map((state, id) => (state === 'waiting' ? id : -1)).filter((i) => i >= 0);
    for (const [id, el] of orderEls)
      if (!visible.includes(id)) {
        el.remove();
        orderEls.delete(id);
      }
    for (const id of visible) {
      let el = orderEls.get(id);
      if (!el) {
        const [name, type] = guests[(id + s.shift * 2) % guests.length];
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'cafe-ticket';
        el.dataset.order = id;
        const picture = monsterPortrait(type, 'cafe-guest');
        const copy = document.createElement('span'),
          guest = document.createElement('strong'),
          dish = document.createElement('small'),
          patience = document.createElement('progress');
        guest.textContent = name;
        dish.textContent = pretty(ticket(s, id));
        patience.max = level.patience;
        copy.append(guest, dish, patience);
        el.append(picture, copy);
        el.addEventListener('click', () => deliver(id), opts);
        orderEls.set(id, el);
        orderList.append(el);
      }
      el.querySelector('progress').value = level.patience - (s.time - id * level.interval);
      el.classList.toggle(
        'can-serve',
        quantities(ticket(s, id)).every((n, j) => s.tray[j] >= n),
      );
      el.disabled = s.phase !== 'open';
    }
  }
  function saveNow() {
    save(s);
  }
  function describe() {
    note.textContent =
      s.phase === 'brief'
        ? 'Нажми на станцию, потом забери готовое на поднос. Нажми на заказ гостя, чтобы его отдать.'
        : s.phase === 'won'
          ? 'Все нужные заказы отданы!'
          : s.phase === 'retry'
            ? 'Гости разошлись. Начни эту смену ещё раз.'
            : '';
  }
  function cook(i) {
    if (paused || disposed || s.phase !== 'open') return;
    note.textContent = useStation(s, i);
    render();
    saveNow();
  }
  function deliver(id) {
    if (paused || disposed || s.phase !== 'open') return;
    note.textContent = serve(s, id) ? 'Заказ выдан!' : 'Сначала собери заказ на подносе.';
    if (s.phase === 'won') describe();
    render();
    saveNow();
  }
  next.addEventListener(
    'click',
    () => {
      if (paused || disposed) return;
      if (s.phase === 'won' && s.shift === shifts.length - 1) {
        const total = s.sent + s.previous;
        finish({ score: total, summary: 'Смен в кафе: ' + shifts.length + ' · обслужено гостей ' + total });
        return;
      }
      if (s.phase === 'won') s = newCafe(s.shift + 1, s.previous + s.sent);
      else if (s.phase === 'retry') s = newCafe(s.shift, s.previous);
      orderList.replaceChildren();
      orderEls.clear();
      s.phase = 'open';
      advanceCafe(s, 0);
      last = null;
      describe();
      render();
      saveNow();
    },
    opts,
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (paused || disposed || e.repeat || e.altKey || e.ctrlKey || e.metaKey || s.phase !== 'open') return;
      const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
      if (i >= 0) {
        e.preventDefault();
        cook(i);
      }
    },
    opts,
  );
  function loop(now) {
    if (paused || disposed) return;
    const dt = last === null ? 0 : Math.min(0.25, (now - last) / 1000);
    last = now;
    if (s.phase === 'open') {
      advanceCafe(s, dt);
      if (s.phase !== 'open') {
        describe();
        render();
        saveNow();
      } else if (now - paintedAt >= 120) {
        render();
        paintedAt = now;
      }
      if (now - lastSave > 1400) {
        saveNow();
        lastSave = now;
      }
    }
    frame = requestAnimationFrame(loop);
  }
  describe();
  render();
  frame = requestAnimationFrame(loop);
  return {
    pause() {
      paused = true;
      cancelAnimationFrame(frame);
      last = null;
      saveNow();
    },
    resume() {
      if (paused && !disposed) {
        paused = false;
        frame = requestAnimationFrame(loop);
      }
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      events.abort();
    },
  };
}
