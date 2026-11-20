import { landmarkPosition } from './arcade-scenery.js';
import { monsterPortrait } from './maze-portraits.js';
import { heroNames } from './progress.js';

const HEROES = Object.keys(heroNames);
// Every played card stays on the table until the end of this turn.
export const catalog = {
  spark: {
    name: 'Изумрудная искра',
    text: 'Снимает 3 стойкости у выбранного стража.',
    cost: 1,
    sign: '◆',
    color: 'jade',
  },
  shield: { name: 'Щит храма', text: 'Даёт 4 защиты до конца хода.', cost: 1, sign: '⬟', color: 'blue' },
  slide: { name: 'Рывок Кирилла', text: 'Берёт 2 карты из колоды.', cost: 0, sign: '↗', color: 'jade' },
  hit: {
    name: 'Удар Максима',
    text: 'Снимает 4 стойкости. Страж пропустит свой удар.',
    cost: 2,
    sign: '✦',
    color: 'amber',
  },
  veil: {
    name: 'Плащ Мамы',
    text: 'До конца хода все атаки проходят мимо.',
    cost: 2,
    sign: '◌',
    color: 'lilac',
  },
  boo: {
    name: 'Папино «Бу!»',
    text: 'Собирает всех стражей на тропе цели. Цель теряет 1 стойкость.',
    cost: 1,
    sign: '〰',
    color: 'amber',
  },
  guitar: {
    name: 'Аккорд Паши',
    text: 'Стражи на тропе цели теряют 1 стойкость и танцуют вместо удара.',
    cost: 1,
    sign: '♫',
    color: 'lilac',
  },
  echo: {
    name: 'Эхо сцены',
    text: 'Снимает 2 стойкости у всех стражей. У танцующих — ещё 3.',
    cost: 1,
    sign: '♬',
    color: 'lilac',
  },
  comet: {
    name: 'Хвост кометы',
    text: 'Снимает 7 стойкости у выбранного стража.',
    cost: 2,
    sign: '☄',
    color: 'amber',
  },
  lantern: {
    name: 'Фонарь хранителя',
    text: 'Возвращает 3 сердца и даёт 2 защиты.',
    cost: 1,
    sign: '☼',
    color: 'jade',
  },
  wave: {
    name: 'Волна тайфуна',
    text: 'Снимает 4 стойкости у всех стражей на тропе цели.',
    cost: 1,
    sign: '≈',
    color: 'blue',
  },
};
const signature = { kirill: 'slide', maxim: 'hit', mom: 'veil', dad: 'boo', pasha: 'guitar' };
const encounters = [
  {
    world: 'Храм изумруда',
    title: 'Мшистый порог',
    className: 'temple',
    foes: [
      ['Паук', 'spider', 5, 2],
      ['Скелет', 'skeleton', 5, 2],
    ],
    rewards: ['echo', 'comet', 'lantern'],
  },
  {
    world: 'Аквапарк',
    title: 'За тайфуном',
    className: 'aqua',
    foes: [
      ['Утопленник', 'drowned', 6, 2],
      ['Страж', 'guardian', 5, 3],
      ['Слизень', 'slime', 5, 1],
    ],
    rewards: ['wave', 'echo', 'lantern'],
  },
  {
    world: 'Край',
    title: 'Последний портал',
    className: 'end',
    foes: [
      ['Эндермен', 'enderman', 7, 2],
      ['Шалкер', 'shulker', 8, 3],
      ['Призрак', 'ghost', 6, 2],
    ],
    rewards: [],
  },
];
const MAX_HEARTS = 16;
const int = (x, min, max) => Number.isSafeInteger(x) && x >= min && x <= max;
function shuffle(s, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    s.random = (Math.imul(s.random, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((s.random / 4294967296) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
function take(s, n) {
  while (n-- > 0) {
    if (!s.pile.length) {
      if (!s.discard.length) break;
      s.pile = s.discard;
      s.discard = [];
      shuffle(s, s.pile);
    }
    s.hand.push(s.pile.pop());
  }
}
function battle(hero, level, deck, seed, health, bonus = null, previous = 0) {
  const s = {
    version: 1,
    hero,
    level,
    deck: [...deck],
    roomSeed: seed >>> 0,
    random: seed >>> 0,
    health,
    turn: 1,
    previous,
    energy: 3,
    block: 0,
    hidden: false,
    phase: 'battle',
    target: 0,
    pile: [...deck],
    hand: [],
    discard: [],
    table: [],
    bonus,
    foes: encounters[level].foes.map((f, i) => ({ hp: f[2], lane: i, dance: false })),
    note: 'Выберите стража, затем карту. Цифра в углу карты — её цена в энергии.',
  };
  const opening = level === 0 ? ['boo', 'guitar', signature[hero]] : [bonus];
  for (const id of opening) {
    const i = s.pile.indexOf(id);
    if (i >= 0) s.hand.push(...s.pile.splice(i, 1));
  }
  shuffle(s, s.pile);
  take(s, 5 - s.hand.length);
  return s;
}
export function createCards(hero = 'maxim', seed = Math.floor(Math.random() * 4294967296)) {
  if (!Object.hasOwn(heroNames, hero)) hero = 'maxim';
  return battle(
    hero,
    0,
    ['spark', 'spark', 'spark', 'shield', 'shield', 'boo', 'guitar', signature[hero], 'slide'],
    seed,
    MAX_HEARTS,
  );
}
export function restoreCards(saved, hero) {
  const s = saved;
  if (!s || s.version !== 1 || s.hero !== hero || !int(s.level, 0, encounters.length - 1))
    return createCards(hero);
  const foes = encounters[s.level].foes;
  const piles = [s.hand, s.pile, s.discard, s.table],
    known = (id) => Object.hasOwn(catalog, id);
  if (
    !['battle', 'reward', 'lost', 'won'].includes(s.phase) ||
    !int(s.health, 0, MAX_HEARTS) ||
    !int(s.energy, 0, 3) ||
    !int(s.block, 0, 128) ||
    typeof s.hidden !== 'boolean' ||
    !int(s.turn, 1, Number.MAX_SAFE_INTEGER) ||
    !int(s.previous, 0, Number.MAX_SAFE_INTEGER) ||
    ![s.roomSeed, s.random].every((n) => int(n, 0, 4294967295)) ||
    !int(s.target, 0, foes.length - 1) ||
    typeof s.note !== 'string' ||
    !(s.bonus === null || known(s.bonus)) ||
    !Array.isArray(s.deck) ||
    s.deck.length !== 9 + s.level ||
    !s.deck.every(known) ||
    !piles.every((a) => Array.isArray(a) && a.length <= s.deck.length && a.every(known)) ||
    piles.flat().sort().join() !== [...s.deck].sort().join() ||
    !Array.isArray(s.foes) ||
    s.foes.length !== foes.length ||
    s.foes.some(
      (f, i) => !f || !int(f.hp, 0, foes[i][2]) || !int(f.lane, 0, 2) || typeof f.dance !== 'boolean',
    ) ||
    (s.phase === 'battle' && (!s.foes[s.target].hp || !s.health)) ||
    (s.phase === 'reward' && (s.level === encounters.length - 1 || s.foes.some((f) => f.hp)))
  )
    return createCards(hero);
  return structuredClone(s);
}
export function incoming(s, i) {
  const f = s.foes[i];
  if (!f.hp || f.dance) return 0;
  return encounters[s.level].foes[i][3] + ((s.turn + i) % 3 === 0 ? 1 : 0);
}
function damage(f, amt) {
  f.hp = Math.max(0, f.hp - amt);
}
export function cardsTurn(prev, act) {
  if (prev.phase === 'reward' && act.type === 'reward' && encounters[prev.level].rewards.includes(act.id)) {
    return battle(
      prev.hero,
      prev.level + 1,
      [...prev.deck, act.id],
      prev.random,
      Math.min(MAX_HEARTS, prev.health + 5),
      act.id,
      prev.previous + prev.turn,
    );
  }
  if (prev.phase === 'lost' && act.type === 'retry')
    return battle(prev.hero, prev.level, prev.deck, prev.roomSeed, MAX_HEARTS, prev.bonus, prev.previous);
  if (prev.phase !== 'battle') return prev;
  const s = structuredClone(prev);
  if (act.type === 'aim' && int(act.index, 0, s.foes.length - 1) && s.foes[act.index].hp) {
    s.target = act.index;
    return s;
  }
  if (act.type === 'end') {
    const incomingHits = s.foes.reduce((total, _, i) => total + incoming(s, i), 0),
      lost = s.hidden ? 0 : Math.max(0, incomingHits - s.block);
    s.health = Math.max(0, s.health - lost);
    s.block = 0;
    s.hidden = false;
    s.foes.forEach((f) => (f.dance = false));
    s.discard.push(...s.hand, ...s.table);
    s.hand = [];
    s.table = [];
    if (!s.health) {
      s.phase = 'lost';
      s.note = 'Силы закончились. Можно повторить эту комнату с полной колодой.';
      return s;
    }
    s.turn++;
    s.energy = 3;
    take(s, 5);
    s.note = lost
      ? 'Стражи сняли ' + lost + ' сердец. Новая рука готова.'
      : 'Все удары прошли мимо. Новая рука готова.';
    return s;
  }
  if (act.type !== 'play' || !int(act.index, 0, s.hand.length - 1)) return prev;
  const id = s.hand[act.index],
    c = catalog[id];
  if (c.cost > s.energy) return prev;
  const foe = s.foes[s.target],
    lane = foe.lane;
  s.hand.splice(act.index, 1);
  s.table.push(id);
  s.energy -= c.cost;
  switch (id) {
    case 'spark':
      damage(foe, 3);
      break;
    case 'shield':
      s.block += 4;
      break;
    case 'slide':
      take(s, 2);
      break;
    case 'hit':
      damage(foe, 4);
      foe.dance = true;
      break;
    case 'veil':
      s.hidden = true;
      break;
    case 'boo':
      s.foes.forEach((f) => {
        if (f.hp) f.lane = lane;
      });
      damage(foe, 1);
      break;
    case 'guitar':
      s.foes.forEach((f) => {
        if (f.hp && f.lane === lane) {
          damage(f, 1);
          f.dance = true;
        }
      });
      break;
    case 'echo':
      s.foes.forEach((f) => damage(f, f.dance ? 5 : 2));
      break;
    case 'comet':
      damage(foe, 7);
      break;
    case 'lantern':
      s.health = Math.min(MAX_HEARTS, s.health + 3);
      s.block += 2;
      break;
    case 'wave':
      s.foes.forEach((f) => {
        if (f.lane === lane) damage(f, 4);
      });
      break;
  }
  const remaining = s.foes.findIndex((f) => f.hp);
  s.note = 'Сыграна карта «' + c.name + '».';
  if (id === 'guitar' && s.foes.filter((f) => f.hp && f.dance).length > 1)
    s.note = 'Дуэт сработал! Вся тропа танцует и пропустит атаку.';
  if (remaining < 0) {
    s.phase = s.level === encounters.length - 1 ? 'won' : 'reward';
    s.note =
      s.phase === 'won'
        ? 'Все порталы открыты!'
        : 'Стражи уступили дорогу. Выберите карту для следующей комнаты.';
  } else if (!foe.hp) s.target = remaining;
  return s;
}
const cardScenes = {
  spark: 'crystal_spires',
  shield: 'stone_mask',
  echo: 'carousel',
  comet: 'exit_portal',
  lantern: 'brazier',
  wave: 'typhoon',
};
function cardArt(id) {
  const hero = HEROES.find((key) => signature[key] === id);
  if (hero)
    return (
      '<i class="deck-illustration family" aria-hidden="true" style="background-position:' +
      HEROES.indexOf(hero) * 25 +
      '% 0"></i>'
    );
  return (
    '<i class="deck-illustration landmark" aria-hidden="true" style="background-position:' +
    landmarkPosition(cardScenes[id]) +
    '"></i>'
  );
}
function cardButton(id, attr, disabled = false) {
  const c = catalog[id];
  return (
    '<button type="button" class="deck-card ' +
    c.color +
    '" ' +
    attr +
    ' ' +
    (disabled ? 'disabled' : '') +
    '>' +
    '<span class="deck-cost" aria-label="Энергия ' +
    c.cost +
    '">' +
    c.cost +
    '</span><span class="deck-mark" aria-hidden="true">' +
    c.sign +
    '</span>' +
    cardArt(id) +
    '<strong>' +
    c.name +
    '</strong><small>' +
    c.text +
    '</small></button>'
  );
}
export function mount(host, { players, saved, save, finish }) {
  let s = restoreCards(saved, players[0]),
    paused = false,
    disposed = false;
  const events = new AbortController();
  function go(act) {
    if (paused || disposed) return;
    const next = cardsTurn(s, act);
    if (s === next) return;
    s = next;
    if (s.phase === 'won') {
      const turns = s.previous + s.turn;
      finish({
        summary: 'Открыто три портала · ходов ' + turns + ' · карт в колоде ' + s.deck.length,
        score: Math.max(1, 150 - turns + s.health),
      });
      return;
    }
    save(structuredClone(s));
    render();
  }
  function render() {
    const room = encounters[s.level];
    const lanes = [0, 1, 2]
      .map((lane) => {
        const enemies = s.foes
          .map((f, i) => {
            if (!f.hp || f.lane !== lane) return '';
            const [name, kind] = room.foes[i];
            return (
              '<button type="button" class="deck-foe ' +
              (f.dance ? 'dancing' : '') +
              '" data-aim="' +
              i +
              '" aria-pressed="' +
              (s.target === i) +
              '" aria-label="' +
              name +
              ', стойкость ' +
              f.hp +
              ', удар ' +
              incoming(s, i) +
              '">' +
              '<span data-beast="' +
              kind +
              '"></span><b>' +
              name +
              '</b><small>♥ ' +
              f.hp +
              ' · ' +
              (f.dance ? '♫' : '⚔ ' + incoming(s, i)) +
              '</small></button>'
            );
          })
          .join('');
        return (
          '<div class="deck-lane"><label>Тропа ' + (lane + 1) + '</label><div>' + enemies + '</div></div>'
        );
      })
      .join('');
    const hand = s.hand
      .map((id, i) => cardButton(id, 'data-play="' + i + '"', catalog[id].cost > s.energy))
      .join('');
    const rewards = room.rewards.map((id) => cardButton(id, 'data-reward="' + id + '"')).join('');
    const codex = Object.entries(catalog)
      .map(([id, c]) => {
        const count = s.deck.filter((x) => x === id).length;
        return count ? '<li>' + c.name + ' × ' + count + '</li>' : '';
      })
      .join('');
    host.innerHTML =
      '<section class="deck-game ' +
      room.className +
      '"><header class="deck-header"><small>' +
      room.world +
      ' · Портал ' +
      (s.level + 1) +
      ' из 3</small><h2>' +
      room.title +
      '</h2></header>' +
      '<div class="deck-bar"><strong><i style="background-position:' +
      HEROES.indexOf(s.hero) * 25 +
      '% 0"></i>' +
      heroNames[s.hero] +
      '</strong>' +
      '<b>♥ ' +
      s.health +
      '/' +
      MAX_HEARTS +
      '</b><span>Защита ' +
      (s.hidden ? '∞' : s.block) +
      '</span><span>Ход ' +
      s.turn +
      '</span></div>' +
      (s.phase === 'battle' ? '<div class="deck-lanes">' + lanes + '</div>' : '') +
      '<div class="deck-command"><p role="status" class="deck-note"></p>' +
      (s.phase === 'battle'
        ? '<div class="deck-handline"><h3>Ваша рука</h3><b>ϟ Энергия ' +
          s.energy +
          '/3</b><button type="button" data-end>Закончить ход →</button></div>' +
          '<div class="deck-hand">' +
          (hand || '<p>Карты сыграны. Передайте ход стражам.</p>') +
          '</div>' +
          '<details><summary>Колода · ' +
          s.pile.length +
          ' в стопке · ' +
          s.discard.length +
          ' в сбросе</summary><p>За ход можно потратить 3 энергии. В конце хода карты со стола и из руки идут в сброс. Когда стопка пуста, сброс перемешивается. Клавиши 1–9 разыгрывают карты, ← и → меняют цель, F завершает ход.</p><ul>' +
          codex +
          '</ul></details>'
        : s.phase === 'reward'
          ? '<h3>Новая карта в колоду</h3><p>Вы получите 5 сердец. Выбранная карта начнёт следующую комнату в руке.</p><div class="deck-hand">' +
            rewards +
            '</div>'
          : '<button type="button" class="deck-retry" data-retry>Вернуться к началу комнаты</button>') +
      '</div></section>';
    for (const placeholder of host.querySelectorAll('[data-beast]')) {
      placeholder.replaceWith(monsterPortrait(placeholder.dataset.beast, 'deck-beast'));
    }
    host.querySelector('.deck-note').textContent = s.note;
  }
  host.addEventListener(
    'click',
    (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.aim !== undefined) go({ type: 'aim', index: +b.dataset.aim });
      else if (b.dataset.play !== undefined) go({ type: 'play', index: +b.dataset.play });
      else if (b.dataset.reward) go({ type: 'reward', id: b.dataset.reward });
      else if (b.hasAttribute('data-end')) go({ type: 'end' });
      else if (b.hasAttribute('data-retry')) go({ type: 'retry' });
    },
    { signal: events.signal },
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (paused || disposed || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (s.phase === 'battle' && ['ArrowRight', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const live = s.foes.flatMap((f, i) => (f.hp ? [i] : [])),
          at = live.indexOf(s.target),
          dir = e.key === 'ArrowRight' ? 1 : -1;
        go({ type: 'aim', index: live[(at + dir + live.length) % live.length] });
        return;
      }
      if (s.phase === 'battle' && e.code === 'KeyF') {
        e.preventDefault();
        go({ type: 'end' });
        return;
      }
      if (!/^[1-9]$/.test(e.key)) return;
      const n = Number(e.key) - 1;
      if (s.phase === 'battle' && n < s.hand.length) {
        e.preventDefault();
        go({ type: 'play', index: n });
      } else if (s.phase === 'reward' && n < encounters[s.level].rewards.length) {
        e.preventDefault();
        go({ type: 'reward', id: encounters[s.level].rewards[n] });
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
