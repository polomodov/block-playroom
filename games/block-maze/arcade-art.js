// The rides share one pixel-art design between the level and its panoramic sign.
const ink = '#23213c';
const gold = '#ffc463';
const cream = '#ffedba';
const coral = '#ef7065';
const pink = '#b44467';
const mint = '#88d7c8';
const teal = '#3694a1';

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function line(ctx, color, x, y, endX, endY, size = 1) {
  const steps = Math.max(Math.abs(endX - x), Math.abs(endY - y), 1);
  for (let i = 0; i <= steps; i++) {
    rect(ctx, color, Math.round(x + (endX - x) * i / steps),
      Math.round(y + (endY - y) * i / steps), size, size);
  }
}

function horse(ctx, x, y, color) {
  rect(ctx, ink, x, y + 1, 11, 4);
  rect(ctx, color, x + 1, y + 1, 9, 3);
  rect(ctx, color, x + 7, y - 2, 4, 5);
  rect(ctx, color, x + 8, y - 4, 2, 2);
  rect(ctx, color, x + 9, y - 2, 4, 2);
  rect(ctx, ink, x + 9, y - 2, 1, 1);
  rect(ctx, pink, x + 3, y, 4, 2);
  rect(ctx, color, x + 1, y + 4, 2, 3);
  rect(ctx, color, x + 7, y + 4, 2, 3);
  rect(ctx, gold, x - 2, y + 1, 3, 2);
}

function carousel(ctx) {
  rect(ctx, '#412e57', 4, 43, 51, 4);
  rect(ctx, coral, 6, 41, 47, 4);
  rect(ctx, gold, 8, 40, 43, 2);
  rect(ctx, '#a24f68', 25, 16, 9, 24);
  rect(ctx, gold, 27, 17, 3, 23);
  rect(ctx, cream, 27, 18, 1, 19);
  for (const [x, y, color] of [[12, 30, cream], [27, 27, mint], [42, 31, '#fdad75']]) {
    rect(ctx, '#bd795e', x, 17, 2, 22);
    rect(ctx, cream, x, 18, 1, 22);
    horse(ctx, x - 4, y, color);
  }
  // Alternating striped canvas, scalloped valance and a pennant.
  for (let y = 6; y < 19; y++) {
    const half = 3 + (y - 6) * 2;
    for (let x = 29 - half; x <= 29 + half; x++) {
      const band = Math.floor((x - 29 + half) * 7 / (2 * half + 1));
      rect(ctx, [pink, cream, coral, gold, coral, cream, pink][band], x, y, 1, 1);
    }
  }
  rect(ctx, '#9e4667', 2, 18, 55, 4);
  for (let x = 3; x < 55; x += 8) {
    rect(ctx, gold, x, 18, 7, 2);
    rect(ctx, coral, x + 1, 20, 5, 2);
    rect(ctx, coral, x + 2, 22, 3, 1);
    rect(ctx, cream, x + 2, 18, 2, 1);
  }
  rect(ctx, gold, 29, 1, 2, 6);
  rect(ctx, mint, 31, 1, 6, 2);
  rect(ctx, teal, 31, 3, 3, 1);
}

function slide(ctx) {
  // A climbable frame in perspective and a sweeping two-toned chute.
  rect(ctx, '#343655', 5, 44, 49, 2);
  rect(ctx, teal, 9, 15, 3, 29);
  rect(ctx, mint, 10, 15, 1, 28);
  rect(ctx, teal, 23, 15, 3, 26);
  rect(ctx, '#664a75', 7, 16, 22, 3);
  for (let y = 19; y < 43; y += 4) rect(ctx, gold, 10, y, 8, 2);
  rect(ctx, teal, 17, 16, 2, 29);
  rect(ctx, mint, 18, 17, 1, 27);
  rect(ctx, coral, 7, 8, 2, 9);
  rect(ctx, coral, 24, 8, 2, 9);
  for (let y = 2; y < 10; y++) {
    rect(ctx, y < 6 ? coral : pink, 16 - (y - 2) * 2, y, 4 + (y - 2) * 4, 1);
  }
  rect(ctx, gold, 2, 9, 31, 2);
  const track = [[22, 15], [27, 15], [31, 18], [35, 22], [40, 30], [46, 35], [52, 36], [56, 35]];
  for (let i = 1; i < track.length; i++) {
    const [ax, ay] = track[i - 1], [bx, by] = track[i];
    for (let d = 0; d < 7; d++) {
      const color = [coral, cream, gold, '#eda04d', '#f59f53', coral, pink][d];
      line(ctx, color, ax, ay + d, bx, by + d, 1);
    }
  }
  rect(ctx, mint, 46, 41, 2, 3);
}

