// Artwork is registered to the collision coordinates of the 360 × 480 playfield.
import { drawLandmark, landmarkAtlas } from './arcade-scenery.js';

const W = 360,
  H = 480,
  TURN = Math.PI * 2;
const scenes = {
  waterpark: ['world', 2, 0.72],
  temple: ['world', 0, 0.65],
  arcade: ['world', 1, 0.36],
  store: ['world', 3, 0.54],
  nether: ['realm', 0, 0.65],
  castle: ['realm', 1, 0.66],
  end: ['realm', 2, 0.57],
};
const panoramas = new Map();
let cached;

function panorama(sheet) {
  if (!panoramas.has(sheet)) {
    const image = new Image();
    image.src = new URL('./assets/' + sheet + '-panoramas.webp', import.meta.url);
    panoramas.set(sheet, image);
  }
  return panoramas.get(sheet);
}
function disk(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, TURN);
  g.fill();
}
function oval(g, x, y, rx, ry, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, TURN);
  g.fill();
}
function rim(g, x, y, r, width, color, start = 0, end = TURN) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.arc(x, y, r, start, end);
  g.stroke();
}
function stroke(g, coords, width, color) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(coords[0], coords[1]);
  g.lineTo(coords[2], coords[3]);
  g.stroke();
}
function polygon(g, points, fill, outline, width = 1) {
  g.beginPath();
  g.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
  g.closePath();
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (outline) {
    g.strokeStyle = outline;
    g.lineWidth = width;
    g.stroke();
  }
}
function tint(g, x1, y1, x2, y2, ...stops) {
  const gradient = g.createLinearGradient(x1, y1, x2, y2);
  for (const [position, color] of stops) gradient.addColorStop(position, color);
  return gradient;
}
function bloom(g, x, y, r, color, alpha = 1) {
  g.save();
  g.globalAlpha *= alpha;
  const light = g.createRadialGradient(x, y, 0, x, y, r);
  light.addColorStop(0, color);
  light.addColorStop(0.35, color + '8c');
  light.addColorStop(1, color + '00');
  disk(g, x, y, r, light);
  g.restore();
}
function screw(g, x, y, radius = 2.3) {
  disk(g, x + 0.5, y + 1, radius + 0.6, '#0b121b');
  disk(g, x, y, radius, tint(g, x, y - radius, x, y + radius, [0, '#edeee3'], [0.42, '#9da6a0'], [1, '#3f4953']));
  stroke(g, [x - radius * 0.5, y + 0.4, x + radius * 0.5, y - 0.65], 0.8, '#243039');
}
function rail(g, [x1, y1, x2, y2], accent) {
  const segment = [x1, y1, x2, y2];
  stroke(g, [x1 + 1.3, y1 + 2.5, x2 + 1.3, y2 + 2.5], 5.4, '#08131db8');
  stroke(g, segment, 4.8, '#27323a');
  stroke(g, segment, 3.8, '#85928b');
  stroke(g, [x1 - 0.45, y1 - 0.65, x2 - 0.45, y2 - 0.65], 2.1, accent);
  stroke(g, [x1 - 0.65, y1 - 1.15, x2 - 0.65, y2 - 1.15], 0.85, '#fff8df');
}
function playfield(g, t, image) {
  const [sheet, row, focus] = scenes[t.world];
  g.fillStyle = tint(g, 0, 0, 90, H, [0, t.line], [0.52, t.deep], [1, '#0b1d26']);
  g.fillRect(0, 0, W, H);
  if (image.naturalWidth) {
    const h = image.naturalHeight / (sheet === 'realm' ? 3 : 4);
    const crop = Math.min(image.naturalWidth, (348 * h) / 231);
    g.drawImage(image, (image.naturalWidth - crop) * focus, row * h, crop, h, 5, 10, 350, 233);
  }
  g.fillStyle = tint(
    g,
    0,
    10,
    0,
    252,
    [0, '#101c2a35'],
    [0.27, '#14212c16'],
    [0.6, t.deep + '46'],
    [0.8, t.deep + 'ca'],
    [0.96, t.deep],
    [1, t.deep],
  );
  g.fillRect(0, 10, W, 242);
  g.fillStyle = tint(g, 0, 252, 32, 478, [0, t.deep], [0.42, t.deep], [1, '#12212c']);
  g.fillRect(0, 252, W, H - 252);
  // Narrow etched traces, in perspective, lie beneath the clear coat.
  g.save();
  g.globalAlpha = 0.22;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(158 + side * (55 + i * 5), 227);
      g.bezierCurveTo(158 + side * (136 + i * 3), 289, 158 + side * (88 + i * 5), 334, 158 + side * (108 + i * 5), 387);
      g.strokeStyle = t.light;
      g.lineWidth = i === 0 ? 1.5 : 0.7;
      g.stroke();
    }
  }
  for (let i = -5; i <= 5; i++) stroke(g, [158 + i * 13, 260, 158 + i * 53, 480], 0.65, t.line);
  for (const y of [279, 297, 319, 347, 382, 426, 477]) stroke(g, [10, y, 315, y], 0.58, t.line);
  g.restore();
  // Screen-printed emblem sits below the surface, behind the switch bank.
  g.save();
  g.translate(159, 337);
  for (const [radius, color, width] of [
    [52, t.line + '88', 1.5],
    [46, t.light + '5c', 0.8],
    [40, t.line + '6a', 2],
  ]) {
    g.beginPath();
    g.ellipse(0, 0, radius, radius * 0.7, 0, 0, TURN);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
  for (let i = 0; i < 20; i++) {
    const a = (i * TURN) / 20;
    stroke(
      g,
      [Math.cos(a) * 48, Math.sin(a) * 33.5, Math.cos(a) * (i % 5 ? 50 : 54), Math.sin(a) * (i % 5 ? 35 : 38)],
      0.8,
      t.light + '80',
    );
  }
  g.globalAlpha = 0.91;
  drawLandmark(g, t.props[2], -52, -45, 104, 72);
  g.restore();
  // The shooter lane and return apron are recessed below the painted field.
  g.fillStyle = tint(
    g,
    314,
    0,
    348,
    0,
    [0, '#091a25'],
    [0.15, '#1e3542'],
    [0.5, t.deep],
    [0.9, '#31444d'],
    [1, '#131f2d'],
  );
  g.fillRect(315, 104, 32, 371);
  for (let y = 160; y <= 395; y += 37) {
    stroke(g, [328, y + 4, 331, y], 0.9, t.light + '68');
    stroke(g, [331, y, 334, y + 4], 0.9, t.light + '68');
  }
  g.fillStyle = tint(g, 0, 437, 0, 480, [0, '#08132000'], [0.62, '#09141ea6'], [1, '#050d16']);
  g.fillRect(7, 437, 304, 43);
}
function apron(g, t, side) {
  g.save();
  if (side) {
    g.translate(320, 0);
    g.scale(-1, 1);
  }
  polygon(
    g,
    [7, 356, 43, 390, 88, 412, 122, 450, 108, 472, 7, 472],
    tint(g, 0, 373, 100, 465, [0, t.line], [0.15, t.deep], [0.72, '#17242f'], [1, '#2d3d46']),
    '#9dafa476',
  );
  polygon(g, [12, 371, 43, 399, 82, 416, 99, 435, 89, 438, 46, 411, 18, 405], t.line + '65');
  for (let j = 0; j < 4; j++) {
    const x = 24 + j * 10;
    stroke(g, [x, 448, x + 17, 435], 1.3, t.light + '55');
  }
  screw(g, 18, 461);
  g.restore();
}
function sling(g, edge, walls, t, index) {
  const [x1, y1, x2, y2] = edge;
  const [, , x3, y3] = walls.find(([x, y]) => x === x2 && y === y2);

  const cx = (x1 + x2 + x3) / 3,
    cy = (y1 + y2 + y3) / 3;
  const points = [x1, y1, x2, y2, x3, y3];
  polygon(
    g,
    points,
    tint(
      g,
      x1,
      y1,
      x3,
      y3,
      [0, t.lights[index] + 'aa'],
      [0.3, t.lights[index] + '48'],
      [0.7, '#d8ffff62'],
      [1, t.deep + '77'],
    ),
  );
  const inset = (ratio) => points.map((v, i) => v * ratio + (i % 2 ? cy : cx) * (1 - ratio));
  polygon(g, inset(0.8), null, '#edf8e7c0', 0.9);
  polygon(g, inset(0.57), t.lights[index] + '37', t.light + 'ad', 0.85);
  stroke(
    g,
    [cx + (x1 - cx) * 0.5, cy + (y1 - cy) * 0.5, cx + (x2 - cx) * 0.59, cy + (y2 - cy) * 0.59],
    1.2,
    '#effbdfbe',
  );
  for (let i = 0; i < 6; i += 2) screw(g, points[i] * 0.65 + cx * 0.35, points[i + 1] * 0.65 + cy * 0.35, 1.7);
}
function bankInsert(g, [x, y, r], color, i) {
  const hull = [
    x - r * 0.74,
    y - r * 0.42,
    x,
    y - r * 0.68,
    x + r * 0.74,
    y - r * 0.42,
    x + r * 0.63,
    y + r * 0.35,
    x,
    y + r * 0.68,
    x - r * 0.63,
    y + r * 0.35,
  ];
  polygon(g, hull, '#0d1d29', '#b3bfaa', 1);
  for (let n = 0; n <= i; n++) {
    const dx = (n - i * 0.5) * 4.2;
    stroke(g, [x + dx - 1, y + 2.6, x + dx + 1, y - 2.6], 1.55, color);
  }
}
function jackpotCup(g, [x, y, r], t) {
  disk(g, x + 1, y + 2, r + 2, '#121c29ba');
  disk(
    g,
    x,
    y,
    r + 1,
    tint(
      g,
      x,
      y - r,
      x + 4,
      y + r,
      [0, '#f6edc2'],
      [0.24, '#6e808b'],
      [0.49, '#34424a'],
      [0.78, t.accent],
      [1, '#665b4b'],
    ),
  );
  disk(g, x, y, r - 2, tint(g, x, y - r, x, y + r, [0, '#06121b'], [0.6, '#10232b'], [1, '#6a8783']));
  oval(g, x, y - 2, r - 5, r * 0.59, '#0a1420');
  rim(g, x, y, r - 4, 0.7, t.light, 0.04, Math.PI * 0.92);
  for (let i = 0; i < 8; i++) {
    const a = (i * TURN) / 8;
    disk(g, x + (r - 0.5) * Math.cos(a), y + (r - 0.5) * Math.sin(a), 1.05, t.light);
  }
  const top = y - r - 9;
  polygon(
    g,
    [x - 27, top - 3, x + 24, top - 3, x + 28, top, x + 25, top + 5, x - 25, top + 5, x - 28, top],
    '#182a32df',
    '#c5b082',
    0.65,
  );
  g.fillStyle = '#ffe4a7';
  g.font = 'bold 7px system-ui';
  g.textAlign = 'center';
  g.fillText('ДЖЕКПОТ', x, top + 3.3);
}
function bumper(g, [x, y, r], t, i) {
  const color = t.lights[i];
  oval(g, x + 1.5, y + 3, r + 2, r + 1, '#071521aa');
  disk(
    g,
    x,
    y,
    r,
    tint(
      g,
      x - r,
      y - r,
      x + r,
      y + r,
      [0, '#fff5ca'],
      [0.18, '#bac8b9'],
      [0.48, '#31404c'],
      [0.61, '#526270'],
      [0.82, '#d8debc'],
      [1, '#606b63'],
    ),
  );
  disk(
    g,
    x,
    y,
    r - 2,
    tint(g, x, y - r, x, y + r, [0, '#182d3b'], [0.45, t.deep], [0.75, color], [0.93, '#4b5658'], [1, '#1f3339']),
  );
  for (let n = 0; n < 6; n++) {
    const a = (n * TURN) / 6;
    rim(g, x, y, r - 3, 2, color, a + 0.06, a + 0.62);
    disk(g, x + (r - 4) * Math.cos(a), y + (r - 4) * Math.sin(a), 0.8, '#fff1c6');
  }
  disk(
    g,
    x,
    y - 1,
    r * 0.72,
    tint(g, x - r, y - r, x + r, y + r, [0, color], [0.38, t.deep], [0.81, '#1b3040'], [1, color]),
  );
  rim(g, x, y - 1, r * 0.71, 0.9, color);
  g.save();
  g.beginPath();
  g.arc(x, y - 1, r * 0.64, 0, TURN);
  g.clip();
  drawLandmark(g, t.props[i], x - r * 0.75, y - r * 0.68, r * 1.5, r * 1.28);
  g.restore();
  rim(g, x, y - 1, r * 0.62, 0.9, '#fff7df94', Math.PI * 1.1, Math.PI * 1.7);
}
function cabinet(g, t, walls) {
  const metal = tint(
    g,
    0,
    0,
    72,
    150,
    [0, '#718288'],
    [0.15, '#243640'],
    [0.42, t.deep],
    [0.7, '#1c2a34'],
    [1, '#849291'],
  );
  const rimPoints = [0, 0, W, 0, W, 108, 347, 108];
  for (const part of walls.slice(0, 8).reverse()) rimPoints.push(part[0], part[1]);
  rimPoints.push(14, 354, 0, 354);
  polygon(g, rimPoints, metal);
  g.fillStyle = tint(g, 0, 0, 12, 0, [0, '#c4cac0'], [0.18, '#51616b'], [0.45, '#21303a'], [1, '#364854']);
  g.fillRect(0, 0, 10, H);
  g.fillStyle = tint(g, 349, 0, 360, 0, [0, '#17252d'], [0.39, '#4a5960'], [0.68, '#9aa49d'], [1, '#3a464a']);
  g.fillRect(349, 0, 11, H);
  for (const [x, y] of [
    [8, 9],
    [352, 9],
    [25, 31],
    [327, 33],
    [8, 258],
    [352, 258],
    [8, 472],
    [352, 472],
  ])
    screw(g, x, y, 2);
  for (const side of [-1, 1]) {
    g.save();
    g.translate(side < 0 ? 10 : 347, 14);
    g.scale(-side, 1);
    for (let i = 0; i < 3; i++) stroke(g, [0, 14 + i * 4, 19, 0 + i * 4], 0.75, t.light + '70');
    g.restore();
  }
  stroke(g, [11, 475, 347, 475], 2, '#68787d');
  stroke(g, [10, 478, 349, 478], 2, '#101b24');
}
function makePlate(g, t, geometry, img) {
  playfield(g, t, img);
  apron(g, t, false);
  apron(g, t, true);
  cabinet(g, t, geometry.walls);
  const { walls, bank, jackpot, skill } = geometry;
  for (const [i, edge] of geometry.slings.entries()) sling(g, edge, walls, t, i);
  for (const seg of walls) rail(g, seg, t.light);
  for (const seg of t.guides ?? []) {
    rail(g, seg, t.accent);
    screw(g, seg[0], seg[1], 1.6);
    screw(g, seg[2], seg[3], 1.6);
  }
  for (const [x, y] of [
    [26, 65],
    [56, 34],
    [250, 21],
    [301, 37],
    [314, 101],
    [46, 385],
    [285, 380],
  ])
    screw(g, x, y, 1.6);
  if (t.world === 'end') {
    // The shulker can also catch the ball here independently of the target bank.
    oval(g, 153, 184, 18, 13, '#231935c4');
    for (let i = 0; i < 4; i++)
      rim(g, 153, 184, 17, 1.25, t.lights[0], (i * Math.PI) / 2 + 0.12, (i * Math.PI) / 2 + 1.0);
    drawLandmark(g, 'exit_portal', 139, 173, 28, 19);
  }
  jackpotCup(g, jackpot, t);
  const [sx, sy, sr] = skill;
  oval(g, sx, sy, sr + 1, sr * 0.56, '#0b1b27');
  oval(g, sx, sy, sr, sr * 0.45, t.line);
  polygon(g, [sx - 5, sy, sx + 3, sy - 2.7, sx + 1.5, sy, sx + 3, sy + 2.7], t.light);
  for (const [i, target] of bank.entries()) bankInsert(g, target, t.lights[i], i);
  g.font = 'bold 7px system-ui';
  g.fillStyle = t.light;
  g.textAlign = 'center';
  g.fillText('БАНК', bank[1][0], bank[1][1] + 19);
  for (const [i, target] of t.layout.entries()) bumper(g, target, t, i);
  for (let i = 0; i < 3; i++) {
    const x = 142 + i * 17,
      y = 383;
    polygon(g, [x - 4, y + 2, x, y - 4, x + 4, y + 2, x, y + 5], '#13303b', t.lights[i] + 'ab', 0.8);
  }
}
function underGlass(g, t, geometry) {
  const image = panorama(scenes[t.world][0]),
    atlas = landmarkAtlas();
  const { width, height } = g.canvas;
  if (
    !cached ||
    cached.table !== t ||
    cached.width !== width ||
    cached.height !== height ||
    cached.sceneWidth !== image.naturalWidth ||
    cached.atlasWidth !== atlas.naturalWidth
  ) {
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const brush = layer.getContext('2d');
    brush.scale(width / W, height / H);
    brush.lineJoin = 'round';
    makePlate(brush, t, geometry, image);
    cached = { table: t, width, height, sceneWidth: image.naturalWidth, atlasWidth: atlas.naturalWidth, layer };
  }
  g.drawImage(cached.layer, 0, 0, W, H);
}
function flipperBat(g, seg, t, i) {
  const [x, y, x2, y2] = seg,
    length = Math.hypot(x2 - x, y2 - y);
  // The barrel follows the capsule used by the solver, including the moving tip.
  stroke(g, [x + 1.2, y + 3, x2 + 1.2, y2 + 3], 11, '#06111bb8');
  g.save();
  g.translate(x, y);
  g.rotate(Math.atan2(y2 - y, x2 - x));
  const reflect = i ? -1 : 1;
  g.scale(1, reflect);
  const surface = tint(
    g,
    0,
    -5,
    0,
    5,
    [0, '#fff5d7'],
    [0.22, i ? t.accent : t.light],
    [0.64, i ? t.accent : t.light],
    [0.78, t.line],
    [1, '#203947'],
  );
  g.beginPath();
  g.moveTo(0, -5.75);
  g.lineTo(length, -4.25);
  g.arc(length, 0, 4.25, -Math.PI / 2, Math.PI / 2);
  g.lineTo(0, 5.75);
  g.arc(0, 0, 5.75, Math.PI / 2, (3 * Math.PI) / 2);
  g.closePath();
  g.fillStyle = surface;
  g.fill();
  g.strokeStyle = '#27343e';
  g.lineWidth = 1;
  g.stroke();
  polygon(g, [10, -2, length - 6, -1.4, length - 3, 0, length - 7, 1, 10, 0.9], '#faf2da');
  for (let j = 0; j < 3; j++) stroke(g, [13 + j * 5, -2.2, 10 + j * 5, 1.6], 1, t.line);
  screw(g, 0, 0, 3.65);
  g.restore();
}
function plunger(g, t, pull) {
  const y = 449 + pull * 11,
    bottom = 470,
    left = 326,
    right = 336;
  g.fillStyle = '#929993';
  g.fillRect(329, y, 4, bottom - y);
  for (let i = 0; i < 6; i++) {
    const at = y + ((bottom - y) * i) / 6,
      next = y + ((bottom - y) * (i + 1)) / 6;
    stroke(g, [left, at, right, (at + next) / 2], 2, '#424e54');
    stroke(g, [right, (at + next) / 2, left, next], 2.2, '#c3cac0');
    stroke(g, [right - 1, (at + next) / 2, left + 1, next - 0.3], 0.65, '#fff4d8');
  }
  stroke(g, [325, y, 337, y], 4, '#35424b');
  stroke(g, [325.5, y - 1, 336.5, y - 1], 1.6, t.accent);
  stroke(g, [324, bottom + 1, 338, bottom + 1], 3.3, '#929c97');
}
function silverBall(g, b, raise, reduced) {
  const { x, vx, vy } = b,
    y = b.y + raise,
    r = 6;
  if (!reduced && Math.hypot(vx, vy) > 480) {
    const dx = vx * 0.012,
      dy = vy * 0.012;
    stroke(g, [x - dx, y - dy, x, y], 3.4, '#ccf9ff36');
  }
  oval(g, x + 1.8, y + 3.9, 6.45, 5.4, '#07111ddb');
  disk(g, x, y, r + 0.45, '#283d49');
  g.save();
  g.beginPath();
  g.arc(x, y, r, 0, TURN);
  g.clip();
  const steel = g.createRadialGradient(x - 2.3, y - 3.2, 0.2, x + 0.45, y + 0.8, 7.5);
  for (const [at, col] of [
    [0, '#fffdf1'],
    [0.19, '#f2fffe'],
    [0.44, '#a3c5ce'],
    [0.53, '#58707e'],
    [0.64, '#273a51'],
    [0.81, '#789099'],
    [1, '#dac29b'],
  ])
    steel.addColorStop(at, col);
  disk(g, x, y, r, steel);
  oval(g, x - 1.8, y - 2.8, 2.45, 1.1, '#fffefa');
  rim(g, x, y, r - 1, 0.85, '#dae9e9b8', 0.32, 0.85);
  g.restore();
}
function lightFeatures(g, s, t, geometry, reduced) {
  const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin((s.ticks / 120) * 5);
  for (const [i, [x, y, r]] of t.layout.entries()) {
    const flash = Math.min(1, s.flash[i] / 0.24);
    if (flash > 0 || s.hits & (1 << i)) {
      const color = t.lights[i];
      bloom(g, x, y, r * 1.65, color, 0.15 + 0.36 * flash);
      rim(g, x, y, r - 3, 1.65, flash > 0.5 ? '#fff7c8' : color);
      const lx = 142 + i * 17,
        ly = 383;
      bloom(g, lx, ly, 10, color, 0.64);
      polygon(g, [lx - 3.5, ly + 1, lx, ly - 3.6, lx + 3.5, ly + 1, lx, ly + 4], color);
    }
  }
  for (const [i, [x, y, r]] of geometry.bank.entries()) {
    if (!(s.bank & (1 << i))) continue;
    const color = t.lights[i];
    bloom(g, x, y, r * 1.55, color, 0.75);
    polygon(
      g,
      [
        x - r * 0.64,
        y - r * 0.32,
        x,
        y - r * 0.56,
        x + r * 0.64,
        y - r * 0.32,
        x + r * 0.53,
        y + r * 0.25,
        x,
        y + r * 0.52,
        x - r * 0.53,
        y + r * 0.25,
      ],
      color,
    );
    for (let j = 0; j <= i; j++) {
      const dx = (j - i * 0.5) * 4.2;
      stroke(g, [x + dx - 1, y + 2.6, x + dx + 1, y - 2.6], 1.5, '#273743');
    }
  }
  const [jx, jy, jr] = geometry.jackpot,
    jackpotWon = s.ticks - s.lastJackpotTick;
  if (s.jackpotTime > 0 || jackpotWon < 72) {
    const color = t.accent;
    bloom(g, jx, jy, jr * 1.7, color, 0.56 * pulse);
    rim(g, jx, jy, jr - 1, 2.2, '#ffe7a6');
    if (s.jackpotTime > 0) {
      rim(g, jx, jy, jr + 3, 1.6, color, -Math.PI / 2, -Math.PI / 2 + TURN * Math.min(1, s.jackpotTime / 18));
      g.font = 'bold 9px system-ui';
      g.fillStyle = '#fff4cc';
      g.textAlign = 'center';
      g.fillText(Math.ceil(s.jackpotTime) + '', jx, jy + 2.5);
    } else if (!reduced) rim(g, jx, jy, jr + jackpotWon / 6, 1.7, color);
  }
  if (s.skillArmed || s.ticks - s.lastSkillTick < 55) {
    const [x, y, r] = geometry.skill;
    bloom(g, x, y, r * 2, t.accent, 0.72 * pulse);
    polygon(g, [x - 5, y, x + 3, y - 3, x + 1, y, x + 3, y + 3], '#fff2cb');
  }
  for (const [i, edge] of geometry.slings.entries()) {
    if (!(s.slings?.[i] > 0)) continue;
    const [x, y, x2, y2] = edge;
    const color = t.lights[i];
    stroke(g, edge, 4.2, color);
    stroke(g, edge, 1.5, '#fff6cd');
    bloom(g, (x + x2) / 2, (y + y2) / 2, 21, color, (0.42 * s.slings[i]) / 0.24);
  }
  if (s.phase === 'ride') {
    const phase = reduced ? 0 : (1.2 - s.ride) * 6;
    bloom(g, 153, 184, 35, t.accent, 0.48);
    g.strokeStyle = t.light;
    g.lineWidth = 1.7;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(153, 184, 30, 20, 0, phase + (i * TURN) / 3, phase + (i * TURN) / 3 + 1.3);
      g.stroke();
    }
  }
  if (s.multiplier > 1) {
    g.font = 'bold 11px system-ui';
    g.textAlign = 'center';
    g.fillStyle = '#fff0c8';
    g.fillText('×' + s.multiplier, 159, 367);
  }
}
export function paintPinball(g, s, table, geometry, { charge = 0, reducedMotion = false } = {}) {
  const pull = s.phase === 'serve' ? Math.max(0, Math.min(1, charge)) : 0;
  g.save();
  g.setTransform(g.canvas.width / W, 0, 0, g.canvas.height / H, 0, 0);
  g.lineJoin = 'round';
  underGlass(g, table, geometry);
  lightFeatures(g, s, table, geometry, reducedMotion);
  const [x, y, x2, y2] = geometry.laneGate;
  const open = s.phase === 'play' && s.ball.vy < 0 && s.ball.x > x && Math.abs(s.ball.y - (y + y2) / 2) < 30;
  rail(g, open ? [x2, y2 - Math.hypot(x2 - x, y2 - y), x2, y2] : geometry.laneGate, table.accent);
  screw(g, x2, y2, 2.3);
  for (let i = 0; i < 2; i++) flipperBat(g, geometry.flipper(i, s.angles[i]), table, i);
  plunger(g, table, pull);
  if (s.phase !== 'done') silverBall(g, s.ball, pull * 11, reducedMotion);
  g.restore();
}
