// Volcanic rock is drawn in cool violets so the walkways stand apart from the molten river.
const basaltDark = '#332e3a';
const lava = '#ef7838';
const ember = '#ffab49';
const glow = '#ffe69b';

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Use integer spans for sloping silhouettes; even the bridge arch stays pixel-sharp.
function polygon(ctx, color, points) {
  const heights = points.map(p => p[1]);
  for (let y = Math.min(...heights); y < Math.max(...heights); y++) {
    const cuts = [];
    for (let i = 0; i < points.length; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length];
      if ((y0 > y) !== (y1 > y)) cuts.push(x0 + (y + .5 - y0) * (x1 - x0) / (y1 - y0));
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i += 2) {
      const x = Math.round(cuts[i]);
      rect(ctx, color, x, y, Math.round(cuts[i + 1]) - x, 1);
    }
  }
}

function pillar(ctx, x, bottom, w, h) {
  const y = bottom - h, mid = x + Math.floor(w * .57);
  // A six-sided broken column, lit from the upper left and from the hot ground below.
  polygon(ctx, basaltDark, [[x,y+3],[x+3,y],[mid,y-1],[x+w,y+2],[x+w,bottom-1],[mid,bottom+2],[x,bottom-1]]);
  rect(ctx, '#6b596a', x + 1, y + 3, mid-x-1, h-4);
  rect(ctx, '#453b50', mid, y + 3, w-(mid-x)-1, h-3);
  rect(ctx, '#93758a', x+1, y+3, 2, h-7);
  polygon(ctx,'#89798b',[[x,y+2],[x+3,y],[mid,y-1],[x+w,y+2],[mid,y+4],[x+2,y+3]]);
  rect(ctx, '#ad8b99', x+3, y, Math.max(2,mid-x-2),1);
  for (let n = 7; n < h-2; n += 7) {
    rect(ctx,'#564554',x+2,y+n,Math.max(2,mid-x-3),1);
    rect(ctx,'#775d6d',mid-1,y+n+1,2,1);
  }
  rect(ctx, '#985f5a', x+2, bottom-3, Math.max(2,mid-x-1),2);
  rect(ctx, '#ad735e', mid, bottom-2,2,1);
}

function basaltSpire(ctx) {
  pillar(ctx, 6, 39, 10, 17);
  pillar(ctx, 14, 38, 12, 25);
  pillar(ctx, 27, 39, 13, 35);
  pillar(ctx, 41, 41, 12, 24);
  pillar(ctx, 50, 42, 10, 15);
  pillar(ctx, 20, 43, 11, 18);
  pillar(ctx, 32, 44, 13, 13);
  // Quartz grows in the sheltered notch where the columns have fractured.
  for (const [x,y,h] of [[16,43,5],[19,42,8],[47,42,7],[50,42,4]]) {
    polygon(ctx,'#a889aa',[[x-2,y],[x-2,y-3],[x,y-h],[x+2,y-2],[x+2,y]]);
    rect(ctx,'#e4c4ca',x,y-h+2,1,h-3);
  }
  rect(ctx,'#d88b66',7,40,3,1);
}

