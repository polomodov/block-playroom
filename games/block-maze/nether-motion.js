import { PREPARATION } from './monster-rules.js?v=living-worlds-1';

const tau = 2 * Math.PI;
const clamp = t => Math.max(0, Math.min(1, t));
const direction = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

function oval(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, tau);
  c.fill();
}

function edge(c, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function facet(c, points, color) {
  c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i+1]);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

// A beveled block centred on the character's axis; the left cheek catches reflected lava light.
function block(c, width, y, height, bevel, face, top, side) {
  const left = -width / 2 + .6, right = left + width, rise = bevel * .58;
  c.fillStyle = face;
  c.fillRect(left, y, width, height);
  facet(c,[left,y,left-bevel,y-rise,right-bevel,y-rise,right,y],top);
  facet(c,[left-bevel,y-rise,left,y,left,y+height,left-bevel,y+height-rise],side);
}

function glow(c, x, y, size, core, halo) {
  const g = c.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, core); g.addColorStop(.43, halo); g.addColorStop(1, 'rgba(255,129,48,0)');
  c.fillStyle = g;
  c.fillRect(x-size, y-size, size*2, size*2);
}

function ember(c, x, y, r, color) {
  facet(c,[x,y-r*1.45,x+r*.68,y,x,y+r*1.45,x-r*.68,y],color);
}

// The same rotating hot core leaves the mouth and becomes the projectile.
function moltenCore(c, x, y, size, time) {
  c.save(); c.translate(x, y); c.scale(size, size);
  const tremble = 1 + Math.sin(time * 16) * .04;
  glow(c, 0, 0, tremble * 2.55, 'rgba(255,242,131,.9)', 'rgba(255,121,40,.33)');
  oval(c,0,0,tremble,1,'#873b3a');
  oval(c,-.045,-.06,.92,.88,'#ff8737');
  oval(c,.035,-.06,.68,.66,'#ffd359');
  c.rotate(time * 3.4);
  c.beginPath(); c.arc(-.035,-.015,.73,.26,2.36); edge(c,'#ffb733',.17);
  c.beginPath(); c.arc(0,0,.62,3.25,5.32); edge(c,'#fff5aa',.17);
  oval(c,.01,-.02,.35,.4,'#fff9d4');
  c.restore();
}

export function drawGhastShots(c, state, unit) {
  for (const shot of state.effects) {
    if (shot.type !== 'fireball') continue;
    const [dx, dy] = direction[shot.dir];
    const x = (shot.x + .5) * unit, y = (shot.y + .5) * unit;
    const t = state.time;
    c.save(); c.translate(x, y); c.rotate(Math.atan2(dy, dx));
    const length = 9.6 + Math.sin(t * 17) * 1.55;
    const plume = c.createLinearGradient(-length,0,-.5,0);
    plume.addColorStop(0,'rgba(226,75,54,0)'); plume.addColorStop(.52,'#e06234'); plume.addColorStop(1,'#ffba4e');
    c.fillStyle = plume;
    c.beginPath(); c.moveTo(-length,-1.9);
    c.quadraticCurveTo(-5.8,-.38,-.4,-2.85); c.quadraticCurveTo(2,0,-.5,2.9);
    c.quadraticCurveTo(-6,.8,-length+1.1,2.1); c.quadraticCurveTo(-5.8,.15,-length,-1.9); c.fill();
    for (let i=0;i<3;i++) {
      const p = (t*2.6 + i/3)%1;
      ember(c,-5.6-6*p,Math.sin(i*2.7+t*4)*2.3,(1-p)*.95,'#ffce6f');
    }
    moltenCore(c,0,0,3.5,t);
    c.restore();
  }
}

