import { enterCollectionGame } from '../collection-navigation.js';
import { beginArcadeRound } from './progress.js';
import { playGuitar, stopGuitar, performanceAge } from './guitar.js?v=encore-1';
import { createGame, restoreGame } from './engine.js?v=offline-1';
import { bindProgress, saveGame, clearSavedGame, addResult } from './progress.js';
import { LEVELS } from './levels.js?v=end-family-1';
import { drawBoard, drawLandscape, drawMonsterPortrait, drawPortrait } from './art.js?v=dragon-flight-1';

const byId = (id) => document.getElementById(id);
const lobby = byId('lobby');
const arena = byId('arena');
const board = byId('board');
const startButton = byId('play');
const pauseButton = byId('pause');
const abilityButton = byId('ability');
const abilityHint = byId('ability-hint');
const message = byId('message');
const resumeButton = byId('resume');
const soundButton = byId('sound');
const help = byId('help-dialog');
const lives = byId('lives');
const gems = byId('gems');
const gemProgress = byId('gem-progress');

const heroes = {
  kirill: { name: 'Кирилл', action: 'Ускориться' },
  maxim: { name: 'Максим', action: 'Ударить' },
  mom: { name: 'Мама', action: 'Исчезнуть' },
  dad: { name: 'Папа', action: 'Сказать «Бу!»' },
  pasha: { name: 'Паша', action: 'Сыграть на гитаре' },
};
const monsters = {
  zombie: { name: 'Зомби', hint: 'Упорно идёт за тобой по лабиринту.' },
  creeper: { name: 'Крипер', hint: 'Раздувается перед взрывом. Пока горит запал, отбеги хотя бы на две клетки.' },
  spider: { name: 'Паук', hint: 'Целится на клетку впереди тебя. Попробуй резко свернуть.' },
  slime: { name: 'Слизень', hint: 'Прыгает рывками. Обходи его, пока он отдыхает между прыжками.' },
  skeleton: { name: 'Скелет', hint: 'Натягивает тетиву и пускает стрелу по прямой. Сверни за угол до выстрела.' },
  guardian: { name: 'Страж', hint: 'Охраняет свой участок. Выберись за его границу, и страж вернётся на пост.' },
  drowned: { name: 'Утопленник', hint: 'Набирает скорость на прямых дорожках. Пользуйся поворотами.' },
  elder_guardian: { name: 'Древний страж', hint: 'Готовит волну, которая замедляет героя рядом. Отбеги, пока волна заряжается.' },
  witch: { name: 'Ведьма', hint: 'Оставляет лужи зелья. Обходи их, чтобы сохранить скорость.' },
  enderman: { name: 'Эндермен', hint: 'Открывает фиолетовый портал в другом проходе. Там он появится через мгновение.' },
  ghast: { name: 'Гаст', hint: 'Набирает огненный шар у рта и пускает его через лаву. Сверни за угол, пока шар растёт.' },
  magma_cube: { name: 'Магмовый куб', hint: 'Сжимается перед прыжком через лаву. Уходи с отмеченной клетки на другом берегу.' },
  blaze: { name: 'Ифрит', hint: 'Пускает две искры подряд по одной дорожке. Спрячься за углом и пропусти обе.' },
  wither_skeleton: { name: 'Скелет-иссушитель', hint: 'Бьёт мечом по двум клеткам перед собой. Удар замедляет тебя. Шагни в сторону, пока меч поднят.' },
  ghost: { name: 'Призрак', hint: 'Замирает, когда ты смотришь прямо на него в коридоре. Отвернёшься — и он снова двинется.' },
  pumpkin_guard: { name: 'Тыквенный страж', hint: 'Поднимает фонарь и освещает три клетки перед собой. Сверни за угол, чтобы свет тебя не замедлил.' },
  shulker: { name: 'Шалкер', hint: 'Сидит в раковине и пускает медленный шар. Шар может один раз повернуть за тобой и замедлит тебя при попадании.' },
  ender_dragon: { name: 'Дракон Края', hint: 'Складывает крылья и пикирует к розовым меткам. Сверни в соседний коридор и возвращайся за изумрудами, когда дыхание рассеется.' },
};
const descriptions = {
  temple: 'Собери изумруды и ускользни от монстров.',
  arcade: 'Ищи изумруды между каруселью и горкой.',
  waterpark: 'Поверни вверх по стрелке у «Тайфуна» и съезжай на другую дорожку.',
  store: 'Ищи изумруды между комнатами с мебелью и стеллажами с коробками.',
  nether: 'Переходи лаву по мостам и уворачивайся от огненных шаров.',
  castle: 'Собери изумруды в замке до того, как тебя настигнет призрак.',
  end: 'Собирай изумруды между налётами дракона Края.',
};
const directions = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

