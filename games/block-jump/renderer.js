import { drawNetherEffects } from './nether-creature-art.js?v=living-worlds-1';
import { drawDragon, drawDragonCloud, drawDragonWarning } from './dragon-art.js?v=dragon-flight-1';
import { configureBoard } from './display.js';
import { performanceAge } from './guitar.js?v=encore-1';
import { drawHero, drawBeast } from './actors-art.js?v=living-worlds-1';
import { drawMonsterEffects, drawWarnings } from './monster-action-art.js?v=monster-motion-1';
import { drawAbility, invisibleOpacity, drawSoundWave, drawSoloNotes, drawEnemyReaction } from './ability-effects.js?v=encore-1';
import { THEMES, rect, terrainLayer, midgroundLayer, drawDepth } from './world-art.js?v=studio-1';

const WIDTH=480, HEIGHT=216;
const imageFiles={world:'world-panoramas.webp',realm:'realm-panoramas.webp'};
const images=new Map(), scenes=new WeakMap();

function sheet(key) {
  if(!images.has(key)) {
    const image=new Image();
    image.src=new URL('./assets/'+imageFiles[key],import.meta.url).href;
    images.set(key,image);
  }
  const image=images.get(key);
  return image.complete && image.naturalWidth ? image : null;
}

function sceneFor(canvas,level) {
  const cached=scenes.get(canvas);
  if(cached?.level===level) return cached;
  const haze=canvas.getContext('2d').createLinearGradient(0,30,0,187);
  haze.addColorStop(0,'rgba(16,24,36,0.02)');
  haze.addColorStop(.5,'rgba(16,24,36,0.09)');
  haze.addColorStop(.82,'rgba(16,24,36,0.31)');
  haze.addColorStop(1,'rgba(25,34,45,0.62)');
  const scene={level,haze,terrain:terrainLayer(level,HEIGHT),scenery:midgroundLayer(level,WIDTH,HEIGHT)};
  scenes.set(canvas,scene);
  return scene;
}

function drawLandscape(c,t,scene,level,camera) {
  const atlas=sheet(t.sheet);
  rect(c,t.fog,0,0,WIDTH,HEIGHT);
  if(atlas) {
    const h=187, row=atlas.naturalHeight/(t.sheet==='world'?4:3), w=h*atlas.naturalWidth/row;
    const progress=camera/Math.max(1,level.width-WIDTH);
    const scroll=153+progress*(w-WIDTH-153);
    c.drawImage(atlas,0,t.row*row,atlas.naturalWidth,row,-scroll,-3,w,h);
  }
  // Atmospheric perspective separates the detailed vista from collision surfaces.
  c.fillStyle=scene.haze; c.fillRect(0,0,WIDTH,HEIGHT);
  const density=scene.scenery.height/HEIGHT;
  c.drawImage(scene.scenery,-camera*.36,0,scene.scenery.width/density,HEIGHT);
}

const gemCut = [
  ['#a9ffe1',new Path2D('M0 -5.75L3.1 -3.6 1.5 -1.75 -1.4 -1.75 -3.15 -3.6Z')],
  ['#60ecad',new Path2D('M-3.15 -3.6L-1.4 -1.75 -1.4 2.7 0 5.75 -3.55 3.15Z')],
  ['#22c789',new Path2D('M-1.4 -1.75L1.5 -1.75 1.5 2.7 0 5.75 -1.4 2.7Z')],
  ['#118d72',new Path2D('M1.5 -1.75L3.1 -3.6 3.5 3.1 0 5.75 1.5 2.7Z')],
];
const gemRim=new Path2D('M0 -5.75L3.1 -3.6 3.5 3.1 0 5.75 -3.55 3.15 -3.15 -3.6Z');
function gem(c,x,y,time) {
  const cycle=time*2.8+x*.12;
  c.save(); c.translate(x,y+Math.sin(cycle)*1.2); c.scale(.82+Math.cos(cycle)*.16,1);
  c.lineWidth=1.25;c.strokeStyle='#195c52';c.lineJoin='round';c.stroke(gemRim);
  for(const [ink,facet] of gemCut){c.fillStyle=ink;c.fill(facet);}
  c.strokeStyle='#dcffe8';c.lineWidth=.57;c.beginPath();
  c.moveTo(-3.1,-3.55);c.lineTo(-1.45,-1.75);c.lineTo(-1.45,1.65);c.stroke();
  const shine=Math.sin(time*4.1+x);
  if(shine>.72){const r=(shine-.72)*7;c.strokeStyle='#f5ffef';c.lineWidth=.6;c.beginPath();c.moveTo(2.85-r,-3.2);c.lineTo(2.85+r,-3.2);c.moveTo(2.85,-3.2-r*1.4);c.lineTo(2.85,-3.2+r*1.4);c.stroke();}
  c.restore();
}

