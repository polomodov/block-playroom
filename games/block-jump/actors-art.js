import { drawNetherCreature } from './nether-creature-art.js?v=living-worlds-1';
import { drawArrow } from './monster-action-art.js?v=monster-motion-1';
import { beat, performanceAge, strokes } from './guitar.js?v=encore-1';

// Illustration coordinates are in game units. The canvas scales the paths at display density.
const paths = new Map();
function shape(c, d, fill, edge, width = .55) {
  let path = paths.get(d);
  if (!path) { path = new Path2D(d); paths.set(d, path); }
  if (fill) { c.fillStyle = fill; c.fill(path); }
  if (edge) { c.lineWidth = width; c.strokeStyle = edge; c.stroke(path); }
}
function oval(c, x, y, rx, ry, color) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
  c.fillStyle = color; c.fill();
}
function stroke(c, x, y, kx, ky, tx, ty, ink, width) {
  c.beginPath(); c.moveTo(x,y); c.lineTo(kx,ky); c.lineTo(tx,ty);
  c.strokeStyle=ink; c.lineWidth=width; c.stroke();
}
const family = {
  kirill: { height:.94, build:.91, hair:'#5d4035', shine:'#a07950', jacket:'#167c85', lit:'#4bb7b8', shade:'#124c59', shirt:'#24515d', pant:'#8a7050', shoe:'#405362' },
  maxim:  { height:1, build:1.16, hair:'#533932', shine:'#a16c43', jacket:'#302f3b', lit:'#5a5364', shade:'#252634', shirt:'#7951b5', pant:'#526480', shoe:'#6e4345' },
  mom:    { height:1.02, build:1, hair:'#62483e', shine:'#ac7b5a', jacket:'#42414e', lit:'#777482', shade:'#2d2c39', shirt:'#79374c', pant:'#474654', shoe:'#553f40' },
  dad:    { height:1.05, build:1.07, hair:'#594638', shine:'#907158', jacket:'#394b65', lit:'#6b849b', shade:'#293747', shirt:'#35465c', pant:'#485364', shoe:'#473e40' },
  pasha:  { height:1.05, build:.99, hair:'#413738', shine:'#796052', jacket:'#b47c43', lit:'#e1ad69', shade:'#79553d', shirt:'#34333e', pant:'#424554', shoe:'#8d8d96' },
};
const ink = '#302d3c', skin = '#efb58b', warm = '#c7846b';
const body = 'M-3.5 -15.1 Q-.3 -16.3 2.5 -15.1 Q3.7 -13.4 4 -9 L3.4 -7.8 Q-.4 -7 -4.1 -8.3 L-4.3 -12.5Z';

function torso(c,id,h) {
  c.save(); c.scale(h.build,1);
  shape(c,id==='maxim'?'M-3.5 -15.1Q-.3 -16.3 2.5 -15.1Q3.4 -14.3 3.8 -13.2Q5.65 -10.4 4.35 -8.5Q2.8 -7.2 -.3 -7.3L-4.1 -8.3 -4.3 -12.5Z':body,h.jacket,ink,.8);
  shape(c,'M-4 -13.8Q-3.7 -15.4 -.7 -15.4L-1.3 -14 -2.8 -13.1 -3.1 -9.3 -4 -8.7Z',h.lit);
  shape(c,'M-3.9 -9.1Q0 -8.6 3.8 -10L3.5 -8Q0 -7.1 -4 -8.4Z',h.shade);
  if(id==='maxim' || id==='pasha') {
    const shirt=id==='maxim'?'M-.55 -15.2Q.8 -14.4 2 -15.1Q4.72 -12 4.22 -9.07Q4.05 -7.42 .7 -7.63L-.95 -7.8 -.7 -12Z':'M-.55 -15.2Q.8 -14.4 2 -15.1L2.8 -12 3.1 -8Q1.3 -7.4 -.9 -7.8L-.7 -12Z';
    shape(c,shirt,h.shirt);
    shape(c,'M-1.4 -14.4L-.7 -13.2 -.95 -8.1',null,h.lit,.42);
    if(id==='maxim') shape(c,'M2 -14L.45 -11.9 1.5 -12 -.25 -9.7 2.35 -12.35 1.28 -12.25Z','#efe4ff');
  } else if(id==='mom') {
    shape(c,'M-3.3 -15Q-.7 -13.6 3 -15.2L3.3 -13.5Q.7 -12.1 -2.8 -13.4Z','#783549',ink,.4);
    shape(c,'M.4 -13.6L2 -13.6 .5 -9.7 -1 -10.4Z','#963b51');
    shape(c,'M-.5 -11.4L.9 -10.9M.1 -12.7L1.4 -12.2',null,'#e1b66e',.52);
  } else {
    shape(c,'M-2.8 -14.8L-.5 -12.8 .7 -14.5 2.4 -13.6 2.5 -15.1',null,h.lit,.6);
    shape(c,'M.8 -13.2L.8 -9.4',null,h.shade,.4);
  }
  c.restore();
}

