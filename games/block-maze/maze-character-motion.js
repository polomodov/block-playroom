import { PREPARATION } from './monster-rules.js?v=living-worlds-1';

const clamp = value => Math.max(0, Math.min(1, value));
const paths = new Map();

function paint(c, outline, fill, rim, width = .65) {
  let path = paths.get(outline);
  if (!path) {
    path = new Path2D(outline);
    paths.set(outline, path);
  }
  if (fill) { c.fillStyle = fill; c.fill(path); }
  if (rim) { c.lineWidth = width; c.strokeStyle = rim; c.stroke(path); }
}

function orb(c, x, y, rx, ry, ink) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = ink; c.fill();
}

export function preparation(monster) {
  return monster.windup > 0 && !monster.stun && !monster.dance
    ? clamp(1 - monster.windup / PREPARATION[monster.type]) : 0;
}

export function castAge(monster, time) {
  return monster.cast && !monster.stun && !monster.dance ? time - monster.cast.at : Infinity;
}

function arm(c, x, y, ex, ey, hx, hy, color) {
  c.beginPath(); c.moveTo(x,y); c.lineTo(ex,ey); c.lineTo(hx,hy);
  c.strokeStyle = '#383444'; c.lineWidth = 2.75; c.stroke();
  c.strokeStyle = color; c.lineWidth = 1.6; c.stroke();
}

export function drawLantern(c, monster, time, stride) {
  const lift = preparation(monster);
  const swing = Math.sin(Math.min(1, castAge(monster,time) / .48) * Math.PI);
  const x = 5.6 + swing * 2.5, y = -6 - lift * 5.5 - swing * 3.1;
  arm(c, 1.6, -10.8, 3.8, -8.6-lift*2, x,y,'#a98855');
  c.save(); c.translate(x,y); c.rotate(stride*.10 - lift*.14 + swing*.28);
  paint(c,'M-1 1.7V.6Q0 -1.7 1.1 .65V1.8',null,'#ead1a0',.66);
  paint(c,'M-2.3 1.9L1.8 1.7 2.3 2.6 1.65 6 -1.75 6.2 -2.35 2.9Z','#ffbb54','#614134');
  const flame = 1 + lift + .25*Math.sin(time*9);
  orb(c,0,4.2,1.05,flame,'#fff4b2');
  paint(c,'M-2.35 2.3L2.35 2.1M-1.7 6.15L1.9 6M1.18 2.45L.95 5.95',null,'#6f5342',.52);
  c.restore();
}

export function drawFlask(c, monster, time, stride) {
  const age = castAge(monster,time);
  const pour = age < .66 ? Math.sin(Math.PI * Math.min(1,(age + .14)/.8)) : 0;
  const x = 5.1 + pour * 2.1, y = -7.4 - pour*2 + stride*.48;
  arm(c,1.85,-10.8,3.6,-7.5,x,y,'#9d789b');
  c.save(); c.translate(x,y); c.rotate(.13 + stride*.13 + pour*1.8);
  paint(c,'M-.95 -2.8H.95V-.5Q4 1.4 2.6 3.9Q.1 5.55 -2.45 4Q-4 1.8 -.95 -.5Z','#bbf4e6','#42364f',.7);
  paint(c,'M-2.55 2.1Q-.5 1.45 2.55 2.1Q3.2 4.7 .05 4.45Q-3.1 4.7 -2.55 2.1Z','#aa59bb');
  orb(c,-1.4,2.2,.51,.68,'#ffccfa');
  paint(c,'M-1.15 -2.7H1.2',null,'#feebbf',.7);
  if (age < .42) {
    const drop = 2.3 + 3.8 * age/.42;
    orb(c,0,-drop,.65,.88,'#e7a3f4');
  }
  c.restore();
}

export function drawSword(c, monster, time, stride) {
  const lift = preparation(monster), age = castAge(monster,time);
  const dir = monster.aim?.dir ?? monster.cast?.dir;
  const target = dir === 'up' ? -1.35 : dir === 'down' ? 1.18 : -.13;
  let angle = -1.04 - lift*.96 + stride*.11;
  if (age < .44) {
    const arc = clamp(age/.15), returnToRest = clamp((age-.15)/.29);
    angle = (-2 + (2+target)*arc) * (1-returnToRest) - returnToRest;
  }
  const gripX = 4.4 + (age<.44 ? Math.sin(Math.PI*age/.44)*1.45 : 0);
  const gripY = -7.35 - lift*4;
  arm(c,1.7,-11.1,3.1,-8.1-lift*1.3,gripX,gripY,'#798496');
  c.save();c.translate(gripX,gripY);c.rotate(angle);
  paint(c,'M-2 -.5H1.5V.7H-2Z','#aa8162','#463b45',.5);
  paint(c,'M1.2 -1.8L1.85 -1.5 1.85 1.7 1.1 1.9Z','#ecc687','#5a4d51',.5);
  paint(c,'M1.9 -.75L7.85 -.85 9.35 0 7.8 1.05 1.9 .7Z','#adb7c8','#48455c',.65);
  paint(c,'M2.1 -.53L7.85 -.6 8.95 -.05',null,'#e4e7e4',.43);
  c.restore();
}

export function drawShulker(c, monster, time, rhythm) {
  const dance = monster.dance > 0;
  const t = preparation(monster), age = castAge(monster,time);
  const hinge = dance ? .52 + .38*Math.sin(rhythm * Math.PI*4)
    : t ? t*t*(3-2*t)
    : age < .42 ? 1-clamp(age/.42) : .06;
  paint(c,'M-6.4 -5.4L-3.8 -6.7 6.25 -6 6.45 -.8 3.8 .7 -5.1 .1Z','#885980','#48354f',.8);
  paint(c,'M-5.2 -3.9L3.75 -3.3 6.1 -4.35V-.9L3.8 .35 -5 .05Z','#a7789b');
  const gaze = monster.aim?.dir;
  c.save();c.translate(0,-hinge*2.2);
  paint(c,'M-3.5 -7.75L2.9 -8.3 4.1 -7.5 3.9 -4.7 -3.5 -4.8Z','#e7cf9d','#605063',.48);
  const pupil = gaze === 'left' ? -.65 : gaze === 'right' ? .65 : 0;
  c.fillStyle='#594752';c.fillRect(-2.15+pupil,-6.8,.85,1.29);c.fillRect(1.65+pupil,-6.8,.85,1.29);c.restore();
  c.save(); c.translate(0,-hinge*4.8); c.rotate(dance ? Math.cos(rhythm*Math.PI*2)*.16 : -hinge*.10);
  paint(c,'M-6.2 -5.3L-6.55 -10 -3.8 -11.9 5.5 -11.2 6.35 -9.7 6.3 -5.75 3.9 -4.6Z','#bd8daa','#503951',.77);
  paint(c,'M-6.1 -9.8L-3.6 -11.5 5.22 -10.92 3.6 -9.4Z','#e2b8ca');
  paint(c,'M3.75 -9.1L6.08 -10 5.95 -5.95 3.8 -5.1Z','#8c6082');
  paint(c,'M-4.5 -8.7L-2.2 -8.4 -2.2 -7.3 .5 -7M-1.6 -5.8L1.85 -5.6',null,'#e5aec4',.6);
  c.restore();
}
