import { backdrop, drawTrack, projection, scenery, themes } from './scene-art.js?v=jump-1';
import { runner, pursuer, trackObject } from './actors.js?v=jump-1';
import { drawDragon } from './dragon-art.js';

function skyDragon(c,v,s) {
  const dragon=s.dragon;
  if(s.worldId!=='end')return;
  const t=s.time, home={x:v.width*(.51+.29*Math.sin(t*.54)),y:v.sky*(.38+.12*Math.sin(t*.82))};
  if(!dragon){
    drawDragon(c,{...home,dir:Math.cos(t*.54)>=0?1:-1,time:t,scale:Math.min(v.width,v.height)*.00175});
    return;
  }
  const p=dragon.progress, mark=v.project(Math.max(0,dragon.z-s.distance),dragon.lane),dir=dragon.lane>=0?1:-1;
  const entry={x:v.width*(dir>0?.18:.82),y:v.sky*.29}, low={x:mark.x-dir*.18*v.lane,y:mark.y-v.height*.14};
  const lerp=(a,b,t)=>a+(b-a)*t, ease=p*p*(3-2*p);
  let x,y,pitch,fold,breath,aim=null;
  if(dragon.phase==='warning'){
    x=lerp(home.x,entry.x,ease);y=lerp(home.y,entry.y,ease)-v.height*.035*Math.sin(p*Math.PI);
    pitch=.12*p;fold=.28*p;breath=.5*p;
  }else if(dragon.phase==='dive'){
    x=lerp(entry.x,low.x,ease);y=lerp(entry.y,low.y,ease);
    pitch=.66*Math.sin(p*Math.PI)+.15*p;fold=.42+.51*Math.sin(p*Math.PI);breath=.55+.45*p;
    if(p>.52)aim={x:mark.x,y:mark.y-mark.unit*.04};
  }else{
    x=lerp(low.x,home.x,ease);y=lerp(low.y,home.y,ease);pitch=-.56*Math.sin(p*Math.PI);
    fold=.4*(1-p);breath=Math.max(0,1-p*4);if(breath)aim={x:mark.x,y:mark.y-mark.unit*.10};
  }
  drawDragon(c,{x,y,dir,pitch,dive:fold,breath,time:t,scale:Math.min(v.height,v.width)*.0027},aim);
}

export function drawRun(canvas,state) {
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w || !h)return;
  const density=Math.min(2.5,window.devicePixelRatio||1,1800/Math.max(w,h)), bw=Math.round(w*density),bh=Math.round(h*density);
  if(canvas.width!==bw || canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
  const c=canvas.getContext('2d',{alpha:false});c.setTransform(bw/w,0,0,bh/h,0,0);c.imageSmoothingEnabled=true;
  const v=projection(w,h,state),t=themes[state.worldId]||themes.temple;
  backdrop(c,v,state,t);drawTrack(c,v,state,t);
  // Distance-ordering makes full-height obstacles briefly pass in front of the runner.
  const queue=[];
  for(let side of [-1,1]){
    const offset=side===-1?0:7,first=Math.floor((state.distance-10-offset)/12);
    for(let i=first;i<=first+12;i++){
      const d=i*12+offset-state.distance;
      if(d>=-10&&d<=115)queue.push({d,side,index:i});
    }
  }
  for(const obj of state.objects){const d=obj.z-state.distance;if(d>=-9&&d<=115)queue.push({d,obj});}
  queue.push({d:0,hero:true});
  if(state.worldId==='end')queue.push({d:state.dragon?Math.max(1,state.dragon.z-state.distance-.3):99,dragon:true});
  queue.sort((a,b)=>b.d-a.d);
  for(const item of queue){
    if(item.obj)trackObject(c,v,state,t,item.obj);
    else if(item.hero)runner(c,v,state);
    else if(item.dragon)skyDragon(c,v,state);
    else scenery(c,v,state,t,item.index,item.side,item.d);
  }
  pursuer(c,v,state);
  if(state.invulnerable>1.05){
    const opacity=Math.min(.2,(state.invulnerable-1.05)*.40);
    const vignette=c.createRadialGradient(w*.5,h*.55,h*.21,w*.5,h*.50,Math.max(w,h)*.67);
    vignette.addColorStop(0,'#ed785500');vignette.addColorStop(1,'rgba(255,114,86,'+opacity+')');
    c.fillStyle=vignette;c.fillRect(0,0,w,h);
  }
}
