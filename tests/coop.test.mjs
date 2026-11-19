import test from 'node:test';
import assert from 'node:assert/strict';
import { rooms, freshRoom, resetRoom, roomWon, loadRoom, stepHero } from '../coop.js';

const pair = ['maxim', 'pasha'];
const directions = ['up', 'down', 'left', 'right'];

// Explore one legal action at a time, keeping the two players distinct. Replay the
// discovered route through the public save format when the partner changes hands.
function solution(start) {
  const queue = [{ state: start, previous: -1, dir: null }];
  const key = (s) => [s.positions[0], s.positions[1], s.latched].join('/');
  const seen = new Set([key(start)]);
  for (let i = 0; i < queue.length; i++) {
    const { state } = queue[i];
    if (roomWon(state)) {
      const moves = [];
      for (let n = i; queue[n].dir; n = queue[n].previous) {
        moves.push([queue[n].state.active, queue[n].dir]);
      }
      return moves.reverse();
    }
    for (const active of [0, 1])
      for (const dir of directions) {
        const next = { ...state, active, positions: [...state.positions] };
        stepHero(next, dir);
        const id = key(next);
        if (seen.has(id)) continue;
        seen.add(id);
        queue.push({ state: next, previous: i, dir });
      }
  }
  return null;
}

for (const [n, room] of rooms.entries()) {
  test(room.place + ' — оба участника могут дойти до выхода и продолжить после перезагрузки', () => {
    assert.ok(room.rows.every((r) => r.length === 9));
    const start = freshRoom(pair, n),
      moves = solution(start);
    assert.ok(moves, 'Путь к обоим выходам');
    assert.equal(new Set(moves.map((m) => m[0])).size, 2);
    let state = start;
    let crossed = false;
    for (const [active, dir] of moves) {
      if (state.active !== active) {
        state.active = active;
        const restored = loadRoom(JSON.parse(JSON.stringify(state)), pair);
        assert.deepEqual(restored, state);
        state = restored;
      }
      const from = state.positions[active];
      stepHero(state, dir);
      assert.notEqual(state.positions[active], from);
      const tile = room.rows.join('')[state.positions[active]];
      if (tile === 'A' || tile === 'B') {
        const partner = room.rows.join('')[state.positions[1 - active]];
        const bit = tile === 'A' ? 1 : 2;
        assert.ok(state.latched & bit || partner === tile.toLowerCase());
        if (partner === tile.toLowerCase()) crossed = true;
      }
    }
    assert.ok(crossed, 'Напарнику пришлось удерживать плиту во время перехода');
    assert.equal(state.steps, moves.length);
    assert.ok(roomWon(state));
    assert.deepEqual(loadRoom(JSON.parse(JSON.stringify(state)), pair), state);
    assert.equal(stepHero(state, 'up'), 'blocked');
    assert.deepEqual(resetRoom(state), freshRoom(pair, n));
  });
}

test('closed gates stop a single hero; resetting preserves the previous rooms’ steps', () => {
  const s = freshRoom(pair, 0, 10);
  s.positions = [21, 19];
  assert.equal(stepHero(s, 'right'), 'gate');
  s.positions[1] = 3;
  assert.equal(stepHero(s, 'right'), 'moved');
  assert.deepEqual(resetRoom(s), freshRoom(pair, 0, 10));
});

test('broken, overlapping or out-of-bounds saves start an intact room', () => {
  const s = freshRoom(pair);
  for (const broken of [
    null,
    { ...s, version: 8 },
    { ...s, room: -1 },
    { ...s, positions: [1, 1] },
    { ...s, players: ['maxim', 'maxim'] },
    { ...s, positions: [130, 11] },
    { ...s, roomSteps: 20 },
  ]) {
    assert.deepEqual(loadRoom(broken, pair), s);
  }
});
