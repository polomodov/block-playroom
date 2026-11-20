// Keep game coordinates independent of CSS size, zoom and display density.
const boards = new WeakMap();

export function configureBoard(canvas, logicalWidth, logicalHeight) {
  let board = boards.get(canvas);
  if (!board) {
    board = { ctx: canvas.getContext('2d'), cssWidth: canvas.clientWidth };
    boards.set(canvas, board);
    if (canvas.isConnected && typeof ResizeObserver !== 'undefined') {
      board.observer = new ResizeObserver(([entry]) => { board.cssWidth = entry.contentRect.width; });
      board.observer.observe(canvas);
    }
  }
  const cssWidth = board.observer ? board.cssWidth : canvas.isConnected ? canvas.clientWidth : logicalWidth;
  const density = (cssWidth || logicalWidth) * (window.devicePixelRatio || 1) / logicalWidth;
  const scale = Math.max(1, Math.min(4, density));
  const width = Math.round(logicalWidth * scale);
  const height = Math.round(logicalHeight * scale);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  board.ctx.setTransform(width / logicalWidth, 0, 0, height / logicalHeight, 0, 0);
  board.ctx.imageSmoothingEnabled = true;
  return board.ctx;
}
