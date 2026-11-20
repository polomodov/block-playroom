import { stonePaving } from '../classic-arcade-art.js';
// Near and far materials, side scenery, and the two original family-game panorama sheets.
export const themes = {
  temple: {row:0, sky:'#abd6b6', haze:'#c2dcc0', land:'#375c48', shore:'#243e34', paving:['#79816a','#828871','#737d64'], edge:'#d5c68b', trim:'#86ecc0', wall:'#527a62', top:'#8fac77', side:'#334b44', props:[0,8], light:'#b6ffbc'},
  arcade: {row:1, sky:'#99c6e1', haze:'#e2bdd6', land:'#635983', shore:'#353858', paving:['#687191','#777c98','#677492'], edge:'#e1c99a', trim:'#5deddf', wall:'#c75676', top:'#ffad91', side:'#644368', props:[1,9,10], light:'#ffcf83'},
  waterpark: {row:2, sky:'#8bd3ec', haze:'#c7f0f5', land:'#28a4ba', shore:'#167688', paving:['#71a8a3','#78b2ae','#76a8ad'], edge:'#f1dfb3', trim:'#95faf5', wall:'#198fab', top:'#76daf1', side:'#275d87', props:[2,11,12], light:'#fff4a7'},
  store: {row:3, sky:'#b8cfdd', haze:'#ddd2af', land:'#8e7f6a', shore:'#5d5c56', paving:['#ac947a','#b09c81','#aa937e'], edge:'#d8c281', trim:'#fbd15c', wall:'#877355', top:'#d0af77', side:'#584a44', props:[3,13,14], light:'#fff1b2'},
  nether: {row:4, sky:'#874148', haze:'#d26648', land:'#d34b20', shore:'#682d31', paving:['#524554','#594652','#58424d'], edge:'#a8876f', trim:'#ffac57', wall:'#574559', top:'#937778', side:'#332e43', props:[4,15,16], light:'#ffd489'},
  castle: {row:5, sky:'#59658a', haze:'#9391ac', land:'#3d423e', shore:'#313745', paving:['#626177','#686478','#595c71'], edge:'#b2a99b', trim:'#ffc266', wall:'#6a647a', top:'#aaa1a7', side:'#403e57', props:[5,7,17], light:'#ffc567'},
  end: {row:6, sky:'#6a4c93', haze:'#ab87c2', land:'#39314d', shore:'#25263c', paving:['#71677c','#776e82','#6c697d'], edge:'#d0c9b3', trim:'#d8adff', wall:'#554266', top:'#9986a9', side:'#353246', props:[6,18,19], light:'#edafff'},
};

const images = new Map();
export function atlas(name) {
  let img=images.get(name);
  if (!img) {img=new Image(); img.src=new URL('./assets/'+name+'.webp'+(name==='runner-slide'||name==='runner-jump'?'?v=lossy-1':''),import.meta.url).href; images.set(name,img);}
  return img.complete && img.naturalWidth ? img : null;
}

