import test from 'node:test';
import assert from 'node:assert/strict';
import { newCafe, advanceCafe, menu, serve, useStation, stovePhase } from '../cafe.js';

test('the stations cook independently and a partial meal stays on the tray until the guest can be served', () => {
  const cafe = newCafe(2, 7);
  cafe.phase = 'open';
  advanceCafe(cafe, 0);
  const waffle = 0,
    lemonade = 2;
  useStation(cafe, waffle);
  useStation(cafe, lemonade);
  advanceCafe(cafe, menu[lemonade].time);
  assert.equal(stovePhase(cafe, waffle), 'making');
  assert.equal(stovePhase(cafe, lemonade), 'ready');
  useStation(cafe, lemonade);
  assert.equal(serve(cafe, 0), false);
  assert.deepEqual(cafe.tray, [0, 0, 1]);
  assert.equal(cafe.orders[0], 'waiting');
  advanceCafe(cafe, menu[waffle].time - menu[lemonade].time);
  useStation(cafe, waffle);
  assert.equal(serve(cafe, 0), true);
  assert.deepEqual(cafe.tray, [0, 0, 0]);
  assert.equal(cafe.sent, 1);
});

test('a full tray leaves the extra portion ready on its station until a guest frees space', () => {
  const cafe = newCafe();
  cafe.phase = 'open';
  const waffle = 0;
  for (let portion = 0; portion < 4; portion++) {
    useStation(cafe, waffle);
    advanceCafe(cafe, menu[waffle].time + 0.01);
    useStation(cafe, waffle);
  }
  assert.equal(cafe.tray[waffle], 3);
  assert.equal(stovePhase(cafe, waffle), 'ready');
  assert.equal(serve(cafe, 0), true);
  useStation(cafe, waffle);
  assert.equal(cafe.tray[waffle], 3);
  assert.equal(stovePhase(cafe, waffle), 'empty');
});