function checkpoint(c,x,y,on,time) {
  const color=on ? '#81eab2' : '#f4bd72';
  rect(c,'#243638',x-6,y-3,13,3);
  rect(c,'#435458',x-2,y-30,4,28); rect(c,'#c0b89d',x-2,y-28,1,23);
  rect(c,'#283c42',x-5,y-31,10,10); rect(c,color,x-3,y-29,6,6);
  rect(c,'#f6ecd3',x-2,y-28,2,2);
  if(on) {
    const dy=Math.floor(time*3)%3;
    rect(c,color,x-7,y-31-dy,2,2); rect(c,color,x+6,y-28-dy,1,2);
  }
}

function flag(c,x,y,t,time) {
  rect(c,'#303c42',x-7,y-4,15,4); rect(c,t.light,x-5,y-5,11,2);
  rect(c,'#2b3540',x-2,y-47,5,43); rect(c,'#dfcca1',x-1,y-46,2,40);
  rect(c,'#f8e6a7',x-2,y-49,5,3);
  // Move the fly edge freely while the hoist stays on the pole.
  const clothY=(dx,dy)=>y-45+dy + dx/21*(Math.sin(time*5.2+dx*.25)*2.2+dy*.06);
  for(let i=0;i<5;i++) {
    const left=i*4.2,right=left+4.2;
    for(let j=0;j<3;j++){
      const top=j*4.4,bottom=top+4.5;
      c.fillStyle=(i+j)%2?'#384957':'#fff2cd';c.beginPath();
      c.moveTo(x+2+left,clothY(left,top));c.lineTo(x+2+right+.12,clothY(right,top));
      c.lineTo(x+2+right+.12,clothY(right,bottom));c.lineTo(x+2+left,clothY(left,bottom));c.closePath();c.fill();
    }
  }
}

function enemy(c, actor, camera, state) {
  if (!actor.alive) return;
  const x = actor.x + actor.w/2 - camera;
  if (x < -30 || x > WIDTH+30) return;
  drawBeast(c,actor,camera,state.time);
  const frightened = state.heroId === 'dad' && state.abilityTime > 0;
  if (actor.dance > 0 || actor.stun > 0 || frightened) {
    drawEnemyReaction(c,actor,x,actor.y,state.time,frightened);
  }
}

function groundShadow(c,level,hero,camera) {
  const x=hero.x+hero.w/2,feet=hero.y+hero.h;
  let ground=Infinity;
  for(const p of level.platforms) {
    if(x>=p.x && x<=p.x+p.w && p.y>=feet-.01 && p.y<ground) ground=p.y;
  }
  const height=Math.max(0,ground-feet);
  if(height>82) return;
  const near=1-height/82;
  c.save();c.globalAlpha=.12+.27*near;
  c.fillStyle='#121923';c.beginPath();c.ellipse(x-camera,ground-.15,3.1+3.3*near,.65+.42*near,0,0,Math.PI*2);c.fill();
  c.restore();
}

