import { drawLandmark } from './arcade-scenery.js';
import { drawMazeMonster } from './games/block-maze/maze-monsters.js';

const NOTES = [
  { name: 'До', key: 'A', hz: 261.63, color: '#ffab82', shape: '●' },
  { name: 'Ре', key: 'S', hz: 293.66, color: '#8dddc7', shape: '◆' },
  { name: 'Ми', key: 'D', hz: 329.63, color: '#f2cf78', shape: '▲' },
  { name: 'Соль', key: 'F', hz: 392, color: '#c7abff', shape: '■' },
];
export const songs = [
  {
    id: 'temple',
    title: 'Эхо изумруда',
    place: 'Храм изумруда',
    scenery: ['brazier', 'stone_mask'],
    partner: 'Паук',
    monster: 'spider',
    bpm: 94,
    sheet: 'world',
    panel: 0,
    riffs: [
      [
        [0, 0],
        [1, 1],
        [0, 2],
      ],
      [
        [0, 0],
        [2, 1],
        [1, 2],
        [0, 2.5],
      ],
      [
        [3, 0],
        [2, 0.5],
        [1, 1.5],
        [0, 2.5],
        [3, 3],
      ],
    ],
  },
  {
    id: 'arcade',
    title: 'Карусель',
    place: 'Игровой центр',
    scenery: ['carousel', 'claw'],
    partner: 'Скелет',
    monster: 'skeleton',
    bpm: 108,
    sheet: 'world',
    panel: 1,
    riffs: [
      [
        [1, 0],
        [3, 1],
        [1, 2],
      ],
      [
        [0, 0],
        [1, 0.5],
        [2, 1.5],
        [3, 2.5],
      ],
      [
        [3, 0],
        [1, 0.5],
        [2, 1],
        [0, 2],
        [3, 3],
      ],
    ],
  },
  {
    id: 'waterpark',
    title: 'Волна за волной',
    place: 'Аквапарк',
    scenery: ['typhoon', 'water_slide'],
    partner: 'Страж',
    monster: 'guardian',
    bpm: 86,
    sheet: 'world',
    panel: 2,
    riffs: [
      [[0, 0], [2, 1], [3, 2], [2, 3]],
      [[1, 0], [2, 0.5], [3, 1], [2, 2], [1, 3]],
      [[0, 0], [1, 0.5], [2, 1], [3, 2], [2, 3], [0, 3.5]],
    ],
  },
  {
    id: 'store',
    title: 'Эхо пустых полок',
    place: 'Мебельный магазин',
    scenery: ['show_kitchen', 'warehouse'],
    partner: 'Зомби',
    monster: 'zombie',
    bpm: 92,
    sheet: 'world',
    panel: 3,
    riffs: [
      [[1, 0], [1, 0.5], [3, 2]],
      [[2, 0], [2, 0.5], [0, 2], [0, 2.5]],
      [[3, 0], [3, 0.5], [1, 1.5], [1, 2], [0, 3.5]],
    ],
  },
  {
    id: 'nether',
    title: 'Бас магмового куба',
    place: 'Нижний мир',
    scenery: ['basalt_columns', 'lavafall'],
    partner: 'Магмовый куб',
    monster: 'magma_cube',
    bpm: 106,
    sheet: 'realm',
    panel: 0,
    riffs: [
      [[0, 0], [0, 1.5], [3, 2]],
      [[0, 0], [0, 0.5], [2, 1.5], [0, 2.5], [3, 3]],
      [[0, 0], [0, 0.5], [3, 1.5], [0, 2], [2, 3], [0, 3.5]],
    ],
  },
  {
    id: 'castle',
    title: 'Полуночный вальс',
    place: 'Замок на Хеллоуин',
    scenery: ['gatehouse', 'pumpkin_patch'],
    partner: 'Ведьма',
    monster: 'witch',
    bpm: 96,
    sheet: 'realm',
    panel: 1,
    riffs: [
      [[2, 0], [0, 1], [1, 2]],
      [[3, 0], [1, 1], [2, 2], [3, 3]],
      [[2, 0], [0, 1], [1, 2], [3, 3], [1, 4], [2, 5]],
    ],
  },
  {
    id: 'end',
    title: 'Струны Края',
    place: 'Край',
    scenery: ['crystal_spires', 'chorus_grove'],
    partner: 'Эндермен',
    monster: 'enderman',
    bpm: 100,
    sheet: 'realm',
    panel: 2,
    riffs: [
      [
        [3, 0],
        [2, 1],
        [0, 2],
      ],
      [
        [2, 0],
        [1, 1],
        [3, 1.5],
        [2, 2.5],
      ],
      [
        [0, 0],
        [3, 0.5],
        [2, 1.5],
        [0, 2.5],
        [3, 3.5],
      ],
    ],
  },
];
const heroNames = { kirill: 'Кирилл', maxim: 'Максим', mom: 'Мама', dad: 'Папа', pasha: 'Паша' };
const songOf = (id) => songs.find((s) => s.id === id) || songs[0];
export function createRhythm(saved) {
  const base = {
    version: 1,
    song: 'temple',
    round: 0,
    phase: 'choose',
    elapsed: 0,
    progress: 0,
    hits: 0,
    score: 0,
    firstAt: null,
    miss: null,
  };
  if (
    !saved ||
    saved.version !== 1 ||
    !songs.some((s) => s.id === saved.song) ||
    !Number.isInteger(saved.round) ||
    saved.round < 0 ||
    saved.round >= 3 ||
    !['choose', 'listen', 'play', 'miss', 'phrase'].includes(saved.phase) ||
    !Number.isFinite(saved.elapsed) ||
    saved.elapsed < 0 ||
    !Number.isInteger(saved.score) ||
    saved.score < 0
  )
    return base;
  const length = songOf(saved.song).riffs[saved.round].length;
  if (
    !Number.isInteger(saved.progress) ||
    saved.progress < 0 ||
    saved.progress > length ||
    !Number.isInteger(saved.hits) ||
    saved.hits < 0 ||
    saved.hits > saved.progress ||
    (saved.firstAt !== null &&
      (!Number.isFinite(saved.firstAt) || saved.firstAt < 0 || saved.firstAt > saved.elapsed)) ||
    (saved.phase === 'play' && saved.progress === length) ||
    (saved.phase === 'phrase' && saved.progress !== length) ||
    (saved.progress > 0 && saved.firstAt === null) ||
    (saved.miss !== null && (!Number.isInteger(saved.miss) || saved.miss < 0 || saved.miss > 3))
  )
    return base;
  return { ...base, ...Object.fromEntries(Object.keys(base).map((k) => [k, saved[k]])) };
}
export function listen(s) {
  Object.assign(s, { phase: 'listen', elapsed: 0, progress: 0, hits: 0, firstAt: null, miss: null });
}
export function stepRhythm(s, dt) {
  if (!['listen', 'play'].includes(s.phase) || !Number.isFinite(dt) || dt <= 0) return;
  s.elapsed += dt;
  if (s.phase === 'listen') {
    const song = songOf(s.song),
      riff = song.riffs[s.round];
    if (s.elapsed >= ((1 + riff.at(-1)[1] + 1.3) * 60) / song.bpm) {
      s.phase = 'play';
      s.elapsed = 0;
    }
  }
}
export function strike(s, note) {
  if (s.phase !== 'play' || !Number.isInteger(note) || note < 0 || note > 3) return false;
  const song = songOf(s.song),
    riff = song.riffs[s.round],
    expected = riff[s.progress];
  if (note !== expected[0]) {
    s.phase = 'miss';
    s.miss = note;
    return false;
  }
  if (s.firstAt === null) s.firstAt = s.elapsed;
  const offset = ((s.elapsed - s.firstAt) * song.bpm) / 60;
  if (Math.abs(offset - expected[1]) <= 0.39) s.hits++;
  s.progress++;
  if (s.progress === riff.length) {
    s.score += riff.length * 10 + s.hits * 5;
    s.phase = 'phrase';
  }
  return true;
}