function lavaFalls(ctx) {
  pillar(ctx, 4, 40, 13, 16);
  pillar(ctx, 11, 36, 16, 27);
  pillar(ctx, 27, 37, 16, 32);
  pillar(ctx, 42, 39, 12, 21);
  pillar(ctx, 53, 41, 8, 12);
  polygon(ctx,'#562f3c',[[18,10],[22,6],[37,6],[42,10],[41,16],[20,17]]);
  polygon(ctx,'#bb5545',[[20,11],[24,8],[37,8],[40,10],[38,14],[22,15]]);
  polygon(ctx,'#ffb249',[[19,12],[23,10],[38,10],[40,11],[37,14],[23,15]]);
  polygon(ctx,'#f57a38',[[20,12],[38,12],[37,21],[39,34],[43,37],[19,37],[21,30]]);
  rect(ctx,'#ff9b3f',23,13,5,20);
  rect(ctx,'#ffda77',24,13,2,9);
  rect(ctx,'#e35b36',28,14,3,13);
  rect(ctx,'#c74836',36,14,2,19);
  rect(ctx,'#ffc260',33,17,2,10);
  rect(ctx,'#ffb448',24,26,2,10);
  rect(ctx,'#ffdf78',32,30,2,5);
  polygon(ctx,'#733e44',[[15,34],[40,33],[45,37],[58,39],[64,43],[55,46],[10,46],[4,43]]);
  polygon(ctx,'#cc5b37',[[19,35],[40,35],[46,39],[58,40],[60,43],[52,45],[13,44],[9,42]]);
  polygon(ctx,'#fb8c3c',[[21,35],[38,35],[41,38],[50,40],[48,42],[16,42],[13,40]]);
  rect(ctx,'#ffce63',20,36,16,2);
  rect(ctx,'#fff0a0',24,36,6,1);
  rect(ctx,'#ffad4c',32,41,13,1);
  rect(ctx,'#fab35a',55,43,4,1);
  for (const [x,y] of [[17,30],[44,31],[13,36]]) rect(ctx, '#ffc269', x,y,1,2);
}

function fungus(ctx, x, base, size) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(size, size);
  rect(ctx, '#5c344d', -3, -21, 7, 21);
  rect(ctx, '#a35067', -2, -20, 3, 20);
  rect(ctx, '#db6f70', -2, -10, 1, 7);
  rect(ctx, '#4a374a', -5, -2, 11, 3);
  polygon(ctx, '#78334f', [[-14,-19],[-13,-25],[-9,-25],[-9,-29],[7,-29],[7,-27],[13,-27],[13,-23],[16,-23],[16,-18],[-10,-18],[-10,-17],[-14,-17]]);
  rect(ctx, '#b4485a', -10, -26, 22, 5);
  rect(ctx, '#d36063', -8, -29, 15, 4);
  rect(ctx, '#e87f70', -7, -28, 6, 2);
  rect(ctx, '#edab6c', -11, -23, 3, 2);
  rect(ctx, '#edab6c', 3, -26, 4, 2);
  rect(ctx, '#cb6a68', 11, -20, 4, 1);
  for (const [dx, n] of [[-10, 6], [7, 4], [12, 7]]) {
    rect(ctx, '#a65360', dx, -18, 1, n);
    rect(ctx, '#ffa758', dx - 1, -19 + n, 2, 2);
  }
  ctx.restore();
}

function fungalGrove(ctx) {
  for (const [x,y] of [[7,39],[13,34],[35,37],[57,38]]) {
    rect(ctx,'#66404b',x,y,1,5);
    rect(ctx,'#cc7167',x-1,y,3,1);
  }
  fungus(ctx, 45, 36, .78);
  fungus(ctx, 23, 42, 1.15);
  fungus(ctx, 51, 44, .42);
  fungus(ctx, 8, 44, .30);
  for (const [x,y,n] of [[13,17,3],[23,13,4],[29,15,3],[40,16,2],[48,16,2]]) {
    rect(ctx,'#e88568',x-1,y-1,n+2,3);
    rect(ctx,'#ffd083',x,y,n,1);
  }
  for (const [x,y] of [[15,25],[27,29],[32,26],[42,24],[38,27]]) {
    rect(ctx,'#8f5866',x,y,1,2);
    rect(ctx,'#f5ad77',x,y+2,1,1);
  }
}

