import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOLF_COURSES,
  createGolf,
  golfStrike,
  stepGolf,
  nextGolfHole,
  restoreGolf,
  golfSummary,
} from '../golf.js';

const players = ['kirill', 'maxim', 'mom', 'pasha'];
const routes = [
  [[304, 242]],
  [[116, 272]],
  [[324, 183]],
  [
    [149, 218],
    [311, 219],
    [327, 120],
    [462, 127],
  ],
  [
    [266, 175],
    [414, 176],
    [501, 179],
  ],
  [
    [496, 155],
    [462, 115],
    [255, 62],
  ],
  [[243, 184]],
];

function strikeToward(game, [x, y]) {
  const ball = game.balls[game.turn],
    dx = x - ball.x,
    dy = y - ball.y;
  game.angle = Math.atan2(dy, dx);
  game.power = Math.min(100, Math.max(10, Math.round((Math.sqrt(272 * Math.hypot(dx, dy)) - 53) / 4.22)));
  assert.ok(golfStrike(game));
}
function settle(game) {
  for (let tick = 0; tick < 1200 && game.phase === 'rolling'; tick++) stepGolf(game);
  assert.notEqual(game.phase, 'rolling');
}

test('four players take turns and complete all seven courses using ordinary shots', () => {
  const game = createGolf(players);
  for (let h = 0; h < 7; h++) {
    const path = [...routes[h], GOLF_COURSES[h].cup];
    assert.equal(game.turn, h % 4);
    for (const target of path) {
      const seen = new Set();
      for (let n = 0; n < 4; n++) {
        assert.ok(!seen.has(game.turn));
        seen.add(game.turn);
        strikeToward(game, target);
        settle(game);
      }
    }
    assert.equal(game.phase, 'card');
    assert.deepEqual(
      game.strokes.map((row) => row[h]),
      Array(4).fill(path.length),
    );
    assert.equal(nextGolfHole(game), h < 6);
  }
  assert.equal(golfSummary(game).score, 21);
  assert.match(golfSummary(game).summary, /Первое место делят/);
});

test('a moving ball, whirlpool and shulker flight resume deterministically', () => {
  for (const h of [0, 2, 6]) {
    const game = createGolf(['dad']);
    for (let n = 0; n < h; n++) {
      game.balls[0].finished = true;
      game.strokes[0][n] = 1;
      game.phase = 'card';
      nextGolfHole(game);
    }
    strikeToward(game, routes[h][0]);
    if (h === 0) stepGolf(game);
    else {
      for (let i = 0; i < 1000 && !game.balls[0].ride; i++) stepGolf(game);
      assert.equal(game.balls[0].ride.type, h === 2 ? 'typhoon' : 'shulker');
      for (let i = 0; i < 32; i++) stepGolf(game);
    }
    const saved = JSON.parse(JSON.stringify(game));
    const resumed = restoreGolf(saved, ['dad']);
    settle(game);
    settle(resumed);
    assert.deepEqual(resumed.balls, game.balls);
    assert.deepEqual(resumed.strokes, game.strokes);
    assert.notEqual(saved.phase, game.phase);
  }
});

test('hitting water charges a penalty and gives the next player their untouched ball', () => {
  const game = createGolf(['pasha', 'dad']);
  for (let i = 0; i < 2; i++) {
    game.phase = 'card';
    nextGolfHole(game);
  }
  const b = game.balls[0];
  b.x = 180;
  b.y = 259;
  strikeToward(game, [180, 300]);
  settle(game);
  assert.deepEqual([b.x, b.y], [180, 259]);
  assert.equal(game.strokes[0][2], 2);
  assert.equal(game.event, 'penalty');
  assert.equal(game.turn, 1);
  assert.equal(game.strokes[1][2], 0);
});

test('rail reflections reverse the normal velocity, and busy or completed turns cannot be struck', () => {
  const game = createGolf(['kirill']);
  const b = game.balls[0];
  b.x = 23;
  game.angle = Math.PI;
  game.power = 35;
  assert.ok(golfStrike(game));
  assert.equal(golfStrike(game), false);
  for (let i = 0; i < 8; i++) stepGolf(game);
  assert.ok(b.vx > 0);
  settle(game);
  assert.ok(b.x > 23);
  game.phase = 'card';
  assert.equal(golfStrike(game), false);
  assert.equal(game.strokes[0][0], 1);
});

test('a sunk ball skips later turns while its score remains fixed', () => {
  const game = createGolf(['mom', 'pasha']);
  const course = GOLF_COURSES[0];
  const b = game.balls[0];
  [b.x, b.y] = [course.cup[0] - 19, course.cup[1]];
  strikeToward(game, course.cup);
  settle(game);
  assert.equal(game.turn, 1);
  assert.ok(b.finished);
  strikeToward(game, routes[0][0]);
  settle(game);
  assert.equal(game.turn, 1);
  strikeToward(game, course.cup);
  settle(game);
  assert.equal(game.phase, 'card');
  assert.deepEqual(
    game.strokes.map((row) => row[0]),
    [1, 2],
  );
});

test('invalid course, active ball, future scores or player roster restarts on the tee', () => {
  const game = createGolf(players);
  game.power = 90;
  for (const corrupt of [
    (g) => {
      g.hole = 7;
    },
    (g) => {
      g.balls[0].x = NaN;
    },
    (g) => {
      g.balls[0].ride = { type: 'shulker', t: 0.2 };
    },
    (g) => {
      g.strokes[0][5] = 3;
    },
    (g) => {
      g.turn = -1;
    },
    (g) => {
      g.players = ['kirill'];
    },
  ]) {
    const broken = structuredClone(game);
    corrupt(broken);
    assert.deepEqual(restoreGolf(broken, players), createGolf(players));
  }
});
