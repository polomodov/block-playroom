// A walk through a furniture showroom, from the display rooms to the box racks.
const wood = '#bc8b5f';
const birch = '#e7bd87';
const oak = '#805a41';
const metal = '#355b61';
const shadow = '#303d45';
const cream = '#ffe7b6';
const coral = '#df805e';

function rect(ctx, ink, x, y, w, h) {
  ctx.fillStyle = ink;
  ctx.fillRect(x, y, w, h);
}

function lamp(ctx, x, y) {
  rect(ctx, shadow, x + 6, y + 5, 2, 22);
  rect(ctx, '#cb9a53', x + 6, y + 5, 1, 22);
  rect(ctx, shadow, x + 2, y + 27, 10, 2);
  for (let i = 0; i < 7; i++) {
    rect(ctx, i > 4 ? '#d39c60' : '#f1ca82', x + 4 - Math.floor(i / 2), y + i, 6 + 2 * Math.floor(i / 2), 1);
  }
  rect(ctx, cream, x + 1, y + 7, 12, 1);
}

function sofa(ctx, x, y) {
  rect(ctx, '#4d4540', x + 3, y + 17, 4, 4);
  rect(ctx, '#4d4540', x + 34, y + 17, 4, 4);
  rect(ctx, shadow, x + 3, y, 35, 16);
  rect(ctx, '#67a69a', x + 4, y + 1, 33, 9);
  rect(ctx, '#a1c8ad', x + 5, y + 1, 31, 1);
  rect(ctx, '#538b84', x + 20, y + 2, 1, 8);
  rect(ctx, '#396866', x + 1, y + 10, 39, 8);
  rect(ctx, '#84b3a0', x + 5, y + 9, 31, 4);
  rect(ctx, '#659a8d', x + 5, y + 13, 31, 2);
  for (const side of [x, x + 36]) {
    rect(ctx, '#416e6b', side, y + 7, 5, 11);
    rect(ctx, '#91bda5', side, y + 6, 5, 3);
  }
  rect(ctx, coral, x + 6, y + 5, 6, 5);
  rect(ctx, '#efb382', x + 7, y + 5, 4, 1);
  rect(ctx, '#e9c880', x + 27, y + 4, 6, 6);
}

function lounge(ctx) {
  rect(ctx, '#906e62', 5, 33, 63, 11);
  rect(ctx, '#bf8c75', 7, 34, 59, 9);
  rect(ctx, '#dcaa88', 9, 36, 55, 1);
  rect(ctx, '#dcaa88', 9, 40, 55, 1);
  rect(ctx, oak, 20, 1, 15, 11);
  rect(ctx, '#b0c9ba', 21, 2, 13, 9);
  rect(ctx, '#daab73', 29, 3, 3, 3);
  rect(ctx, '#688c7a', 22, 8, 10, 2);
  lamp(ctx, 1, 7);
  sofa(ctx, 18, 11);
  rect(ctx, oak, 28, 34, 3, 7);
  rect(ctx, oak, 48, 34, 3, 7);
  rect(ctx, birch, 25, 31, 29, 4);
  rect(ctx, '#f2d3a3', 27, 31, 25, 1);
  rect(ctx, '#738982', 35, 29, 8, 2);
  rect(ctx, '#e2cead', 36, 28, 7, 1);
}

function kitchen(ctx) {
  for (let i = 0; i < 3; i++) {
    const x = 7 + i * 14;
    rect(ctx, '#977756', x, 5, 13, 12);
    rect(ctx, birch, x + 1, 5, 11, 10);
    rect(ctx, '#eecda0', x + 2, 6, 1, 7);
    rect(ctx, oak, x + 9, 12, 2, 1);
  }
  rect(ctx, '#c3bcb0', 4, 18, 59, 5);
  rect(ctx, shadow, 4, 24, 61, 16);
  for (let i = 0; i < 4; i++) {
    const x = 5 + i * 15;
    rect(ctx, '#497977', x, 26, 14, 12);
    rect(ctx, '#66908a', x + 1, 27, 12, 1);
    rect(ctx, cream, x + 5, 28, 4, 1);
  }
  rect(ctx, '#e4d2ad', 3, 23, 63, 3);
  rect(ctx, '#71817b', 9, 22, 13, 2);
  rect(ctx, metal, 14, 18, 2, 5);
  rect(ctx, metal, 15, 17, 4, 2);
  rect(ctx, shadow, 34, 26, 11, 10);
  rect(ctx, '#769294', 35, 29, 9, 5);
  rect(ctx, coral, 35, 19, 10, 4);
  rect(ctx, oak, 34, 18, 12, 1);
  rect(ctx, shadow, 39, 16, 3, 2);
  rect(ctx, '#7b9791', 54, 4, 10, 17);
  rect(ctx, '#a8b6a6', 53, 3, 10, 17);
  rect(ctx, metal, 54, 15, 8, 1);
  rect(ctx, metal, 55, 10, 1, 4);
}

