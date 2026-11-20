import { drawLandmark, material } from './arcade-scenery.js';
// Each cell is a step. Lowercase a/b are pressure plates, uppercase A/B their gates.
// Stepping on lever x/y latches that gate for both partners for the rest of the room.
const HEROES = { kirill: 'Кирилл', maxim: 'Максим', mom: 'Мама', dad: 'Папа', pasha: 'Паша' };
const STEP = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const WIDTH = 9;
const VERSION = 1;
const validPair = (pair) =>
  Array.isArray(pair) &&
  pair.length === 2 &&
  pair[0] !== pair[1] &&
  pair.every((hero) => typeof hero === 'string' && Object.hasOwn(HEROES, hero));

export const rooms = [
  {
    place: 'Храм изумруда',
    name: 'Каменный затвор',
    hint: 'Один герой встаёт на плиту I. Переключитесь на второго, перейдите мост и наступите на рычаг I.',
    surface: ['#76a788', '#4e7a69', '#335a51'],
    pit: ['#294d51', '#0e232e'],
    motif: 'moss',
    rows: [' ..a  ..x', ' ...  ...', ' 12.A...E', ' ...  .E.', '  ..  .. '],
  },
  {
    place: 'Игровой центр',
    name: 'За кулисами',
    hint: 'Сцена за подъёмным мостом. На дальнем берегу есть рычаг, который оставит мост открытым для напарника.',
    surface: ['#a294bd', '#776395', '#50466f'],
    pit: ['#474165', '#1b203b'],
    motif: 'confetti',
    rows: ['.1..a... ', '...   .2.', '      A  ', ' .E ...x.', ' .E......'],
  },
  {
    place: 'Аквапарк',
    name: 'Два шлюза',
    hint: 'Сперва откройте бирюзовый шлюз I. На среднем островке найдите плиту II для второго шлюза.',
    surface: ['#89c4c6', '#599aa6', '#407785'],
    pit: ['#227597', '#0b3c62'],
    motif: 'water',
    rows: ['.a. .b EE', '.1.A.x .y', '.2. .. ..', ' .. ..B..', '    ..   '],
  },
  {
    place: 'Мебельный магазин',
    name: 'Между стеллажами',
    hint: 'Вы в разных залах. Герой у бирюзовой плиты пропускает напарника с другого конца. Затем поменяйтесь ролями.',
    surface: ['#d2aa77', '#ad825b', '#835a44'],
    pit: ['#594946', '#282733'],
    motif: 'wood',
    rows: ['1. ... .2', '.. .x.A..', '.a .E. ..', '..B.b. ..', '.. .E.   '],
  },
  {
    place: 'Нижний мир',
    name: 'Мост над лавой',
    hint: 'За первым мостом дорожка огибает лаву. Рычаг I закрепит переправу, а плита II опустит дальний мост.',
    surface: ['#aa7c7e', '#80575f', '#603d50'],
    pit: ['#a34425', '#4b1f29'],
    motif: 'lava',
    rows: ['1.a  .x..', '...  .  .', '2..A.. .b', '     B   ', ' ..E...y.', ' .E......'],
  },
  {
    place: 'Замок на Хеллоуин',
    name: 'Башни близнецов',
    hint: 'Вы начинаете в разных башнях. Плита в первой башне открывает ворота второй. Встретьтесь во дворе.',
    surface: ['#9b9bb1', '#757892', '#4f546e'],
    pit: ['#49385b', '#25233b'],
    motif: 'castle',
    rows: ['.....  1a', '.2...  ..', ' A      B', ' ...b....', ' ..x..EE.'],
  },
  {
    place: 'Край',
    name: 'Последний портал',
    hint: 'Здесь первой нужна плита II. Когда рычаг II сработает, вернитесь на стартовый остров за плитой I.',
    surface: ['#d0bc99', '#aa9585', '#846e7d'],
    pit: ['#594276', '#27223e'],
    motif: 'stars',
    rows: ['.a. .y EE', '.1. .. ..', '.2.B..A.x', ' .. .. ..', ' .b .  . '],
  },
];

const tileAt = (room, cell) => room.rows[Math.floor(cell / WIDTH)]?.[cell % WIDTH] || ' ';
const gateBit = (tile) => (tile === 'a' || tile === 'A' || tile === 'x' ? 1 : 2);
const occupied = (state, cell) => state.positions.includes(cell);

