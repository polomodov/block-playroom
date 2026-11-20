import { drawDragon, drawDragonWarning, drawDragonCloud } from './dragon-art.js?v=dragon-flight-1';
import { BREATH_LIFETIME, BREATH_REACH } from './dragon-rules.js?v=dragon-flight-1';

// Obsidian towers rise above the End's pale, broken islands. The same silhouettes
// appear in the panorama and in the three landmarks inside the playable maze.
const obsidian = '#29243b';
const obsidianLit = '#625477';
const endStone = '#d1cb9c';
const pink = '#eb9add';
const pearl = '#fff1e1';

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function polygon(ctx, color, vertices) {
  const ys = vertices.map(point => point[1]);
  ctx.fillStyle = color;
  for (let y = Math.floor(Math.min(...ys)); y < Math.max(...ys); y++) {
    const cuts = [];
    for (let i = 0; i < vertices.length; i++) {
      const [ax, ay] = vertices[i];
      const [bx, by] = vertices[(i + 1) % vertices.length];
      if ((ay > y + .5) !== (by > y + .5)) {
        cuts.push(ax + (y + .5 - ay) * (bx - ax) / (by - ay));
      }
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i + 1 < cuts.length; i += 2) {
      const x = Math.round(cuts[i]);
      ctx.fillRect(x, y, Math.round(cuts[i + 1]) - x, 1);
    }
  }
}

function spark(ctx, color, x, y, radius = 1) {
  rect(ctx, color, x - radius, y, radius * 2 + 1, 1);
  rect(ctx, color, x, y - radius, 1, radius * 2 + 1);
}

function crystal(ctx, x, y, r) {
  polygon(ctx, '#ab65ac', [[x,y-r-1],[x+r,y],[x,y+r+1],[x-r,y]]);
  polygon(ctx, '#efa7e0', [[x,y-r],[x+1,y],[x,y+r],[x-r+1,y]]);
  polygon(ctx, '#fbe3ed', [[x,y-r],[x+1,y-1],[x-r+1,y]]);
  rect(ctx, pearl, x - 1, y - 1, 2, 2);
}

function spire(ctx, x, bottom, width, height) {
  const top = bottom - height, lit = Math.max(2, Math.floor(width / 3));
  rect(ctx, obsidian, x, top, width, height);
  rect(ctx, '#44394f', x + 1, top + 2, lit, height - 2);
  rect(ctx, obsidianLit, x, top, width, 2);
  rect(ctx, '#19182c', x + width - 3, top + 2, 3, height - 2);
  for (let y = top + 4; y < bottom - 1; y += 7) {
    rect(ctx, '#584b66', x + 2, y, lit, 1);
    rect(ctx, '#382e47', x + width - 3, y - 2, 2, 2);
  }
  const cx = x + Math.floor(width / 2);
  rect(ctx, '#655268', x - 1, bottom - 2, width + 2, 2);
  rect(ctx, '#9c779a', cx - 4, top - 2, 8, 2);
  ctx.save();
  ctx.globalAlpha = .32;
  rect(ctx, '#c57aca', cx-5, top-12, 11, 11);
  rect(ctx, '#c57aca', cx-7, top-10, 15, 7);
  ctx.restore();
  crystal(ctx, cx, top - 7, Math.max(3, Math.floor(width / 4)));
}

function island(ctx, x, y, width, depth, far = false) {
  ctx.save();
  ctx.translate(x, y);
  const rim = far ? '#81738b' : '#aea184';
  const top = far ? '#a092a1' : endStone;
  const side = far ? '#514861' : '#857c74';
  const half = Math.round(width / 2);
  polygon(ctx, side, [[0,0],[width,0],[width-3,4],[width-9,6],[width-15,depth*.65],
    [half+3,depth],[half-10,depth*.62],[11,depth*.7],[7,5],[2,4]]);
  polygon(ctx, rim, [[0,0],[width,0],[width-6,4],[half+6,4],[half-3,depth*.56],[half-9,4],[4,3]]);
  polygon(ctx, top, [[0,0],[7,-3],[half-5,-5],[width-7,-3],[width,0],[width-8,2],[9,2]]);
  for (let i = 12; i < width - 8; i += 9) {
    const dy = Math.floor(i / 9) % 3;
    rect(ctx,rim,i,dy-2,dy+2,1);
    rect(ctx,side,i+1,4 + dy,3,1);
  }
  ctx.restore();
}

