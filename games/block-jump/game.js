import { enterCollectionGame } from '../collection-navigation.js';
import { LEVELS } from './levels.js?v=living-worlds-1';
import { createRun, restoreRun } from './physics.js?v=offline-1';
import { drawRun } from './renderer.js?v=dragon-flight-1';
import { playSound, setSoundEnabled, playSolo } from './audio.js?v=encore-1';
import { performanceAge, stopGuitar } from './guitar.js?v=encore-1';
import { bindProgress, loadSavedGame, saveGame, clearSavedGame, addResult } from './progress.js';

const byId = id => document.getElementById(id);
const lobby = byId('lobby');
const arena = byId('arena');
const board = byId('board');
const helpDialog = byId('help-dialog');
const runDialog = byId('run-dialog');
const soundButton = byId('sound');
const levelPicker = byId('levels');
const abilityButton = byId('ability');

const heroes = {
  kirill: {
    name: 'Кирилл', power: 'Ускорение', action: 'Ускориться', color: '#84d9f4', portrait: '0% 0%',
    tip: 'Кирилл на 4 секунды ускоряет бег и может перепрыгнуть широкую пропасть с разбега.',
  },
  maxim: {
    name: 'Максим', power: 'Удар по монстру', action: 'Ударить', color: '#ffb874', portrait: '100% 0%',
    tip: 'Максим одним ударом оглушает монстров рядом на 4 секунды. Можно пробежать мимо.',
  },
  mom: {
    name: 'Мама', power: 'Невидимость', action: 'Исчезнуть', color: '#d1afff', portrait: '0% 100%',
    tip: 'Мама на 4 секунды становится невидимой и может пройти сквозь монстров.',
  },
  dad: {
    name: 'Папа', power: 'Крик «Бу!»', action: 'Сказать «Бу!»', color: '#ffa491', portrait: '100% 100%',
    tip: 'Папа говорит «Бу!». Монстры 3 секунды бегут от него и дают ему пройти.',
  },
  pasha: {
    name: 'Паша', power: 'Гитарное соло', action: 'Сыграть на гитаре', color: '#86e9db',
    tip: 'Паша играет на гитаре. Ноты разлетаются в обе стороны. Ближайшие монстры танцуют пять секунд — за это время можно пробежать мимо.',
  },
};
const monsterTips = {
  ghast: 'У рта гаста растёт огненный шар. Пока гаст целится, сойди с линии выстрела.',
  magma_cube: 'У берега лавы магмовый куб сжимается и прыгает. Оставь ему место для приземления.',
  creeper: 'Крипер раздувается перед взрывом. Успей отбежать, пока горит запал.',
  skeleton: 'Когда скелет натянет тетиву, приготовься перепрыгнуть стрелу.',
  enderman: 'Фиолетовый портал показывает, куда сейчас переместится эндермен.',
};
const worldArt = {
  temple: [0, 4], arcade: [1, 4], waterpark: [2, 4], store: [3, 4],
  nether: [0, 3], castle: [1, 3], end: [2, 3],
};
const controls = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyE: 'ability', KeyX: 'ability' };
const keys = new Set();
const presses = new Map();
const taps = new Set();
const touchButtons = [...document.querySelectorAll('[data-control]')];
const touchById = new Map(touchButtons.map(button => [button.dataset.control, button]));
const query = new URLSearchParams(location.search);
let level = LEVELS.find(item => item.id === query.get('level')) ?? LEVELS[0];
const requestedHero = query.get('hero');
let heroId = Object.hasOwn(heroes, requestedHero) ? requestedHero : 'kirill';
let run;
let phase = 'lobby';
let frame;
let previousTime;
let sound = false;
let continueAfterHelp = false;
let lastSaveTime = -Infinity;
let runId;
const newRunId = () => globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

function saveRun() {
  if (run?.state.status !== 'playing') return;
  saveGame({...run.snapshot(), id:runId});
  lastSaveTime = run.state.time;
}

