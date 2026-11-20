import { preparation, castAge, drawLantern, drawFlask, drawSword, drawShulker } from './maze-character-motion.js?v=living-worlds-1';
import { drawNetherBeast } from './nether-motion.js?v=living-worlds-1';
import { archerPose, drawArcherArms, drawFuse, phaseShift } from './monster-motion.js?v=living-worlds-1';
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
const bipeds=new Set(['zombie','drowned','skeleton','wither_skeleton','pumpkin_guard','enderman','witch']);
function humanoid(c,id,gait,dancing,bow,warp,monster,t) {
  const wither=id==='wither_skeleton',bone=id==='skeleton'||wither, dark=id==='enderman', pumpkin=id==='pumpkin_guard', witch=id==='witch';
  const face=wither?['#555663','#858493','#383747']:bone?stone:dark?coal:pumpkin?fire:witch?['#aa8c81','#d3b8a0','#776575']:id==='drowned'?sea:zombie;
  const coat=bone?face:dark?coal:pumpkin?['#686f46','#a5a060','#414c3e']:witch?purple:teal;
  const pants=bone?face:dark?coal:pumpkin?red:violet;
  for(const leg of [-1,1]) {
    if (dancing) {
      const kick=Math.max(0,gait*leg);
      const foot=leg*(2.05+kick*2.2), knee=leg*(1.6+kick*2.7);
      stroke(c,leg*1.25,-6,knee,-3.1-kick*2,foot,-.8-kick*2.5,pants[2],bone||dark?1.15:2.15);
      cube(c,foot-.75,-1.55-kick*2.5,2.1,1.3,.7,pants);
      continue;
    }
    const dx=gait*leg*1.85;
    stroke(c,leg*1.25,-6,leg*1.25+dx*.75,-3.5,leg*1.25+dx,-.8,pants[2],bone||dark?1.05:2.05);
    cube(c,leg*1.25+dx-.65,-1.55,1.8,1.3,.7,pants);
  }
  c.save();c.translate(0,-Math.abs(gait)*.46);
  if (!dancing && id==='zombie') {
    c.translate(0,-6); c.rotate(.12 + gait*.085); c.translate(0,6);
  }
  if (!dancing && id==='drowned') {
    c.translate(0,-6); c.rotate(monster.charging ? .37 : .09 + gait*.07); c.translate(0,6);
  }
  if(witch)shape(c,'M-2.8 -11.7L2 -11.7 4.1 -3Q.5 -2 -4.15 -3.3Z',coat[0],coat[2],.65);
  else cube(c,-2.15,-11.8,4.6,6.5,1.5,coat);
  if(bone) for(let i=0;i<3;i++){c.fillStyle=coal[0];c.fillRect(-1.6,-10.9+i*1.5,3.8,.62);}
  if (dancing) {
    for (const side of [-1,1]) {
      const reach=(1+gait*side)*.5;
      stroke(c,side*2.5,-11,side*(4.65+reach),-9.75-reach*2.4,side*(5.65+reach*.65),-8.4-reach*8,face[side===1?0:2],dark?1.15:1.82);
    }
  } else if (dark && warp > 0) {
    stroke(c,-2.8,-11,-3.7-warp*2,-7.5-warp*2,-2.9-warp*3,-1.2-warp*13,face[2],1.22);
    stroke(c,2.5,-11,3.3+warp*2,-7.7-warp*2,3.2+warp*2.7,-1.2-warp*13,face[0],1.3);
  } else if (id==='zombie' || id==='drowned') {
    const swim = id==='drowned', rush = swim && monster.charging;
    for (const side of [-1,1]) {
      const beat = side*gait, reach = (rush ? 8.2 : swim ? 4.4 : 5.5) + beat*(swim?2.1:1.25);
      const hx = reach + side*1.85, hy = -9.75 - beat*(swim?2.4:1.05);
      stroke(c,side*2.1,-11.15,side+reach*.45,-8.3-beat,hx,hy,side<0?face[2]:face[0],1.85);
      cube(c,hx-.8,hy-.55,1.8,1.15,.65,face);
    }
    if (rush) {
      for(let i=0;i<3;i++) {
        const phase=(t*2.4+i/3)%1;
        c.save();c.globalAlpha*=1-phase;
        oval(c,-5-phase*4,-5-i*2.5-phase*2.2,1.2-phase*.65,.85-phase*.35,'#acdedd');c.restore();
      }
    }
  } else if (!bow) {
    const reach=dark?-.9:-5.9;
    stroke(c,-2.95,-11.1,-2.7+gait,-8.4,-2.8+gait*2,reach,face[2],dark?1.05:1.62);
    if (!witch && !wither && !pumpkin) stroke(c,2.5,-11.1,3.25-gait,-8.3,3.5-gait*1.8,reach,face[0],dark?1.1:1.78);
  }
  if(pumpkin){shape(c,'M-2.1 -10.7L1.8 -8.9M-.35 -11.4L-1.65 -8.4',null,'#cc9c61',.75);}
  cube(c,-2.7,-17.45,6.65,5.65,1.65,face);
  if(pumpkin) {
    shape(c,'M.3 -18.2Q-.4 -20 .8 -20.3L1.6 -20.1 .9 -18Z','#697c43');
    shape(c,'M-1.9 -14.5L-.8 -16 0 -14.55ZM1.8 -14.6L2.75 -16.1 3.5 -14.65ZM-.9 -13.8L.25 -13.2 1.15 -13.75 2 -13.25 2.8 -13.7 2.25 -12.6 .15 -12.5Z','#552e36');
  }else if(dark) {
    // A fine violet edge keeps the black silhouette legible on the End's night floor.
    shape(c,'M-4.3 -13.2L-4.3 -18.2 -2.7 -17.4 3.65 -17.4',null,warp?'#eab8ff':'#82708e',warp?.8:.5);
    if (warp) {
      shape(c,'M-3.65 -11.2L-3.65 -6.1 -2.05 -5.3M3.15 -9.8L3.15 -5.7',null,'#bc90ec',.66);
      c.fillStyle='#9e65b5';c.fillRect(-2.65,-15.03,3.08,1.48);c.fillRect(1.32,-15.03,2.69,1.48);
    }
    c.fillStyle=warp?'#ffdcff':'#ef91f9';c.fillRect(-2.1,-14.7,2.1,.84);c.fillRect(1.85,-14.7,1.7,.84);
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
  c.save();
  if (dancing) c.translate(2.4+(1+gait)*.3,-2.5-(1+gait)*4);
  if (!dancing && pumpkin) drawLantern(c,monster,t,gait);
  if (!dancing && witch) drawFlask(c,monster,t,gait);
  if(wither && !dancing) drawSword(c,monster,t,gait);
  else if(wither) {
    shape(c,'M4 -5.4L4.6 -7.3 6.9 -13.4 8.3 -14.35 8 -12.5 5.7 -6.85 5.1 -5Z','#afbbc7','#515166',.62);
    shape(c,'M3.3 -7.7L6.65 -6.3',null,'#cab07b',.9);
  } else if(bow) drawArcherArms(c,bow);
  else if(bone) {
    shape(c,'M3.9 -10.9Q9 -9.4 6.6 -5.4L4.6 -3.4',null,'#573a32',1.38);
    shape(c,'M3.9 -10.9Q9 -9.4 6.6 -5.4L4.6 -3.4',null,'#e4a864',.8);
    shape(c,'M3.9 -10.9L4.6 -3.4',null,'#ebdcb5',.44);
  }
  c.restore();
  c.restore();
}
function creature(c,id,t,gait,flash,dancing,bow,warp,fuse,monster) {
  if(bipeds.has(id)) { humanoid(c,id,gait,dancing,bow,warp,monster,t);return; }
  if(id==='shulker') { drawShulker(c,monster,t,t); return; }
  if(id==='creeper'){
    const leafy=flash?['#fff0b2','#fffade','#e1c894']:moss;
    for(const i of [-1,1]) cube(c,i*(2.2+(dancing?1:0))-1.1+gait*i,-2.8-(dancing?Math.max(0,gait*i)*3:0),3,2.55,1.25,leafy);
    cube(c,-1.5,-11,4.2,8.5,1.65,leafy);cube(c,-2.6,-17.4,6.7,6,2,leafy);
    eyes(c,-1.7,-15.8,3.7); shape(c,'M.15 -14.55L1.75 -14.55 1.75 -13.65 2.55 -13.65 2.55 -12 1.75 -12 1.75 -12.6 .1 -12.6 .1 -12 -.65 -12 -.65 -13.65 .15 -13.65Z',coal[2]);
    c.fillStyle=flash?'#fffce3':'#93b86d';c.fillRect(-1,-9.5,1.1,1.15);c.fillRect(1,-6.7,1.3,1.5);
    if (fuse !== null) drawFuse(c,fuse);
  }else if(id==='slime'){
    const col=['#58b388','#aff1a7','#38857b'];
    const air=t%.9, landed=air>=.55 ? Math.sin(Math.PI*(air-.55)/.35) : 0;
    const squash=dancing ? Math.cos(t*Math.PI*4)*.13
      : landed*.19 - (air<.55 ? .13*Math.sin(Math.PI*air/.55) : 0);
    c.save();c.scale(1+squash,1-squash*(dancing?1.12:1.85));
    cube(c,-5.5,-12.2,11.8,12,2.4,col);
    c.fillStyle='#67c68e';c.fillRect(-3.8,-9.3,8.55,6.6);
    c.fillStyle='#75d397';c.fillRect(-4.25,-11.2,2.4,.9);eyes(c,-2.4,-7.9,5.3);
    c.fillStyle='#34826a';c.fillRect(.3,-4.7,2.2,1.12);
    c.restore();
  }else if(id==='spider'){
    // Separate the silhouettes of the eight legs even at single-tile scale.
    for(let i=0;i<4;i++)for(const side of [-1,1]){
      const phase=t*11.4+i*Math.PI*.6+(side<0?Math.PI:0);
      const step=dancing?Math.sin(t*2*Math.PI+i*.9)*1.8:Math.sin(phase)*1.65;
      const lift=dancing ? Math.max(0,step*side)*1.8 : Math.max(0,Math.cos(phase))*1.7;
      const footX=side*(9.1-i*.65)+step, footY=-8.2+i*2.37-lift;
      const kneeX=side*(6.3+i*.18)+step*.33, kneeY=-11.6+i*1.65-lift*.55;
      stroke(c,side*.65,-8+i*.7,kneeX,kneeY,footX,footY,'#302e3b',1.05);
      stroke(c,side*1.2,-8+i*.7,kneeX,kneeY,footX,footY,'#857081',.46);
    }
    cube(c,-4.3,-10.7,7,6.2,2.6,['#493b4d','#786773','#312d41']);
    shape(c,'M-3.4 -10.65L-1.6 -9.9 .4 -10.5',null,'#aa8b8c',.48);
    cube(c,1,-9.2,5.65,5.5,1.65,['#564250','#816473','#382e40']);
    eyes(c,1.95,-7.55,2.9,'#ff816b');
    oval(c,3.55,-5.9,.46,.38,'#ffae75');
  }else if(id==='blaze'){
    const charge=preparation(monster), since=castAge(monster,t);
    const recoil=since<.74 ? Math.max(0,1-Math.min(since,Math.abs(since-.45))/.21) : 0;
    for(let i=0;i<6;i++){
      const a=t*(dancing?Math.PI*2:2.7)+charge*2.9+i*Math.PI/3;
      const dx=Math.cos(a)*(4.6+charge*1.9+recoil), dy=Math.sin(a)*2.2;
      c.save();c.translate(dx,-6.1+dy-charge*2.8);c.rotate(-Math.cos(a)*(.2+charge*.4));
      cube(c,-1,0,1.55,3.75+charge,.7,fire);c.restore();
    }
    if(charge) oval(c,0,-8.6,1.3+charge,1.5+charge,'#ffda7b');
    cube(c,-3,-14.9,7.4,6.8,2.2,fire);eyes(c,-1.7,-12.6,4.2);
    shape(c,'M-2 -15L-2.35 -18.5 -1.1 -17.7 .1 -19.2 .8 -16.8 2.75 -17.8 2.6 -15.65Z','#ffca67');
  }else if(id==='guardian'||id==='elder_guardian'){
    const elder=id==='elder_guardian';
    const scales=elder?['#b1b6a9','#dddac3','#828f91']:sea;
    const spikes=elder?'#ae9b7e':'#e89a58';
    const swell=preparation(monster);
    const finBeat=Math.sin(t*6);
    c.save();c.translate(-1,-6);c.rotate(.33*finBeat);
    shape(c,'M0 0Q-2.05 2.1 -4.05 1.4L-3.3 -1.2Z',scales[1],scales[2],.48);c.restore();
    for(const [x,y] of [[-4,-9],[-2,-13],[2,-14],[6,-9],[1,-4]]){
      const stretch=1+swell*.85+.12*finBeat;
      facet(c,[x,y,x+Math.sign(x)*2*stretch,y-3.2*stretch,x+1.6,y+1.1],spikes);
    }
    cube(c,-4.45,-11.5,9.3,8.4,2,scales);
    shape(c,'M-3.95 -10.5L-2.75 -9.7 -2.85 -8.4M-3.9 -7.4L-2.9 -6.9 -2.9 -5.7',null,scales[1],.63);
    if(elder){c.fillStyle=scales[2];c.fillRect(-3.8,-10.2,2,.7);c.fillRect(1.2,-5.3,2.1,.7);}
    cube(c,-.7,-9.8,4.3,3.6,.55,['#e7dbc2','#fff2ce','#a3aca4']);oval(c,1.8+Math.sin(t*2.2)*.6,-8,1.1+swell*.6,1.15+swell*.6,swell?'#fff1ac':'#b65442');
    c.save();c.translate(-5.2,-8.1);
    c.rotate(dancing ? gait*.79 : finBeat*.55);
    shape(c,'M0 0L-3.3 -.9 -4.5 -2.9 -3.8 1.95 -1.2 1.2Z',scales[2]);
    c.restore();
  }else if(id==='ghost'){
    c.save();
    const sway=Math.sin(t*4.6);
    if(monster.watched) c.scale(.86,1.05);
    else { c.translate(sway*.45,Math.cos(t*3.5)*.57); c.rotate(sway*.075); }
    for (let i=0;i<3;i++) {
      const wave=Math.sin(t*5+i*1.8);
      stroke(c,-3+i*2.4,-6,-3.3+i*2.2+wave,-3.45,-4+i*2.65+wave*1.65,-1.25+wave*.82,'#9eafce',1.6);
    }
    shape(c,'M-5.8 -3Q-4.2 -5.9 -4.65 -9Q-5.5 -15.2 .1 -15.6Q5.5 -15.4 5 -9.2Q4.8 -5.8 6 -4.4L3.8 -4.9 3.2 -2.4 1 -4 -.4 -1.7 -2.9 -3.45Z','#c5d9e6','#747aab',.8);
    shape(c,'M-3.5 -9.8Q-3.5 -13.4 -.6 -14',null,'#edf3f5',.75);
    eyes(c,-.9,-10.6,3.6,monster.watched?'#735882':'#5a597f');
    c.restore();
  }
}
// The caller positions shadows, airborne monsters and warning overlays in world space.
// A portrait can pass {type} with no position, direction or target.
const scaleByType={
  zombie:.90,drowned:.90,skeleton:.92,wither_skeleton:.94,pumpkin_guard:.87,
  enderman:.99,witch:.82,creeper:.91,slime:1.04,spider:1,
  shulker:1,guardian:.97,elder_guardian:1.07,ghost:1,blaze:.90,
};
export function drawMazeMonster(ctx,monster,x,y,time=0,flash=false,songAge=0) {
  if (monster.type === 'ghast' || monster.type === 'magma_cube') {
    drawNetherBeast(ctx,monster,x,y,time,songAge);
    return true;
  }
  const size=scaleByType[monster.type];
  if(!size)return false;
  const still=monster.stun>0 || monster.watched;
  const step=monster.target && !still ? Math.sin((monster.x+monster.y)*Math.PI*1.8) : 0;
  const dancing=monster.dance>0;
  const gait=dancing ? Math.cos(songAge*Math.PI*2) : step;
  const movementTime=still || (!monster.target && monster.type==='spider') ? 0 : time;
  ctx.save();
  ctx.translate(x,y+7.5);
  const bow=monster.type==='skeleton' ? archerPose(monster,time) : null;
  const warp=monster.type==='enderman' ? phaseShift(monster,time) : 0;
  const fuse=monster.type==='creeper' && monster.windup>0 && !dancing && !still ? Math.max(0,1-monster.windup) : null;
  const castFacing=!dancing && (monster.type==='wither_skeleton' || monster.type==='pumpkin_guard')
    ? monster.aim?.dir ?? (castAge(monster,time)<.44 ? monster.cast.dir : null) : null;
  const facing=bow ? bow.dir : castFacing ?? monster.dir;
  ctx.scale((facing==='left'?-1:1)*size,size);
  if (warp) {
    ctx.scale(1-.44*warp,1+.15*warp);
    ctx.globalAlpha *= 1-.48*warp;
  }
  if (fuse !== null) {
    const pulse=.5-.5*Math.cos(2*Math.PI*(fuse*.85+fuse*fuse));
    ctx.scale(1+fuse*(.15+.15*pulse),1+fuse*(.08-.13*pulse));
    ctx.rotate(fuse * Math.sin(fuse*38) * .049);
  }
  ctx.lineCap='round';ctx.lineJoin='round';
  creature(ctx,monster.type,dancing?songAge:movementTime,gait,flash,dancing,bow,warp,fuse,monster);
  if (fuse !== null) {
    ctx.globalAlpha *= (.2 + .60*fuse) * (.5 - .5*Math.cos(2*Math.PI*(fuse*.85+fuse*fuse)));
    creature(ctx,'creeper',time,gait,true,false,null,0,null,monster);
  }
  ctx.restore();
  return true;
}
