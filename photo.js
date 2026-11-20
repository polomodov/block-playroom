import { drawLandmark, landmarkAtlas } from './arcade-scenery.js';
import { drawMazeMonster } from './games/block-maze/maze-monsters.js';
import { PREPARATION } from './games/block-maze/monster-rules.js';
// The album stores the scene and shutter position so it can redraw a photograph offline.
import { heroNames } from './progress.js';

export const assignments = [
  {
    name: 'Огни Нижнего мира',
    subject: 'Гаст',
    goal: 'Сними гаста, пока он надувает огненный шар.',
    sheet: 'realm',
    row: 0,
    monster: 'ghast',
    action: 'Гаст заряжает огненный шар!',
    idle: 'Гаст парит над лавой',
    color: '#ffae63',
  },
  {
    name: 'Лавовый берег',
    subject: 'Магмовый куб',
    goal: 'Поймай момент, когда куб прижался к земле перед прыжком.',
    sheet: 'realm',
    row: 0,
    monster: 'magma_cube',
    action: 'Куб сжался перед прыжком!',
    idle: 'Куб осматривает берег',
    color: '#ffc25f',
  },
  {
    name: 'Искры Края',
    subject: 'Эндермен',
    goal: 'Сними эндермена в кольце искр перед телепортацией.',
    sheet: 'realm',
    row: 2,
    monster: 'enderman',
    action: 'Появилось кольцо телепортации!',
    idle: 'Эндермен бродит между колоннами',
    color: '#d39dff',
  },
  {
    name: 'Луч в «Тайфуне»', subject: 'Древний страж', monster: 'elder_guardian', sheet: 'world', row: 2,
    goal: 'Наведи рамку на глаз стража в момент зарядки луча.', action: 'Глаз стража светится!',
    idle: 'Страж плывёт между горками', color: '#94ffff', props: ['wave_pool', 'typhoon'], window: [1.5, 3.3],
  },
  {
    name: 'Лучник в торговом зале', subject: 'Скелет', monster: 'skeleton', sheet: 'world', row: 3,
    goal: 'Сними скелета, когда он отводит тетиву.', action: 'Скелет натягивает лук!',
    idle: 'Лучник патрулирует склад', color: '#ffc578', props: ['show_kitchen', 'warehouse'], window: [2.4, 4.1],
  },
  {
    name: 'Шорох у храма', subject: 'Крипер', monster: 'creeper', sheet: 'world', row: 0,
    goal: 'Поймай вспышку крипера перед взрывом.', action: 'Крипер раздувается и мигает!',
    idle: 'Крипер крадётся к воротам', color: '#d1ff85', props: ['brazier', 'stone_mask'], window: [3.1, 4.5],
  },
  {
    name: 'Фонарь привратника', subject: 'Тыквенный страж', monster: 'pumpkin_guard', sheet: 'realm', row: 1,
    goal: 'Поймай момент, когда страж поднимает фонарь у ворот замка.',
    action: 'Привратник зажигает фонарь!', idle: 'Страж обходит тыквы', color: '#ffb35e',
    props: ['pumpkin_patch', 'gatehouse'], window: [1.1, 2.5],
  },
];
const WIDTH = 800,
  HEIGHT = 340,
  FRAME_W = 214,
  FRAME_H = 154,
  TAU = Math.PI * 2;
