import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { collectionProgress, titles } from '../progress.js';

const round = { id: 'case-01', mode: 'mystery', players: ['mom'], at: 100, payload: { clues: 3 } };
const library = { slots: { mystery: round }, results: [{ ...round, summary: 'Изумруд найден!' }] };
const arcade = {
  saved: { hero: 'pasha', level: 'end', savedAt: 101 },
  results: [{ hero: 'dad', level: 'temple', outcome: 'over', distance: 324.12, gems: 13, at: 96 }],
};
test('one launcher resumes the latest across the collection, including legacy arcade saves', () => {
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

test('all fifteen games appear in the catalog, offline release and shared progress', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const entries = Array.from(html.matchAll(/data-(?:game-link|mode)="([a-z-]+)"/g), (hit) => hit[1]);
  assert.equal(entries.length, 15);
  assert.deepEqual(entries.sort(), Object.keys(titles).sort());
  const offline = await readFile(new URL('../offline-files.js', import.meta.url), 'utf8');
  assert.ok(offline.includes('const OFFLINE_GAME_COUNT = ' + entries.length + ';'));
  const newest = { ...round, mode: 'robot', at: 200, id: 'program-01' };
  assert.deepEqual(
    collectionProgress({ slots: { ...library.slots, robot: newest }, results: [] }, () => null).latest,
    newest,
  );
});

test('the launcher has no conflicting bindings across its game imports', () => {
  execFileSync(process.execPath, ['--check', fileURLToPath(new URL('../playroom.js', import.meta.url))]);
});
