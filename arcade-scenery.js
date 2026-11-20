// Use the playable maze's material painters and transparent landmark sheet.
// Terrain swatches are drawn once; animated games can reuse them every frame.
import { tileFinish } from './games/block-maze/maze-materials.js';
import { waterparkTile } from './games/block-maze/waterpark-art.js';
import { storeTile } from './games/block-maze/store-art.js';
import { netherTile } from './games/block-maze/nether-art.js';
import { endTile } from './games/block-maze/end-art.js';

const landmarkCells = {
  stone_mask: 0,
  carousel: 1,
  typhoon: 2,
  living_room: 3,
  lavafall: 4,
  gatehouse: 5,
  crystal_spires: 6,
  cauldron: 7,
  brazier: 8,
  slide: 9,
  claw: 10,
  water_slide: 11,
  wave_pool: 12,
  show_kitchen: 13,
  warehouse: 14,
  basalt_columns: 15,
  crimson_fungi: 16,
  pumpkin_patch: 17,
  exit_portal: 18,
  chorus_grove: 19,
};
let atlas;
export function landmarkAtlas() {
  if (!atlas) {
    atlas = new Image();
    atlas.src = new URL('./games/block-maze/assets/maze-landmarks.webp', import.meta.url);
  }
  return atlas;
}

export function drawLandmark(g, name, x, y, width, height = (width * 2) / 3) {
  const sheet = landmarkAtlas();
  if (!sheet.naturalWidth || !Object.hasOwn(landmarkCells, name)) return false;
  const idx = landmarkCells[name],
    w = sheet.naturalWidth / 4,
    h = sheet.naturalHeight / 5;
  g.drawImage(sheet, (idx % 4) * w, Math.floor(idx / 4) * h, w, h, x, y, width, height);
  return true;
}

const swatches = new Map();
const painters = { waterpark: waterparkTile, store: storeTile, nether: netherTile, end: endTile };
export function material(world, symbol = '.') {
  const key = world + symbol;
  if (!swatches.has(key)) {
    const canvas = document.createElement('canvas');
    const side = 20;
    canvas.width = canvas.height = 3 * side;
    const ctx = canvas.getContext('2d');
    const map = new Array(5).fill(symbol.repeat(5));
    ctx.translate(-side, -side);
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 3; x++) {
        const seed = x * 37 + y * 13;
        painters[world]?.(ctx, map, x, y, side, seed);
        tileFinish(ctx, world, map, x, y, side, seed);
      }
    }
    swatches.set(key, canvas);
  }
  return swatches.get(key);
}

// CSS sprites use percentages relative to the remaining space around one atlas cell.
export function landmarkPosition(name) {
  const cell = landmarkCells[name];
  return ((cell % 4) * 100) / 3 + '% ' + Math.floor(cell / 4) * 25 + '%';
}
