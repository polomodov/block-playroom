// Paint on the native pixel grid. The panoramic view and the map share the same rides.
const foam = '#e0f9df';
const water = '#49cbd5';
const lagoon = '#258fb0';
const deep = '#225b79';
const marigold = '#ffa932';
const lemon = '#ffe27a';
const coral = '#ed7062';
const red = '#a8474c';

function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function oval(ctx, color, cx, cy, rx, ry) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(1 - y * y / (ry * ry)));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

function trail(ctx, color, points, width = 1, height = width) {
  ctx.fillStyle = color;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
    for (let s = 0; s <= steps; s++) {
      ctx.fillRect(Math.round(ax + (bx - ax) * s / steps), Math.round(ay + (by - ay) * s / steps), width, height);
    }
  }
}

function flume(ctx, path, colors) {
  // A continuous stepped rim and side bands make the open chute readable at board scale.
  for (let row = 0; row < colors.length; row++) {
    const offset = path.map(([x, y]) => [x, y + row]);
    trail(ctx, colors[row], offset, 3, 1);
  }
}

function tower(ctx, x, top, floor) {
  const shade = '#496586';
  for (const dx of [1, 13, 24]) {
    rect(ctx, shade, x + dx, top + 5, 3, floor - top - 5);
    rect(ctx, '#a0bcb9', x + dx, top + 5, 1, floor - top - 5);
  }
  for (let y = top + 10; y + 2 < floor; y += 4) rect(ctx, '#d6c69c', x + 4, y, 8, 2);
  rect(ctx, '#68879a', x + 11, top + 6, 2, floor - top - 5);
  for (const dx of [0, 8, 16, 25]) rect(ctx, '#c1d3c6', x + dx, top, 2, 8);
  rect(ctx, '#f2deae', x, top, 27, 2);
  rect(ctx, '#6e5762', x - 1, top + 8, 30, 3);
  rect(ctx, '#f4bc76', x - 1, top + 7, 30, 2);
}

function typhoon(ctx) {
  tower(ctx, 2, 5, 48);
  // A high feed tube curls into the broad mouth of the conical bowl.
  const inlet = [[24, 11], [31, 11], [36, 14], [38, 20], [43, 23], [50, 23], [54, 19]];
  flume(ctx, inlet, [lemon, marigold, '#ee8a3f', coral, red]);
  // Taper the striped shell into its outlet. The ellipse above it is seen from the catwalk.
  for (let dy = 0; dy < 19; dy++) {
    const radius = Math.round(27 - dy * 1.17);
    const left = 58 - radius;
    rect(ctx, '#ba5247', left, 26 + dy, radius * 2 + 1, 1);
    rect(ctx, coral, left + 2, 26 + dy, Math.max(1, radius >> 1), 1);
    rect(ctx, marigold, left + Math.ceil(radius * .55), 26 + dy, Math.max(2, Math.floor(radius * .8)), 1);
    rect(ctx, '#f78343', 58 + Math.floor(radius * .35), 26 + dy, Math.max(1, radius >> 2), 1);
  }
  rect(ctx, red, 54, 44, 10, 3);
  const outlet = [[55, 45], [52, 48], [42, 50], [36, 49]];
  flume(ctx, outlet, [foam, water, lagoon, deep]);
  oval(ctx, '#b84e44', 58, 26, 28, 10);
  oval(ctx, marigold, 58, 24, 28, 10);
  oval(ctx, lemon, 58, 23, 27, 9);
  oval(ctx, coral, 58, 23, 24, 7);
  oval(ctx, '#b8544e', 58, 24, 21, 6);
  oval(ctx, water, 58, 25, 20, 5);
  // The narrowing spiral ends in a dark drain.
  const spiral = [];
  for (let i = 0; i <= 68; i++) {
    const angle = i * .12, radius = 18 * (1 - i / 73);
    spiral.push([58 + Math.round(Math.cos(angle) * radius), 25 + Math.round(Math.sin(angle) * radius * .25)]);
  }
  trail(ctx, foam, spiral);
  oval(ctx, deep, 58, 25, 3, 1);
}

