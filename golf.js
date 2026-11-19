// Courses use the same coordinates for drawing, aiming and fixed-step ball physics.
const WIDTH = 680,
  HEIGHT = 360,
  EDGE = 16,
  BALL = 5.5;
const RESISTANCE = 136,
  RESTITUTION = 0.77,
  STEP = 1 / 120;
const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const heroNames = { kirill: 'Кирилл', maxim: 'Максим', mom: 'Мама', dad: 'Папа', pasha: 'Паша' };
const heroColumns = { kirill: 0, maxim: 1, mom: 2, dad: 3, pasha: 4 };
const playerColors = ['#fff5c6', '#61e6ff', '#ff96ba', '#cea2ff'];
const wall = (x, y, w, h) => ({ x, y, w, h });
const bumper = (x, y, r) => ({ x, y, r });
const courses = [
  {
    world: 'Храм изумруда',
    name: 'Нефритовые ворота',
    par: 3,
    tip: 'Проведи мяч между колоннами. От каменного борта он отскакивает.',
    colors: ['#294e47', '#3f795e', '#498468', '#a6c69f', '#586d65', '#83eed3'],
    tee: [77, 260],
    cup: [602, 88],
    walls: [wall(212, 16, 33, 135), wall(421, 204, 36, 140)],
    bumpers: [bumper(323, 176, 18), bumper(528, 226, 16)],
    hazards: [],
  },
  {
    world: 'Игровой центр',
    name: 'Вокруг карусели',
    par: 3,
    tip: 'Карусели пружинят. Можно сыграть от их круглых бортов.',
    colors: ['#393557', '#42668b', '#4b7495', '#e7b897', '#7d627b', '#ffbe78'],
    tee: [68, 87],
    cup: [606, 275],
    walls: [wall(214, 228, 176, 24), wall(455, 78, 142, 22)],
    bumpers: [bumper(266, 112, 38), bumper(421, 202, 30)],
    hazards: [],
  },
  {
    world: 'Аквапарк',
    name: 'В воронке тайфуна',
    par: 3,
    tip: 'Войди в тайфун, и течение закрутит мяч, а затем выбросит его к флагу.',
    colors: ['#204b6a', '#3e8489', '#479397', '#acd9c8', '#5d89a4', '#b2fdff'],
    tee: [76, 258],
    cup: [595, 79],
    walls: [wall(205, 16, 28, 97), wall(434, 242, 28, 102)],
    bumpers: [],
    hazards: [wall(256, 48, 144, 48), wall(147, 276, 119, 42)],
    typhoon: { x: 324, y: 183, r: 42, exit: -0.42 },
  },
  {
    world: 'Мебельный магазин',
    name: 'Через выставочный зал',
    par: 4,
    tip: 'Обогни стеллажи. Проход между их торцами ведёт в следующий зал.',
    colors: ['#453b3d', '#787d5b', '#848962', '#dac49b', '#9a7451', '#ffe49c'],
    tee: [76, 86],
    cup: [603, 256],
    walls: [wall(186, 16, 42, 169), wall(356, 169, 46, 175), wall(470, 48, 112, 38)],
    bumpers: [],
    hazards: [],
  },
  {
    world: 'Нижний мир',
    name: 'Базальтовый мост',
    par: 4,
    tip: 'Целься на мост через лаву. За падение мяч вернётся к месту удара со штрафом.',
    colors: ['#482f39', '#85594f', '#906555', '#c4a387', '#785052', '#ffb164'],
    tee: [76, 263],
    cup: [606, 102],
    walls: [wall(156, 91, 117, 25), wall(454, 246, 113, 27)],
    bumpers: [bumper(500, 119, 20)],
    hazards: [wall(294, 16, 87, 127), wall(294, 216, 87, 128)],
    bridge: wall(291, 145, 93, 69),
  },
  {
    world: 'Замок на Хеллоуин',
    name: 'Тыквенный двор',
    par: 3,
    tip: 'Сыграй вдоль светящихся тыкв и обойди стену замка с любой стороны.',
    colors: ['#39304c', '#536448', '#606e50', '#afac92', '#776a80', '#ffaf69'],
    tee: [588, 277],
    cup: [88, 86],
    walls: [wall(281, 138, 127, 45)],
    bumpers: [bumper(469, 229, 24), bumper(213, 112, 23), bumper(238, 260, 17), bumper(463, 77, 19)],
    hazards: [],
  },
  {
    world: 'Край',
    name: 'Прыжок шалкера',
    par: 3,
    tip: 'Попади на фиолетового шалкера. Он перебросит мяч через пустоту к лунке.',
    colors: ['#343148', '#757950', '#83865b', '#d1cba1', '#766681', '#e3a6ff'],
    tee: [78, 254],
    cup: [592, 115],
    walls: [wall(134, 77, 111, 30), wall(493, 249, 104, 27)],
    bumpers: [],
    hazards: [wall(314, 16, 88, 328)],
    shulker: { x: 243, y: 184, r: 28, targetX: 473, targetY: 165 },
  },
];
export const GOLF_COURSES = courses;