export function freshRoom(players, room = 0, previousSteps = 0) {
  const layout = rooms[room].rows.join('');
  return {
    version: VERSION,
    players: validPair(players) ? [...players] : ['kirill', 'maxim'],
    room,
    active: 0,
    positions: [layout.indexOf('1'), layout.indexOf('2')],
    latched: 0,
    steps: previousSteps,
    roomSteps: 0,
  };
}

export function roomWon(state) {
  return state.positions.every((cell) => tileAt(rooms[state.room], cell) === 'E');
}

function openMask(state) {
  return state.positions.reduce((mask, pos) => {
    const tile = tileAt(rooms[state.room], pos);
    return tile === 'a' || tile === 'b' ? mask | gateBit(tile) : mask;
  }, state.latched);
}

export function loadRoom(saved, players) {
  if (
    saved?.version !== VERSION ||
    !validPair(saved.players) ||
    !Number.isInteger(saved.room) ||
    !rooms[saved.room] ||
    ![0, 1].includes(saved.active) ||
    !Number.isInteger(saved.latched) ||
    saved.latched < 0 ||
    saved.latched > 3 ||
    !Number.isSafeInteger(saved.steps) ||
    !Number.isSafeInteger(saved.roomSteps) ||
    saved.roomSteps < 0 ||
    saved.roomSteps > saved.steps ||
    !Array.isArray(saved.positions) ||
    saved.positions.length !== 2 ||
    saved.positions[0] === saved.positions[1] ||
    !saved.positions.every(
      (cell) => Number.isSafeInteger(cell) && cell >= 0 && tileAt(rooms[saved.room], cell) !== ' ',
    )
  ) {
    return freshRoom(players);
  }
  return {
    ...freshRoom(saved.players, saved.room),
    active: saved.active,
    positions: [...saved.positions],
    latched: saved.latched,
    steps: saved.steps,
    roomSteps: saved.roomSteps,
  };
}

export function stepHero(state, dir) {
  if (!Object.hasOwn(STEP, dir) || roomWon(state)) return 'blocked';
  const room = rooms[state.room],
    from = state.positions[state.active],
    [dx, dy] = STEP[dir];
  const x = (from % WIDTH) + dx,
    pos = from + dx + dy * WIDTH;
  if (x < 0 || x >= WIDTH || pos < 0 || tileAt(room, pos) === ' ') return 'blocked';
  if (occupied(state, pos)) return 'partner';
  const tile = tileAt(room, pos);
  if ((tile === 'A' || tile === 'B') && !(openMask(state) & gateBit(tile))) return 'gate';
  state.positions[state.active] = pos;
  state.steps++;
  state.roomSteps++;
  if ((tile === 'x' || tile === 'y') && !(state.latched & gateBit(tile))) {
    state.latched |= gateBit(tile);
    return 'lever';
  }
  return tile === 'a' || tile === 'b' ? 'plate' : tile === 'E' ? 'exit' : 'moved';
}

export const resetRoom = (state) => freshRoom(state.players, state.room, state.steps - state.roomSteps);

const W = 720,
  H = 446,
  TX = 72,
  TY = 50,
  LEFT = (W - WIDTH * TX) / 2;
