import { drawGem, tileFinish } from './block-maze/maze-materials.js';

const worlds = ['temple', 'arcade', 'waterpark', 'store', 'nether', 'castle', 'end'];
const family = ['kirill', 'maxim', 'mom', 'dad', 'pasha'];
const images = new Map();
function illustration(file) {
  if (!images.has(file)) {
    const image = new Image();
    image.src = new URL(file, import.meta.url);
    images.set(file, image);
  }
  return images.get(file);
}

// The original 150 × 250 front figures. The collar and jacket patterns move with
// the platformer's existing skeleton so its hands can still strum, punch and wave.
const patterns = {
  kirill: { top: 33, neck: 122, waist: 187, center: 81, shoulder: 28, hip: 27 },
  maxim:  { top: 11, neck: 96,  waist: 180, center: 75, shoulder: 35, hip: 40 },
  mom:    { top: 13, neck: 99,  waist: 188, center: 72, shoulder: 32, hip: 34 },
  dad:    { top: 11, neck: 98,  waist: 180, center: 68, shoulder: 36, hip: 32 },
  pasha:  { top: 6,  neck: 92,  waist: 191, center: 58, shoulder: 38, hip: 37 },
};
const figures = './block-maze/assets/maze-figures.webp';
const landmarks = './block-maze/assets/maze-landmarks.webp';

export function paintedPart(c, id, part) {
  const img = illustration(figures);
  if (!img.naturalWidth) return false;
  const p = patterns[id], col = family.indexOf(id), sx = col * 150;
  c.save();
  if (part === 'face') {
    // Remove shoulder pixels that sit level with the chin in the standing pose.
    c.beginPath();
    c.moveTo(-6, -27); c.lineTo(6, -27); c.lineTo(6, -20);
    c.lineTo(3, -17.3); c.lineTo(2.1, -15.7); c.lineTo(-2.1, -15.7);
    c.lineTo(-3, -17.3); c.lineTo(-5, -19.5); c.closePath(); c.clip();
    const h = p.neck - p.top, scale = 10.5 / h;
    c.drawImage(img, sx, p.top, 150, h, -p.center * scale, -26.2, 150 * scale, h * scale);
  } else {
    const h = p.waist - p.neck, scale = 8.1 / h;
    const shoulder = p.shoulder * scale, hip = p.hip * scale;
    c.beginPath();
    c.moveTo(-shoulder * .65, -16);
    c.lineTo(shoulder * .76, -16);
    c.lineTo(shoulder, -14.3);
    c.lineTo(hip, -7.9);
    c.lineTo(-hip, -7.9);
    c.lineTo(-shoulder, -14.3);
    c.closePath();
    c.clip();
    c.drawImage(img, sx, p.neck, 150, h, -p.center * scale, -16, 150 * scale, 8.1);
  }
  c.restore();
  return true;
}

// Hip, knee, sole and shoulder, elbow, palm in each front-facing atlas cell.
// Widths trim each painted limb away from the neighbouring jacket and trousers.
const limbs = {
  kirill: { leg: [[63,184],[60,211],[60,245]], arm: [[55,124],[45,151],[47,196]], legWidth: 15, armWidth: 12 },
  maxim:  { leg: [[53,178],[50,210],[52,245]], arm: [[41,92],[25,129],[30,189]], legWidth: 18, armWidth: 14 },
  mom:    { leg: [[51,184],[49,212],[49,245]], arm: [[47,103],[33,143],[28,195]], legWidth: 15, armWidth: 12 },
  dad:    { leg: [[55,176],[52,207],[53,245]], arm: [[40,101],[27,136],[25,190]], legWidth: 14, armWidth: 12 },
  pasha:  { leg: [[38,189],[37,214],[36,245]], arm: [[30,89],[18,129],[18,189]], legWidth: 15, armWidth: 13 },
};
export function paintedLimb(c, id, part, front, startX, startY, jointX, jointY, endX, endY) {
  const img = illustration(figures);
  if (!img.naturalWidth) return false;
  const rig = limbs[id], source = rig[part], width = rig[part + 'Width'], col = family.indexOf(id);
  const points = [[startX, startY], [jointX, jointY], [endX, endY]];
  for (let i = 0; i < 2; i++) {
    const [ax, ay] = source[i], [bx, by] = source[i + 1];
    const [x, y] = points[i], [tx, ty] = points[i + 1];
    const length = Math.hypot(tx-x, ty-y), srcLength = Math.hypot(bx-ax, by-ay);
    const halfWidth = width * (part === 'leg' ? .103 : .10) * (front ? 1 : .9);
    c.save();
    c.translate(x, y);
    c.rotate(Math.atan2(ty-y,tx-x)-Math.PI/2);
    c.scale(halfWidth/width, (length+.16)/srcLength);
    c.beginPath(); c.rect(-width,-1,width*2,srcLength+2); c.clip();
    c.rotate(Math.PI/2-Math.atan2(by-ay,bx-ax));
    c.drawImage(img, col*150, 0, 150, 250, -ax, -ay, 150, 250);
    c.restore();
  }
  return true;
}