let game;
let frame;
let previousTime;
let lastSaveTime = 0;
let swipe;
let soundEnabled = false;
let audio;
let resumeAfterHelp = false;


function setText(element, value) {
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
}

function buttonText(button, text) {
  setText(button.querySelector('[data-label]') || button, text);
}

function playNote(frequency, duration, type = 'triangle') {
  if (!soundEnabled || audio?.state !== 'running') return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  const now = audio.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

// A descending voice with two resonances for the vowel in «Бу!».
function playBoo() {
  if (!soundEnabled || audio?.state !== 'running') return;
  const voice = audio.createOscillator();
  const gain = audio.createGain();
  const now = audio.currentTime;
  voice.type = 'sawtooth';
  voice.frequency.setValueAtTime(152, now);
  voice.frequency.exponentialRampToValueAtTime(88, now + 0.36);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  for (const frequency of [340, 820]) {
    const formant = audio.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = frequency;
    formant.Q.value = 4;
    voice.connect(formant);
    formant.connect(gain);
  }
  gain.connect(audio.destination);
  voice.start(now);
  voice.stop(now + 0.4);
}

function displaySound() {
  soundButton.setAttribute('aria-label', 'Звук');
  soundButton.title = soundEnabled ? 'Выключить звук' : 'Включить звук';
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  buttonText(soundButton, soundEnabled ? 'Звук вкл.' : 'Звук выкл.');
}

soundButton.addEventListener('click', async () => {
  soundEnabled = !soundEnabled;
  displaySound();
  if (!soundEnabled) {
    stopGuitar();
    return;
  }
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    audio ??= new Audio();
    await audio.resume();
    const age = game?.state.status === 'playing' ? performanceAge(game.state) : null;
    if (age !== null && soundEnabled) playGuitar(audio, audio.destination, age);
    else playNote(660, 0.12);
  } catch {
    soundEnabled = false;
    displaySound();
  }
});

function selectedValue(group) {
  return document.querySelector(`input[name="${group}"]:checked`).value;
}

function monsterTypes(level) {
  const types = new Set(level.monsters.map(({ type }) => type));
  if (level.dragon) types.add(level.dragon);
  return [...types];
}

function showLevelPreview() {
  const levelId = selectedValue('level');
  const level = LEVELS[levelId];
  const [first, ...rest] = level.title.toUpperCase().split(' ');
  lobby.dataset.level = levelId;
  document.body.dataset.level = levelId;
  setText(byId('title-first'), first);
  setText(byId('title-second'), rest.join(' '));
  setText(byId('level-description'), descriptions[levelId]);
  document.title = level.title + ' · Блок Аркада';
  drawLandscape(byId('landscape'), levelId);
  const portraits = monsterTypes(level).map((type) => {
    const item = document.createElement('li');
    const canvas = document.createElement('canvas');
    canvas.dataset.monster = type;
    canvas.setAttribute('aria-hidden', 'true');
    drawMonsterPortrait(canvas, type);
    item.append(canvas, monsters[type].name);
    return item;
  });
  byId('monster-list').replaceChildren(...portraits);
}