function teeBall(course) {
  const [x, y] = course.tee;
  return { x, y, vx: 0, vy: 0, safeX: x, safeY: y, finished: false, ride: null };
}

function aimAtCup(state) {
  const course = courses[state.hole],
    ball = state.balls[state.turn];
  return Math.atan2(course.cup[1] - ball.y, course.cup[0] - ball.x);
}

export function createGolf(players) {
  const roster = players.filter((id) => Object.hasOwn(heroNames, id)).slice(0, 4);
  if (!roster.length) roster.push('kirill');
  const game = {
    version: 1,
    players: roster,
    hole: 0,
    turn: 0,
    phase: 'aim',
    angle: 0,
    power: 60,
    balls: roster.map(() => teeBall(courses[0])),
    strokes: roster.map(() => courses.map(() => 0)),
    event: '',
  };
  game.angle = aimAtCup(game);
  return game;
}

const finite = Number.isFinite;
const between = (n, min, max) => finite(n) && n >= min && n <= max;

export function restoreGolf(saved, players) {
  if (
    !saved ||
    saved.version !== 1 ||
    JSON.stringify(saved.players) !== JSON.stringify(players) ||
    !Number.isInteger(saved.hole) ||
    !between(saved.hole, 0, courses.length - 1) ||
    !Number.isInteger(saved.turn) ||
    !between(saved.turn, 0, players.length - 1) ||
    !['aim', 'rolling', 'card'].includes(saved.phase) ||
    !finite(saved.angle) ||
    !between(saved.power, 10, 100) ||
    !Array.isArray(saved.balls) ||
    saved.balls.length !== players.length ||
    !Array.isArray(saved.strokes) ||
    saved.strokes.length !== players.length
  )
    return createGolf(players);
  const course = courses[saved.hole];
  const validBall = (ball) => {
    if (
      !ball ||
      !between(ball.x, 0, WIDTH) ||
      !between(ball.y, 0, HEIGHT) ||
      !between(ball.safeX, EDGE, WIDTH - EDGE) ||
      !between(ball.safeY, EDGE, HEIGHT - EDGE) ||
      !finite(ball.vx) ||
      !finite(ball.vy) ||
      typeof ball.finished !== 'boolean'
    )
      return false;
    if (ball.ride === null) return true;
    return (
      ball.ride &&
      ['typhoon', 'shulker'].includes(ball.ride.type) &&
      course[ball.ride.type] &&
      between(ball.ride.t, 0, 1) &&
      finite(ball.ride.angle) &&
      between(ball.ride.x, 0, WIDTH) &&
      between(ball.ride.y, 0, HEIGHT)
    );
  };
  if (
    !saved.balls.every(validBall) ||
    !saved.strokes.every(
      (row) =>
        Array.isArray(row) &&
        row.length === courses.length &&
        row.every(
          (n, i) => Number.isSafeInteger(n) && n >= (i < saved.hole ? 1 : 0) && (i <= saved.hole || n === 0),
        ),
    ) ||
    (saved.phase === 'card' ? !saved.balls.every((b) => b.finished) : saved.balls[saved.turn].finished)
  )
    return createGolf(players);
  const game = structuredClone(saved);
  game.event = '';
  return game;
}

export function golfStrike(state) {
  if (state.phase !== 'aim') return false;
  const b = state.balls[state.turn];
  const speed = 53 + 4.22 * state.power;
  b.safeX = b.x;
  b.safeY = b.y;
  b.vx = Math.cos(state.angle) * speed;
  b.vy = Math.sin(state.angle) * speed;
  state.strokes[state.turn][state.hole]++;
  state.phase = 'rolling';
  state.event = '';
  return true;
}

function passTurn(state) {
  if (state.balls.every((ball) => ball.finished)) {
    state.phase = 'card';
    return;
  }
  do {
    state.turn = (state.turn + 1) % state.players.length;
  } while (state.balls[state.turn].finished);
  state.phase = 'aim';
  state.angle = aimAtCup(state);
}

export function nextGolfHole(state) {
  if (state.phase !== 'card' || state.hole === courses.length - 1) return false;
  state.hole++;
  state.turn = state.hole % state.players.length;
  state.balls = state.players.map(() => teeBall(courses[state.hole]));
  state.phase = 'aim';
  state.event = '';
  state.angle = aimAtCup(state);
  return true;
}

function rebound(b, nx, ny, distance, restitution) {
  b.x += nx * distance;
  b.y += ny * distance;
  const dot = b.vx * nx + b.vy * ny;
  if (dot < 0) {
    b.vx -= (1 + restitution) * dot * nx;
    b.vy -= (1 + restitution) * dot * ny;
  }
}

function collideWall(b, r) {
  const px = clamp(b.x, r.x, r.x + r.w),
    py = clamp(b.y, r.y, r.y + r.h);
  const dx = b.x - px,
    dy = b.y - py,
    distance = Math.hypot(dx, dy);
  // At our maximum speed fixed steps are shorter than the radius, so an approach hits the surface first.
  if (distance > 0 && distance < BALL) rebound(b, dx / distance, dy / distance, BALL - distance, RESTITUTION);
}

