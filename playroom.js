import { mount as cooperative } from './coop.js';
import { mount as golf } from './golf.js';
import { mount as mystery } from './mystery.js';
import { mount as rhythm } from './rhythm.js';
import { titles, heroNames, slot, saveSlot, finishSlot, bindProgress } from './progress.js';

const games = {
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
      f = document.createElement('span');
    b.type = 'button';
    b.className = 'hero-pick';
    b.dataset.hero = id;
    f.className = 'face face-' + id;
    b.setAttribute('aria-pressed', team.includes(id));
    b.append(f, document.createTextNode(name));
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
function choose(id) {
  mode = id;
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
  saveSlot(round, saved?.payload ?? null);
  controller = games[id].mount(host, {
    players: round.players,
    saved: saved?.payload ?? null,
    save(payload) {
      if (session === round) saveSlot(round, payload);
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
  controller?.pause();
  sheet('paused', 'Пауза', 'Можно вернуться к игре с этого места.', 'Продолжить');
}
function back() {
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
const refresh = bindProgress(openGame, drawSetup);
