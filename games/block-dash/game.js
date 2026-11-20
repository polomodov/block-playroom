import { enterCollectionGame } from '../collection-navigation.js';
import { watchClassicCover } from '../classic-arcade-art.js';
import { projection as view, drawTrack as road, themes } from './scene-art.js?v=jump-1';
import { HEROES, WORLDS } from './worlds.js';
import { saveGame, clearSavedGame, addResult, bindProgress } from './progress.js';
import { createRun, restoreRun } from './engine.js?v=jump-1';
import { drawRun } from './renderer.js?v=jump-1';
import { playSound, playSolo, setSoundEnabled, stopSolo } from './audio.js';

const byId = id => document.getElementById(id);
const lobby = byId('lobby');
const arena = byId('arena');
const board = byId('board');
const help = byId('help-dialog');
const dialog = byId('run-dialog');
const ability = byId('ability');
const query = new URLSearchParams(location.search);
const worldIds = WORLDS.map(world => world.id);
let world = WORLDS.find(world => world.id === query.get('level')) || WORLDS[0];
let hero = HEROES.find(hero => hero.id === query.get('hero')) || HEROES[0];
let run, frame, lastTime, gesture;
let nextSave = 0;
let sound = false, resumeAfterHelp = false;
const bests = new Map();

function readBest(id) {
  try {
    const stored = Number(localStorage.getItem('block-dash-best-' + id));
    if (Number.isSafeInteger(stored) && stored >= 0) return stored;
  } catch {}
  return 0;
}

function saveBest() {
  if (!run) return;
  const id = run.state.worldId;
  const value = Math.max(readBest(id), bests.get(id) || 0, Math.floor(run.state.distance));
  bests.set(id,value);
  try { localStorage.setItem('block-dash-best-' + id, String(value)); } catch {}
}

function setText(node, value) {
  const next = String(value);
  if (node.textContent !== next) node.textContent = next;
}

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function selectCard(item, isWorld) {
  if (isWorld) world = item;
  else hero = item;
  const url = new URL(location.href);
  url.searchParams.set('level', world.id);
  url.searchParams.set('hero', hero.id);
  history.replaceState(null,'',url);
  showChoice();
}

function makeCard(item, isWorld) {
  const card = el('label','choice');
  const input = el('input');
  input.type = 'radio';
  input.name = isWorld ? 'level' : 'hero';
  input.value = item.id;
  input.checked = item === (isWorld ? world : hero);
  input.addEventListener('change', () => selectCard(item,isWorld));
  const picture = el('span', 'card-image ' + (isWorld ? 'world-image' : 'hero-image'));
  picture.setAttribute('aria-hidden','true');
  const caption = el('span','caption');
  if (isWorld) {
    const index = worldIds.indexOf(item.id);
    const firstSheet = index < 4;
    const count = firstSheet ? 4 : 3;
    picture.style.backgroundImage = 'url(./assets/' + (firstSheet ? 'world' : 'realm') + '-panoramas.webp)';
    picture.style.setProperty('--sheet-h', count * 100 + '%');
    picture.style.setProperty('--row', (firstSheet ? index : index - 4) / (count-1) * 100 + '%');
    setText(caption,item.name);
  } else {
    card.dataset.hero = item.id;
    picture.append(el('span','portrait-art'));
    caption.append(el('b',null,item.name),el('small',null,item.power));
  }
  card.title = item.description;
  card.append(input,picture,caption);
  return card;
}

function showChoice() {
  setText(byId('mobile-world'),world.name);
  setText(byId('mobile-hero'),hero.name + ' · ' + hero.power);
  setText(byId('help-power'),hero.power + '. ' + hero.description);
}

for (const item of WORLDS) byId('levels').append(makeCard(item,true));
for (const item of HEROES) byId('heroes').append(makeCard(item,false));
showChoice();

function revealChecked() {
  for (const list of [byId('levels'),byId('heroes')]) {
    const card = list.querySelector('input:checked').closest('label');
    list.scrollLeft += card.getBoundingClientRect().left - list.getBoundingClientRect().left -
      (list.clientWidth-card.clientWidth)/2;
  }
}
requestAnimationFrame(revealChecked);

