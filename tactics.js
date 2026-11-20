import { landmarkPosition, material } from './arcade-scenery.js';
import { drawGem } from './games/block-maze/maze-materials.js';
import { monsterPortrait } from './maze-portraits.js';
import { heroNames } from './progress.js';

const HEROES = Object.keys(heroNames);
const WIDTH = 6,
  HEIGHT = 5;
const skill = {
  kirill: ['Рывок', 'До двух клеток за один ход.'],
  maxim: ['Удар', 'Оглушает ближайшего монстра не дальше двух клеток на два хода.'],
  mom: ['Невидимость', 'Позволяет шагнуть под защитой от ближайшего хода монстров.'],
  dad: ['Бу!', 'Монстры меняют направление патруля и пропускают ход.'],
  pasha: ['Аккорд', 'Монстры в трёх клетках танцуют два хода.'],
};
export const missions = [
  {
    name: 'Стражи храма',
    world: 'Храм изумруда',
    scene: 'temple',
    map: ['0...*G', '.#....', '....#.', '.#..*.', '1.....'],
    patrols: [
      { name: 'Скелет', kind: 'skeleton', path: [8, 9, 15, 14] },
      { name: 'Паук', kind: 'spider', path: [22, 28, 27, 21] },
    ],
  },
  {
    name: 'Лавовая переправа',
    world: 'Нижний мир',
    scene: 'lava',
    map: ['*..#.G', '.0...*', '.#.#..', '*...#.', '1.....'],
    patrols: [
      { name: 'Магмовый куб', kind: 'magma_cube', path: [1, 2, 8, 7] },
      { name: 'Гаст', kind: 'ghast', path: [28, 29, 23, 17, 16, 10, 11, 17, 23, 29] },
    ],
  },
  {
    name: 'Врата Края',
    world: 'Край',
    scene: 'end',
    map: ['0#..*G', '...#..', '.*..*.', '..#.#.', '1.....'],
    patrols: [
      { name: 'Эндермен', kind: 'enderman', path: [7, 8, 14, 13] },
      { name: 'Шалкер', kind: 'shulker', path: [16, 10, 11, 17] },
      { name: 'Эндермен', kind: 'enderman', path: [27, 28, 29, 23, 29, 28] },
    ],
  },
];
const board = (level) => missions[level].map.join('');
const validTeam = (team) =>
  Array.isArray(team) &&
  team.length === 2 &&
  new Set(team).size === 2 &&
  team.every((h) => HEROES.includes(h));
