import { beat, strokes } from './guitar.js?v=encore-1';

// Rendered in world pixels, with simulation time so a paused effect holds its pose.
const TAU = 2 * Math.PI;
const clamp = value => Math.max(0, Math.min(1, value));
const beatColors = ['#a6fff1', '#ffbcdd', '#ffe5a1'];

const glint = new Path2D('M0 -1 Q.14 -.19 .72 0 Q.14 .15 0 1 Q-.14 .15 -.72 0 Q-.14 -.19 0 -1Z');
const note = new Path2D('M1 2.1 V-4.6 Q4.6 -4.1 4.4 -1.1 Q3.7 -2.5 2.05 -2.45 V2.65 C2.05 5.05 -2.15 5.25 -2.55 3.65 C-2.95 2.35 -.68 1.22 1 2.1Z');
const eighths = new Path2D('M-1.8 1.8 V-3.6 L4.5 -5 V1.4 C4.5 3.4 .55 4 .3 2.3 C.1 1.12 1.8 .22 3.35 .53 V-2.65 L-.65 -1.8 V2.6 C-.65 4.75 -4.5 5.28 -4.85 3.6 C-5.08 2.35 -3.35 1.52 -1.8 1.8Z');
const exclamation = new Path2D('M-.7 -3 Q0 -3.7 .8 -3 L.4 .55 -.4 .55Z M-.52 1.6 H.55 V2.75 H-.52Z');
const strike = new Path2D('M-1 -2 L1 -7 2.2 -2.4 6 -4 4 -.6 8.3 .6 3.3 2 4.6 5.2 1.2 3.1 -.8 7 -1.55 2.4 -5 3.5 -3.2 .6 -6.2 -1.4 -2.4 -1.1Z');
const shout = new Path2D('M-9 -6.5 H8 Q12 -6.5 12 -2.7 V2 Q12 5.5 8.2 5.5 H-3 L-8 8 -7 5.5 H-9 Q-12 5.5 -12 2 V-3 Q-12 -6.5 -9 -6.5Z');
const slash = new Path2D('M.5 -13 C10 -15 21 -9 22 -.5 Q21 8 9 12 C16 7 19 2 18 -1 C17 -6 8 -12 .5 -13Z');

function stamp(c, path, x, y, scale, rotation, fill, outline) {
  c.save();
  c.translate(x,y);
  c.rotate(rotation);
  c.scale(scale,scale);
  if (outline) {
    c.lineWidth = 1.35;
    c.lineJoin = 'round';
    c.strokeStyle = outline;
    c.stroke(path);
  }
  c.fillStyle = fill;
  c.fill(path);
  c.restore();
}

function dash(c, state, age) {
  const speed = clamp(Math.abs(state.player.vx)/184);
  const distance = 10 + 18*speed;
  c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const phase = (age*2.4 + i*.27) % 1;
    const y = -5.5 + i*3.5;
    const x = -4 - phase*distance*.43;
    const length = distance * (.38 + .32*Math.sin(phase*Math.PI)) * (i%2 ? .78 : 1);
    c.fillStyle = i%2 ? '#a5fff1' : '#49cfcf';
    c.globalAlpha = (.48 + .45*speed) * Math.sin(phase*Math.PI);
    c.beginPath();
    c.moveTo(x,y);
    c.bezierCurveTo(x-length*.38,y+1.4,x-length*.67,y+.2,x-length,y-1);
    c.quadraticCurveTo(x-length*.48,y-.75,x,y-1.15);
    c.fill();
  }
  c.globalAlpha = .9;
  const sparkPhase = (age*2) % 1;
  stamp(c,glint,-6-distance*sparkPhase,8-Math.sin(sparkPhase*Math.PI)*4,2.5*(1-sparkPhase),.18,'#d2ffed');
}

