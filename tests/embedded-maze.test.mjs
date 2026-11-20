import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, restoreGame } from '../games/block-maze/engine.js';

test('the last emerald advances the maze campaign and the saved successor agrees with the live game', () => {
  const levels = ['temple', 'arcade', 'waterpark', 'store', 'nether', 'castle', 'end'];
  for (const [index, id] of levels.entries()) {
    const original = createGame('mom', id);
    original.start();
    original.activate();
    // A saved position just before the last pickup. The remaining gem is a real floor tile.
    const save = original.snapshot();
    const { player } = save.progress;
    const last = player.y * original.state.width + player.x + 1;
    assert.ok(save.progress.gems.includes(last), id);
    save.progress.gems = [last];
    save.progress.lives = 2;
    const run = restoreGame(JSON.parse(JSON.stringify(save)));
    run.resume();
    run.turn('right');
    run.update(0.4);
    assert.equal(run.state.status, 'won', id);
    assert.equal(run.state.collected, run.state.totalGems);
    assert.equal(run.snapshot(), null);

    const next = run.nextSnapshot();
    if (id === 'end') {
      assert.equal(next, null);
      assert.equal(run.nextLevel(), false);
    } else {
      assert.equal(next.level, levels[index + 1]);
      assert.equal(next.hero, 'mom');
      assert.equal(next.progress.lives, 2);
      assert.ok(next.progress.cooldown > 29);
      assert.equal(next.progress.invisible, 0);
      const resumed = restoreGame(JSON.parse(JSON.stringify(next)));
      resumed.resume();
      assert.equal(run.nextLevel(), true);
      assert.deepEqual(resumed.state, run.state);
    }
  }
});

test('saving halfway through the Typhoon preserves the ride, its exit and the next pickup', () => {
  const game = createGame('maxim', 'waterpark');
  const { ride, width } = game.state;
  const [x, y] = ride.entry;
  game.start();
  Object.assign(game.state.player, { x: x - 1, y });
  game.turn('right');
  game.update(0.1);
  game.turn(ride.direction);
  game.update(0.2);
  assert.ok(game.state.rideRemaining > 0);
  const save = JSON.parse(JSON.stringify(game.snapshot()));
  const restored = restoreGame(save);
  restored.update(20);
  assert.deepEqual(restored.snapshot(), save);
  restored.resume();
  for (const run of [game, restored]) {
    assert.equal(run.activate(), false);
    const nextGem = ride.exit[1] * width + ride.exit[0] + 1;
    assert.ok(run.state.gems.has(nextGem));
    const before = run.state.collected;
    run.update(ride.duration);
    assert.equal(run.state.rideRemaining, 0);
    assert.deepEqual([run.state.player.x, run.state.player.y], ride.exit);
    run.turn('right');
    run.update(0.3);
    assert.ok(!run.state.gems.has(nextGem));
    assert.equal(run.state.collected, before + 1);
  }
  assert.deepEqual(restored.snapshot(), game.snapshot());
});

test('a nearby zombie becomes harmless only when Pasha plays, then the cooldown freezes on pause', () => {
  for (const plays of [false, true]) {
    const game = createGame('pasha');
    game.start();
    game.turn('right');
    game.update(0.1);
    const zombie = game.state.monsters.find((m) => m.type === 'zombie');
    Object.assign(zombie, { x: 12, y: 11, dir: 'left', target: [11, 11] });
    if (plays) assert.ok(game.activate());
    game.update(0.3);
    assert.equal(game.state.lives, plays ? 3 : 2);
    if (plays) {
      assert.ok(zombie.dance > 4 && game.state.collected > 0);
      assert.equal(game.activate(), false);
      game.pause();
      const cooldown = game.state.cooldown;
      game.update(30);
      assert.equal(game.state.cooldown, cooldown);
    }
  }
});
