// The family games share an origin. Keep each library independent.
const key = 'family-games:/block-jump/:progress:1';
const heroes = {kirill:'Кирилл', maxim:'Максим', mom:'Мама', dad:'Папа', pasha:'Паша'};
const levels = {temple:'Храм изумруда', arcade:'Игровой центр', waterpark:'Аквапарк', store:'Мебельный магазин', nether:'Нижний мир', castle:'Замок на Хеллоуин', end:'Край'};
let memory = {saved:null, results:[]};
let refresh = () => {};
let storageFailed = false;

function read() {
  if (storageFailed) return memory;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return memory;
    const profile = JSON.parse(raw);
    if (profile && Array.isArray(profile.results)) memory = profile;
  } catch { /* The in-memory session also works when storage is unavailable. */ }
  return memory;
}

function write(profile, updatePanel = true) {
  memory = profile;
  try { localStorage.setItem(key, JSON.stringify(profile)); storageFailed = false; }
  catch { storageFailed = true; }
  if (updatePanel || storageFailed) refresh();
}

export function loadSavedGame() { return read().saved || null; }
export function saveGame(snapshot) {
  const profile = read();
  write({...profile, saved:{...snapshot, savedAt:Date.now()}}, !profile.saved || !document.querySelector('#offline-tools')?.closest('[hidden]'));
}
export function clearSavedGame() {
  const profile = read();
  if (profile.saved) write({...profile, saved:null});
}
export function addResult(result) {
  const profile = read();
  const record = {...result, at:Date.now()};
  const rest = result.id ? profile.results.filter(entry => entry.id !== result.id) : profile.results;
  write({saved:null, results:[record, ...rest].slice(0,50)});
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
      if (!r || !Object.hasOwn(heroes,r.hero) || !Object.hasOwn(levels,r.level) || !Number.isFinite(r.at)) continue;
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
    if (saved && onResume(saved) === false) clearSavedGame();
  });
  window.addEventListener('storage', e => { if (e.key === key || e.key === null) { memory = {saved:null,results:[]}; storageFailed=false; refresh(); } });
  // Returning via the menu can reveal a save written while the lobby was hidden.
  new MutationObserver(() => { if (!button.closest('[hidden]')) refresh(); }).observe(document.querySelector('#lobby'), {attributes:true,attributeFilter:['hidden']});
  refresh();
  return refresh;
}
