// All scenes are drawn on the same low-resolution grid as the game sprites.
const night = '#25273f';
const slate = '#555878';
const stone = '#777492';
const moonlight = '#a5a1b1';
const amber = '#ffba68';
const candle = '#ffe9a7';
const pumpkin = '#ed843e';

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function oval(ctx, color, x, y, rx, ry) {
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2));
    rect(ctx, color, x - half, y + dy, 2 * half + 1, 1);
  }
}

function line(ctx, color, x, y, tx, ty, weight = 1) {
  const steps = Math.max(1, Math.abs(tx - x), Math.abs(ty - y));
  for (let i = 0; i <= steps; i++) {
    rect(ctx, color, Math.round(x + (tx - x) * i / steps),
      Math.round(y + (ty - y) * i / steps), weight, weight);
  }
}

function lancet(ctx, x, y, color) {
  rect(ctx, night, x - 1, y + 2, 7, 9);
  rect(ctx, color, x, y + 3, 5, 7);
  rect(ctx, color, x + 1, y + 1, 3, 2);
  rect(ctx, color, x + 2, y, 1, 1);
  rect(ctx, slate, x + 2, y + 3, 1, 7);
  rect(ctx, slate, x, y + 6, 5, 1);
  rect(ctx, moonlight, x - 2, y + 11, 9, 1);
}

function tower(ctx, x, roof, base, width) {
  const height = Math.round(width * .73);
  const top = roof + height;
  rect(ctx, slate, x + 2, top, width - 4, base - top);
  rect(ctx, stone, x + 3, top, 3, base - top);
  rect(ctx, '#444962', x + width - 6, top, 4, base - top);
  for (let i = 0; i <= height; i++) {
    const half = Math.round((i / height) * (width / 2));
    const left = x + Math.floor(width / 2) - half;
    rect(ctx, '#433a60', left, roof + i, Math.max(1, 2 * half), 1);
    if (half > 0) rect(ctx, i % 4 ? '#88678e' : '#aa8099', left, roof + i, Math.min(3, half), 1);
  }
  rect(ctx, moonlight, x - 1, top, width + 2, 1);
  rect(ctx, '#35384f', x, top + 1, width, 2);
  lancet(ctx, x + Math.floor(width / 2) - 2, top + 5, amber);
  if (base - top > 23) {
    rect(ctx, stone, x + 2, top + 19, width - 4, 2);
    rect(ctx, night, x + 6, top + 23, 2, 5);
  }
}

function fortress(ctx) {
  // Local coordinates: a 76 × 49 castle with a raised portcullis.
  rect(ctx, '#49475e', 13, 27, 49, 19);
  rect(ctx, stone, 14, 26, 47, 3);
  for (let x = 15; x < 61; x += 8) {
    rect(ctx, slate, x, 21, 5, 6);
    rect(ctx, moonlight, x, 21, 5, 1);
  }
  tower(ctx, 4, 4, 47, 18);
  tower(ctx, 55, 1, 47, 17);
  tower(ctx, 26, 0, 27, 15);
  rect(ctx, stone, 25, 25, 24, 22);
  rect(ctx, moonlight, 26, 25, 22, 1);
  rect(ctx, slate, 26, 27, 2, 20);
  rect(ctx, night, 30, 35, 14, 12);
  rect(ctx, night, 32, 32, 10, 4);
  rect(ctx, night, 35, 30, 4, 3);
  rect(ctx, '#a67057', 31, 37, 12, 9);
  rect(ctx, '#e4a259', 33, 36, 8, 10);
  for (let x = 32; x < 44; x += 3) rect(ctx, night, x, 34, 1, 7 + x % 2);
  rect(ctx, night, 30, 37, 14, 1);
  rect(ctx, '#a78c89', 29, 46, 16, 2);
  rect(ctx, '#796d78', 26, 48, 22, 1);
  rect(ctx, '#a88e87', 63, 0, 1, 3);
}

function lantern(ctx, x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  rect(ctx, '#68715a', 6, 0, 3, 4);
  rect(ctx, '#aeb180', 7, 0, 3, 1);
  oval(ctx, '#a45539', 7, 8, 7, 5);
  oval(ctx, pumpkin, 7, 7, 6, 4);
  rect(ctx, '#f7a052', 4, 4, 2, 7);
  rect(ctx, night, 3, 6, 3, 2);
  rect(ctx, night, 9, 6, 3, 2);
  rect(ctx, candle, 4, 7, 2, 1);
  rect(ctx, candle, 9, 7, 2, 1);
  rect(ctx, '#6a4238', 5, 10, 5, 1);
  rect(ctx, candle, 6, 10, 2, 1);
  ctx.restore();
}