function specialRide(b, course, dt) {
  const ride = b.ride,
    feature = course[ride.type];
  const isTyphoon = ride.type === 'typhoon';
  ride.t = Math.min(1, ride.t + dt / (isTyphoon ? 1.12 : 0.82));
  const t = ride.t;
  if (isTyphoon) {
    const turns = ((((feature.exit - ride.angle) % TAU) + TAU) % TAU) + TAU;
    const radius = feature.r * (0.98 - 0.5 * Math.sin(Math.PI * t));
    b.x = feature.x + Math.cos(ride.angle + turns * t) * radius;
    b.y = feature.y + Math.sin(ride.angle + turns * t) * radius;
  } else {
    b.x = ride.x + (feature.targetX - ride.x) * t;
    b.y = ride.y + (feature.targetY - ride.y) * t;
  }
  if (t === 1) {
    b.ride = null;
    if (isTyphoon) {
      b.x = feature.x + (feature.r + 2) * Math.cos(feature.exit);
      b.y = feature.y + (feature.r + 2) * Math.sin(feature.exit);
      b.vx = 208 * Math.cos(feature.exit);
      b.vy = 208 * Math.sin(feature.exit);
    } else {
      b.vx = 44;
      b.vy = -12;
    }
  }
}

// Call with a fixed 1/120 s step so banking, cup capture and save/resume match on every display.
export function stepGolf(state, dt = STEP) {
  if (state.phase !== 'rolling') return;
  const course = courses[state.hole],
    b = state.balls[state.turn];
  if (b.ride) {
    specialRide(b, course, dt);
    return;
  }
  const oldSpeed = Math.hypot(b.vx, b.vy),
    speed = Math.max(0, oldSpeed - RESISTANCE * dt);
  if (oldSpeed) {
    b.vx *= speed / oldSpeed;
    b.vy *= speed / oldSpeed;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.x < EDGE + BALL) rebound(b, 1, 0, EDGE + BALL - b.x, RESTITUTION);
  if (b.x > WIDTH - EDGE - BALL) rebound(b, -1, 0, b.x - WIDTH + EDGE + BALL, RESTITUTION);
  if (b.y < EDGE + BALL) rebound(b, 0, 1, EDGE + BALL - b.y, RESTITUTION);
  if (b.y > HEIGHT - EDGE - BALL) rebound(b, 0, -1, b.y - HEIGHT + EDGE + BALL, RESTITUTION);
  for (const r of course.walls) collideWall(b, r);
  for (const p of course.bumpers) {
    const dx = b.x - p.x,
      dy = b.y - p.y,
      d = Math.hypot(dx, dy);
    if (d > 0 && d < BALL + p.r) rebound(b, dx / d, dy / d, BALL + p.r - d, 0.96);
  }
  for (const type of ['typhoon', 'shulker']) {
    const f = course[type];
    if (f && Math.hypot(b.x - f.x, b.y - f.y) <= f.r) {
      b.ride = { type, t: 0, angle: Math.atan2(b.y - f.y, b.x - f.x), x: b.x, y: b.y };
      b.vx = 0;
      b.vy = 0;
      state.event = type;
      return;
    }
  }
  if (course.hazards.some((r) => b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h)) {
    b.x = b.safeX;
    b.y = b.safeY;
    b.vx = 0;
    b.vy = 0;
    state.strokes[state.turn][state.hole]++;
    state.event = 'penalty';
    passTurn(state);
  } else if (Math.hypot(b.x - course.cup[0], b.y - course.cup[1]) < 10 && speed < 238) {
    [b.x, b.y] = course.cup;
    b.finished = true;
    b.vx = 0;
    b.vy = 0;
    state.event = 'sunk';
    passTurn(state);
  } else if (speed <= 5) {
    b.vx = 0;
    b.vy = 0;
    passTurn(state);
  }
}

function oval(g, x, y, rx, ry, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, TAU);
  g.fill();
}
function stroke(g, color, width, points) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(...points[0]);
  for (const point of points.slice(1)) g.lineTo(...point);
  g.stroke();
}

