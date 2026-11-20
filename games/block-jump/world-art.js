// Foreground materials keep a bright, continuous top edge at the exact collision height.
export const THEMES = {
  temple:    { sheet: 'world', row: 0, sky: '#638a82', fog: '#355b51', abyss: '#20413d', rim: '#d6df79', top: '#71a452', shade: '#475f52', face: '#73846d', light: '#9aab84', joint: '#475957', accent: '#e7ba54' },
  arcade:    { sheet: 'world', row: 1, sky: '#503865', fog: '#513c66', abyss: '#302943', rim: '#ffdd8b', top: '#ef9558', shade: '#5c4f83', face: '#807cb1', light: '#9cadd1', joint: '#42415f', accent: '#f58c99' },
  waterpark: { sheet: 'world', row: 2, sky: '#528fa8', fog: '#26677a', abyss: '#175671', rim: '#feefbc', top: '#e2bd6c', shade: '#367f87', face: '#57a8aa', light: '#94c6b9', joint: '#346a78', accent: '#ff8a54' },
  store:     { sheet: 'world', row: 3, sky: '#696c76', fog: '#536066', abyss: '#343e49', rim: '#ffe8a2', top: '#dfad56', shade: '#785e49', face: '#aa8056', light: '#c89b6a', joint: '#584c46', accent: '#edbd43' },
  nether:    { sheet: 'realm', row: 0, sky: '#6c3444', fog: '#652f3d', abyss: '#802f31', rim: '#d69a85', top: '#8f6572', shade: '#513842', face: '#72505a', light: '#90676b', joint: '#49313e', accent: '#ffad4b' },
  castle:    { sheet: 'realm', row: 1, sky: '#35485c', fog: '#384157', abyss: '#272c40', rim: '#c5bfd1', top: '#8d86a1', shade: '#4a425a', face: '#695f78', light: '#908198', joint: '#423b51', accent: '#ffad54' },
  end:       { sheet: 'realm', row: 2, sky: '#45305c', fog: '#493556', abyss: '#2b223f', rim: '#f2e3b2', top: '#cbc497', shade: '#777469', face: '#b2ac8c', light: '#d2c8a3', joint: '#77746e', accent: '#e9a4ed' },
};

export function rect(c, ink, x, y, w, h) {
  c.fillStyle = ink;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

// These layers are painted once per course. Sub-pixel bevels stay sharp on Retina displays.
function layerCanvas(width,height) {
  const image=document.createElement('canvas');
  image.width=width*2; image.height=height*2;
  const c=image.getContext('2d');
  c.scale(2,2);
  return {image,c};
}

function line(c,ink,x,y,tx,ty,weight=1) {
  c.strokeStyle=ink; c.lineWidth=weight;
  c.beginPath(); c.moveTo(x,y); c.lineTo(tx,ty); c.stroke();
}

function gradient(c,y,h,stops) {
  const g=c.createLinearGradient(0,y,0,y+h);
  for(const [position,color] of stops) g.addColorStop(position,color);
  return g;
}

function facet(c,color,points) {
  c.fillStyle=color; c.beginPath();
  for(let i=0;i<points.length;i+=2) {
    if(i===0) c.moveTo(points[i],points[i+1]); else c.lineTo(points[i],points[i+1]);
  }
  c.closePath(); c.fill();
}

function vine(c,x,y,length) {
  c.strokeStyle='#48673f'; c.lineWidth=.9;
  c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x-1.2,y+length*.6,x+.5,y+length); c.stroke();
  for(let dy=2;dy<length;dy+=3.5) {
    const side=dy%7<3 ? 1 : -1;
    facet(c,side===1?'#82a854':'#557c49',[x,y+dy+1,x+side*3,y+dy-1,x+side*2,y+dy+2,x,y+dy+3]);
  }
}

const blocks = {
  temple:[24,12], arcade:[34,14], waterpark:[9,9], store:[44,8],
  nether:[21,12], castle:[26,11], end:[22,13],
};