function waterslides(ctx) {
  tower(ctx, 6, 6, 47);
  const back = [[30, 12], [37, 12], [40, 15], [43, 22], [48, 27], [59, 29], [63, 33], [64, 39], [69, 42], [79, 43]];
  flume(ctx, back, ['#b7edf0', water, '#4399c4', '#4276ab', '#3e6487']);
  const front = [[18, 13], [26, 13], [32, 17], [34, 23], [31, 28], [27, 30], [26, 34], [31, 38], [46, 39], [52, 43], [59, 46], [66, 46]];
  flume(ctx, front, [lemon, '#ffcb61', marigold, coral, red]);
  rect(ctx, foam, 66, 47, 5, 1);
  rect(ctx, foam, 72, 45, 2, 1);
  rect(ctx, foam, 78, 43, 5, 2);
  rect(ctx, '#986451', 15, 0, 2, 7);
  rect(ctx, coral, 17, 0, 7, 3);
  rect(ctx, '#ffd582', 17, 0, 6, 1);
}

function parasol(ctx, x, y, radius) {
  rect(ctx, '#986c59', x, y + 2, 2, radius);
  rect(ctx, '#ead3a3', x, y + 2, 1, radius);
  const height = Math.ceil(radius / 2);
  for (let dy = 0; dy <= height; dy++) {
    const half = Math.round(radius * dy / height);
    rect(ctx, coral, x - half, y - height + dy, 2 * half + 1, 1);
    rect(ctx, '#ffdd9e', x - Math.ceil(half / 2), y - height + dy, Math.ceil(half / 2), 1);
    rect(ctx, red, x + Math.ceil(half / 3), y - height + dy, Math.ceil(half / 3), 1);
  }
}

function wavePool(ctx) {
  rect(ctx, '#749c9b', 3, 17, 81, 31);
  rect(ctx, '#f1d49a', 3, 14, 81, 32);
  rect(ctx, '#fff0bd', 3, 14, 81, 2);
  rect(ctx, deep, 7, 18, 73, 24);
  rect(ctx, lagoon, 8, 20, 71, 20);
  rect(ctx, water, 8, 27, 71, 13);
  for (let x = 13; x < 75; x += 14) {
    rect(ctx, foam, x, 31, 6, 1);
    rect(ctx, '#97ebe1', x - 3, 32, 4, 1);
  }
  // The planted wave jets, pool ladder and parasol distinguish the basin from the flumes.
  for (const x of [12, 25, 38]) {
    rect(ctx, '#448393', x, 12, 8, 7);
    rect(ctx, foam, x + 1, 12, 6, 2);
    rect(ctx, '#86e3df', x + 2, 17, 4, 6);
  }
  for (const x of [68, 73]) rect(ctx, '#e1f1d5', x, 36, 1, 8);
  rect(ctx, foam, 68, 38, 6, 1);
  rect(ctx, foam, 68, 41, 6, 1);
  parasol(ctx, 72, 8, 11);
}

const rides = { typhoon, water_slide: waterslides, wave_pool: wavePool };
const rideImages = new Map();

function rideImage(ctx, type, x, y, w, h) {
  let image = rideImages.get(type);
  if (!image) {
    image = document.createElement('canvas');
    image.width = 88;
    image.height = 54;
    rides[type](image.getContext('2d'));
    rideImages.set(type, image);
  }
  const scale = Math.min(w / image.width, h / image.height);
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);
  ctx.drawImage(image, Math.round(x + (w - width) / 2), y + h - height, width, height);
}

function palm(ctx, x, y, h, colors) {
  const [stem, leaf, light] = colors;
  const tip = x + Math.round(h / 8);
  trail(ctx, stem, [[x, y], [x + 1, y - h / 3], [tip - 2, y - h * .8], [tip, y - h]], 3);
  const crown = y - h;
  for (const dx of [-1, 1]) {
    const end = Math.round(h / 2.3) * dx;
    trail(ctx, leaf, [[tip, crown], [tip + Math.round(end / 2), crown - 5], [tip + end, crown - 4], [tip + end + dx * 4, crown]], 3);
    trail(ctx, light, [[tip + dx, crown], [tip + Math.round(end / 2), crown - 3], [tip + end, crown + 2]], 2);
    trail(ctx, leaf, [[tip, crown], [tip + dx * 6, crown + 1], [tip + dx * 9, crown + 5], [tip + dx * 10, crown + 12]], 2);
  }
}

