import { gameAudio } from './game-audio.js';
import { mount as cooperative } from './coop.js';
import { mount as golf } from './golf.js';
import { mount as mystery } from './mystery.js';
import { mount as rhythm } from './rhythm.js';
import { titles, heroNames, slot, saveSlot, finishSlot, bindProgress } from './progress.js';

import { mount as race } from './race.js';
import { mount as bridge } from './bridge.js';
import { mount as tactics } from './tactics.js';
import { mount as cafe } from './cafe.js';
import { mount as cards } from './cards.js';
import { mount as pinball } from './pinball.js';
import { mount as photo } from './photo.js';
import { mount as robot } from './robot.js';

const games = {
  race: {
    mount: race,
    min: 1,
    max: 1,
    initial: ['kirill'],
    hint: 'Выберите гонщика. Запись последнего круга станет соперником для следующего игрока.',
  },
  bridge: {
    mount: bridge,
    min: 1,
    max: 1,
    initial: ['maxim'],
    hint: 'Выберите строителя. Уложите пролёты и укрепите мост перед испытанием.',
  },
  tactics: {
    mount: tactics,
    min: 2,
    max: 2,
    initial: ['mom', 'pasha'],
    hint: 'Выберите двух героев. Ходите по очереди и следите за намерениями монстров.',
  },
  cafe: {
    mount: cafe,
    min: 1,
    max: 1,
    initial: ['dad'],
    hint: 'Выберите повара на семь смен. Снимайте готовое со станции и отдавайте заказ гостю.',
  },
  cards: {
    mount: cards,
    min: 1,
    max: 1,
    initial: ['maxim'],
    hint: 'Выберите героя. Собирайте карты и сочетайте способности семьи в одном ходу.',
  },
  pinball: {
    mount: pinball,
    min: 1,
    max: 1,
    initial: ['kirill'],
    hint: 'Выберите игрока и стол. Зарядите пружину и удерживайте шар в игре лопатками.',
  },
  photo: {
    mount: photo,
    min: 1,
    max: 1,
    initial: ['mom'],
    hint: 'Выберите фотографа. Ловите особые моменты и собирайте снимки в семейный альбом.',
  },
  robot: {
    mount: robot,
    min: 1,
    max: 1,
    initial: ['pasha'],
    hint: 'Выберите программиста. Давайте роботу команды и проверяйте маршрут на складе.',
  },

  coop: {
    mount: cooperative,
    min: 2,
    max: 2,
    initial: ['kirill', 'maxim'],
    hint: 'Выберите двоих. Передавайте устройство друг другу или переключайте героев сами.',
  },
  golf: {
    mount: golf,
    min: 1,
    max: 4,
    initial: ['kirill'],
    hint: 'Выберите от одного до четырёх героев. Каждый делает свой удар по очереди.',
  },
  mystery: {
    mount: mystery,
    min: 1,
    max: 1,
    initial: ['mom'],
    hint: 'Выберите сыщика. Мама умеет становиться невидимой для патруля.',
  },
  rhythm: {
    mount: rhythm,
    min: 1,
    max: 1,
    initial: ['pasha'],
    hint: 'Паша играет на гитаре. Цвета, фигуры и вспышки подскажут ноты даже без звука.',
  },
};
const q = (id) => document.getElementById(id),
  host = q('mode-host'),
  dialog = q('sheet');
const fromUrl = new URL(location.href).searchParams.get('game');
let mode = Object.hasOwn(games, fromUrl) ? fromUrl : 'coop';
const teams = Object.fromEntries(Object.entries(games).map(([id, g]) => [id, [...g.initial]]));
let session = null,
  controller = null,
  sheetState = null;
