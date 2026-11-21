// The family games share an origin. Keep each library independent.
// The same key is used by the edition packaged in the family playroom, so the
// save format and the round ownership rules below must stay compatible with it.
const key = 'family-games:/block-maze/:progress:1';
const heroes = {kirill:'Кирилл', maxim:'Максим', mom:'Мама', dad:'Папа', pasha:'Паша'};
const levels = {temple:'Храм изумруда', arcade:'Игровой центр', waterpark:'Аквапарк', store:'Мебельный магазин', nether:'Нижний мир', castle:'Замок на Хеллоуин', end:'Край'};
const blank = () => ({saved:null, results:[]});
let memory = blank();
let refresh = () => {};
let storageFailed = false;
// The round this tab is playing. Another tab that starts or resumes a round
// takes ownership, and this tab stops writing its checkpoints over that round.
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
      ? {...profile, results:profile.results.filter(validResult)} : blank();
  } catch { /* The last readable profile is still available for this session. */ }
  return memory;
}

function write(profile, updatePanel = true) {
  memory = profile;
  try { localStorage.setItem(key, JSON.stringify(profile)); storageFailed = false; }
  catch { storageFailed = true; }
  if (updatePanel || storageFailed) refresh();
}

function newOwner() {
  return crypto.getRandomValues(new Uint32Array(4)).join('-');
}

export function beginArcadeRound() {
  const profile = read();
  owner = newOwner();
  lastSavedAt = profile.saved?.savedAt;
  write({...profile, libraryOwner:owner}, false);
}

function owns(profile) {
  return owner !== null && profile.libraryOwner === owner && profile.saved?.savedAt === lastSavedAt;
}

export function loadSavedGame() { return read().saved || null; }
export function saveGame(snapshot) {
  const profile = read();
  if (!owns(profile)) return;
  lastSavedAt = Date.now();
  const visible = !document.querySelector('#offline-tools')?.closest('[hidden]');
  write({...profile, saved:{...snapshot, savedAt:lastSavedAt}}, !profile.saved || visible);
}
export function clearSavedGame() {
  const profile = read();
  if (profile.saved) {
    lastSavedAt = undefined;
    write({...profile, saved:null});
  }
}
export function addResult(result) {
  const profile = read();
  const current = owns(profile);
  const rest = result.id ? profile.results.filter(entry => entry.id !== result.id) : profile.results;
  const results = [{...result, at:Date.now()}, ...rest].slice(0, 50);
  if (current) lastSavedAt = undefined;
  // A finished round from an old tab must not erase the round another tab is playing.
  write({...profile, saved:current ? null : profile.saved, results});
}

export function bindProgress({onResume}) {
  const button = document.querySelector('#continue-saved');
  const history = document.querySelector('#game-history');
  const notice = document.querySelector('#save-notice');
  const stamp = new Intl.DateTimeFormat('ru', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
  refresh = () => {
    const {saved, results} = read();
    button.hidden = !saved;
    if (saved) button.textContent = 'Продолжить · ' + (heroes[saved.hero] || 'Герой') + ' · ' + (levels[saved.level] || 'Уровень');
    notice.hidden = !storageFailed;
    history.replaceChildren();
    if (!results.length) {
      const li = document.createElement('li'); li.textContent='Здесь появятся результаты сыгранных партий.'; history.append(li);
    }
    for (const r of results) {
      const row=document.createElement('li'), title=document.createElement('strong'), detail=document.createElement('span');
      title.textContent=heroes[r.hero]+' · '+levels[r.level];
      const score = Number.isFinite(r.distance) ? Math.floor(r.distance)+' м · ' : '';
      const outcome = r.outcome === 'won' ? 'Пройден' : r.outcome === 'over' ? 'Финиш забега' : 'Попытки закончились';
      detail.textContent=stamp.format(r.at)+' · '+outcome+' · '+score+(r.gems || 0)+' 💎';
      row.append(title,detail);history.append(row);
    }
  };
  button.addEventListener('click', () => {
    const saved = loadSavedGame();
    if (!saved) return;
    beginArcadeRound();
    if (onResume(saved) === false) clearSavedGame();
  });
  window.addEventListener('storage', e => { if (e.key === key || e.key === null) { memory = blank(); storageFailed=false; refresh(); } });
  // Returning via the menu can reveal a save written while the lobby was hidden.
  new MutationObserver(() => { if (!button.closest('[hidden]')) refresh(); }).observe(document.querySelector('#lobby'), {attributes:true,attributeFilter:['hidden']});
  refresh();
  return refresh;
}
