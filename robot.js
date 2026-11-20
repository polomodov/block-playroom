import { drawGem } from './games/block-maze/maze-materials.js';
import { drawLandmark, material } from './arcade-scenery.js';
// A token program runs on a deterministic turn-based map. Loop expansion retains
// source positions so that errors and the execution light point to the written program.
export const warehouses = [
  {
    name: 'Отдел светильников',
    limit: 12,
    hint: 'Робот смотрит вправо. Собери два изумруда, поверни у стеллажа и вернись на станцию.',
    rows: ['#######', '#S..g##', '####.##', '#..Eg##', '#######'],
  },
  {
    name: 'Квадратный склад',
    limit: 10,
    hint: 'Три стороны квадрата одинаковые. Вставь команды между «Три раза» и «Конец», чтобы робот повторил их.',
    rows: ['#######', '#S..g##', '#.##.##', '#E##.##', '#g..g##', '#######'],
  },
  {
    name: 'Мебельная лестница',
    limit: 9,
    hint: 'Найди повторяющуюся ступень маршрута. После третьей ступени робот окажется рядом со станцией.',
    rows: ['##########', '#S.g######', '###..g####', '#####..g##', '#######.E#', '##########'],
  },
];
const commands = {
  forward: { mark: '↑', name: 'Шаг' },
  left: { mark: '↶', name: 'Налево' },
  right: { mark: '↷', name: 'Направо' },
  loop: { mark: '3×', name: 'Три раза' },
  end: { mark: ']', name: 'Конец' },
};
const heroes = { kirill: 'Кирилл', maxim: 'Максим', mom: 'Мама', dad: 'Папа', pasha: 'Паша' };
const directions = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
const idx = (rows, col, row) => row * rows[0].length + col;
function startCell(level) {
  const rows = warehouses[level].rows;
  return rows.join('').indexOf('S');
}
export function createRobot(level = 0, score = 0) {
  return {
    version: 1,
    level,
    score,
    program: [],
    cursor: 0,
    phase: 'edit',
    cell: startCell(level),
    direction: 1,
    pc: 0,
    gems: [],
    elapsed: 0,
    reason: '',
  };
}
export function compileProgram(program) {
  const steps = [];
  let open = -1;
  if (!program.length) return { error: 'Сначала добавь команду.' };
  for (const [i, t] of program.entries()) {
    if (!Object.hasOwn(commands, t)) return { error: 'Неизвестная команда.' };
    if (t === 'loop') {
      if (open !== -1) return { error: 'Закрой предыдущий повтор командой «Конец».' };
      open = steps.length;
    } else if (t === 'end') {
      if (open === -1) return { error: 'Перед «Концом» поставь «Три раза».' };
      if (steps.length === open) return { error: 'Между «Три раза» и «Конец» нужна команда.' };
      const block = steps.slice(open);
      steps.push(...block, ...block);
      open = -1;
    } else steps.push({ action: t, index: i });
  }
  if (open !== -1) return { error: 'Закрой повтор командой «Конец».' };
  return { steps };
}
export function insertCommand(s, cmd) {
  if (s.phase !== 'edit' || !Object.hasOwn(commands, cmd) || s.program.length >= warehouses[s.level].limit)
    return false;
  s.program.splice(s.cursor++, 0, cmd);
  return true;
}
export function eraseCommand(s) {
  if (s.phase !== 'edit' || s.cursor === 0) return false;
  s.program.splice(--s.cursor, 1);
  return true;
}
export function resetRobot(s) {
  const { program, cursor, level, score } = s;
  Object.assign(s, createRobot(level, score), { program, cursor });
}
export function runProgram(s) {
  if (s.phase !== 'edit') return '';
  const result = compileProgram(s.program);
  if (result.error) return result.error;
  resetRobot(s);
  s.phase = 'run';
  return '';
}
export function stepRobot(s, steps = compileProgram(s.program).steps) {
  if (s.phase !== 'run') return;
  const command = steps?.[s.pc];
  if (!command) {
    s.phase = 'failed';
    s.reason = 'short';
    return;
  }
  s.pc++;
  const rows = warehouses[s.level].rows,
    width = rows[0].length;
  if (command.action === 'forward') {
    const [dx, dy] = directions[s.direction],
      x = (s.cell % width) + dx,
      y = Math.floor(s.cell / width) + dy;
    const tile = rows[y]?.[x];
    if (!tile || tile === '#') {
      s.phase = 'failed';
      s.reason = 'wall';
      return;
    }
    s.cell = idx(rows, x, y);
    if (tile === 'g' && !s.gems.includes(s.cell)) s.gems.push(s.cell);
  } else s.direction = (s.direction + (command.action === 'right' ? 1 : 3)) % 4;
  if (rows.join('')[s.cell] === 'E' && s.gems.length === rows.join('').split('g').length - 1) {
    s.phase = 'passed';
    return;
  }
  if (s.pc >= steps.length) {
    s.phase = 'failed';
    s.reason = rows.join('')[s.cell] === 'E' ? 'gems' : 'short';
  }
}
export function restoreRobot(o) {
  if (
    !o ||
    o.version !== 1 ||
    !Number.isInteger(o.level) ||
    !warehouses[o.level] ||
    !Number.isSafeInteger(o.score) ||
    o.score < 0 ||
    !Array.isArray(o.program) ||
    o.program.length > warehouses[o.level].limit ||
    !o.program.every((t) => Object.hasOwn(commands, t)) ||
    !Number.isInteger(o.cursor) ||
    o.cursor < 0 ||
    o.cursor > o.program.length ||
    !['edit', 'run', 'failed', 'passed'].includes(o.phase)
  )
    return createRobot();
  const s = createRobot(o.level, o.score);
  s.program = [...o.program];
  s.cursor = o.cursor;
  if (o.phase === 'edit') return s;
  const compiled = compileProgram(s.program);
  if (!compiled.steps || !Number.isInteger(o.pc) || o.pc < 0 || o.pc > compiled.steps.length) return s;
  s.phase = 'run';
  // Replay at most a few dozen commands; only legal cells and collected gems are restored.
  for (let n = 0; n < o.pc; n++) stepRobot(s, compiled.steps);
  s.elapsed = Number.isFinite(o.elapsed) ? Math.max(0, Math.min(0.43, o.elapsed)) : 0;
  return s;
}
const W = 700,
  H = 368,
  beat = 0.44;