function vanish(c, state, age, front) {
  const onset = clamp(1-age/.46);
  const returning = clamp(1-state.abilityTime/.42);
  const flash = Math.max(onset,returning);
  const angle = age*3.5;
  c.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const phase = angle + i*Math.PI;
    const y = i ? -4 : 3;
    c.strokeStyle = i ? '#f4ddff' : '#9debdc';
    c.lineWidth = .85 + flash*.55;
    c.globalAlpha = .32 + .32*flash;
    c.beginPath();
    c.ellipse(0,y+Math.sin(phase)*2,7.7+2.5*flash,4,-.23,
      front ? .18 : Math.PI+.2,front ? 2.65 : 5.82);
    c.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const rise = (age*.7+i/5)%1;
    const azimuth = angle+rise*4+i*1.8;
    if ((Math.sin(azimuth)>0) !== front) continue;
    const x = Math.cos(azimuth)*(7+4*rise+2*flash);
    c.globalAlpha = .32 + Math.sin(Math.PI*rise)*.63;
    stamp(c,glint,x,9-rise*25,1.1+(i%2)*.9+flash*.55,.2,i%2 ? '#e2bdff' : '#caffef');
  }
}

function punch(c, age) {
  const swing = clamp(age/.35);
  const strength = Math.sin(swing*Math.PI);
  c.globalAlpha = strength;
  c.save();
  c.rotate((swing-.52)*.85);
  c.scale(.78+.28*swing,.78+.22*swing);
  c.fillStyle = '#ffc45c';
  c.strokeStyle = '#70422e';
  c.lineWidth = .64;
  c.stroke(slash); c.fill(slash);
  c.beginPath(); c.moveTo(5,-12); c.bezierCurveTo(16,-10,24,-3,19,4);
  c.strokeStyle = '#fff3cc'; c.lineWidth = 1.25; c.stroke();
  c.restore();
  const impact = clamp((age-.075)/.23);
  if (impact>0 && impact<1) {
    c.globalAlpha = (1-impact)*.93;
    stamp(c,strike,17+3.8*impact,-1.6,.64+.48*impact,-.25+impact*.25,'#fff3be','#be623f');
  }
}

function voice(c, age) {
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const elapsed = age-i*.09;
    if (elapsed<0) continue;
    const wave = (elapsed%1.05)/.76;
    if (wave>1) continue;
    const radius = 8+wave*28;
    c.globalAlpha = Math.sin(Math.PI*(.22+.78*wave))*(.88-i*.13);
    for (const sign of [-1,1]) {
      c.beginPath();
      const axis = sign===1 ? 0 : Math.PI;
      c.ellipse(0,-5,radius,radius*.72,0,axis-.47,axis+.47);
      c.strokeStyle = 'rgba(111,62,48,.65)'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = i===1 ? '#ffc076' : '#ffe6a0'; c.lineWidth = 1.1; c.stroke();
    }
  }
}

function speechBubble(c, x, y, dir, age, remaining, width) {
  const px = Math.min(width-13,Math.max(13,x+dir*11));
  const py = Math.max(9,y-23);
  const pop = Math.min(1,age/.11);
  c.translate(px,py);
  const scale = .65+.35*pop+Math.sin(pop*Math.PI)*.16;
  c.scale(scale,scale);
  c.rotate(dir*(-.08+.03*Math.cos(age*6)));
  c.globalAlpha = clamp(remaining/.2);
  c.strokeStyle = '#50334a'; c.lineWidth = 1.45;
  c.save();
  c.scale(dir,1);
  c.stroke(shout); c.fillStyle = '#fff1be'; c.fill(shout);
  c.restore();
  c.font = 'bold 9px system-ui, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#69384a';
  c.fillText('БУ!',0,.2);
}