function carton(ctx, x, y, w, h, dark) {
  rect(ctx, dark ? '#986a48' : '#bd9361', x, y, w, h);
  rect(ctx, dark ? '#c49466' : '#dbb682', x + 1, y, w - 2, h - 1);
  rect(ctx, '#f2d5a0', x + Math.floor(w / 2), y, 2, Math.min(h - 1, 4));
  rect(ctx, '#71584e', x + 2, y + h - 3, Math.min(w - 4, 4), 1);
}

function rack(ctx) {
  for (const y of [20, 37]) {
    rect(ctx, shadow, 3, y + 2, 64, 3);
    rect(ctx, coral, 3, y, 64, 3);
    rect(ctx, '#f7af74', 3, y, 64, 1);
    rect(ctx, cream, 32, y, 5, 2);
  }
  for (const x of [3, 32, 63]) {
    rect(ctx, metal, x, 1, 4, 44);
    rect(ctx, '#88aaa1', x, 1, 1, 43);
    for (let y = 4; y < 42; y += 7) rect(ctx, shadow, x + 1, y, 1, 2);
  }
  carton(ctx, 8, 11, 12, 9, false);
  carton(ctx, 21, 6, 10, 14, true);
  carton(ctx, 38, 8, 20, 12, false);
  carton(ctx, 9, 27, 20, 10, true);
  carton(ctx, 39, 26, 12, 11, false);
  carton(ctx, 52, 30, 10, 7, true);
}

const rooms = { living_room: lounge, show_kitchen: kitchen, warehouse: rack };

function displayRoom(ctx, type, x, y, scale) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  rooms[type](ctx);
  ctx.restore();
}

function pendant(ctx, x, cord) {
  rect(ctx, shadow, x, 1, 1, cord);
  rect(ctx, '#587879', x - 4, cord, 9, 3);
  rect(ctx, metal, x - 7, cord + 3, 15, 3);
  rect(ctx, cream, x - 6, cord + 6, 13, 2);
}

export function drawStoreLandscape(ctx) {
  rect(ctx, '#b2a18e', 0, 0, 480, 100);
  rect(ctx, '#dac4a3', 0, 17, 480, 59);
  for (let x = 0; x < 480; x += 60) {
    rect(ctx, '#456b72', x + 1, 4, 55, 11);
    rect(ctx, '#91b5b9', x + 3, 5, 51, 8);
    rect(ctx, '#bdd1bf', x + 4, 5, 48, 2);
    rect(ctx, '#567e84', x + 25, 4, 2, 10);
    rect(ctx, '#77827b', x + 56, 1, 4, 17);
  }
  rect(ctx, metal, 0, 13, 480, 3);
  rect(ctx, wood, 0, 73, 480, 27);
  for (let y = 75; y < 100; y += 5) {
    rect(ctx, '#ac7c57', 0, y, 480, 1);
    for (let x = (y % 3) * 20; x < 480; x += 64) rect(ctx, '#ac7c57', x, y + 1, 1, 4);
  }
  for (const [x, w, color] of [[35, 90, '#b09b87'], [157, 65, '#a6b09b'], [231, 91, '#eabf99'], [328, 77, '#b8c0a6'], [411, 68, '#899c94']]) {
    rect(ctx, color, x, 27, w, 45);
    rect(ctx, cream, x + 1, 26, w - 2, 2);
    rect(ctx, '#97755d', x + w - 2, 28, 2, 51);
  }
  displayRoom(ctx, 'living_room', 43, 33, 1);
  displayRoom(ctx, 'show_kitchen', 151, 32, 1);
  displayRoom(ctx, 'living_room', 233, 27, 1.35);
  displayRoom(ctx, 'show_kitchen', 329, 31, 1.13);
  displayRoom(ctx, 'warehouse', 413, 29, 1);
  for (const [x, cord] of [[29, 20], [115, 22], [191, 18], [272, 15], [352, 18], [439, 15]]) pendant(ctx, x, cord);
  // Potted indoor trees beside the display rooms.
  for (const x of [137, 318, 404]) {
    rect(ctx, oak, x + 1, 62, 2, 14);
    rect(ctx, '#527a68', x - 4, 54, 12, 12);
    rect(ctx, '#638d70', x - 1, 50, 8, 12);
    rect(ctx, '#84a17a', x, 52, 4, 6);
    rect(ctx, '#bc7759', x - 3, 73, 10, 8);
    rect(ctx, '#e3a27b', x - 4, 72, 12, 3);
  }
}