// Picked string with a bright transient and a quicker-decaying first overtone.
function makeInstrument() {
  let context,
    enabled = false;
  const voices = new Set();
  function silence() {
    for (const v of voices) {
      try {
        v.stop();
      } catch {}
    }
    voices.clear();
  }
  function enable(value) {
    enabled = value;
    if (!value) {
      silence();
      return;
    }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) {
      enabled = false;
      return;
    }
    try {
      context ??= new Audio();
      context.resume().catch(() => {});
    } catch {
      enabled = false;
    }
  }
  function play(note) {
    if (!enabled || context?.state !== 'running') return;
    const now = context.currentTime;
    for (const [ratio, amp, tail] of [
      [1, 0.14, 0.38],
      [2, 0.045, 0.17],
      [3, 0.018, 0.1],
    ]) {
      const osc = context.createOscillator(),
        env = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = NOTES[note].hz * ratio;
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(amp, now + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, now + tail);
      osc.connect(env).connect(context.destination);
      voices.add(osc);
      osc.onended = () => {
        voices.delete(osc);
        osc.disconnect();
        env.disconnect();
      };
      osc.start(now);
      osc.stop(now + tail + 0.01);
    }
  }
  return {
    play,
    enable,
    silence,
    get enabled() {
      return enabled;
    },
    destroy() {
      silence();
      context?.close().catch(() => {});
    },
  };
}
export function mount(host, { saved, players = [], save, finish }) {
  const state = createRhythm(saved),
    instrument = makeInstrument();
  let paused = false,
    frame = 0,
    previous = null,
    lastNote = -1,
    flashUntil = 0,
    lit = -1,
    lastSave = 0,
    disposed = false;
  const commit = () => save({ ...state });
  const events = new AbortController();
  host.innerHTML = `<div class="rhythm-stage"><div class="rh-head"><div><h2 class="rh-song"></h2><p class="rh-world"></p></div><button type="button" class="rh-sound" aria-pressed="false">Включить звук</button></div>
  <div class="rh-backdrop"><div class="rh-lamps" aria-hidden="true"><i></i><i></i><i></i></div><canvas class="rh-band" width="560" height="168" aria-label="Паша с гитарой и его партнёр по дуэту"></canvas>
  <div class="rh-score"></div></div>
  <div class="rh-panel"><label class="rh-song-select">Мелодия <select></select></label>
  <p class="rh-cue" role="status"></p><div class="rh-sequence" aria-label="Ноты фразы"></div><div class="rh-beat" aria-hidden="true"><span></span></div>
  <div class="rh-pads"></div><div class="rh-actions"><button type="button" class="rh-action"></button><button type="button" class="rh-repeat">Послушать снова</button></div></div></div>`;
  const get = (sel) => host.querySelector(sel);
  const root = get('.rhythm-stage'),
    select = get('select'),
    pads = get('.rh-pads'),
    sequence = get('.rh-sequence'),
    primary = get('.rh-action'),
    repeat = get('.rh-repeat'),
    cue = get('.rh-cue'),
    sound = get('.rh-sound');
  for (const song of songs) {
    const opt = new Option(song.title + ' · ' + song.place, song.id);
    select.add(opt);
  }
  const noteButtons = NOTES.map((n, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.setProperty('--note', n.color);
    btn.innerHTML = '<i aria-hidden="true">' + n.shape + '</i><b>' + n.name + '</b><kbd>' + n.key + '</kbd>';
    btn.setAttribute('aria-label', n.name + ', клавиша ' + n.key);
    btn.addEventListener('click', () => press(i), { signal: events.signal });
    pads.append(btn);
    return btn;
  });
  const beatBar = get('.rh-beat span');
  const band = get('.rh-band').getContext('2d');
  const figures = new Image();
  figures.src = new URL('./assets/maze-figures.webp', import.meta.url);
  let guitarist;
  // The guitar renderer builds Path2D outlines. Load it only on the browser stage.
  import('./games/block-maze/maze-music.js').then(({ drawGuitarist }) => {
    if (disposed) return;
    guitarist = drawGuitarist;
    drawStage();
  }).catch(() => {
    // A delayed or missing optional animation still leaves the playable rhythm chart and portrait.
    if (!disposed) drawStage();
  });
  const quietMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function drawStage() {
    const song = songOf(state.song);
    const age = quietMotion ? 0.45 : (state.elapsed * song.bpm) / 120;
    band.clearRect(0, 0, 560, 168);
    drawLandmark(band, song.scenery[0], 8, 76, 112);
    drawLandmark(band, song.scenery[1], 447, 76, 109);
    band.save();
    band.translate(208, 113);
    band.scale(4.6, 4.6);
    if (guitarist) guitarist(band, 0, 0, state.phase === 'choose' ? 0.48 : age % 4, false, false, figures);
    else if (figures.naturalWidth) {
      const cell = figures.naturalWidth / 5, height = figures.naturalHeight / 2;
      band.drawImage(figures, 4 * cell, 0, cell, height, -8, -24, 16, 26);
    }
    band.restore();
    band.save();
    band.translate(352, 100);
    band.scale(4.4, 4.4);
    const partner = { type: song.monster, dance: state.phase === 'play' ? 1 : 0, dir: 'left' };
    drawMazeMonster(band, partner, 0, 0, age, false, age);
    band.restore();
  }
  function pulse(note) {
    lit = note;
    flashUntil = state.elapsed + 0.18;
    instrument.play(note);
    noteButtons.forEach((b, i) => b.classList.toggle('rh-lit', i === note));
    root.style.setProperty('--pulse', NOTES[note].color);
    root.classList.add('rh-strum');
  }
  function clearPulse() {
    lit = -1;
    root.classList.remove('rh-strum');
    noteButtons.forEach((b) => b.classList.remove('rh-lit'));
  }
  function draw() {
    const song = songOf(state.song),
      riff = song.riffs[state.round],
      phase = state.phase,
      person = heroNames[players[state.round % Math.max(1, players.length)]] || 'Паша';
    select.value = song.id;
    get('.rh-song-select').hidden = phase !== 'choose';
    const panes = song.sheet === 'world' ? 4 : 3;
    root.style.setProperty('--panorama', 'url("./assets/' + song.sheet + '-panoramas.webp")');
    root.style.setProperty('--sheet-height', panes * 100 + '%');
    root.style.setProperty('--panel-row', (song.panel / (panes - 1)) * 100 + '%');
    drawStage();
    get('.rh-song').textContent = song.title;
    get('.rh-world').textContent = song.place;
    get('.rh-score').textContent = 'Фраза ' + (state.round + 1) + ' / 3 · ' + state.score + ' очк.';
    const texts = {
      choose: 'Послушай фразу монстра и повтори её четырьмя нотами. Можно играть без звука.',
      listen: song.partner + ' задаёт ритм. Следи за огоньками.',
      play: state.progress ? person + ', продолжай в ритме.' : person + ', твой ход. Начни с первой ноты.',
      miss:
        'Попробуй ещё раз. Нужна нота «' +
        NOTES[riff[Math.min(state.progress, riff.length - 1)][0]].name +
        '».',
      phrase: 'Фраза сыграна! В ритме ' + state.hits + ' из ' + riff.length + '.',
    };
    cue.textContent = texts[phase];
    root.dataset.phase = phase;
    sequence.replaceChildren();
    riff.forEach(([n, beat], i) => {
      const marker = document.createElement('span');
      marker.style.setProperty('--note', NOTES[n].color);
      marker.style.setProperty('--at', (beat / (riff.at(-1)[1] + 0.7)) * 100 + '%');
      marker.textContent = NOTES[n].shape;
      marker.setAttribute('aria-label', NOTES[n].name);
      marker.classList.toggle('rh-done', i < state.progress);
      if (phase === 'play' && i === state.progress) marker.classList.add('rh-next');
      sequence.append(marker);
    });
    primary.hidden = ['listen', 'play'].includes(phase);
    primary.textContent =
      phase === 'choose'
        ? 'Начать репетицию'
        : phase === 'miss'
          ? 'Повторить фразу'
          : state.round === 2
            ? 'Завершить концерт'
            : 'Следующая фраза';
    repeat.hidden = phase !== 'play';
    noteButtons.forEach((btn) => (btn.disabled = phase !== 'play'));
    beatBar.style.transform = 'scaleX(0)';
  }
  function press(i) {
    if (paused || disposed || state.phase !== 'play') return;
    pulse(i);
    strike(state, i);
    draw();
    if (state.phase !== 'play') {
      clearPulse();
    }
    commit();
  }
  function beginListen() {
    listen(state);
    lastNote = -1;
    lastSave = 0;
    clearPulse();
    previous = null;
    draw();
    commit();
  }
  primary.addEventListener(
    'click',
    () => {
      if (paused) return;
      if (state.phase === 'phrase') {
        if (state.round === 2) {
          finish({
            score: state.score,
            summary: songOf(state.song).title + ' · три фразы с Пашей, ' + state.score + ' очк.',
          });
          return;
        }
        state.round++;
      }
      beginListen();
    },
    { signal: events.signal },
  );
  repeat.addEventListener(
    'click',
    () => {
      if (!paused && state.phase === 'play') beginListen();
    },
    { signal: events.signal },
  );
  select.addEventListener(
    'change',
    () => {
      state.song = select.value;
      draw();
      commit();
    },
    { signal: events.signal },
  );
  sound.addEventListener(
    'click',
    () => {
      if (paused) return;
      instrument.enable(!instrument.enabled);
      sound.setAttribute('aria-pressed', String(instrument.enabled));
      sound.textContent = instrument.enabled ? 'Выключить звук' : 'Включить звук';
      if (instrument.enabled) instrument.play(0);
    },
    { signal: events.signal },
  );
  function key(e) {
    if (
      disposed ||
      paused ||
      state.phase !== 'play' ||
      e.repeat ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.target.tagName === 'SELECT'
    )
      return;
    const idx = ['KeyA', 'KeyS', 'KeyD', 'KeyF'].indexOf(e.code),
      digit = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
    if (idx < 0 && digit < 0) return;
    e.preventDefault();
    press(idx < 0 ? digit : idx);
  }
  document.addEventListener('keydown', key, { signal: events.signal });
  function loop(now) {
    if (disposed || paused) return;
    const dt = previous === null ? 0 : Math.max(0, (now - previous) / 1000);
    previous = now;
    const was = state.phase;
    // Cues light up and sound on rendered frames. Keep each note visible after a stall;
    // the player's response still uses the full time between frames for scoring.
    stepRhythm(state, was === 'listen' ? Math.min(dt, 0.12) : dt);
    if (was !== state.phase) {
      clearPulse();
      draw();
      commit();
    }
    const song = songOf(state.song),
      riff = song.riffs[state.round];
    if (state.phase === 'listen') {
      const at = (state.elapsed * song.bpm) / 60 - 1;
      const i = riff.findLastIndex(([, beat]) => beat <= at);
      if (i > lastNote) {
        lastNote = i;
        if (((at - riff[i][1]) * 60) / song.bpm < 0.18) pulse(riff[i][0]);
        Array.from(sequence.children).forEach((node, j) => node.classList.toggle('rh-now', j === i));
      }
      beatBar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, (at + 1) / (riff.at(-1)[1] + 2.3))) + ')';
    } else if (state.phase === 'play' && state.firstAt !== null) {
      const beat = ((state.elapsed - state.firstAt) * song.bpm) / 60;
      beatBar.style.transform = 'scaleX(' + Math.min(1, beat / (riff.at(-1)[1] + 0.7)) + ')';
    }
    drawStage();
    if (lit >= 0 && state.elapsed >= flashUntil) clearPulse();
    if (['listen', 'play'].includes(state.phase) && now - lastSave >= 900) {
      lastSave = now;
      commit();
    }
    frame = requestAnimationFrame(loop);
  }
  draw();
  frame = requestAnimationFrame(loop);
  return {
    pause() {
      paused = true;
      cancelAnimationFrame(frame);
      previous = null;
      instrument.silence();
      commit();
    },
    resume() {
      if (!paused || disposed) return;
      paused = false;
      previous = null;
      frame = requestAnimationFrame(loop);
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      events.abort();
      instrument.destroy();
    },
  };
}