function archBridge(ctx) {
  // Spandrels follow stepped arches, leaving the lava lake visible beneath them.
  for (const left of [238, 268, 298, 328]) {
    for (let i = 0; i < 30; i++) {
      const height = 25 - Math.floor(17 * Math.sin((i + .5) * Math.PI / 30));
      rect(ctx, basaltDark, left + i, 59, 1, height);
      rect(ctx, '#65515a', left + i, 59, 1, height - 2);
      rect(ctx, '#b17668', left + i, 57 + height, 1, 1);
    }
  }
  for (const x of [268, 298, 328]) {
    rect(ctx, '#503946', x - 3, 81, 6, 3);
    rect(ctx, '#da7849', x - 7, 84, 14, 1);
  }
  rect(ctx, '#332d3b', 234, 54, 128, 8);
  rect(ctx, '#926f76', 234, 54, 128, 2);
  rect(ctx, '#6b5361', 235, 57, 126, 3);
  for (let x = 236; x < 361; x += 11) {
    rect(ctx, '#443848', x, 49, 4, 5);
    rect(ctx, '#a37a7a', x, 48, 4, 2);
  }
  for (const x of [242, 341]) {
    rect(ctx, basaltDark, x, 40, 7, 15);
    rect(ctx, '#745965', x, 40, 2, 13);
    rect(ctx, '#38313b', x - 2, 37, 11, 4);
    rect(ctx, lava, x, 34, 7, 3);
    rect(ctx, ember, x + 2, 31, 3, 6);
    rect(ctx, glow, x + 3, 32, 1, 3);
  }
}

export function drawNetherLandscape(ctx) {
  // Deep cave, distant basalt ridges, and a bright lake under the viaduct.
  rect(ctx, '#824454', 0, 0, 480, 100);
  const haze = ['#944e58', '#af5d5c', '#c57460', '#d78b63'];
  haze.forEach((color, i) => rect(ctx,color,0,16 + 11*i,480,14));
  for (let i = 0; i < 34; i++) {
    const x = i * 15 - 5;
    const y = 30 + ((i * 13) % 21);
    rect(ctx, '#9a5962', x, y, 19, 69 - y);
    rect(ctx, '#ac6768', x + 1, y, 6, 62 - y);
    rect(ctx, '#b4746f', x + 1, y, 16, 1);
  }
  polygon(ctx, '#76465a', [[0,51],[32,44],[72,50],[108,36],[158,52],[198,42],[231,51],[284,35],[311,47],[345,37],[386,50],[416,38],[480,49],[480,73],[0,73]]);
  rect(ctx, '#bf583f', 0, 69, 480, 31);
  for (let y = 70; y < 100; y += 3) {
    for (let x = (y * 7) % 26 - 26; x < 480; x += 30) {
      rect(ctx, (x + y) % 3 === 0 ? '#ffa24c' : '#df7647', x, y, 15 + (y % 7), 1);
    }
  }
  polygon(ctx, '#584354', [[0,45],[44,41],[56,49],[104,45],[130,53],[170,47],[208,52],[239,52],[244,59],[235,67],[212,73],[168,70],[144,80],[101,73],[75,83],[0,78]]);
  polygon(ctx, '#644657', [[349,51],[370,46],[400,52],[425,43],[480,45],[480,82],[434,79],[412,71],[376,75],[355,67]]);
  for (const [x,y,n,w] of [[209,52,24,4],[216,53,18,3],[365,50,28,7],[373,50,20,3]]) {
    rect(ctx, lava, x, y, w, n);
    rect(ctx, '#ffb85e', x, y, Math.max(1, w - 3), n - 2);
    rect(ctx, '#ffda7e', x, y, w, 1);
    rect(ctx, '#f2934b', x - 3, y + n, w + 8, 2);
  }
  archBridge(ctx);
  // This ghast drifts beyond the parapet, above the far shore.
  const ghast = netherMonsterPixels.ghast;
  for (let y = 0; y < ghast.length; y++) {
    for (let x = 0; x < ghast[y].length; x++) {
      const ink = netherMonsterColors[ghast[y][x]];
      if (ink) rect(ctx, ink, 318 + x, 19 + y, 1, 1);
    }
  }
  for (const [x, base, size] of [[185,54,.65],[191,54,.35],[390,52,.7],[407,53,.9]]) fungus(ctx,x,base,size);
  for (const [x,w,h] of [[-3,19,39],[26,10,29],[58,15,16],[99,9,13],[150,17,9],[303,10,12],[357,11,17],[414,15,18],[445,14,40],[470,14,29]]) {
    rect(ctx, '#674054', x, 0, w, h);
    rect(ctx, '#8b4959', x + 2, 0, 3, h - 3);
  }
  for (let i = 0; i < 31; i++) {
    const x = (193 + 43*i) % 480, y = 4 + (57*i) % 59;
    rect(ctx, i % 4 === 0 ? '#ffc778' : '#e5956c', x, y, 1 + i % 2, 1);
  }
  polygon(ctx, '#433644', [[0,68],[35,70],[45,62],[72,65],[91,80],[115,77],[149,91],[180,93],[186,100],[0,100]]);
  polygon(ctx, '#453744', [[361,100],[376,91],[396,91],[406,78],[434,80],[448,63],[480,59],[480,100]]);
  fungus(ctx, 454, 86, 1.3);
  fungus(ctx, 425, 90, .65);
  fungus(ctx, 70, 77, 1.12);
}