export function drawWaterparkLandscape(ctx) {
  rect(ctx, '#75cdd0', 0, 0, 480, 100);
  rect(ctx, '#9fdfd5', 0, 32, 480, 27);
  rect(ctx, '#c4e6cd', 0, 53, 480, 12);
  oval(ctx, '#ffdf83', 396, 20, 12, 12);
  for (const [x, y, w] of [[114, 17, 36], [177, 22, 28], [240, 8, 30], [425, 28, 30], [67, 32, 25]]) {
    rect(ctx, '#e0eee0', x, y, w, 3);
    rect(ctx, '#e0eee0', x + 6, y - 3, w - 13, 3);
    rect(ctx, '#f6f1d2', x + 10, y - 5, w - 20, 2);
  }
  for (let x = -10; x < 490; x += 9) {
    const peak = Math.round(53 - 6 * Math.sin(x / 26) - 3 * Math.sin(x / 8));
    rect(ctx, '#78b9aa', x, peak, 9, 65 - peak);
  }
  const distant = ['#599691', '#5d9c90', '#76b29d'];
  for (const [x, h] of [[36, 16], [66, 22], [148, 23], [198, 15], [371, 19], [447, 21]]) palm(ctx, x, 61, h, distant);
  rect(ctx, '#e0c994', 0, 60, 480, 7);
  rect(ctx, foam, 0, 65, 480, 2);
  rect(ctx, '#65cdcf', 0, 67, 480, 33);
  rect(ctx, '#49b6c0', 0, 80, 480, 20);
  for (let x = 0; x < 480; x += 16) {
    const y = 69 + (x * 7 % 27);
    rect(ctx, '#93e1d6', x, y, 6 + x % 9, 1);
    rect(ctx, '#93e1d6', x + 7, y - 1, 4, 1);
  }
  rideImage(ctx, 'water_slide', 155, 24, 89, 46);
  rideImage(ctx, 'typhoon', 225, 7, 175, 89);
  parasol(ctx, 414, 63, 14);
  parasol(ctx, 442, 63, 11);
  const front = ['#6c806a', '#398778', '#6ca78b'];
  palm(ctx, 7, 82, 62, front);
  palm(ctx, 463, 87, 56, front);
  // A lifebuoy and rope bridge frame the near corner of the pool.
  rect(ctx, '#e8c68c', 365, 95, 115, 5);
  trail(ctx, '#f7e4b2', [[389, 82], [410, 86], [439, 83], [466, 87], [480, 85]], 1, 2);
  for (const x of [388, 438, 477]) rect(ctx, '#aa8b65', x, 81, 3, 17);
  oval(ctx, coral, 439, 87, 5, 5);
  oval(ctx, '#68c6c3', 439, 87, 2, 2);
  rect(ctx, foam, 438, 82, 3, 2);
  rect(ctx, foam, 438, 90, 3, 2);
}