function updateHud() {
  const state = game.state;
  setText(lives, state.lives);
  setText(gems, state.collected + ' / ' + state.totalGems);
  if (gemProgress.max !== state.totalGems) gemProgress.max = state.totalGems;
  if (gemProgress.value !== state.collected) gemProgress.value = state.collected;
  const cooldown = Math.ceil(state.cooldown);
  const action = heroes[state.hero].action;
  let abilityLabel = cooldown > 0 ? action + ' · ' + cooldown + ' с' : action;
  if (state.invisible > 0) abilityLabel = 'Невидима · ' + Math.ceil(state.invisible) + ' с';
  if (state.fear > 0) abilityLabel = 'Бу! · ' + Math.ceil(state.fear) + ' с';
  let soloHint = '';
  let dance = 0;
  if (state.hero === 'pasha') {
    for (const monster of state.monsters) dance = Math.max(dance, monster.dance);
    if (state.solo) abilityLabel = 'Гитарное соло!';
    else if (dance > 0) abilityLabel = 'Танец · ' + Math.ceil(dance) + ' с';
    else if (performanceAge(state) !== null) abilityLabel = 'Гитарное соло!';
    else if (cooldown > 0) abilityLabel = 'Гитара · ' + cooldown + ' с';
    if (dance > 0) soloHint = 'Пока над монстрами ноты, беги мимо!';
    else if (state.solo) soloHint = 'Волна нот идёт по коридорам!';
    else if (cooldown === 0) soloHint = 'Сыграй рядом с монстрами. Твою гитару слышно за шесть клеток по коридору.';
  }
  abilityButton.classList.toggle('playing-solo', performanceAge(state) !== null || dance > 0);
  buttonText(abilityButton, abilityLabel);
  abilityButton.disabled = state.status !== 'playing' || cooldown > 0 || state.rideRemaining > 0;
  setText(abilityHint, state.status === 'playing' ? soloHint : '');
}

function updateScreen() {
  const { status, totalGems, levelId } = game.state;
  document.body.dataset.level = levelId;
  setText(byId('arena-title'), LEVELS[levelId].title);
  const paused = status === 'paused';
  const finished = status === 'won' || status === 'lost';
  message.hidden = !paused && !finished;
  pauseButton.disabled = finished;
  buttonText(pauseButton, paused ? 'Продолжить' : 'Пауза');
  updateHud();
  drawBoard(board, game.state);
  if (message.hidden) return;
  const wins = {
    temple: ['Храм пройден!', 'Все изумруды собраны. Впереди карусель и горка!', 'В игровой центр'],
    arcade: ['Центр пройден!', 'Все изумруды собраны. Впереди водоворот «Тайфун»!', 'В аквапарк'],
    waterpark: ['Аквапарк пройден!', 'Изумруды собраны. Дальше ищи их в мебельном магазине.', 'В магазин'],
    store: ['Магазин пройден!', 'Впереди лава и мосты Нижнего мира.', 'В Нижний мир'],
    nether: ['Нижний мир пройден!', 'Следующие изумруды спрятаны в замке на Хеллоуин.', 'В замок'],
    castle: ['Замок пройден!', 'Впереди Край. Над лабиринтом уже кружит дракон!', 'В Край'],
    end: ['Край пройден!', 'Все изумруды последнего уровня у тебя. Победа!', 'Сыграть ещё'],
  };
  const screens = {
    paused: ['Пауза', 'Лабиринт подождёт.', 'Продолжить'],
    won: wins[levelId],
    lost: ['Попытки закончились', 'Собрано изумрудов: ' + game.state.collected + ' из ' + totalGems + '.', 'Попробовать ещё'],
  };
  const [title, copy, action] = screens[status];
  setText(byId('message-title'), title);
  setText(byId('message-copy'), copy);
  buttonText(resumeButton, action);
  if (!help.open) resumeButton.focus({ preventScroll: true });
}

function saveRun() {
  const snapshot = game?.snapshot();
  if (!snapshot) return;
  saveGame(snapshot);
  lastSaveTime = game.state.time;
}