function head(c,id,h,blink) {
  shape(c,'M-1.3 -17.6L1.8 -17.8 1.7 -14.8Q.3 -13.7 -1.6 -15Z',warm,ink,.45);
  shape(c,'M-3.8 -22.4Q-2.3 -26 1 -25.2Q4.6 -24.8 4.7 -21.8L4.65 -20.2 5.35 -19.35 4.56 -18.9Q4.2 -16.65 1.8 -16.2Q-.6 -15.9 -2.5 -17.9L-3.7 -19.8Z',skin,ink,.64);
  shape(c,'M-3.5 -22L-2 -21.5 -1.8 -18.8Q-.8 -17.1 1.7 -16.6Q-.8 -16.3 -2.6 -18Z','#d89575');
  if(id==='dad') {
    shape(c,'M-3.85 -19.1Q-5.9 -23.6 -2.65 -24.9Q-1.5 -25.5 .1 -25.25Q-2.6 -24.6 -2.45 -22.3L-2.28 -19.65Z',h.hair,ink,.45);
    shape(c,'M-2.9 -19.3Q-1.9 -17.7 -.55 -17.8L1.3 -18.55 2.85 -18.25 4.5 -18.9Q4.35 -15.7 1.2 -15.65Q-1.75 -15.65 -2.9 -18.5Z',h.hair,ink,.45);
    shape(c,'M-.2 -16.8L1 -16.5 2.1 -16.8',null,h.shine,.42);
  } else {
    const hair=id==='pasha'
      ? 'M-3.3 -18.8Q-4.95 -19.2 -4.7 -21.6L-5.5 -22.8 -4.45 -22.7 -5 -24.5 -3.6 -24.4 -3.7 -25.8 -2 -25.25 -.9 -26.9 .1 -25.9 1.7 -26.4 2.35 -25.55 4.15 -25.5 3.85 -24.75 5 -23.95Q4.7 -22.35 2.8 -21.9L3.05 -23 .95 -21.8 .7 -22.95 -1.65 -21.95 -2.15 -20.25 -3.1 -20.55Z'
      : id==='mom'
        ? 'M-3 -18.5L-4.6 -16.6 -4.5 -18.75 -5.35 -18.4Q-6.05 -22.7 -4.15 -24.1Q-2.6 -26.7 .8 -25.6Q4.4 -26.15 5.1 -23.1L4 -23.45 4.6 -22.25Q2.5 -22.7 1.4 -23.5Q.5 -21.6 -1.4 -21.25L-.85 -22.45 -2.4 -20.65Z'
        : 'M-3.1 -18.9Q-5.25 -20.1 -4.7 -22.2L-5.05 -23.65 -3.85 -23.6Q-3.4 -25.65 -.9 -25.45L.65 -26.2 1.05 -25.4Q4.6 -25.5 5 -22.95L3.9 -23.35 4 -22.25 2.35 -23.25 1.7 -21.9 .95 -23.25 -.45 -22.05 -.7 -23.15 -2.4 -21.55 -2.4 -20.1 -3.1 -20.35Z';
    shape(c,hair,h.hair,ink,.63);
    shape(c,'M-3.7 -23.4Q-2.9 -24.9 -1 -24.8M-.2 -24.85Q1.35 -25.1 2.2 -24.7',null,h.shine,.46);
  }
  oval(c,-2.8,-19.5,.83,1.12,'#dfa17d');
  shape(c,'M.05 -21.1Q.95 -21.52 1.6 -21.1M3.1 -21Q3.7 -21.35 4.25 -21.15',null,h.hair,.45);
  if(blink) shape(c,'M.3 -20.2L1.55 -20.1M3.4 -20.1L4.4 -20.15',null,ink,.48);
  else { oval(c,1.12,-20.24,.46,.65,ink); oval(c,3.92,-20.3,.38,.58,ink); }
  if(id==='pasha') shape(c,'M-2.7 -20.55L-.55 -20.8Q.6 -21 2.1 -20.65L2 -19.67Q1.25 -19.13 -.1 -19.58L-.5 -20.55M2.05 -20.4L2.95 -20.48 3 -20.85 4.7 -20.75 4.58 -19.76Q3.8 -19.3 3.15 -19.7Z',null,'#534e4e',.44);
  if(id==='mom') {
    shape(c,'M-3.15 -23.65L-1.9 -25.15 .45 -25.47 1.05 -25.2 3.62 -25.4',null,'#282635',.76);
    oval(c,-2.85,-18.4,.48,.58,'#ffdca6');
  }
  shape(c,'M2 -18.25Q2.9 -17.94 3.6 -18.45',null,id==='dad'?'#e5a987':'#ab695b',.4);
}

function leg(c,phase,run,air,ascent,front,h) {
  const swing=Math.sin(phase), lift=(1-Math.cos(phase))*.5;
  const sign=front?1:-1;
  // Tuck at the apex; extend both feet below the hips during the descent.
  const rising=(1+ascent)/2, apex=1-Math.abs(ascent);
  const kneeX=air ? .7+sign*(.8+2.9*rising)+apex*1.9 : swing*run*2.55+.6;
  const kneeY=air ? -4.25-(front?3.3:1.3)*rising-1.45*apex : -4.2-run*lift*1.65;
  const footX=air ? sign*(.95+3.65*rising+2.1*apex)-.7 : swing*run*5.35+sign*.8;
  const footY=air ? -1.15-(front?4.45:1.75)*rising-(front?1.7:3.45)*apex : -1.0-run*lift*2.4;
  stroke(c,sign*.75,-8,kneeX,kneeY,footX,footY,ink,3.15);
  stroke(c,sign*.75,-7.8,kneeX,kneeY,footX,footY,front?h.pant:'#3e4355',2.2);
  c.save();c.translate(footX,footY);c.rotate(air?sign*.2:swing*.28*run);
  shape(c,'M-1.22 -.55L.9 -.6 1.63 -.1 2.55 .09 2.7 .87Q.9 1.18 -1.35 .85Z',h.shoe,ink,.53);
  shape(c,'M-1.03 .76Q.2 1 2.48 .72',null,'#e5daca',.45);c.restore();
}
function arm(c,phase,run,air,ascent,front,h) {
  const swing=Math.sin(phase), sign=front?1:-1;
  const elbowX=-1.55+swing*run*2.7 + (air? -sign*(2+ascent) : 0);
  const palmX=elbowX+.45+run*(2.4+swing) + (air? sign*2.8:0);
  const palmY=-8.6-run*(1.55+swing*1.15)-(air?2.6+sign*1.7+ascent*(front?2.6:-1):0);
  stroke(c,-1.45,-14.15,elbowX,-11.25,palmX,palmY,ink,2.95);
  stroke(c,-1.5,-14,elbowX,-11.25,palmX,palmY,front?h.jacket:h.shade,2.12);
  if(front)stroke(c,-1.8,-13.8,elbowX-.4,-11.4,palmX-.3,palmY-.3,h.lit,.38);
  oval(c,palmX,palmY,1.12,1.08,skin);
}

// Key the pick and the fretting hand to the same strokes that play the audio.
const pickPositions = [], fretPositions = [];
const frets = [7.7,6.15,9.1,7.0];
let previousFret = frets[strokes[0][1]];
for (const [index,chord,accent] of strokes) {
  const time = index * beat;
  const direction = Number.isInteger(index) ? 1 : -1;
  const reach = direction * (.55 + .55 * accent);
  pickPositions.push([time-.09,-reach],[time,0],[time+.09,reach]);
  if (!fretPositions.length || previousFret !== frets[chord]) {
    fretPositions.push([time-.17,previousFret],[time-.045,frets[chord]]);
    previousFret = frets[chord];
  }
}
const lastPick = pickPositions[pickPositions.length-1];
pickPositions.push([lastPick[0]+.62,lastPick[1]*.55]);

