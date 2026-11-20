import test from 'node:test';
import assert from 'node:assert/strict';
import {
  crossings,
  newBridge,
  togglePart,
  deflections,
  startBridge,
  advanceBridge,
  repairBridge,
  restoreBridge,
} from '../bridge.js';

const solutions = [
  [['post', 1]],
  [
    ['post', 2],
    ['rope', 4],
  ],
  [
    ['rope', 1],
    ['post', 3],
    ['rope', 5],
  ],
];
test('every crossing has a physical solution with its available inventory', () => {
  for (const [level, parts] of solutions.entries()) {
    const state = newBridge(level);
    for (let i = 0; i < crossings[level].bays; i++) assert.equal(togglePart(state, 'deck', i), true);
    for (const [type, i] of parts) assert.equal(togglePart(state, type, i), true);
    startBridge(state);
    advanceBridge(state, 16);
    assert.equal(state.phase, 'passed');
    assert.equal(state.cart, crossings[level].bays);
    assert.ok(state.peak > 0 && state.peak <= 1);
  }
});
test('a missing deck and an unsupported span fail in different ways and can be repaired', () => {
  const s = newBridge();
  startBridge(s);
  advanceBridge(s, 3);
  assert.equal(s.reason, 'gap');
  repairBridge(s);
  s.deck.fill(true);
  startBridge(s);
  advanceBridge(s, 12);
  assert.equal(s.reason, 'sag');
  assert.ok(s.peak > 1);
  repairBridge(s);
  assert.ok(togglePart(s, 'post', 1));
  startBridge(s);
  advanceBridge(s, 12);
  assert.equal(s.phase, 'passed');
});
test('the construction budget is enforced, and the spring deck reacts to moving and bracing the load', () => {
  const s = newBridge(2);
  s.deck.fill(true);
  const initial = deflections(s, 2),
    moved = deflections(s, 3);
  assert.ok(initial[2] > moved[2]);
  assert.equal(initial[0], 0);
  assert.equal(togglePart(s, 'post', 0), false);
  assert.equal(togglePart(s, 'post', 2), true);
  assert.ok(deflections(s, 2)[2] < initial[2]);
  assert.equal(togglePart(s, 'post', 3), false);
  assert.equal(togglePart(s, 'post', 2), true);
  assert.equal(togglePart(s, 'post', 3), true);
});
test('restoring partway through the real crossing retains load, progress and the layout', () => {
  const s = newBridge();
  s.deck.fill(true);
  togglePart(s, 'post', 1);
  startBridge(s);
  advanceBridge(s, 0.8);
  const resumed = restoreBridge(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(resumed, s);
  advanceBridge(s, 5);
  advanceBridge(resumed, 5);
  assert.deepEqual(resumed, s);
  assert.deepEqual(restoreBridge({ ...s, supports: ['rope', 'post', '', ''] }), newBridge());
});