const int = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
function spawnCell(map, player) {
  return map.indexOf(String(player));
}
function distance(a, b) {
  return Math.abs((a % WIDTH) - (b % WIDTH)) + Math.abs(Math.floor(a / WIDTH) - Math.floor(b / WIDTH));
}
function neighbors(cell) {
  return [cell - WIDTH, cell + 1, cell + WIDTH, cell - 1].filter(
    (c) => int(c, 0, WIDTH * HEIGHT - 1) && distance(c, cell) === 1,
  );
}
function makeMission(team, level, totalTurns = 0) {
  const map = board(level);
  return {
    version: 1,
    team: [...team],
    level,
    round: 1,
    totalTurns,
    positions: [spawnCell(map, 0), spawnCell(map, 1)],
    active: 0,
    used: [false, false],
    cooldown: [0, 0],
    veil: [false, false],
    stride: 0,
    health: 4,
    gems: Array.from(map, (tile, cell) => (tile === '*' ? cell : -1)).filter((c) => c >= 0),
    guards: missions[level].patrols.map(() => ({ index: 0, dir: 1, rest: 0 })),
    phase: 'play',
    message: 'Заберите кристаллы и доведите любого героя до портала.',
  };
}
export function createTactics(players, saved = null) {
  const team = validTeam(players) ? players : ['mom', 'pasha'];
  const fresh = () => makeMission(team, 0);
  if (
    !saved ||
    saved.version !== 1 ||
    !validTeam(saved.team) ||
    saved.team.some((h, i) => h !== team[i]) ||
    !int(saved.level, 0, missions.length - 1)
  )
    return fresh();
  const s = saved,
    map = board(s.level),
    patrols = missions[s.level].patrols;
  if (
    !int(s.round, 1, Number.MAX_SAFE_INTEGER) ||
    !int(s.totalTurns, 0, Number.MAX_SAFE_INTEGER) ||
    !int(s.active, 0, 1) ||
    !int(s.health, 0, 4) ||
    !int(s.stride, 0, 2) ||
    !['play', 'lost', 'clear', 'won'].includes(s.phase) ||
    typeof s.message !== 'string' ||
    !Array.isArray(s.gems) ||
    new Set(s.gems).size !== s.gems.length ||
    s.gems.some((c) => !int(c, 0, 29) || map[c] !== '*') ||
    ![s.positions, s.used, s.cooldown, s.veil].every((a) => Array.isArray(a) && a.length === 2) ||
    s.positions.some((c) => !int(c, 0, 29) || map[c] === '#') ||
    [...s.used, ...s.veil].some((v) => typeof v !== 'boolean') ||
    s.cooldown.some((n) => !int(n, 0, 3)) ||
    !Array.isArray(s.guards) ||
    s.guards.length !== patrols.length ||
    s.guards.some(
      (g, i) =>
        !g || !int(g.index, 0, patrols[i].path.length - 1) || ![1, -1].includes(g.dir) || !int(g.rest, 0, 2),
    )
  )
    return fresh();
  return structuredClone(s);
}
const nextIndex = (g, path) => (g.index + g.dir + path.length) % path.length;
export function plans(s) {
  return s.guards.map((g, i) => {
    const p = missions[s.level].patrols[i],
      from = p.path[g.index];
    return { ...p, from, to: g.rest ? null : p.path[nextIndex(g, p.path)], rest: g.rest };
  });
}
export function steps(s) {
  if (s.phase !== 'play' || s.used[s.active]) return [];
  const map = board(s.level),
    pos = s.positions[s.active];
  const near = neighbors(pos).filter((n) => map[n] !== '#');
  return s.stride === 2
    ? [...new Set([...near, ...near.flatMap((n) => neighbors(n).filter((n) => map[n] !== '#' && n !== pos))])]
    : near;
}
function canSkill(s) {
  if (s.phase !== 'play' || s.used[s.active] || s.cooldown[s.active]) return false;
  const hero = s.team[s.active],
    r = hero === 'maxim' ? 2 : hero === 'pasha' ? 3 : Infinity;
  return plans(s).some((p) => distance(s.positions[s.active], p.from) <= r);
}
function spent(s) {
  s.used[s.active] = true;
  s.stride = 0;
  if (!s.used[1 - s.active]) s.active = 1 - s.active;
}
export function tacticsTurn(prev, act) {
  if (act.type === 'next' && prev.phase === 'clear')
    return makeMission(prev.team, prev.level + 1, prev.totalTurns);
  if (act.type === 'retry' && prev.phase === 'lost')
    return makeMission(prev.team, prev.level, prev.totalTurns);
  if (prev.phase !== 'play') return prev;
  const s = structuredClone(prev),
    a = s.active,
    map = board(s.level);
  if (act.type === 'select' && int(act.index, 0, 1) && !s.used[act.index] && !s.stride) {
    s.active = act.index;
    return s;
  }
  if (act.type === 'move' && steps(s).includes(act.cell)) {
    s.positions[a] = act.cell;
    const crystal = s.gems.includes(act.cell);
    s.gems = s.gems.filter((c) => c !== act.cell);
    s.message = crystal ? 'Кристалл в рюкзаке!' : heroNames[s.team[a]] + ' занимает позицию.';
    spent(s);
    if (!s.gems.length && s.positions.some((c) => map[c] === 'G')) {
      s.phase = s.level === missions.length - 1 ? 'won' : 'clear';
      s.totalTurns++;
      s.message = 'Портал открыт!';
    }
    return s;
  }
  if (act.type === 'skill' && canSkill(s)) {
    const hero = s.team[a],
      p = plans(s);
    s.cooldown[a] = 3;
    if (hero === 'kirill' || hero === 'mom') {
      s.stride = hero === 'kirill' ? 2 : 1;
      s.veil[a] = hero === 'mom';
      s.message = hero === 'mom' ? 'Мама невидима. Выберите соседнюю клетку.' : 'Выберите клетку для рывка.';
    } else {
      const near = p.map((g, i) => ({ i, d: distance(s.positions[a], g.from) })).sort((x, y) => x.d - y.d);
      if (hero === 'maxim') s.guards[near[0].i].rest = 2;
      if (hero === 'pasha') for (const n of near.filter((n) => n.d <= 3)) s.guards[n.i].rest = 2;
      if (hero === 'dad')
        for (const guard of s.guards) {
          guard.dir *= -1;
          guard.rest = Math.max(guard.rest, 1);
        }
      s.message = heroNames[hero] + ' использует «' + skill[hero][0] + '».';
      spent(s);
    }
    return s;
  }
  if (act.type === 'end') {
    const danger = plans(s).flatMap((p) => (p.to === null ? [] : [p.to]));
    let hits = 0;
    for (let i = 0; i < 2; i++)
      if (!s.veil[i] && danger.includes(s.positions[i])) {
        s.positions[i] = spawnCell(map, i);
        hits++;
      }
    s.health = Math.max(0, s.health - hits);
    for (const [i, g] of s.guards.entries()) {
      if (g.rest) g.rest--;
      else g.index = nextIndex(g, missions[s.level].patrols[i].path);
    }
    s.round++;
    s.totalTurns++;
    s.active = 0;
    s.used = [false, false];
    s.veil = [false, false];
    s.stride = 0;
    s.cooldown = s.cooldown.map((n) => Math.max(0, n - 1));
    s.phase = s.health ? 'play' : 'lost';
    s.message = hits
      ? 'Страж заметил героя! Он вернулся ко входу. Кристаллы сохранены.'
      : 'Патруль прошёл мимо. Ваш ход.';
    return s;
  }
  return prev;
}
function cellName(c) {
  return 'АБВГДЕ'[c % WIDTH] + (1 + Math.floor(c / WIDTH));
}
function heroSprite(hero, extra = '') {
  return (
    '<i aria-hidden="true" class="tac-sprite tac-hero ' +
    extra +
    '" style="background-position:' +
    HEROES.indexOf(hero) * 25 +
    '% 0"></i>'
  );
}
const floors = new Map();
const scenery = {
  temple: ['stone_mask', 'brazier'],
  lava: ['basalt_columns', 'crimson_fungi'],
  end: ['crystal_spires', 'chorus_grove'],
};
function fixture(name) {
  return (
    '<span aria-hidden="true" class="tac-fixture" style="background-position:' +
    landmarkPosition(name) +
    '"></span>'
  );
}
export function mount(host, { players, saved, save, finish }) {
  let s = createTactics(players, saved),
    paused = false,
    disposed = false;
  const events = new AbortController();
  function go(act) {
    if (disposed || paused) return;
    const result = tacticsTurn(s, act);
    if (result === s) return;
    s = result;
    if (s.phase === 'won') {
      finish({
        summary: 'Три портала открыты · раундов ' + s.totalTurns,
        score: Math.max(1, 180 - s.totalTurns),
      });
      return;
    }
    save(structuredClone(s));
    render();
  }
  function render() {
    const m = missions[s.level],
      moves = steps(s),
      guards = plans(s),
      hero = s.team[s.active],
      map = board(s.level);
    const cells = Array.from(map, (symbol, c) => {
      const danger = guards.filter((g) => g.to === c);
      const occupants = s.positions.flatMap((pos, i) => (pos === c ? [i] : []));
      const monsters = guards.filter((g) => g.from === c);
      const label = [
        cellName(c),
        ...occupants.map((i) => heroNames[s.team[i]]),
        ...monsters.map((g) => g.name),
        danger.length ? 'сюда идёт ' + danger.map((g) => g.name).join(', ') : '',
        symbol === '#' ? 'преграда' : s.gems.includes(c) ? 'кристалл' : symbol === 'G' ? 'портал' : '',
      ]
        .filter(Boolean)
        .join(', ');
      let landmark = '';
      if (symbol === 'G') landmark = fixture('exit_portal');
      if (symbol === '#') landmark = fixture(scenery[m.scene][c % 2]);
      const icons =
        occupants.map((i) => heroSprite(s.team[i], i === s.active ? 'current' : '')).join('') +
        monsters
          .map(
            (g) =>
              '<i data-beast="' +
              g.kind +
              '" class="tac-sprite tac-monster ' +
              (g.rest ? 'sleep' : '') +
              '"></i>',
          )
          .join('');
      return (
        '<button type="button" class="tac-cell ' +
        (moves.includes(c) ? 'reachable ' : '') +
        (danger.length ? 'danger ' : '') +
        (symbol === '#' ? 'rock' : symbol === 'G' ? 'gate' : '') +
        '" data-cell="' +
        c +
        '" aria-label="' +
        label +
        '" ' +
        (moves.includes(c) ? '' : 'disabled') +
        '>' +
        landmark +
        (s.gems.includes(c)
          ? '<canvas class="tac-gem" aria-hidden="true" width="64" height="64"></canvas>'
          : '') +
        '<span class="tac-stand">' +
        icons +
        '</span>' +
        (danger.length ? '<span class="tac-mark" aria-hidden="true">!</span>' : '') +
        '</button>'
      );
    }).join('');
    const roster = s.team
      .map(
        (id, i) =>
          '<button type="button" data-pick="' +
          i +
          '" aria-pressed="' +
          (s.active === i) +
          '" ' +
          (s.phase !== 'play' || s.used[i] || s.stride ? 'disabled' : '') +
          '>' +
          heroSprite(id) +
          '<span><b>' +
          heroNames[id] +
          '</b><small>' +
          (s.used[i] ? 'Ход сделан' : s.active === i ? 'Сейчас ходит' : 'Можно ходить') +
          '</small></span></button>',
      )
      .join('');
    host.innerHTML =
      '<section class="tac-game ' +
      m.scene +
      '"><header class="tac-banner"><small>' +
      m.world +
      ' · Миссия ' +
      (s.level + 1) +
      '/3</small><h2>' +
      m.name +
      '</h2><p>Соберите ◆ и доберитесь до портала ◉. Красный восклицательный знак отмечает следующий шаг стража.</p></header>' +
      '<div class="tac-stats"><b>Раунд ' +
      s.round +
      '</b><span>♥ ' +
      s.health +
      '/4</span><span>◆ Осталось ' +
      s.gems.length +
      '</span></div>' +
      '<div class="tac-layout"><div class="tac-board" aria-label="Тактическое поле">' +
      cells +
      '</div><div class="tac-command"><div class="tac-team">' +
      roster +
      '</div>' +
      '<p class="tac-cue" role="status"></p>' +
      (s.phase === 'play'
        ? '<p class="tac-guide">' +
          (s.used.every(Boolean)
            ? 'Оба героя сходили. Передайте ход стражам.'
            : 'Нажмите на подсвеченную клетку, чтобы сделать шаг.') +
          '</p>' +
          '<button type="button" data-act="skill" ' +
          (canSkill(s) ? '' : 'disabled') +
          '>' +
          skill[hero][0] +
          (s.cooldown[s.active] ? ' · ' + s.cooldown[s.active] : '') +
          '</button><small>' +
          skill[hero][1] +
          '</small>' +
          '<button type="button" data-act="end" class="tac-primary">Ход монстров →</button>'
        : '<button type="button" class="tac-primary" data-act="' +
          (s.phase === 'clear' ? 'next' : 'retry') +
          '">' +
          (s.phase === 'clear' ? 'Следующая миссия →' : 'Попробовать миссию снова') +
          '</button>') +
      '<details><summary>Клавиатура</summary><small>Стрелки — шаг. Q — второй герой, E — способность, F — ход монстров. Для длинного рывка нажмите на клетку.</small></details></div></div></section>';
    const world = m.scene === 'lava' ? 'nether' : m.scene;
    if (!floors.has(world)) floors.set(world, 'url(' + material(world).toDataURL() + ')');
    host.querySelector('.tac-board').style.setProperty('--stone', floors.get(world));
    for (const placeholder of host.querySelectorAll('[data-beast]')) {
      placeholder.replaceWith(monsterPortrait(placeholder.dataset.beast, placeholder.className));
    }
    for (const gem of host.querySelectorAll('.tac-gem')) {
      const context = gem.getContext('2d');
      context.scale(4, 4);
      drawGem(context, 8, 8, true);
    }
    host.querySelector('.tac-cue').textContent = s.message;
  }
  host.addEventListener(
    'click',
    (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.pick !== undefined) go({ type: 'select', index: +b.dataset.pick });
      else if (b.dataset.cell !== undefined) go({ type: 'move', cell: +b.dataset.cell });
      else if (b.dataset.act) go({ type: b.dataset.act });
    },
    { signal: events.signal },
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (paused || disposed || s.phase !== 'play' || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const delta = { ArrowUp: -WIDTH, ArrowDown: WIDTH, ArrowRight: 1, ArrowLeft: -1 };
      if (Object.hasOwn(delta, e.key)) {
        e.preventDefault();
        const here = s.positions[s.active],
          dest = here + delta[e.key];
        if (distance(here, dest) === 1) go({ type: 'move', cell: dest });
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        go({ type: 'select', index: 1 - s.active });
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        go({ type: 'skill' });
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        go({ type: 'end' });
      }
    },
    { signal: events.signal },
  );
  render();
  save(structuredClone(s));
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
