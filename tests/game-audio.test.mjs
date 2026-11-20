import test from 'node:test';
import assert from 'node:assert/strict';
import { puzzleSounds } from '../sound-puzzles.js';
import { actionSounds } from '../sound-action.js';
import { arcadeSounds } from '../sound-arcades.js';

test('каждая звуковая подсказка имеет уникальное имя и воспроизводимую партитуру', () => {
  const ids = new Set();
  for (const scores of [puzzleSounds, actionSounds, arcadeSounds]) {
    for (const [id, voices] of Object.entries(scores)) {
      assert.ok(!ids.has(id), id);
      ids.add(id);
      assert.ok(voices.length > 0 && voices.length <= 48, id);
      for (const [wave, delay, from, to, duration, gain] of voices) {
        assert.ok(['sine', 'square', 'triangle', 'sawtooth', 'noise'].includes(wave), id);
        assert.ok([delay, from, to, duration, gain].every(Number.isFinite), id);
        assert.ok(delay >= 0 && duration > 0 && from > 0 && to > 0, id);
        assert.ok(gain > 0.0001 && gain <= 1, id);
      }
    }
  }
});
