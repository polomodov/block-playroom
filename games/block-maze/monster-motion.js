import { PREPARATION, BLAST_DURATION, BLAST_LIFETIME } from './monster-rules.js?v=living-worlds-1';
// These drawings share the maze's logical coordinates, one corridor cell = 20 units.
const tau = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));

function ellipse(c, x, y, rx, ry, color) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, tau);
  c.fillStyle = color;
  c.fill();
}

function stroke(c, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function gleam(c, x, y, radius, color) {
  c.beginPath();
  c.moveTo(x, y - radius);
  c.quadraticCurveTo(x + .18 * radius, y - .18 * radius, x + radius * .74, y);
  c.quadraticCurveTo(x + .18 * radius, y + .18 * radius, x, y + radius);
  c.quadraticCurveTo(x - .18 * radius, y + .18 * radius, x - radius * .74, y);
  c.quadraticCurveTo(x - .18 * radius, y - .18 * radius, x, y - radius);
  c.fillStyle = color;
  c.fill();
}

export function archerPose(monster, time) {
  if (monster.dance > 0 || monster.stun > 0) return null;
  if (monster.windup > 0 && monster.aim?.dir) {
    return { dir: monster.aim.dir, draw: clamp(1 - monster.windup / PREPARATION.skeleton), release: null };
  }
  const age = time - monster.shot?.at;
  if (age >= 0 && age < .27) return { dir: monster.shot.dir, draw: 1, release: age / .27 };
  return null;
}

function boneArm(c, sx, sy, ex, ey, hx, hy, lit) {
  c.beginPath();
  c.moveTo(sx, sy);
  c.lineTo(ex, ey);
  c.lineTo(hx, hy);
  stroke(c, '#4c5660', 2.15);
  stroke(c, lit ? '#e6e4ca' : '#acb7b1', 1.17);
  ellipse(c, ex, ey, .93, .82, '#bac6bd');
}

// Both hands terminate on the same grip and nock used by the bending bow and string.
export function drawArcherArms(c, pose) {
  const releasing = pose.release != null;
  const draw = Math.sin(Math.PI * .5 * pose.draw);
  const follow = releasing ? Math.sin(Math.PI * pose.release) : 0;
  const tension = releasing ? Math.exp(-pose.release * 18) : draw;
  const vertical = pose.dir === 'up' ? -1 : pose.dir === 'down' ? 1 : 0;
  const angle = !vertical ? -.31 * (1 - draw) : vertical * Math.PI / 2;
  const x = vertical ? 4.5 : .8, y = -9.3;
  const grip = 5.3 + draw * 3.25 - 1.6 * follow;
  const tipX = grip - 1.8 - tension * 1.55;
  const span = 6.9 - tension * .95;
  const nock = tipX - .65 - tension * 6.75 + (releasing ? Math.sin(pose.release * 24) * (1 - pose.release) * .8 : 0);
  const hand = releasing ? -.85 - follow * 2 : nock;
  // Put the weapon in cardinal space while keeping the skeleton upright.
  const toX = (a, b) => x + Math.cos(angle) * a - Math.sin(angle) * b;
  const toY = (a, b) => y + Math.sin(angle) * a + Math.cos(angle) * b;
  boneArm(c, -2.8, -11, toX(-2.5 - draw * 1.9, 2.1), toY(-2.5 - draw * 1.9, 2.1), toX(hand, 0), toY(hand, 0), false);
  boneArm(c, 2, -10.9, toX(grip * .53, 1.55), toY(grip * .53, 1.55), toX(grip, 0), toY(grip, 0), true);
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(tipX, -span);
  c.lineTo(nock, 0);
  c.lineTo(tipX, span);
  stroke(c, '#40323d', 1);
  stroke(c, '#ffecbf', .48);
  c.beginPath();
  c.moveTo(tipX, -span);
  c.bezierCurveTo(tipX + 2.4, -span + .5, grip - .2, -2.2, grip, 0);
  c.bezierCurveTo(grip + .25, 2.65, tipX + 2.2, span - .6, tipX, span);
  stroke(c, '#573a32', 2);
  stroke(c, '#db9a53', 1.2);
  stroke(c, '#ffd497', .42);
  c.fillStyle = '#725149';
  c.fillRect(grip - .7, -1.5, 1.35, 3);
  if (!releasing) {
    c.beginPath(); c.moveTo(nock - .4, 0); c.lineTo(nock + 12.25, 0);
    stroke(c, '#61413a', 1.25);
    stroke(c, '#ffcf7f', .64);
    c.beginPath(); c.moveTo(nock + 10.5, -1.55); c.lineTo(nock + 14.5, 0); c.lineTo(nock + 10.5, 1.6);
    c.closePath(); c.fillStyle = '#f5ffe4'; c.fill(); stroke(c, '#705c55', .42);
    c.beginPath(); c.moveTo(nock -.6,-1.35); c.lineTo(nock + 1,0); c.lineTo(nock -.6,1.35); stroke(c, '#f5e5cd', .72);
  }
  ellipse(c, grip, .25, 1, 1.05, '#efdfbd');
  ellipse(c, hand, .05, .93, .8, '#c3cbbf');
  c.restore();
}

export function drawFuse(c, progress) {
  const wave = Math.sin(tau * (progress * .7 + progress ** 2));
  const pulse = .5 + wave * .5;
  c.save();
  c.globalAlpha *= .45 + progress * .45;
  // A visible ember runs up the seams of the creeper's chest.
  c.beginPath();
  c.moveTo(.3, -4.3); c.lineTo(1.2, -5.9); c.lineTo(.35, -7.35); c.lineTo(1.55, -8.9);
  stroke(c, '#f2ac57', .9 + .55 * pulse);
  c.restore();
  for (let i = 0; i < 4; i++) {
    const t = (progress * 1.75 + i * .25) % 1;
    const x = -1.2 + Math.sin(i * 3.2 + t * 2.6) * (2 + 5.2 * t);
    const y = -17.7 - t * (5 + i % 2 * 1.8);
    const radius = (.45 + Math.sin(Math.PI * t)) * (.62 + progress);
    gleam(c, x, y, radius, i % 2 ? '#ffe4a0' : '#ff9655');
  }
  gleam(c, -1.15, -17.65, .95 + .9 * pulse + progress, '#fff1af');
}

export function drawArrowFlight(c, effect, unit) {
  c.save();
  c.translate((effect.x + .5) * unit, (effect.y + .5) * unit);
  c.rotate(({right: 0, left: Math.PI, up: -Math.PI / 2, down: Math.PI / 2})[effect.dir]);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-11,0); c.lineTo(-3,0); stroke(c,'rgba(255,217,132,.34)',1.75);
  c.beginPath(); c.moveTo(-5.4,0); c.lineTo(2.9,0); stroke(c,'#533e3d',1.85); stroke(c,'#ffcc75',.94);
  c.beginPath(); c.moveTo(2,-2.05); c.lineTo(6.4,0); c.lineTo(2,2.05); c.closePath();
  c.fillStyle='#fff5d1'; c.fill(); stroke(c,'#745a47',.58);
  for (const side of [-1,1]) {
    c.beginPath(); c.moveTo(-4.3,0); c.lineTo(-6.5,side*2); c.lineTo(-4.55,side*1.95); c.lineTo(-2.4,0);
    c.fillStyle='#fff0cc'; c.fill();
  }
  c.restore();
}

