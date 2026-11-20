import test from 'node:test';
import assert from 'node:assert/strict';
import { assignments, freshPhoto, restorePhoto, wildlife, snapPhoto } from '../photo.js';

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
test('three scenes keep the precise shot and photographer across reloads', () => {
  let s = freshPhoto();
  for (let i = 0; i < assignments.length; i++) {
    s.stage = i;
    aim(s, 2.42);
    const { shot } = snapPhoto(s, 'kirill');
    assert.equal(shot.stars, 3);
    assert.equal(shot.hero, 'kirill');
    s = restorePhoto(JSON.parse(JSON.stringify(s)));
    assert.deepEqual(s.shots.at(-1), shot);
  }
  assert.equal(s.shots.length, 3);
  assert.deepEqual(restorePhoto({ ...s, shots: s.shots.slice(1) }), freshPhoto());
});
