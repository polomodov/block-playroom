import test from 'node:test';
import assert from 'node:assert/strict';
import { newPinball, launchPinball, tickPinball, restorePinball, flipper, tables, pinballFeatures, skillPower } from '../pinball.js';

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

test('each marked charge band earns one skill shot on a real serve through its upper gate', () => {
  for (const table of Object.keys(tables)) {
    const [min, max] = skillPower[table];
    for (let power = min - 1; power <= max + 1; power++) {
      const s = newPinball('mom', table);
      let skills = 0;
      assert.ok(launchPinball(s, power));
      assert.equal(launchPinball(s, 100), false);
      for (let i = 0; i < 300; i++) {
        tickPinball(s, false, false, (kind) => { if (kind === 'skill') skills++; });
      }
      assert.equal(skills, power >= min && power <= max ? 1 : 0, table + ' at ' + power + '%');
      assert.equal(s.skillArmed, false);
    }
  }
});

test('the rubber slings kick into the playfield and cannot double-fire through their lockout', () => {
  for (const side of [0, 1]) {
    const s = newPinball();
    launchPinball(s);
    const [x1, y1, x2, y2] = pinballFeatures.slings[side];
    const inward = side ? -1 : 1;
    const slope = Math.abs((x2 - x1) / (y2 - y1));
    const nx = inward / Math.hypot(1, slope), ny = -slope / Math.hypot(1, slope);
    const incoming = {
      x: (x1+x2)/2 + nx*8, y: (y1+y2)/2 + ny*8,
      vx: -nx*170, vy: -ny*170,
    };
    const events = [];
    const hit = () => {
      Object.assign(s.ball, incoming);
      tickPinball(s, false, false, (kind, i) => events.push([kind, i]));
    };
    hit();
    assert.ok(s.ball.vx * inward > 125);
    assert.ok(s.ball.vy < -100);
    const score = s.score;
    hit();
    assert.equal(s.score, score);
    assert.deepEqual(events, [['sling',side]]);
    assert.ok(s.slings[side] > 0);
  }
});

test('ordinary serves and live flippers complete all three bank targets and collect each table jackpot', () => {
  // These repeatable serves use only the same launch power and two flipper buttons as the UI.
  const routes = {
    aqua: [73, 375], end: [57, 375], temple: [99, 365], arcade: [65, 375],
    store: [76, 375], nether: [99, 385], castle: [85, 375],
  };
  assert.deepEqual(Object.keys(routes), Object.keys(tables));
  for (const [table, [power, flipHeight]] of Object.entries(routes)) {
    const s = newPinball('maxim', table), targets = new Set();
    let armed = false;
    for (let n = 0; n < 4200 && s.phase !== 'done' && !s.jackpots; n++) {
      if (s.phase === 'serve') launchPinball(s, power);
      const {x, y, vy} = s.ball;
      tickPinball(s, y > flipHeight && vy > 0 && x < 160, y > flipHeight && vy > 0 && x >= 160, (kind, i) => {
        if (kind === 'target') targets.add(i);
        if (kind === 'drain' || kind === 'expired') { targets.clear(); armed = false; }
        if (kind === 'armed') {
          assert.equal(targets.size, 3);
          assert.equal(s.jackpotTime, 18);
          armed = true;
        }
        if (kind === 'jackpot') assert.equal(armed, true);
      });
    }
    assert.equal(s.jackpots, 1, table);
    assert.equal(s.multiplier, 2);
    assert.equal(s.bank, 0);
    assert.equal(s.jackpotTime, 0);
  }
});

test('a jackpot pays once per open bank and the next multiplier is lost on timeout or drain', () => {
  const open = () => {
    const s = newPinball();
    launchPinball(s);
    // A ball resting on one switch cannot count as the entire bank.
    for (const [i, [x, y]] of pinballFeatures.bank.entries()) {
      s.ball = {x, y, vx: 0, vy: 0};
      const before = s.score;
      for (let tick = 0; tick < 2; tick++) tickPinball(s);
      assert.equal(s.score, before + 60);
      assert.equal(s.bank, (1 << (i + 1)) - 1);
    }
    return s;
  };
  const [x,y] = pinballFeatures.jackpot;
  for (const multiplier of [1, 2, 3, 4]) {
    const s = open();
    s.multiplier = multiplier;
    const score = s.score;
    s.ball = {x, y, vx: 0, vy: 0};
    tickPinball(s);
    assert.equal(s.score, score + 500 * multiplier);
    assert.equal(s.multiplier, Math.min(multiplier + 1, 4));
    s.ball = {x, y, vx: 0, vy: 0};
    tickPinball(s);
    assert.equal(s.jackpots, 1);
  }
  for (const cause of ['timeout','drain']) {
    const s = open();
    s.multiplier = 3;
    if (cause === 'timeout') s.jackpotTime = 1/120;
    s.ball = {x: 150, y: cause === 'drain' ? 489 : 320, vx: 0, vy: 0};
    const restored = restorePinball(JSON.parse(JSON.stringify(s)), 'kirill');
    tickPinball(s);
    tickPinball(restored);
    assert.deepEqual(restored,s);
    assert.equal(s.jackpotTime, 0);
    assert.equal(s.multiplier, 1);
    assert.equal(s.bank, 0);
    assert.equal(s.jackpots, 0);
    assert.equal(s.event, cause === 'timeout' ? 'expired' : 'drain');
  }
});

test('old v1 pinball saves resume the same ball and score with unlit new targets', () => {
  const s = newPinball('dad', 'nether');
  launchPinball(s);
  for (let i = 0; i < 180; i++) tickPinball(s);
  const previous = structuredClone(s);
  for (const key of ['bank', 'multiplier', 'jackpots', 'jackpotTime', 'slings', 'skillArmed', 'lastSkillTick', 'lastJackpotTick']) {
    delete previous[key];
  }
  const resumed = restorePinball(JSON.parse(JSON.stringify(previous)), 'dad');
  for (const [field, value] of Object.entries(previous)) assert.deepEqual(resumed[field], value, field);
  assert.equal(resumed.bank, 0);
  assert.equal(resumed.multiplier, 1);
  assert.equal(resumed.jackpots, 0);
  assert.equal(resumed.skillArmed, false);
  assert.deepEqual(resumed.slings, [0,0]);
});