export function drawAbility(c,state,x,y,front,width) {
  if (state.abilityTime<=0 || state.heroId==='pasha') return;
  // Cooldown and game time stop together. The start of the gesture is fixed even while moving.
  const age = Math.max(0,30-state.cooldown);
  const dir = state.player.facing;
  c.save();
  if (state.heroId==='dad' && front) {
    speechBubble(c,x,y,dir,age,state.abilityTime,width);
  } else {
    c.translate(x,y);
    c.scale(dir,1);
    if (state.heroId==='kirill' && !front) dash(c,state,age);
    if (state.heroId==='maxim' && front) punch(c,age);
    if (state.heroId==='mom') vanish(c,state,age,front);
    if (state.heroId==='dad' && !front) voice(c,age);
  }
  c.restore();
}

export function invisibleOpacity(state) {
  const enter = clamp((30-state.cooldown)/.23);
  const exit = clamp(state.abilityTime/.28);
  return 1 - Math.min(enter,exit)*(.55+.06*Math.sin(state.time*7));
}

// The outer chord marks the actual sound front. Trailing arcs and notes decay behind it.
export function drawSoundWave(c,solo,camera) {
  const fade = clamp((.91-solo.age)/.34);
  if (!fade) return;
  c.save();
  c.translate(solo.x-camera,solo.y);
  c.lineCap = 'round';
  for (let i = 0; i<3; i++) {
    const radius = Math.max(1,solo.front-i*3.75);
    c.strokeStyle = beatColors[i];
    c.lineWidth = i===0 ? 1.2 : .75;
    c.globalAlpha = fade*(.66-i*.14);
    for (let j=0;j<8;j++) {
      const start = j*Math.PI/4+i*.17+solo.age*.23;
      c.beginPath();
      c.arc(0,0,radius,start,start+(i ? .38 : .68));
      c.stroke();
    }
  }
  c.globalAlpha = fade;
  for (const side of [-1,1]) {
    const angle = side>0 ? -.42 : -.66;
    stamp(c,note,side*solo.front*Math.cos(angle),solo.front*Math.sin(angle),.83,side*.18,
      side>0 ? beatColors[0] : beatColors[1],'#493850');
  }
  c.restore();
}

export function drawSoloNotes(c,age,x,y,dir) {
  c.save();
  const ending = strokes.at(-1)[0];
  for (const [at,chord,accent] of strokes) {
    const lastChord = at === ending;
    const rise = (age-at*beat)/(lastChord ? 1 : .65);
    if (rise<0 || rise>=1) continue;
    const drift = 8+rise*(accent>.8 ? 12 : 6)+Math.sin(rise*Math.PI)*3;
    const px = x+dir*drift;
    const py = y-5-rise*(accent>.8 ? 23 : 18);
    c.globalAlpha = clamp((1-rise)*3);
    stamp(c,accent>.8 ? eighths : note,px,py,.62+.3*Math.sin(rise*Math.PI),dir*(rise-.4)*.38,
      beatColors[chord%3],'#56364e');
  }
  c.restore();
}

export function drawEnemyReaction(c,actor,x,y,time,frightened) {
  c.save();
  if (actor.dance>0) {
    const beat = (5-actor.dance)*2;
    for (let i=0;i<2;i++) {
      const pulse = (beat+i*.5)%1;
      const side = i ? -1 : 1;
      c.globalAlpha = clamp(actor.dance*4)*Math.sin(Math.PI*pulse);
      stamp(c,i ? note : eighths,x+side*(5+pulse*6),y-2-pulse*10,
        .67+.17*Math.sin(pulse*Math.PI),side*.21,beatColors[i],'#41304b');
    }
  } else if (actor.stun>0) {
    for (let i=0;i<3;i++) {
      const phase = time*5+i*TAU/3;
      c.globalAlpha = .72+.24*Math.sin(phase);
      stamp(c,glint,x+Math.cos(phase)*6,y-3+Math.sin(phase)*1.8,1.75+Math.sin(phase)*.42,.22,'#ffde8a','#765037');
    }
  } else if (frightened) {
    const pulse = (.5+.5*Math.sin(time*8));
    stamp(c,exclamation,x-actor.facing*5,y-4-pulse*1.7,.88+pulse*.16,actor.facing*.27,'#ffdf94','#69474a');
  }
  c.restore();
}