function chorus(ctx, x, base, height) {
  const top = base - height;
  rect(ctx, '#68516e', x, top, 4, height);
  rect(ctx, '#ad88ac', x, top, 1, height);
  for (const [dir, dy, w] of [[-1,7,7],[1,14,8]]) {
    const bx = dir < 0 ? x - w : x + 2;
    rect(ctx, '#815e82', bx, top + dy, w, 3);
    const ex = dir < 0 ? bx : bx + w - 2;
    rect(ctx, '#946f98', ex, top + dy - 5, 3, 7);
    rect(ctx, '#705376', ex-1, top+dy-8, 5, 4);
    rect(ctx, '#c39abc', ex, top+dy-8, 3, 1);
  }
  rect(ctx, '#7c6180', x-2, top-4, 7, 6);
  rect(ctx, '#ceacc6', x-1, top-4, 4, 2);
}

export function drawEndLandscape(ctx) {
  const bands = ['#211d37','#2b2240','#352847','#443050','#553d5d','#70516c','#876879'];
  bands.forEach((color, i) => {
    const y = i*15;
    rect(ctx, color, 0, y, 480, 16);
    if (!i) return;
    // Broken banks of nebula follow the horizon behind the towers.
    for (let x=0; x<480; x+=5) {
      const rise = Math.round(3+2*Math.sin(x/28+i)+2*Math.sin(x/15-i));
      rect(ctx,color,x,y-rise,5,rise);
    }
  });
  for (let i = 0; i < 59; i++) {
    const x = (i * 67 + i * i * 7) % 480, y = (i * 37 + 3) % 61;
    if (i % 13 === 0) spark(ctx, '#c3acc4', x, y);
    else rect(ctx, i%2 ? '#97829e' : '#65546f', x,y,1,1);
  }
  island(ctx, 57, 43, 54, 14, true);
  island(ctx, 177, 61, 70, 18, true);
  island(ctx, 393, 48, 58, 13, true);
  island(ctx, -15, 75, 102, 24);
  spire(ctx, 33, 72, 11, 36);
  island(ctx, 155, 89, 101, 22);
  chorus(ctx, 199, 85, 17);
  chorus(ctx, 224, 86, 13);
  island(ctx, 254, 79, 141, 29);
  spire(ctx, 278, 77, 15, 40);
  spire(ctx, 314, 75, 12, 26);
  spire(ctx, 353, 76, 15, 33);
  island(ctx, 405, 88, 95, 19);
  spire(ctx, 450, 85, 17, 51);
  chorus(ctx, 423, 85, 17);
  drawDragon(ctx, { x: 323, y: 37, dir: 1, pitch: -.06, dive: 0, breath: 0, time: .22, scale: 1.12 });
}

