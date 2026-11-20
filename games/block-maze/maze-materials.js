// Light from the upper left gives the walls, fixtures and gems the same depth.
const palettes = {
  temple: { floor: ['#16332f','#223f36'], glint: '#9eec98', beam: '#f8c86c', material: 'stone' },
  arcade: { floor: ['#24253e','#34365a'], glint: '#88dbe9', beam: '#ff86ac', material: 'enamel' },
  waterpark: { floor: ['#15333e','#215561'], glint: '#8ff6ed', beam: '#73dfff', material: 'tile' },
  store: { floor: ['#373637','#494744'], glint: '#f8d68b', beam: '#ffb968', material: 'wood' },
  nether: { floor: ['#2b1e2e','#4b313b'], glint: '#f09b65', beam: '#ff7143', material: 'basalt' },
  castle: { floor: ['#211d34','#373049'], glint: '#c2b3ef', beam: '#ffaa67', material: 'slate' },
  end: { floor: ['#242334','#37314a'], glint: '#e5cf99', beam: '#c398ff', material: 'porous' },
};

function glow(c, x, y, radius, paint) {
  const grad = c.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, paint + '50');
  grad.addColorStop(.42, paint + '27');
  grad.addColorStop(1, paint + '00');
  c.fillStyle = grad;
  c.fillRect(x-radius, y-radius, radius*2, radius*2);
}

function line(c, color, width, points) {
  c.beginPath();
  c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.strokeStyle=color;
  c.lineWidth=width;
  c.stroke();
}

function grain(c, seed, count, width, height) {
  for(let i=0;i<count;i++) {
    const value=(seed*11+137*i)%227;
    const x=.8+value/227*(width-1.6), y=.8+((value*87)%199)/199*(height-1.6);
    c.fillStyle=i%3 ? '#fffae421' : '#090d191e';
    c.fillRect(x,y,.32+(value%11)/13,.32+(value%3)/12);
  }
}