function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
function poly(g, p, c) {
  g.fillStyle = c;
  g.beginPath();
  p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function dot(g, x, y, r, c) {
  g.fillStyle = c;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
function drawShelves(g, rows, left, top, size, level) {
  // Fixtures are fitted to contiguous wall cells, leaving every walkable tile visible.
  const sections = ['warehouse', 'show_kitchen', 'living_room'];
  for (const [row, cells] of rows.entries()) {
    for (let col = 0; col < cells.length;) {
      if (cells[col] !== '#') {
        col++;
        continue;
      }
      let end = col + 1;
      while (cells[end] === '#') end++;
      for (let start = col; start < end;) {
        const count = end - start === 3 ? 3 : Math.min(2, end - start);
        const width = Math.min(count * size - 4, size * 1.55);
        const name = sections[(row + start + level) % sections.length];
        const x = left + (start + count * 0.5) * size - width / 2;
        const height = Math.min(size * 0.9, (width * 2) / 3);
        const y = top + (row + 0.5) * size - height / 2;
        drawLandmark(g, name, x, y, width, height);
        start += count;
      }
      col = end;
    }
  }
}

function drawRobot(g, s, time, animation, backdrop) {
  const rows = warehouses[s.level].rows,
    cols = rows[0].length;
  const k = Math.min((W - 36) / cols, (H - 42) / rows.length),
    left = (W - cols * k) / 2,
    top = (H - rows.length * k) / 2;
  g.imageSmoothingEnabled = false;
  const floor = material('store'),
    wall = material('store', '#');
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#29464e');
  bg.addColorStop(1, '#172c38');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  if (backdrop.naturalWidth) {
    g.save();
    g.globalAlpha = 0.62;
    g.drawImage(
      backdrop,
      0,
      backdrop.naturalHeight * 0.75,
      backdrop.naturalWidth,
      backdrop.naturalHeight / 4,
      0,
      0,
      W,
      H,
    );
    g.restore();
  }
  rect(g, left - 4, top - 4, k * cols + 8, k * rows.length + 11, '#182a36');
  rect(g, left - 2, top - 2, k * cols + 4, k * rows.length + 4, '#8e7b65');
  for (let row = 0; row < rows.length; row++)
    for (let col = 0; col < cols; col++) {
      const x = left + col * k,
        y = top + row * k,
        tile = rows[row][col],
        i = idx(rows, col, row);
      if (tile === '#') {
        g.drawImage(wall, 0, 0, 20, 20, x, y, k, k);
        rect(g, x, y + k - 4, k, 4, '#725739');
        continue;
      }
      g.drawImage(floor, (col % 3) * 20, (row % 3) * 20, 20, 20, x, y, k, k);
      if (tile === 'S') {
        rect(g, x + 4, y + 4, k - 8, k - 8, '#8bb6b3');
        poly(
          g,
          [
            [x + k * 0.26, y + k * 0.38],
            [x + k * 0.53, y + k * 0.38],
            [x + k * 0.53, y + k * 0.26],
            [x + k * 0.78, y + k * 0.5],
            [x + k * 0.53, y + k * 0.73],
            [x + k * 0.53, y + k * 0.61],
            [x + k * 0.26, y + k * 0.61],
          ],
          '#d1e8d8',
        );
      }
      if (tile === 'g' && !s.gems.includes(i)) {
        g.save();
        g.translate(x + k / 2, y + k / 2 + Math.sin(time * 3 + i) * 1.3);
        g.scale(k / 22, k / 22);
        drawGem(g, 0, 0, Math.sin(time * 2 + i) > 0.6);
        g.restore();
      }
      if (tile === 'E') {
        rect(g, x + 4, y + 4, k - 8, k - 8, '#557774');
        rect(g, x + 7, y + 7, k - 14, k - 14, '#9bc9ab');
        rect(g, x + k * 0.4, y + k * 0.23, k * 0.08, k * 0.52, '#314d4f');
        poly(
          g,
          [
            [x + k * 0.47, y + k * 0.23],
            [x + k * 0.77, y + k * 0.29],
            [x + k * 0.47, y + k * 0.45],
          ],
          '#ffd894',
        );
      }
    }
  drawShelves(g, rows, left, top, k, s.level);
  const phase = Math.min(1, animation.t / 0.24),
    a = 1 - (1 - phase) ** 2;
  const fx = (animation.cell % cols) * (1 - a) + (s.cell % cols) * a,
    fy = Math.floor(animation.cell / cols) * (1 - a) + Math.floor(s.cell / cols) * a;
  const x = left + (fx + 0.5) * k,
    y = top + (fy + 0.5) * k;
  let diff = (s.direction - animation.dir + 4) % 4;
  if (diff === 3) diff = -1;
  g.save();
  g.translate(x, y);
  g.rotate(((animation.dir + diff * a) * Math.PI) / 2);
  const rr = (ax, ay, w, h, c) => rect(g, ax * k, ay * k, w * k, h * k, c);
  rr(-0.33, -0.22, 0.67, 0.6, '#191f28');
  rr(-0.39, -0.18, 0.12, 0.46, '#354453');
  rr(0.27, -0.18, 0.12, 0.46, '#354453');
  rr(-0.31, -0.32, 0.62, 0.63, '#60939a');
  rr(-0.28, -0.32, 0.53, 0.51, '#d9e7d9');
  rr(-0.28, -0.32, 0.53, 0.055, '#f8fff1');
  rr(0.24, -0.28, 0.07, 0.53, '#88b3ae');
  for (const yy of [-0.1, 0.02, 0.14, 0.26]) {
    rr(-0.39, yy, 0.1, 0.035, '#72918c');
    rr(0.29, yy, 0.1, 0.035, '#72918c');
  }
  rr(-0.22, -0.14, 0.44, 0.12, '#334650');
  rr(-0.13, -0.12, 0.08, 0.055, '#6cf0cf');
  rr(0.07, -0.12, 0.08, 0.055, '#6cf0cf');
  rr(-0.16, 0.04, 0.32, 0.14, '#db9a5b');
  rr(-0.09, 0.07, 0.18, 0.035, '#844c46');
  dot(g, 0, -k * 0.28, k * 0.065, '#ffe19b');
  g.restore();
}
export function mount(host, { saved, players = [], save, finish }) {
  let s = restoreRobot(saved),
    paused = false,
    disposed = false,
    frame,
    last = 0,
    time = 0,
    manual = false;
  const hero = Object.hasOwn(heroes, players[0]) ? players[0] : 'kirill';
  let anim = { cell: s.cell, dir: s.direction, t: 1 },
    compiled = compileProgram(s.program).steps;
  host.innerHTML =
    '<section class="rb-game"><header><div class="rb-head"><span class="rb-portrait face face-' +
    hero +
    '"></span><div><small>Оператор · ' +
    heroes[hero] +
    '</small><h2></h2></div></div><p class="rb-hint"></p></header><div class="rb-layout"><div class="rb-stage"><canvas width="700" height="368" aria-label="План склада со станцией и роботом"></canvas><div class="rb-count"></div></div><div class="rb-console"><h3>Пульт робота</h3><div class="rb-inputs"></div><div class="rb-label"><b>Программа</b><span class="rb-length"></span></div><div class="rb-program" role="group" aria-label="Очередь команд"></div><div class="rb-tools"><button type="button" data-tool="begin">В начало</button><button type="button" data-tool="delete">⌫ Удалить</button></div><p class="rb-status" role="status"></p><div class="rb-play"><button type="button" class="rb-main"></button><button type="button" class="rb-step">Один шаг</button></div></div></div></section>';
  const q = (sel) => host.querySelector(sel),
    ctx = q('canvas').getContext('2d'),
    bg = new Image();
  bg.src = new URL('./assets/world-panoramas.webp', import.meta.url);
  const snap = () => save({ ...s, program: [...s.program], gems: [...s.gems] });
  const ev = new AbortController(),
    opts = { signal: ev.signal };
  for (const [key, cmd] of Object.entries(commands)) {
    const b = document.createElement('button');
    b.dataset.cmd = key;
    b.type = 'button';
    const symbol = document.createElement('b');
    symbol.textContent = cmd.mark;
    b.append(symbol, document.createTextNode(cmd.name));
    b.addEventListener(
      'click',
      () => {
        if (paused || disposed) return;
        const ok = insertCommand(s, key);
        update(ok ? '' : 'В программе заняты все места. Используй повтор или удали команду.');
        snap();
      },
      opts,
    );
    q('.rb-inputs').append(b);
  }
  function update(msg = '') {
    const c = warehouses[s.level],
      rows = c.rows,
      editing = s.phase === 'edit',
      run = s.phase === 'run';
    q('h2').textContent = s.level + 1 + '/3 · ' + c.name;
    q('.rb-hint').textContent = c.hint;
    q('.rb-length').textContent = s.program.length + ' / ' + c.limit;
    q('.rb-count').textContent =
      'Изумруды ' + s.gems.length + ' / ' + (rows.join('').split('g').length - 1) + ' · Станция ⚑';
    for (const b of q('.rb-inputs').children) b.disabled = !editing;
    const queue = q('.rb-program');
    queue.replaceChildren();
    if (!s.program.length) {
      queue.textContent = 'Добавь шаги кнопками сверху';
    }
    s.program.forEach((cmd, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.i = i;
      b.textContent = commands[cmd].mark;
      b.setAttribute('aria-label', i + 1 + '. ' + commands[cmd].name);
      b.title = 'Вставить после команды ' + (i + 1);
      b.classList.toggle('rb-cursor', editing && s.cursor === i + 1);
      b.classList.toggle('rb-lit', !editing && compiled?.[s.pc - 1]?.index === i);
      b.disabled = !editing;
      b.addEventListener(
        'click',
        () => {
          if (paused || disposed) return;
          s.cursor = i + 1;
          update('Следующая команда появится после №' + (i + 1) + '.');
          queue.querySelector('[data-i="' + i + '"]')?.focus({ preventScroll: true });
          snap();
        },
        { once: true },
      );
      queue.append(b);
    });
    q('[data-tool=delete]').disabled = !editing || !s.cursor;
    q('[data-tool=begin]').disabled = !editing || !s.program.length;
    const reason = {
      wall: 'Робот уткнулся в стеллаж.',
      short: 'Команды закончились до доставки.',
      gems: 'Робот на станции, но в залах ещё есть изумруды.',
    };
    q('.rb-status').textContent =
      msg ||
      {
        edit: 'Нажми на команду в программе, чтобы вставить следующую после неё.',
        run: manual ? 'Пошаговая проверка. Продолжай по одной команде.' : 'Робот выполняет программу.',
        failed: (reason[s.reason] || 'Проверь маршрут.') + ' Можно исправить программу и попробовать снова.',
        passed: 'Все изумруды доставлены на станцию!',
      }[s.phase];
    q('.rb-main').textContent = {
      edit: 'Запуск',
      run: 'К чертежу',
      failed: 'Исправить программу',
      passed: s.level === 2 ? 'Завершить доставку' : 'Следующий зал',
    }[s.phase];
    q('.rb-step').hidden = ['failed', 'passed'].includes(s.phase);
    drawRobot(ctx, s, time, anim, bg);
  }
  function step() {
    anim = { cell: s.cell, dir: s.direction, t: 0 };
    stepRobot(s, compiled);
    s.elapsed = 0;
    update();
    snap();
  }
  function run(isManual) {
    const error = runProgram(s);
    if (error) {
      update(error);
      return;
    }
    compiled = compileProgram(s.program).steps;
    manual = isManual;
    s.manual = isManual;
    anim = { cell: s.cell, dir: s.direction, t: 1 };
    if (isManual) step();
    else {
      update();
      snap();
    }
  }
  q('[data-tool=begin]').addEventListener(
    'click',
    () => {
      if (paused) return;
      s.cursor = 0;
      update('Следующая команда появится в начале программы.');
      snap();
    },
    opts,
  );
  q('[data-tool=delete]').addEventListener(
    'click',
    () => {
      if (paused) return;
      eraseCommand(s);
      update();
      snap();
    },
    opts,
  );
  q('.rb-step').addEventListener(
    'click',
    () => {
      if (paused) return;
      if (s.phase === 'edit') run(true);
      else if (s.phase === 'run') {
        manual = true;
        s.manual = true;
        step();
      }
    },
    opts,
  );
  q('.rb-main').addEventListener(
    'click',
    () => {
      if (paused || disposed) return;
      if (s.phase === 'edit') {
        run(false);
        return;
      }
      if (s.phase === 'passed') {
        const score = s.score + 100 + Math.max(0, warehouses[s.level].limit - s.program.length) * 5;
        if (s.level === 2) {
          paused = true;
          finish({ score, summary: 'Робот доставил изумруды из трёх залов · ' + score + ' очков' });
          return;
        }
        s = createRobot(s.level + 1, score);
      } else resetRobot(s);
      manual = false;
      s.manual = false;
      anim = { cell: s.cell, dir: s.direction, t: 1 };
      update();
      snap();
    },
    opts,
  );
  function loop(t) {
    if (paused || disposed) return;
    const dt = last ? Math.min(0.15, (t - last) / 1000) : 0;
    last = t;
    time += dt;
    anim.t += dt;
    if (s.phase === 'run' && !manual) {
      s.elapsed += dt;
      if (s.elapsed >= beat) step();
    }
    drawRobot(ctx, s, time, anim, bg);
    frame = requestAnimationFrame(loop);
  }
  manual = s.phase === 'run' && saved?.manual === true;
  s.manual = manual;
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
      ev.abort();
      cancelAnimationFrame(frame);
      host.replaceChildren();
    },
  };
}