export function waterparkTile(ctx, map, col, row, unit, seed) {
  const x = col * unit, y = row * unit;
  if (map[row][col] === '.') {
    // Muted timber keeps moving characters and emeralds bright against the walkways.
    rect(ctx, (col + row) % 2 ? '#4c453a' : '#50483c', x, y, unit, unit);
    for (const dy of [5, 12, 19]) rect(ctx, '#423d37', x, y + dy, unit, 1);
    rect(ctx, '#655846', x + seed % 9, y + 7, 5, 1);
    return;
  }
  rect(ctx, '#347e90', x, y, unit, unit);
  rect(ctx, '#458f9a', x + 2, y + 4 + seed % 3, 9, 1);
  rect(ctx, '#4c96a0', x + 11, y + 3 + seed % 3, 4, 1);
  rect(ctx, '#2f778b', x + 6, y + 14, 9, 1);
  // Tiled coping follows just the exposed edge of each basin.
  if (map[row - 1]?.[col] !== '#') {
    rect(ctx, '#c0d9c9', x, y, unit, 2);
    rect(ctx, '#86bab4', x, y + 2, unit, 1);
  }
  if (map[row + 1]?.[col] !== '#') {
    rect(ctx, '#184c62', x, y + unit - 4, unit, 4);
    rect(ctx, '#98c6bb', x, y + unit - 4, unit, 2);
  }
  if (map[row][col - 1] !== '#') rect(ctx, '#a4cfc1', x, y, 2, unit - 2);
  if (map[row][col + 1] !== '#') rect(ctx, '#5d9b9e', x + unit - 2, y, 2, unit - 2);
}

export function drawWaterRide(ctx, ride, tile) {
  rideImage(ctx, ride.type, ride.x * tile + 3, ride.y * tile + 3,
    ride.width * tile - 6, ride.height * tile - 8);
}

export function waterRipples(ctx, ride, tile, time) {
  // Animate just the narrow strip of water ahead of the attraction.
  const width = ride.width * tile;
  const phase = Math.floor(time * 3);
  for (let i = 0; i < 3; i++) {
    const x = ride.x * tile + 4 + Math.floor((phase + i * width / 3) % (width - 14));
    const y = (ride.y + ride.height) * tile - 6 - i % 2;
    rect(ctx, '#87d1cb', x, y, 5, 1);
    rect(ctx, '#6ab5bd', x + 5, y - 1, 2, 1);
  }
}

export function drawRideAccess(ctx, ride, tile) {
  const x = ride.entry[0] * tile, y = ride.entry[1] * tile;
  rect(ctx, deep, x + 1, y - 3, tile - 2, 11);
  rect(ctx, water, x + 2, y - 3, tile - 4, 8);
  // A pair of chevrons leaves the center of the boarding tile free for its gem.
  for (const left of [x + 1, x + tile - 7]) {
    trail(ctx, lemon, [[left, y + 9], [left + 2, y + 7], [left + 4, y + 9]], 2);
    rect(ctx, lemon, left + 2, y + 9, 2, 3);
  }
  const ex = ride.exit[0] * tile, ey = ride.exit[1] * tile;
  rect(ctx, deep, ex + 3, ey + 12, tile - 6, 9);
  rect(ctx, water, ex + 4, ey + 14, tile - 8, 7);
  trail(ctx, foam, [[ex + 1, ey + 14], [ex + 4, ey + 16], [ex + 7, ey + 15]]);
  trail(ctx, foam, [[ex + tile - 1, ey + 13], [ex + tile - 5, ey + 16], [ex + tile - 8, ey + 15]]);
}

export function riderPosition(state, tile) {
  const { entry, exit, duration } = state.ride;
  const progress = Math.max(0, Math.min(1, 1 - state.rideRemaining / duration));
  const bowl = state.decorations.find(ride => ride.type === 'typhoon');
  // Match the illustrated funnel at (58,25) in the ride's 88×54 sprite.
  const w = bowl.width * tile - 6, h = bowl.height * tile - 8;
  const scale = Math.min(w / 88, h / 54);
  const cx = bowl.x * tile + 3 + (w - scale * 88) / 2 + 58 * scale;
  const cy = bowl.y * tile + 3 + h - scale * 54 + 25 * scale;
  const start = entry.map(v => (v + .5) * tile);
  const end = exit.map(v => (v + .5) * tile);
  const radius = 18 * scale;
  function between(a, b, t) {
    return a.map((v, i) => Math.round(v + (b[i] - v) * t));
  }
  if (progress < .24) return between(start, [cx - radius, cy], progress / .24);
  if (progress > .8) return between([cx, cy], end, (progress - .8) / .2);
  const t = (progress - .24) / .56;
  const angle = Math.PI + Math.PI * 2 * t;
  const r = radius * (1 - t);
  return [Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle) * .36)];
}