function handPosition(poses,age) {
  for (let i=1;i<poses.length;i++) {
    const [end,to] = poses[i];
    if (age > end) continue;
    const [start,from] = poses[i-1];
    const t = Math.max(0,(age-start)/(end-start));
    return from + (to-from)*t*t*(3-2*t);
  }
  return poses[poses.length-1][1];
}

// The neck, fretting fingers, strumming wrist and pick share the instrument's axes.
function guitarPose(c, age, h) {
  const strokePhase = handPosition(pickPositions,age);
  const chord = handPosition(fretPositions,age);
  const wristX = -1.75 + strokePhase * .65;
  const wristY = -.15 + strokePhase * 2.8;
  shape(c,'M1.6 -15.1Q.8 -11.8 -4.7 -7.4',null,'#382d3c',1.45);
  c.save();
  c.translate(-.8,-9.55);
  c.rotate(-.43 + Math.cos(age*Math.PI*2/beat) * .042);

  // The elbow passes behind the neck, and the fingertips curl over its edge.
  stroke(c,4.1,-4.15,4.85,1.12,chord,.6,ink,2.9);
  stroke(c,4.1,-4.15,4.85,1.12,chord,.6,h.shade,2.12);
  shape(c,'M-7.4 .8C-7.7 -3 -5.3 -5 -2.8 -4.35C-.5 -3.65 -.5 -2.5 1.35 -3.15C3.45 -4 4.7 -3 4.8 -.5C5 1.55 3.45 2.8 1.95 2.45C-.4 1.95 -.35 4.15 -2.9 5.1C-5.9 6.1 -7.65 3.35 -7.4 .8Z','#145762',ink,.9);
  shape(c,'M-7.1 -.1C-7.1 -3.3 -5.15 -4.6 -3.2 -4.05C-1.35 -3.6 -.7 -2.15 1.3 -2.9C3.8 -4 4.6 -2.15 4.5 -.4C4.5 1.3 3.35 2 1.85 1.88C-.5 1.4 -.7 3.6 -3 4.36C-5.35 5.14 -7.4 2.63 -7.1 -.1Z','#15919a','#ffe9bc',.55);
  oval(c,-.8,-.2,1.65,1.7,'#ffe4ad');
  oval(c,-.8,-.2,1.21,1.25,'#483340');
  shape(c,'M.9 .35Q1.8 1.7 .15 2.55Q-1.15 2.7 -1.6 1.65Q.12 1.62 .9 .35Z','#194f64');
  shape(c,'M-4.7 -1.05L-3.85 -1.05 -3.85 1.18 -4.8 1.18Z','#583e44');
  shape(c,'M1.1 -.85L11.13 -.7 11.35 .8 1.1 1.03Z','#654739',ink,.55);
  shape(c,'M10.95 -.85L13.3 -1.65 15.1 -1.07 14.65 1.62 11.05 .8Z','#ad6144',ink,.65);
  for (const peg of [12.1,14.0]) {
    oval(c,peg,-1.68,.44,.63,'#f5e1b5');
    oval(c,peg-.22,1.57,.44,.63,'#e0c8a4');
  }
  for (const fret of [3,5,6.7,8.2,9.55]) {
    stroke(c,fret,-.64,fret,.04,fret,.75,'#e0b895',.3);
  }
  for (const y of [-.38,.23]) {
    stroke(c,-4.5,y,4.3,y,13.9,y*.72,'#fff0be',.24);
  }
  oval(c,chord,.82,1.25,1.06,skin);
  stroke(c,chord-.65,.55,chord-.72,-.52,chord-.4,-.72,skin,.7);
  stroke(c,chord+.35,.58,chord+.23,-.39,chord+.49,-.65,'#fbd0a4',.65);

  // Follow through across the whole soundboard rather than wiggling just a fingertip.
  const elbowX = -3.95 - strokePhase * .6;
  const elbowY = -2.95 + strokePhase * .56;
  stroke(c,.3,-5.55,elbowX,elbowY,wristX,wristY,ink,3.35);
  stroke(c,.3,-5.55,elbowX,elbowY,wristX,wristY,h.jacket,2.45);
  stroke(c,.15,-5.65,elbowX-.35,elbowY-.4,wristX-.6,wristY-.3,h.lit,.57);
  oval(c,wristX,wristY,1.14,1.07,skin);
  c.save();c.translate(wristX+.45,wristY+.56);
  shape(c,'M0 0L.92 -.16 .54 .72Z','#baffed','#3f7071',.22);
  c.restore();
  c.restore();
}

function powerArm(c,hero,h,amount) {
  const punch = hero === 'maxim';
  const elbowX = punch ? -3.3 + 9.6 * amount : -3.85;
  const elbowY = punch ? -8.75 - 3.0 * amount : -10.75 - amount * .65;
  const palmX = punch ? -.6 + 14.35 * amount : 4.75;
  const palmY = punch ? -10.6 - .74 * amount : -17.95;
  stroke(c,-1.6,-14.2,elbowX,elbowY,palmX,palmY,ink,3.2);
  stroke(c,-1.6,-14.2,elbowX,elbowY,palmX,palmY,h.jacket,2.35);
  stroke(c,-1.65,-14.4,elbowX,elbowY-.45,palmX-.2,palmY-.4,h.lit,.45);
  oval(c,palmX,palmY,punch ? 1.65 : 1.17,punch ? 1.35 : 1.0,skin);
}

