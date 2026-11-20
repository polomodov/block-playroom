// The temple carvings share a stepped bevel and a pale, north-west light source.
function block(ctx, x, y, width, height, face, light, shade) {
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = light;
  ctx.fillRect(x, y, width - 1, height - 2);
  ctx.fillStyle = face;
  ctx.fillRect(x + 1, y + 1, width - 2, height - 3);
}

function stoneMask(ctx) {
  const deep = '#304540', mid = '#72876e', bright = '#a6b38a';
  block(ctx, -24, -23, 48, 46, '#455f56', '#7c937a', deep);
  block(ctx, -19, -21, 38, 42, '#647c6b', '#92a484', deep);
  block(ctx, -16, -15, 32, 32, mid, bright, deep);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    block(ctx, 1, -18, 14, 5, '#89a186', '#bdc298', '#496455');
    block(ctx, 2, -11, 12, 5, '#98aa81', '#c4ca9a', '#516953');
    block(ctx, 5, -7, 8, 5, '#254842', '#496d58', deep);
    ctx.fillStyle = '#dfb869';
    ctx.fillRect(6, -6, 5, 2);
    ctx.fillStyle = '#ffdf9d';
    ctx.fillRect(6, -6, 2, 1);
    block(ctx, 10, 0, 5, 7, '#879778', bright, '#4b6658');
    block(ctx, 16, -9, 6, 16, '#647b6a', '#9aa98a', deep);
    block(ctx, 18, 4, 6, 6, '#ad955c', '#dcc48a', '#756a4b');
    block(ctx, 7, 10, 3, 6, '#b6b598', '#d1cba0', '#6c7e65');
    ctx.restore();
  }
  block(ctx, -3, -9, 6, 14, '#84967a', '#b7c095', '#4c6b5b');
  block(ctx, -6, 4, 12, 5, '#7d957a', '#abbb8f', deep);
  block(ctx, -7, 11, 14, 3, deep, '#486352', deep);
  block(ctx, -5, 16, 10, 3, mid, bright, deep);
  // Lichen grows into the plinth joints, away from the eyes.
  for (const [x, y, w] of [[-24,-21,9],[-23,-19,5],[12,17,8],[14,19,7]]) {
    ctx.fillStyle = '#789550';
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = '#a5ae68';
    ctx.fillRect(x + 1, y, 3, 1);
  }
}

export function drawTempleFixture(ctx, fixture, tile) {
  ctx.save();
  ctx.translate((fixture.x + fixture.width / 2) * tile, (fixture.y + fixture.height / 2) * tile);
  if (fixture.type === 'stone_mask') {
    stoneMask(ctx);
  } else {
    // Bronze bowl and its two low carved wings sit within the stone ledge.
    block(ctx, -17, 4, 34, 4, '#746e54', '#ae9e76', '#364f47');
    block(ctx, -8, 2, 16, 5, '#8d7351', '#d3ac74', '#4c5546');
    block(ctx, -10, -2, 20, 5, '#a3754a', '#d09c63', '#604e3d');
    block(ctx, -12, -3, 24, 3, '#c0915d', '#e0b67a', '#7a6045');
  }
  ctx.restore();
}

export function templeFlames(ctx, fixture, tile, time) {
  if (fixture.type !== 'brazier') return;
  const x = (fixture.x + fixture.width / 2) * tile;
  const y = (fixture.y + fixture.height / 2) * tile - 4;
  const frame = (Math.floor(time * 6) + fixture.x) % 4;
  const tips = [[5, 7, 4], [3, 8, 5], [5, 6, 6], [6, 7, 3]][frame];
  for (let i = 0; i < tips.length; i++) {
    ctx.fillStyle = '#d26841';
    ctx.fillRect(x - 7 + 5*i, y - tips[i], 5, tips[i] + 1);
    ctx.fillStyle = '#ffb560';
    ctx.fillRect(x - 6 + 5*i, y - tips[i] + 2, 3, tips[i] - 1);
  }
  ctx.fillStyle = '#ffe7a5';
  ctx.fillRect(x - 3, y - 3, 6, 4);
  ctx.fillRect(x - 1, y - 4, 2, 2);
}