function updateHud() {
  const s = run.state;
  setText(byId('distance'), Math.floor(s.distance));
  setText(byId('gems'),s.gems);
  setText(byId('lives'),s.lives);
  byId('hearts').setAttribute('aria-label','Жизни: ' + s.lives);
  setText(byId('ability-name'),hero.power);
  const cooldown = Math.ceil(s.cooldown);
  ability.disabled = s.status !== 'playing' || cooldown > 0;
  setText(byId('cooldown'),cooldown ? cooldown + ' с' : '');
  ability.title = cooldown ? 'Способность восстановится через ' + cooldown + ' с' : hero.description;
}

function syncMode() {
  document.body.dataset.mode = run?.state.status || 'lobby';
}

function stopLoop() {
  cancelAnimationFrame(frame);
  frame = undefined;
  lastTime = undefined;
  gesture = undefined;
}

function animate(now) {
  if (run?.state.status !== 'playing') return;
  const s = run.state;
  const lives = s.lives, gems = s.gems;
  if (lastTime !== undefined) run.update(Math.min(Math.max(0,(now-lastTime)/1000),.10));
  lastTime = now;
  drawRun(board,s);
  updateHud();
  if (s.status === 'over') {
    stopSolo();
    playSound('over');
    addResult({hero:hero.id, level:world.id, distance:s.distance, gems:s.gems, lives:s.lives, outcome:'over'});
    showResult();
    return;
  }
  if (s.time >= nextSave) { saveGame(run.snapshot()); nextSave=s.time+1; }
  if (s.lives < lives) playSound('hit');
  else if (s.gems > gems) playSound('gem');
  frame = requestAnimationFrame(animate);
}

function start(restored = null) {
  if (!restored?.state) restored = null;
  stopLoop();
  stopSolo();
  if (dialog.open) dialog.close();
  run = restored || createRun({worldId:world.id, heroId:hero.id});
  nextSave=run.state.time + 1;
  saveGame(run.snapshot());
  bests.set(world.id, Math.max(bests.get(world.id) || 0,readBest(world.id)));
  syncMode();
  lobby.hidden = true;
  arena.hidden = false;
  setText(byId('arena-title'), world.name);
  document.title = world.name + ' · Блок Экспресс';
  window.scrollTo(0,0);
  board.focus({preventScroll:true});
  drawRun(board,run.state);
  updateHud();
  if (restored) showResult(); else frame = requestAnimationFrame(animate);
}

function showResult() {
  stopLoop();
  saveBest();
  syncMode();
  updateHud();
  const paused = run.state.status === 'paused';
  setText(byId('dialog-route'),world.name + ' · ' + hero.name);
  setText(byId('run-title'),paused ? 'Пауза' : 'Забег окончен');
  setText(byId('result-distance'),Math.floor(run.state.distance) + ' м');
  setText(byId('result-gems'),run.state.gems);
  setText(byId('result-best'),bests.get(world.id) + ' м');
  setText(byId('resume'), paused ? 'Продолжить' : 'Ещё забег');
  byId('restart').hidden = !paused;
  if (!dialog.open) dialog.showModal();
  byId('resume').focus({preventScroll:true});
}

function pause() {
  if (!run?.act('pause')) return;
  stopSolo();
  saveGame(run.snapshot());
  showResult();
}

function continueRun() {
  if (!run?.act('resume')) return;
  if (dialog.open) dialog.close();
  syncMode();
  if (hero.id === 'pasha' && run.state.powerTime > 0) playSolo(5-run.state.powerTime);
  board.focus({preventScroll:true});
  lastTime = undefined;
  frame = requestAnimationFrame(animate);
}

function returnToLobby() {
  stopLoop();
  stopSolo();
  saveBest();
  if (run && run.state.status !== 'over') saveGame(run.snapshot());
  if (dialog.open) dialog.close();
  run = undefined;
  syncMode();
  arena.hidden = true;
  lobby.hidden = false;
  document.title = 'Блок Экспресс';
  window.scrollTo(0,0);
  revealChecked();
  byId('play').focus({preventScroll:true});
}

function action(name) {
  if (!run?.act(name)) return;
  if (name === 'jump') playSound('jump');
  if (name === 'power') {
    if (hero.id === 'pasha') playSolo();
    else playSound('ability');
    updateHud();
  }
}