export function tileFinish(c, level, map, col, row, unit, seed) {
  const tone=palettes[level], here=map[row][col];
  const north=map[row-1]?.[col]==='#', south=map[row+1]?.[col]==='#';
  const west=map[row][col-1]==='#', east=map[row][col+1]==='#';
  c.save();
  c.translate(col*unit,row*unit);
  if (here==='.') {
    const g=c.createLinearGradient(0,0,unit,unit);
    g.addColorStop(0,tone.floor[1]); g.addColorStop(1,tone.floor[0]);
    c.fillStyle=g; c.fillRect(0,0,unit,unit);
    // Near-invisible grout and edge highlights leave a dark bed for the emeralds.
    line(c,'#050c153e',.68,[unit-.3,0,unit-.3,unit-.3,0,unit-.3]);
    line(c,'#f7fff30d',.55,[.3,unit,.3,.4,unit,.4]);
    grain(c,seed,8,unit,unit);
    if (tone.material==='tile' || tone.material==='enamel') {
      line(c,tone.glint+'20',.49,[2,3.7,2,2,4.7,2]);
      if ((col+row)%2===0) line(c,'#ffffff14',.55,[10,19,19,10]);
    } else if(seed%4===0) {
      line(c,'#f0edd310',.53,[1,15,5,14.6,7,15.2,8,14.8]);
    }
    if(north) {
      const shadow=c.createLinearGradient(0,0,0,6.2);
      shadow.addColorStop(0,'#08101b90');shadow.addColorStop(1,'#08101b00');
      c.fillStyle=shadow;c.fillRect(0,0,unit,6.2);
    }
    if(west) {
      const shadow=c.createLinearGradient(0,0,4.5,0);
      shadow.addColorStop(0,'#08101b66');shadow.addColorStop(1,'#08101b00');
      c.fillStyle=shadow;c.fillRect(0,0,4.5,unit);
    }
  } else if(here==='~') {
    c.beginPath();c.rect(0,0,unit,unit);c.clip();
    const melt=c.createLinearGradient(0,0,0,unit);
    melt.addColorStop(0,'#e45822');melt.addColorStop(.52,'#f37c28');melt.addColorStop(1,'#e45822');
    c.fillStyle=melt;c.fillRect(0,0,unit,unit);
    for(let vein=-1;vein<6;vein++) {
      const center=vein*5.4, phase=(col*unit+center)*.13;
      c.beginPath();
      for(let py=0;py<=unit;py+=.5) {
        const wy=row*unit+py;
        const px=center+2.7*Math.sin(wy*.08+phase)+1.2*Math.sin(wy*.23+phase);
        if(!py)c.moveTo(px,py);else c.lineTo(px,py);
      }
      c.strokeStyle=vein%2===0?'#ffb536b0':'#8f362b72';c.lineWidth=vein%2===0?1.5:1.1;c.stroke();
    }
    if(map[row][col-1]!=='~'||map[row][col+1]!=='~') {
      const left=map[row][col-1]!=='~', edge=left?0:unit;
      const margin=c.createLinearGradient(edge,0,edge+(left?4:-4),0);
      margin.addColorStop(0,'#59272d');margin.addColorStop(.45,'#aa3f1973');margin.addColorStop(1,'#ff660000');
      c.fillStyle=margin;c.fillRect(left?0:unit-4,0,4,unit);
    }
  } else if(here==='#') {
    const h=south ? unit : unit-5;
    const glaze=c.createLinearGradient(0,0,unit,h);
    glaze.addColorStop(0,'#fff1c52b');glaze.addColorStop(.50,'#dbf6ed03');glaze.addColorStop(1,'#07122147');
    c.fillStyle=glaze;c.fillRect(0,0,unit,h);
    grain(c,seed,13,unit,h);
    if(!north) line(c,tone.glint+'c0',.75,[.5,1.45,unit-1,1.45]);
    if(!west) line(c,'#fff6d770',.6,[1.4,1.8,1.4,h-.6]);
    if(!east) line(c,'#13202b88',1.05,[unit-.55,.7,unit-.55,h-.4]);
    if(!south) {
      const side=c.createLinearGradient(0,h,0,unit);
      side.addColorStop(0,'#11141a10');side.addColorStop(.75,'#10101948');side.addColorStop(1,'#080920a6');
      c.fillStyle=side;c.fillRect(0,h,unit,unit-h);
      line(c,tone.glint+'80',.7,[.8,h-.45,unit-.8,h-.45]);
    }
    const offset=3+seed%8;
    if(tone.material==='wood') {
      for(let k=0;k<3;k++){
        c.beginPath(); c.moveTo(2,3+k*3.4);
        c.bezierCurveTo(8,2+k*3,11,5+k*3,18,3.5+k*3);
        c.lineWidth=.45;c.strokeStyle='#5c3b3255';c.stroke();
      }
    } else if(tone.material==='enamel'||tone.material==='tile') {
      c.beginPath();c.roundRect(1.2,1.2,unit-2.4,h-2.1,1.4);
      c.strokeStyle=tone.glint+'62';c.lineWidth=.65;c.stroke();
      if(seed%3===0)line(c,'#f3ffff86',.8,[3.4,4.5,4.4,3.2,8.1,3.2]);
    } else if(tone.material==='porous') {
      c.fillStyle='#685d5c5c';c.beginPath();c.ellipse(offset,6,1.75,.9,-.3,0,Math.PI*2);c.fill();
      line(c,'#fff5c79e',.52,[offset-1.4,6.8,offset,7,offset+1.5,6.4]);
    } else if (seed%5<=1) {
      line(c,tone.material==='basalt'?'#ffa55b88':'#24313d66',.65,[offset,2,offset+2.8,4.5,offset+1.5,6.4,offset+4.2,8.4]);
    }
  }
  c.restore();
}

export function lightScene(c,state,unit) {
  const tone=palettes[state.levelId], w=state.width*unit,h=state.height*unit;
  const vignette=c.createRadialGradient(w*.50,h*.49,w*.15,w*.50,h*.49,w*.62);
  vignette.addColorStop(0,'#0b0d2100');vignette.addColorStop(1,'#0b0d2148');
  c.fillStyle=vignette;c.fillRect(0,0,w,h);
  for (const d of state.decorations) {
    const x=(d.x+d.width*.5)*unit, y=(d.y+d.height*.46)*unit;
    glow(c,x,y,Math.max(35,d.width*unit*.74),d.type==='cauldron'?'#8de8a7':tone.beam);
  }
}

