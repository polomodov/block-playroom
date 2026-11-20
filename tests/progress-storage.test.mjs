import assert from 'node:assert/strict';
import test from 'node:test';

const robot = { mode: 'robot', id: 'warehouse-1', players: ['pasha'] };
const detective = { mode: 'mystery', id: 'case-1', players: ['mom'] };
const result = { summary: 'Три склада пройдены', score: 12 };

let instance = 0;
const loadProgress = () => import('../progress.js?instance=' + ++instance);

function useStorage(t) {
  const data = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
  return storage;
}

test('после перезапуска сохраняются обе партии, а завершение старой попытки не стирает новую', async (t) => {
  useStorage(t);
  const first = await loadProgress();
  first.saveSlot(robot, { program: ['left'] });
  first.saveSlot(detective, { clues: 1 });
  const next = { ...robot, id: 'warehouse-2' };
  first.saveSlot(next, { program: ['forward'] });
  const reopened = await loadProgress();
  reopened.finishSlot(robot, result);
  reopened.finishSlot(robot, result);
  assert.equal(reopened.slot('robot').id, next.id);
  assert.deepEqual(reopened.slot('robot').payload, { program: ['forward'] });
  assert.deepEqual(reopened.slot('mystery').payload, { clues: 1 });
  assert.deepEqual(
    reopened.collectionProgress().results.map((r) => r.id),
    [robot.id],
  );
  reopened.finishSlot(next, result);
  const final = await loadProgress();
  assert.equal(final.slot('robot'), null);
  assert.equal(final.collectionProgress().latest.id, detective.id);
  assert.deepEqual(
    final.collectionProgress().results.map((r) => r.id),
    [next.id, robot.id],
  );
});

test('партия продолжается в памяти при отказе записи и записывается после восстановления хранилища', async (t) => {
  const storage = useStorage(t);
  const profile = await loadProgress();
  profile.saveSlot(detective, { clues: 2 });
  const originalWrite = storage.setItem;
  storage.setItem = () => {
    throw new Error('Quota exceeded');
  };
  profile.saveSlot(robot, { program: ['right'] });
  assert.deepEqual(profile.slot('robot').payload, { program: ['right'] });
  storage.setItem = originalWrite;
  profile.finishSlot(robot, result);
  const reopened = await loadProgress();
  assert.equal(reopened.slot('mystery').payload.clues, 2);
  assert.equal(reopened.collectionProgress().results[0].score, 12);
});

test('повреждённая строка истории не мешает сохранить новый результат после перезапуска', async (t) => {
  const storage = useStorage(t);
  const module = await loadProgress();
  module.saveSlot(robot, { program: ['forward'] });
  const key = 'family-games:' + new URL('../', import.meta.url).pathname + ':progress:1';
  const profile = JSON.parse(storage.getItem(key));
  profile.results.push(null, { ...detective, at: 100, summary: 'Изумруд найден' });
  storage.setItem(key, JSON.stringify(profile));
  const reopened = await loadProgress();
  reopened.finishSlot(robot, result);
  assert.equal(reopened.slot('robot'), null);
  assert.deepEqual(
    (await loadProgress()).collectionProgress().results.map((r) => r.id),
    [robot.id, detective.id],
  );
});
