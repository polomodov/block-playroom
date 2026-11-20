// The three packaged arcades share their standalone storage format and UI.
export function arcadeProgress(key, heroes, levels) {
  const blank = () => ({ saved: null, results: [] });
  let memory = blank();
  let storageFailed = false;
  let refresh = () => {};
  let owner = null;
  let lastSavedAt;

  function validResult(row) {
    return row && typeof row.hero === 'string' && Object.hasOwn(heroes, row.hero) &&
      typeof row.level === 'string' && Object.hasOwn(levels, row.level) &&
      Number.isFinite(row.at) && Number.isFinite(new Date(row.at).getTime());
  }

  function read() {
    if (storageFailed) return memory;
    try {
      const profile = JSON.parse(localStorage.getItem(key));
      memory = profile && Array.isArray(profile.results)
        ? { ...profile, results: profile.results.filter(validResult) } : blank();
    } catch { /* The last readable profile is still available for this session. */ }
    return memory;
  }

  function write(profile, updatePanel = true) {
    memory = profile;
    try {
      localStorage.setItem(key, JSON.stringify(profile));
      storageFailed = false;
    } catch { storageFailed = true; }
    if (updatePanel || storageFailed) refresh();
  }

  function beginArcadeRound() {
    const profile = read();
    owner = crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36);
    lastSavedAt = profile.saved?.savedAt;
    write({ ...profile, libraryOwner: owner }, false);
  }

  // Standalone editions keep the same save key. Their writes also change
  // savedAt even when they preserve the extra libraryOwner profile property.
  function owns(profile) {
    return owner !== null && profile.libraryOwner === owner && profile.saved?.savedAt === lastSavedAt;
  }

  function loadSavedGame() { return read().saved || null; }
  function saveGame(snapshot) {
    const profile = read();
    if (!owns(profile)) return;
    lastSavedAt = Date.now();
    const saved = { ...snapshot, savedAt: lastSavedAt };
    const visible = !document.querySelector('#offline-tools')?.closest('[hidden]');
    write({ ...profile, saved }, !profile.saved || visible);
  }

  function clearSavedGame() {
    const profile = read();
    if (profile.saved) {
      lastSavedAt = undefined;
      write({ ...profile, saved: null });
    }
  }

  function addResult(result) {
    const profile = read();
    const current = owns(profile);
    const previous = result.id ? profile.results.filter((row) => row.id !== result.id) : profile.results;
    const results = [{ ...result, at: Date.now() }, ...previous].slice(0, 50);
    if (current) lastSavedAt = undefined;
    write({ ...profile, saved: current ? null : profile.saved, results });
  }

  function bindProgress({ onResume }) {
    const button = document.getElementById('continue-saved');
    const history = document.getElementById('game-history');
    const notice = document.getElementById('save-notice');
    const stamp = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    refresh = () => {
      const { saved, results } = read();
      button.hidden = !saved;
      if (saved) button.textContent = 'Продолжить · ' + (heroes[saved.hero] || 'Герой') + ' · ' + (levels[saved.level] || 'Уровень');
      notice.hidden = !storageFailed;
      history.replaceChildren();
      if (!results.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Здесь появятся результаты сыгранных партий.';
        history.append(empty);
      }
      for (const result of results) {
        const row = document.createElement('li');
        const title = document.createElement('strong');
        const detail = document.createElement('span');
        title.textContent = heroes[result.hero] + ' · ' + levels[result.level];
        const score = Number.isFinite(result.distance) ? Math.floor(result.distance) + ' м · ' : '';
        const outcome = result.outcome === 'won' ? 'Пройден' : result.outcome === 'over' ? 'Финиш забега' : 'Попытки закончились';
        detail.textContent = stamp.format(result.at) + ' · ' + outcome + ' · ' + score + (result.gems || 0) + ' 💎';
        row.append(title, detail);
        history.append(row);
      }
    };
    button.addEventListener('click', () => {
      const saved = loadSavedGame();
      if (!saved) return;
      beginArcadeRound();
      if (onResume(saved) === false) clearSavedGame();
    });
    window.addEventListener('storage', (event) => {
      if (event.key === key || event.key === null) {
        memory = blank();
        storageFailed = false;
        refresh();
      }
    });
    new MutationObserver(() => {
      if (!button.closest('[hidden]')) refresh();
    }).observe(document.getElementById('lobby'), { attributes: true, attributeFilter: ['hidden'] });
    refresh();
    return refresh;
  }

  return { beginArcadeRound, loadSavedGame, saveGame, clearSavedGame, addResult, bindProgress };
}
