import test from 'node:test';
import assert from 'node:assert/strict';
import { assignments, freshPhoto, restorePhoto, wildlife, snapPhoto, bestByStage } from '../photo.js';

function aim(s, time, dx = 0, dy = 0) {
  s.time = time;
  const animal = wildlife(s.stage, time);
  s.x = animal.x + dx;
  s.y = animal.y + dy;
}
test('the shutter checks both framing and the monster action', () => {
  const s = freshPhoto();
  aim(s, 0);
  assert.equal(snapPhoto(s, 'mom').shot, undefined);
  aim(s, 3, 80);
  assert.equal(snapPhoto(s, 'mom').shot, undefined);
  aim(s, 3, 60);
  assert.equal(snapPhoto(s, 'mom').shot.stars, 1);
  assert.equal(snapPhoto(s, 'mom').shot, undefined);
  assert.equal(s.shots.length, 1);
});
test('seven scenes keep the precise shot and photographer across reloads', () => {
  let s = freshPhoto();
  for (let i = 0; i < assignments.length; i++) {
    s.stage = i;
    const [begin, end] = assignments[i].window || [2, 4.3];
    aim(s, (begin + end) / 2);
    const { shot } = snapPhoto(s, 'kirill');
    assert.equal(shot.stars, 3);
    assert.equal(shot.hero, 'kirill');
    s = restorePhoto(JSON.parse(JSON.stringify(s)));
    assert.deepEqual(s.shots.at(-1), shot);
  }
  assert.ok(assignments.length >= 7);
  assert.equal(s.shots.length, assignments.length);
  assert.deepEqual(restorePhoto({ ...s, shots: s.shots.slice(1) }), freshPhoto());
});

test('эндермен исчезает при завершении предупреждения, сохраняя движение в начале следующего цикла', () => {
  for (const offset of [0, 6.4]) {
    const before = wildlife(2, offset + 4.299);
    const after = wildlife(2, offset + 4.301);
    assert.equal(before.special, true);
    assert.equal(after.special, false);
    assert.ok(Math.abs(after.x - before.x) > 100, 'прыжок сразу после кольца');
    assert.ok(Math.abs(wildlife(2, offset + 6.399).x - wildlife(2, offset + 6.401).x) < 1);
  }
});

test('семейный альбом оставляет лучший кадр каждой сцены, а при равенстве звёзд берёт свежий', () => {
  const previous = freshPhoto();
  aim(previous, 2.8);
  const { shot: best } = snapPhoto(previous, 'maxim');
  const next = freshPhoto();
  aim(next, 2.8, 62);
  const { shot: weaker } = snapPhoto(next, 'kirill');
  next.stage = 1;
  aim(next, 3.1);
  const { shot: cube } = snapPhoto(next, 'mom');
  assert.deepEqual([...bestByStage([best, weaker, cube]).values()], [best, cube]);
  const equal = { ...best, hero: 'dad' };
  assert.equal(bestByStage([best, equal]).get(0), equal);
});
