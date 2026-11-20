import { drawLandmark, landmarkAtlas } from './arcade-scenery.js';
import { monsterPortrait } from './maze-portraits.js';
import { investigations } from './mystery-cases.js';
export { investigations };
export const { rooms, suspects } = investigations[0];

const heroes = ['kirill', 'maxim', 'mom', 'dad', 'pasha'];
const directions = { ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0] };
const pick = (n, x) => Math.min(n - 1, Math.max(0, Math.floor(n * x())));
export function newCase(hero = 'mom', random = Math.random, level = 0) {
  const { stashes, entrance } = investigations[level];
  return {
    level,
    version: 1,
    hero: heroes.includes(hero) ? hero : 'mom',
    culprit: pick(4, random),
    stash: stashes[pick(3, random)],
    position: entrance,
    turn: 0,
    clues: 0,
    identified: false,
    misses: 0,
    veil: 0,
    recharge: 0,
    done: false,
  };
}
export function readCase(saved, hero, random = Math.random) {
  // Version 1 saves from the original furniture shop have no level field.
  const level = saved?.level === undefined ? 0 : saved.level;
  const file = Number.isInteger(level) && investigations[level];
  if (
    !saved ||
    !file ||
    saved.version !== 1 ||
    saved.hero !== hero ||
    !Number.isInteger(saved.culprit) ||
    !file.suspects[saved.culprit] ||
    !file.stashes.includes(saved.stash) ||
    !Number.isInteger(saved.position) ||
    !file.rooms[saved.position] ||
    file.closed.includes(saved.position) ||
    !Number.isInteger(saved.clues) ||
    saved.clues < 0 ||
    saved.clues > 7 ||
    typeof saved.identified !== 'boolean' ||
    (saved.identified && saved.clues !== 7) ||
    saved.done !== false ||
    !['turn', 'misses', 'veil', 'recharge'].every((k) => Number.isSafeInteger(saved[k]) && saved[k] >= 0) ||
    saved.veil > 3 ||
    saved.recharge > 8
  )
    return newCase(hero, random);
  const base = newCase(hero, () => 0, level);
  return { ...Object.fromEntries(Object.keys(base).map((k) => [k, saved[k]])), level };
}
export function nextPatrol(s) {
  const { patrol } = investigations[s.level ?? 0];
  return patrol[(s.turn + 1) % patrol.length];
}
export function walk(s, to) {
  const { rooms, closed, entrance } = investigations[s.level];
  if (s.done || !Number.isInteger(to) || !rooms[to]) return '';
  const distance =
    Math.abs((s.position % 3) - (to % 3)) + Math.abs(Math.floor(s.position / 3) - Math.floor(to / 3));
  if (distance > 1) return 'Сначала перейди в соседний зал.';
  if (closed.includes(to)) return 'Здесь проход закрыт. Поищи обход по карте.';
  const staying = to === s.position,
    caught = to === nextPatrol(s) && s.veil === 0;
  s.turn++;
  s.veil = Math.max(0, s.veil - 1);
  s.recharge = Math.max(0, s.recharge - 1);
  s.position = caught ? entrance : to;
  if (caught) {
    s.misses++;
    return 'Патруль проводил тебя ко входу. Все улики остались в блокноте.';
  }
  return staying ? 'Ты пропустил патруль.' : rooms[to].name;
}
export function cloak(s) {
  if (s.done || s.hero !== 'mom' || s.recharge) return false;
  s.veil = 3;
  s.recharge = 8;
  return true;
}
function evidence(s, i) {
  const { rooms, suspects } = investigations[s.level];
  const who = suspects[s.culprit];
  return [
    'На чеке остался штамп: ' + who.stamp + '.',
    'Здесь осталась ' + who.ribbon + ' лента от посылки.',
    'В накладной записан зал доставки: «' + rooms[s.stash].name + '».',
  ][i];
}
export function inspect(s) {
  if (s.done) return '';
  const { rooms, entrance } = investigations[s.level];
  const r = rooms[s.position];
  if (r.clue !== undefined) {
    s.clues |= 1 << r.clue;
    return evidence(s, r.clue);
  }
  if (s.identified && s.position === s.stash) {
    s.done = true;
    return 'Изумруд найден!';
  }
  if (s.position === entrance) return 'Дежурный отметил в блокноте три зала для осмотра.';
  if (r.stash && s.identified) return 'Здесь пусто. В накладной указан зал доставки.';
  return 'Пока здесь тихо. Загляни в залы со знаком лупы.';
}
export function identify(s, id) {
  if (s.done || s.identified || s.clues !== 7 || !Number.isInteger(id) || !investigations[s.level].suspects[id]) return '';
  if (id !== s.culprit) {
    s.misses++;
    return 'У этого помощника другие приметы. Сверь и штамп, и ленту.';
  }
  s.identified = true;
  return 'Верно! Теперь зайди в зал доставки из блокнота и осмотри тайник.';
}
function furnishing(canvas, item) {
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.imageSmoothingEnabled = false;
  const showrooms = { sofa: 'living_room', desk: 'show_kitchen', shelf: 'warehouse' };
  if (drawLandmark(g, showrooms[item] || item, 3, 0, 84)) return;
  function face(points, color) {
    g.fillStyle = color;
    g.beginPath();
    points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
  }
  function box(x, y, w, d, h, c) {
    face(
      [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      c[0],
    );
    face(
      [
        [x + w, y],
        [x + w + d, y - d],
        [x + w + d, y - d + h],
        [x + w, y + h],
      ],
      c[1],
    );
    face(
      [
        [x, y],
        [x + d, y - d],
        [x + w + d, y - d],
        [x + w, y],
      ],
      c[2],
    );
  }
  const oak = ['#ae754b', '#72452f', '#e7b97e'],
    mint = ['#6b9993', '#3b676a', '#b4d5c5'],
    berry = ['#a75f61', '#70414d', '#dc9383'],
    ink = ['#444452', '#2b303a', '#777581'],
    gold = ['#ddac5d', '#ac733d', '#ffe09b'];
  const metal = ['#848c94', '#556577', '#b4c1c7'];
  face(
    [
      [10, 45],
      [42, 54],
      [82, 43],
      [54, 37],
    ],
    '#20202a51',
  );
  switch (item) {
    case 'sofa':
      box(15, 24, 43, 8, 14, berry);
      box(15, 34, 43, 11, 8, berry);
      box(12, 30, 7, 10, 12, berry);
      box(55, 30, 7, 9, 12, berry);
      box(20, 40, 3, 3, 5, oak);
      break;
    case 'plant':
      box(31, 31, 17, 7, 14, berry);
      box(37, 17, 4, 3, 16, oak);
      box(23, 15, 16, 6, 8, mint);
      box(40, 12, 15, 6, 8, mint);
      box(33, 9, 12, 8, 7, mint);
      break;
    case 'lamp':
      box(27, 41, 23, 9, 3, oak);
      box(37, 19, 4, 2, 21, metal);
      box(26, 18, 25, 8, 8, gold);
      box(31, 14, 16, 8, 4, gold);
      break;
    case 'wardrobe':
      box(21, 14, 36, 12, 30, oak);
      box(38, 15, 1, 1, 28, ink);
      box(35, 28, 2, 2, 5, gold);
      box(41, 28, 2, 2, 5, gold);
      break;
    case 'shelf':
    case 'files':
      box(15, 13, 4, 9, 33, oak);
      box(59, 13, 4, 9, 33, oak);
      for (let i = 0; i < 3; i++) {
        box(16, 18 + 12 * i, 45, 9, 3, oak);
        if (i < 2) {
          box(23, 21 + 11 * i, 9, 4, 8, item === 'files' ? gold : mint);
          box(37, 22 + 11 * i, 12, 4, 6, berry);
        }
      }
      break;
    case 'sign':
      box(24, 41, 31, 7, 4, oak);
      box(38, 20, 4, 3, 22, oak);
      box(21, 15, 34, 6, 13, mint);
      face(
        [
          [30, 20],
          [42, 20],
          [42, 17],
          [48, 22],
          [42, 26],
          [42, 23],
          [30, 23],
        ],
        '#ffe8b1',
      );
      break;
    case 'till':
      box(14, 31, 47, 11, 12, oak);
      box(23, 25, 21, 7, 6, mint);
      box(31, 16, 14, 4, 9, ink);
      box(32, 17, 10, 1, 5, mint);
      break;
    default:
      box(20, 29, 4, 3, 15, oak);
      box(55, 27, 4, 3, 15, oak);
      box(14, 23, 47, 12, 5, oak);
      box(28, 18, 17, 5, 6, metal);
      box(48, 18, 6, 3, 7, gold);
  }
}
const make = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
};
export function mount(host, { saved, players, save, finish, cue = () => {} }) {
  let s = readCase(saved, players[0]);
  let file = investigations[s.level];
  const events = new AbortController(),
    opts = { signal: events.signal };
  let paused = false,
    disposed = false;
  host.innerHTML =
    '<section class="case"><header class="case-banner"><div><label class="case-picker">Выбери дело <select></select></label><h2></h2><p>Кто спрятал посылку и в каком зале? Собери три улики и сверь приметы помощников.</p></div></header><div class="case-layout"><div><div class="case-line"><strong class="case-location"></strong><span class="case-count"></span></div><div class="case-map" role="group" aria-label="План залов"></div><p class="case-patrol"></p><div class="case-actions"><button class="case-search">Осмотреть зал</button><button class="case-wait">Пропустить ход</button><button class="case-cloak">Невидимость</button></div><p class="case-msg" role="status"></p></div><aside><h3>Блокнот</h3><ol class="case-notes"></ol><h3>Помощники</h3><p>У каждого свой штамп и лента.</p><div class="case-suspects"></div></aside></div></section>';
  const q = (sel) => host.querySelector(sel),
    message = q('.case-msg'),
    cells = [];
  const picker = q('.case-picker select');
  investigations.forEach((item, i) => picker.add(new Option((i + 1) + ' · ' + item.world, i)));
  for (let i = 0; i < file.rooms.length; i++) {
    const b = make('button', 'case-room');
    b.type = 'button';
    b.dataset.room = i;
    const picture = make('canvas', 'case-furniture');
    picture.width = 90;
    picture.height = 56;
    picture.setAttribute('aria-hidden', 'true');
    const figure = make('span', 'case-figure');
    figure.style.backgroundPosition = heroes.indexOf(s.hero) * 25 + '% 0%';
    const badge = make('span', 'case-clue');
    b.append(picture, figure, make('span', 'case-witch'), badge, make('span', 'case-label'));
    b.addEventListener('click', () => act(() => (i === s.position ? inspect(s) : walk(s, i))), opts);
    q('.case-map').append(b);
    cells.push(b);
  }
  const choices = file.suspects.map((_, i) => {
    const b = make('button', 'case-suspect');
    b.addEventListener('click', () => act(() => identify(s, i)), opts);
    q('.case-suspects').append(b);
    return b;
  });
  function furnishings() {
    cells.forEach((cell, i) => furnishing(cell.querySelector('canvas.case-furniture'), file.rooms[i].item));
  }
  function setScene() {
    file = investigations[s.level];
    picker.value = String(s.level);
    const header = q('.case-banner');
    header.querySelector('h2').textContent = file.title;
    header.style.setProperty('--case-panorama', 'url("./assets/' + file.sheet + '-panoramas.webp")');
    header.style.setProperty('--case-height', file.sheet === 'world' ? '400%' : '300%');
    header.style.setProperty('--case-row', (100 * file.row / (file.sheet === 'world' ? 3 : 2)) + '%');
    cells.forEach((cell, i) => {
      cell.disabled = file.closed.includes(i);
      cell.querySelector('.case-label').textContent = file.rooms[i].name;
      cell.querySelector('.case-witch').replaceWith(monsterPortrait(file.guard, 'case-witch'));
    });
    choices.forEach((b, i) => {
      const person = file.suspects[i];
      b.replaceChildren(monsterPortrait(person.type, 'case-beast'), make('strong', '', person.name),
        make('small', '', person.stamp + ' · ' + person.ribbon + ' лента'));
    });
    furnishings();
    paint(s.identified ? 'Проверь зал доставки из блокнота.' : 'Лупа на плане отмечает залы с уликами.');
  }
  function paint(note) {
    const rooms = file.rooms;
    picker.disabled = Boolean(s.turn || s.clues || s.recharge);
    cells.forEach((b, i) => {
      const r = rooms[i],
        isHere = s.position === i,
        isWatch = nextPatrol(s) === i;
      b.classList.toggle('here', isHere);
      b.classList.toggle('watch', isWatch);
      const clue = r.clue !== undefined ? (s.clues & (1 << r.clue) ? '✓' : '⌕') : '';
      b.querySelector('.case-clue').textContent = isWatch ? '☾' : clue;
      b.setAttribute(
        'aria-label',
        r.name +
          (isHere ? ', вы здесь' : '') +
          (isWatch ? ', сюда идёт патруль' : '') +
          (b.disabled ? ', проход закрыт' : '') +
          (clue === '⌕' ? ', есть улика' : ''),
      );
    });
    q('.case-location').textContent = 'Вы здесь · ' + rooms[s.position].name;
    q('.case-count').textContent = 'Улики ' + [1, 2, 4].filter((x) => s.clues & x).length + '/3';
    q('.case-patrol').textContent =
      '☾ Патруль идёт в зал «' + rooms[nextPatrol(s)].name + '» (' + file.guardName + '). Нажми на соседний зал, чтобы перейти.';
    const veil = q('.case-cloak');
    veil.hidden = s.hero !== 'mom';
    veil.disabled = s.recharge > 0;
    veil.textContent = s.veil
      ? 'Невидимость · ' + s.veil
      : s.recharge
        ? 'До невидимости · ' + s.recharge
        : 'Стать невидимой';
    q('.case-notes').replaceChildren(
      ...file.clues.map((cell, i) =>
        make('li', '', s.clues & (1 << i) ? evidence(s, i) : 'Осмотреть · ' + rooms[cell].name),
      ),
    );
    choices.forEach((b, i) => {
      b.disabled = s.identified || s.clues !== 7;
      b.classList.toggle('solved', s.identified && i === s.culprit);
    });
    if (note) message.textContent = note;
  }
  function act(fn) {
    if (paused || disposed || s.done) return;
    const { clues, misses, veil, identified } = s;
    const note = fn();
    if (s.done) cue('mystery-found');
    else if (s.clues !== clues) cue('mystery-clue');
    else if (s.misses > misses) cue('mystery-setback');
    else if (s.identified !== identified) cue('mystery-match');
    else if (s.veil > veil) cue('mystery-veil');
    paint(note);
    if (s.done) {
      finish({
        score: Math.max(10, 100 - s.misses * 5),
        summary: file.world + ' · Изумруд найден · ' + file.rooms[s.stash].name + ' · ходов ' + s.turn,
      });
    } else save({ ...s });
  }
  q('.case-search').addEventListener('click', () => act(() => inspect(s)), opts);
  q('.case-wait').addEventListener('click', () => act(() => walk(s, s.position)), opts);
  q('.case-cloak').addEventListener(
    'click',
    () => act(() => (cloak(s) ? 'Мама невидима для патруля на три хода.' : '')),
    opts,
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (paused || disposed || e.target === picker || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const d = directions[e.key];
      if (!d) return;
      e.preventDefault();
      const x = (s.position % 3) + d[0],
        y = Math.floor(s.position / 3) + d[1];
      if (x >= 0 && x < 3 && y >= 0 && y < 3) act(() => walk(s, y * 3 + x));
    },
    opts,
  );
  picker.addEventListener('change', () => {
    if (paused || disposed || picker.disabled) return;
    s = newCase(players[0], Math.random, Number(picker.value));
    setScene();
    save({ ...s });
  }, opts);
  landmarkAtlas().addEventListener('load', furnishings, { ...opts, once: true });
  setScene();
  save({ ...s });
  return {
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {
      disposed = true;
      events.abort();
    },
  };
}