function paintTurf(g, c) {
  const [outer, grass, stripe, edge, stone] = c.colors;
  g.fillStyle = outer;
  g.fillRect(0, 0, WIDTH, HEIGHT);
  g.fillStyle = stone;
  g.fillRect(5, 5, WIDTH - 10, HEIGHT - 10);
  g.fillStyle = edge;
  g.fillRect(7, 7, WIDTH - 14, HEIGHT - 14);
  for (let x = 12; x < WIDTH - 10; x += 34) {
    g.fillStyle = outer;
    g.fillRect(x, 6, 2, 10);
    g.fillRect(x + 12, HEIGHT - 16, 2, 10);
  }
  for (let y = 16; y < HEIGHT - 10; y += 30) {
    g.fillStyle = outer;
    g.fillRect(6, y, 10, 2);
    g.fillRect(WIDTH - 16, y + 4, 10, 2);
  }
  g.save();
  g.beginPath();
  g.rect(EDGE, EDGE, WIDTH - 2 * EDGE, HEIGHT - 2 * EDGE);
  g.clip();
  g.fillStyle = grass;
  g.fillRect(0, 0, WIDTH, HEIGHT);
  g.fillStyle = stripe;
  for (let x = -HEIGHT; x < WIDTH; x += 82) {
    g.beginPath();
    g.moveTo(x, HEIGHT);
    g.lineTo(x + 39, HEIGHT);
    g.lineTo(x + 39 + HEIGHT, 0);
    g.lineTo(x + HEIGHT, 0);
    g.fill();
  }
  for (let i = 0; i < 190; i++) {
    const x = (137 * i + i * i * 17) % WIDTH,
      y = (67 * i + i * i * 11) % HEIGHT;
    stroke(g, i % 3 ? '#13252420' : '#f6ffd72a', 1, [
      [x - 2, y - 2],
      [x, y],
      [x + 1, y - 3],
    ]);
  }
  const shade = g.createLinearGradient(0, 0, WIDTH, HEIGHT);
  shade.addColorStop(0, '#fff7b810');
  shade.addColorStop(0.6, '#ffffff00');
  shade.addColorStop(1, '#0f11233a');
  g.fillStyle = shade;
  g.fillRect(0, 0, WIDTH, HEIGHT);
  g.strokeStyle = '#132a324f';
  g.lineWidth = 5;
  g.strokeRect(EDGE, EDGE, WIDTH - 2 * EDGE, HEIGHT - 2 * EDGE);
  g.restore();
}

function paintWall(g, r, c, index) {
  const [outer, , , edge, stone] = c.colors;
  g.fillStyle = '#10192344';
  g.fillRect(r.x + 3, r.y + 5, r.w, r.h);
  g.fillStyle = outer;
  g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = stone;
  g.fillRect(r.x + 2, r.y + 1, r.w - 4, r.h - 6);
  g.fillStyle = edge;
  g.fillRect(r.x + 2, r.y + 1, r.w - 4, 2);
  const tall = r.h > r.w,
    length = tall ? r.h : r.w;
  for (let n = 12; n < length - 4; n += 22) {
    if (index === 3) {
      const colors = ['#edbd7d', '#557375', '#ce8065', '#99aa86'];
      g.fillStyle = colors[Math.floor(n / 22) % 4];
      if (tall) g.fillRect(r.x + 6, r.y + n, r.w - 12, 14);
      else g.fillRect(r.x + n, r.y + 6, 14, r.h - 14);
    } else {
      g.fillStyle = '#20202950';
      if (tall) g.fillRect(r.x + 2, r.y + n, r.w - 4, 2);
      else g.fillRect(r.x + n, r.y + 2, 2, r.h - 7);
    }
  }
}

function paintLiquid(g, r, hole, time) {
  const liquid =
    hole === 2
      ? ['#235a83', '#347caa', '#a9f5f7']
      : hole === 4
        ? ['#ab332d', '#e76832', '#ffce69']
        : ['#211c35', '#29223f', '#bcb3f4'];
  g.fillStyle = liquid[0];
  g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = liquid[1];
  g.fillRect(r.x + 2, r.y + 3, r.w - 4, r.h - 6);
  g.save();
  g.beginPath();
  g.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  g.clip();
  for (let j = 0; j < r.h / 12; j++) {
    for (let i = 0; i < r.w / 25; i++) {
      const x = r.x + i * 32 + 13 * Math.sin(j * 31 + i * 13) + 8,
        y = r.y + j * 14 + 5 + 2 * Math.cos(i * 6 + time * 1.5 + j);
      if (hole === 6) {
        g.globalAlpha = 0.35 + 0.3 * Math.sin(time * 2 + i + j);
        oval(g, x, y, 1.3, 1.3, liquid[2]);
      } else
        stroke(g, liquid[2], 1.3, [
          [x, y],
          [x + 4, y - 1.5],
          [x + 8, y - 0.5],
        ]);
    }
  }
  g.restore();
}

