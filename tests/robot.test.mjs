import test from 'node:test';
import assert from 'node:assert/strict';
import {
  warehouses,
  createRobot,
  compileProgram,
  insertCommand,
  eraseCommand,
  runProgram,
  stepRobot,
  resetRobot,
  restoreRobot,
} from '../robot.js';
const codes = { f: 'forward', l: 'left', r: 'right', '[': 'loop', ']': 'end' };
const make = (text) => [...text].map((c) => codes[c]);
test('every warehouse can deliver all gems with a legal program within its space budget', () => {
  for (const [level, program] of ['fffrffrf', '[fffr]f', '[ffrfl]f'].entries()) {
    const s = createRobot(level);
    for (const cmd of make(program)) assert.equal(insertCommand(s, cmd), true);
    assert.equal(runProgram(s), '');
    while (s.phase === 'run') stepRobot(s);
    assert.equal(s.phase, 'passed');
    assert.equal(s.gems.length, warehouses[level].rows.join('').split('g').length - 1);
    assert.equal(warehouses[level].rows.join('')[s.cell], 'E');
  }
});
test('the three-repeat block carries instruction pointers and rejects incomplete, empty or nested loops', () => {
  const seq = compileProgram(make('[fl]r')).steps;
  assert.deepEqual(
    seq.map((x) => x.index),
    [1, 2, 1, 2, 1, 2, 4],
  );
  for (const invalid of ['', '[]', '[ff', 'f]', '[[f]]']) assert.ok(compileProgram(make(invalid)).error);
});
test('a failed instruction highlights its position, reset keeps the program, and insertion works at the cursor', () => {
  const s = createRobot();
  s.program = make('ffff');
  s.cursor = 4;
  assert.equal(runProgram(s), '');
  while (s.phase === 'run') stepRobot(s);
  assert.equal(s.reason, 'wall');
  assert.equal(s.pc, 4);
  assert.equal(s.gems.length, 1);
  resetRobot(s);
  assert.equal(s.program.length, 4);
  assert.deepEqual(s.gems, []);
  s.cursor = 2;
  assert.equal(insertCommand(s, 'right'), true);
  assert.deepEqual(s.program, make('ffrff'));
  assert.equal(eraseCommand(s), true);
  assert.deepEqual(s.program, make('ffff'));
});
test('suspended loop playback resumes at the same source and warehouse position', () => {
  const s = createRobot(1);
  s.program = make('[fffr]f');
  runProgram(s);
  for (let i = 0; i < 6; i++) stepRobot(s);
  const restored = restoreRobot(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored, s);
  while (s.phase === 'run') {
    stepRobot(s);
    stepRobot(restored);
  }
  assert.equal(restored.phase, 'passed');
  assert.deepEqual(restored, s);
  assert.equal(restoreRobot({ ...s, program: ['bad'] }).level, 0);
});