function blockFinish(c,id,t,x,y,w,h,seed) {
  if(id==='store') {
    c.strokeStyle='rgba(76,44,32,.34)'; c.lineWidth=.55; c.beginPath();
    c.moveTo(x+2,y+h*.42);
    c.bezierCurveTo(x+w*.36,y+h*.16,x+w*.65,y+h*.90,x+w-2,y+h*.49);
    c.stroke();
    if(seed%3===0) {
      c.beginPath(); c.ellipse(x+w*.61,y+h*.48,2.6,.72,-.06,0,Math.PI*2); c.stroke();
    }
  } else if(id==='arcade') {
    for(const dx of [2,w-3]) {
      c.fillStyle=t.shade; c.beginPath(); c.arc(x+dx,y+2,.85,0,Math.PI*2); c.fill();
      line(c,'#c5c5da',x+dx-.5,y+1.8,x+dx+.2,y+1.5,.45);
    }
    line(c,'rgba(211,213,243,.42)',x+5,y+h-3,x+w-7,y+h-3,.65);
  } else if(id==='waterpark') {
    facet(c,'rgba(224,255,250,.14)',[x+.8,y+.7,x+w-1,y+.7,x+w-2,y+2,x+1,y+h*.54]);
    if(seed%5===0) {
      line(c,'rgba(239,255,250,.45)',x+1.4,y+h-2.3,x+3.4,y+h-2.8,.4);
    }
  } else if(id==='end') {
    for(let i=0;i<3;i++) {
      const cx=x+2+((seed+i*37)%(w-5)),cy=y+3+(seed*(i+1)%(h-6));
      facet(c,'rgba(88,74,65,.30)',[cx,cy,cx+2,cy-.6,cx+3.3,cy+1,cx+1.5,cy+2,cx-.8,cy+.9]);
      line(c,'rgba(249,231,183,.55)',cx-.5,cy+1,cx+1.3,cy+2,.45);
    }
  } else {
    // A split facet on hand-cut stone and pinholes in its lit top edge.
    facet(c,'rgba(28,38,50,.12)',[x+w-4,y+1,x+w-.6,y+1,x+w-.6,y+h-1,x+w-2,y+h-2,x+w-3,y+h*.52]);
    if(seed%4===0) {
      line(c,'rgba(30,34,39,.42)',x+w*.26,y+1.5,x+w*.32,y+3.5,.6);
      line(c,'rgba(30,34,39,.42)',x+w*.32,y+3.5,x+w*.26,y+h*.65,.56);
    }
    for(let i=0;i<3;i++) {
      const cx=x+2+((seed*7+i*19)%(w-5)),cy=y+2+((seed*11+i*7)%(h-4));
      line(c,i===1?'rgba(247,238,207,.30)':'rgba(38,39,46,.23)',cx,cy,cx+1+(seed%3),cy-.45,.45);
    }
  }
}

function platformFace(c,t,id,p) {
  const {x,y,w,h}=p, [bw,bh]=blocks[id];
  c.fillStyle=t.joint; c.fillRect(x,y,w,h);
  c.save(); c.beginPath(); c.rect(x+.65,y+3,w-1.3,h-3); c.clip();
  for(let row=0,py=y+4;py<y+h;row++,py+=bh) {
    const offset=(row%2 && id!=='waterpark') ? bw/2 : 0;
    const paint=gradient(c,py,bh,[[0,t.light],[.18,t.face],[.75,t.face],[1,t.shade]]);
    for(let px=x-offset;px<x+w;px+=bw) {
      const seed=Math.abs((px*47 + py*23)%103)|0;
      c.fillStyle=paint; c.fillRect(px+.5,py+.4,bw-.8,bh-.65);
      c.fillStyle='rgba(24,27,38,'+(seed%13)/110+')';
      c.fillRect(px+.5,py+.4,bw-.8,bh-.65);
      line(c,'rgba(251,244,208,.38)',px+1,py+bh-1.3,px+1,py+1,.54);
      line(c,'rgba(251,244,208,.33)',px+1,py+.9,px+bw-1.3,py+.9,.48);
      blockFinish(c,id,t,px,py,bw,bh,seed);
    }
  }
  if(id==='nether') {
    for(let px=x+12;px<x+w;px+=49) {
      const py=y+14+(px%15);
      c.save(); c.shadowBlur=3; c.shadowColor='#fb743b';
      line(c,'#d78153',px,py,px+4,py-2,.85);
      line(c,'#ffb061',px+4,py-2,px+6,py+1,.75);
      line(c,'#e88f64',px+6,py+1,px+9,py,.65); c.restore();
    }
  }
  c.fillStyle=gradient(c,y,h,[[0,'rgba(12,19,27,.29)'],[.17,'rgba(12,19,27,.02)'],[1,'rgba(12,19,27,.32)']]);
  c.fillRect(x,y,w,h); c.restore();
}

