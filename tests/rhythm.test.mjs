import test from 'node:test';
import assert from 'node:assert/strict';
import { createRhythm, listen, stepRhythm, strike, songs } from '../rhythm.js';

const copy = (state) => createRhythm(JSON.parse(JSON.stringify(state)));
function begin(song = 'temple') {
  const state = createRhythm();
  state.song = song;
  listen(state);
  return state;
}
test('монстр играет фразу целиком и только затем принимает ответ', () => {
  const s = begin();
  stepRhythm(s, 1);
  assert.equal(s.phase, 'listen');
  assert.equal(strike(s, 0), false);
  stepRhythm(s, 2);
  assert.equal(s.phase, 'play');
  assert.equal(s.elapsed, 0);
});
test('после сохранения дослушиваем ту же фразу в Крае', () => {
  const s = begin('end');
  stepRhythm(s, 1.37);
  const restored = copy(s);
  assert.deepEqual(restored, s);
  stepRhythm(restored, 4);
  assert.equal(restored.phase, 'play');
});
test('отсчёт ритма начинается с первой ноты ребёнка, очки сохраняются один раз', () => {
  const s = begin();
  stepRhythm(s, 3);
  stepRhythm(s, 4);
  const d = 60 / 94;
  strike(s, 0);
  stepRhythm(s, d);
  const resumed = copy(s);
  assert.deepEqual(s, resumed);
  strike(resumed, 1);
  stepRhythm(resumed, d);
  strike(resumed, 0);
  assert.equal(resumed.phase, 'phrase');
  assert.equal(resumed.score, 45);
  assert.deepEqual(copy(resumed), resumed);
  assert.equal(strike(resumed, 0), false);
  assert.equal(resumed.score, 45);
});
test('за верные ноты можно пройти фразу и без бонуса за точный ритм', () => {
  const s = begin('arcade');
  stepRhythm(s, 3);
  for (const n of [1, 3, 1]) strike(s, n);
  assert.equal(s.phase, 'phrase');
  assert.equal(s.hits, 1);
  assert.equal(s.score, 35);
});
test('ошибка сохраняет подсказку и даёт повторить фразу без потери прежних очков', () => {
  const s = begin();
  s.score = 45;
  s.round = 1;
  stepRhythm(s, 5);
  strike(s, 0);
  strike(s, 3);
  assert.equal(s.phase, 'miss');
  assert.deepEqual(copy(s), s);
  listen(s);
  assert.equal(s.score, 45);
  assert.equal(s.round, 1);
  assert.equal(s.progress, 0);
  assert.equal(s.miss, null);
});
test('повреждённое сохранение возвращает к выбору', () => {
  const s = begin();
  for (const extra of [
    { version: 0 },
    { song: 'missing' },
    { round: 5 },
    { phase: 'play', progress: 3 },
    { firstAt: 7 },
  ]) {
    assert.deepEqual(createRhythm({ ...s, ...extra }), createRhythm());
  }
});

test('в семи мирах можно сыграть все три разные фразы с максимальной точностью и продолжить с любой ноты', () => {
  assert.equal(new Set(songs.map((song) => song.place)).size, 7);
  assert.equal(new Set(songs.map((song) => JSON.stringify(song.riffs))).size, songs.length);
  for (const song of songs) {
    let state = createRhythm();
    state.song = song.id;
    let expectedScore = 0;
    for (const [round, riff] of song.riffs.entries()) {
      state.round = round;
      listen(state);
      stepRhythm(state, 20);
      for (const [i, [note, beat]] of riff.entries()) {
        if (i) stepRhythm(state, ((beat - riff[i - 1][1]) * 60) / song.bpm);
        assert.ok(strike(state, note), song.title);
        state = copy(state);
      }
      expectedScore += riff.length * 15;
      assert.equal(state.phase, 'phrase');
      assert.equal(state.score, expectedScore);
    }
  }
});
