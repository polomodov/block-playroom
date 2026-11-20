const status = document.querySelector('#offline-status');
const retry = document.querySelector('#offline-retry');
const install = document.querySelector('#install-game');
const progress = document.querySelector('#offline-progress');
const pack = 'seven-games-v1';
let promptEvent;
let busy = false;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  promptEvent = event;
  install.hidden = false;
});
window.addEventListener('appinstalled', () => {
  install.hidden = true;
  promptEvent = null;
});
install.addEventListener('click', async () => {
  const pending = promptEvent;
  if (!pending) return;
  await pending.prompt();
  await pending.userChoice;
  install.hidden = true;
  promptEvent = null;
});

function displayProgress(bytes, totalBytes) {
  const percent = Math.floor((100 * bytes) / totalBytes);
  if (progress) {
    progress.hidden = false;
    progress.max = totalBytes;
    progress.value = bytes;
  }
  status.textContent = 'Загрузка 7 игр для офлайна · ' + percent + '%';
}
function confirmFiles(worker) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    let timeout;
    const done = (callback, value) => {
      clearTimeout(timeout);
      channel.port1.close();
      navigator.serviceWorker.removeEventListener('message', heartbeat);
      callback(value);
    };
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => done(reject, new Error('No response from offline cache')), 120000);
    };
    const heartbeat = (event) => {
      if (event.source === worker && event.data?.type === 'pack-progress') resetTimer();
    };
    navigator.serviceWorker.addEventListener('message', heartbeat);
    resetTimer();
    channel.port1.onmessage = (event) => done(resolve, event.data);
    worker.postMessage('offline-status', [channel.port2]);
  });
}
function activated(worker) {
  if (!worker) throw new Error('No service worker');
  return new Promise((resolve, reject) => {
    function check() {
      if (!['activated', 'redundant'].includes(worker.state)) return;
      worker.removeEventListener('statechange', check);
      if (worker.state === 'activated') resolve(worker);
      else reject(new Error('Seven-game installation interrupted'));
    }
    worker.addEventListener('statechange', check);
    check();
  });
}
async function confirmedPack(registration) {
  const pending = registration.installing || registration.waiting;
  let worker = await activated(pending || registration.active);
  let reply = await confirmFiles(worker);
  if (reply?.pack !== pack) {
    // A previous four-game worker also answers "ready". Ask the browser to
    // update it before reporting that the three new entry points work offline.
    if (!registration.installing && !registration.waiting) await registration.update();
    worker = await activated(registration.installing || registration.waiting || registration.active);
    reply = await confirmFiles(worker);
  }
  if (!reply?.ready || reply.pack !== pack || reply.games !== 7 || navigator.serviceWorker.controller !== worker)
    throw new Error('Incomplete seven-game pack');
}
async function prepare() {
  if (busy) return;
  if (!('serviceWorker' in navigator)) {
    status.textContent = 'Этот браузер не поддерживает офлайн-режим.';
    return;
  }
  busy = true;
  retry.hidden = true;
  delete status.dataset.ready;
  if (progress) {
    progress.hidden = false;
    progress.removeAttribute('value');
  }
  status.textContent = 'Подготовка всех 7 игр для офлайна…';
  try {
    let reg;
    try {
      reg = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    } catch (error) {
      reg = await navigator.serviceWorker.getRegistration('./');
      if (!reg) throw error;
    }
    if (!reg.installing && !reg.waiting && !reg.active) await reg.update();
    await confirmedPack(reg);
    status.textContent = 'Готово к игре офлайн · 7 из 7 игр';
    status.dataset.ready = 'true';
  } catch {
    status.textContent = 'Загрузка не завершена. Подключись к интернету и продолжи загрузку.';
    retry.hidden = false;
  } finally {
    if (progress) progress.hidden = true;
    busy = false;
  }
}

retry.addEventListener('click', prepare);
window.addEventListener('online', () => {
  if (!status.dataset.ready) prepare();
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const d = event.data;
    if (busy && d?.type === 'pack-progress' && d.pack === pack && d.totalBytes > 0) {
      displayProgress(d.bytes, d.totalBytes);
    }
  });
  navigator.serviceWorker.addEventListener('controllerchange', prepare);
}
prepare();