const motion = new WeakMap();
export function drawHero(c,s,camera) {
  const p=s.player,h=family[s.heroId];
  let m=motion.get(s);
  if(!m) { m={time:s.time,x:p.x,phase:0,ground:p.onGround,vy:p.vy,land:-5,impact:0}; motion.set(s,m); }
  const dt=s.time-m.time;
  if(dt>0) {
    const traveled=Math.abs(m.x-p.x);
    if(dt<.12 && traveled<=26) {
      if(p.onGround) m.phase+=traveled*.17;
      if(!m.ground && p.onGround) { m.land=s.time; m.impact=Math.min(1,Math.max(.38,m.vy/320)); }
    } else m.land=-5;
    Object.assign(m,{time:s.time,x:p.x,ground:p.onGround,vy:p.vy});
  }
  const run=Math.min(1,Math.abs(p.vx)/132),air=!p.onGround;
  const since=s.time-m.land, landing=since<.17?Math.sin(since/.17*Math.PI)*m.impact:0;
  const bob=air?0:-Math.abs(Math.cos(m.phase))*run*.83;
  const idle=Math.sin(s.time*3.2)*.16*(1-run);
  const ascent=Math.max(-1,Math.min(1,-p.vy/280));
  c.save();c.translate(p.x+p.w/2-camera,p.y+p.h);
  c.scale(p.facing*h.height*(1+.1*landing),h.height*(1-.12*landing));
  c.lineJoin='round';c.lineCap='round';
  leg(c,m.phase+Math.PI,run,air,ascent,false,h);
  leg(c,m.phase,run,air,ascent,true,h);
  c.translate(0,bob+idle);c.rotate((air?.048*ascent:.064*run));
  const musicAge = s.heroId === 'pasha' ? performanceAge(s) : null;
  const playing = musicAge !== null;
  const sprint = s.heroId === 'kirill' && s.abilityTime > 0;
  const punching = s.heroId === 'maxim' && s.abilityTime > 0;
  const shouting = s.heroId === 'dad' && s.abilityTime > 2.36;
  if (sprint) c.rotate(.115 * run);
  if (playing) c.rotate(Math.sin(musicAge * Math.PI * 4) * .042);
  if (!playing) arm(c,m.phase,run,air,ascent,false,h);
  torso(c,s.heroId,h);
  c.save();
  if (playing) {
    c.translate(0,-15.6);
    c.rotate(.09 + Math.sin(musicAge * Math.PI * 4) * .095);
    c.translate(0,15.6);
  }
  head(c,s.heroId,h,s.time%3.8>3.66);
  c.restore();
  if (playing) guitarPose(c,musicAge,h);
  else if (punching) {
    const progress = 1 - s.abilityTime / .35;
    const extend = Math.min(1,progress / .32,(1-progress) / .62);
    powerArm(c,s.heroId,h,1 - (1-extend)**2);
  } else if (shouting) powerArm(c,s.heroId,h,Math.sin(s.abilityTime * 12));
  else arm(c,m.phase+Math.PI,run,air,ascent,true,h);
  c.restore();
  if(since<.19 && p.onGround && m.impact>.52) {
    const k=since/.19;
    c.save();c.globalAlpha*=.43*(1-k);
    for(const sign of [-1,1])oval(c,p.x+p.w/2-camera+sign*(3+6*k),p.y+p.h-.4-Math.sin(k*Math.PI)*1.5,1.6-k,.8-k*.35,'#f4e8d6');
    c.restore();
  }
}

// Bevelled, three-quarter boxes retain the monsters' block-game silhouettes.
function facet(c, points, color) {
  c.beginPath(); c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.closePath(); c.fillStyle=color; c.fill();
}
function cube(c,x,y,w,h,d,palette) {
  const [face,light,shade]=palette, rise=d*.52;
  c.fillStyle=face; c.fillRect(x,y,w,h);
  facet(c,[x,y, x-d,y-rise, x+w-d,y-rise, x+w,y],light);
  facet(c,[x,y, x-d,y-rise, x-d,y+h-rise, x,y+h],shade);
  c.fillStyle='rgba(245,248,219,.18)';c.fillRect(x,y,w,.45);
  c.fillStyle='rgba(25,24,37,.24)';c.fillRect(x,y+h-.42,w,.42);
}
const stone=['#b7beb9','#e1e0ce','#74848b'], coal=['#302d3d','#534a59','#211e2c'];
const moss=['#7d9e58','#b0c878','#4c7256'], zombie=['#769b7b','#aec590','#506b65'];
const sea=['#4a9690','#88c8ad','#356c73'], fire=['#dd8037','#ffd36b','#a4483a'];
const purple=['#86569d','#bf86c8','#584272'], teal=['#398a87','#62b1a6','#35646d'];
const violet=['#574c78','#7d6c9c','#413950'], red=['#a64d37','#de8a47','#6e3634'];
function eyes(c,x,y,gap,color='#272936') {
  c.fillStyle=color;c.fillRect(x,y,1.12,1.5);c.fillRect(x+gap,y,1.1,1.5);
}
function bow(c, gripX, gripY, angle, tension, carryArrow) {
  c.save();c.translate(gripX,gripY);c.rotate(angle);
  const tipX=-2.75-tension*1.8, tipY=6.7-tension*.65;
  const nock=tipX-6.4*tension;
  c.beginPath();c.moveTo(tipX,-tipY);
  c.bezierCurveTo(tipX+.8,-tipY+.15,1.6,-3.45,0,-.35);
  c.bezierCurveTo(1.28,2.2,tipX+1.8,tipY-.6,tipX,tipY);
  c.lineWidth=1.55;c.strokeStyle='#453238';c.stroke();
  c.lineWidth=.94;c.strokeStyle='#e6a65e';c.stroke();
  c.strokeStyle='#ffe0a5';c.lineWidth=.38;c.stroke();
  stroke(c,tipX,-tipY,nock,0,tipX,tipY,'#535260',1.03);
  stroke(c,tipX,-tipY,nock,0,tipX,tipY,'#fff2cf',.53);
  if(carryArrow)drawArrow(c,nock+11.4,0,1);
  stroke(c,-.2,-1,.23,0,-.3,.95,'#9f6250',1.7);c.restore();
}

function archerPose(c, action) {
  const p=Math.min(1,action.age/action.duration), release=action.kind==='release';
  const lift=release ? 1 : Math.min(1,p/.34);
  const tension=release ? Math.exp(-p*10)*Math.cos(p*17) : Math.min(1,Math.max(0,(p-.18)/.75));
  const bx=4.25+3.55*lift, by=-9.15-1.45*lift;
  const angle=(1-lift)*.52 + (release?-.12*Math.sin(p*Math.PI):0);
  const nock=-2.75-tension*8.2;
  const wx=release ? -2.5-p*2.7 : bx+Math.cos(angle)*nock;
  const wy=release ? -11.1-p*1.15 : by+Math.sin(angle)*nock;
  // The bow hand stays extended as the draw elbow retracts towards the ribs.
  stroke(c,2,-11.25,4.8,-10.5,bx,by,'#657980',1.8);
  stroke(c,2.1,-11.55,4.8,-10.85,bx,by-.22,'#e2e2c9',.95);
  bow(c,bx,by,angle,tension,!release);
  stroke(c,-2,-11.18,-3.55-Math.max(tension,0)*1.35,-7.65-Math.max(tension,0)*1.9,wx,wy,'#66777f',1.8);
  stroke(c,-2,-11.42,-3.6-Math.max(tension,0)*1.35,-7.92-Math.max(tension,0)*1.9,wx,wy-.2,'#e1e2ce',1);
  oval(c,wx,wy,.97,.7,'#d9ddc7');oval(c,bx,by,.94,.75,'#e5e4cb');
}

