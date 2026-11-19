import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rooms,
  suspects,
  newCase,
  readCase,
  walk,
  inspect,
  identify,
  cloak,
  nextPatrol,
} from '../mystery.js';

function route(state, target) {
  const queue = [[state.position, state.turn % 6, []]],
    seen = new Set();
  for (let n = 0; n < queue.length; n++) {
    const [pos, turn, path] = queue[n],
      key = pos + ',' + turn;
    if (pos === target) return path;
    if (seen.has(key)) continue;
    seen.add(key);
    for (let to = 0; to < rooms.length; to++) {
      const distance = Math.abs((to % 3) - (pos % 3)) + Math.abs(Math.floor(to / 3) - Math.floor(pos / 3));
      if (distance > 1 || to === nextPatrol({ turn })) continue;
      queue.push([to, (turn + 1) % 6, [...path, to]]);
    }
  }
  assert.fail('No safe path to room ' + target);
}
function visit(s, target) {
  for (const to of route(s, target)) walk(s, to);
  assert.equal(s.position, target);
  return inspect(s);
}
test('every culprit and stash can be deduced and reached with every hero', () => {
  assert.equal(new Set(suspects.map((x) => x.stamp + ' ' + x.ribbon)).size, 4);
  for (const hero of ['kirill', 'maxim', 'mom', 'dad', 'pasha']) {
    for (let who = 0; who < 4; who++)
      for (let where = 0; where < 3; where++) {
        const randoms = [(who + 0.2) / 4, (where + 0.2) / 3];
        let s = newCase(hero, () => randoms.shift());
        assert.equal(s.culprit, who);
        assert.equal(identify(s, who), '');
        assert.match(visit(s, 0), new RegExp(suspects[who].stamp));
        assert.match(visit(s, 5), new RegExp(suspects[who].ribbon));
        s = readCase(structuredClone(s), hero);
        assert.equal(s.clues, 3);
        assert.match(visit(s, 7), new RegExp(rooms[s.stash].name));
        assert.match(identify(s, (who + 1) % 4), /приметы/);
        assert.equal(s.identified, false);
        assert.match(identify(s, who), /Верно/);
        assert.match(visit(s, s.stash), /Изумруд найден/);
        assert.equal(s.done, true);
        assert.equal(s.misses, 1);
      }
  }
});
test('patrol sends a visible investigator to the entrance and respects invisibility', () => {
  const s = newCase('mom');
  s.position = 4;
  inspect(s);
  walk(s, 5);
  assert.equal(s.position, 1);
  s.position = 5;
  assert.equal(cloak(s), true);
  walk(s, 8);
  assert.equal(s.position, 8);
  assert.equal(s.veil, 2);
  assert.equal(cloak(s), false);
  assert.equal(cloak(newCase('pasha')), false);
});
test('blocked jumps and corrupt snapshots are rejected', () => {
  const s = newCase('dad');
  assert.match(walk(s, 8), /соседний/);
  assert.equal(s.turn, 0);
  for (const entry of [
    { ...s, position: 99 },
    { ...s, clues: 9 },
    { ...s, identified: true },
    { ...s, done: true },
    { ...s, hero: 'pasha' },
  ]) {
    assert.deepEqual(
      readCase(entry, 'dad', () => 0),
      newCase('dad', () => 0),
    );
  }
});
