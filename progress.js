export const titles = {
  race: 'Гонки-призраки',
  bridge: 'Мост над лавой',
  tactics: 'Ход команды',
  cafe: 'Кафе для монстров',
  cards: 'Колода порталов',
  pinball: 'Пинбол миров',
  photo: 'Фотоохота на монстров',
  robot: 'Робот за изумрудом',

  coop: 'Два ключа',
  golf: 'Гольф семи миров',
  mystery: 'Куда делся изумруд?',
  rhythm: 'Гитарная репетиция',
  'block-maze': 'Блок Аркада',
  'block-jump': 'Блок Прыжок',
  'block-dash': 'Блок Экспресс',
};
export const heroNames = { kirill: 'Кирилл', maxim: 'Максим', mom: 'Мама', dad: 'Папа', pasha: 'Паша' };
const key = 'family-games:' + new URL('.', import.meta.url).pathname + ':progress:1';
// Embedded arcade games keep their original keys so existing games can be continued.
const arcadeIds = ['block-maze', 'block-jump', 'block-dash'];
const arcadeKey = (id) => 'family-games:/' + id + '/:progress:1';
const levelNames = {
  temple: 'Храм изумруда',
  arcade: 'Игровой центр',
  waterpark: 'Аквапарк',
  store: 'Мебельный магазин',
  nether: 'Нижний мир',
  castle: 'Замок на Хеллоуин',
  end: 'Край',
};
const outcomes = { won: 'Уровень пройден', lost: 'Попытки закончились', over: 'Финиш забега' };
const blank = () => ({ slots: {}, results: [] });
let memory = blank(),
  storageFailed = false;
function read() {
  if (storageFailed) return memory;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return blank();
    const p = JSON.parse(raw);
    if (p && p.slots && typeof p.slots === 'object' && Array.isArray(p.results)) memory = p;
  } catch {
    /* Private sessions can still play. */
  }
  return memory;
}
function write(profile) {
  memory = profile;
  try {
    localStorage.setItem(key, JSON.stringify(profile));
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
}
export function slot(mode, profile = read()) {
  const s = profile.slots[mode];
  if (
    !Object.hasOwn(titles, mode) ||
    !s ||
    s.mode !== mode ||
    !Array.isArray(s.players) ||
    !s.players.length ||
    s.players.some((hero) => !Object.hasOwn(heroNames, hero)) ||
    !s.id
  )
    return null;
  return s;
}
export function saveSlot(round, payload) {
  const profile = read();
  write({ ...profile, slots: { ...profile.slots, [round.mode]: { ...round, payload, at: Date.now() } } });
}
export function finishSlot(round, result) {
  const profile = read(),
    slots = { ...profile.slots };
  if (slots[round.mode]?.id === round.id) delete slots[round.mode];
  const record = { ...round, summary: result.summary, score: result.score, at: Date.now() };
  write({ slots, results: [record, ...profile.results.filter((r) => r && r.id !== record.id)].slice(0, 50) });
}
function readArcade(id) {
  try {
    return JSON.parse(localStorage.getItem(arcadeKey(id)));
  } catch {
    return null;
  }
}
function validTime(time) {
  return Number.isFinite(time) && Number.isFinite(new Date(time).getTime());
}
export function collectionProgress(profile = read(), readGame = readArcade) {
  const saves = Object.keys(profile.slots)
    .map((id) => slot(id, profile))
    .filter((s) => s && validTime(s.at));
  const results = profile.results.filter(
    (r) =>
      r &&
      Object.hasOwn(titles, r.mode) &&
      validTime(r.at) &&
      Array.isArray(r.players) &&
      typeof r.summary === 'string',
  );
  for (const id of arcadeIds) {
    const game = readGame(id);
    if (!game) continue;
    const saved = game.saved;
    if (
      saved &&
      Object.hasOwn(heroNames, saved.hero) &&
      Object.hasOwn(levelNames, saved.level) &&
      validTime(saved.savedAt)
    ) {
      saves.push({ mode: id, at: saved.savedAt, href: './games/' + id + '/?resume=1' });
    }
    for (const r of Array.isArray(game.results) ? game.results : []) {
      if (
        !r ||
        !Object.hasOwn(heroNames, r.hero) ||
        !Object.hasOwn(levelNames, r.level) ||
        !Object.hasOwn(outcomes, r.outcome) ||
        !validTime(r.at)
      )
        continue;
      const detail = [levelNames[r.level], outcomes[r.outcome]];
      if (Number.isFinite(r.distance)) detail.push(Math.floor(r.distance) + ' м');
      if (Number.isFinite(r.gems)) detail.push(r.gems + ' 💎');
      results.push({ mode: id, at: r.at, players: [r.hero], summary: detail.join(' · ') });
    }
  }
  const newestFirst = (a, b) => b.at - a.at;
  return { latest: saves.sort(newestFirst)[0], results: results.sort(newestFirst).slice(0, 50) };
}
export function bindProgress(resume, update) {
  const q = (id) => document.getElementById(id),
    btn = q('continue-saved');
  const stamp = new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  function refresh() {
    const { latest: s, results } = collectionProgress();
    btn.hidden = !s;
    if (s) btn.textContent = 'Вернуться в последнюю игру · ' + titles[s.mode];
    q('save-notice').hidden = !storageFailed;
    const history = q('game-history');
    history.replaceChildren();
    for (const r of results) {
      const li = document.createElement('li'),
        title = document.createElement('strong'),
        text = document.createElement('span');
      title.textContent = titles[r.mode] + ' · ' + r.players.map((h) => heroNames[h]).join(' и ');
      text.textContent = stamp.format(r.at) + ' · ' + r.summary;
      li.append(title, text);
      history.append(li);
    }
    if (!history.children.length) {
      const li = document.createElement('li');
      li.textContent = 'Здесь появятся результаты сыгранных партий.';
      history.append(li);
    }
    update();
  }
  btn.addEventListener('click', () => {
    const { latest: s } = collectionProgress();
    if (s?.href) location.assign(s.href);
    else if (s) resume(s);
  });
  window.addEventListener('storage', (e) => {
    if (e.key === key || e.key === null) {
      storageFailed = false;
      memory = blank();
    }
    if (e.key === null || e.key === key || arcadeIds.some((id) => arcadeKey(id) === e.key)) refresh();
  });
  // A trip through an arcade game can restore this page from the back-forward cache.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refresh();
  });
  refresh();
  return refresh;
}