// These props stay attached to the wrist for the entire walk cycle.
function carriedFlask(c,x,y,swirl) {
  c.save(); c.translate(x,y); c.rotate(swirl*.20);
  shape(c,'M-.8 -1.2L-.9 .2Q-3.7 2.6 -2.35 4.5Q-1.15 5.75 1.65 5.1Q4.15 4.3 2.6 1.95L1.1 .15 1.1 -1.2Z',
    '#b2b2c8','#403347',.68);
  c.save(); c.translate(0,3.25); c.rotate(-swirl*.26);
  shape(c,'M-2.16 -.3Q-.9 .12 -.25 -.25Q1.2 -.52 2.13 -.29Q3.06 1.77 .42 1.89Q-2 2.18 -2.16 -.3Z','#ae51bf');
  oval(c,-.95,-.12,.48,.40,'#ffe5fb'); c.restore();
  c.fillStyle='#d9a273'; c.fillRect(-1.15,-1.95,2.35,.94);
  c.restore();
}

function carriedLantern(c,x,y,sway) {
  c.save(); c.translate(x,y); c.rotate(sway*.38);
  shape(c,'M-1.1 2.15Q-1.6 -.3 -.12 -.4Q1.42 -.55 1.17 2.16',null,'#524044',.69);
  shape(c,'M-2.6 2.1L-.4 1.2 2.15 2.1 2.3 5.75 .12 6.5 -2.4 5.55Z','#f4ac4c','#49363e',.65);
  oval(c,-.08,4.1,.89,1.32,'#fff3a2');
  shape(c,'M-1.85 2.36L-1.65 5.55M1.37 2.36L1.3 5.61',null,'#9a622e',.50);
  c.restore();
}

function patrolArms(c,id,gait,t,face) {
  if (id==='zombie' || id==='drowned') {
    // The zombie drags one arm. The drowned sweeps its hands back as if wading.
    const wading=id==='drowned';
    for(const side of [-1,1]) {
      const swing=gait*side;
      const handX=wading?2.7+4.25*swing : 4.2+side*1.65+swing*1.52;
      const handY=wading?-8.1+swing*2.45 : -11.5+side*.8+Math.max(0,-swing)*2.3;
      const shoulder=side*2.65;
      stroke(c,shoulder,-11.1,shoulder+1.45,-9.2+swing*.9,handX,handY,face[2],2.35);
      stroke(c,shoulder+.1,-11.15,shoulder+1.6,-9.5+swing*.9,handX+.12,handY-.28,face[0],1.5);
      cube(c,handX-.5,handY-.48,1.95,.95,.65,face);
    }
    return;
  }
  const witch=id==='witch';
  const sway=witch?Math.sin(t*3.3):gait;
  const handX=witch?4.1+sway*1.8:4.35+gait*1.7;
  const handY=witch?-11.25+Math.cos(t*3.3)*1.65:-6.85+Math.abs(gait)*.85;
  stroke(c,-2.6,-11.15,-3.55-gait*1.05,-8.1,-3.5-gait*1.4,-5.65,face[2],1.75);
  stroke(c,2,-11.15,2.75,-7.9+gait*.55,handX,handY,face[2],2.3);
  stroke(c,2.1,-11.12,2.9,-8.15+gait*.55,handX+.1,handY-.2,face[0],1.52);
  if(witch) carriedFlask(c,handX,handY,sway);
  else carriedLantern(c,handX,handY,-sway);
}