function paintBumper(g, b, c, hole, time) {
  const { x, y, r } = b;
  oval(g, x + 3, y + 5, r, r, '#131c264f');
  oval(g, x, y, r, r, c.colors[0]);
  oval(g, x, y - 2, r - 2, r - 3, c.colors[4]);
  if (hole === 1) {
    oval(g, x, y - 3, r - 4, r - 5, '#b94e69');
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#f6b887' : '#efdea6';
      g.beginPath();
      g.moveTo(x, y - 3);
      g.arc(x, y - 3, r - 5, time * 0.55 + (i * TAU) / 8, time * 0.55 + ((i + 0.53) * TAU) / 8);
      g.fill();
    }
    oval(g, x, y - 3, r * 0.22, r * 0.22, '#c08061');
    oval(g, x, y - 5, r * 0.14, r * 0.14, '#ffe1b7');
  } else if (hole === 5) {
    oval(g, x, y - 2, r - 2, r - 3, '#d77736');
    oval(g, x, y - 2, r * 0.63, r - 3, '#efa54e');
    g.fillStyle = '#6c8045';
    g.fillRect(x - 2, y - r - 2, 5, 6);
    for (const dx of [-0.32, 0.15]) {
      g.fillStyle = '#563428';
      g.fillRect(x + r * dx, y - r * 0.19, r * 0.2, r * 0.18);
    }
    stroke(g, '#713e29', 2, [
      [x - r * 0.36, y + r * 0.16],
      [x, y + r * 0.3],
      [x + r * 0.31, y + r * 0.12],
    ]);
  } else {
    const crystal = hole === 0;
    oval(g, x, y - 3, r * 0.74, r * 0.77, crystal ? '#598b79' : '#63505c');
    g.fillStyle = crystal ? '#9ce6be' : '#d48360';
    g.beginPath();
    g.moveTo(x, y - r * 0.76);
    g.lineTo(x + r * 0.48, y - r * 0.16);
    g.lineTo(x, y + r * 0.48);
    g.lineTo(x - r * 0.44, y - r * 0.16);
    g.fill();
    stroke(g, crystal ? '#e4ffe0' : '#ffd991', 1.5, [
      [x, y - r * 0.71],
      [x - r * 0.12, y - r * 0.12],
      [x, y + r * 0.38],
    ]);
  }
}

function paintSpecial(g, c, time, b) {
  if (c.bridge) {
    const r = c.bridge;
    g.fillStyle = '#a38d79';
    g.fillRect(r.x, r.y, r.w, r.h);
    for (let x = r.x + 2; x < r.x + r.w; x += 13) {
      g.fillStyle = '#77665e';
      g.fillRect(x, r.y, 2, r.h);
      for (const y of [r.y + 4, r.y + r.h - 6]) {
        g.fillStyle = '#d8bf99';
        g.fillRect(x + 3, y, 3, 2);
      }
    }
  }
  if (c.typhoon) {
    const f = c.typhoon;
    oval(g, f.x + 2, f.y + 4, f.r, f.r, '#223a545f');
    oval(g, f.x, f.y, f.r, f.r, '#b6f5d5');
    oval(g, f.x, f.y, f.r - 3, f.r - 3, '#287f9d');
    for (let k = 0; k < 4; k++) {
      const pts = [];
      for (let j = 0; j < 34; j++) {
        const a = time * 1.9 + (k * TAU) / 4 + j * 0.065,
          r = 6 + j * 0.91;
        pts.push([f.x + Math.cos(a) * r, f.y + Math.sin(a) * r]);
      }
      stroke(g, k % 2 ? '#a5ffe9' : '#5cd9df', 3, pts);
    }
    oval(g, f.x, f.y, 5, 5, '#184d68');
  }
  if (c.shulker) {
    const f = c.shulker,
      x = f.x,
      y = f.y,
      h = (b.ride?.type === 'shulker' ? 7 : 3) + 2 * Math.sin(time * 2.3);
    oval(g, f.targetX, f.targetY, 25, 18, '#9d8ea8');
    oval(g, f.targetX, f.targetY, 21, 14, '#655878');
    g.save();
    g.strokeStyle = '#edc8ff';
    g.lineWidth = 1.6;
    g.setLineDash([3, 5]);
    g.beginPath();
    g.ellipse(f.targetX, f.targetY, 16, 9, 0, 0, TAU);
    g.stroke();
    g.restore();
    oval(g, x, y, f.r, f.r, '#57466a');
    oval(g, x, y, f.r - 2, f.r - 2, '#a27fae');
    g.fillStyle = '#493459';
    g.fillRect(x - 14, y - 12, 28, 23);
    g.fillStyle = '#f7de9c';
    g.fillRect(x - 8, y - 8, 16, 11);
    g.fillStyle = '#322c42';
    g.fillRect(x - 5, y - 4, 3, 3);
    g.fillRect(x + 3, y - 4, 3, 3);
    g.fillStyle = '#a772a8';
    g.fillRect(x - 15, y - 13 - h, 30, 11);
    g.fillRect(x - 15, y + 4, 30, 9);
    g.fillStyle = '#d6a6d8';
    g.fillRect(x - 15, y - 13 - h, 30, 3);
    g.fillRect(x - 14, y + 4, 28, 2);
  }
}

function drawFlag(g, c, time) {
  const [x, y] = c.cup;
  oval(g, x, y + 1, 12, 10, '#aeb792');
  oval(g, x, y, 9.6, 8, '#1c292b');
  oval(g, x, y + 2, 6, 3, '#0d1d25');
  stroke(g, '#203b4140', 2, [
    [x, y],
    [x + 14, y - 7],
  ]);
  stroke(g, '#f8ead5', 2.4, [
    [x, y - 2],
    [x, y - 32],
  ]);
  const wave = Math.sin(time * 3) * 2;
  g.fillStyle = '#ef7658';
  g.beginPath();
  g.moveTo(x + 1, y - 32);
  g.lineTo(x + 19, y - 29 + wave);
  g.lineTo(x + 12, y - 25 + wave);
  g.lineTo(x + 17, y - 21 + wave);
  g.lineTo(x + 1, y - 23);
  g.fill();
  g.fillStyle = '#fff2bb';
  g.fillRect(x + 2, y - 31, 3, 8);
}