export function poly(c,fill,points) {
  c.beginPath();c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.closePath();c.fillStyle=fill;c.fill();
}
export function line(c,color,width,points) {
  c.beginPath();c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
export function oval(c,x,y,rx,ry,color) {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function fill(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}

export function projection(width,height,s) {
  const aspect=width/height;
  const sky=height*(aspect>1.3?.36:.305), feet=height*.875;
  const lane=Math.min(width*.32,height*.427);
  const meters=120, focus=23, far=focus/(meters+focus);
  const phase=s.distance*.0065;
  return {sky,lane,feet,width,height,project:(distance,pos)=>{
    const size=focus/(Math.max(-12,distance)+focus);
    const q=(size-far)/(1-far);
    const bend=(1-Math.min(1,size))**2;
    const center=width/2+width*bend*(.088*Math.sin(phase+distance*.009)+.045*Math.sin(phase*.52+1));
    const stride=(s.player.x||0)*lane*.095*(1-Math.min(1,size));
    return {x:center+pos*lane*size-stride,y:sky+(feet-sky)*q,k:size,unit:Math.min(height*.207,lane*.97)*size,lane:lane*size};
  }};
}

export function backdrop(c,v,s,t) {
  const img=atlas(t.row<4?'world-panoramas':'realm-panoramas');
  fill(c,t.sky,0,0,v.width,v.height);
  if(img) {
    const row=t.row%4,rh=img.height/(t.row<4?4:3);
    // Keep the End panorama's painted dragon outside the view: the flying actor owns that sky.
    const sceneryWidth=t.row===6?img.width*.685:img.width;
    const panelH=v.sky*1.24, scale=Math.max(panelH/(rh-2),v.width/(sceneryWidth-6));
    const cropW=v.width/scale,cropH=panelH/scale, room=sceneryWidth-cropW;
    c.drawImage(img,room*(.5+.22*Math.sin(s.distance*.003)),row*rh+Math.max(1,(rh-cropH)*.40),cropW,cropH,0,0,v.width,panelH);
  }
  const horizon=c.createLinearGradient(0,v.sky*.82,0,v.height);
  horizon.addColorStop(0,t.haze+'00');horizon.addColorStop((v.sky*.42)/(v.height-v.sky*.82),t.land);
  horizon.addColorStop(.65,t.land);horizon.addColorStop(1,t.shore);
  c.fillStyle=horizon;c.fillRect(0,v.sky*.82,v.width,v.height-v.sky*.82);
}

function strip(c,v,d,near,left,right,color) {
  const a=v.project(d,left),b=v.project(d,right),m=v.project(near,right),n=v.project(near,left);
  poly(c,color,[a.x,a.y,b.x,b.y,m.x,m.y+.45,n.x,n.y+.45]);
}
// Perspective-mapped marks are baked once, then shared across the slabs of a world.
const tileSkins=new Map();
function tileSkin(t,index) {
  const key=t.row*3+index;
  if(tileSkins.has(key))return tileSkins.get(key);
  const skin=document.createElement('canvas');skin.width=192;skin.height=128;
  const g=skin.getContext('2d');
  stonePaving(g, t.row, index);
  let seed=(key+2)*997;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const grad=g.createLinearGradient(0,0,184,125);
  grad.addColorStop(0,'#fff9c610');grad.addColorStop(.7,'#12233100');grad.addColorStop(1,'#0b16291d');
  fill(g,grad,0,0,192,128);
  if(t.row===3){
    for(let k=0;k<3;k++){
      const x=k*64+11;line(g,'#583c3350',1.8,[x,0,x-1,128]);
      for(let j=0;j<4;j++){
        const rx=x+2+rand()*52,ry=rand()*96;
        g.beginPath();g.moveTo(rx,ry);g.bezierCurveTo(rx+4,ry+10,rx-2,ry+24,rx,ry+38);g.lineWidth=1.1;g.strokeStyle='#62432b33';g.stroke();
      }
    }
  }else if(t.row===2||t.row===1){
    for(let k=1;k<=2;k++){
      const x=k*64;fill(g,'#27485233',x-1,0,2,128);fill(g,'#effffd35',x+1,0,1.3,128);
    }
    fill(g,'#f8ffec2b',0,64,192,1.5);fill(g,'#26455322',0,65.5,192,1.7);
    if(index===0)for(const x of [13,177])for(const y of [12,113])poly(g,'#fff6d24a',[x-2.8,y,x,y-3.1,x+2.8,y,x,y+3.1]);
  }else{
    const x=32+rand()*125,y=72+rand()*26;
    line(g,'#313a3434',1.7,[x,128,x+4,y+17,x-4,y+9,x-2,y,x-12,y-7]);
    line(g,'#eef0c923',1,[x+2,128,x+6,y+17,x-2,y+9]);
    for(let j=0;j<8;j++){
      const u=rand()*180,b=rand()*123,ww=rand()*9+2;
      poly(g,j%2?'#faffda20':'#172d3324',[u,b,u+ww*.4,b-1.4,u+ww,b-1.3,u+ww+2,b+.4,u+1,b+1]);
    }
  }
  for(let k=0;k<100;k++){
    const x=rand()*192,y=rand()*128;
    fill(g,k%3?'#efffd312':'#122e3420',x,y,rand()*2.9+1,rand()*2.7+.7);
  }
  line(g,'#f4ecd133',1.8,[.5,126,.5,1,191,1]);
  tileSkins.set(key,skin);return skin;
}

function coatTile(c,v,near,far,lane,skin) {
  // Two affine bands keep stone grain and grout at the same vanishing point as the lane.
  const bands=near<23?3:1;
  for(let j=0;j<bands;j++){
    const a=v.project(far-(far-near)*j/bands,lane);
    const b=v.project(far-(far-near)*(j+1)/bands,lane);
    const dx=b.x-a.x;
    c.save();
    c.transform(1,0,dx/(b.y-a.y||1),1,a.x,a.y);
    const w=(a.lane+b.lane)*.244;
    c.drawImage(skin,0,j*skin.height/bands,skin.width,skin.height/bands,-w,0,w*2,b.y-a.y+.22);
    c.restore();
  }
}

function roadBank(c,v,t,d,i,side) {
  const n=Math.abs(Math.imul(i+89,2654435761)^Math.imul(side+4,51337));
  const pos=1.96+(n%141)/77;
  const p=v.project(d,side*pos),w=p.lane;
  const x=p.x,y=p.y, k=.22+((n>>>8)%15)*.018;
  if(x < -w || x>v.width+w)return;
  if(t.row===2||t.row===4) {
    poly(c,t.row===4?'#ff9c3e98':'#b4ffed73',[x-w*k,y,x-w*k*.44,y-w*.014,x+w*k*.21,y-w*.013,x+w*k,y,x+w*k*.11,y+w*.011]);
    poly(c,t.row===4?'#8e272d71':'#1d819d73',[x-w*k*.28,y+w*.026,x+w*k*.70,y+w*.018,x+w*k*.81,y+w*.025,x+w*k*.21,y+w*.032]);
  } else {
    const rock=t.row===0||t.row===5;
    const dh=w*(.025+((n>>>6)%15)*.003);
    poly(c,t.shore+'aa',[x-k*w*.8,y+dh*.1,x+k*w*.3,y-dh*.16,x+k*w*.67,y+dh*.22,x-k*w*.51,y+dh*.53]);
    poly(c,t.row===6?'#67517e':rock?'#65795a':t.top,[x-k*w*.65,y,x-k*w*.30,y-dh,x+k*w*.1,y-dh*.9,x+k*w*.35,y-dh*.16,x,y+dh*.14]);
    poly(c,t.row===6?'#4e4066':rock?'#4e654e':t.wall,[x+k*w*.1,y-dh*.9,x+k*w*.48,y-dh*.19,x+k*w*.35,y+dh*.12,x,y+dh*.14]);
    if(rock && i%2===0){
      for(let q=0;q<4;q++){
        const f=(q-1.5)*w*.036;
        poly(c,q%2?'#78945a':'#4e774b',[x+f*.3,y,x+f*1.9-w*.016,y-w*.10+q%2*w*.024,x+f*.7+w*.018,y]);
      }
    }
  }
}

export function drawTrack(c,v,s,t) {
  const first=Math.floor((s.distance-11)/3.5), last=Math.ceil((s.distance+120)/3.5);
  for(let i=last;i>=first;i--) {
    const near=i*3.5-s.distance,far=near+3.5, idx=(i%3+3)%3;
    for(const side of [-1,1])roadBank(c,v,t,near,i,side);
    strip(c,v,far,near,-1.63,1.63,t.side);
    for(const side of [-1,1]) {
      strip(c,v,far,near,side*1.51,side*1.61,i%2?t.edge:t.top);
      strip(c,v,far,near,side*1.49,side*1.515,t.trim);
    }
    for(const lane of [-1,0,1]) {
      const tile=t.paving[(idx+(lane+1)*2)%3];
      strip(c,v,far,near,lane-.492,lane+.492,tile);
      if(near<80)coatTile(c,v,near,far,lane,tileSkin(t,(idx+lane+1)%3));
      strip(c,v,near+.14,near,lane-.492,lane+.492,'#11192335');
      if(idx!==1) {
        const p=v.project(near+1.4,lane+(i%2?.29:-.28));
        fill(c,'#ede1bd27',p.x,p.y,p.lane*.075,p.k*.86);
      }
    }
    if(i%2===0)for(const mark of [-.5,.5])strip(c,v,near+2.1,near+1.2,mark-.012,mark+.012,'#ffefc599');
  }
  const far=v.project(119,0), haze=c.createLinearGradient(0,far.y-3,0,far.y+v.height*.16);
  haze.addColorStop(0,t.haze+'c4');haze.addColorStop(.6,t.haze+'30');haze.addColorStop(1,t.haze+'00');
  c.fillStyle=haze;c.beginPath();const left=v.project(119,-1.62),right=v.project(119,1.62);
  c.moveTo(left.x,left.y-1);c.lineTo(right.x,right.y-1);
  for(let d=119;d>=18;d-=5){const p=v.project(d,1.62);c.lineTo(p.x,p.y);}
  for(let d=18;d<=119;d+=5){const p=v.project(d,-1.62);c.lineTo(p.x,p.y);}
  c.fill();
}

// Perspective side faces look inward from both edges of the road.
export function box(c,x,y,w,h,depth,front,top,side) {
  const dx=depth,dy=-Math.abs(depth)*.55;
  poly(c,side,[x+w/2,y,x+w/2+dx,y+dy,x+w/2+dx,y-h+dy,x+w/2,y-h]);
  fill(c,front,x-w/2,y-h,w,h);
  poly(c,top,[x-w/2,y-h,x-w/2+dx,y-h+dy,x+w/2+dx,y-h+dy,x+w/2,y-h]);
  fill(c,'#fff1ce24',x-w/2,y-h,w,Math.min(h*.1,w*.035));
}
export function scenery(c,v,s,t,index,side,distance) {
  const big=index%3===0, img=big&&atlas('maze-landmarks');
  const pos=side*(big?2.16:1.73),p=v.project(distance,pos);
  const u=p.unit, w=p.lane;
  if(p.x < -w*2 || p.x>v.width+w*2 || p.y<0)return;
  if(img) {
    const cell=t.props[(Math.floor(Math.abs(index)/3)+(side===1?1:0))%t.props.length];
    const sx=cell%4*360,sy=Math.floor(cell/4)*240;
    const dw=Math.min(w*1.6,u*2.25), dh=dw*2/3;
    oval(c,p.x,p.y+u*.015,dw*.43,dh*.085,'#18232e55');
    c.drawImage(img,sx+2,sy+2,356,236,p.x-dw/2,p.y-dh,dw,dh);
  }else {
    const tall=(index%3===1?.58:.29)*u;
    oval(c,p.x+u*.088,p.y+u*.013,u*.18,u*.033,'#16273147');
    box(c,p.x,p.y,u*.19,tall,u*.047,t.wall,t.top,t.side);
    box(c,p.x,p.y-tall,u*.24,u*.05,u*.048,t.side,t.edge,t.wall);
    box(c,p.x,p.y,u*.23,u*.065,u*.036,t.side,t.top,t.wall);
    if(index%3===1){
      for(const y of [.22,.45])box(c,p.x,p.y-u*y,u*.192,u*.021,u*.025,t.top,t.edge,t.side);
      box(c,p.x,p.y-tall-u*.05,u*.105,u*.14,u*.026,t.light,'#fff9cd',t.trim);
      box(c,p.x,p.y-tall-u*.19,u*.19,u*.04,u*.03,t.wall,t.edge,t.side);
    }
  }
}