export function netherTile(ctx, map, x, y, tile, seed) {
  const px = x * tile, py = y * tile, t = map[y][x];
  if (t === '~') {
    // Each band runs through neighboring tiles, so the molten river has a single current.
    rect(ctx, '#c05239', px, py, tile, tile);
    const west = map[y][x-1] !== '~', east = map[y][x+1] !== '~';
    for (let r = 0; r < tile; r += 2) {
      const turn = Math.round(2.5*Math.sin((py+r)*.14) + 1.5*Math.sin((py+r)*.27));
      const streak = (px+py+r*2) % 17;
      if (west) {
        rect(ctx, '#873e3b', px, py+r, Math.max(0,4+turn), 2);
        rect(ctx, '#e1703c', px+4+turn, py+r, 2, 2);
        rect(ctx, '#e9773a', px+13+turn, py+r, tile-13-turn, 2);
      }
      if (east) {
        rect(ctx, '#e9773a', px, py+r, 5+turn, 2);
        rect(ctx, '#db6739', px+tile-6+turn, py+r, 3, 2);
        rect(ctx, '#983f39', px+tile-3+turn, py+r, Math.max(0,3-turn), 2);
      }
      if (streak < 4) rect(ctx, '#f49347', px+5+streak, py+r, 4, 1);
    }
    if (seed % 3 === 0) {
      // A little dark crust floats in the hot center, with a luminous trailing rim.
      const bx = px + (west ? 12 : 2), by = py+5+seed%6;
      rect(ctx, '#fd9e47', bx-1,by,7,3);
      rect(ctx, '#e5793e', bx+1,by-1,3,1);
      rect(ctx, '#b2593f', bx,by,5,2);
      rect(ctx, '#903f3b', bx+1,by,3,1);
      rect(ctx, '#ffd17c', bx+2,by+2,3,1);
    }
    if (map[y - 1]?.[x] !== '~') rect(ctx, '#813f3f', px, py, tile, 2);
    return;
  }
  if (t === '.') {
    rect(ctx, ['#322b36','#352c37','#342d38'][seed % 3], px, py, tile, tile);
    rect(ctx,'#2b2833',px,py+tile-1,tile,1);
    if (seed % 3 === 0) {
      rect(ctx,'#463644',px+3,py+12,5,1);
      rect(ctx,'#423340',px+7,py+11,4,1);
    }
    // Warm light runs along each lava bank, tapering off before the walking lane.
    for (const side of [-1,1]) if (map[y][x+side] === '~') {
      const bank = side === 1 ? px+tile-6 : px;
      rect(ctx,'#49323b',bank,py,6,tile);
      rect(ctx,'#65403f',side === 1 ? bank+3 : bank,py,3,tile);
      rect(ctx,'#a25b41',side === 1 ? bank+5 : bank,py+3,1,6+seed%8);
    }
    return;
  }

  const north = map[y-1]?.[x] !== '#', south = map[y+1]?.[x] !== '#';
  const h = south ? tile - 6 : tile;
  rect(ctx, ['#6e5360','#715764','#755965','#695362'][seed%4], px, py, tile, h);
  const seam = 3 + seed % 6, layer = 4 + (seed >> 2) % 4;
  rect(ctx, '#624b59', px, py+layer+1, seam, 2);
  rect(ctx, '#826471', px, py+layer, seam, 1);
  rect(ctx, '#584755', px+seam, py+layer+2, 3, 2);
  rect(ctx, '#66505e', px+seam+2, py+layer+3, 6, 1);
  rect(ctx, '#836471', px+seam+2, py+layer+4, 3, 1);
  if (seed % 5 === 0) {
    rect(ctx,'#a47774',px+11,py+3,5,1);
    rect(ctx,'#c18e79',px+13,py+2,2,1);
  }
  if (seed % 17 === 0) {
    // Narrow, stepped quartz veins follow a split in the darker basalt.
    for (const [dx,dy] of [[4,8],[6,7],[8,6],[10,5],[8,9],[10,8]]) {
      rect(ctx,'#514352',px+dx,py+dy,3,2);
      rect(ctx,'#c5a2aa',px+dx,py+dy,2,1);
    }
    rect(ctx,'#e1c8bd',px+9,py+6,2,1);
  }
  if (north) {
    rect(ctx, '#9c7681', px, py, tile, 2);
    rect(ctx, '#b58a8a', px+2, py, 6+seed%8, 1);
  }
  if (map[y][x-1] !== '#') rect(ctx, '#977481', px, py+1, 2, h-1);
  if (map[y][x+1] !== '#') rect(ctx, '#544453', px+tile-2, py+2, 2, h-2);
  if (south) {
    rect(ctx, '#4c3c4a', px, py+h, tile, 5);
    rect(ctx, '#362e3c', px, py+tile-1, tile, 1);
    rect(ctx, '#aa7a77', px, py+h-1, tile, 1);
    rect(ctx, '#7e595e', px+1, py+h+1, seam+3, 2);
    rect(ctx, '#654b55', px+seam+5, py+h+2, 5, 1);
  }
}