function drawBall(g, b, color, active) {
  if (b.finished) return;
  const altitude = b.ride?.type === 'shulker' ? Math.sin(Math.PI * b.ride.t) * 56 : 0;
  const r = BALL + (altitude / 56) * 1.6;
  oval(g, b.x + 1, b.y + 2, r * (1 - altitude / 140), r * 0.62, '#11242680');
  const y = b.y - altitude;
  oval(g, b.x, y, r + 0.7, r + 0.7, '#344247');
  oval(g, b.x, y - 0.3, r, r, color);
  oval(g, b.x - 1.5, y - 2, r * 0.5, r * 0.32, '#ffffffd4');
  if (!active)
    stroke(g, '#41515c', 1.4, [
      [b.x - 2, y + 2],
      [b.x + 2, y + 2],
    ]);
}

function drawCourse(canvas, state, time, figures) {
  const g = canvas.getContext('2d'),
    c = courses[state.hole],
    b = state.balls[state.turn];
  g.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  paintTurf(g, c);
  for (const r of c.hazards) paintLiquid(g, r, state.hole, time);
  paintSpecial(g, c, time, b);
  for (const r of c.walls) paintWall(g, r, c, state.hole);
  for (const p of c.bumpers) paintBumper(g, p, c, state.hole, time);
  const [sx, sy] = c.tee;
  g.fillStyle = '#1e443e59';
  g.fillRect(sx - 11, sy - 9, 22, 18);
  stroke(g, '#d3e7bdab', 1.5, [
    [sx - 7, sy + 4],
    [sx + 7, sy + 4],
  ]);
  drawFlag(g, c, time);
  if (state.phase === 'aim') {
    const dx = Math.cos(state.angle),
      dy = Math.sin(state.angle);
    const length = 25 + state.power * 0.75;
    g.save();
    g.strokeStyle = '#f4fff1';
    g.lineWidth = 2.5;
    g.setLineDash([2.5, 5.5]);
    g.beginPath();
    g.moveTo(b.x + dx * 9, b.y + dy * 9);
    g.lineTo(b.x + dx * length, b.y + dy * length);
    g.stroke();
    g.restore();
    const tx = b.x + dx * length,
      ty = b.y + dy * length;
    stroke(g, '#ffffe5', 2.5, [
      [tx - dx * 6 + dy * 4, ty - dy * 6 - dx * 4],
      [tx, ty],
      [tx - dx * 6 - dy * 4, ty - dy * 6 + dx * 4],
    ]);
    const hero = state.players[state.turn],
      fx = clamp(b.x - dx * 24, 21, WIDTH - 21),
      fy = clamp(b.y - dy * 24, 39, HEIGHT - 19);
    if (figures.complete && figures.naturalWidth) {
      const w = figures.naturalWidth / 5,
        h = figures.naturalHeight / 2;
      oval(g, fx, fy, 9, 3, '#14292645');
      g.drawImage(figures, heroColumns[hero] * w, 0, w, h, fx - 11, fy - 34, 22, 36);
    }
    const hand = [fx + 4, fy - 14],
      club = [b.x - dx * 9, b.y - dy * 9];
    stroke(g, '#dae2d1', 1.5, [hand, club]);
    stroke(g, '#3a3a40', 3, [
      [club[0] + dy * 3, club[1] - dx * 3],
      [club[0] - dy * 3, club[1] + dx * 3],
    ]);
  }
  state.balls.forEach((other, i) => {
    if (i !== state.turn) drawBall(g, other, playerColors[i], false);
  });
  drawBall(g, b, playerColors[state.turn], true);
}

export function golfSummary(state) {
  const ranking = state.players
    .map((hero, i) => ({ hero, total: state.strokes[i].reduce((a, b) => a + b, 0) }))
    .sort((a, b) => a.total - b.total);
  const winners = ranking.filter((row) => row.total === ranking[0].total).map((row) => heroNames[row.hero]);
  const result = ranking.map((row) => heroNames[row.hero] + ' — ' + row.total).join(', ');
  const winner =
    winners.length === 1 ? 'Первое место — ' + winners[0] : 'Первое место делят ' + winners.join(' и ');
  return {
    score: ranking[0].total,
    summary:
      'Семь лунок. Удары по итогам турнира: ' + result + '.' + (ranking.length > 1 ? ' ' + winner + '.' : ''),
  };
}