function animate(time) {
  if (game?.state.status !== 'playing') return;
  const { collected, lives: previousLives } = game.state;
  const elapsed = previousTime === undefined ? 0 : (time - previousTime) / 1000;
  previousTime = time;
  game.update(Math.min(0.1, elapsed));

  if (game.state.lives < previousLives) {
    stopGuitar();
    playNote(124, 0.28, 'sawtooth');
  } else if (game.state.collected > collected) playNote(770, 0.065);
  if (game.state.status !== 'playing') {
    stopGuitar();
    if (game.state.status === 'won') playNote(980, 0.3);
    const { hero, levelId, collected, lives, status } = game.state;
    addResult({ hero, level: levelId, gems: collected, lives, outcome: status });
    const next = game.nextSnapshot();
    if (next) saveGame(next);
    updateScreen();
    return;
  }
  if (game.state.time - lastSaveTime >= 1 || game.state.lives < previousLives) saveRun();
  updateHud();
  drawBoard(board, game.state);
  frame = requestAnimationFrame(animate);
}

function run() {
  cancelAnimationFrame(frame);
  previousTime = undefined;
  updateScreen();
  board.focus({ preventScroll: true });
  frame = requestAnimationFrame(animate);
}

function showArena() {
  const { hero, levelId } = game.state;
  swipe = undefined;
  byId('solo-icon').hidden = hero !== 'pasha';
  document.title = LEVELS[levelId].title + ' · Блок Аркада';
  setText(byId('hero-name'), heroes[hero].name);
  drawPortrait(byId('hud-portrait'), hero);
  lobby.hidden = true;
  arena.hidden = false;
  window.scrollTo(0, 0);
}

function start(hero, levelId) {
  beginArcadeRound();
  game = createGame(hero, levelId);
  game.start();
  showArena();
  saveRun();
  playNote(520, 0.13);
  run();
}

function resumeSavedGame(snapshot) {
  const restored = restoreGame(snapshot);
  if (!restored) {
    clearSavedGame();
    return false;
  }
  game = restored;
  const { hero, levelId } = game.state;
  document.querySelector(`input[name="hero"][value="${hero}"]`).checked = true;
  document.querySelector(`input[name="level"][value="${levelId}"]`).checked = true;
  saveSelection(hero, levelId);
  showArena();
  lastSaveTime = game.state.time;
  updateScreen();
  return true;
}

function pause() {
  if (game?.state.status !== 'playing') return;
  cancelAnimationFrame(frame);
  stopGuitar();
  swipe = undefined;
  game.pause();
  saveRun();
  updateScreen();
}

function resume() {
  if (game?.state.status !== 'paused') return;
  game.resume();
  if (soundEnabled && audio) playGuitar(audio, audio.destination, performanceAge(game.state));
  run();
}

function togglePause() {
  if (game?.state.status === 'paused') resume();
  else pause();
}

function activate() {
  if (game?.state.status !== 'playing' || !game.activate()) return;
  saveRun();
  if (game.state.hero === 'dad') playBoo();
  else if (game.state.hero === 'mom') playNote(1046, 0.25, 'sine');
  else if (game.state.hero === 'pasha') {
    if (soundEnabled && audio) playGuitar(audio, audio.destination, 0);
  }
  else playNote(game.state.hero === 'kirill' ? 920 : 175, 0.18, 'square');
  if (game.state.status === 'playing') updateHud();
  else updateScreen();
}

function saveSelection(hero = selectedValue('hero'), levelId = selectedValue('level')) {
  const url = new URL(location.href);
  url.searchParams.set('hero', hero);
  url.searchParams.set('level', levelId);
  history.replaceState(null, '', url);
}