// The rings stay on the departure and arrival tiles, even when a wall separates them.
function rift(c, x, y, amount, time, arrival) {
  if (amount <= 0) return;
  c.save();
  c.translate(x, y);
  c.globalAlpha *= clamp(amount * 2);
  const r = 2.1 + amount * 6.5;
  c.beginPath(); c.ellipse(0, 4.1, r, r * .42, 0, 0, tau);
  c.fillStyle = '#352549a6'; c.fill(); stroke(c, '#a575e7', 1.25);
  c.beginPath(); c.ellipse(0, 4, r, r * .42, 0, .18, Math.PI * .92); stroke(c, '#f0baff', 1.08);
  // A narrow, backlit tear grows vertically inside the floor ring.
  const height = 4 + 16 * amount;
  const split = .55 + (1 + Math.sin(time * 7)) * .6 + 1.8 * amount;
  c.beginPath();
  c.moveTo(-.65, 4 - height);
  c.bezierCurveTo(.8, 4-height*.71, -split-.65, 4-height*.48, 0, 3.7);
  c.bezierCurveTo(-.6, 2.1, split+1.65, 4-height*.4, split*.68, 4-height*.66);
  c.closePath();
  c.fillStyle = arrival ? '#6a4882a8' : '#7b4596a8';
  c.fill();
  c.beginPath();
  c.moveTo(-.65,4-height);
  c.bezierCurveTo(.8,4-height*.71,-split-.65,4-height*.48,0,3.7);
  stroke(c,'#dda1fa',.85);
  for (let i=0; i<6; i++) {
    const t = (time * 1.35 + i / 6) % 1;
    const angle = t * 2.2 + i * 2.41;
    const radius = r * (.95 - .39 * t);
    const px = Math.cos(angle) * radius;
    const py = 4 + Math.sin(angle)*radius*.36 - t*(arrival ? 13 : 17);
    gleam(c, px, py, .65 + Math.sin(t*Math.PI) * 1.23, i%2 ? '#edb2ff' : '#aea5ff');
  }
  if (arrival) {
    c.beginPath();
    c.moveTo(-2, -3); c.lineTo(0, -.7); c.lineTo(2, -3);
    stroke(c, '#f1c4ff', .9);
  }
  c.restore();
}