function humanoid(c,id,gait,dancing,action,t) {
  const bone=id==='skeleton', dark=id==='enderman', pumpkin=id==='pumpkin_guard', witch=id==='witch';
  const face=bone?stone:dark?coal:pumpkin?fire:witch?['#aa8c81','#d3b8a0','#776575']:id==='drowned'?sea:zombie;
  const coat=bone?stone:dark?coal:pumpkin?['#686f46','#a5a060','#414c3e']:witch?purple:teal;
  const pants=bone?stone:dark?coal:pumpkin?red:violet;
  const patrolling = !dancing && !bone && !dark;
  const walkingLift = pumpkin?1.95:witch?1.08:1.4;
  for(const leg of [-1,1]) {
    const kick = dancing ? Math.max(0,leg*gait) : 0;
    const footX = leg*(1.25 + 2.9*kick) + (dancing ? 0 : gait*leg*1.85);
    const footY = -.8 - kick*3.7 - (patrolling ? Math.max(0,leg*gait)*walkingLift : 0);
    const kneeX = leg*(1.25 + kick*3.55) + (dancing ? 0 : gait*leg*1.38);
    stroke(c,leg*1.25,-6,kneeX,-3.5-kick*3,footX,footY,pants[2],bone||dark?1.05:2.05);
    cube(c,footX-.65,footY-.75,1.8,1.3,.7,pants);
  }
  c.save();c.translate(0,-Math.abs(gait)*.46);
  if(patrolling) c.rotate(id==='zombie' ? .135+gait*.05 : gait*(witch?.1:.075));
  if(witch)shape(c,'M-2.8 -11.7L2 -11.7 4.1 -3Q.5 -2 -4.15 -3.3Z',coat[0],coat[2],.65);
  else cube(c,-2.15,-11.8,4.6,6.5,1.5,coat);
  if(bone) for(let i=0;i<3;i++){c.fillStyle=coal[0];c.fillRect(-1.6,-10.9+i*1.5,3.8,.62);}
  const reach=dark?-.9:-5.9;
  const aiming = bone && (action?.kind==='draw' || action?.kind==='release');
  const shifting = dark && (action?.kind==='blinkOut' || action?.kind==='blinkIn');
  let bowX = 3.5-gait*1.8, bowY = reach;
  if (dancing) {
    // Alternate an overhead disco point and a hand pointing toward the floor.
    const span = dark ? 1.25 : 1;
    for (const side of [-1,1]) {
      const high = (1 + side*gait)/2;
      const wristX = side * (5.65 + 1.1*high)*span;
      const wristY = -7.15 - high*8.8*span;
      stroke(c,side*2.65,-11.15,side*(4.8+span*.6),-10.2-high*2.25,wristX,wristY,
        side===-1 ? face[2] : face[0], dark ? 1.2 : 1.8);
      if (side===1) { bowX = wristX; bowY = wristY-.6; }
    }
  } else if(shifting) {
    const charge=action.kind==='blinkOut'?action.age/action.duration:1-action.age/action.duration;
    for(const side of [-1,1]){
      const wrist=side*(4.2-Math.sin(charge*Math.PI/2)*3.3);
      stroke(c,side*2.5,-11,side*(4.4+charge),-6.4,wrist,-2-charge*8,side<0?coal[2]:coal[1],1.38);
    }
  } else if(patrolling) {
    patrolArms(c,id,gait,t,face);
  } else if(!aiming) {
    stroke(c,-2.95,-11.1,-2.7+gait,-8.4,-2.8+gait*2,reach,face[2],dark?1.05:1.62);
    stroke(c,2.5,-11.1,3.25-gait,-8.3,3.5-gait*1.8,reach,face[0],dark?1.1:1.78);
  }
  if(pumpkin){shape(c,'M-2.1 -10.7L1.8 -8.9M-.35 -11.4L-1.65 -8.4',null,'#cc9c61',.75);}
  c.save();
  if(patrolling){
    c.translate(.4,-11.88);
    c.rotate(witch?-.11+.14*Math.sin(t*3.3):gait*(pumpkin?.095:.145));
    c.translate(-.4,11.88);
  }
  cube(c,-2.7,-17.45,6.65,5.65,1.65,face);
  if(pumpkin) {
    shape(c,'M.3 -18.2Q-.4 -20 .8 -20.3L1.6 -20.1 .9 -18Z','#697c43');
    shape(c,'M-1.9 -14.5L-.8 -16 0 -14.55ZM1.8 -14.6L2.75 -16.1 3.5 -14.65ZM-.9 -13.8L.25 -13.2 1.15 -13.75 2 -13.25 2.8 -13.7 2.25 -12.6 .15 -12.5Z','#673b37');
    c.save(); c.globalAlpha*=.7+.26*Math.sin(t*5.5);
    shape(c,'M-1.58 -14.58L-.86 -15.55 -.23 -14.58ZM2.16 -14.66L2.76 -15.61 3.22 -14.68ZM-.45 -13.43L.32 -13.03 1.13 -13.44 1.95 -12.97 2.5 -13.28 2.06 -12.74 .31 -12.74Z','#ffe07a');
    c.restore();
  }else if(dark) {
    c.fillStyle='#ef91f9';c.fillRect(-2.1,-14.7,2.1,.84);c.fillRect(1.85,-14.7,1.7,.84);
  }else{
    eyes(c,-1.25,-15.3,3.68,bone?'#373945':witch?'#ae436d':'#273638');
    c.fillStyle=face[2];c.fillRect(.25,-13.3,1.4,.7);
    if(!bone && !witch){c.fillStyle=face[1];c.fillRect(-2.5,-16.65,2.3,.72);c.fillRect(2.55,-16.10,1.25,.7);}
  }
  if(witch){
    shape(c,'M-4.8 -17.2L-3.2 -18.2 -2 -21.7 -.3 -20.85 .45 -23.2 2.1 -22.2 .6 -21.7 2.55 -18.2 4.7 -17.3 3.3 -16.75 -2.1 -16.65Z',coal[0],coal[2],.5);
    shape(c,'M-2.7 -18L2.3 -17.9',null,'#bf9658',.68);
    oval(c,.5,-14,.72,1.1,'#c7a08d');
  }
  c.restore(); // head
  if (id==='drowned' && !dancing) {
    for(let i=0;i<2;i++){
      const rise=(t*.73+i*.47)%1;
      c.save(); c.globalAlpha*=Math.sin(rise*Math.PI)*.78;
      c.beginPath(); c.arc(-4.05-rise*2+Math.sin(rise*5),-12.2-rise*7,.48+rise*.72,0,Math.PI*2);
      c.strokeStyle='#a4eee2'; c.lineWidth=.48; c.stroke(); c.restore();
    }
    shape(c,'M-2.8 -17.5L-.4 -17.45 -.9 -15.7 -1.6 -16.2 -1.95 -14.6 -2.7 -15.15Z','#669967');
  }
  if (aiming) archerPose(c,action);
  else if (bone) bow(c,bowX,bowY,dancing?-.85+gait*.35:-.61+gait*.1,0,false);
  c.restore();
}
function slimeSpring(phase) {
  // Match the 0.62-second airborne interval of the ordinary slime hop.
  const step = phase % 1.9;
  if (step < .62) return .30*Math.sin(Math.PI*2*step/.62);
  if (step < .89) return -.26*Math.sin(Math.PI*(step-.62)/.27);
  if (step > 1.56) return -.27*Math.sin(Math.PI*(step-1.56)/.34);
  return .022*Math.sin(phase*4);
}

function spiderLegs(c,t,dancing,near) {
  for(let i=0;i<4;i++) {
    const stride=t*10 + i*Math.PI*.76 + (near?0:Math.PI);
    const reach=near?1:-1;
    const kick=dancing?Math.max(0,Math.cos(t*Math.PI*2+reach*Math.PI/2+i*.5)):0;
    const lift=dancing?kick*5.5:Math.max(0,Math.sin(stride))*2.8;
    const footX=-7.3+i*4.9 + (near?.9:-1.5) + (dancing?reach*kick*2.4:Math.cos(stride)*2.25);
    const hipX=-3+i*1.55;
    const kneeX=hipX+(footX-hipX)*.72;
    const ground=near?-.5:-1.8;
    stroke(c,hipX,-6.6,kneeX,-9.4-lift*.52,footX,ground-lift,near?'#24232e':'#493b4b',near?1.67:1.3);
    stroke(c,hipX,-6.87,kneeX,-9.55-lift*.52,footX,ground-lift-.45,near?'#716273':'#776173',.55);
  }
}