function surface(c,t,id,p) {
  const {x,y,w}=p;
  c.fillStyle=gradient(c,y,5,[[0,t.rim],[.2,t.top],[.77,t.top],[1,t.shade]]);
  c.fillRect(x,y,w,5);
  line(c,'rgba(255,248,213,.76)',x+.5,y+.4,x+w-.5,y+.4,.65);
  for(let dx=3;dx<w-4;dx+=id==='waterpark'?11:16) {
    if(id==='temple') {
      const length=3+dx%5;
      facet(c,'#709052',[x+dx,y+2,x+dx+length,y+2.6,x+dx+length-2,y+5,x+dx+1,y+6]);
      if(dx%3===0) vine(c,x+dx+1,y+4,5+dx%8);
    } else if(id==='arcade') {
      facet(c,'#ffd58c',[x+dx+1,y+1.3,x+dx+6,y+1.3,x+dx+4,y+3.5,x+dx-1,y+3.5]);
    } else {
      line(c,t.shade,x+dx+1.1,y+1.1,x+dx,y+3.8,.68);
      line(c,t.rim,x+dx+1.9,y+1.1,x+dx+.8,y+3.6,.55);
    }
  }
}

function masonryDetail(c,id,t,x,y) {
  if(id==='temple') {
    rect(c,t.shade,x-8,y-4,17,9); rect(c,t.joint,x-6,y-5,13,11);
    for(let i=-3;i<=3;i++) rect(c,Math.abs(i)>1?t.light:t.face,x-3+Math.abs(i),y+i,7-2*Math.abs(i),1);
    rect(c,'#a2ba79',x-1,y-2,2,2);
    vine(c,x+9,y-8,10);
  } else if(id==='arcade') {
    rect(c,t.joint,x-12,y-5,25,10); rect(c,'#5f698b',x-11,y-4,23,8);
    for(const dx of [-7,0,7]) {
      rect(c,'#d9a88d',x+dx-1,y-1,3,3); rect(c,'#ffe0a1',x+dx-1,y-1,2,1);
    }
  } else if(id==='waterpark') {
    rect(c,t.shade,x-10,y-4,21,9); rect(c,t.light,x-9,y-3,19,7);
    for(let dx=-7;dx<9;dx+=4) rect(c,t.joint,x+dx,y-1,2,4);
  } else if(id==='store') {
    rect(c,t.joint,x-16,y-6,33,14); rect(c,t.face,x-15,y-5,31,12);
    for(let dx=-12;dx<=4;dx+=16) {
      rect(c,t.light,x+dx,y-3,10,8); rect(c,t.shade,x+dx+3,y-2,5,2);
    }
  } else if(id==='nether') {
    rect(c,t.joint,x-8,y-2,10,3); rect(c,t.shade,x-3,y-4,10,4);
    line(c,'#c67d67',x-5,y-2,x-1,y);
    rect(c,'#e29468',x,y,3,1); rect(c,'#a96c5b',x+3,y-2,2,2);
  } else if(id==='castle') {
    rect(c,t.joint,x-5,y-3,11,11); rect(c,t.joint,x-3,y-5,7,2);
    rect(c,t.light,x-5,y-4,2,8); rect(c,'#b78b6c',x-2,y-3,5,8);
    rect(c,'#e8ad6e',x-1,y-2,3,5); rect(c,t.joint,x,y-4,1,11);
    rect(c,t.shade,x-6,y+7,13,2);
  } else {
    for(const [dx,dy] of [[-6,0],[-3,-3],[0,-6],[3,-3],[6,0],[3,3],[0,6],[-3,3]]) {
      rect(c,'#94849a',x+dx,y+dy,3,2);
    }
    rect(c,'#d2c0c4',x,y-5,2,2); rect(c,'#9b8a99',x,y,2,2);
  }
}