function claw(ctx) {
  rect(ctx, ink, 13, 3, 34, 42);
  rect(ctx, teal, 15, 5, 30, 6);
  rect(ctx, mint, 16, 5, 28, 1);
  rect(ctx, '#40567c', 17, 11, 26, 21);
  rect(ctx, '#56789a', 18, 12, 23, 16);
  line(ctx, '#7594a6', 18, 23, 28, 13);
  line(ctx, '#7594a6', 19, 25, 31, 13);
  for (const x of [19, 26, 33, 40]) rect(ctx, gold, x, 7, 2, 2);
  rect(ctx, mint, 25, 12, 11, 2);
  rect(ctx, ink, 30, 14, 1, 6);
  line(ctx, cream, 30, 19, 27, 22);
  line(ctx, cream, 30, 19, 33, 22);
  rect(ctx, gold, 27, 22, 2, 1);
  rect(ctx, gold, 32, 22, 2, 1);
  for (const [x, y, color] of [[19, 26, coral], [23, 28, gold], [28, 26, mint], [33, 28, '#cb90db'], [37, 25, cream]]) {
    rect(ctx, color, x, y, 4, 4);
    rect(ctx, color, x, y - 1, 1, 1);
    rect(ctx, color, x + 3, y - 1, 1, 1);
    rect(ctx, ink, x + 1, y + 1, 1, 1);
  }
  rect(ctx, pink, 15, 31, 30, 11);
  rect(ctx, coral, 14, 31, 32, 3);
  rect(ctx, cream, 20, 30, 2, 3);
  rect(ctx, coral, 19, 28, 4, 3);
  rect(ctx, gold, 36, 31, 4, 1);
  rect(ctx, ink, 18, 36, 12, 4);
  rect(ctx, '#ac617e', 19, 36, 10, 1);
  rect(ctx, gold, 38, 36, 2, 4);
  rect(ctx, ink, 17, 44, 5, 2);
  rect(ctx, ink, 39, 44, 5, 2);
}

const rides = { carousel, slide, claw };

const rideImages = new Map();

function drawRide(ctx, type, x, y, width, height) {
  let image = rideImages.get(type);
  if (!image) {
    image = document.createElement('canvas');
    image.width = 60;
    image.height = 48;
    rides[type](image.getContext('2d'));
    rideImages.set(type, image);
  }
  const scale = Math.min(width / image.width, height / image.height);
  const w = Math.round(image.width * scale), h = Math.round(image.height * scale);
  ctx.drawImage(image, Math.round(x + (width - w) / 2), y + height - h, w, h);
}

export function drawArcadeLandscape(ctx) {
  rect(ctx, '#333959', 0, 0, 480, 100);
  // Panoramic sunset through the windows of the play hall.
  ['#5c5378', '#936686', '#c48289', '#e8ad91'].forEach((c, i) => rect(ctx, c, 0, 10 + 11 * i, 480, 12));
  for (let x = 0; x < 480; x += 8) {
    const height = ((x / 8 * 7) % 21) + 5;
    rect(ctx, '#625878', x, 60 - height, 8, height);
    if (height > 18) rect(ctx, '#d9aa91', x + 3, 48, 2, 1);
  }
  for (let x = 0; x < 480; x += 74) {
    rect(ctx, '#3d405e', x, 5, 4, 54);
    rect(ctx, '#827690', x + 4, 9, 1, 48);
    line(ctx, '#6e6682', x, 26, x + 22, 7, 2);
  }
  rect(ctx, '#4c4863', 0, 57, 480, 10);
  rect(ctx, '#88758e', 0, 57, 480, 2);
  rect(ctx, '#46415d', 0, 67, 480, 33);
  for (let x = -40; x < 480; x += 32) line(ctx, '#595069', x + 25, 68, x - 8, 99);
  for (const y of [71, 77, 88]) rect(ctx, '#595069', 0, y, 480, 1);
  rect(ctx, '#272f4a', 0, 0, 480, 6);
  for (let x = 0; x < 480; x += 68) {
    line(ctx, '#44425e', x, 0, x + 15, 13, 2);
    line(ctx, '#44425e', x + 15, 13, x + 33, 0, 2);
  }
  for (let x = 0; x < 480; x++) {
    const y = Math.round(8 + Math.abs(Math.sin(Math.PI * x / 114)) * 9);
    rect(ctx, '#37364e', x, y, 1, 1);
    if (x % 12 === 0) {
      const color = [gold, coral, mint, '#d79bd4'][(x / 12) % 4];
      rect(ctx, color, x, y + 1, 3, 3);
      rect(ctx, cream, x + 1, y + 1, 1, 1);
    }
  }
  drawRide(ctx, 'slide', 165, 30, 97, 52);
  drawRide(ctx, 'carousel', 244, 16, 138, 77);
  drawRide(ctx, 'claw', 371, 30, 71, 58);
  drawRide(ctx, 'claw', 413, 41, 60, 47);
  for (const x of [0, 147, 471]) {
    rect(ctx, '#272e43', x, 0, 8, 90);
    rect(ctx, '#5c4b69', x + 1, 0, 2, 88);
  }
  rect(ctx, '#393449', 0, 96, 480, 4);
}