const decorations = [[0, 8], [1, 10], [2, 11], [3, 14], [4, 16], [5, 17], [6, 19]];
export function jumpScenery(c, level, camera) {
  const img = illustration(landmarks);
  if (!img.naturalWidth) return;
  const row = worlds.indexOf(level.id);
  c.save();
  c.globalAlpha = .73;
  for (let i = 0; i < level.platforms.length; i += 2) {
    const bank = level.platforms[i];
    if (bank.kind !== 'ground' || bank.w < 110) continue;
    const width = 66 + i % 3 * 8, x = bank.x + bank.w * .55 - camera;
    if (x + width < 0 || x > 480) continue;
    const cell = decorations[row][(i / 2) % 2];
    c.drawImage(img, (cell % 4) * 360 + 2, Math.floor(cell / 4) * 240 + 2, 356, 236,
      x, bank.y - width * 2 / 3 + 2, width, width * 2 / 3);
  }
  c.restore();
}

export function stonePaving(c, row, index) {
  c.save();
  c.scale(192 / 24, 128 / 24);
  c.globalAlpha = .76;
  tileFinish(c, worlds[row], ['.'], 0, 0, 24, (index + 1) * 37);
  c.restore();
}

export function platformGem(c, x, y, time) {
  c.save();
  c.translate(x, y + Math.sin(time * 3 + x) * 1.15);
  c.scale(1.08 + Math.cos(time * 2.8 + x) * .18, 1.25);
  drawGem(c, 0, 0, Math.sin(time * 4 + x) > .75);
  c.restore();
}

export function trackGem(c, p, s, o) {
  const u = p.unit * .13, turn = s.time * 3.6 + o.id * 1.36;
  c.save();
  c.translate(p.x, p.y - u * (1.95 + .16 * Math.sin(turn)));
  c.scale(u * (.18 + .04 * Math.cos(turn)), u * .22);
  drawGem(c, 0, 0, Math.cos(turn) > .6);
  c.restore();
}

// Draw a still from the chosen world. The foreground stays on the right of the
// title both on a phone and on a wide screen, without cropping the selected hero.
export function watchClassicCover({ floor, view, road, themes }) {
  const banner = document.querySelector('.cover, .banner');
  const canvas = document.createElement('canvas');
  canvas.className = 'classic-arcade-cover';
  canvas.setAttribute('aria-hidden', 'true');
  banner.prepend(canvas);
  const c = canvas.getContext('2d');
  const jump = Boolean(floor);
  const panorama = ['./block-maze/assets/world-panoramas.webp', './block-maze/assets/realm-panoramas.webp'].map(illustration);
  const poses = jump ? illustration(figures) : illustration('./block-dash/assets/runner-jump.webp');
  function render() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    c.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    const level = document.querySelector('input[name="level"]:checked').value;
    const heroId = document.querySelector('input[name="hero"]:checked').value;
    const row = worlds.indexOf(level), sky = panorama[row < 4 ? 0 : 1];
    if (!sky.naturalWidth || !poses.naturalWidth) return;
    const frameH = sky.naturalHeight / (row < 4 ? 4 : 3);
    const scale = Math.max(w / sky.naturalWidth, h / frameH);
    const frameW = w / scale, cropH = h / scale;
    c.drawImage(sky, (sky.naturalWidth - frameW) * .64, (row % 4) * frameH + (frameH - cropH) * .5,
      frameW, cropH, 0, 0, w, h);
    const x = w * (w < 630 ? .77 : .72), size = Math.min(h * .68, w * .43);
    if (jump) {
      const ledges = floor({id: level, width: 185, platforms: [
        {x: 0, y: 1, w: 69, h: 30, kind: 'ground'}, {x: 86, y: 6, w: 99, h: 28, kind: 'ground'}
      ]}, 34);
      const k = size / 37, landing = h * .89;
      c.drawImage(ledges, x - 54*k, landing-k, 185*k, 34*k);
      const sx = family.indexOf(heroId) * 150;
      const heroHeight = size * 1.14, heroWidth = heroHeight * .6;
      c.fillStyle = '#15282368'; c.beginPath();
      c.ellipse(x, landing + 1, heroWidth * .36, heroHeight * .027, 0, 0, Math.PI * 2); c.fill();
      c.drawImage(poses, sx, 0, 150, 250, x - heroWidth*.5, landing-heroHeight, heroWidth, heroHeight);
    } else {
      const scene = { distance: 7, player: {x: 0} }, camera = view(h * 2, h, scene);
      c.save();
      c.translate(x - h, h * .54); c.scale(1, .48);
      road(c, camera, scene, themes[level]);
      c.restore();
      const ix = family.indexOf(heroId), sw = poses.naturalWidth / 12, sh = poses.naturalHeight / 12;
      c.drawImage(poses, sw * 7, ix * 2 * sh, sw, sh, x - size * sw / sh * .49, h * .83 - size, size * sw / sh, size);
    }
    const gemSize = Math.min(h * .010, w * .0064);
    c.save(); c.translate(x + size * .57, h * (jump ? .34 : .58)); c.scale(gemSize, gemSize);
    drawGem(c, 0, 0, true); c.restore();
  }
  for (const image of [...panorama, poses]) image.addEventListener('load', render, { once: true });
  document.querySelector('#lobby').addEventListener('change', render);
  new ResizeObserver(render).observe(banner);
  render();
}
