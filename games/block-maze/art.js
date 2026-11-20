import { drawGhastShots } from './nether-motion.js?v=living-worlds-1';
import { drawPowerBehind, drawPowerFront, drawMonsterReaction, invisibleOpacity } from './maze-abilities.js?v=encore-1';
import { drawMazeMonster } from './maze-monsters.js?v=living-worlds-1';
import { performanceAge } from './guitar.js?v=encore-1';
import { drawChordWave, drawGuitarist, danceFloor, dancerNotes } from './maze-music.js?v=encore-1';
import { configureBoard } from './display.js';
import { tileFinish, lightScene, drawGem, landmarkBounds, animateLandmark, boardingMarks, lavaShimmer } from './maze-materials.js';
import { drawTempleFixture, templeFlames } from './temple-art.js?v=end-family-1';
import { arcadeTile, drawArcadeLandscape, drawAttraction, drawRideLights } from './arcade-art.js?v=end-family-1';
import { drawStoreLandscape, storeTile, drawStoreFixture, storeMonsterPixels, storeMonsterColors } from './store-art.js?v=end-family-1';
import { drawMonsterEffects, showCharge, showSlow } from './monster-art.js?v=living-worlds-1';
import { drawWaterparkLandscape, drawWaterRide, waterparkTile, waterRipples, drawRideAccess, riderPosition } from './waterpark-art.js?v=end-family-1';
import { drawNetherLandscape, netherTile, drawNetherFixture, drawNetherBridges, drawNetherThreats, netherMonsterPixels, netherMonsterColors } from './nether-art.js?v=end-family-1';
import { drawCastleLandscape, castleTile, drawCastleFixture, castleLights, castleMonsterPixels, castleMonsterColors } from './castle-art.js?v=end-family-1';
import { drawEndLandscape, endTile, drawEndFixture, drawEndThreats, drawFlyingDragon, endMonsterPixels, endMonsterColors, endermanColors } from './end-art.js?v=dragon-flight-1';

// The artwork is drawn on integer grids and scaled by the browser as pixel art.
function surface(canvas, width, height) {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function box(ctx, ink, x, y, width, height) {
  ctx.fillStyle = ink;
  ctx.fillRect(x, y, width, height);
}

// Fill polygon spans with whole pixels, including the diagonal edges of cubes.
function shape(ctx, ink, points) {
  const rows = points.map(point => point[1]);
  ctx.fillStyle = ink;
  for (let y = Math.min(...rows); y < Math.max(...rows); y++) {
    const cuts = [];
    const scan = y + 0.5;
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= scan && y2 > scan) || (y2 <= scan && y1 > scan)) {
        cuts.push(x1 + (scan - y1) * (x2 - x1) / (y2 - y1));
      }
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length; i += 2) {
      const left = Math.round(cuts[i]);
      ctx.fillRect(left, y, Math.round(cuts[i + 1]) - left, 1);
    }
  }
}