byId('play').addEventListener('click',start);
byId('pause').addEventListener('click',pause);
byId('resume').addEventListener('click',() => run.state.status === 'paused' ? continueRun() : start());
byId('menu').addEventListener('click',returnToLobby);
byId('restart').addEventListener('click',start);
dialog.addEventListener('cancel', e => {
  e.preventDefault();
  if (run?.state.status === 'paused') continueRun();
  else returnToLobby();
});
byId('sound').addEventListener('click', async () => {
  sound = !sound;
  const label = sound ? 'Выключить звук' : 'Включить звук';
  byId('sound').setAttribute('aria-pressed',String(sound));
  byId('sound').setAttribute('aria-label',label);
  byId('sound').title = label;
  await setSoundEnabled(sound);
  if (sound && run?.state.status === 'playing' && hero.id === 'pasha' && run.state.powerTime > 0) playSolo(5-run.state.powerTime);
});
byId('help').addEventListener('click',() => {
  resumeAfterHelp = run?.state.status === 'playing';
  if (resumeAfterHelp) {
    run.act('pause');stopSolo();stopLoop();saveBest();saveGame(run.snapshot());syncMode();updateHud();
  }
  help.showModal();
});
help.addEventListener('close',() => {
  if (resumeAfterHelp && !document.hidden) continueRun();
  else if (run?.state.status === 'paused') showResult();
  resumeAfterHelp = false;
});
for (const btn of document.querySelectorAll('[data-action]')) {
  btn.addEventListener('pointerdown', e => {
    if (btn.disabled || !e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    action(btn.dataset.action);
  });
  // Keyboard and assistive activation do not send a pointer event.
  btn.addEventListener('click', e => {
    if (e.detail === 0) action(btn.dataset.action);
  });
}

const actionsByKey = {
  ArrowLeft:'left', KeyA:'left', ArrowRight:'right',KeyD:'right',
  ArrowUp:'jump', KeyW:'jump', Space:'jump',ArrowDown:'slide',KeyS:'slide', KeyE:'power',KeyX:'power',
};
document.addEventListener('keydown',e => {
  if (e.altKey || e.ctrlKey || e.metaKey || help.open || !run) return;
  if (e.code === 'KeyP' && !e.repeat && run.state.status === 'paused') {
    e.preventDefault();continueRun();return;
  }
  if (run.state.status !== 'playing') return;
  if (e.code === 'Escape' || e.code === 'KeyP') {
    e.preventDefault();if (!e.repeat) pause();
  } else if (actionsByKey[e.code]) {
    e.preventDefault();if (!e.repeat) action(actionsByKey[e.code]);
  }
});

board.addEventListener('pointerdown', e => {
  if (!e.isPrimary || e.button !== 0 || run?.state.status !== 'playing') return;
  gesture = {id:e.pointerId, x:e.clientX, y:e.clientY};
  if (e.pointerType === 'mouse') board.setPointerCapture(e.pointerId);
});
function swipe(e) {
  if (!gesture || gesture.id !== e.pointerId) return;
  const dx = e.clientX-gesture.x, dy = e.clientY-gesture.y;
  if (Math.max(Math.abs(dx),Math.abs(dy)) < 24) return;
  gesture = undefined;
  action(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'jump' : 'slide'));
}
board.addEventListener('pointermove',swipe);
board.addEventListener('pointerup',e => { swipe(e);if (gesture?.id === e.pointerId) gesture = undefined; });
for (const event of ['pointercancel','lostpointercapture']) {
  board.addEventListener(event,e => { if (gesture?.id === e.pointerId) gesture = undefined; });
}
document.addEventListener('visibilitychange',() => {
  if (!document.hidden) return;
  if (help.open) resumeAfterHelp = false;
  pause();
});
window.addEventListener('pagehide',() => { pause();saveBest(); });
const boardObserver = new ResizeObserver(() => {
  if (run && run.state.status !== 'playing' && !arena.hidden) drawRun(board,run.state);
});
boardObserver.observe(board);

bindProgress({onResume(saved) {
  const restored = restoreRun(saved);
  if (!restored) { clearSavedGame(); return false; }
  world = WORLDS.find(w=>w.id===saved.level);
  hero = HEROES.find(h=>h.id===saved.hero);
  byId('levels').querySelector('input[value="'+world.id+'"]').checked=true;
  byId('heroes').querySelector('input[value="'+hero.id+'"]').checked=true;
  selectCard(world,true);
  start(restored);
  return true;
}});

watchClassicCover({ view, road, themes });

enterCollectionGame();