function patch(ctx) {
  for (const y of [24, 33, 44]) {
    rect(ctx, '#4f464a', 3, y, 68, 3);
    line(ctx, '#6b8267', 7, y + 1, 63, y - 2);
    for (const x of [12, 30, 48]) rect(ctx, '#87a073', x, y - 3, 4, 2);
  }
  for (const x of [4, 20, 37, 53, 68]) {
    rect(ctx, '#45414b', x, 12, 3, 14);
    rect(ctx, '#887575', x, 12, 1, 12);
  }
  rect(ctx, '#756270', 3, 16, 68, 2);
  lantern(ctx, 9, 12, 1.25);
  lantern(ctx, 27, 22, 1.5);
  lantern(ctx, 51, 14);
  lantern(ctx, 55, 29);
}

function cauldron(ctx) {
  line(ctx, '#a17e61', 12, 43, 24, 8, 2);
  line(ctx, '#a17e61', 60, 43, 51, 8, 2);
  rect(ctx, '#8c7469', 16, 8, 43, 3);
  rect(ctx, '#bd9d79', 18, 8, 39, 1);
  rect(ctx, '#38334b', 35, 10, 2, 6);
  for (let x = 28; x <= 47; x += 5) {
    rect(ctx, '#de784a', x, 35, 4, 8);
    rect(ctx, amber, x + 1, 33 + x % 4, 2, 7);
  }
  rect(ctx, '#846357', 23, 42, 29, 3);
  oval(ctx, '#292e42', 37, 28, 15, 11);
  oval(ctx, '#495363', 34, 28, 10, 8);
  rect(ctx, '#777e82', 24, 24, 2, 6);
  rect(ctx, '#262d3f', 19, 19, 36, 5);
  rect(ctx, '#80ce96', 21, 19, 32, 3);
  rect(ctx, '#c6f5aa', 26, 19, 12, 1);
  rect(ctx, '#7bc891', 24, 21, 2, 7);
  rect(ctx, '#95daac', 38, 12, 3, 3);
  rect(ctx, '#acdfb9', 29, 7, 2, 2);
  lantern(ctx, 52, 31);
}

const fixtures = { gatehouse: fortress, cauldron, pumpkin_patch: patch };

function drawScaled(ctx, draw, x, y, scale) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  draw(ctx);
  ctx.restore();
}

function tree(ctx, x, base, size) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(size, size);
  const bark = '#373347';
  line(ctx, bark, -1, -1, 0, -18, 4);
  line(ctx, bark, 0, -18, -4, -30, 3);
  line(ctx, bark, -4, -30, -2, -40, 2);
  line(ctx, bark, -3, -22, -13, -29, 2);
  line(ctx, bark, -13, -29, -15, -36, 1);
  line(ctx, bark, -12, -28, -22, -28);
  line(ctx, bark, 1, -14, 13, -25, 3);
  line(ctx, bark, 13, -25, 13, -35);
  line(ctx, bark, 12, -25, 18, -23);
  ctx.restore();
}

export function drawCastleLandscape(ctx) {
  rect(ctx, '#353653', 0, 0, 480, 100);
  for (const [y, color] of [[14,'#49415f'],[31,'#65536e'],[49,'#89687a'],[68,'#b08280']]) {
    rect(ctx, color, 0, y, 480, 100 - y);
  }
  oval(ctx, '#af8f9a', 363, 26, 22, 22);
  oval(ctx, '#f5dba8', 363, 26, 18, 18);
  oval(ctx, '#e4c99f', 369, 20, 4, 2);
  oval(ctx, '#e4c99f', 359, 36, 3, 2);
  for (const [x,y] of [[43,9],[127,20],[191,10],[239,23],[284,8],[405,9],[448,17]]) {
    rect(ctx, '#c8b7b6', x, y, 2, 1);
  }
  for (let x = 0; x < 480; x += 3) {
    const y = Math.round(55 + Math.sin(x / 40) * 6 + Math.sin(x / 19) * 3);
    rect(ctx, '#715b74', x, y, 3, 100 - y);
    const nearer = Math.round(72 + Math.cos(x / 32) * 4);
    rect(ctx, '#51485e', x, nearer, 3, 100 - nearer);
  }
  for (const [x,y] of [[176,32],[221,23],[414,28],[394,35]]) {
    rect(ctx, night, x, y, 2, 1);
    rect(ctx, night, x + 2, y + 1, 2, 1);
    rect(ctx, night, x + 4, y, 2, 1);
  }
  drawScaled(ctx, fortress, 260, 17, 1.48);
  tree(ctx, 251, 85, .85);
  tree(ctx, 407, 91, 1.25);
  tree(ctx, 51, 84, 1.25);
  for (let x = 0; x < 480; x += 2) {
    const y = Math.round(90 + 6 * Math.sin(x / 36) - 3 * Math.cos(x / 18));
    rect(ctx, '#454152', x, y, 2, 101 - y);
  }
  for (const [x,y,size] of [[199,85,.8],[216,88,.65],[370,77,1.1],[388,83,.8],[442,80,1.2],[459,85,.8]]) lantern(ctx,x,y,size);
  for (const [x, y, width] of [[80,62,39],[133,67,28],[198,58,34],[372,65,23]]) rect(ctx,'#968394',x,y,width,1);
}

