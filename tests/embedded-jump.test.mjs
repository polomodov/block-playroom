import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, restoreRun } from '../games/block-jump/physics.js';

// Distance in world pixels at which to press jump on each course. The driver
// uses the visible terrain and enemies; the game handles every collision.
const takeoffLead = { temple: 16, arcade: 16, waterpark: 38, store: 16, nether: 22, castle: 38, end: 15 };

function needsJump(state, lead) {
  const { player, level, enemies } = state;
  const feet = player.y + player.h;
  const center = player.x + player.w / 2;
  const bank = level.platforms.findLast(
    (platform) =>
      Math.abs(platform.y - feet) < 0.1 &&
      player.x + player.w > platform.x &&
      player.x < platform.x + platform.w,
  );
  const edge = bank.x + bank.w;
  const nextBank = level.platforms.some(
    (platform) => platform.kind !== 'ledge' && platform.x === edge && platform.y >= feet,
  );
  const stepAhead = level.platforms.some(
    (platform) =>
      platform.kind !== 'ledge' &&
      platform.y < feet - 0.1 &&
      platform.y > feet - 80 &&
      platform.x > player.x &&
      platform.x - center < lead + 7,
  );
  const enemyAhead = enemies.some(
    (enemy) =>
      enemy.alive &&
      !enemy.stun &&
      enemy.x + enemy.w > player.x &&
      enemy.x - center < lead + 13 &&
      enemy.y < feet + 2 &&
      enemy.y + enemy.h > feet - 33,
  );
  return (!nextBank && edge - center < lead) || stepAhead || enemyAhead;
}

// On descent, release right if continuing at running speed would overshoot a safe landing.
function canLand({ player, level }, horizontalSpeed) {
  const feet = player.y + player.h;
  const gravity = 830;
  return level.platforms.some((platform) => {
    const drop = platform.y - feet;
    if (drop < 0) return false;
    const seconds = (Math.sqrt(player.vy ** 2 + 2 * gravity * drop) - player.vy) / gravity;
    const x = player.x + horizontalSpeed * seconds;
    return x + player.w - 1 > platform.x && x + 1 < platform.x + platform.w;
  });
}

for (const [level, lead] of Object.entries(takeoffLead)) {
  test('platformer: a saved midair run still reaches the flag in ' + level, () => {
    for (const hero of ['kirill', 'maxim', 'mom', 'dad', 'pasha']) {
      let run = createRun(level, hero);
      let resumed = false;
      let jump = false;
      for (let frame = 0; frame < 1800 && run.state.status === 'playing'; frame++) {
        const { state } = run;
        if (state.player.onGround) jump = !jump && needsJump(state, lead);
        const brake =
          !state.player.onGround && state.player.vy > 40 && !canLand(state, 132) && canLand(state, 0);
        run.update(1 / 60, { jump, right: !brake });
        if (!resumed && state.checkpointReached && jump && state.player.vy < 0) {
          const saved = JSON.parse(JSON.stringify(run.snapshot()));
          run = restoreRun(saved);
          assert.ok(run, hero + ': mid-jump save was rejected');
          assert.deepEqual(run.snapshot(), saved);
          resumed = true;
        }
      }
      assert.ok(resumed, hero + ': the route must continue from a real checkpoint');
      assert.equal(run.state.status, 'won', hero);
      assert.equal(run.state.lives, 3, hero);
      assert.ok(run.state.collected > 0 && run.state.collected < run.state.gems.length, hero);
      assert.equal(run.snapshot(), null);
    }
  });
}

test('the End dragon telegraphs a patch of ground and a runner can escape before the breath lands', () => {
  const warned = createRun('end', 'maxim');
  warned.update(1 / 3, { right: true });
  for (let i = 0; i < 600 && warned.state.dragon.phase !== 'warning'; i++) warned.update(1 / 120);
  assert.equal(warned.state.dragon.phase, 'warning');
  const save = warned.snapshot();
  const dodging = restoreRun(save);
  dodging.update(0.62, { right: true });
  assert.deepEqual(dodging.state.dragon.targets, warned.state.dragon.targets);
  assert.deepEqual(dodging.state.dragon.clouds, []);
  assert.ok(
    dodging.state.player.x >
      Math.max(...warned.state.dragon.targets.map((target) => target.x + target.radius)),
  );
  for (let i = 0; i < 480 && dodging.state.dragon.clouds.length < 3; i++) dodging.update(1 / 120);
  assert.equal(dodging.state.dragon.clouds.length, 3);
  assert.equal(dodging.state.lives, 3);
  for (let i = 0; i < 480 && warned.state.lives === 3; i++) warned.update(1 / 120);
  assert.equal(warned.state.lives, 2);
  assert.equal(warned.state.player.x, warned.state.level.spawn.x);
});
