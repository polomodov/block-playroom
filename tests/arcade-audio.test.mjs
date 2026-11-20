import test from 'node:test';
import assert from 'node:assert/strict';
import { monsterAudio } from '../games/arcade-audio.js';
import { arcadeSounds } from '../sound-arcades.js';
import { createGame } from '../games/block-maze/engine.js';
import { createRun } from '../games/block-dash/engine.js';

test('a live maze creeper hisses once during preparation and bursts once on detonation', () => {
  const game = createGame('kirill', 'temple');
  game.start();
  game.turn('right');
  game.update(1 / 60);
  const { state } = game;
  Object.assign(state.player, { x: 7, y: 13, dir: null, target: null });
  for (const monster of state.monsters) monster.stun = 20;
  Object.assign(state.monsters.find(m => m.type === 'creeper'), {
    x: 8, y: 13, dir: null, target: null, stun: 0, skillCooldown: 0,
  });
  const sounds = [];
  const warnings = monsterAudio(cue => sounds.push(cue));
  warnings.reset(state);
  for (let i = 0; i < 100; i++) {
    game.update(1 / 60);
    warnings.update(state);
    if (i === 20) warnings.reset(state); // Pause and resume in the middle of the fuse.
  }
  assert.deepEqual(sounds, ['fuse', 'blast']);
});

test('an existing platformer pose is silent on resume, new poses sound and repeat only after release', () => {
  const sounds = [];
  const warnings = monsterAudio(cue => sounds.push(cue));
  const enemy = { action: { kind: 'draw' } };
  const state = { status: 'playing', enemies: [enemy], monsterEffects: [] };
  warnings.reset(state);
  for (const kind of ['draw', 'release', 'draw', 'draw', 'blinkOut', 'inhale', 'compress']) {
    enemy.action.kind = kind;
    warnings.update(state);
  }
  assert.deepEqual(sounds, ['bow', 'portal', 'ghast', 'cube']);
  for (const cue of sounds) assert.ok(arcadeSounds['arcade-' + cue]?.length);
});

test('runner warns on the first actual dive or approaching Nether fireball', () => {
  for (const [worldId, expected] of [['end', 'dragon'], ['nether', 'ghast']]) {
    const run = createRun({ worldId, heroId: 'mom', seed: 22 });
    const sounds = [];
    const warnings = monsterAudio(cue => sounds.push(cue));
    warnings.reset(run.state);
    while (run.state.distance < 110 && run.state.status === 'playing') {
      run.update(1 / 60);
      warnings.update(run.state);
    }
    assert.deepEqual(sounds, [expected], worldId);
  }
});