const Y0 = (room) => H - room.rows.length * TY - 28;
const MID = (cell) => LEFT + ((cell % WIDTH) + 0.5) * TX;
const FEET = (cell, room) => Y0(room) + (Math.floor(cell / WIDTH) + 0.63) * TY;
const CHANNELS = [
  ['#5ff3dd', '#167b77', 'I'],
  ['#ffb969', '#b16c35', 'II'],
];
const motifs = [
  ['temple', 'stone_mask', 'brazier'], ['arcade', 'carousel', 'claw'],
  ['waterpark', 'typhoon', 'water_slide'], ['store', 'living_room', 'warehouse'],
  ['nether', 'lavafall', 'crimson_fungi'], ['castle', 'gatehouse', 'pumpkin_patch'],
  ['end', 'crystal_spires', 'chorus_grove'],
];
const MARK = '#ffe69b';
const TAU = Math.PI * 2;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const spr = (path) => {
  const im = new Image();
  im.src = new URL('./assets/' + path, import.meta.url).href;
  return im;
};
function box(g, color, x, y, w, h) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
function disc(g, color, x, y, rx, ry) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, TAU);
  g.fillStyle = color;
  g.fill();
}
function polygon(g, color, points) {
  g.beginPath();
  g.moveTo(...points[0]);
  for (const pt of points.slice(1)) g.lineTo(...pt);
  g.closePath();
  g.fillStyle = color;
  g.fill();
}
function label(g, text, x, y, color, size = 13) {
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold ' + size + 'px system-ui,sans-serif';
  g.fillText(text, x, y);
}
function ambient(g, room, index, time, image) {
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, room.pit[0]);
  grad.addColorStop(1, room.pit[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  if (image?.naturalWidth) {
    const sh = image.naturalHeight / (index < 4 ? 4 : 3);
    g.drawImage(image, 0, (index < 4 ? index : index - 4) * sh, image.naturalWidth, sh, 0, 0, W, 167);
    const fade = g.createLinearGradient(0, 62, 0, 166);
    fade.addColorStop(0, 'transparent');
    fade.addColorStop(1, room.pit[0]);
    g.fillStyle = fade;
    g.fillRect(0, 62, W, 105);
  }
  g.save();
  g.globalAlpha = 0.25;
  for (let i = 0; i < 72; i++) {
    const x = (i * 149 + Math.sin(time * 0.52 + i) * 3 + W) % W,
      y = 130 + ((i * 79) % (H - 133));
    const glow = 0.6 + 0.4 * Math.sin(time * 1.3 + i * 1.7);
    if (room.motif === 'lava' || room.motif === 'stars' || room.motif === 'castle') {
      disc(g, room.motif === 'lava' ? '#ffbd56' : '#eac1ff', x, y - glow * 6, 1 + glow, 1 + glow);
    } else if (room.motif === 'water' || room.motif === 'moss') {
      box(g, '#97ede4', x, y, 5 + glow * 8, 1);
    } else {
      box(g, '#f0c8a3', x, y, 2, 2);
    }
  }
  g.restore();
}
function floor(g, room, c, i, x, y, texture) {
  const [light, mid, dark] = room.surface,
    v = (i * 37) % 61;
  box(g, '#131d2b88', x + 3, y + 7, TX, TY);
  box(g, dark, x + 1, y + 4, TX - 1, TY + 2);
  box(g, mid, x + 1, y, TX - 1, TY - 2);
  box(g, light, x + 2, y, TX - 3, 2);
  box(g, light + '5c', x + 2, y + 2, 2, TY - 6);
  box(g, '#1321312b', x + 4, y + TY - 5, TX - 6, 2);
  g.save();
  g.globalAlpha = 0.28;
  g.drawImage(texture, 5, 6, 47, 40, x + 3, y + 3, TX - 6, TY - 8);
  g.restore();
  const marks = room.motif;
  if (marks === 'wood') {
    for (let k = 1; k <= 2; k++) box(g, '#62493945', x + 5, y + k * 14, TX - 9, 1);
    box(g, light + '99', x + 7 + v / 3, y + 24, 19, 1);
  } else if (marks === 'water' || marks === 'confetti') {
    box(g, dark + '77', x + TX / 2, y + 3, 1, TY - 7);
    box(g, dark + '77', x + 4, y + TY / 2, TX - 9, 1);
    if (i % 3 === 0) box(g, light + 'af', x + 9, y + 9, 5, 3);
  } else {
    box(g, dark + '77', x + 5 + v / 2, y + 9 + (i % 3) * 10, 7, 2);
    box(g, light + '85', x + 11 + v / 2, y + 11 + (i % 3) * 10, 3, 2);
    if (marks === 'moss' && i % 4 === 0)
      for (let k = 0; k < 3; k++) box(g, '#83af6d', x + 4 + k * 4, y + 4 + (k % 2) * 3, 3, 3);
  }
}
function pressure(g, x, y, channel, down, t) {
  const [glow, base, letter] = CHANNELS[channel];
  disc(g, '#223239', x, y + 3, 24, 13);
  disc(g, base, x, y + 1, 22, 12);
  disc(g, down ? glow : '#344a50', x, y - (down ? 0 : 3), 20, 10);
  if (!down) {
    g.strokeStyle = glow;
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(x, y - 3, 18, 8, 0, 0, TAU);
    g.stroke();
  }
  label(g, letter, x, y - (down ? 0 : 3), down ? '#123f40' : glow);
  if (down) {
    g.globalAlpha = 0.22 + 0.15 * Math.sin(t * 5);
    disc(g, glow, x, y, 28, 15);
    g.globalAlpha = 1;
  }
}
function lever(g, x, y, channel, on) {
  const [glow, base, letter] = CHANNELS[channel];
  box(g, '#223139', x - 20, y, 40, 9);
  box(g, base, x - 19, y - 2, 38, 8);
  box(g, '#384951', x - 15, y - 3, 30, 6);
  const end = x + (on ? 8 : -8);
  g.lineWidth = 5;
  g.strokeStyle = '#d4d5be';
  g.beginPath();
  g.moveTo(x, y - 1);
  g.lineTo(end, y - 15);
  g.stroke();
  disc(g, on ? glow : '#f1dfac', end, y - 16, 5, 5);
  label(g, letter, x + 12, y + 1, glow, 10);
}
function gate(g, x, y, channel, opening) {
  const [glow, base, letter] = CHANNELS[channel];
  box(g, '#182a34', x - 32, y - 19, 64, 40);
  for (let j = 0; j < 5; j++) {
    const yy = y - 17 + j * 8;
    box(g, opening > 0.5 ? '#ae8d67' : '#6f6861', x - 29, yy, 58, 6);
    box(g, '#f1c99099', x - 27, yy, 54, 1);
  }
  const bar = y + 10 - opening * 29;
  g.save();
  g.beginPath();
  g.rect(x - 25, y - 19, 50, 37);
  g.clip();
  const metal = 1 - opening;
  if (metal > 0.015) {
    for (let n = -2; n <= 2; n++) box(g, '#263941', x + n * 10 - 2.5, y - 18, 5, Math.max(0, bar - y + 19));
    box(g, base, x - 26, bar - 4, 52, 7);
    box(g, glow, x - 25, bar - 4, 50, 2);
  }
  g.restore();
  for (const side of [-1, 1]) {
    box(g, '#283a40', x + side * 29 - 4, y - 21, 8, 40);
    box(g, base, x + side * 29 - 3, y - 21, 6, 7);
    box(g, glow, x + side * 29 - 2, y - 20, 4, 2);
  }
  label(g, letter, x, y + (opening > 0.5 ? 0 : -4), opening > 0.5 ? '#382e28' : glow, 12);
}
function exitPad(g, x, y, arrived, t) {
  disc(g, '#43414a', x, y + 2, 23, 12);
  g.strokeStyle = MARK;
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(x, y, 21, 10, 0, 0, TAU);
  g.stroke();
  const up = arrived ? 0 : Math.sin(t * 3) * 2;
  const points = [
    [0, -11],
    [3, -3],
    [12, -2],
    [5, 3],
    [7, 11],
    [0, 6],
    [-7, 11],
    [-5, 3],
    [-12, -2],
    [-3, -3],
  ];
  polygon(
    g,
    arrived ? '#fff8dc' : MARK,
    points.map(([dx, dy]) => [x + dx, y + dy + up - 4]),
  );
}
function figure(g, atlas, hero, index, x, y, dir, step, active) {
  const tone = index === 0 ? '#8af4ed' : '#ffc98a',
    sw = atlas.naturalWidth / 5,
    sh = atlas.naturalHeight / 2;
  disc(g, '#14242e7d', x, y + 2, 16, 5.3);
  if (active) {
    g.strokeStyle = tone;
    g.lineWidth = 2.5;
    g.beginPath();
    g.ellipse(x, y + 2, 18, 6, 0, 0, TAU);
    g.stroke();
  }
  const bob = Math.sin(step * Math.PI) * 3;
  g.save();
  g.translate(x, y - bob);
  g.scale(dir === 'left' ? -1 : 1, 1);
  if (sw && sh) {
    const sx = Object.keys(HEROES).indexOf(hero) * sw,
      sy = dir === 'up' ? sh : 0;
    const height = 57,
      width = (height * sw) / sh,
      split = 0.76;
    g.rotate(Math.sin(step * TAU) * 0.035);
    g.drawImage(atlas, sx, sy, sw, sh * split, -width / 2, -height, width, height * split + 0.15);
    for (let i = 0; i < 2; i++)
      g.drawImage(
        atlas,
        sx + (i * sw) / 2,
        sy + sh * split,
        sw / 2,
        sh * (1 - split),
        ((i - 1) * width) / 2,
        -height * (1 - split),
        width / 2,
        height * (1 - split) + (i ? 1 : -1) * Math.sin(step * TAU) * 1.8,
      );
  } else {
    box(g, '#3b3135', -10, -43, 20, 14);
    box(g, '#f0bf96', -9, -39, 18, 14);
    box(g, tone, -11, -25, 22, 16);
    box(g, '#243140', -9, -9, 7, 9);
    box(g, '#243140', 2, -9, 7, 9);
  }
  g.restore();
  if (active)
    polygon(g, tone, [
      [x - 5, y - 62 - bob],
      [x + 5, y - 62 - bob],
      [x, y - 56 - bob],
    ]);
}

function paintBoard(g, state, images, walks, openness, now) {
  const room = rooms[state.room],
    top = Y0(room);
  ambient(g, room, state.room, now, images[state.room < 4 ? 'world' : 'realm']);
  const texture = material(motifs[state.room][0]);
  // Landmarks rise behind the walkable tiles, keeping both routes and switches visible.
  drawLandmark(g, motifs[state.room][1], 43, top - 120, 168);
  drawLandmark(g, motifs[state.room][2], W - 192, top - 98, 144);
  for (let row = 0; row < room.rows.length; row++) {
    for (let col = 0; col < WIDTH; col++) {
      const i = row * WIDTH + col,
        c = tileAt(room, i);
      if (c === ' ') continue;
      const x = LEFT + col * TX,
        y = top + row * TY,
        mx = x + TX / 2,
        my = y + TY / 2;
      floor(g, room, c, i, x, y, texture);
      if (c === 'a' || c === 'b') pressure(g, mx, my, gateBit(c) - 1, occupied(state, i), now);
      if (c === 'x' || c === 'y') lever(g, mx, my, gateBit(c) - 1, Boolean(state.latched & gateBit(c)));
      if (c === 'A' || c === 'B') gate(g, mx, my, gateBit(c) - 1, openness[gateBit(c) - 1]);
      if (c === 'E') exitPad(g, mx, my, occupied(state, i), now);
    }
  }
  const figures = state.positions.map((pos, i) => {
    const w = walks[i],
      t = Math.min(1, Math.max(0, (now - w.at) / 0.16)),
      eased = t * t * (3 - 2 * t);
    const x = MID(w.from) + (MID(pos) - MID(w.from)) * eased,
      y = FEET(w.from, room) + (FEET(pos, room) - FEET(w.from, room)) * eased;
    return { i, x, y, t, dir: w.dir };
  });
  figures.sort((a, b) => a.y - b.y);
  for (const f of figures)
    figure(g, images.fig, state.players[f.i], f.i, f.x, f.y, f.dir, f.t, f.i === state.active);
}

export function mount(host, { saved, players, save, finish, cue = () => {} }) {
  const css = new URL('./coop.css', import.meta.url).href;
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.href === css)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = css;
    document.head.append(link);
  }
  const root = document.createElement('section');
  root.className = 'coop-game';
  root.innerHTML = `
    <div class="coop-head"><div><p class="coop-place"></p><h2 class="coop-title"></h2></div><span class="coop-count"></span></div>
    <div class="coop-layout">
      <div class="coop-stage"><canvas width="720" height="446" tabindex="0" aria-label="Карта комнаты. Стрелками или клавишами WASD двигайте героя, Q переключает героев."></canvas>
        <div class="coop-win" hidden><div><span aria-hidden="true">✦ ✦</span><strong>Оба на выходе!</strong><button type="button" data-next></button></div></div>
      </div>
      <div class="coop-side">
        <div class="coop-team" aria-label="Выбор активного героя">
          <button type="button" data-actor="0"><i aria-hidden="true"></i><b></b></button>
          <button type="button" data-actor="1"><i aria-hidden="true"></i><b></b></button>
        </div>
        <p class="coop-switch">Нажми на имя или клавишу <kbd>Q</kbd>, чтобы сменить героя.</p>
        <p class="coop-hint"></p>
        <p class="coop-status" role="status"></p>
        <div class="coop-arrows" role="group" aria-label="Передвижение">
          <button type="button" data-dir="up" aria-label="Вверх">↑</button>
          <button type="button" data-dir="left" aria-label="Влево">←</button>
          <button type="button" data-dir="down" aria-label="Вниз">↓</button>
          <button type="button" data-dir="right" aria-label="Вправо">→</button>
        </div>
        <button type="button" class="coop-reset" data-reset>↻ Начать комнату заново</button>
      </div>
    </div>`;
  host.replaceChildren(root);
  const el = (s) => root.querySelector(s);
  const canvas = el('canvas'),
    g = canvas.getContext('2d'),
    status = el('.coop-status'),
    win = el('.coop-win');
  const next = el('[data-next]');
  const images = {
    fig: spr('maze-figures.webp'),
    world: spr('world-panoramas.webp'),
    realm: spr('realm-panoramas.webp'),
  };
  const actorButtons = [...root.querySelectorAll('[data-actor]')];
  let state = loadRoom(saved, players),
    walk,
    openness,
    frame = 0,
    paused = false,
    done = false,
    destroyed = false,
    lastAt = 0;
  let timer = 0,
    repeat = 0,
    sceneTime = 0;
  const motion = !reducedMotion();
  const abort = new AbortController(),
    opt = { signal: abort.signal };
  const persist = () => save({ ...state, positions: [...state.positions], players: [...state.players] });
  function align() {
    walk = state.positions.map((pos) => ({ from: pos, dir: 'down', at: -1 }));
    const mask = openMask(state);
    openness = [Number(Boolean(mask & 1)), Number(Boolean(mask & 2))];
  }
  function cancelHold() {
    clearTimeout(timer);
    clearInterval(repeat);
    timer = repeat = 0;
  }
  function activeName() {
    return HEROES[state.players[state.active]];
  }
  function refreshTeam() {
    actorButtons.forEach((button, i) => {
      button.querySelector('b').textContent = HEROES[state.players[i]];
      button.querySelector('i').className = 'face face-' + state.players[i];
      button.setAttribute('aria-pressed', String(i === state.active));
    });
  }
  function refreshRoom() {
    const room = rooms[state.room];
    el('.coop-place').textContent = room.place;
    el('.coop-title').textContent = room.name;
    el('.coop-count').textContent = 'Комната ' + (state.room + 1) + ' / ' + rooms.length;
    el('.coop-hint').textContent = room.hint;
    status.textContent = 'Проведите обоих героев на две золотые звезды.';
    refreshTeam();
    win.hidden = !roomWon(state);
    next.textContent = state.room === rooms.length - 1 ? 'Завершить игру' : 'Следующая комната';
  }
  function redraw(now) {
    const dt = Math.min(0.06, Math.max(0, (now - lastAt) / 1000));
    lastAt = now;
    if (!paused) sceneTime += dt;
    const mask = openMask(state);
    for (let i = 0; i < 2; i++) {
      const goal = Number(Boolean(mask & (1 << i)));
      openness[i] += motion
        ? Math.sign(goal - openness[i]) * Math.min(Math.abs(goal - openness[i]), dt * 5)
        : goal - openness[i];
    }
    paintBoard(g, state, images, walk, openness, motion ? sceneTime : 0);
    if (!paused && !destroyed && !done) frame = requestAnimationFrame(redraw);
  }
  function switchTo(i) {
    if (paused || done || roomWon(state) || state.active === i) return;
    cancelHold();
    state.active = i;
    cue('coop-handoff');
    refreshTeam();
    status.textContent = 'Ходит ' + activeName() + '.';
    persist();
  }
  function move(dir) {
    if (paused || done || roomWon(state)) return;
    const i = state.active,
      from = state.positions[i],
      result = stepHero(state, dir);
    const msg = {
      blocked: 'За краем дорожки прохода нет.',
      partner: 'Здесь стоит напарник. Можно переключиться на него.',
      gate: 'Ворота закрыты. Второй герой может удерживать плиту с той же цифрой.',
      lever: 'Рычаг закреплён! Теперь оба героя могут покинуть плиту.',
      plate: 'Плита нажата! Переключись на напарника и проведи его через ворота с той же цифрой.',
      exit: 'Одна звезда занята. Приведи напарника на вторую.',
    };
    if (from === state.positions[i]) {
      status.textContent = msg[result];
      return;
    }
    walk[i] = { from, dir, at: motion ? sceneTime : -1 };
    if (result === 'lever') cue('coop-latch');
    if (result === 'plate') cue('coop-plate');
    if (roomWon(state)) {
      cue('coop-exit');
      cancelHold();
      win.hidden = false;
      status.textContent = 'Оба героя добрались до выхода.';
      next.focus({ preventScroll: true });
    } else {
      status.textContent =
        msg[result] ||
        (state.positions.some((p) => tileAt(rooms[state.room], p) === 'E')
          ? 'Одна звезда занята. Найди вторую.'
          : 'Две золотые звезды — выход для вашей команды.');
    }
    persist();
  }
  function again() {
    if (paused || done) return;
    cancelHold();
    state = resetRoom(state);
    align();
    refreshRoom();
    persist();
    canvas.focus({ preventScroll: true });
  }
  next.addEventListener(
    'click',
    () => {
      if (paused || done || !roomWon(state)) return;
      if (state.room === rooms.length - 1) {
        done = true;
        cancelAnimationFrame(frame);
        finish({
          summary: 'Оба героя прошли все семь комнат. Всего ходов — ' + state.steps + '.',
          score: rooms.length,
        });
        return;
      }
      state = freshRoom(state.players, state.room + 1, state.steps);
      align();
      refreshRoom();
      persist();
      canvas.focus({ preventScroll: true });
    },
    opt,
  );
  actorButtons.forEach((button, i) => button.addEventListener('click', () => switchTo(i), opt));
  el('[data-reset]').addEventListener('click', again, opt);
  const dirs = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
  };
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        paused ||
        done ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        document.querySelector('dialog[open]') ||
        event.target.closest?.('input,textarea,select,[contenteditable="true"]')
      )
        return;
      const dir = dirs[event.code];
      if (dir) {
        event.preventDefault();
        move(dir);
      } else if (event.code === 'KeyQ' && !event.repeat) {
        event.preventDefault();
        switchTo(1 - state.active);
      }
    },
    opt,
  );
  for (const button of root.querySelectorAll('[data-dir]')) {
    const dir = button.dataset.dir;
    button.addEventListener(
      'pointerdown',
      (e) => {
        if (!e.isPrimary || e.button !== 0 || paused || done) return;
        e.preventDefault();
        cancelHold();
        button.setPointerCapture(e.pointerId);
        move(dir);
        if (!roomWon(state))
          timer = setTimeout(() => {
            repeat = setInterval(() => move(dir), 180);
          }, 260);
      },
      opt,
    );
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      button.addEventListener(event, cancelHold, opt);
    button.addEventListener(
      'click',
      (e) => {
        if (e.detail === 0) move(dir);
      },
      opt,
    );
  }
  canvas.addEventListener(
    'click',
    (e) => {
      if (paused || done || roomWon(state)) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((((e.clientX - rect.left) * W) / rect.width - LEFT) / TX);
      const y = Math.floor((((e.clientY - rect.top) * H) / rect.height - Y0(rooms[state.room])) / TY);
      if (x < 0 || x >= WIDTH || y < 0 || y >= rooms[state.room].rows.length) return;
      const cell = y * WIDTH + x;
      if (state.positions[1 - state.active] === cell) {
        switchTo(1 - state.active);
        return;
      }
      const cur = state.positions[state.active];
      for (const [dir, [dx, dy]] of Object.entries(STEP))
        if (x === (cur % WIDTH) + dx && y === Math.floor(cur / WIDTH) + dy) move(dir);
    },
    opt,
  );
  window.addEventListener('blur', cancelHold, opt);
  align();
  refreshRoom();
  persist();
  lastAt = performance.now();
  redraw(lastAt);
  return {
    pause() {
      if (destroyed || done || paused) return;
      paused = true;
      cancelHold();
      cancelAnimationFrame(frame);
      persist();
    },
    resume() {
      if (destroyed || done || !paused) return;
      paused = false;
      lastAt = performance.now();
      frame = requestAnimationFrame(redraw);
    },
    destroy() {
      destroyed = true;
      cancelHold();
      cancelAnimationFrame(frame);
      abort.abort();
      root.remove();
    },
  };
}