function echo(c, x, y, age) {
  c.save(); c.translate(x, y+7.5);
  c.globalAlpha *= (1-age)**1.3 * .92;
  // A broken-up afterimage stays where the Enderman vanished.
  for (let i=0; i<5; i++) {
    const slip = Math.sin(i * 2.2) * age * 5;
    const width=[8,7.8,5.3,4.1,4.7][i];
    const h=[3.15,2.3,3.5,2.5,2.2][i];
    c.fillStyle = i<2 ? '#51375e' : '#81599c';
    c.fillRect(slip-width/2, -18+i*3.6-age*2, width, h);
    c.fillStyle = '#d19aef'; c.fillRect(slip-width/2, -18+i*3.6-age*2, width,.54);
  }
  c.fillStyle='#ffd6ff'; c.fillRect(-2.6,-14.5-age,1.9,.83);c.fillRect(1,-14.5-age,1.9,.83);
  c.restore();
}

export function phaseShift(monster, time) {
  if (monster.stun > 0 || monster.dance > 0) return 0;
  if (monster.windup > 0 && monster.aim) {
    const t = clamp(1 - monster.windup / PREPARATION.enderman);
    return t * t;
  }
  const age = time - monster.teleport?.at;
  return age >= 0 && age < .27 ? (1 - age / .27) ** 2 : 0;
}

export function drawTeleport(c, monster, time, unit) {
  const middle = value => (value + .5) * unit;
  if (monster.windup > 0 && monster.aim && !monster.dance && !monster.stun) {
    const progress = clamp(1 - monster.windup / PREPARATION.enderman);
    rift(c, middle(monster.x), middle(monster.y), .34 + .66 * progress, time, false);
    rift(c, middle(monster.aim.x), middle(monster.aim.y), .42 + .58 * progress, time, true);
  }
  const jump = monster.teleport;
  if (!jump) return;
  const age = (time-jump.at) / .46;
  if (age < 0 || age >= 1) return;
  rift(c, middle(jump.x), middle(jump.y), 1-age, time, false);
  echo(c, middle(jump.x), middle(jump.y), age);
  rift(c, middle(jump.toX), middle(jump.toY), 1-age, time, true);
}

export function drawBlast(c, effect, time, unit) {
  const age = time-effect.at;
  if (age < 0 || age >= BLAST_LIFETIME) return;
  const t = clamp(age / BLAST_DURATION);
  c.save();
  // Restrict debris, light and smoke to the actual hit area, including cells behind corners.
  c.beginPath();
  for (const [x,y] of effect.cells) c.rect(x*unit, y*unit, unit, unit);
  c.clip();
  c.translate((effect.x+.5)*unit,(effect.y+.5)*unit);
  const radius = 4 + (1-(1-t)**2)*25;
  if (t < 1) {
    const glow = c.createRadialGradient(0,0,.2,0,0,radius);
    glow.addColorStop(0,'rgba(255,238,167,'+(.92*(1-t))+')');
    glow.addColorStop(.4,'rgba(255,164,72,'+(.79*(1-t))+')');
    glow.addColorStop(1,'rgba(255,98,49,0)');
    c.fillStyle=glow; c.fillRect(-radius,-radius,radius*2,radius*2);
    c.save();
    c.globalAlpha *= 1-t;
    c.beginPath(); c.ellipse(0,0,radius,.79*radius,0,0,tau);
    stroke(c,'#e57746',2.8); stroke(c,'#ffe1a0',1.12);
    gleam(c,0,0,8*(1-t),'#fff1ac');
    c.restore();
  }
  const smokeAge = age / BLAST_LIFETIME;
  c.globalAlpha *= (1 - smokeAge) ** 1.3;
  for(let i=0;i<9;i++){
    const a=i*tau/9+.24, dist=radius*(.47+.12*(i%3));
    const x=Math.cos(a)*dist, y=Math.sin(a)*dist*.84 - smokeAge*6.1;
    const puff=(1.75+(i%3)*.7)*(.6+smokeAge*1.8);
    ellipse(c,x,y,puff*1.18,puff*.83,i%2?'#937379':'#ad8e81');
    ellipse(c,x-.52*puff,y-.39*puff,puff*.76,puff*.61,i%2?'#c4a393':'#d7b694');
    if (t < .82) {
      c.beginPath();
      c.moveTo(Math.cos(a)*radius*.46, Math.sin(a)*radius*.42);
      c.lineTo(Math.cos(a)*radius*.89, Math.sin(a)*radius*.8);
      stroke(c,'#ffe0a2',.6+(1-t)*.65);
    }
    gleam(c,Math.cos(a)*radius*.84,Math.sin(a)*radius*.74,1.7-t,'#fff0b4');
  }
  c.restore();
}
