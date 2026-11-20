import test from 'node:test';
import assert from 'node:assert/strict';
import { titles } from '../progress.js';
import { rooms } from '../coop.js';
import { GOLF_COURSES } from '../golf.js';
import { investigations } from '../mystery-cases.js';
import { songs } from '../rhythm.js';
import { courses } from '../race.js';
import { crossings } from '../bridge.js';
import { missions } from '../tactics.js';
import { shifts } from '../cafe.js';
import { encounters } from '../cards.js';
import { tables } from '../pinball.js';
import { assignments } from '../photo.js';
import { warehouses } from '../robot.js';
import { LEVELS as maze } from '../games/block-maze/levels.js';
import { LEVELS as jump } from '../games/block-jump/levels.js';
import { WORLDS as dash } from '../games/block-dash/worlds.js';

const catalogs = {
  coop: rooms, golf: GOLF_COURSES, mystery: investigations, rhythm: songs, race: courses,
  bridge: crossings, tactics: missions, cafe: shifts, cards: encounters,
  pinball: tables, photo: assignments, robot: warehouses,
  'block-maze': maze, 'block-jump': jump, 'block-dash': dash,
};

test('каждая игра из меню содержит как минимум семь отдельных именованных уровней', () => {
  assert.deepEqual(Object.keys(catalogs).sort(), Object.keys(titles).sort());
  for (const [game, catalog] of Object.entries(catalogs)) {
    const levels = Object.values(catalog);
    const names = levels.map((level) => level.name || level.title);
    assert.ok(names.length >= 7, titles[game]);
    assert.ok(names.every((name) => typeof name === 'string' && name.trim()), titles[game]);
    assert.equal(new Set(names).size, names.length, titles[game]);
  }
});