export function drawNetherBridges(ctx, state, tile) {
  for (const [x, y] of state.bridges) {
    const px = x * tile, py = y * tile;
    const across = state.map[y - 1]?.[x] === '~' || state.map[y + 1]?.[x] === '~';
    ctx.save();
    ctx.translate(px, py);
    if (!across) {
      ctx.translate(tile, 0);
      ctx.rotate(Math.PI / 2);
    }
    rect(ctx, '#5f4b49', 0, 0, tile, tile);
    for (let i = 0; i < tile; i += 5) {
      rect(ctx, '#9a7460', i + 1, 2, 4, tile - 4);
      rect(ctx, '#b28b6c', i + 1, 3, 1, tile - 6);
    }
    for (const rail of [0, tile - 3]) {
      rect(ctx, '#483b42', 0, rail, tile, 3);
      rect(ctx, '#e9a273', 0, rail, tile, 1);
      rect(ctx, '#725660', 2, rail, 2, 3);
    }
    ctx.restore();
  }
}

export const netherMonsterColors = {
  X: '#302737', H: '#fff1d9', K: '#dbcfc7', L: '#b9a6ae', M: '#8b798d',
  R: '#ba4c46', T: '#ef7350', B: '#793e45', E: '#ffba58', G: '#ffdf82',
  A: '#ac6935', Y: '#f9bc4d', Q: '#fff3a4', O: '#f08c31', F: '#d56933',
  C: '#474958', S: '#757c90', D: '#3a3546', W: '#adbbd2', P: '#e3dcdf', V: '#857f9b',
};

