import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../games/block-maze/engine.js';

function place(actor, [x, y]) {
  Object.assign(actor, { x, y, dir: null, target: null });
}

// Start an encounter on real floor tiles. Other monsters stay stunned so any lost life has one cause.
function encounter(level, playerTile, kind, monsterTile) {
  const game = createGame('kirill', level);
  const { state } = game;
  game.start();
  game.turn('right');
  game.update(1 / 60);
  place(state.player, playerTile);
  const monster = state.monsters.find((actor) => actor.type === kind);
  for (const actor of state.monsters) actor.stun = 20;
  if (kind) {
    assert.ok(monster, kind);
    place(monster, monsterTile);
    monster.stun = 0;
    monster.skillCooldown = 0;
  }
  return { game, state, monster };
}

function until(game, condition, description) {
  for (let i = 0; i < 360 && !condition(); i++) game.update(1 / 60);
  assert.ok(condition(), description);
}

for (const [level, type, origin, player, projectile, direction] of [
  ['store', 'skeleton', [10, 13], [7, 13], 'arrow', 'left'],
  ['nether', 'ghast', [9, 6], [12, 6], 'fireball', 'right'],
]) {
  test(type + ' locks its aim before releasing a projectile that must travel to the hero', () => {
    const { game, state, monster } = encounter(level, player, type, origin);
    until(game, () => monster.windup > 0, 'aiming');
    assert.equal(monster.aim.dir, direction);
    assert.equal(monster.shot, null);
    assert.equal(state.effects.length, 0);
    const shot = () => state.effects.find((effect) => effect.type === projectile);
    until(game, shot, 'projectile released');
    assert.equal(shot().dir, direction);
    assert.equal(shot().y, player[1]);
    assert.equal(state.lives, 3);
    if (type === 'ghast') {
      until(
        game,
        () => shot() && state.map[Math.round(shot().y)][Math.round(shot().x)] === '~',
        'fireball over lava',
      );
    }
    until(game, () => state.lives === 2, 'impact');
    assert.equal(state.effects.length, 0);
  });
}

test('a primed creeper warns about the cells it will hit and the hero can escape its blast', () => {
  for (const escape of [false, true]) {
    const { game, state, monster } = encounter('temple', [7, 13], 'creeper', [8, 13]);
    until(game, () => monster.windup > 0, 'lit fuse');
    const cells = structuredClone(monster.cells);
    assert.ok(cells.some(([x, y]) => x === 7 && y === 13));
    assert.deepEqual(state.blastBursts, []);
    if (escape) game.turn('left');
    until(game, () => state.blastBursts.length > 0, 'detonation');
    assert.deepEqual(state.blastBursts[0].cells, cells);
    assert.equal(state.lives, escape ? 3 : 2);
  }
});

test('an enderman lands on the marked floor and cancels if the hero occupies it first', () => {
  for (const occupied of [false, true]) {
    const { game, state, monster } = encounter('store', [7, 13], 'enderman', [20, 13]);
    until(game, () => monster.windup > 0, 'marked exit');
    const dest = [monster.aim.x, monster.aim.y];
    assert.equal(state.map[dest[1]][dest[0]], '.');
    assert.deepEqual([monster.x, monster.y], [20, 13]);
    if (occupied) place(state.player, dest);
    until(game, () => monster.windup === 0, 'end of teleport');
    assert.deepEqual([monster.x, monster.y], occupied ? [20, 13] : dest);
    assert.equal(Boolean(monster.teleport), !occupied);
    assert.equal(state.lives, 3);
  }
});

test('a magma cube compresses and crosses actual lava to its announced landing tile', () => {
  const { game, state, monster } = encounter('nether', [12, 6], 'magma_cube', [9, 6]);
  until(game, () => monster.windup > 0, 'compressing');
  const target = [monster.aim.x, monster.aim.y];
  assert.deepEqual(target, [12, 6]);
  assert.equal(monster.leap, null);
  game.turn('down');
  until(
    game,
    () => monster.leap && state.map[Math.round(monster.y)][Math.round(monster.x)] === '~',
    'midair above lava',
  );
  assert.ok(monster.leap.progress > 0 && monster.leap.progress < 1);
  until(game, () => monster.landing, 'landed');
  assert.deepEqual([monster.landing.x, monster.landing.y], target);
  assert.equal(state.lives, 3);
});

test('the End dragon dives onto its marked tiles and lingering clouds punish only the hero who stays', () => {
  for (const escape of [false, true]) {
    const { game, state } = encounter('end', [11, 13]);
    until(game, () => state.dragon.phase === 'warning', 'warning');
    const cells = structuredClone(state.dragon.cells);
    assert.ok(cells.some(([x, y]) => x === 11 && y === 13));
    assert.deepEqual(state.effects, []);
    if (escape) game.turn('up');
    until(game, () => state.dragon.phase === 'dive', 'dive');
    assert.deepEqual(state.dragon.cells, cells);
    if (escape) {
      until(game, () => state.dragon.phase === 'climb', 'completed pass');
      const clouds = state.effects.filter((effect) => effect.type === 'dragon_breath');
      assert.equal(clouds.length, 3);
      assert.deepEqual(
        clouds.map(({ x, y }) => [x, y]),
        cells,
      );
      assert.ok(clouds.every((cloud) => cloud.remaining > 1));
      game.update(3.1);
      assert.ok(!state.effects.some((effect) => effect.type === 'dragon_breath'));
      assert.equal(state.lives, 3);
    } else {
      until(game, () => state.lives === 2, 'breath hit');
      assert.equal(state.dragon.phase, 'patrol');
      assert.deepEqual(state.effects, []);
    }
  }
});