export function arcadeTile(ctx, map, x, y, unit, seed) {
  const px = x * unit, py = y * unit;
  if (map[y][x] === '.') {
    rect(ctx, (x + y) % 2 ? '#272b43' : '#2b2f48', px, py, unit, unit);
    if (seed % 5 === 0) {
      rect(ctx, '#40405a', px + 3, py + 13, 2, 1);
      rect(ctx, '#383e56', px + 14, py + 6, 1, 2);
    }
    return;
  }
  const tones = ['#53557c', '#575981', '#565b84'];
  rect(ctx, tones[seed % 3], px, py, unit, unit);
  rect(ctx, '#494e72', px + 2, py + 9, 7, 1);
  rect(ctx, '#62648c', px + 7, py + 3, 8, 1);
  if (map[y - 1]?.[x] !== '#') {
    rect(ctx, '#a3afd4', px, py, unit, 1);
    rect(ctx, '#787da3', px, py + 1, unit, 2);
  }
  if (map[y + 1]?.[x] !== '#') {
    rect(ctx, '#383b5c', px, py + unit - 5, unit, 5);
    rect(ctx, '#9395bd', px, py + unit - 6, unit, 1);
    rect(ctx, (x + y) % 2 ? '#e19997' : '#86c6bb', px + 4, py + unit - 4, unit - 8, 1);
  }
  if (map[y][x - 1] !== '#') rect(ctx, '#8c87a4', px, py + 2, 1, unit - 5);
  if (map[y][x + 1] !== '#') rect(ctx, '#3a405f', px + unit - 1, py + 1, 1, unit - 4);
}

export function drawAttraction(ctx, decoration, tile) {
  const { x, y, width, height, type } = decoration;
  const px = x * tile, py = y * tile, w = width * tile, h = height * tile;
  // The bolted platform fits entirely inside the obstacle that owns it.
  rect(ctx, '#3b405e', px + 2, py + 2, w - 4, h - 6);
  rect(ctx, '#434665', px + 4, py + 4, w - 8, h - 10);
  for (const dx of [5, w - 7]) {
    for (const dy of [5, h - 9]) rect(ctx, '#adb2c4', px + dx, py + dy, 2, 2);
  }
  drawRide(ctx, type, px + 3, py + 3, w - 6, h - 8);
}

export function drawRideLights(ctx, decoration, tile, time) {
  if (decoration.type !== 'carousel') return;
  const left = decoration.x * tile + 6;
  const bottom = (decoration.y + decoration.height) * tile - 5;
  const width = decoration.width * tile - 12;
  // The running lights are the only moving pixels on the cached ride platform.
  const phase = Math.floor(time * 4);
  for (let i = 0; i < 9; i++) {
    const lit = (i + phase) % 3 === 0;
    const x = Math.round(left + i * width / 8);
    rect(ctx, lit ? cream : '#986b77', x - 1, bottom, 2, 1);
    rect(ctx, lit ? gold : '#785c70', x - 1, bottom + 1, 2, 1);
  }
}
