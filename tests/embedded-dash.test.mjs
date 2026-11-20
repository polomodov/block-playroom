import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, restoreRun } from '../games/block-dash/engine.js';
import { WORLDS } from '../games/block-dash/worlds.js';

function steerToward(run, lane) {
  if (run.state.player.lane < lane) run.act('right');
  if (run.state.player.lane > lane) run.act('left');
}

test('emerald trails leave a drivable escape lane at full speed in every runner world', () => {
  for (const { id } of WORLDS) {
    for (const seed of [0, 137]) {
      const run = createRun({ worldId: id, heroId: 'kirill', seed });
      const { state } = run;
      // A bounded run also fails if a regression leaves the player at a standstill.
      for (let frame = 0; frame < 4000 && state.status === 'playing' && state.distance < 1500; frame++) {
        if (state.cooldown === 0) run.act('power');
        const gem = state.objects.find(
          (o) => o.kind === 'gem' && o.z > state.distance && o.z < state.distance + 15,
        );
        if (gem) steerToward(run, gem.lane);
        run.update(1 / 30);
      }
      const course = id + ' (seed ' + seed + ')';
      assert.equal(state.lives, 3, course);
      assert.ok(state.distance >= 1500 && state.gems >= 60, course);
    }
  }
});

test('a mid-jump save keeps the guitarist, pursuer and future seeded rows after a cold start', () => {
  const run = createRun({ worldId: 'nether', heroId: 'pasha', seed: 34 });
  run.update(0.9);
  run.act('power');
  run.act('jump');
  run.update(0.18);
  const saved = JSON.parse(JSON.stringify(run.snapshot()));
  const resumed = restoreRun(saved);
  assert.equal(resumed.state.status, 'paused');
  assert.ok(resumed.state.player.jump > 0 && resumed.state.pursuer.dance > 0);
  resumed.update(60);
  assert.deepEqual(resumed.snapshot(), saved);
  resumed.act('resume');
  for (let frame = 0; frame < 300; frame++) {
    if (frame === 2) {
      run.act('slide');
      resumed.act('slide');
    }
    run.update(1 / 30);
    resumed.update(1 / 30);
  }
  assert.ok(resumed.snapshot().row > saved.row);
  assert.deepEqual(resumed.snapshot(), run.snapshot());
});

test('the End dragon warns before its breath and a correctly timed jump avoids the hit', () => {
  const run = createRun({ worldId: 'end', seed: 15 });
  for (let i = 0; i < 600 && run.state.dragon?.phase !== 'warning'; i++) run.update(1 / 60);
  assert.equal(run.state.dragon?.phase, 'warning');
  const cloud = run.state.objects.find((o) => o.kind === 'breath' && o.z === run.state.dragon.z);
  assert.ok(cloud && !cloud.active);
  const saved = run.snapshot();
  for (const jump of [false, true]) {
    const attempt = restoreRun(saved);
    const { state } = attempt;
    attempt.act('resume');
    let jumped = false;
    let approachLives;
    const phases = new Set();
    for (let i = 0; i < 400 && state.distance < cloud.z + 1; i++) {
      steerToward(attempt, cloud.lane);
      if (state.distance < cloud.z) approachLives = state.lives;
      if (jump && !jumped && cloud.z - state.distance <= state.speed * 0.35) {
        jumped = attempt.act('jump');
      }
      if (state.dragon) phases.add(state.dragon.phase);
      attempt.update(1 / 60);
    }
    assert.deepEqual([...phases], ['warning', 'dive', 'recover']);
    const breath = state.objects.find((o) => o.id === cloud.id);
    assert.ok(breath.active && breath.passed);
    assert.equal(breath.hit, !jump);
    assert.equal(state.lives, jump ? approachLives : approachLives - 1);
  }
});
