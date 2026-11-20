import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  investigations,
  newCase,
  readCase,
  walk,
  inspect,
  identify,
  cloak,
  nextPatrol,
} from '../mystery.js';

function route(state, target) {
  const { rooms, closed, patrol } = investigations[state.level];
  const queue = [[state.position, state.turn % patrol.length, []]],
    seen = new Set();
  for (let n = 0; n < queue.length; n++) {
    const [pos, turn, path] = queue[n],
      key = pos + ',' + turn;
    if (pos === target) return path;
    if (seen.has(key)) continue;
    seen.add(key);
    for (let to = 0; to < rooms.length; to++) {
      const distance = Math.abs((to % 3) - (pos % 3)) + Math.abs(Math.floor(to / 3) - Math.floor(pos / 3));
      if (distance > 1 || closed.includes(to) || to === nextPatrol({ turn, level: state.level })) continue;
      queue.push([to, (turn + 1) % patrol.length, [...path, to]]);
    }
  }
  assert.fail('No safe path to room ' + target);
}
function visit(s, target) {
  for (const to of route(s, target)) walk(s, to);
  assert.equal(s.position, target);
  return inspect(s);
}
for (const [level, file] of investigations.entries()) {
  test(file.world + ' — все 12 дел решаются каждым из пяти героев', () => {
    assert.equal(new Set(file.suspects.map((x) => x.stamp + ' ' + x.ribbon)).size, 4);
    for (const hero of ['kirill', 'maxim', 'mom', 'dad', 'pasha']) {
      for (const [who, suspect] of file.suspects.entries()) {
        for (const [where, stash] of file.stashes.entries()) {
          const randoms = [(who + 0.2) / 4, (where + 0.2) / 3];
          let s = newCase(hero, () => randoms.shift(), level);
          assert.equal(s.culprit, who);
          assert.equal(s.stash, stash);
          assert.equal(identify(s, who), '');
          assert.match(visit(s, file.clues[0]), new RegExp(suspect.stamp));
          assert.match(visit(s, file.clues[1]), new RegExp(suspect.ribbon));
          const restored = readCase(structuredClone(s), hero);
          assert.deepEqual(restored, s);
          s = restored;
          assert.match(visit(s, file.clues[2]), new RegExp(file.rooms[stash].name));
          assert.match(identify(s, (who + 1) % 4), /приметы/);
          assert.equal(s.identified, false);
          assert.match(identify(s, who), /Верно/);
          assert.match(visit(s, stash), /Изумруд найден/);
          assert.equal(s.done, true);
          assert.equal(s.misses, 1);
        }
      }
    }
  });
}

test('старое дело без номера мира продолжает тот же патруль и улики в магазине', () => {
  const original = newCase('dad', () => 0.4);
  visit(original, 0);
  const legacy = structuredClone(original);
  delete legacy.level;
  assert.deepEqual(readCase(legacy, 'dad'), original);
});

test('закрытая переправа не тратит ход и не переносит героя', () => {
  const file = investigations[3];
  const s = newCase('mom', () => 0, 3);
  const blocked = file.closed[0];
  assert.match(walk(s, blocked), /закрыт/);
  assert.equal(s.position, file.entrance);
  assert.equal(s.turn, 0);
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