function setText(element, text) {
  const value = String(text);
  if (element.textContent !== value) element.textContent = value;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showPortrait(element, id) {
  element.dataset.hero = id;
  element.style.backgroundPosition = heroes[id].portrait || 'center';
}

function choice(group, id, selected) {
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = group;
  radio.value = id;
  radio.checked = selected;
  return radio;
}

function saveSelection() {
  const url = new URL(location.href);
  url.searchParams.set('level', level.id);
  url.searchParams.set('hero', heroId);
  history.replaceState(null, '', url);
}

for (const [id, hero] of Object.entries(heroes)) {
  const card = element('label', 'hero-card');
  card.style.setProperty('--hero-color', hero.color);
  card.title = hero.tip;
  const radio = choice('hero', id, id === heroId);
  radio.addEventListener('change', () => {
    heroId = id;
    saveSelection();
  });
  const picture = element('span', 'hero-picture');
  const portrait = element('span', 'portrait');
  showPortrait(portrait, id);
  picture.append(portrait);
  picture.setAttribute('aria-hidden', 'true');
  const caption = element('span', 'hero-caption');
  const tag = element('small', '');
  tag.append(element('i', 'power power-' + id), hero.power);
  caption.append(element('strong', '', hero.name), tag);
  card.append(radio, picture, caption);
  byId('heroes').append(card);
}

function revealLevel() {
  if (lobby.hidden || levelPicker.scrollWidth <= levelPicker.clientWidth) return;
  const selected = levelPicker.querySelector('input:checked').parentElement;
  const left = selected.getBoundingClientRect().left - levelPicker.getBoundingClientRect().left;
  levelPicker.scrollLeft += left - (levelPicker.clientWidth - selected.offsetWidth) / 2;
}

function chooseLevel(item) {
  level = item;
  levelPicker.querySelector('input[value="' + item.id + '"]').checked = true;
  saveSelection();
  revealLevel();
}

for (const item of LEVELS) {
  const card = element('label', 'level-card');
  const radio = choice('level', item.id, item === level);
  radio.addEventListener('change', () => chooseLevel(item));
  const [row, rows] = worldArt[item.id];
  const panorama = element('span', 'panorama');
  panorama.setAttribute('aria-hidden', 'true');
  const atlas = rows === 4 ? 'world-panoramas' : 'realm-panoramas';
  panorama.style.backgroundImage = 'url("./assets/' + atlas + '.webp")';
  panorama.style.backgroundSize = 'auto ' + rows * 100 + '%';
  panorama.style.backgroundPosition = '73% ' + row / (rows - 1) * 100 + '%';
  card.append(radio, panorama, element('span', 'level-name', item.title));
  levelPicker.append(card);
}
requestAnimationFrame(revealLevel);
window.addEventListener('resize', revealLevel);

function clearInput() {
  keys.clear();
  presses.clear();
  taps.clear();
  for (const button of touchButtons) button.removeAttribute('data-held');
}

function inputs() {
  const active = new Set(taps);
  for (const key of keys) active.add(controls[key]);
  for (const held of presses.values()) active.add(held);
  taps.clear();
  return {
    left: active.has('left'), right: active.has('right'),
    jump: active.has('jump'), ability: active.has('ability'),
  };
}

function updateHud() {
  const s = run.state;
  setText(byId('lives'), s.lives);
  setText(byId('gems'), s.collected + ' / ' + s.level.gems.length);
  const checkpoint = byId('checkpoint');
  const arrived = s.checkpointReached;
  checkpoint.classList.toggle('active', arrived);
  setText(checkpoint.querySelector('span'), arrived ? 'Точка' : 'Старт');
  checkpoint.title = arrived ? 'Контрольная точка пройдена' : 'До контрольной точки';
  const route = s.status === 'won' ? 1 : (s.player.x - s.level.spawn.x) / (s.level.flag.x - s.level.spawn.x);
  byId('route-fill').style.transform = 'scaleX(' + Math.max(0, Math.min(1, route)).toFixed(3) + ')';
  const cooldown = Math.ceil(s.cooldown);
  let label = heroes[heroId].action;
  let seconds = cooldown;
  let playingMusic = false;
  if (heroId === 'pasha') {
    let dance = 0;
    for (const enemy of s.enemies) dance = Math.max(dance, enemy.dance);
    playingMusic = performanceAge(s) !== null || dance > 0;
    if (s.solo) { label = 'Гитарное соло!'; seconds = 0; }
    else if (dance > 0) { label = 'Танец'; seconds = Math.ceil(dance); }
    else if (playingMusic) { label = 'Гитарное соло!'; seconds = 0; }
    else if (cooldown > 0) label = 'Гитара';
  }
  setText(byId('ability-name'), label);
  setText(byId('cooldown'), seconds > 0 ? seconds + ' с' : '');
  abilityButton.classList.toggle('playing-solo', playingMusic);
  const disabled = cooldown > 0 ? 'true' : 'false';
  if (abilityButton.getAttribute('aria-disabled') !== disabled) abilityButton.setAttribute('aria-disabled', disabled);
}

function stopLoop() {
  stopGuitar();
  cancelAnimationFrame(frame);
  previousTime = undefined;
  clearInput();
}

function showResult() {
  stopLoop();
  const won = phase === 'won';
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  let title = 'Пауза', copy = level.title, action = 'Продолжить';
  if (phase === 'lost') {
    title = 'Жизни закончились';
    copy = 'Попробуй ещё раз. Чуть дольше зажми прыжок перед пропастью.';
    action = 'Попробовать ещё';
  } else if (won) {
    title = next ? 'Флаг взят!' : 'Край пройден!';
    copy = 'Изумрудов собрано ' + run.state.collected + ' из ' + level.gems.length + '.';
    action = next ? 'Следующий уровень' : 'Сыграть ещё';
  }
  setText(byId('result-title'), title);
  setText(byId('result-copy'), copy);
  setText(byId('resume'), action);
  byId('restart').hidden = phase === 'lost' || (won && !next);
  if (!runDialog.open) runDialog.showModal();
  byId('resume').focus({ preventScroll: true });
}

function animate(time) {
  if (phase !== 'playing') return;
  if (previousTime !== undefined && time > previousTime) {
    const s = run.state;
    const { lives, collected, checkpointReached, cooldown, solo } = s;
    const vy = s.player.vy;
    run.update(Math.min(.08, (time - previousTime) / 1000), inputs());
    if (!solo && s.solo) playSolo(performanceAge(s));
    if (s.status === 'won') playSound('win');
    else if (s.lives < lives) { stopGuitar(); playSound('hit'); }
    else if (!checkpointReached && s.checkpointReached) playSound('checkpoint');
    else if (s.collected > collected) playSound('gem');
    else if (s.cooldown > cooldown && heroId !== 'pasha') playSound('ability');
    else if (vy >= 0 && s.player.vy < 0) playSound('jump');
  }
  previousTime = time;
  drawRun(board, run.state);
  updateHud();
  if (run.state.status !== 'playing') {
    phase = run.state.status;
    addResult({id:runId, hero:heroId, level:level.id, gems:run.state.collected, lives:run.state.lives, outcome:phase});
    showResult();
  } else {
    if (run.state.time - lastSaveTime >= 1) saveRun();
    frame = requestAnimationFrame(animate);
  }
}

function play() {
  if (runDialog.open) runDialog.close();
  phase = 'playing';
  playSolo(performanceAge(run.state));
  previousTime = undefined;
  board.focus({ preventScroll: true });
  frame = requestAnimationFrame(animate);
}

function showArena() {
  const hero = heroes[heroId];
  document.title = level.title + ' · Блок Прыжок';
  setText(byId('arena-title'), level.title);
  setText(byId('hero-name'), hero.name);
  showPortrait(byId('hud-portrait'), heroId);
  abilityButton.title = hero.tip;
  lobby.hidden = true;
  arena.hidden = false;
  document.body.dataset.screen = 'game';
  window.scrollTo(0, 0);
  updateHud();
}

function start() {
  stopLoop();
  run = createRun(level.id, heroId);
  runId = newRunId();
  showArena();
  saveRun();
  play();
}

function resumeSavedGame(save) {
  const restored = restoreRun(save);
  if (!restored) {
    clearSavedGame();
    return false;
  }
  stopLoop();
  run = restored;
  runId = typeof save.id === 'string' && save.id ? save.id : newRunId();
  heroId = run.state.heroId;
  byId('heroes').querySelector('input[value="' + heroId + '"]').checked = true;
  chooseLevel(run.state.level);
  phase = 'paused';
  lastSaveTime = run.state.time;
  showArena();
  drawRun(board, run.state);
  showResult();
  return true;
}

function pause() {
  if (phase !== 'playing') return;
  phase = 'paused';
  saveRun();
  showResult();
}

function showLobby() {
  saveRun();
  stopLoop();
  phase = 'lobby';
  if (runDialog.open) runDialog.close();
  run = undefined;
  arena.hidden = true;
  lobby.hidden = false;
  document.body.dataset.screen = 'lobby';
  document.title = 'Блок Прыжок';
  revealLevel();
  window.scrollTo(0, 0);
  byId('play').focus({ preventScroll: true });
}

byId('play').addEventListener('click', start);
byId('pause').addEventListener('click', pause);
byId('menu').addEventListener('click', showLobby);
byId('back').addEventListener('click', showLobby);
byId('restart').addEventListener('click', start);
byId('resume').addEventListener('click', () => {
  if (phase === 'paused') { play(); return; }
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  if (phase === 'won' && next) chooseLevel(next);
  start();
});
runDialog.addEventListener('cancel', event => {
  event.preventDefault();
  if (phase === 'paused') play();
});

byId('help').addEventListener('click', () => {
  setText(byId('help-power'), heroes[heroId].tip);
  const tips = [...new Set(level.enemies.map(enemy => enemy.type))]
    .map(type => monsterTips[type]).filter(Boolean);
  if (level.id === 'end') tips.push('Дракон Края складывает крылья и пикирует к розовым меткам. Выбеги за метки до выдоха или перепрыгни облако. Дыхание рассеивается за три секунды.');
  setText(byId('help-monsters'), tips.join(' '));
  byId('help-monsters').hidden = tips.length === 0;
  continueAfterHelp = phase === 'playing';
  if (continueAfterHelp) {
    phase = 'help';
    saveRun();
    stopLoop();
  }
  helpDialog.showModal();
});
helpDialog.addEventListener('close', () => {
  if (phase === 'help') {
    if (continueAfterHelp && !document.hidden) play();
    else { phase = 'paused'; showResult(); }
  }
  continueAfterHelp = false;
});
soundButton.addEventListener('click', async () => {
  sound = !sound;
  const ready = setSoundEnabled(sound);
  soundButton.setAttribute('aria-pressed', String(sound));
  soundButton.title = sound ? 'Выключить звук' : 'Включить звук';
  await ready;
  if (sound) {
    const age = phase === 'playing' ? performanceAge(run.state) : null;
    if (age !== null) playSolo(age);
    else playSound('gem');
  }
});

for (const button of touchButtons) {
  const control = button.dataset.control;
  button.addEventListener('pointerdown', event => {
    if (phase !== 'playing' || event.button !== 0 || (control === 'ability' && run.state.cooldown > 0)) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    presses.set(event.pointerId, control);
    taps.add(control);
    button.dataset.held = '';
  });
  const release = event => {
    const held = presses.get(event.pointerId);
    presses.delete(event.pointerId);
    if (held && ![...presses.values()].includes(held)) touchById.get(held).removeAttribute('data-held');
  };
  for (const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name, release);
  button.addEventListener('click', event => {
    if (phase === 'playing' && event.detail === 0 && !(control === 'ability' && run.state.cooldown > 0)) taps.add(control);
  });
  button.addEventListener('contextmenu', event => event.preventDefault());
}

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || helpDialog.open) return;
  if (event.code === 'KeyP' && phase === 'paused' && !event.repeat) {
    event.preventDefault(); play(); return;
  }
  if (phase !== 'playing') return;
  if (event.code === 'Escape' || event.code === 'KeyP') {
    event.preventDefault();
    if (!event.repeat) pause();
    return;
  }
  const control = controls[event.code];
  if (!control || (event.code === 'Space' && event.target.closest('button, a, input'))) return;
  event.preventDefault();
  if (event.repeat) return;
  keys.add(event.code);
  taps.add(control);
});
document.addEventListener('keyup', event => keys.delete(event.code));
function leaveWindow() {
  continueAfterHelp = false;
  clearInput();
  if (phase === 'playing') pause();
  else saveRun();
}
window.addEventListener('blur', leaveWindow);
window.addEventListener('pagehide', leaveWindow);
document.addEventListener('visibilitychange', () => { if (document.hidden) leaveWindow(); });
const saved = loadSavedGame();
if (saved && !restoreRun(saved)) clearSavedGame();
bindProgress({onResume: resumeSavedGame});

enterCollectionGame();