export const netherMonsterPixels = {
  blaze: [
    '....F..Y...O....', '...O..YGQQY..A..', '..Y..XYYYYGXAQ..', '..Q..XGGQYYXYE..',
    '..E..XXAXXAXYE..', '...Y.XOYYOYX.O..', '.Y.Y..AEEOA.....', '.Q.O...YY...Y...',
    '.Y...Q.FO.Y.Q...', '.O.Y.Y..F.Q.YE..', '..AQQE.YO.Y..O..', '...YE..QY.O.Y...',
    '...O..YYE...Q...', '......EY..Y.E...', '......O...Q..A..', '..........O.....',
  ],
  wither_skeleton: [
    '......VSSSV.....', '.....VWSSSCX....', '.....VCSDSSX....', '.....VXXCXXC..P.',
    '.....VSCDSCX.WS.', '......VSSC...WC.', '.......SDX..PSC.', '....VWSDDSV.WC..',
    '...VSDXSSXSVSC..', '...VD.VDDXXWSX..', '...VS.VCSX..P...', '....V.VDDX......',
    '.....VSCVSC.....', '.....VCX.DV.....', '.....VSX.SV.....', '....VSCX.VSC....',
  ],
  ghast: [
    '...XXXXXXXXXX...', '..XHHHHHHHHKKX..', '.XHHHHHHHHHKKLX.', '.XHHKKHHHHHKLLX.',
    '.XHHHHHHHHKKLLX.', '.XHXXKHHXXKKLLX.', '.XHKMLHHMLKKLLX.', '.XHHHKKKHHKKLLX.',
    '.XHHHHXXHHKKLLX.', '..XHKKMMKKKLLX..', '...MKKLLKKLLM...', '...KX.LX..KXM...',
    '..HK..LK..KX.L..', '..KL..LM.LK..L..', '..M...X..LM..M..', '..........X.....',
  ],
  magma_cube: [
    '................', '......XXXXX.....', '...XXXBBBRRXX...', '..XRRRTTRRBRRX..',
    '.XRRRRTTRBBRRBX.', '.XRRRRRBBBBRRBX.', '.XBGGGRBBGGGBBX.', '.XREEERBBEEEBBX.',
    '..XRRRRRRBBRRX..', '.XEEEEETTTEETTX.', '..XBBBBBRBBBBX..', '.XBRTTTTRRBBRBX.',
    '.XEEEETTTEEEETX.', '..XBBBBBBBBBBX..', '...XXXXXXXXXX...', '................',
  ],
};

const formations = { lavafall: lavaFalls, basalt_columns: basaltSpire, crimson_fungi: fungalGrove };

export function drawNetherFixture(ctx, { type, x, y, width, height }, tile) {
  const w = width * tile, h = height * tile, px = x * tile, py = y * tile;
  const cx = px+w*.45, cy = py+h*.55;
  const light = ctx.createRadialGradient(cx,cy,2,cx,cy,w*.60);
  const tone = type === 'lavafall' ? '255,117,46' : type === 'crimson_fungi' ? '190,81,103' : '116,119,158';
  light.addColorStop(0,'rgba('+tone+',.38)');
  light.addColorStop(.55,'rgba('+tone+',.19)');
  light.addColorStop(1,'rgba('+tone+',0)');
  rect(ctx,light,cx-w*.6,cy-w*.6,w*1.2,w*1.2);
  const scale = Math.min((w-5)/68,(h-5)/48);
  ctx.save();
  ctx.translate(Math.round(px+(w-68*scale)/2),Math.round(py+h-3-48*scale));
  ctx.scale(scale,scale);
  // Rugged outcrops grow directly out of the wall, with a narrow lip facing the corridor.
  polygon(ctx,'#423645',[[1,40],[10,35],[28,35],[43,31],[61,37],[66,41],[60,46],[23,48],[9,46]]);
  polygon(ctx,'#5c4451',[[1,40],[10,35],[28,35],[43,31],[61,37],[65,40],[56,43],[23,45],[9,44]]);
  polygon(ctx,'#775562',[[7,39],[14,36],[28,36],[42,32],[59,37],[53,39],[39,36],[23,40]]);
  rect(ctx,'#98665e',13,45,5,1);
  rect(ctx,'#795461',40,44,7,1);
  formations[type](ctx);
  ctx.restore();
}