export function castleTile(ctx, map, x, y, tile, seed) {
  const px = x * tile, py = y * tile;
  if (map[y][x] === '.') {
    rect(ctx, (x + y) % 2 ? '#302f41' : '#343345', px, py, tile, tile);
    rect(ctx, '#2b2c3b', px, py + tile - 1, tile, 1);
    if (seed % 3 === 0) rect(ctx, '#414153', px + seed % 9, py + 6, 5, 1);
    return;
  }
  rect(ctx, '#62647e', px, py, tile, tile);
  for (let row = 0; row < 3; row++) {
    const by = py + 7 * row;
    rect(ctx, '#52566e', px, by, tile, 1);
    rect(ctx, row % 2 ? '#71718a' : '#7c788d', px + 1, by + 1, tile - 2, 1);
    rect(ctx, '#535971', px + (row % 2 ? 5 : 14), by, 1, 6);
  }
  if (map[y - 1]?.[x] !== '#') rect(ctx, '#a099ac', px, py, tile, 2);
  if (map[y + 1]?.[x] !== '#') {
    rect(ctx, '#424459', px, py + tile - 4, tile, 4);
    rect(ctx, '#838195', px, py + tile - 5, tile, 1);
  }
  if (map[y][x - 1] !== '#') rect(ctx, '#9291a1', px, py + 2, 1, tile - 5);
}

export function drawCastleFixture(ctx, {type, x, y, width, height}, tile) {
  const px = x * tile, py = y * tile, w = width * tile, h = height * tile;
  rect(ctx, '#4c4b60', px + 2, py + 2, w - 4, h - 6);
  rect(ctx, '#686178', px + 4, py + 4, w - 8, h - 11);
  const scale = Math.min((w - 6) / 76, (h - 7) / 49);
  drawScaled(ctx, fixtures[type], px + (w - 76 * scale) / 2, py + h - 5 - 49 * scale, scale);
}

export function castleLights(ctx, decoration, tile, time) {
  if (decoration.type !== 'cauldron') return;
  const w = decoration.width * tile, h = decoration.height * tile;
  const scale = Math.min((w - 6) / 76, (h - 7) / 49);
  const x = decoration.x * tile + (w - 76 * scale) / 2;
  const y = decoration.y * tile + h - 5 - 49 * scale;
  for (let i = 0; i < 3; i++) {
    const rise = (time * 5 + i * 3) % 12;
    rect(ctx, '#b1e4b6', Math.round(x + scale * (26 + 4 * i + Math.sin(rise / 3))),
      Math.round(y + scale * (18 - rise)), 2, 2);
  }
}

export const castleMonsterColors = {
  a: '#3c5067', b: '#7badbf', c: '#b8d9db', d: '#e3f2db', e: '#343448',
  f: '#a25233', g: '#ed8b3e', h: '#ffc961', i: '#fff1a2', j: '#567952',
  k: '#89994e', l: '#5b514d', m: '#714434',
};

export const castleMonsterPixels = {
  ghost: [
    '......aaaa......', '....aabccbaa....', '...abcddcccba...', '..abccddddccba..',
    '..abcddeedecca..', '..abcdeeedecca..', '..abccdddddcca..', '.abcbddeeddcba..',
    'abcbbdddddccbba.', '.aaabcdddccbaaa.', '...abccddccba...', '...abccddccbba..',
    '..abcbcccbabbba.', '..aba.abcba.aaa.', '..aa...aba......', '........aa......',
  ],
  pumpkin_guard: [
    '.......jkk......', '......kjj.......', '....ffgghggff...', '...fghhghhgggf..',
    '..fghiegghiegff.', '..fggeeggeegggf.', '..fgghhgghhgggf.', '...fgmgiigmgff..',
    '....ffgggggff...', '..jjlkjjjjkljj..', '.kjjlkjkkjkljjk.', '.jk.lkkjjkkjl.j.',
    '....llkmmkkll...', '.....jl..jl.....', '....kjl..jlk....', '...kjll..lljk...',
  ],
};
