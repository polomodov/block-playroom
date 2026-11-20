import test from 'node:test';
import assert from 'node:assert/strict';
import { menu, newCafe, restoreCafe, advanceCafe, stovePhase, useStation, ticket, serve } from '../cafe.js';

function open(shift = 0, previous = 0) {
  const state = newCafe(shift, previous);
  state.phase = 'open';
  advanceCafe(state, 0);
  return state;
}
test('prepare exact orders through all three shifts and carry forward twelve guests', () => {
  let total = 0;
  for (let shift = 0; shift < 3; shift++) {
    const s = open(shift, total);
    for (let i = 0; s.phase === 'open'; i++) {
      while (s.orders[i] === undefined) advanceCafe(s, 0.25);
      for (const food of ticket(s, i)) {
        useStation(s, food);
        advanceCafe(s, menu[food].time + 0.01);
        useStation(s, food);
      }
      assert.ok(serve(s, i));
      assert.equal(serve(s, i), false);
    }
    assert.equal(s.phase, 'won');
    assert.equal(s.lost, 0);
    total = s.previous + s.sent;
  }
  assert.equal(total, 12);
});
test('a half-cooked dish resumes at the same time, spoils and can be cooked again', () => {
  const s = open();
  useStation(s, 0);
  advanceCafe(s, 2);
  const restored = restoreCafe(JSON.parse(JSON.stringify(s)));
  assert.equal(stovePhase(restored, 0), 'making');
  assert.equal(serve(restored, 0), false);
  advanceCafe(restored, 2);
  assert.equal(stovePhase(restored, 0), 'ready');
  advanceCafe(restored, 8);
  assert.equal(stovePhase(restored, 0), 'spoiled');
  useStation(restored, 0);
  assert.equal(restored.burnt, 1);
  assert.equal(stovePhase(restored, 0), 'empty');
  assert.equal(s.time, 2);
});
test('when too many guests leave, retry the current shift; invalid saves start in the briefing', () => {
  const s = open(2, 7);
  advanceCafe(s, 60);
  assert.equal(s.phase, 'retry');
  assert.deepEqual(restoreCafe(s), s);
  assert.deepEqual(restoreCafe({ ...s, sent: 10 }), newCafe());
});