const lavaCells = new WeakMap();

export function drawLavaFlow(ctx, state, tile) {
  if (!lavaCells.has(state.map)) {
    const cells = [];
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        if (state.map[y][x] === '~') cells.push([x,y]);
      }
    }
    lavaCells.set(state.map, cells);
  }
  const phase = Math.floor(state.time * 4);
  for (const [x,y] of lavaCells.get(state.map)) {
    const dx = 2 + (phase + x * 5 + y * 3) % 9, dy = 7 + (x * 3 + y) % 7;
    rect(ctx, '#f19b4c', x * tile + dx, y * tile + dy, 7, 1);
    rect(ctx, '#f19b4c', x * tile + dx + 6, y * tile + dy - 1, 2, 1);
    if ((phase + 3 * y + x) % 12 < 2) rect(ctx, '#ffc368', x * tile + 3, y * tile + 3, 2, 2);
  }
}


function fireLane(ctx, monster, tile) {
  const {x, y} = monster.aim;
  const mx = Math.round(monster.x), my = Math.round(monster.y);
  const dx = Math.sign(x - mx), dy = Math.sign(y - my);
  const steps = Math.abs(x - mx) + Math.abs(y - my);
  for (let i = 1; i <= steps; i++) {
    const cx = Math.round((mx + dx * i + .5) * tile);
    const cy = Math.round((my + dy * i + .5) * tile);
    // Twin sparks identify the blaze's two-shot volley.
    for (const side of [-1, 1]) {
      const sx = cx + dy * side * 4, sy = cy + dx * side * 4;
      rect(ctx, '#814433', sx - 2, sy - 2, 4, 4);
      rect(ctx, '#ffe487', sx - 1, sy - 1, 2, 2);
    }
  }
}

function emberBolt(ctx, effect, tile) {
  ctx.save();
  ctx.translate(Math.round((effect.x + .5) * tile), Math.round((effect.y + .5) * tile));
  ctx.rotate(({right: 0, down: .5, left: 1, up: -.5})[effect.dir] * Math.PI);
  rect(ctx, '#9f472a', -7, 0, 11, 2);
  rect(ctx, '#e89c37', -5, -1, 8, 3);
  rect(ctx, '#ffdb66', -3, -2, 5, 5);
  rect(ctx, '#fff9c8', 1, -1, 3, 3);
  ctx.restore();
}

function swordReach(ctx, cells, tile, active) {
  for (const [x, y] of cells) {
    const px = x * tile, py = y * tile;
    const color = active ? '#f2d9fe' : '#bfa3ce';
    for (const side of [-1, 1]) {
      const sx = px + (side === -1 ? 2 : tile - 4);
      rect(ctx, '#48374f', sx - 1, py + 3, 4, tile - 6);
      rect(ctx, color, sx, py + 3, 2, tile - 6);
      rect(ctx, color, sx + (side === -1 ? 2 : -2), py + 3, 2, 2);
    }
    if (active) {
      for (let i = 0; i < 5; i++) rect(ctx, color, px + 5 + i * 2, py + 13 - i * 2, 3, 2);
    }
  }
}

export function drawNetherThreats(ctx, state, tile) {
  for (const monster of state.monsters) {
    if (!monster.aim || monster.windup <= 0) continue;
    if (monster.type === 'blaze') fireLane(ctx, monster, tile);
    if (monster.type === 'wither_skeleton') swordReach(ctx, monster.cells, tile, false);
  }
  for (const effect of state.effects) {
    if (effect.type === 'ember' && !(effect.delay > 0)) emberBolt(ctx, effect, tile);
    if (effect.type === 'wither_slash') swordReach(ctx, effect.cells, tile, true);
  }
}