function ghast(c, monster, time, songAge) {
  const dancing = monster.dance > 0, still = monster.stun > 0;
  const t = still ? 0 : time;
  const charging = monster.windup > 0 && monster.aim && !dancing && !still;
  const p = charging ? clamp(1-monster.windup/PREPARATION.ghast) : 0;
  const age = time - monster.shot?.at;
  const exhaling = age >= 0 && age < .29 && !dancing && !still;
  const recoil = exhaling ? Math.sin(Math.PI * age/.29) * (1-age/.29) : 0;
  const facing = charging ? monster.aim.dir : exhaling ? monster.shot.dir : monster.dir;
  const [dx, dy] = direction[facing] || [0,0];
  const breath = Math.sin(t*2.7) * .025;
  // The breath settles to tile centre by release, exactly where the projectile starts.
  const hover = dancing || still ? 0 : (1.55 + Math.sin(t*3.05)*.95) * (1-p) * (1-p);
  c.save();
  c.translate(-dx*recoil*3.6, 7.5-hover-dy*recoil*3.6);
  c.scale(1+breath+p*.19-recoil*.1, 1-breath+p*.04+recoil*.07);
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i=0;i<6;i++) {
    const root = -6.2+i*2.16, side = root/5.8;
    const sway = dancing ? Math.sin(songAge*tau+i*.81)*2.35 : Math.sin(t*3.3+i*1.54)*1.28;
    const tipX = root + sway + side * (p*3.75-recoil);
    const tipY = 1.25-(i%3)*.84-p*(1.3+Math.abs(side)*3)+recoil;
    c.beginPath(); c.moveTo(root,-5.3);
    c.bezierCurveTo(root+side*.3,-2.2,tipX-sway*.65,tipY+1.2,tipX,tipY);
    edge(c,'#756573',1.9); edge(c,i%2?'#d8c4bb':'#c3aeb0',1.06);
  }
  block(c,13.15,-16.2,11.65,2.08,'#eddbcd','#fff2d9','#b99da5');
  c.fillStyle = '#d0b7b2'; c.fillRect(-4.9,-15.6,2.8,.58); c.fillRect(4.3,-8.5,1.8,.58);
  c.fillStyle = '#fff1da'; c.fillRect(2.8,-15.6,2.4,.52);
  const faceX = dx * (charging || exhaling ? 1.08 : .35);
  c.save(); c.translate(faceX,-dy*.23);
  const open = .21 + p*.91 + recoil*.82;
  for (const side of [-1,1]) {
    const x = side*3.1 + .2;
    c.beginPath(); c.moveTo(x-side*1.2,-11.72); c.lineTo(x+side*1.12,-12.04-p*.38);
    edge(c,'#755f69',1.1);
    if (p+recoil>.08) {
      oval(c,x,-11.39,1.06,.32+.6*(p+recoil),'#983c31');
      oval(c,x+.1,-11.55,.55,.24+p*.31,'#ffb158');
    }
    c.fillStyle='#b99d9f'; c.fillRect(x-.64,-10.72,.67,1.6);
  }
  oval(c,.15,-7.3,1.4+1.85*open,.7+1.8*open,'#a78385');
  oval(c,.15,-7.49,1.13+1.74*open,.54+1.57*open,'#482c39');
  if (p>.04 || recoil>.09) oval(c,.2,-6.79,1.05+1.28*open,.32+.4*open,'#ea8046');
  c.restore(); c.restore();
  if (charging) {
    // Embers spiral inward as the cube inhales. Their origin stays local to the face.
    const mx = dx*.88 * (1-p), my = -hover + (.2-p*.2);
    c.save();
    for (let i=0;i<6;i++) {
      const life=(p*2.05+i/6)%1, a=i*tau/6+life*.67;
      const radius=3.65+(1-life)*(6+p*1.9);
      c.globalAlpha = Math.sin(Math.PI*life)*(.48+p*.48);
      ember(c,mx+Math.cos(a)*radius,my+Math.sin(a)*radius,.4+life*.64,i%2?'#ffd66e':'#ff9c55');
    }
    c.restore();
    moltenCore(c,mx,my,.48+3.04*(p*p*(3-2*p)),time);
  }
}

const basalt = [
  ['#623941','#86594f','#422c40'],
  ['#774043','#9a5649','#4f3040'],
  ['#704044','#91564d','#4b3141'],
];