const gemSheets=new Map();
export function drawGem(c,x,y,flare) {
  if(!gemSheets.has(flare)){
    const sprite=document.createElement('canvas');sprite.width=64;sprite.height=64;
    const g=sprite.getContext('2d');g.scale(4,4);g.translate(8,8);
    glow(g,0,0,7.5,'#42cc8b');
    g.fillStyle='#0b2328a6';g.beginPath();g.ellipse(.4,4,3.9,1.1,0,0,Math.PI*2);g.fill();
    const outer=new Path2D('M -1.25 -4.8 L 2.4 -3.7 L 4.0 -1.55 L 3.45 2.2 L .25 4.3 L -3.2 2.65 L -3.85 -.65 L -3 -3 Z');
    const paint=g.createLinearGradient(-3,-4,3.4,4);
    paint.addColorStop(0,'#ecffe3');paint.addColorStop(.34,'#7cfbb6');paint.addColorStop(.55,'#1ec889');paint.addColorStop(1,'#126155');
    g.fillStyle=paint;g.fill(outer);g.strokeStyle='#16493f';g.lineWidth=.63;g.stroke(outer);
    g.fillStyle='#e3ffde';g.fill(new Path2D('M-3 -2.8 L-1.2 -4.4 L1.5 -3.65 L-.65 -1.9 Z'));
    g.fillStyle='#89fbb9';g.fill(new Path2D('M-2.55 -2.25 L-.75 -1.65 L-.55 1.6 L-2 2.35 L-3.15 .8 Z'));
    g.fillStyle='#24ae83';g.fill(new Path2D('M1.7 -2.8 L3.65 -1.5 L3.1 1.55 L1.3 1.4 Z'));
    line(g,'#b7ffd79c',.5,[-1.8,2.5,.25,3.8,1.65,2.9]);
    if(flare) {
      g.fillStyle='#f2fff4';g.fill(new Path2D('M-2 -6 L-1.45 -3.5 L.7 -3 L-1.5 -2.6 L-2 -.2 L-2.55 -2.5 L-4.7 -3 L-2.6 -3.5 Z'));
    }
    gemSheets.set(flare,sprite);
  }
  c.drawImage(gemSheets.get(flare),x-8,y-8,16,16);
}

export function landmarkBounds(d, unit) {
  const width=d.width*unit, height=d.height*unit;
  const h=Math.min(height-2,(width-2)/1.5), w=h*1.5;
  return { x:d.x*unit+(width-w)/2, y:d.y*unit+height-h-1, w, h };
}

export function animateLandmark(c,d,unit,time) {
  const {x,y,w,h}=landmarkBounds(d,unit);
  c.save();
  c.translate(x,y);c.scale(w,h);
  const phase=time*3;
  if(d.type==='wave_pool'||d.type==='typhoon'||d.type==='water_slide') {
    const cx=d.type==='typhoon'?.62:d.type==='water_slide'?.44:.48;
    const cy=d.type==='typhoon'?.47:d.type==='water_slide'?.86:.62;
    for(let i=0;i<2;i++) {
      const t=(time*.7+i*.5)%1;
      c.globalAlpha=.7*(1-t);
      c.beginPath();c.ellipse(cx,cy,.019+.085*t,.008+.023*t,-.12,.13,2.68);
      c.strokeStyle='#e6ffff';c.lineWidth=.008;c.stroke();
    }
  } else if(d.type==='carousel') {
    for(let i=0;i<7;i++) {
      c.globalAlpha=.5+.45*Math.cos(phase+i);
      c.fillStyle='#fff4bc';
      c.beginPath();c.ellipse(.21+i*.097,.84+.045*Math.sin(i*Math.PI/6),.008,.009,0,0,Math.PI*2);c.fill();
    }
  } else if(d.type==='brazier'||d.type==='cauldron') {
    const fire=d.type==='brazier';
    for(let i=0;i<3;i++) {
      const t=(time*(fire?.8:.6)+i/3)%1;
      c.globalAlpha=Math.sin(t*Math.PI)*.85;
      c.fillStyle=fire?'#ffca74':'#cbffb5';
      c.beginPath();c.ellipse((fire?.26+i*.22:.4+i*.055)+Math.sin(phase+i)*.012,(fire?.33:.25)-t*.18,.008,.016,0,0,Math.PI*2);c.fill();
    }
  }
  c.restore();
}

export function boardingMarks(c,ride,unit) {
  for(const [col,row] of [ride.entry,ride.exit]) {
    const x=(col+.5)*unit,y=(row+.5)*unit;
    for(const side of [-1,1]) {
      const cx=x+side*6.9;
      line(c,'#153c4b',2.7,[cx-1.8,y+.85,cx,y-1.7,cx+1.8,y+.85]);
      line(c,'#ffe997',1.15,[cx-1.8,y+.85,cx,y-1.7,cx+1.8,y+.85]);
    }
  }
}


const riverTiles=new WeakMap();
export function lavaShimmer(c,state,unit) {
  let cells=riverTiles.get(state.map);
  if(!cells) {
    cells=[];
    state.map.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==='~')cells.push([x,y]);});
    riverTiles.set(state.map,cells);
  }
  c.save();
  for(const [col,row] of cells) {
    const phase=state.time*.5+col*.73+row*.39,t=phase%1;
    const x=(col+.3+.16*Math.sin(phase*5))*unit,y=(row+.76-.4*t)*unit;
    c.globalAlpha=Math.sin(t*Math.PI)*.8;
    c.beginPath();c.ellipse(x,y,1.1+t,.55+t*.5,0,Math.PI,2*Math.PI);
    c.strokeStyle='#ffe58e';c.lineWidth=.7;c.stroke();
  }
  c.restore();
}