const albumKey = 'family-games:block-playroom:photo-album:1';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const freshPhoto = () => ({ version: 1, stage: 0, time: 0, x: WIDTH / 2, y: HEIGHT / 2, shots: [] });
function validShot(shot) {
  return (
    shot &&
    Number.isInteger(shot.stage) &&
    assignments[shot.stage] &&
    Number.isFinite(shot.time) &&
    shot.time >= 0 &&
    Number.isFinite(shot.x) &&
    Number.isFinite(shot.y) &&
    shot.x >= 0 &&
    shot.x <= WIDTH &&
    shot.y >= 0 &&
    shot.y <= HEIGHT &&
    Number.isInteger(shot.stars) &&
    shot.stars >= 1 &&
    shot.stars <= 3 &&
    Object.hasOwn(heroNames, shot.hero)
  );
}
export function restorePhoto(saved) {
  if (
    !saved ||
    saved.version !== 1 ||
    !Number.isInteger(saved.stage) ||
    !assignments[saved.stage] ||
    ![saved.time, saved.x, saved.y].every(Number.isFinite) ||
    saved.time < 0 ||
    !Array.isArray(saved.shots) ||
    saved.shots.length < saved.stage ||
    saved.shots.length > saved.stage + 1 ||
    !saved.shots.every((s, i) => validShot(s) && s.stage === i)
  )
    return freshPhoto();
  return {
    ...freshPhoto(),
    stage: saved.stage,
    time: saved.time,
    x: clamp(saved.x, 0, WIDTH),
    y: clamp(saved.y, 0, HEIGHT),
    shots: saved.shots.map((s) => ({ ...s })),
  };
}
export function wildlife(stage, time) {
  const beat = time % 6.4,
    loop = Math.floor(time / 6.4);
  const scene = assignments[stage];
  const [begin, end] = scene.window || [2, 4.3];
  const special = beat >= begin && beat < end;
  // Jump as soon as the warning ends. During the shutter window the original trajectory
  // stays identical, so photographs stored by older versions still frame the same pose.
  const jumps = loop + (beat >= 4.3 ? 1 : 0);
  const travel = stage === 2 && jumps % 2 === 1 ? -1 : 1;
  const x = WIDTH / 2 + travel * (212 * Math.sin(time * 0.52 + stage * 1.6) + 33 * Math.cos(time * 0.87));
  let y = 178 + Math.sin(time * 1.5) * 14;
  if (stage === 1) y = 230 - (beat >= 4.3 ? Math.sin(((beat - 4.3) * Math.PI) / 2.1) * 86 : 0);
  if (stage === 2) y = 196 + Math.cos(time * 0.7) * 16;
  if (scene.monster === 'elder_guardian') y = 182 + 51 * Math.sin(time * 1.35);
  if (scene.monster === 'skeleton') y = 222 + 5 * Math.sin(time * 3.4);
  if (scene.monster === 'creeper') y = 211 + 17 * Math.cos(time * 1.9);
  return { x, y, special, beat, preparation: clamp((beat - begin) / (end - begin), 0, 1) };
}
export function snapPhoto(s, hero) {
  if (s.shots.length > s.stage) return { message: 'Кадр уже в альбоме.' };
  const animal = wildlife(s.stage, s.time);
  const dx = Math.abs(s.x - animal.x),
    dy = Math.abs(s.y - animal.y);
  if (dx > 78 || dy > 53)
    return { message: 'Монстр за краем видоискателя. Коснись его на экране и попробуй ещё раз.' };
  if (!animal.special) return { message: assignments[s.stage].goal };
  const distance = Math.hypot(dx / 78, dy / 53);
  const shot = {
    stage: s.stage,
    time: s.time,
    x: s.x,
    y: s.y,
    hero,
    stars: distance < 0.32 ? 3 : distance < 0.75 ? 2 : 1,
  };
  s.shots.push(shot);
  return { shot, message: 'Получилось! ' + assignments[s.stage].subject + ' в кадре.' };
}
function bestAlbum() {
  try {
    const a = JSON.parse(localStorage.getItem(albumKey));
    return Array.isArray(a) ? a.filter(validShot) : [];
  } catch {
    return [];
  }
}
export function bestByStage(shots) {
  const photos = new Map();
  for (const shot of shots) {
    if (!photos.has(shot.stage) || shot.stars >= photos.get(shot.stage).stars) photos.set(shot.stage, shot);
  }
  return photos;
}
function remember(shot) {
  const photos = bestByStage([...bestAlbum(), shot]);
  if (photos.get(shot.stage) !== shot) return;
  try {
    localStorage.setItem(albumKey, JSON.stringify([...photos.values()]));
  } catch {
    /* The current expedition still keeps its photographs. */
  }
}
function paintScene(g, images, stage, time) {
  const scene = assignments[stage],
    animal = wildlife(stage, time);
  g.fillStyle = stage === 2 ? '#362949' : '#733930';
  g.fillRect(0, 0, WIDTH, HEIGHT);
  const panorama = images[scene.sheet];
  if (panorama.naturalWidth) {
    const h = panorama.naturalHeight / (scene.sheet === 'world' ? 4 : 3),
      sw = (h * WIDTH) / HEIGHT,
      available = panorama.naturalWidth - sw;
    const sourceX = available * (0.48 + 0.13 * Math.sin(time * 0.19 + stage));
    g.drawImage(panorama, sourceX, scene.row * h, sw, h, 0, 0, WIDTH, HEIGHT);
  }
  const foreground = scene.props || (stage === 2 ? ['crystal_spires', 'chorus_grove'] : ['basalt_columns', 'crimson_fungi']);
  drawLandmark(g, foreground[0], -50, HEIGHT - 140, 212);
  drawLandmark(g, foreground[1], WIDTH - 171, HEIGHT - 126, 194);
  const shade = g.createLinearGradient(0, 0, 0, HEIGHT);
  shade.addColorStop(0, '#1b122100');
  shade.addColorStop(1, '#17131d52');
  g.fillStyle = shade;
  g.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 18; i++) {
    const x = (i * 213 + time * (8 + (i % 4))) % WIDTH;
    const y = HEIGHT - ((i * 57 + time * (10 + (i % 3))) % HEIGHT);
    g.fillStyle = stage === 2 ? '#d3b2ff80' : '#ffd3948c';
    g.fillRect(x, y, 2 + (i % 3), 2 + (i % 3));
  }
  const subject = { type: scene.monster, dir: 'down' };
  if (animal.special) {
    const progress = animal.preparation;
    subject.windup = PREPARATION[subject.type] * Math.max(0.02, 1 - progress);
    subject.aim = { dir: scene.monster === 'skeleton' ? 'right' : 'down' };
  } else if (stage === 1 && animal.beat >= 4.3) {
    subject.leap = { from: [0, 0], to: [1, 0], progress: (animal.beat - 4.3) / 2.1 };
  }
  // Both the viewfinder and saved print use the original maze animation at the shutter instant.
  g.save();
  g.translate(animal.x, animal.y);
  const scale = stage === 2 ? 5 : 6;
  g.scale(scale, scale);
  drawMazeMonster(g, subject, 0, 0, time);
  g.restore();
  if (animal.special && stage !== 0) {
    for (let i = 0; i < 12; i++) {
      const a = (i * TAU) / 12 + time * 2,
        x = animal.x + Math.cos(a) * (stage === 2 ? 57 : 61),
        y = animal.y + (stage === 2 ? 0 : 29) + Math.sin(a) * (stage === 2 ? 52 : 13);
      g.fillStyle = i % 2 ? '#fff4ce' : scene.color;
      g.fillRect(x, y, 4, 4);
    }
  }
}
function drawReticle(g, x, y) {
  const l = x - FRAME_W / 2,
    t = y - FRAME_H / 2;
  g.save();
  g.fillStyle = '#16112243';
  g.beginPath();
  g.rect(0, 0, WIDTH, HEIGHT);
  g.rect(l, t, FRAME_W, FRAME_H);
  g.fill('evenodd');
  g.strokeStyle = '#fff3cc';
  g.lineWidth = 3;
  g.shadowColor = '#191329';
  g.shadowBlur = 3;
  for (const [px, py, dx, dy] of [
    [l, t, 1, 1],
    [l + FRAME_W, t, -1, 1],
    [l, t + FRAME_H, 1, -1],
    [l + FRAME_W, t + FRAME_H, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(px + dx * 19, py);
    g.lineTo(px, py);
    g.lineTo(px, py + dy * 19);
    g.stroke();
  }
  g.strokeRect(x - 3, y - 3, 6, 6);
  g.restore();
}
export function mount(host, { players, saved, save, finish, cue = () => {} }) {
  const s = restorePhoto(saved),
    hero = players[0],
    events = new AbortController(),
    opts = { signal: events.signal };
  host.innerHTML =
    '<section class="photo-game"><header><div><small>Фотоэкспедиция</small><h2></h2></div><b class="photo-counter"></b></header><p class="photo-goal"></p><canvas class="photo-field" width="800" height="340" tabindex="0" aria-label="Видоискатель. Коснитесь монстра или перемещайте рамку стрелками. Пробел делает снимок."></canvas><div class="photo-bar"><span class="photo-status" role="status"></span><button type="button" class="photo-shutter">Снять кадр</button></div><p class="photo-hint">Коснись монстра, чтобы навести рамку. В нужный момент нажми «Снять кадр». На клавиатуре работают стрелки и пробел.</p><div class="photo-shelf"><h3>Семейный альбом</h3><div class="photo-prints"></div></div></section>';
  const q = (sel) => host.querySelector(sel),
    canvas = q('.photo-field'),
    g = canvas.getContext('2d'),
    shutter = q('.photo-shutter');
  const images = { realm: new Image(), world: new Image() };
  const keys = new Set();
  let paused = false,
    disposed = false,
    raf = 0,
    last = null,
    lastSave = 0,
    feedback = '',
    feedbackUntil = 0,
    lastStatus = '';
  let specialLastFrame = wildlife(s.stage, s.time).special;
  const reviewed = () => s.shots.length > s.stage;
  function print(shot) {
    const el = document.createElement('figure'),
      c = document.createElement('canvas'),
      label = document.createElement('figcaption');
    c.width = 214;
    c.height = 154;
    const painter = c.getContext('2d');
    painter.translate(FRAME_W / 2 - shot.x, FRAME_H / 2 - shot.y);
    paintScene(painter, images, shot.stage, shot.time);
    label.textContent =
      assignments[shot.stage].subject + ' · ' + heroNames[shot.hero] + ' · ' + '★'.repeat(shot.stars);
    el.append(c, label);
    return el;
  }
  function album() {
    const photos = bestByStage([...bestAlbum(), ...s.shots]);
    const shelf = q('.photo-prints');
    shelf.replaceChildren();
    for (const [i, stage] of assignments.entries()) {
      if (photos.has(i)) {
        shelf.append(print(photos.get(i)));
        continue;
      }
      const empty = document.createElement('span');
      empty.textContent = stage.subject + ' · кадр впереди';
      shelf.append(empty);
    }
  }
  function draw() {
    paintScene(g, images, s.stage, s.time);
    drawReticle(g, s.x, s.y);
    const a = wildlife(s.stage, s.time),
      scene = assignments[s.stage];
    const text = reviewed()
      ? 'Кадр в альбоме · ' + '★'.repeat(s.shots[s.stage].stars)
      : s.time < feedbackUntil
        ? feedback
        : a.special
          ? scene.action
          : scene.idle;
    if (text !== lastStatus) {
      q('.photo-status').textContent = text;
      lastStatus = text;
    }
    return a.special;
  }
  function update() {
    const scene = assignments[s.stage];
    q('h2').textContent = scene.name;
    q('.photo-goal').textContent = scene.goal;
    q('.photo-counter').textContent = 'Задание ' + (s.stage + 1) + ' / ' + assignments.length;
    shutter.textContent = reviewed()
      ? s.stage === assignments.length - 1
        ? 'Завершить экспедицию'
        : 'Следующее задание'
      : 'Снять кадр';
    draw();
    album();
  }
  function take() {
    if (paused || disposed) return;
    if (reviewed()) {
      if (s.stage === assignments.length - 1) {
        const stars = s.shots.reduce((n, shot) => n + shot.stars, 0);
        finish({ score: stars, summary: 'Снимков в альбоме: ' + s.shots.length + ' · ' + stars + ' из ' + (assignments.length * 3) + ' звёзд' });
        return;
      }
      s.stage++;
      specialLastFrame = false;
      s.time = 0;
      s.x = WIDTH / 2;
      s.y = HEIGHT / 2;
      feedbackUntil = 0;
    } else {
      const result = snapPhoto(s, hero);
      cue(result.shot ? 'photo-shutter' : 'photo-miss');
      feedback = result.message;
      feedbackUntil = s.time + 1.4;
      if (result.shot) remember(result.shot);
    }
    update();
    save(s);
  }
  function aim(e) {
    if (paused || disposed || reviewed()) return;
    const r = canvas.getBoundingClientRect();
    s.x = clamp(((e.clientX - r.left) / r.width) * WIDTH, 0, WIDTH);
    s.y = clamp(((e.clientY - r.top) / r.height) * HEIGHT, 0, HEIGHT);
    draw();
  }
  canvas.addEventListener(
    'pointerdown',
    (e) => {
      canvas.setPointerCapture(e.pointerId);
      aim(e);
    },
    opts,
  );
  canvas.addEventListener(
    'pointermove',
    (e) => {
      if (e.buttons || canvas.hasPointerCapture(e.pointerId)) aim(e);
    },
    opts,
  );
  shutter.addEventListener('click', take, opts);
  document.addEventListener(
    'keydown',
    (e) => {
      if (paused || disposed || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code.startsWith('Arrow')) {
        e.preventDefault();
        keys.add(e.code);
      } else if (e.code === 'Space' && !e.repeat && !e.target.closest?.('button')) {
        e.preventDefault();
        take();
      }
    },
    opts,
  );
  document.addEventListener('keyup', (e) => keys.delete(e.code), opts);
  window.addEventListener('blur', () => keys.clear(), opts);
  function loop(now) {
    if (paused || disposed) return;
    const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!reviewed()) {
      s.time += dt;
      s.x = clamp(
        s.x + 240 * dt * (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))),
        0,
        WIDTH,
      );
      s.y = clamp(s.y + 210 * dt * (Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'))), 0, HEIGHT);
      const canShoot = draw();
      if (canShoot && !specialLastFrame) cue('photo-focus');
      specialLastFrame = canShoot;
      if (now - lastSave > 1500) {
        save(s);
        lastSave = now;
      }
    }
    raf = requestAnimationFrame(loop);
  }
  for (const image of [...Object.values(images), landmarkAtlas()]) {
    image.addEventListener('load', () => { if (!disposed) update(); }, opts);
  }
  images.world.src = new URL('./assets/world-panoramas.webp', import.meta.url);
  images.realm.src = new URL('./assets/realm-panoramas.webp', import.meta.url);
  update();
  raf = requestAnimationFrame(loop);
  return {
    pause() {
      paused = true;
      keys.clear();
      cancelAnimationFrame(raf);
      last = null;
      save(s);
    },
    resume() {
      if (paused && !disposed) {
        paused = false;
        raf = requestAnimationFrame(loop);
      }
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      events.abort();
    },
  };
}