function randomSequence(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function ridge(ctx, base, amplitude, step, color, seed) {
  const rand = randomSequence(seed);
  let current = base;
  for (let x = 0; x < 483; x += step) {
    current = Math.min(base + amplitude, Math.max(base - amplitude, current + Math.floor(rand() * 9) - 4));
    box(ctx, color, x, current, step, 110 - current);
  }
}

function canopy(ctx, x, y, size, palette, seed) {
  const rand = randomSequence(seed);
  const [shadow, leaf, light] = palette;
  const unit = Math.max(1, Math.round(size / 8));
  box(ctx, shadow, x - size, y, size * 2, 4 * unit);
  box(ctx, shadow, x - size + unit * 2, y + unit, size * 2 - unit * 4, unit * 4);
  box(ctx, leaf, x - size + unit, y - unit, size * 2 - unit * 2, 3 * unit);
  box(ctx, leaf, x - size + 3 * unit, y - 2 * unit, size * 2 - 6 * unit, unit * 2);
  for (let i = 0; i < size; i++) {
    const dx = Math.floor(rand() * (size * 2 - unit * 4));
    const dy = Math.floor(rand() * (unit * 3));
    box(ctx, i % 3 === 0 ? shadow : light, x - size + 2 * unit + dx, y - unit + dy, unit + Math.floor(rand() * unit), unit);
  }
}

function tree(ctx, x, y, width, floor, palette, seed) {
  const [dark, leaf] = palette;
  const trunk = Math.max(2, Math.floor(width / 5));
  box(ctx, dark, x - trunk, y, trunk * 2, floor - y);
  box(ctx, leaf, x - trunk, y + 3, Math.ceil(trunk / 2), floor - y - 3);
  box(ctx, dark, x - trunk - 4, floor - 4, trunk * 2 + 8, 4);
  shape(ctx, dark, [[x, y + 16], [x - width + 2, y + 4], [x - width + 6, y + 4], [x, y + 11]]);
  canopy(ctx, x, y, width, palette, seed);
}

function temple(ctx, x, ground, scale) {
  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(scale, scale);
  const r = (c, a, b, w, h) => box(ctx, c, a, b, w, h);
  const top = '#69907a', facade = '#496b61', dark = '#375957';
  r(dark,-38,-5,76,5);
  r(facade,-35,-8,70,5);
  r(top,-35,-9,70,2);
  for (let i = 0; i < 3; i++) {
    const half = 30 - 5 * i, bottom = -10 - 4 * i;
    r(facade,-half,bottom-2,half*2,4);
    r(top,-half,bottom-3,half*2,1);
    r(dark,half-9,bottom-2,9,4);
    r(dark,-half+7+i*2,bottom-2,1,2);
  }
  r(dark,-13,-29,26,11);
  r(facade,-12,-30,20,11);
  r(dark,-3,-28,6,10);
  r(top,-16,-32,32,3);
  r(dark,6,-31,10,2);
  r(facade,-12,-35,23,3);
  r(top,-7,-38,13,3);
  for (let i = 0; i < 8; i++) {
    r(i%2 ? top : '#8da488',-6-i,-18+i*2,12+i*2,1);
  }
  ctx.restore();
}

const levelArt = {
  temple: { landscape: drawTempleLandscape, tile: templeTile, fixture: drawTempleFixture, animate: templeFlames },
  end: { landscape: drawEndLandscape, tile: endTile, fixture: drawEndFixture, threats: drawEndThreats },
  nether: { landscape: drawNetherLandscape, tile: netherTile, fixture: drawNetherFixture, bridges: drawNetherBridges, flow: lavaShimmer, threats: drawNetherThreats },
  castle: { landscape: drawCastleLandscape, tile: castleTile, fixture: drawCastleFixture, animate: castleLights },
  arcade: { landscape: drawArcadeLandscape, tile: arcadeTile, fixture: drawAttraction, animate: drawRideLights },
  waterpark: { landscape: drawWaterparkLandscape, tile: waterparkTile, fixture: drawWaterRide, animate: waterRipples },
  store: { landscape: drawStoreLandscape, tile: storeTile, fixture: drawStoreFixture },
};

const worldSheet = './assets/world-panoramas.webp';
const realmSheet = './assets/realm-panoramas.webp';
const panoramaFrames = {
  temple: [worldSheet, 0], arcade: [worldSheet, 1], waterpark: [worldSheet, 2], store: [worldSheet, 3],
  nether: [realmSheet, 0], castle: [realmSheet, 1], end: [realmSheet, 2],
};
const images = new Map();
const pendingFrames = new WeakMap();

function loadIllustration(path) {
  let image = images.get(path);
  if (!image) {
    image = new Image();
    image.src = new URL(path, import.meta.url);
    images.set(path, image);
  }
  return image;
}

function illustratedFrame(canvas, path, col, row, width, height, placeholder) {
  const ctx = surface(canvas, width, height);
  const image = loadIllustration(path);
  const paint = () => {
    const frameWidth = path.includes('hero-portraits') ? image.naturalWidth / 2 : image.naturalWidth;
    const frameHeight = Math.round(frameWidth * height / width);
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    ctx.drawImage(image, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
  };
  pendingFrames.delete(canvas);
  if (image.complete && image.naturalWidth) {
    paint();
    return;
  }
  placeholder(ctx);
  if (image.complete) return;
  // Switching levels before an illustration arrives must keep the most recent selection.
  pendingFrames.set(canvas, paint);
  image.addEventListener('load', () => {
    if (pendingFrames.get(canvas) !== paint) return;
    pendingFrames.delete(canvas);
    paint();
  }, { once: true });
}

export function drawLandscape(canvas, levelId = 'temple') {
  const [sheet, row] = panoramaFrames[levelId] || panoramaFrames.temple;
  const theme = levelArt[levelId] || levelArt.temple;
  illustratedFrame(canvas, sheet, 0, row, 480, 100, theme.landscape);
}

function drawTempleLandscape(ctx) {
  box(ctx, '#7ca6a2', 0, 0, 480, 100);
  box(ctx, '#8ab1a8', 0, 32, 480, 18);
  box(ctx, '#a8bba5', 0, 50, 480, 50);
  // Shafts of late afternoon light and low, flat cloud banks.
  for (const [x,y,w] of [[208,12,28],[230,14,19],[326,22,35],[344,20,18],[122,32,30],[98,33,35],[275,38,37],[265,40,23],[396,8,19]]) {
    box(ctx,'#b3c6b1',x,y,w,2);
  }
  shape(ctx,'#f2d58d',[[368,13],[383,13],[383,15],[387,15],[387,19],[390,19],[390,32],[387,32],[387,36],[383,36],[383,38],[368,38],[368,36],[364,36],[364,32],[361,32],[361,19],[364,19],[364,15],[368,15]]);
  box(ctx,'#ffe5a2',368,16,15,4);
  ridge(ctx,54,21,6,'#7e9f95',83);
  shape(ctx,'#71978d',[[110,68],[150,40],[161,39],[167,32],[180,32],[217,60],[232,55],[264,74],[110,80]]);
  shape(ctx,'#73978e',[[274,75],[312,44],[332,44],[332,42],[343,42],[343,49],[353,49],[379,73]]);
  ridge(ctx,66,10,4,'#577f71',120);
  const distant = ['#557b6c','#628b74','#78977b'];
  for (const [x,y,w] of [[15,42,16],[102,59,11],[122,55,8],[208,60,11],[243,53,14],[264,52,11],[279,56,10],[391,48,15],[423,46,13],[464,35,18]]) {
    tree(ctx,x,y,w,86,distant,7*x);
  }
  temple(ctx,320,88,1);
  temple(ctx,413,94,1);
  ridge(ctx,84,8,3,'#3a6358',140);
  const middle = ['#335a52','#416c57','#557c5f'];
  for (const [x,y,w] of [[25,36,22],[83,50,16],[147,69,10],[197,67,15],[221,58,10],[402,61,13],[444,49,21]]) {
    tree(ctx,x,y,w,98,middle,x+3);
  }
  // Fern-like silhouettes frame the vista without covering the temple.
  const front = ['#1d403c','#2e5747','#456b4d'];
  tree(ctx,18,3,37,100,front,29);
  tree(ctx,459,8,31,100,front,83);
  canopy(ctx,478,-2,27,front,15);
  canopy(ctx,48,-3,24,front,41);
  for (const [x,y,length] of [[38,8,24],[52,7,38],[60,4,18],[67,1,16],[434,12,14],[445,7,29],[472,6,33]]) {
    box(ctx,front[1],x,y,1,length);
    for (let n=1; n<length-1; n+=6) box(ctx,front[n%2],x+(n%4===1 ? -2 : 1),y+n,2,3);
  }
  ridge(ctx,94,5,3,'#2a5144',99);
  for (const x of [0,7,39,57,85,128,198,255,385,407,436,462,476]) {
    shape(ctx,front[0],[[x-8,100],[x-12,91],[x-5,94],[x-7,85],[x,92],[x+4,82],[x+5,93],[x+13,89],[x+8,100]]);
  }
}

const portraitFrames = { kirill: [0, 0], maxim: [1, 0], mom: [0, 1], dad: [1, 1] };

export function drawPortrait(canvas, hero) {
  const [col, row] = portraitFrames[hero] || [0, 0];
  const sheet = hero === 'pasha' ? './assets/pasha-portrait.webp' : './assets/hero-portraits.webp';
  illustratedFrame(canvas, sheet, col, row, 192, 144, ctx => {
    box(ctx, '#273d42', 0, 0, 192, 144);
    ctx.save();
    ctx.scale(8, 8);
    sprite(ctx, hero, heroColors[hero], 4, 1);
    ctx.restore();
  });
}

const spritePixels = {
  ...storeMonsterPixels,
  ...netherMonsterPixels,
  ...castleMonsterPixels,
  ...endMonsterPixels,
  guardian: [
    '........54......','...45...44..54..','...44qqqqqq445..','....q313331q4...',
    '.544q1131112q...','....q1666612q..2','..qqq6677611qq12','..q2q6677612q13q',
    '.54qq1111112qq2.','....q1211212q.1.','...4q222222q....','..45.qqqqqq44...',
    '....44..44..54..','....5...54......','................','................'
  ],
  elder_guardian: [
    '..8..98...98...8','..98.89...89..89','...9qqqqqqqqq89.','.88q9IIBB9BB8q..',
    '..9qI9IBBBB98q..','qqqqB666666B8q.8','q89q666776698q98','q98q6667766B8q9q',
    'qq9qBBB66BBB8q9q','.9.qBII9B9B98q..','..9qBB98B9898q..','.899q8888888q9..',
    '...9.qqqqqqq.89.','..89.89...98..8.','.....8.....9....','................'
  ],
  drowned: [
    '....qqqqqqqq....','...q2h133311q...','...q1g113312q...','...q16611662q...',
    '...q13111112q..3','...qg1122212q.333','....qg11112q..333','..qqqlggvllqq..3',
    '.q12qtgvvllq12q3','.q2gqtvvgllq22q3','.qqqqvlgglvqqqq3','....qlllvlvq...3',
    '....q12qq21q...3','....q12qq22q....','...q222qq222q...','...qqqqqqqqqq...'
  ],
  creeper: [
    '    qqqqqqqq    ','   qhhhhgghhq   ','   qghggghhgq   ','   qghoogoogq   ',
    '   qggoogoogq   ','   qgggooggdq   ','   qhgooooddq   ','   qggooododq   ',
    '    qgghggdq    ','     qghgdq     ','     qgghdq     ','     qdgddq     ',
    '   qqdgggddqq   ','   qhggqqghgq   ','   qdgdqqggdq   ','   qqqq  qqqq   '
  ],
  zombie: [
    '     qqqqqqq    ','    qhhggggdq   ','    qhgggghdq   ','    qggoogoqq   ',
    '    qhggggdgq   ','    qggdooqq    ','     qggddq     ','   qqttttttqq   ',
    '  qgghqvttvhgq  ','  qggdqvvvdggq  ','  qddqqvvvqddq  ','   qqqtttvqqq   ',
    '     qlllldq    ','     qllqllq    ','    qdddqdddq   ','    qqqqqqqqq   '
  ],
  spider: [
    '                ','       qqqq     ','      qpaapq    ','   qqqaaapaqqq  ',
    '  qpbqaaaaaqbpq ','  qpqqppaapqqpq ',' qpbqpppppppqbpq',' qpqqpappappqqpq',
    ' qb qpwrrwrpq bq','qq  qbrrprrpq qq','   qppbbppbppq  ','  qpbqpbbbpqbpq ',
    ' qpqq qbqbq qqpq',' qpq   q q   qpq',' qq           qq','                '
  ],
  skeleton: [
    '     qqqqqq     ','    qiiiBBBiq   ','    qiIIIiIBq   ','    qiooiooBq   ',
    '    qBIIoIiBq   ','     qioiiBq    ','      qqBqq     ','    qIIBiBIqq   ',
    '   qi qBBiq iBq ','   qB qiiiq qiq ','   qB qBBiq qiq ','   qq qBBiq  qq ',
    '      qqqqq     ','     qIBqIBq    ','     qiBqiBq    ','     qqqqqqq    '
  ],
  slime: [
    '                ','                ','                ','      qqqqq     ',
    '   qqGLLLGGuqq  ','  qGGGLLLLGGuuq ',' qLLLLGGGGGGuuq ',' qLLGGuuGGGGuuq ',
    ' qLGGxxGGxxGGUq ',' qLGGxxGGxxGGUq ',' qLGGGGxGGGGGUq ',' qGGGGGGGGGuGUq ',
    ' qGuuGGuuuuuuuUq','  qUUuuuuuuUUUq ','   qqqqqqqqqqq  ','                '
  ],
  pasha: [
    '.....lhh..h.....', '....qhhlhhqq....', '...qlhhhhhhlq...', '...qhhfffffhq...',
    '...qfgqqfgqqq...', '...qkqwgqqgwq...', '....qkffffffq...', '....qtqkffqtq...',
    '...qtjtbBbtjuq..', '..qtujtbbbtjuq..', '..quujtbbbtjuq..', '..qffutbbbtjfq..',
    '...quuqNnNquq...', '....qNNnqnNnq...', '....qNnnqnNNq...', '...qPppqqppPq...',
  ],
  maxim: [
    '.....qhhhhq.....', '....qllhhhdq....', '...qlhhhhhhdq...', '...qhhffhhddq...',
    '...qhffffffdq...', '...qhfofkfokq...', '...qkfwwffffq...', '....qkffkffkq...',
    '...qttkfffstq...', '..qtjjtAtBjjq...', '..qsjqjABAjtq...', '..qfkqjBAtjkq...',
    '...qqqjsAsjqq...', '.....qNnnnq.....', '....qNnqqNnq....', '....qssqqssq....',
  ],
  kirill: [
    '................', '......qhhhq.....', '....qlllhhdq....', '...qlllhhhhdq...',
    '...qlhhffffdq...', '...qhhffkffkq...', '...qhfowffokq...', '...qkfffffffq...',
    '....qkffwwfkq...', '...qttkffftsq...', '..qtjtjtjjjsq...', '..qffqjjjjkfq...',
    '...qqqjtsjsqq...', '.....qNnnnq.....', '.....qnqqNq.....', '....qssqqssq....',
  ],
  mom: [
    '......qhhhqq....', '....qGgGGgGhq...', '...qhGgllGgdq...', '...qlhhhlhhdq...',
    '...qhlfffhhdq...', '...qhfofkfokq...', '...qhkffffffq...', '....qdffwwfkq...',
    '...qjttTATjjq...', '..qtjjATtAsjq...', '..qsjjstAjjsq...', '..qffqjTtjkfq...',
    '...qqqjsAsjqq...', '.....qNnnnq.....', '....qNnqqNnq....', '....qssqqssq....',
  ],
  dad: [
    '.....qllhhdq....', '....qlffffhdq...', '...qlfffffffq...', '...qhfffffffkq..',
    '...qffofkffokq..', '...qkffkhkffkq..', '...qhhllhhhlhq..', '...qhhlffkhlhq..',
    '....qhhhhlhdq...', '...qttkhhktjsq..', '..qtjjtkstjjsq..', '..qfjqjtBjjsfq..',
    '...qfqjjsjjsqq..', '....qqNnnnnqq...', '.....qNnqNnq....', '....qssqqsssq...',
  ],
};

const monsterColors = {
  ...storeMonsterColors,
  1:'#41a89e', 2:'#387579', 3:'#82d9c2', 4:'#dc7f43', 5:'#ffc96b',
  6:'#faf1c9', 7:'#c24b46', 8:'#766d61', 9:'#c5b597',
  q:'#13292b', h:'#a7d471', g:'#73ae55', d:'#477649', o:'#243c36', t:'#66b9b1',
  i:'#c7d2cf', I:'#f2f0df', B:'#95a5a9', G:'#6bcd82', L:'#bcf6a2',
  u:'#4daa73', U:'#3e8867', x:'#376d56',
  v:'#358982', l:'#5e6490', p:'#63505d', b:'#352f42', a:'#846975', r:'#e77745', w:'#ffaf65'
};

const monsterPalettes = {
  enderman: endermanColors,
  ghast: netherMonsterColors,
  magma_cube: netherMonsterColors,
  blaze: netherMonsterColors,
  wither_skeleton: netherMonsterColors,
  shulker: endMonsterColors,
  ender_dragon: endMonsterColors,
  ghost: castleMonsterColors,
  pumpkin_guard: castleMonsterColors,
};

const baseHeroColors = {
  q:'#272a32', f:'#f3c59e', o:'#423630', w:'#fff2db', k:'#c28a71', n:'#485569', N:'#718097',
};

const heroColors = {
  pasha: { ...baseHeroColors, h:'#463932', l:'#806752', g:'#a3b7b4', j:'#b07b45', t:'#d8a360', u:'#85583a', b:'#262a30', B:'#464851', n:'#34363c', N:'#55575d', p:'#8a8990', P:'#c3bdb3' },
  maxim: { ...baseHeroColors, h:'#493930', l:'#735844', d:'#382c2a', j:'#3c4149', t:'#686f7b', s:'#29303a', A:'#685d9c', B:'#e7e4f5' },
  kirill: { ...baseHeroColors, h:'#846447', l:'#b79671', d:'#63503e', j:'#38b2af', t:'#83d9cc', s:'#287b83' },
  mom: { ...baseHeroColors, h:'#634c3f', l:'#8e7057', d:'#413536', j:'#3a424a', s:'#293138', t:'#874458', T:'#bc576a', A:'#f2cea9', G:'#302d34', g:'#8b99a6' },
  dad: { ...baseHeroColors, h:'#744937', l:'#94634a', d:'#50342d', j:'#314761', t:'#63809b', s:'#263546', B:'#a0b0bb' },
};

// The hairline, shirt collar and scarf also read from behind when the player heads up.
const heroBackPixels = {
  pasha: [
    ...spritePixels.pasha.slice(0,3), '...qhhhlhhhhq...',
    '...qhhhhhhlhq...', '...qkhhhhhhkq...', '....qkkhhkkq....', '....qtuuuuttq...',
    '...qtjtttttjuq..', '..qtujjuujjjuq..', '..quujjjjjjjuq..', '..qffujjuujjfq..',
    '...quujuuujjuq..', ...spritePixels.pasha.slice(13),
  ],
  maxim: [
    '.....qhhhhq.....', '....qllhhhdq....', '...qlhhhhhhdq...', '...qlhhhhhdhq...',
    '...qhhhhhhhdq...', '...qhdhhhhddq...', '...qkdhhhhdkq...', '....qkdhdhdkq...',
    '...qtjttttjjq...', '..qtjtsssstjq...', '..qsjqjjjsjtq...', '..qfkqjjssjkq...',
    '...qqqjjsjjqq...', ...spritePixels.maxim.slice(13),
  ],
  kirill: [
    '................', '......qhhhq.....', '....qlllhhdq....', '...qlllhhhhdq...',
    '...qlhhhhhhdq...', '...qhhhhhhhdq...', '...qhdhhhhddq...', '...qkdhhddhkq...',
    '....qkdhdhdkq...', '...qtttjttjsq...', '..qtjtjjjjjsq...', '..qffqjjjjkfq...',
    '...qqqjssjsqq...', ...spritePixels.kirill.slice(13),
  ],
  mom: [
    '......qhhhqq....', '....qhGGGGGhq...', '...qGglllhhgq...', '...qlhlhhhdhq...',
    '...qhhhhhhhdq...', '...qhlhhhdhdq...', '...qkhhhhdhkq...', '....qdhdhhdkq...',
    '...qjtTTtTAjq...', '..qtjttTAtjsq...', '..qsjjjjjjjsq...', '..qffqjssjkfq...',
    '...qqqjsjsjqq...', ...spritePixels.mom.slice(13),
  ],
  dad: [
    '.....qllhhdq....', '....qlkffkhdq...', '...qlkkfffkhq...', '...qhhhlklhhhq..',
    '...qhlhhhhhhhq..', '...qhhhhhhdhdq..', '...qkhhhhhhdkq..', '...qkdhdhhddkq..',
    '....qddkkkddq...', '...qtttjjttjsq..', '..qtjsjjjjjjsq..', '..qfjqjjssjsfq..',
    '...qfqjsjjjsqq..', ...spritePixels.dad.slice(13),
  ],
};

const spriteSheets = new WeakMap();

function spriteImage(name, colors, back) {
  let sheet = spriteSheets.get(colors);
  if (!sheet) {
    sheet = new Map();
    spriteSheets.set(colors, sheet);
  }
  const key = back ? name + '-back' : name;
  if (sheet.has(key)) return sheet.get(key);
  const image = document.createElement('canvas');
  const rows = back ? heroBackPixels[name] : spritePixels[name];
  const ctx = surface(image, Math.max(...rows.map(row => row.length)), 16);
  for (const [y, row] of rows.entries()) {
    for (let x = 0; x < row.length; x++) {
      const ink = colors[row[x]];
      if (ink) box(ctx, ink, x, y, 1, 1);
    }
  }
  sheet.set(key, image);
  return image;
}

function sprite(ctx, name, colors, x, y, facingLeft = false, stride = 0, back = false) {
  const image = spriteImage(name, colors, back);
  ctx.save();
  ctx.translate(x + (facingLeft ? 16 : 0), y);
  if (facingLeft) ctx.scale(-1, 1);
  if (stride) {
    ctx.drawImage(image, 0, 0, image.width, 13, 0, -1, image.width, 13);
    ctx.drawImage(image, 0, 13, 8, 3, 0, stride > 0 ? 12 : 13, 8, 3);
    ctx.drawImage(image, 8, 13, 8, 3, 8, stride > 0 ? 13 : 12, 8, 3);
  } else {
    ctx.drawImage(image, 0, 0);
  }
  ctx.restore();
}

function walkFrame(actor) {
  if (!actor.target) return 0;
  const travel = actor.x + actor.y;
  const midStep = travel - Math.floor(travel);
  return midStep > .2 && midStep < .8 ? (Math.floor(travel) % 2 ? 1 : -1) : 0;
}


function contactShadow(ctx, x, y, width = 12) {
  ctx.save();
  ctx.translate(x,y+6.7);
  ctx.scale(width*.55,2.1);
  const shadow=ctx.createRadialGradient(0,0,.2,0,0,1);
  shadow.addColorStop(0,'rgba(6,10,18,.58)');shadow.addColorStop(1,'rgba(6,10,18,0)');
  ctx.fillStyle=shadow;ctx.fillRect(-1,-1,2,2);
  ctx.restore();
}

export function drawMonsterPortrait(canvas, type) {
  const ctx = surface(canvas,96,96);
  ctx.clearRect(0,0,96,96);
  ctx.save();
  ctx.scale(4,4);
  contactShadow(ctx,12,14);
  if (!drawMazeMonster(ctx,{type},12,13,0)) {
    sprite(ctx,type,monsterPalettes[type] || monsterColors,4,5);
  }
  ctx.restore();
}

const TILE = 20;
const backgrounds = new WeakMap();
const landmarkCells = { stone_mask:0, carousel:1, typhoon:2, living_room:3, lavafall:4, gatehouse:5, crystal_spires:6, cauldron:7, brazier:8, slide:9, claw:10, water_slide:11, wave_pool:12, show_kitchen:13, warehouse:14, basalt_columns:15, crimson_fungi:16, pumpkin_patch:17, exit_portal:18, chorus_grove:19 };

function floorTile(ctx, x, y, roll) {
  const base = ['#21312f','#223331','#233431','#243431'];
  box(ctx,base[roll%4],x,y,TILE,TILE);
  if (roll%3) {
    box(ctx,'#2d3d37',x+3+roll%12,y+3+roll%9,2,1);
    box(ctx,'#1e2d2c',x+6+roll%10,y+8+roll%8,1,1);
  }
  if (roll%17===0) {
    box(ctx,'#35493c',x+3,y+14,1,3);
    box(ctx,'#40503d',x+5,y+13,1,2);
  }
}

function templeTile(ctx, map, col, row, tile, variation) {
  if (map[row][col] !== '#') {
    floorTile(ctx, col * tile, row * tile, variation);
    return;
  }
  const x = col*TILE, y=row*TILE;
  const stone = (dx,dy)=>map[row+dy]?.[col+dx]==='#';
  const above = stone(0,-1), below=stone(0,1), left=stone(-1,0), right=stone(1,0);
  const rand = randomSequence(617*variation + 13*col + row);
  const inset = left ? 0 : 1;
  const side = right ? 0 : 1;
  const width = TILE-inset-side;
  const base = ['#657768','#6b7b69','#697968','#64776a'];
  box(ctx,'#192b2b',x,y,TILE,TILE);
  box(ctx,base[variation%4],x+inset,y+1,width,TILE-2);
  // Blocks have staggered mortar seams and chipped facets.
  const joint = 6 + ((row + col)%3)*3;
  box(ctx,'#556b60',x+joint,y+1,1,7);
  box(ctx,'#52675c',x+inset,y+8,width,1);
  box(ctx,'#7c8c76',x+inset+1,y+9,width-2,1);
  box(ctx,'#5a6e61',x+TILE-2,y+10,1,9);
  box(ctx,'#84917b',x+inset+2,y+1,4+variation%5,1);
  for (let i=0;i<4;i++) {
    const px=2+Math.floor(rand()*15), py=2+Math.floor(rand()*13);
    box(ctx,i%2 ? '#788972' : '#5d7264',x+px,y+py,1+Math.floor(rand()*3),1);
  }
  if (!below) {
    box(ctx,'#384e49',x+inset,y+13,width,5);
    box(ctx,'#4b6157',x+inset+1,y+13,width-2,1);
    box(ctx,'#273f3d',x+inset,y+18,width,1);
    box(ctx,'#2e4641',x+joint+3,y+14,1,4);
  }
  if (!right) box(ctx,'#41594f',x+TILE-2,y+1,1,below ? TILE-2 : 12);
  if (!left) box(ctx,'#81917a',x+1,y+2,1,below ? TILE-3 : 10);
  // Moss follows exposed edges and continues over neighboring blocks.
  if (!above || variation%6===0) {
    const depth = !above ? 3 : 2;
    box(ctx,'#647c4b',x+inset,y+1,width,depth);
    box(ctx,'#94a962',x+inset+2,y+1,5+variation%8,1);
    box(ctx,'#536f45',x+3+variation%10,y+2,3,depth+1);
    if (variation%3===0) {
      box(ctx,'#637e4c',x+5,y+3,2,5);
      box(ctx,'#849951',x+7,y+5,2,1);
    }
  }
  if (above && below) box(ctx,base[variation%4],x+inset,y,width,1);
  if (below) box(ctx,'#566c5d',x+inset,y+19,width,1);
  if (above && below && left && right && variation%7===0) {
    box(ctx,'#4e665b',x+6,y+4,9,9);
    box(ctx,'#86977b',x+7,y+4,7,1);
    box(ctx,'#718573',x+8,y+6,5,5);
    box(ctx,'#556c60',x+10,y+8,2,2);
  }
}

function background(canvas,state) {
  const previous = backgrounds.get(canvas);
  const atlas = loadIllustration('./assets/maze-landmarks.webp');
  const painted = atlas.complete && atlas.naturalWidth > 0;
  const width = state.width*TILE, height = state.height*TILE;
  if (previous?.map === state.map && previous.width === canvas.width && previous.painted === painted) return previous.canvas;
  const layer = document.createElement('canvas');
  layer.width = canvas.width;
  layer.height = canvas.height;
  const ctx = layer.getContext('2d');
  ctx.scale(layer.width/width,layer.height/height);
  ctx.imageSmoothingQuality = 'high';
  const rand = randomSequence(12937);
  const theme = levelArt[state.levelId];
  for (let row=0;row<state.height;row++) {
    for (let col=0;col<state.width;col++) {
      const variation = Math.floor(rand()*1031);
      theme.tile(ctx,state.map,col,row,TILE,variation);
      tileFinish(ctx,state.levelId,state.map,col,row,TILE,variation);
    }
  }
  lightScene(ctx,state,TILE);
  for (const attraction of state.decorations) {
    if (painted && Object.hasOwn(landmarkCells,attraction.type)) {
      const cell = landmarkCells[attraction.type];
      const cw = atlas.naturalWidth/4, ch = atlas.naturalHeight/5;
      const {x,y,w,h}=landmarkBounds(attraction,TILE);
      ctx.drawImage(atlas,(cell%4)*cw,Math.floor(cell/4)*ch,cw,ch,x,y,w,h);
    } else {
      theme.fixture(ctx,attraction,TILE);
    }
  }
  theme?.bridges?.(ctx,state,TILE);
  if (state.ride) (painted ? boardingMarks : drawRideAccess)(ctx,state.ride,TILE);
  backgrounds.set(canvas,{canvas:layer,map:state.map,width:canvas.width,painted});
  return layer;
}

function pickupSpark(ctx, pickup, time) {
  const age = time - pickup.time;
  if (age >= .32) return;
  const radius = 4 + Math.floor(age * 17);
  const x = (pickup.x + .5) * TILE, y = (pickup.y + .5) * TILE;
  const width = age < .15 ? 2 : 1;
  for (const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    box(ctx, age < .15 ? '#e0ffbd' : '#79db98', x + dx * radius, y + dy * radius, width, width);
  }
}

const heroColumn = { kirill:0, maxim:1, mom:2, dad:3, pasha:4 };

function familyFigure(ctx,state,x,y,stride) {
  const hero = state.hero, actor = state.player;
  const back = actor.dir === 'up' && !state.solo;
  const atlas = loadIllustration('./assets/maze-figures.webp');
  if (!atlas.complete || !atlas.naturalWidth) {
    sprite(ctx,hero,heroColors[hero],x-8,y-8,actor.dir==='left',stride,back);
    return;
  }
  const sw = atlas.naturalWidth/5, sh = atlas.naturalHeight/2;
  const sx = sw*heroColumn[hero], sy = back ? sh : 0;
  const step = actor.target ? Math.sin((actor.x+actor.y)*Math.PI) : 0;
  const height = 23.5, width = height*sw/sh;
  ctx.save();
  ctx.translate(x,y+8.7);
  ctx.scale(actor.dir==='left' ? -1 : 1,1);
  ctx.rotate(step*.042);
  ctx.translate(0,-Math.abs(step)*.62);
  const split = .77;
  ctx.drawImage(atlas,sx,sy,sw,sh*split,-width/2,-height,width,height*split+.03);
  for (let side=0;side<2;side++) {
    const swing=step*(side ? 1 : -1);
    ctx.drawImage(atlas,sx+sw*side/2,sy+sh*split,sw/2,sh*(1-split),
      -width/2+side*width/2,-height*(1-split),width/2,height*(1-split)+swing*.95);
  }
  ctx.restore();
}

function actorPos(actor) {
  return [(actor.x+0.5)*TILE, (actor.y+0.5)*TILE];
}

export function drawBoard(canvas,state) {
  const ctx = configureBoard(canvas,state.width*TILE,state.height*TILE);
  ctx.drawImage(background(canvas,state),0,0,state.width*TILE,state.height*TILE);
  const theme = levelArt[state.levelId];
  theme?.flow?.(ctx,state,TILE);
  const painted = backgrounds.get(canvas).painted;
  const animateRide = painted ? animateLandmark : theme?.animate;
  if (animateRide) {
    for (const ride of state.decorations) animateRide(ctx,ride,TILE,state.time);
  }
  const playingAge=performanceAge(state);
  const songAge=state.time-(state.guitarStartedAt ?? state.time);
  if (state.solo) drawChordWave(ctx,state.solo,TILE);
  drawMonsterEffects(ctx,state);
  theme?.threats?.(ctx,state,TILE);
  const glint = Math.floor(state.time * 5);
  for (const index of state.gems) {
    drawGem(ctx,(index%state.width+0.5)*TILE,(Math.floor(index/state.width)+0.5)*TILE,(glint + index * 7) % 43 === 0);
  }
  if (state.lastPickup) pickupSpark(ctx, state.lastPickup, state.time);
  // Ground actors stay visible even when the dragon passes directly above them.
  if (state.dragon) drawFlyingDragon(ctx,state,TILE);
  for (const monster of state.monsters) {
    const [x,y]=actorPos(monster);
    contactShadow(ctx, x, y, monster.leap ? 12-4*Math.sin(Math.PI*monster.leap.progress) : 12);
    const jumpPhase = state.time % .9;
    let hop = monster.type === 'slime' && !monster.stun && jumpPhase < .55
      ? 4.2 * Math.sin(Math.PI * jumpPhase / .55) : 0;
    if (monster.leap) hop = 18 * Math.sin(Math.PI * monster.leap.progress);
    if (monster.type === 'blaze' && !monster.stun) {
      hop = 2 + Math.round(Math.sin(state.time * 3.5));
    }
    const dancing=monster.dance>0;
    if (dancing) {
      danceFloor(ctx,x,y,songAge);
      hop=0;
    }
    ctx.save();
    if (dancing) {
      // The feet anchor each alternating side-step; the body leans towards the planted foot.
      const lean=Math.cos(songAge*Math.PI*2), step=Math.abs(Math.sin(songAge*Math.PI*2));
      ctx.translate(x+lean*1.45,y+6.9-step*2.3);
      ctx.rotate(lean*.16);
      ctx.scale(1+(1-step)*.055, .945+step*.09);
      ctx.translate(-x,-y-6.9);
    }
    if (monster.watched) ctx.globalAlpha = .62;
    drawMazeMonster(ctx,monster,x,y-hop,state.time,false,songAge);
    ctx.restore();
    if (dancing) dancerNotes(ctx,x,y,songAge);
    showCharge(ctx,monster,x,y-hop);
    drawMonsterReaction(ctx,monster,state.fear,x,y-hop,state.time);
  }
  if (state.levelId === 'nether') drawGhastShots(ctx,state,TILE);
  const [x,y] = state.rideRemaining > 0 ? riderPosition(state,TILE) : actorPos(state.player);
  contactShadow(ctx, x, y, state.levitation > 0 ? 9 : 13);
  drawPowerBehind(ctx,state,x,y);
  ctx.save();
  if (state.invulnerable>0 && Math.floor(state.time*8)%2) ctx.globalAlpha=0.55;
  if (state.invisible > 0) ctx.globalAlpha *= invisibleOpacity(state.invisible);
  const lift = state.levitation > 0 ? 3 + Math.round(Math.sin(state.time * 8)) : 0;
  const stride = lift || state.rideRemaining > 0 ? 0 : walkFrame(state.player);
  if (playingAge !== null) {
    const atlas=loadIllustration('./assets/maze-figures.webp');
    drawGuitarist(ctx,x,y-lift,playingAge,state.player.dir==='left',Boolean(state.player.target),atlas);
  } else {
    familyFigure(ctx,state,x,y-lift,stride);
  }
  ctx.restore();
  drawPowerFront(ctx,state,x,y-lift,state.width*TILE);
  if (state.slow > 0) showSlow(ctx,x,y,state.time);
}