document.querySelectorAll('input[name="level"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    showLevelPreview();
    saveSelection();
  });
});
document.querySelectorAll('input[name="hero"]').forEach((radio) => {
  radio.addEventListener('change', () => saveSelection());
});
startButton.addEventListener('click', () => start(selectedValue('hero'), selectedValue('level')));
pauseButton.addEventListener('click', togglePause);
abilityButton.addEventListener('click', activate);
resumeButton.addEventListener('click', () => {
  if (game.state.status === 'paused') {
    resume();
  } else if (game.state.status === 'won' && game.nextLevel()) {
    swipe = undefined;
    saveSelection(game.state.hero, game.state.levelId);
    document.title = LEVELS[game.state.levelId].title + ' · Блок Аркада';
    playNote(650, 0.2);
    saveRun();
    run();
  } else {
    start(game.state.hero, game.state.levelId);
  }
});
byId('menu').addEventListener('click', () => {
  saveRun();
  cancelAnimationFrame(frame);
  stopGuitar();
  document.querySelector(`input[name="level"][value="${game.state.levelId}"]`).checked = true;
  showLevelPreview();
  game = undefined;
  swipe = undefined;
  arena.hidden = true;
  lobby.hidden = false;
  const selected = document.querySelector('input[name="hero"]:checked');
  selected.focus();
});

byId('help').addEventListener('click', () => {
  resumeAfterHelp = game?.state.status === 'playing';
  const levelId = game?.state.levelId ?? selectedValue('level');
  byId('waterpark-help').hidden = levelId !== 'waterpark';
  byId('nether-help').hidden = levelId !== 'nether';
  byId('end-help').hidden = levelId !== 'end';
  const hints = monsterTypes(LEVELS[levelId]).map((type) => {
    const item = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = monsters[type].name;
    item.append(name, ' — ', monsters[type].hint);
    return item;
  });
  byId('monster-hints').replaceChildren(...hints);
  help.showModal();
  if (resumeAfterHelp) pause();
});
help.addEventListener('close', () => {
  if (resumeAfterHelp && !document.hidden) resume();
  resumeAfterHelp = false;
});
window.addEventListener('pagehide', pause);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resumeAfterHelp = false;
    pause();
  }
});

document.addEventListener('keydown', (event) => {
  if (!game || event.altKey || event.ctrlKey || event.metaKey || help.open) return;
  if (event.code === 'Escape') {
    event.preventDefault();
    if (!event.repeat) togglePause();
    return;
  }
  if (game.state.status !== 'playing') return;
  const dir = directions[event.code];
  if (dir) {
    event.preventDefault();
    game.turn(dir);
  } else if (event.code === 'Space' && !event.target.closest('button, input, a, dialog')) {
    event.preventDefault();
    if (!event.repeat) activate();
  }
});

byId('dpad').querySelectorAll('button[data-dir]').forEach((button) => {
  const turn = () => {
    if (game?.state.status === 'playing') game.turn(button.dataset.dir);
  };
  button.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    turn();
  });
  button.addEventListener('click', (event) => {
    if (event.detail === 0) turn();
  });
});

board.tabIndex = 0;
board.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0 || game?.state.status !== 'playing') return;
  board.focus({ preventScroll: true });
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
  board.setPointerCapture(event.pointerId);
});

function readSwipe(event) {
  if (swipe?.id !== event.pointerId || game?.state.status !== 'playing') return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
  const dir = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up');
  game.turn(dir);
  swipe.x = event.clientX;
  swipe.y = event.clientY;
}

board.addEventListener('pointermove', readSwipe);
board.addEventListener('pointerup', (event) => {
  readSwipe(event);
  if (swipe?.id === event.pointerId) swipe = undefined;
});
board.addEventListener('lostpointercapture', (event) => {
  if (swipe?.id === event.pointerId) swipe = undefined;
});

// Render the pixel artwork at its native resolution; CSS scales it to the screen.
const selection = new URLSearchParams(location.search);
const requestedHero = selection.get('hero');
if (Object.hasOwn(heroes, requestedHero)) {
  document.querySelector(`input[name="hero"][value="${requestedHero}"]`).checked = true;
}
const requestedLevel = selection.get('level');
if (Object.hasOwn(LEVELS, requestedLevel)) {
  document.querySelector(`input[name="level"][value="${requestedLevel}"]`).checked = true;
}
showLevelPreview();
document.querySelectorAll('canvas[data-hero]').forEach((canvas) => drawPortrait(canvas, canvas.dataset.hero));
displaySound();
bindProgress({ onResume: resumeSavedGame });

enterCollectionGame();
