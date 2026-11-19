export const titles = {
  coop: 'Два ключа',
  golf: 'Гольф семи миров',
  mystery: 'Куда делся изумруд?',
  rhythm: 'Гитарная репетиция',
};
export const heroNames = { kirill: 'Кирилл', maxim: 'Максим', mom: 'Мама', dad: 'Папа', pasha: 'Паша' };
const key = 'family-games:' + new URL('.', import.meta.url).pathname + ':progress:1';
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
export function slot(mode) {
  const s = read().slots[mode];
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
  write({ slots, results: [record, ...profile.results.filter((r) => r.id !== record.id)].slice(0, 50) });
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
  function latest() {
    return Object.keys(titles)
      .map(slot)
      .filter(Boolean)
      .sort((a, b) => b.at - a.at)[0];
  }
  function refresh() {
    const s = latest();
    btn.hidden = !s;
    if (s) btn.textContent = 'Вернуться в последнюю игру · ' + titles[s.mode];
    q('save-notice').hidden = !storageFailed;
    const history = q('game-history');
    history.replaceChildren();
    for (const r of read().results) {
      if (!Object.hasOwn(titles, r.mode) || !Number.isFinite(r.at) || !Array.isArray(r.players)) continue;
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
    const s = latest();
    if (s) resume(s);
  });
  window.addEventListener('storage', (e) => {
    if (e.key === key || e.key === null) {
      storageFailed = false;
      memory = blank();
      refresh();
    }
  });
  refresh();
  return refresh;
}