function blazeRods(c,time,dancing,front) {
  for(let ring=0;ring<2;ring++)for(let i=0;i<4;i++) {
    const angle=time*(dancing?Math.PI*2:ring?2.9:-2.1)+i*Math.PI/2+ring*.76;
    const z=Math.sin(angle);
    if((z>=0)!==front) continue;
    const bx=Math.cos(angle)*(ring?5.25:7.1)-.72;
    const by=(ring?-11.35:-5.55)+z*1.55+Math.sin(angle*2.1)*.72;
    cube(c,bx,by,1.48,ring?3.75:4.5,.62,fire);
    c.fillStyle=ring?'#ffebb1':'#ffc15a';c.fillRect(bx,by+.28,1.22,1.22);
  }
}
function creature(c,id,t,gait,dancing,action) {
  if (id==='ghast' || id==='magma_cube') { drawNetherCreature(c,id,t,dancing,action); return; }
  if(['zombie','drowned','skeleton','pumpkin_guard','enderman','witch'].includes(id)) { humanoid(c,id,gait,dancing,action,t);return; }
  if(id==='creeper'){
    for(const side of [-1,1]) {
      const tap = dancing ? Math.max(0,side*gait) : 0;
      cube(c,side*2.2-1.1+(dancing?side*tap*2.4:gait*side),-2.8-tap*1.9,3,2.55,1.25,moss);
    }
    cube(c,-1.5,-11,4.2,8.5,1.65,moss);cube(c,-2.6,-17.4,6.7,6,2,moss);
    eyes(c,-1.7,-15.8,3.7); shape(c,'M.15 -14.55L1.75 -14.55 1.75 -13.65 2.55 -13.65 2.55 -12 1.75 -12 1.75 -12.6 .1 -12.6 .1 -12 -.65 -12 -.65 -13.65 .15 -13.65Z',coal[2]);
    c.fillStyle='#93b86d';c.fillRect(-1,-9.5,1.1,1.15);c.fillRect(1,-6.7,1.3,1.5);
    if(action?.kind==='fuse') {
      const p=Math.min(1,action.age/action.duration), beat=(1-Math.cos(p*4*Math.PI))*.5;
      c.save();c.globalAlpha*=.17+.7*p+.1*beat;
      shape(c,'M-1 -10.7L.2 -9.15 -.6 -7.85 1.3 -6.7 .55 -5.3 1.2 -3.2M.15 -9.1L1.85 -9.65M1.28 -6.65L2.35 -7.1',null,'#733c3a',1.55);
      shape(c,'M-1 -10.7L.2 -9.15 -.6 -7.85 1.3 -6.7 .55 -5.3 1.2 -3.2M.15 -9.1L1.85 -9.65M1.28 -6.65L2.35 -7.1',null,'#ffce77',.85);
      c.save();c.globalAlpha*=.17+.54*beat+.12*p;
      shape(c,'M-4.6 -18.45L2.07 -18.45 4.07 -17.4 -2.62 -17.4ZM-2.6 -17.4L4.07 -17.4 4.07 -16.65 -2.6 -16.45Z','#ffe2a0');
      shape(c,'M-3.1 -11.75L1.1 -11.75 2.78 -10.98 -1.5 -10.98ZM-1.45 -9.6L-.25 -9.6 -.25 -8.6 -1.45 -8.6ZM1.12 -7.4L2.15 -7.4 2.15 -5.85 1.12 -5.85Z','#ffd582');
      c.restore();
      c.fillStyle='#ffde96';c.fillRect(-1.65,-15.6,1.08,.7);c.fillRect(2.05,-15.6,1.08,.7);
      c.restore();
      for(let i=0;i<4;i++){
        const s=(p*1.8+i*.26)%1, side=i%2?1:-1;
        c.save();c.globalAlpha*=Math.sin(s*Math.PI)*(.45+p*.55);
        const dx=side*(3+s*(2+i%3)), dy=-12-s*(6+i%3);
        stroke(c,dx,dy,dx+side*.6,dy-.55,dx+side*.95,dy-1.65,'#ffcc70',.88);
        c.restore();
      }
    }
  }else if(id==='slime'||id==='shulker'){
    const shell=id==='shulker';
    const col=shell?purple:['#58b388','#aff1a7','#38857b'];
    const pump = dancing ? Math.cos(t*Math.PI*4) : Math.sin(t*5);
    c.save();
    if(!shell && !dancing){
      const spring=slimeSpring(t);
      c.scale(1-spring*.73,1+spring);
    } else c.scale(1+pump*(dancing?.15:.035),1-pump*(dancing?.17:.065));
    if(shell){
      const peek=dancing?.65:Math.max(0,Math.min(1,.48+.9*Math.sin(t*2.12)));
      cube(c,-5,-4.4,11,4.2,2.4,col);
      c.save();c.translate(Math.sin(t*2.3)*peek*.8,3.1*(1-peek));
      cube(c,-2.3,-8.8,6.7,4.45,1.2,['#c4c486','#ede5a9','#93946c']);
      if(peek>.18) eyes(c,-.72,-7.9,2.9);
      c.restore();c.save();
      c.translate(gait*(dancing?.95:.22),-peek*4.8);
      c.rotate(dancing?gait*.10:-peek*.105);
      cube(c,-5,-9.25,11,5.15,2.4,col);
      shape(c,'M-4.4 -7.75L-.65 -7.5 1.3 -6.25 4.85 -6.1',null,'#af76ba',.55);
      c.restore();
    }else{
      cube(c,-5.5,-12.2,11.8,12,2.4,col);
      cube(c,-3.5,-9.6,7.8,6.55,1.1,['#79cb91','#9be2aa','#57a381']);
      c.fillStyle='#b7f4bd';c.fillRect(-4.25,-11.2,2.6,.8);c.fillRect(-4.4,-10.35,.66,1.8);
      eyes(c,-2.4,-7.9,5.3);
      c.fillStyle='#34826a';c.fillRect(.3,-4.7,2.2,1.12);
    }
    c.restore();
  }else if(id==='spider'){
    spiderLegs(c,t,dancing,false);
    c.save();c.translate(0,-.52*Math.abs(Math.sin(t*10)));
    cube(c,-4.5,-10.7,7,6.2,2.6,coal);
    shape(c,'M-5.15 -10.1L-3.9 -10.9 -2.25 -10.23',null,'#8c6773',.75);
    c.restore();
    spiderLegs(c,t,dancing,true);
    c.save();c.translate(0,-.52*Math.abs(Math.sin(t*10)));
    cube(c,.85,-8.85,5.7,5.4,1.9,['#473c49','#665462','#312c3e']);
    eyes(c,2,-7.2,2.7,'#ff817a');
    shape(c,'M3.15 -4.2L3.8 -2.78 4.55 -4.1M5 -4.1L5.7 -2.8 6.13 -4',null,'#d4b8ad',.65);
    c.restore();
  }else if(id==='blaze'){
    blazeRods(c,t,dancing,false);
    c.save();c.translate(0,Math.sin(t*3.8)*.75);
    cube(c,-3,-14.9,7.4,6.8,2.2,fire);eyes(c,-1.7,-12.6,4.2);
    c.save();c.translate(0,-15.2);c.scale(1,1+.32*Math.sin(t*7.4));
    shape(c,'M-2.5 .1L-2.85 -3.65 -1.4 -2.75 -.2 -5 .9 -2.6 2.75 -3.85 2.6 -.3Z','#ffad4b');
    shape(c,'M-1.4 .12L-.8 -2.3 .2 -1.35 .8 -2.7 1.45 -.15Z','#ffe78d');c.restore();c.restore();
    blazeRods(c,t,dancing,true);
    for(let i=0;i<2;i++) {
      const ember=(t*.88+i*.55)%1;
      c.save();c.globalAlpha*=Math.sin(ember*Math.PI);
      c.fillStyle='#ffdf88';c.fillRect((i?3.4:-3.5)+Math.sin(ember*6)*1.22,-15-6.3*ember,.82,1.22);c.restore();
    }
  }else if(id==='guardian'){
    const sweep=dancing?gait:Math.sin(t*6.5);
    c.save();c.translate(-4,-7.5);c.rotate(sweep*.43);
    shape(c,'M1 -.75L-2.9 -1.75 -6.9 -1.3 -7.15 .6 -2.74 1.4 .75 1.4Z',sea[0],sea[2],.6);
    c.translate(-6.35,-.15);c.rotate(Math.sin(t*6.5-.85)*.6);
    shape(c,'M.65 0Q-1.15 -2.1 -3.5 -3.3L-2.85 -.35 -4.12 2.85Q-1.85 2.2 .65 .6Z','#dc9859','#875d47',.56);c.restore();
    c.save();c.translate(0,-7);c.rotate(sweep*.08);c.translate(0,7);
    for(const [x,y] of [[-4,-9],[-2,-13],[2,-14],[6,-9],[1,-4]]){
      const flare=.8 + .38*Math.sin(t*3.4);
      facet(c,[x,y,x+Math.sign(x)*2.4*flare,y-3.3*flare,x+1.6,y+1.1],'#ec9e58');
    }
    cube(c,-4.45,-11.5,9.3,8.4,2,sea);
    cube(c,-.7,-9.8,4.3,3.6,.55,['#e7dbc2','#fff2ce','#a3aca4']);
    oval(c,1.55+Math.sin(t*2.4)*.9,-8.1,1.08,1.17,'#b65442');c.restore();
  }else if(id==='ghost'){
    // The hem and sleeves trail the floating head like a sheet caught in a draught.
    for(let i=0;i<3;i++){
      const curl=Math.sin(t*3.6+i*1.2);
      c.save();c.translate((i-1)*2.9,-6.3);c.rotate(.30+curl*.38);c.scale(1,.8+Math.cos(t*3.6+i)*.17);
      shape(c,'M-2.1 -.65L2.2 -.45Q2.6 3.15 .9 4.1Q-.38 5.2 -.88 7Q-2.1 5.5 -1.8 3.4Z',
        i===2?'#b9d5e2':'#b0bcd7','#7e85ae',.5); c.restore();
    }
    shape(c,'M-5 -4.5Q-4.2 -6 -4.65 -9Q-5.5 -15.2 .1 -15.6Q5.5 -15.4 5 -9.2Q4.8 -5.8 5.35 -4.3Q2.1 -4.75 1 -3.7Q-.8 -5 -2.55 -3.7Z','#cfdfeb','#747aab',.65);
    shape(c,'M-3.5 -9.8Q-3.5 -13.4 -.6 -14',null,'#f4f7f5',.78);
    for(const side of [-1,1]) {
      c.save();c.translate(side*3.35,-8.3);c.scale(side,1);
      c.rotate(dancing?-.22-side*gait*.72:.12+Math.sin(t*3+side)*.36);
      shape(c,'M-.45 -1.2Q1.6 -.55 3.12 -2.85Q4 -3.8 4.25 -2.6Q4.75 .6 2 1.85L-.65 2Z','#c5d9e6','#747aab',.55);
      c.restore();
    }
    eyes(c,-.9,-10.6,3.6,'#5a597f');
    oval(c,1,-7.55,.61,.82,'#9290ae');
  }
}
export function drawBeast(c,actor,camera,time) {
  const x=actor.x+actor.w/2-camera, foot=actor.y+actor.h;
  if(x < -24||x>504||!actor.alive)return;
  const dancing=actor.dance>0;
  const danceAge = 5 - actor.dance;
  const beat = Math.sin(danceAge*Math.PI*2);
  const speed=actor.stun?0:Math.min(1,Math.abs(actor.vx)/25);
  const gait=dancing?beat:Math.sin(actor.x*.37)*speed;
  const sizing=actor.type==='enderman'?1.16:actor.type==='spider'?.94:1;
  c.save();c.lineJoin='round';c.lineCap='round';
  if (actor.action?.kind !== 'vault') oval(c,x,actor.baseY+actor.h-.4,actor.w*.4,1.05,'rgba(16,24,32,.29)');
  c.translate(x+(dancing?beat*2.55:0),foot-(dancing?Math.abs(beat)*2.4:0));
  c.scale(actor.facing*sizing,sizing);
  if(dancing)c.rotate(beat*.205);
  if(actor.stun)c.globalAlpha*=.65;
  const action=dancing||actor.stun?null:actor.action;
  if(action?.kind==='fuse'){
    const p=action.age/action.duration, pulse=(1-Math.cos(p*4*Math.PI))*.5;
    c.scale(1+p*.28+pulse*.06,1-p*.09+pulse*.08);
    c.rotate(Math.sin(p*22)*p*.03);
  } else if(action?.kind==='blinkOut' || action?.kind==='blinkIn') {
    const p=Math.min(1,action.age/action.duration);
    const fold=action.kind==='blinkOut' ? p*p*p : (1-p)**3;
    c.scale(1-fold*.87,1+fold*.15);
    c.globalAlpha*=1-fold*.65;
  }
  creature(c,actor.type,dancing?danceAge:(actor.phase ?? (actor.stun?0:time)),gait,dancing,action);
  c.restore();
}
