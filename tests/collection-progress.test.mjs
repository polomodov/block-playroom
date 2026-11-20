import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionProgress } from '../progress.js';

const round = { id: 'case-01', mode: 'mystery', players: ['mom'], at: 100, payload: { clues: 3 } };
const library = { slots: { mystery: round }, results: [{ ...round, summary: 'Изумруд найден!' }] };
const arcade = {
  saved: { hero: 'pasha', level: 'end', savedAt: 101 },
  results: [{ hero: 'dad', level: 'temple', outcome: 'over', distance: 324.12, gems: 13, at: 96 }],
};
test('one launcher resumes the latest of seven independent saves, including legacy arcade saves', () => {
  const byId = (id) => (id === 'block-dash' ? arcade : null);
  const data = collectionProgress(library, byId);
  assert.equal(data.latest.href, './games/block-dash/?resume=1');
  assert.deepEqual(
    data.results.map((r) => r.mode),
    ['mystery', 'block-dash'],
  );
  assert.match(data.results[1].summary, /324 м · 13 💎/);
  assert.deepEqual(collectionProgress(library, () => null).latest, round);
  assert.equal(library.results.length, 1);
});
test('collection only displays the most recent 50 results, ignoring malformed or missing saves', () => {
  const existing = Array.from({ length: 55 }, (_, i) => ({ ...round, at: i, summary: 'Изумруд найден!' }));
  const data = collectionProgress({ slots: { mystery: null }, results: [null, ...existing] }, () => ({
    saved: {},
    results: [{ at: 1 }, null],
  }));
  assert.equal(data.latest, undefined);
  assert.equal(data.results.length, 50);
  assert.equal(data.results[0].at, 54);
  assert.equal(data.results.at(-1).at, 5);
  assert.equal(existing.length, 55);
});
