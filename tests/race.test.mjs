import test from 'node:test';
import assert from 'node:assert/strict';
import { newRace, drive, restoreRace, raceRecord, ghostAt, validRecord, courseLength } from '../race.js';

function race(steer, brake = false) {
  const s = newRace('maxim');
  s.phase = 'run';
  for (let i = 0; i < 10000 && s.phase === 'run'; i++) drive(s, steer, brake);
  assert.equal(s.phase, 'finish');
  return s;
}

test('a single lap finishes, records the real trajectory, and steering or braking changes the time', () => {
  const lap = race(0),
    turned = race(-1),
    braked = race(0, true);
  assert.ok(lap.pads > 0);
  assert.ok(braked.ticks > lap.ticks);
  assert.notEqual(turned.ticks, lap.ticks);
  assert.equal(lap.s, courseLength);
  const record = raceRecord(lap);
  assert.ok(validRecord(record));
  assert.deepEqual(ghostAt(record, 0), [0, -9]);
  assert.deepEqual(ghostAt(record, record.ticks + 120), record.samples.at(-1));
  const [a, b] = record.samples.slice(25, 27);
  assert.deepEqual(
    ghostAt(record, 25 * 6 + 3),
    a.map((v, i) => (v + b[i]) / 2),
  );
});
test('restoring mid-corner maintains the lane, boosts, timer and all ghost samples', () => {
  const s = newRace('pasha');
  s.phase = 'run';
  for (let i = 0; i < 324; i++) drive(s, i % 90 < 40 ? -1 : 1);
  const copy = restoreRace(JSON.parse(JSON.stringify(s)), 'pasha');
  assert.deepEqual(s, copy);
  while (s.phase === 'run') {
    drive(s, 0);
    drive(copy, 0);
  }
  assert.deepEqual(s, copy);
  assert.ok(validRecord(raceRecord(copy)));
});
test('invalid and truncated records cannot become a rival', () => {
  const s = newRace('dad');
  s.phase = 'run';
  drive(s);
  assert.equal(restoreRace({ ...s, speed: Infinity }, 'dad').phase, 'grid');
  assert.equal(restoreRace(s, 'mom').phase, 'grid');
  assert.equal(validRecord(raceRecord(s)), false);
  assert.equal(
    validRecord({
      v: 1,
      hero: 'dad',
      ticks: 6,
      samples: [
        [0, 200],
        [10, 0],
      ],
    }),
    false,
  );
});