export function mount(host, { saved, players, save, finish }) {
  const state = restoreGolf(saved, players);
  const figures = new Image();
  figures.src = new URL('./assets/maze-figures.webp', import.meta.url);
  const section = document.createElement('div');
  section.className = 'golf-game';
  section.innerHTML = `
    <header class="golf-banner">
      <div class="golf-scenery" aria-hidden="true"></div>
      <div class="golf-banner-text"><div class="golf-world"></div><h2 class="golf-name"></h2></div>
      <div class="golf-par"></div>
    </header>
    <div class="golf-stage">
      <canvas class="golf-canvas" aria-label="Поле мини-гольфа. Нажми на поле, чтобы выбрать направление, или используй стрелки и пробел." tabindex="0"></canvas>
      <div class="golf-card" hidden><div><h3>Лунка пройдена</h3><p class="golf-hole-results"></p><button type="button" class="golf-next">Следующая лунка</button></div></div>
    </div>
    <div class="golf-turns" aria-label="Счёт игроков"></div>
    <div class="golf-controls">
      <div class="golf-aim-controls" role="group" aria-label="Прицел">
        <button type="button" class="golf-left" aria-label="Повернуть прицел влево">↶</button>
        <button type="button" class="golf-right" aria-label="Повернуть прицел вправо">↷</button>
      </div>
      <label class="golf-power"><span>Сила удара <output></output></span><input aria-label="Сила удара" type="range" min="10" max="100" step="1"></label>
      <button type="button" class="golf-hit">Ударить</button>
    </div>
    <p class="golf-status" aria-live="polite" aria-atomic="true"></p>
    <p class="golf-tip"></p>
    <details class="golf-help"><summary>Как играть</summary>
      <p>Забей мяч во все семь лунок за наименьшее число ударов. Если играете вместе, после каждого удара передавайте ход. Каждый герой играет своим мячом.</p>
      <p>Коснись поля в направлении удара, выбери силу и нажми «Ударить». На клавиатуре стрелки влево и вправо поворачивают прицел, вверх и вниз меняют силу. Удерживай Shift для точной настройки. Пробел — удар.</p>
      <p>Вода, лава и пустота возвращают мяч к месту последнего удара и добавляют один штрафной удар. На большой скорости мяч может проскочить мимо лунки.</p>
    </details>`;
  host.replaceChildren(section);
  const find = (selector) => section.querySelector(selector);
  const canvas = find('canvas'),
    power = find('input'),
    output = find('output'),
    status = find('.golf-status');
  const next = find('.golf-next'),
    hit = find('.golf-hit'),
    left = find('.golf-left'),
    right = find('.golf-right');
  const controller = new AbortController(),
    options = { signal: controller.signal };
  let frame = 0,
    clock = 0,
    accumulator = 0,
    lastTime = null,
    lastPaint = -1,
    lastSave = 0;
  let paused = false,
    destroyed = false,
    finished = false,
    titleIndex = -1;

  function persist() {
    if (!finished && !destroyed) save(structuredClone(state));
    lastSave = clock;
  }
  function endTournament() {
    if (finished || destroyed) return;
    finished = true;
    finish(golfSummary(state));
  }
  function refresh() {
    const c = courses[state.hole],
      card = state.phase === 'card',
      canAim = state.phase === 'aim';
    if (titleIndex !== state.hole) {
      titleIndex = state.hole;
      const realm = state.hole >= 4,
        row = realm ? state.hole - 4 : state.hole,
        count = realm ? 3 : 4;
      const panorama = find('.golf-scenery');
      panorama.style.backgroundImage =
        'url("' +
        new URL('./assets/' + (realm ? 'realm' : 'world') + '-panoramas.webp', import.meta.url) +
        '")';
      panorama.style.backgroundSize = '100% ' + count * 100 + '%';
      panorama.style.backgroundPosition = '50% ' + (100 * row) / (count - 1) + '%';
      section.style.setProperty('--golf-accent', c.colors[5]);
      find('.golf-world').textContent = 'Лунка ' + (state.hole + 1) + ' из 7 · ' + c.world;
      find('.golf-name').textContent = c.name;
      const par = find('.golf-par');
      par.textContent = 'Пар ' + c.par;
      par.title = 'Ориентир: ' + c.par + ' удара';
      find('.golf-tip').textContent = c.tip;
    }
    power.value = state.power;
    output.value = state.power + '%';
    [power, hit, left, right].forEach((el) => {
      el.disabled = !canAim;
    });
    find('.golf-card').hidden = !card;
    if (card)
      find('.golf-hole-results').textContent = state.players
        .map((id, i) => heroNames[id] + ' — ' + state.strokes[i][state.hole])
        .join(' · ');
    const turnList = find('.golf-turns');
    turnList.replaceChildren(
      ...state.players.map((id, i) => {
        const el = document.createElement('div');
        el.className = 'golf-player' + (i === state.turn && !card ? ' is-current' : '');
        el.style.setProperty('--ball-color', playerColors[i]);
        const name = document.createElement('strong');
        name.textContent = heroNames[id];
        const score = document.createElement('span');
        score.textContent =
          (state.balls[i].finished ? '✓ ' : '') +
          'На лунке ' +
          state.strokes[i][state.hole] +
          ' · всего ' +
          state.strokes[i].reduce((a, b) => a + b, 0);
        el.append(name, score);
        return el;
      }),
    );
    const eventLabel = {
      penalty: 'Штраф +1. ',
      sunk: 'Мяч в лунке! ',
      typhoon: 'Тайфун закручивает мяч. ',
      shulker: 'Шалкер подбросил мяч! ',
    };
    const instruction = card
      ? 'Все мячи в лунке.'
      : canAim
        ? 'Ход: ' + heroNames[state.players[state.turn]] + '. Коснись поля, чтобы прицелиться.'
        : 'Мяч в движении…';
    const message = (eventLabel[state.event] || '') + instruction;
    if (status.textContent !== message) status.textContent = message;
  }
  function paint() {
    drawCourse(canvas, state, clock, figures);
  }
  function resize() {
    const w = Math.round(
      clamp(canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1), WIDTH, WIDTH * 2.5),
    );
    canvas.width = w;
    canvas.height = Math.round((w * HEIGHT) / WIDTH);
    paint();
  }
  function strike() {
    if (paused || destroyed || finished || !golfStrike(state)) return;
    accumulator = 0;
    refresh();
    persist();
    paint();
    // Keep keyboard control even though the shot button is disabled while the ball moves.
    if (!matchMedia('(pointer: coarse)').matches) canvas.focus({ preventScroll: true });
  }
  function rotate(amount) {
    if (paused || state.phase !== 'aim') return;
    state.angle += amount;
    paint();
    persist();
  }
  function setPower(value) {
    if (paused || state.phase !== 'aim') return;
    state.power = Math.round(clamp(value, 10, 100));
    power.value = state.power;
    output.value = state.power + '%';
    paint();
    persist();
  }
  function tick(now) {
    if (destroyed || paused || finished) return;
    const elapsed = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;
    clock += elapsed;
    accumulator += elapsed;
    const phase = state.phase,
      event = state.event;
    while (accumulator >= STEP) {
      if (state.phase === 'rolling') stepGolf(state);
      accumulator -= STEP;
    }
    if (state.phase !== phase || state.event !== event) {
      refresh();
      if (state.phase === 'card' && state.hole === courses.length - 1) {
        endTournament();
        return;
      }
      persist();
      if (state.phase === 'card' && !matchMedia('(pointer: coarse)').matches)
        next.focus({ preventScroll: true });
    } else if (state.phase === 'rolling' && clock - lastSave >= 0.65) persist();
    if (clock - lastPaint >= 1 / 45 || state.phase !== phase) {
      paint();
      lastPaint = clock;
    }
    frame = requestAnimationFrame(tick);
  }
  left.addEventListener('click', () => rotate(-Math.PI / 40), options);
  right.addEventListener('click', () => rotate(Math.PI / 40), options);
  power.addEventListener('input', () => setPower(Number(power.value)), options);
  hit.addEventListener('click', strike, options);
  next.addEventListener(
    'click',
    () => {
      if (!paused && nextGolfHole(state)) {
        refresh();
        paint();
        persist();
        canvas.focus({ preventScroll: true });
      }
    },
    options,
  );
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (paused || state.phase !== 'aim' || event.button !== 0) return;
      const r = canvas.getBoundingClientRect(),
        b = state.balls[state.turn];
      const dx = ((event.clientX - r.left) * WIDTH) / r.width - b.x,
        dy = ((event.clientY - r.top) * HEIGHT) / r.height - b.y;
      if (Math.hypot(dx, dy) > 3) {
        state.angle = Math.atan2(dy, dx);
        paint();
        persist();
      }
      canvas.focus({ preventScroll: true });
    },
    options,
  );
  section.addEventListener(
    'keydown',
    (event) => {
      if (paused || event.ctrlKey || event.metaKey || event.altKey || state.phase !== 'aim') return;
      if (event.target === power && event.key.startsWith('Arrow')) return;
      if (event.target.closest('summary') && [' ', 'Enter'].includes(event.key)) return;
      if (event.key === ' ' && !event.repeat && !(event.target.tagName === 'BUTTON')) {
        event.preventDefault();
        strike();
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
        rotate((event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 0.012 : 0.065));
      else setPower(state.power + (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 1 : 5));
    },
    options,
  );
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  refresh();
  resize();
  persist();
  if (!matchMedia('(pointer: coarse)').matches) canvas.focus({ preventScroll: true });
  frame = requestAnimationFrame(tick);
  if (state.phase === 'card' && state.hole === courses.length - 1) queueMicrotask(endTournament);
  return {
    pause() {
      if (paused || destroyed || finished) return;
      paused = true;
      cancelAnimationFrame(frame);
      persist();
    },
    resume() {
      if (!paused || destroyed || finished) return;
      paused = false;
      lastTime = null;
      frame = requestAnimationFrame(tick);
    },
    destroy() {
      if (destroyed) return;
      persist();
      destroyed = true;
      cancelAnimationFrame(frame);
      controller.abort();
      observer.disconnect();
      section.remove();
    },
  };
}