export function storeTile(ctx, map, x, y, tile, seed) {
  const px = x * tile, py = y * tile;
  if (map[y][x] === '.') {
    rect(ctx, (x + y) % 2 ? '#34474b' : '#37494b', px, py, tile, tile);
    rect(ctx, '#304245', px, py + tile - 1, tile, 1);
    if (seed % 4 === 0) rect(ctx, '#465752', px + 4, py + 7, 5, 1);
    return;
  }
  rect(ctx, '#a88660', px, py, tile, tile);
  for (let i = 0; i < 3; i++) {
    rect(ctx, i % 2 === 0 ? '#ae8f68' : '#b3966f', px, py + 6 * i, tile, 5);
    rect(ctx, '#9b805e', px + (seed + 5 * i) % tile, py + 6 * i, 1, 5);
  }
  if (map[y - 1]?.[x] !== '#') rect(ctx, '#d7b581', px, py, tile, 2);
  if (map[y + 1]?.[x] !== '#') {
    rect(ctx, oak, px, py + tile - 5, tile, 5);
    rect(ctx, '#caa372', px, py + tile - 5, tile, 1);
  }
  if (map[y][x - 1] !== '#') rect(ctx, '#c6a171', px, py, 2, tile - 2);
  if (map[y][x + 1] !== '#') rect(ctx, '#8c6c54', px + tile - 2, py, 2, tile - 1);
}

export function drawStoreFixture(ctx, {type, x, y, width, height}, tile) {
  const w = width * tile, h = height * tile;
  const px = x * tile, py = y * tile;
  rect(ctx, '#927755', px + 2, py + 2, w - 4, h - 6);
  rect(ctx, type === 'warehouse' ? '#a1a69a' : '#cfb698', px + 3, py + 3, w - 6, h - 9);
  rect(ctx, '#b2906b', px + 4, py + h * .62, w - 8, Math.floor(h * .31));
  const scale = Math.min((w - 8) / 70, (h - 8) / 46);
  displayRoom(ctx, type, px + (w - scale * 70) / 2, py + h - 5 - scale * 46, scale);
}

export const storeMonsterColors = {
  C: '#251e35', D: '#463a59', E: '#625074', F: '#554576', H: '#9874ab',
  J: '#8ea577', K: '#c5ce98', M: '#db96f2', N: '#fff1cb', O: '#a05dc3',
};

export const storeMonsterPixels = {
  witch: [
    '.......DD.......', '......CDF.......', '.....CDDDF......', '.....DFHFF......',
    '...CDDDDDDDDD...', '.....KJJJJJ.....', '.....CKCJCJ.....', '.....JJKJJJ.....',
    '......JKJJ......', '....DFFJJFFD....', '...DFFHDHHFFD...', '...KJFFHFFJKO...',
    '....DFHFFFDMO...', '....DFFFFFD.....', '...DFFFFFFFD....', '...DDDDDDDDD....',
  ],
  enderman: [
    '.....CCCCCC.....', '.....CDEEDC.....', '.....CMMNMC.....', '.....CDDDDC.....',
    '......CCCC......', '....CDDDDCDC....', '....CDDDDCDC....', '....CDCDCCDC....',
    '....CDCDCCDC....', '....CDCDCCDC....', '....CCCDCCCC....', '......CCCC......',
    '......CD.CD.....', '......CD.CD.....', '......CD.CD.....', '.....CCD.CCD....',
  ],
};
