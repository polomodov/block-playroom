const status = document.querySelector('#offline-status');
const retry = document.querySelector('#offline-retry');
const install = document.querySelector('#install-game');
const progress = document.querySelector('#offline-progress');
const pack = 'family-library-v2';
const gameCount = document.querySelectorAll('.catalog .cover-card').length;
let promptEvent;
let busy = false;
let announced = -1;

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
  // The progress bar moves every batch. The status line (read aloud by screen
  // readers) changes only at each quarter so it does not recite every percent.
  const step = Math.floor(percent / 25) * 25;
  if (step !== announced) {
    announced = step;
    status.textContent = `Загрузка ${gameCount} игр для офлайна · ${step}%`;
  }
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
    channel.port1.onmessage = ({ data }) => done(resolve, data?.library ? { ...data, ...data.library } : data);
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
      else reject(new Error('Library installation interrupted'));
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
    // Earlier workers also answer "ready". Verify the current collection before confirming offline availability.
    if (!registration.installing && !registration.waiting) await registration.update();
    worker = await activated(registration.installing || registration.waiting || registration.active);
    reply = await confirmFiles(worker);
  }
  // After a hard reload (Shift+Reload) the page is deliberately not controlled;
  // the next ordinary visit will be, so only a different controller is an error.
  const controller = navigator.serviceWorker.controller;
  if (!reply?.ready || reply.pack !== pack || reply.games !== gameCount || (controller && controller !== worker))
    throw new Error('Incomplete library pack');
}
async function prepare() {
  if (busy) return;
  if (!('serviceWorker' in navigator)) {
    status.textContent = 'Этот браузер не поддерживает офлайн-режим.';
    return;
  }
  busy = true;
  announced = -1;
  retry.hidden = true;
  delete status.dataset.ready;
  if (progress) {
    progress.hidden = false;
    progress.removeAttribute('value');
  }
  status.textContent = `Подготовка всех ${gameCount} игр для офлайна…`;
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
    status.textContent = `Готово к игре офлайн · ${gameCount} из ${gameCount} игр`;
    status.dataset.ready = 'true';
    // Ask the browser not to evict saves and the offline pack (Safari clears
    // storage of sites that are not on the home screen after a week without visits).
    navigator.storage?.persist?.().catch(() => {});
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
