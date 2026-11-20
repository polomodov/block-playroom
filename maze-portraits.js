// Render the same faceted creatures as the maze in guest lists and character cards.
import { drawMazeMonster } from './games/block-maze/maze-monsters.js';

export function monsterPortrait(type, cssClass = '') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  canvas.className = cssClass;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  ctx.translate(48, 56);
  ctx.scale(3.8, 3.8);
  drawMazeMonster(ctx, { type, dir: 'right' }, 0, 0);
  return canvas;
}