function drawEndEncounter(c, dragon, camera, time) {
  if (!dragon) return;
  const progress = Math.min(1, dragon.age / dragon.duration);
  for (const spot of dragon.targets) {
    const x = spot.x - camera;
    if (!spot.released && x > -spot.radius && x < WIDTH + spot.radius) {
      drawDragonWarning(c,x,spot.y-spot.height/2,spot.radius,spot.height/2,
        dragon.phase === 'warning' ? progress : 1,time);
    }
  }
  for (const cloud of dragon.clouds) {
    const x = cloud.x - camera;
    if (x > -cloud.radius && x < WIDTH + cloud.radius) {
      drawDragonCloud(c,x,cloud.y-cloud.height/2,cloud.radius,cloud.height/2,cloud.age,cloud.duration,cloud.x);
    }
  }
  const x = dragon.x-camera;
  if (x < -55 || x > WIDTH+55) return;
  let fold = 0, breath = 0, target;
  if (dragon.phase === 'warning') {
    fold = progress ** 2 * .65;
    breath = progress ** 2 * .6;
  } else if (dragon.phase === 'dive') {
    fold = .65 + .3 * Math.sin(Math.PI * progress);
    breath = .6 + .4 * Math.min(1, progress*2);
  } else if (dragon.phase === 'recover') {
    fold = .65 * (1-progress) ** 2;
  }
  const drop = dragon.clouds.at(-1);
  if (drop && drop.age < .23 && (dragon.phase === 'dive' || dragon.phase === 'recover')) {
    target = {x:drop.x-camera, y:drop.y-drop.height*.64};
    breath = Math.max(.05, 1-(drop.age/.23)**3);
  }
  drawDragon(c,{x,y:dragon.y,dir:dragon.dir,pitch:dragon.pitch,dive:fold,breath,time,scale:1.12},target);
}

export function drawRun(canvas,state) {
  const c=configureBoard(canvas,WIDTH,HEIGHT),level=state.level,hero=state.player;
  c.imageSmoothingEnabled=true;
  const t=THEMES[level.id], time=state.time;
  const camera=Math.max(0,Math.min(level.width-WIDTH,hero.x-146));
  const scene=sceneFor(canvas,level);
  drawLandscape(c,t,scene,level,camera);
  drawDepth(c,level,camera,time,WIDTH,HEIGHT);
  if(state.solo) drawSoundWave(c,state.solo,camera);
  const density=scene.terrain.width/level.width;
  c.drawImage(scene.terrain,camera*density,0,WIDTH*density,scene.terrain.height,0,0,WIDTH,HEIGHT);
  const post=level.checkpoint, end=level.flag;
  if(post.x>=camera-12 && post.x<camera+WIDTH+12) checkpoint(c,Math.round(post.x-camera),post.y,state.checkpointReached,time);
  if(end.x>=camera-30 && end.x<camera+WIDTH+8) flag(c,Math.round(end.x-camera),end.y,t,time);
  for(const item of state.gems) {
    if(!item.taken && item.x>camera-9 && item.x<camera+WIDTH+9) gem(c,item.x-camera,item.y,time);
  }
  if (level.id === 'nether') drawNetherEffects(c,state,camera,WIDTH);
  drawEndEncounter(c,state.dragon,camera,time);
  drawWarnings(c,state.enemies,camera,WIDTH);
  drawMonsterEffects(c,state.monsterEffects,camera,WIDTH);
  for(const actor of state.enemies) enemy(c,actor,camera,state);
  const cx=hero.x+hero.w/2-camera,cy=hero.y+hero.h/2;
  groundShadow(c,level,hero,camera);
  drawAbility(c,state,cx,cy,false,WIDTH);
  c.save();
  if(state.invulnerable>0 && Math.floor(time*8)%2===1) c.globalAlpha=.55;
  if(state.heroId==='mom' && state.abilityTime>0) c.globalAlpha*=invisibleOpacity(state);
  drawHero(c,state,camera);
  c.restore();
  drawAbility(c,state,cx,cy,true,WIDTH);
  const songAge = performanceAge(state);
  if (songAge !== null) drawSoloNotes(c,songAge,cx,cy,hero.facing);
}
