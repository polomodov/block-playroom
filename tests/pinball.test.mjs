import test from 'node:test';
import assert from 'node:assert/strict';
import { newPinball, launchPinball, tickPinball, restorePinball, flipper, tables } from '../pinball.js';

test('the one-way gate admits every serve and keeps scored balls out of the launch lane on all seven tables', () => {
  assert.equal(Object.keys(tables).length, 7);
  for (const table of Object.keys(tables)) {
    for (let power = 55; power <= 100; power++) {
      const state = newPinball('kirill', table);
      state.power = power;
      let reached = false,
        served = 0;
      for (let i = 0; i < 120 * 150 && state.phase !== 'done'; i++) {
        if (state.phase === 'serve') {
          assert.ok(launchPinball(state));
          served++;
        }
        tickPinball(state);
        reached ||= state.ball.x < 300;
      }
      assert.ok(reached);
      assert.equal(served, 3, table + ' at ' + power + '%');
      assert.equal(state.balls, 0);
      assert.equal(state.phase, 'done');
    }
  }
});
test('moving flippers impart upward velocity on both sides', () => {
  for (const i of [0, 1]) {
    const s = newPinball();
    launchPinball(s);
    const [x, y, ex, ey] = flipper(i, s.angles[i]);
    s.ball = { x: x + (ex - x) * 0.8, y: y + (ey - y) * 0.8 - 10.8, vx: 0, vy: 50 };
    for (let n = 0; n < 3; n++) tickPinball(s, i === 0, i === 1);
    assert.ok(s.ball.vy < -150);
    assert.ok(s.angles[i] < 0.48);
  }
});
test('normal ball play can activate the Typhoon by lighting three bumpers', () => {
  const s = newPinball('mom');
  for (let i = 0; i < 120 * 100 && s.bonus === 0; i++) {
    if (s.phase === 'serve') launchPinball(s);
    const { x, y, vy } = s.ball;
    tickPinball(s, y > 375 && vy > 0 && x < 160, y > 375 && vy > 0 && x > 160);
  }
  assert.equal(s.bonus, 1);
  assert.equal(s.phase, 'ride');
  assert.ok(s.score >= 375);
  const resumed = restorePinball(JSON.parse(JSON.stringify(s)), 'mom');
  for (let i = 0; i < 150; i++) {
    tickPinball(s);
    tickPinball(resumed);
  }
  assert.deepEqual(resumed, s);
  assert.equal(s.phase, 'play');
});
test('shulker on the End table captures and spits the ball into the upper field', () => {
  const s = newPinball('pasha', 'end');
  launchPinball(s);
  s.ball = { x: 154, y: 183, vx: 1, vy: 0 };
  tickPinball(s);
  assert.equal(s.phase, 'ride');
  for (let i = 0; i < 146; i++) tickPinball(s);
  assert.equal(s.phase, 'play');
  assert.ok(s.ball.y < 85);
  assert.ok(s.ball.vx > 100);
  assert.ok(s.lock > 1);
});
test('corrupt physics and saves for another player return to the plunger', () => {
  const s = newPinball('mom', 'end');
  launchPinball(s);
  assert.equal(restorePinball({ ...s, ball: { ...s.ball, x: Infinity } }, 'mom').phase, 'serve');
  assert.equal(restorePinball(s, 'dad').hero, 'dad');
});

test('each table awards a bonus from an ordinary launch and flipper strikes', () => {
  for (const table of Object.keys(tables)) {
    let won = false;
    for (let power = 55; power <= 100 && !won; power++) {
      const s = newPinball('maxim', table);
      s.power = power;
      for (let i = 0; i < 120 * 60 && s.phase !== 'done' && !s.bonus; i++) {
        if (s.phase === 'serve') launchPinball(s);
        const { x, y, vy } = s.ball;
        tickPinball(s, y > 375 && vy > 0 && x < 160, y > 375 && vy > 0 && x >= 160);
      }
      if (s.bonus) {
        won = true;
        assert.equal(s.phase, 'ride');
        assert.deepEqual(restorePinball(s, 'maxim'), s);
      }
    }
    assert.ok(won, table);
  }
});