// Floor is cool, nearly black stone. Tiny edge reflections leave the centers clear for gems.
export function endTile(ctx, map, x, y, tile, seed) {
  const px = x * tile, py = y * tile;
  if (map[y][x] === '.') {
    rect(ctx, ['#282b3a','#2a2b3b','#292c3c'][seed % 3], px, py, tile, tile);
    const joint = 3 + (5 * x + 7 * y) % 13;
    rect(ctx, '#242635', px, py + tile - 2, tile, 2);
    rect(ctx, '#333343', px + joint, py + tile - 3, tile - joint, 1);
    rect(ctx, '#252737', px + joint, py + tile - 5, 1, 3);
    if (seed % 4 === 0) {
      rect(ctx, '#494852', px + 3, py + 5, 3, 1);
      rect(ctx, '#373947', px + 6, py + 4, 2, 1);
    }
    return;
  }

  const north = map[y-1]?.[x] !== '#', south = map[y+1]?.[x] !== '#';
  const west = map[y][x-1] !== '#', east = map[y][x+1] !== '#';
  const h = south ? tile - 6 : tile;
  rect(ctx, ['#afa77d','#b7ae82','#b2a980','#bab386'][seed%4], px, py, tile, h);

  // Shallow hollows and horizontal seams give end stone its porous, layered surface.
  const pit = 2 + seed % 10, band = 2 + (seed >> 3) % 6;
  rect(ctx, '#a19a78', px + pit, py + band, 5, 2);
  rect(ctx, '#8f8970', px + pit, py + band, 3, 1);
  rect(ctx, '#c8c096', px + pit + 1, py + band + 2, 5, 1);
  rect(ctx, '#c1b990', px + (pit + 7) % 15, py + band + 5, 4, 1);
  if (seed % 3 === 0) {
    rect(ctx, '#aea680', px + 2, py + 9, 5, 1);
    rect(ctx, '#d1cba1', px + 3, py + 10, 2, 1);
  }
  if (seed % 23 === 0) {
    // A pale geode in the wall catches the violet sky light.
    for (const [dx,dy] of [[5,8],[7,6],[10,7],[12,5]]) {
      rect(ctx,'#96889a',px+dx,py+dy,3,2);
      rect(ctx,'#c9b5bc',px+dx,py+dy-1,2,2);
      rect(ctx,'#e6d6cf',px+dx,py+dy-1,1,1);
    }
  }
  if (north) {
    rect(ctx, '#d2cda0', px, py, tile, 2);
    rect(ctx, '#eee4b1', px + 2, py, 5 + seed % 7, 1);
    rect(ctx, '#c2b98d', px + 1, py + 2, tile - 1, 1);
  }
  if (west) rect(ctx, '#c7c198', px, py + 1, 2, h - 1);
  if (east) rect(ctx, '#8a866e', px + tile - 2, py + 2, 2, h - 2);
  if (south) {
    rect(ctx, '#777268', px, py + h, tile, 5);
    rect(ctx, '#514e53', px, py + tile - 1, tile, 1);
    rect(ctx, '#9e927d', px, py + h, tile, 1);
    rect(ctx, '#d5c9a0', px + 1, py + h - 1, tile - 3, 1);
    rect(ctx, '#655e61', px + pit, py + h + 2, 2, 3);
    rect(ctx, '#bbb095', px + pit + 2, py + h + 2, 4, 1);
    if (seed % 5 === 0) rect(ctx, '#a091ac', px + 2, py + h + 3, 4, 1);
  }
}

function groundShard(ctx, x, y, size) {
  polygon(ctx, '#765d97', [[x-2,y],[x-2,y-4],[x,y-size],[x+3,y-3],[x+3,y]]);
  rect(ctx, '#b9add6', x, y-size+2, 1, size-2);
}

function endPedestal(ctx, x, base, w, h) {
  const top = base - h, mid = x + Math.floor(w / 2);
  polygon(ctx, '#252436', [[x,top+2],[mid,top-1],[x+w,top+2],[x+w,base],[mid,base+2],[x,base]]);
  rect(ctx, '#44394f', x+1, top+3, mid-x-1, h-4);
  rect(ctx, '#322b42', mid, top+3, w-(mid-x)-1, h-4);
  rect(ctx, '#675579', x+1, top+3, 2, h-5);
  for (let n = 6; n < h-4; n += 6) {
    rect(ctx, '#4c405b', mid+1, top+n, 3, 2);
    rect(ctx, '#69576e', x+2, top+n+2, 3, 1);
  }
  polygon(ctx, '#655678', [[x-1,top+1],[mid,top-2],[x+w+1,top+1],[mid,top+4]]);
  rect(ctx, '#b298ae', mid-2, top, 5, 1);
  polygon(ctx, '#9181aa', [[mid,top-17],[mid+8,top-10],[mid,top-2],[mid-8,top-10]]);
  polygon(ctx, '#443453', [[mid,top-15],[mid+6,top-10],[mid,top-4],[mid-6,top-10]]);
  crystal(ctx, mid, top-10, 4);
  rect(ctx, '#e0eff7', mid-1, top-12, 2, 2);
  spark(ctx, '#d5eff0', mid-5, top-10);
}