function magma(c, monster, time, songAge) {
  const dancing = monster.dance > 0;
  const warmup = monster.windup > 0 && !dancing && !(monster.stun > 0)
    ? clamp(1-monster.windup/PREPARATION.magma_cube) : 0;
  const arc = monster.leap ? Math.sin(monster.leap.progress * Math.PI) : 0;
  const stretch = monster.leap ? Math.sin(Math.PI*clamp(monster.leap.progress/.34)) : 0;
  const age = time - monster.landing?.at;
  const impact = age >= 0 && age < .32 && !dancing ? Math.sin(Math.PI*(1-age/.32)**2) * (1-age/.32) : 0;
  const dance = dancing ? Math.cos(songAge*tau) : 0;
  const idle = monster.stun > 0 ? 0 : (.5 + .5*Math.sin(time*3.1))*.045;
  const compression = warmup * warmup*(3-2*warmup);
  c.save(); c.translate(0,7.1);
  c.rotate(dance*.14 + (monster.leap ? Math.sign(monster.leap.to[0]-monster.leap.from[0])*arc*.115 : 0));
  c.scale(1+compression*.27+impact*.28-stretch*.13+Math.abs(dance)*.08,
          1-compression*.46-impact*.32+stretch*.14-Math.abs(dance)*.11-idle);
  const gap = (1-compression)*(.84 + arc*2.1 + Math.abs(dance)*1.1);
  for (let i=0;i<3;i++) {
    const y = -3.2-i*(3.48+gap);
    if (i>0) {
      c.fillStyle='#b94b32'; c.fillRect(-5.35,y+2.8,11.02,gap+.97);
      c.fillStyle='#ffab43'; c.fillRect(-4.58,y+3.0,9.65,gap+.35);
      c.fillStyle='#ffe479'; c.fillRect(-2.5,y+3.1,5.55,Math.min(.86,gap+.17));
    }
    const [face, top, side] = basalt[i];
    block(c,12.45-i*.18,y,3.12,1.8,face,top,side);
    c.fillStyle='#d0774b'; c.fillRect(-3+i*1.55,y+.33,2.14,.53);
    c.fillStyle='#4b303c'; c.fillRect(1.8+i*.36,y+2.18,2.1,.42);
    if(i===2) {
      c.fillStyle='#442431'; c.fillRect(-3.28,y+.66,3.1,2.2); c.fillRect(2.1,y+.66,2.93,2.2);
      c.fillStyle='#ffae32'; c.fillRect(-3.09,y+.8,2.7,1.75); c.fillRect(2.28,y+.8,2.57,1.75);
      c.fillStyle='#fff19d'; c.fillRect(-2.38,y+.83,1.42,1.02);c.fillRect(2.59,y+.83,1.32,1.02);
    }
  }
  c.restore();
}

// The board handles the vertical offset separately, leaving the shadow on the lava.
export function drawNetherBeast(c, monster, x, y, time, songAge) {
  c.save(); c.translate(x,y);
  if (monster.type==='ghast') ghast(c,monster,time,songAge);
  else magma(c,monster,time,songAge);
  c.restore();
}

export function markMagmaLanding(c,x,y,progress,time) {
  const r = 7.2 + (1-progress)*1.85 + .3*Math.sin(time*7);
  c.save(); c.translate(x,y+3.6); c.lineCap='round';
  c.beginPath(); c.ellipse(0,0,r,r*.43,0,0,tau); edge(c,'#603941',1.65);
  for(const start of [0,Math.PI]) {
    c.beginPath(); c.ellipse(0,0,r,r*.43,0,start+.12,start+Math.PI-.12);edge(c,'#ffa25e',.78);
  }
  for(const side of [-1,1]) {
    c.beginPath(); c.moveTo(side*(r+1.05),-1.6); c.lineTo(side*(r-.8),0); c.lineTo(side*(r+1.05),1.45);edge(c,'#ffe6a1',.9);
  }
  c.restore();
}

export function magmaDust(c,x,y,age) {
  if (!(age>=0 && age<.39)) return;
  const t=age/.39;
  c.save(); c.translate(x,y+6.4); c.globalAlpha*=1-t;
  c.beginPath(); c.ellipse(0,0,4.8+7*t,1.35+2.35*t,0,0,tau); edge(c,'#f4af6e',1.12-t*.67);
  for(let i=0;i<6;i++){
    const side=i%2?-1:1, jump=Math.sin(t*Math.PI);
    const dist=4.6+(5.5+i*.65)*t;
    ember(c,side*dist,(i%3-1)*1.31-jump*(1.15+i*.37),.85-t*.55,i%2?'#ffd17d':'#c9998d');
  }
  c.restore();
}