function bridge(c,t,id,p) {
  const {x,y,w,h}=p;
  const depth=Math.max(4,Math.min(h,12));
  c.fillStyle=gradient(c,y,depth,[[0,t.top],[.42,t.shade],[1,t.joint]]);
  c.fillRect(x,y,w,depth);
  for(let i=1;i<w-3;i+=8) {
    const length=Math.min(7,w-i-1);
    c.fillStyle=gradient(c,y,3.5,[[0,t.rim],[.42,t.top],[1,t.face]]);
    c.fillRect(x+i,y,length,3.5);
    line(c,'rgba(255,246,211,.6)',x+i+.6,y+.6,x+i+length-.6,y+.6,.65);
  }
  for(let i=2;i+13<w;i+=16) {
    line(c,t.face,x+i,y+4,x+i+5,y+depth-1,1.8);
    line(c,t.light,x+i+5,y+depth-1,x+i+12,y+4,1.3);
    c.fillStyle=t.light;c.beginPath();c.arc(x+i+1,y+4.5,.8,0,Math.PI*2);c.fill();
  }
  line(c,t.light,x,y+depth-.7,x+w,y+depth-.7,.7);
}

function ledge(c,t,id,p) {
  const {x,y,w,h}=p;
  const body=gradient(c,y,h,[[0,t.rim],[.28,t.top],[.4,t.shade],[.54,t.face],[1,t.joint]]);
  facet(c,body,[x,y,x+w,y,x+w,y+h-2,x+w-2,y+h,x+2,y+h,x,y+h-2]);
  line(c,'rgba(255,249,217,.85)',x+.5,y+.45,x+w-.5,y+.45,.8);
  const section=id==='store'?21:12;
  for(let dx=4;dx<w-4;dx+=section) {
    line(c,'rgba(39,46,53,.44)',x+dx+.7,y+1,x+dx,y+h-1,.6);
    line(c,t.light,x+dx+1.5,y+1,x+dx+1,y+3,.5);
  }
  if(id==='arcade' || id==='waterpark') {
    const color=id==='arcade'?'#ffd882':'#bff8eb';
    line(c,t.accent,x+3,y+h-1.6,x+w-3,y+h-1.6,1.25);
    for(let dx=5;dx<w-4;dx+=8) line(c,color,x+dx,y+h-1.6,x+dx+2,y+h-1.6,.7);
  } else if(id==='temple') {
    vine(c,x+5,y+h-1,5+w%8);
    vine(c,x+w-11,y+h-1,3+w%5);
  } else if(id==='nether' || id==='end' || id==='castle') {
    for(let dx=7;dx<w-6;dx+=19) {
      const xx=x+dx, yy=y+h-1, drop=2+Math.abs(xx%3);
      facet(c,t.joint,[xx,yy,xx+8,yy,xx+5,yy+drop,xx+2,yy+drop-.5]);
      line(c,t.face,xx+.6,yy+.3,xx+2,yy+drop-1,.6);
    }
  }
}

export function terrainLayer(level,viewHeight) {
  const {image,c}=layerCanvas(level.width,viewHeight), t=THEMES[level.id];
  for(const p of level.platforms) {
    if(p.kind==='bridge') bridge(c,t,level.id,p);
    else if(p.kind==='ledge') ledge(c,t,level.id,p);
    else {
      platformFace(c,t,level.id,p);
      surface(c,t,level.id,p);
      const inset=32+(p.x%67);
      for(let dx=inset;dx<p.w-19;dx+=127) {
        if(p.h>27) masonryDetail(c,level.id,t,p.x+dx,p.y+19);
      }
    }
  }
  return image;
}