const fixtures = {
  crystal_spires(ctx) {
    endPedestal(ctx, 8, 35, 10, 11);
    endPedestal(ctx, 48, 35, 9, 14);
    endPedestal(ctx, 25, 39, 15, 21);
    groundShard(ctx, 18, 39, 5);
    groundShard(ctx, 51, 40, 4);
  },
  exit_portal(ctx) {
    // Two bedrock rims enclose an inky pool; a faceted dragon egg stands in its center.
    polygon(ctx,'#40384d',[[3,28],[18,20],[46,18],[63,24],[62,32],[48,39],[19,40],[3,33]]);
    polygon(ctx,'#75687e',[[3,27],[18,19],[47,17],[63,24],[58,29],[46,34],[19,35],[3,30]]);
    polygon(ctx,'#ae9bae',[[4,27],[18,19],[45,17],[47,18],[19,21],[7,28]]);
    polygon(ctx,'#191d36',[[11,27],[22,22],[46,20],[55,24],[53,27],[43,31],[21,32]]);
    polygon(ctx,'#3c3f62',[[12,28],[21,28],[26,30],[39,29],[46,26],[51,26],[44,30],[22,32]]);
    for (const [x,y] of [[17,26],[43,23],[49,25],[26,30],[37,22]]) rect(ctx,'#ccbfed',x,y,1,1);
    for (const [x,y] of [[13,33],[22,36],[38,35],[50,32],[56,29]]) rect(ctx,'#96869f',x,y,3,1);
    rect(ctx,'#383449',29,11,8,15);
    rect(ctx,'#8d8091',29,13,3,12);
    rect(ctx,'#b9a6ad',28,11,10,2);
    polygon(ctx,'#261e35',[[26,10],[25,7],[27,6],[27,3],[30,2],[31,0],[34,0],[36,3],[39,5],[40,9],[37,12],[29,12]]);
    rect(ctx,'#655078',28,5,4,2);
    rect(ctx,'#c0a4c5',30,3,3,2);
    rect(ctx,'#8b6697',36,8,2,2);
    for (const [x,y] of [[20,24],[46,24]]) {
      rect(ctx,'#443248',x,y,2,4);
      rect(ctx,'#b49ac1',x-1,y-1,4,2);
      rect(ctx,'#ead3d8',x,y-3,2,2);
    }
  },
  chorus_grove(ctx) {
    groundShard(ctx, 9, 38, 7);
    chorus(ctx, 14, 39, 18); chorus(ctx, 34, 39, 30); chorus(ctx, 52, 37, 21);
    for (const [x,y] of [[14,18],[34,6],[52,13],[27,8],[43,16]]) {
      rect(ctx,'#9b749a',x-2,y-1,5,4);
      rect(ctx,'#d2b2c3',x-1,y-2,3,2);
      rect(ctx,'#f1d7d7',x-1,y-1,1,1);
    }
    for (const [x,y] of [[20,39],[28,40],[44,39],[56,38]]) rect(ctx,'#9b809a',x,y,3,1);
  },
};

export function drawEndFixture(ctx, { type, x, y, width, height }, tile) {
  const w = width * tile, h = height * tile;
  const cx = (x + width * .5) * tile, cy = (y + height * .45) * tile;
  const glow = ctx.createRadialGradient(cx,cy,3,cx,cy,w*.65);
  const tone = type === 'exit_portal' ? '99,123,168' : '162,128,191';
  glow.addColorStop(0,'rgba('+tone+',.34)');
  glow.addColorStop(.65,'rgba('+tone+',.13)');
  glow.addColorStop(1,'rgba('+tone+',0)');
  rect(ctx,glow,cx-w*.65,cy-w*.65,w*1.3,w*1.3);
  const scale = Math.min((w-6)/66,(h-7)/45);
  ctx.save();
  ctx.translate(Math.round(x*tile+(w-66*scale)/2),Math.round(y*tile+h-5-45*scale));
  ctx.scale(scale,scale);
  // Exposed strata give each landmark a detached island silhouette instead of a rectangular base.
  island(ctx,0,37,66,8);
  polygon(ctx,'#aa9b87',[[4,36],[15,32],[34,33],[45,31],[62,35],[58,38],[19,40]]);
  polygon(ctx,'#c7b99b',[[4,35],[15,32],[35,32],[45,30],[61,34],[51,35],[33,34],[18,36]]);
  fixtures[type](ctx);
  ctx.restore();
}

// A moonlit silhouette keeps the Enderman’s long limbs visible on the dark walkways.
export const endermanColors = {
  C:'#716887', D:'#3e344d', E:'#927897', M:'#efa0ff', N:'#fff4d9',
};