function drawSetup() {
  const game = games[mode],
    team = teams[mode],
    saved = slot(mode);
  q('mode-title').textContent = titles[mode];
  q('party-hint').textContent = game.hint;
  for (const b of document.querySelectorAll('[data-mode]'))
    b.setAttribute('aria-pressed', b.dataset.mode === mode);
  const buttons = [];
  for (const [id, name] of Object.entries(heroNames)) {
    if (mode === 'rhythm' && id !== 'pasha') continue;
    const b = document.createElement('button'),
      f = document.createElement('span'),
      nameLabel = document.createElement('span');
    b.type = 'button';
    b.className = 'hero-pick';
    b.dataset.hero = id;
    f.className = 'face face-' + id;
    b.setAttribute('aria-pressed', team.includes(id));
    nameLabel.className = 'hero-label';
    nameLabel.textContent = name;
    b.append(f, nameLabel);
    b.addEventListener('click', () => {
      if (game.max === 1) teams[mode] = [id];
      else if (team.includes(id)) teams[mode] = team.filter((h) => h !== id);
      else teams[mode] = [...(team.length >= game.max ? team.slice(1) : team), id];
      drawSetup();
      q('party')
        .querySelector('[data-hero="' + id + '"]')
        ?.focus({ preventScroll: true });
    });
    buttons.push(b);
  }
  q('party').replaceChildren(...buttons);
  q('start-mode').disabled = team.length < game.min;
  q('start-mode').textContent = saved ? 'Начать заново' : 'Играть';
  q('resume-mode').hidden = !saved;
  if (saved)
    q('resume-mode').textContent = 'Продолжить · ' + saved.players.map((h) => heroNames[h]).join(' и ');
}
const catalog = document.querySelector('.catalog');
const coverCards = [...catalog.querySelectorAll('.cover-card')];
const narrowCatalog = matchMedia('(max-width: 760px)');
function placeSetup() {
  const shown = coverCards.filter((card) => !card.hidden);
  const index = shown.findIndex((card) => card.dataset.mode === mode);
  const setup = q('setup');
  // The selected game may be outside the current filter. Its setup then waits after the list.
  setup.hidden = index < 0;
  if (index < 0) {
    if (shown.length) shown.at(-1).after(setup);
    return;
  }
  const columns = narrowCatalog.matches ? 2 : 4;
  const lastInRow = Math.min(shown.length, (Math.floor(index / columns) + 1) * columns) - 1;
  shown[lastInRow].after(setup);
}
// Fifteen covers are about three screens on a phone. A filter keeps one kind of game together.
const filterKey = 'family-games:/block-playroom/:catalog-filter';
const filterButtons = [...document.querySelectorAll('[data-filter]')];
function applyFilter(filter, remember = true) {
  if (!filterButtons.some((b) => b.dataset.filter === filter)) filter = 'all';
  for (const b of filterButtons) b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
  for (const card of coverCards)
    card.hidden = filter !== 'all' && !card.dataset.tags.split(' ').includes(filter);
  if (remember)
    try {
      localStorage.setItem(filterKey, filter);
    } catch {
      /* The filter is a convenience. Without storage it resets on the next visit. */
    }
  placeSetup();
}
for (const b of filterButtons) b.addEventListener('click', () => applyFilter(b.dataset.filter));
narrowCatalog.addEventListener('change', placeSetup);
function choose(id) {
  mode = id;
  placeSetup();
  const u = new URL(location.href);
  u.searchParams.set('game', id);
  history.replaceState(null, '', u);
  drawSetup();
}
function sheet(kind, title, copy, action) {
  sheetState = kind;
  q('sheet-title').textContent = title;
  q('sheet-copy').textContent = copy;
  q('sheet-action').textContent = action;
  q('sheet-lobby').textContent = kind === 'reset' ? 'Отмена' : 'В игротеку';
  if (!dialog.open) dialog.showModal();
}
function closeSheet() {
  sheetState = null;
  if (dialog.open) dialog.close();
}
function openGame(saved = null) {
  gameAudio.silence();
  closeSheet();
  const id = saved?.mode || mode;
  const round = {
    id: saved?.id || crypto.randomUUID(),
    mode: id,
    players: [...(saved?.players || teams[id])],
  };
  if (saved) teams[id] = [...round.players];
  choose(id);
  session = round;
  q('lobby').hidden = true;
  q('arena').hidden = false;
  q('game-title').textContent = titles[id];
  host.replaceChildren();
  window.scrollTo(0, 0);
  saveSlot(round, saved?.payload ?? null, { onlyIfCurrent: Boolean(saved) });
  controller = games[id].mount(host, {
    audio: gameAudio,
    cue: gameAudio.cue,
    players: round.players,
    saved: saved?.payload ?? null,
    save(payload) {
      if (session === round) saveSlot(round, payload, { onlyIfCurrent: true });
    },
    finish(result) {
      if (session !== round) return;
      session = null;
      finishSlot(round, result);
      controller?.pause();
      sheet('finished', 'Игра пройдена!', result.summary, 'Сыграть ещё');
    },
  });
  if (saved) pause();
}
function pause() {
  if (!session || sheetState) return;
  gameAudio.silence();
  controller?.pause();
  sheet('paused', 'Пауза', 'Можно вернуться к игре с этого места.', 'Продолжить');
}
function back() {
  gameAudio.silence();
  if (controller) {
    if (session) controller.pause();
    controller.destroy();
    controller = null;
  }
  session = null;
  closeSheet();
  host.replaceChildren();
  q('arena').hidden = true;
  q('lobby').hidden = false;
  refresh();
  window.scrollTo(0, 0);
  document.querySelector('[data-mode="' + mode + '"]').focus({ preventScroll: true });
}
for (const b of document.querySelectorAll('[data-mode]'))
  b.addEventListener('click', () => {
    choose(b.dataset.mode);
    q('setup').scrollIntoView({
      block: 'nearest',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  });
q('start-mode').addEventListener('click', () => {
  if (slot(mode))
    sheet(
      'reset',
      'Начать заново?',
      'Новая партия займёт место сохранения этой игры. Результаты завершённых партий останутся в истории.',
      'Начать',
    );
  else openGame();
});
q('resume-mode').addEventListener('click', () => {
  const s = slot(mode);
  if (s) openGame(s);
});
q('go-lobby').addEventListener('click', back);
q('pause-game').addEventListener('click', pause);
q('sheet-action').addEventListener('click', () => {
  if (sheetState === 'finished') {
    back();
    openGame();
    return;
  }
  if (sheetState === 'reset') {
    openGame();
    return;
  }
  closeSheet();
  controller?.resume();
});
q('sheet-lobby').addEventListener('click', () => {
  if (sheetState === 'reset') closeSheet();
  else back();
});
dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  if (sheetState === 'finished') back();
  else {
    const was = sheetState;
    closeSheet();
    if (was === 'paused') controller?.resume();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
window.addEventListener('pagehide', () => {
  if (session) controller?.pause();
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted && session) pause();
});
gameAudio.bindButton(q('lobby-sound'));
gameAudio.bindButton(q('game-sound'));
const refresh = bindProgress(openGame, drawSetup);

let savedFilter = 'all';
try {
  savedFilter = localStorage.getItem(filterKey) || 'all';
} catch {
  /* Show every game when storage is unavailable. */
}
// A link to one game shows that game even if the remembered filter would hide it.
const linked = Object.hasOwn(games, fromUrl) && document.querySelector('[data-mode="' + fromUrl + '"]');
applyFilter(linked && !linked.dataset.tags.split(' ').includes(savedFilter) ? 'all' : savedFilter, false);
if (Object.hasOwn(games, fromUrl)) q('setup').scrollIntoView({ block: 'center' });