function farObject(c,id,t,x,y) {
  const dark=t.abyss, light=t.fog;
  if(id==='temple') {
    // Broken stepped masonry and jade shoots.
    rect(c,dark,x-15,y-7,31,7);
    rect(c,dark,x-9,y-12,20,6);
    rect(c,dark,x-5,y-25,10,16);
    rect(c,light,x-5,y-25,3,14);
    line(c,light,x+12,y-2,x+19,y-15,2);
    rect(c,light,x+17,y-17,6,3);
  } else if(id==='arcade') {
    rect(c,dark,x-2,y-28,4,28);
    rect(c,light,x-8,y-30,17,4);
    rect(c,dark,x-11,y-29,3,6);
    rect(c,dark,x+9,y-29,3,6);
    for(const dx of [-8,7]) { rect(c,dark,x+dx,y-25,1,12); rect(c,light,x+dx-2,y-13,5,2); }
    rect(c,dark,x-6,y-2,13,2);
  } else if(id==='waterpark') {
    rect(c,dark,x-9,y-18,3,18); rect(c,dark,x+8,y-16,3,16);
    line(c,light,x-17,y-21,x-4,y-21,3);
    line(c,light,x-4,y-21,x+8,y-10,3);
    rect(c,light,x+9,y-10,9,3);
  } else if(id==='store') {
    for(const dx of [-10,10]) rect(c,dark,x+dx,y-25,2,25);
    for(const dy of [-24,-14,-3]) rect(c,light,x-10,y+dy,22,2);
    rect(c,dark,x-7,y-10,9,7); rect(c,dark,x+3,y-20,6,6);
  } else if(id==='nether') {
    for(const [dx,h,w] of [[-11,10,8],[-5,22,10],[4,15,6]]) {
      rect(c,dark,x+dx,y-h,w,h);
      rect(c,light,x+dx+1,y-h,2,h-2);
    }
  } else if(id==='castle') {
    rect(c,dark,x-13,y-15,27,15);
    for(const dx of [-14,8]) {
      rect(c,dark,x+dx,y-23,7,23);
      rect(c,light,x+dx+1,y-27,5,4); rect(c,light,x+dx+3,y-30,1,3);
      rect(c,light,x+dx+2,y-17,2,5);
    }
  } else {
    rect(c,dark,x-3,y-23,6,23);
    rect(c,light,x-3,y-23,2,22);
    rect(c,dark,x-8,y-13,8,3);
    rect(c,dark,x-9,y-17,3,6);
    rect(c,dark,x+1,y-7,9,3);
    rect(c,dark,x+8,y-13,3,7);
    rect(c,light,x-4,y-26,6,4);
  }
}

export function midgroundLayer(level,viewWidth,viewHeight) {
  // An independent slower layer allows the skyline to slide behind the platforms.
  const width=viewWidth+Math.ceil((level.width-viewWidth)*.36);
  const {image,c}=layerCanvas(width,viewHeight), t=THEMES[level.id];
  const horizon=187;
  for(let i=0,x=-12;x<width+30;i++,x+=41) {
    const y=horizon + Math.round(3*Math.sin(i*1.64));
    rect(c,t.abyss,x,y,42,viewHeight-y);
    if(i%2===1) farObject(c,level.id,t,x+10,y);
  }
  return image;
}

// Sparse lights and airborne motes sit behind the play plane; their pace follows the weather.
const air = {
  temple: ['#e6edb3', .75, 2.4], arcade: ['#ffe9bf', 1, -1.9],
  waterpark: ['#ddf8fa', .85, -7], store: ['#ffeac9', .55, 1.6],
  nether: ['#ffc277', 1.05, -6], castle: ['#f8dea8', .8, -1.7], end: ['#eac7ff', 1, -2.5],
};
function driftingLight(c,id,time,camera,width) {
  const [color,size,speed]=air[id];
  c.save(); c.fillStyle=color;
  for(let i=0;i<15;i++) {
    const plane=.21+(i%3)*.13;
    const x=((i*137+Math.sin(time*.54+i*3.4)*3-camera*plane)%(width+10)+width+10)%(width+10)-5;
    const y=23+((i*83.7+time*speed)%147+147)%147;
    c.globalAlpha=.10+.20*(.5+.5*Math.sin(time*1.6+i*2.3));
    c.beginPath(); c.ellipse(x,y,size*(.7+i%3*.18),size*.63,-.52,0,2*Math.PI); c.fill();
  }
  c.restore();
}

export function drawDepth(c,level,camera,time,width,height) {
  const id=level.id,t=THEMES[id];
  driftingLight(c,id,time,camera,width);
  const hot=id==='nether', wet=id==='waterpark' || id==='temple';
  const base=hot ? 205 : 210;
  if(!hot && !wet) return;
  const water=id==='waterpark';
  const surface=hot?'#ffae56':water?'#86dbdc':'#80b7a7';
  c.fillStyle=gradient(c,base,Math.max(1,height-base),[
    [0,surface],[.16,hot?'#df693a':water?'#4199aa':'#50867e'],[1,t.abyss],
  ]);
  c.fillRect(0,base,width,height-base);
  for(let i=-1;i<width/12+1;i++) {
    const x=i*12-camera*.55%12;
    const wave=Math.sin(time*2+i*.78);
    const y=base+.35+wave*.75;
    line(c,surface,x,y,x+5+wave*2,y-.4,.75);
    if(hot && i%3===0) line(c,'#ffb458',x+5,y+3,x+8,y+2.6,.65);
  }
}
