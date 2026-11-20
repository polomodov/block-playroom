import test from 'node:test';
import assert from 'node:assert/strict';
import { createTactics, tacticsTurn as act, plans, steps, missions } from '../tactics.js';

test('each hero can move once and the forecast matches the guards after their turn', () => {
  let s = createTactics(['mom', 'pasha']);
  const predicted = plans(s).map((g) => g.to);
  s = act(s, { type: 'move', cell: 1 });
  assert.equal(s.active, 1);
  assert.deepEqual(s.used, [true, false]);
  assert.equal(act(s, { type: 'select', index: 0 }), s);
  s = act(s, { type: 'move', cell: 25 });
  s = act(s, { type: 'end' });
  assert.deepEqual(
    plans(s).map((g) => g.from),
    predicted,
  );
  assert.deepEqual(s.used, [false, false]);
  assert.deepEqual(createTactics(s.team, JSON.parse(JSON.stringify(s))), s);
});
test('different family abilities change movement, exposure and forecast', () => {
  let s = createTactics(['kirill', 'mom']);
  s = act(s, { type: 'skill' });
  assert.ok(steps(s).includes(2));
  s = act(s, { type: 'move', cell: 2 });
  s.positions[1] = 8;
  s = act(s, { type: 'skill' });
  s = act(s, { type: 'move', cell: 9 });
  assert.equal(act(s, { type: 'end' }).health, 4);
  for (const hero of ['pasha', 'maxim', 'dad']) {
    let v = createTactics([hero, 'kirill']);
    v.positions[0] = 8;
    v = act(v, { type: 'skill' });
    assert.equal(plans(v)[0].to, null);
    if (hero === 'dad') assert.equal(v.guards[0].dir, -1);
    assert.deepEqual(createTactics(v.team, v), v);
  }
});
test('patrol costs hearts and returns the caught player, retry preserves the campaign', () => {
  let s = createTactics(['kirill', 'maxim']);
  s.positions[0] = plans(s)[0].to;
  s.health = 1;
  s = act(s, { type: 'end' });
  assert.equal(s.phase, 'lost');
  s = act(s, { type: 'retry' });
  assert.equal(s.phase, 'play');
  assert.equal(s.totalTurns, 1);
  assert.equal(s.health, 4);
});
// A player can solve the three missions using the signposted patrol alone.
function pathToGoal(s) {
  const board = missions[s.level].map.join('');
  const targets = s.gems.length ? s.gems : [board.indexOf('G')];
  const future = [];
  let f = structuredClone(s);
  for (let n = 0; n < 24; n++) {
    future.push(plans(f).map((g) => g.to));
    f = act(f, { type: 'end' });
  }
  const start = s.positions[s.active],
    queue = [[start, []]],
    seen = new Set();
  for (let head = 0; head < queue.length; head++) {
    const [pos, path] = queue[head],
      turn = path.length;
    if (path.length && targets.includes(pos)) return path[0];
    if (turn >= future.length) continue;
    for (const dest of [...steps({ ...s, positions: [pos, pos] }), pos]) {
      const key = turn + 1 + ',' + dest;
      if (seen.has(key) || future[turn].includes(dest)) continue;
      seen.add(key);
      queue.push([dest, [...path, dest]]);
    }
  }
  throw Error('no route');
}
test('all three missions can be played to completion through normal moves', () => {
  let s = createTactics(['mom', 'maxim']);
  for (let i = 0; i < 140 && s.phase !== 'won'; i++) {
    if (s.phase === 'clear') {
      s = act(s, { type: 'next' });
      continue;
    }
    assert.equal(s.phase, 'play');
    const dest = pathToGoal(s);
    if (dest !== s.positions[s.active]) s = act(s, { type: 'move', cell: dest });
    if (s.phase === 'play') s = act(s, { type: 'end' });
  }
  assert.equal(s.phase, 'won');
  assert.equal(s.gems.length, 0);
  assert.deepEqual(createTactics(['kirill', 'dad'], { version: 1 }), createTactics(['kirill', 'dad']));
});