export const endMonsterColors = {
  a:'#382c48', b:'#594567', c:'#896789', d:'#b58eaa', e:'#d6aec0',
  f:'#dac99e', g:'#ffebbe', h:'#4b423e', i:'#46394f', j:'#261f30',
  k:'#887792', l:'#e99ffe', m:'#ffdbff',
};
export const endMonsterPixels = {
  shulker: [
    '................','....aaaaaaaa....','..abcdddeeddba..','.acddccddddccba.',
    '.abddccdeeddcba.','.abccdddddddcca.','..aaaaaaaaaaaa..','....hfffffhh....',
    '....fghffhgf....','....fffffffh....','.abbbbbbbbbbbba.','.acdddddddddcca.',
    '.abcdccddcccda..','..abccdccccba...','...aaaaaaaaa....','................',
  ],
  ender_dragon: [
    '...kk.....kk....','...kiij..iik....','..jiiiiiiiiij...','..jikkkiiiiij...',
    '.jjiijjiiiiijj..','.jjlmljjlmljij..','..jjiiiiiiiij...','..jjjijjjjiij...',
    '....jjiijjjj....','....jiikkiij....','...jiiijjiiij...','...jjjijjijjj...',
    '....jjjjjjjj....','.....jiijij.....','......jjjj......','................',
  ],
};

export function drawEndThreats(ctx, state, tile) {
  const dragon = state.dragon;
  if (dragon?.cells.length) {
    const progress = dragon.phase === 'warning' ? dragon.age / (dragon.age + dragon.windup) : 1;
    for (const [x, y] of dragon.cells) {
      drawDragonWarning(ctx, (x + .5) * tile, (y + .5) * tile,
        tile * .46, tile * .42, progress, state.time);
    }
  }
  for (const effect of state.effects) {
    if (effect.type === 'dragon_breath') {
      const { x, y, remaining } = effect;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x * tile, y * tile, tile, tile);
      ctx.clip();
      drawDragonCloud(ctx, (x + .5) * tile, (y + .5) * tile, tile * .50, tile * .49,
        BREATH_LIFETIME - remaining, BREATH_LIFETIME, x * 3 + y);
      ctx.restore();
    }
    if (effect.type === 'shulker_bolt') {
      const x = Math.round((effect.x+.5)*tile), y = Math.round((effect.y+.5)*tile);
      const offset = {left:[1,0], right:[-1,0], up:[0,1], down:[0,-1]}[effect.dir] || [0,0];
      rect(ctx,'#966997',x+4*offset[0]-1,y+4*offset[1]-1,2,2);
      rect(ctx,'#e4c0d8',x-3,y-2,7,5);
      rect(ctx,'#aab2bb',x-2,y-3,5,7);
      rect(ctx,'#f9f5d4',x-2,y-2,4,4);
      spark(ctx,pearl,x,y);
    }
  }
}

export function drawFlyingDragon(ctx, state, tile) {
  const dragon = state.dragon;
  if (!dragon) return;
  const dir = dragon.dir === 'right' ? 1 : -1;
  const x = (dragon.x + .5) * tile, floorY = (dragon.y + .5) * tile;
  const scale = 1.17 - dragon.altitude * .14;
  ctx.save();
  ctx.fillStyle = `rgba(27,14,40,${.25 - dragon.altitude * .06})`;
  ctx.beginPath();
  ctx.ellipse(x, floorY, tile * 1.12 * scale, tile * .27 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A short jet reaches the next mark and lingers there as its cloud blooms.
  let breath = 0, target = null;
  if (dragon.lastDrop) {
    breath = Math.max(0, 1 - (state.time - dragon.lastDrop.at) / .30);
    if (breath > 0) target = dragon.lastDrop;
  }
  if (dragon.phase === 'breathing' || dragon.phase === 'dive') {
    const [tx, ty] = dragon.cells[0];
    const gap = (tx - dragon.x) * dir - BREATH_REACH;
    const next = Math.max(0, 1 - Math.max(0, gap) / 1.45);
    if (next > breath) {
      breath = next;
      target = { x: tx, y: ty };
    }
  }
  const endpoint = target ? { x: (target.x + .5) * tile, y: (target.y + .5) * tile } : null;
  drawDragon(ctx, {
    x, y: floorY - dragon.altitude * tile, dir, pitch: dragon.pitch,
    dive: dragon.dive, breath, time: state.time, scale,
  }, endpoint);
}
