import { beat, strokes } from './guitar.js?v=encore-1';

// The stage lights and characters use the same 120 BPM pulse as the guitar riff.
const notePalette = ['#ff91cd', '#8df7e8', '#ffe29b'];
const ink = '#27263c';

function path(d) { return new Path2D(d); }
const guitarBody = path('M-1.3 -2.4C.1 -3.1 .7 -4.8 2.6 -4.7Q4.6 -4.6 4.9 -2.9L5.7 -2.25 5.5 -.4Q4.2 -.3 3.9 1C3.65 3.2 4.1 4.3 1.6 5.1C-1.8 6.15 -5.8 5.1 -6.2 2.35C-6.6 .3 -5.45 -1.75 -3.6 -2.12Z');
const guitarShine = path('M-5.1 1.1C-4.7 -.7 -3.55 -1.2 -2.3 -1.22M.45 -2.6Q1.45 -3.9 2.48 -3.85');
const fretboard = path('M1 -1.6L10 -6.1 10.76 -4.8 1.7 -.2Z');
const headstock = path('M9.4 -6.36L12.1 -8.3 14.1 -7.85 14.15 -6.7 10.1 -4.7Z');
const strap = path('M-3.8 -6.2Q.2 -4.2 3.5 -.8');
const sole = path('M-1.52 -.9Q-.45 -1.6 .69 -1L2.17 -.42 2.05 .72 -1.55 .72Z');
const shine = path('M0 -2.5Q.18 -.3 1.85 0Q.32 .28 0 2.5Q-.22 .34 -1.85 0Q-.3 -.24 0 -2.5Z');
const noteStem = path('M.12 .1V-5.5Q2.6 -5.15 3.12 -3.2');
const noteHead = path('M.55 .04C.32 1.15 -1.2 1.78 -2.18 1.38C-3.4 .83 -2.87 -.52 -1.9 -.92C-.6 -1.51 .75 -1.3 .55 .04Z');
const coat = path('M-3.8 -6.75Q-.45 -7.6 2.65 -6.63L3.9 1.9 3.3 4.1Q.15 5.2 -4.75 3.95L-5.2 2.4Z');

function line(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i=2; i<points.length; i+=2) ctx.lineTo(points[i], points[i+1]);
  ctx.strokeStyle=color; ctx.lineWidth=width; ctx.stroke();
}
function draw(ctx, outline, fill, border, weight) {
  if (fill) { ctx.fillStyle=fill; ctx.fill(outline); }
  if (border) { ctx.strokeStyle=border; ctx.lineWidth=weight; ctx.stroke(outline); }
}
function oval(ctx,x,y,rx,ry,color) {
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function note(ctx,x,y,tilt,scale,color) {
  ctx.save();
  ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(scale,scale);ctx.lineCap='round';
  draw(ctx,noteStem,null,ink,2.55);draw(ctx,noteHead,ink,ink,1.4);
  draw(ctx,noteStem,null,color,1.15);draw(ctx,noteHead,color);
  ctx.restore();
}

export function drawChordWave(ctx, solo, tile) {
  const front = 1 + solo.age * solo.speed;
  ctx.save();
  ctx.lineCap='round';
  for (const [col,row,distance] of solo.cells) {
    const behind=front-distance;
    if (behind<0 || behind>=2.4) continue;
    const x=(col+.5)*tile, y=(row+.5)*tile, strength=1-behind/2.4;
    ctx.globalAlpha=strength*.17;
    ctx.fillStyle='#8df7de';ctx.fillRect(col*tile+1,row*tile+1,tile-2,tile-2);
    ctx.globalAlpha=strength*.84;
    const radius=2.1+behind*2.25;
    ctx.beginPath();ctx.ellipse(x,y+3.6,radius*1.4,radius*.56,0,.1,Math.PI*.95);
    ctx.strokeStyle='#a9ffe7';ctx.lineWidth=1.05;ctx.stroke();
    if (distance>0 && (col+row)%3===0) {
      note(ctx,x+1,y-1-behind*2,.12,.6,notePalette[(col+row)%3]);
    }
  }
  ctx.restore();
}

export function danceFloor(ctx,x,y,age) {
  // A planted-foot halo stays still when the dancer hops. Two arcs leave the tile legible.
  const beat=age*2, phase=beat%1, ring=1-Math.pow(1-phase,2);
  ctx.save();ctx.translate(x,y+6.7);
  ctx.globalAlpha=.22+.3*(1-phase);
  oval(ctx,0,0,8.5,2.3,'#a64f9b');
  ctx.globalAlpha=.85*(1-phase);
  ctx.beginPath();ctx.ellipse(0,0,6.9+ring*2.6,1.8+ring*1.3,0,.17,2.93);
  ctx.strokeStyle='#ff94d4';ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,6.9+ring*2.6,1.8+ring*1.3,0,3.27,5.9);
  ctx.strokeStyle='#b0ffde';ctx.lineWidth=.75;ctx.stroke();
  ctx.restore();
}
export function dancerNotes(ctx,x,y,age) {
  const n=Math.floor(age*2), rise=(age*2)%1, dir=n%2 ? 1 : -1;
  ctx.save();ctx.globalAlpha=Math.min(1,rise*7+.18,(1-rise)*5);
  note(ctx,x+dir*(5+rise*3),y-10-rise*4,dir*(.16+.16*rise),.91,notePalette[n%3]);
  ctx.restore();
}

function guitar(ctx) {
  // Cream bindings and a contrasting soundhole keep the silhouette legible on a phone.
  draw(ctx,guitarBody,'#077d88',ink,1.35);
  draw(ctx,guitarBody,null,'#ffeabc',.48);
  draw(ctx,guitarShine,null,'#7de3d0',.77);
  draw(ctx,fretboard,'#665054',ink,.75);
  for(let i=0;i<4;i++){
    const x=4+i*1.42, y=-1.3-x*.45;
    line(ctx,[x,y,x+.4,y+.86],'#e6c799',.35);
  }
  draw(ctx,headstock,'#e8a45b',ink,.75);
  for(const [x,y] of [[10.8,-7.5],[12.4,-8.45],[12.4,-6.1]]) oval(ctx,x,y,.52,.64,'#fff1c7');
  oval(ctx,-.9,1.2,1.75,1.75,'#ffdca4');oval(ctx,-.9,1.2,1.3,1.3,ink);
  line(ctx,[-3.75,2.15,-2.8,3.7],'#503c46',1.09);
  line(ctx,[-3.42,2.62,10.65,-5.72],'#fae5bd',.29);
  line(ctx,[-3.08,3.11,10.75,-5.27],'#fff5d8',.25);
}
function sleeve(ctx,sx,sy,ex,ey,hx,hy) {
  const pts=[sx,sy,ex,ey,hx,hy];
  line(ctx,pts,'#4a383b',2.65); line(ctx,pts,'#c58843',1.85);
  line(ctx,[ex,ey,hx,hy],'#e4a457',1.07);
  oval(ctx,hx,hy,.96,1.13,'#8e5f42');oval(ctx,hx,hy-.15,.77,.9,'#ffd29e');
}
export function drawGuitarist(ctx,x,y,age,left,moving,atlas) {
  const pulse=Math.sin(age*Math.PI/beat);
  let stroke=strokes[0];
  for (const next of strokes) {
    if (next[0]*beat>age) break;
    stroke=next;
  }
  const elapsed=age-stroke[0]*beat;
  // The pick crosses the strings on the audible down- or upstroke, then springs back.
  const direction=stroke[0]%1===0 ? 1 : -1;
  const strum=direction*stroke[2]*Math.sin(Math.min(1,elapsed/.25)*Math.PI*1.5)*Math.exp(-elapsed*4);

  const bounce=Math.abs(pulse), entrance=Math.min(1,age*8+.35);
  ctx.save();ctx.translate(x,y);ctx.scale(left?-1:1,1);ctx.lineJoin='round';ctx.lineCap='round';
  for(const side of [-1,1]){
    const knee=side*pulse, kick=Math.max(0,knee)*(moving?2.45:1.7);
    const foot=side*(3.1+kick*.56);
    line(ctx,[side*1.65,2,side*(2.25+kick),5.2-kick*.45,foot,8.25-kick],'#202330',2.6);
    ctx.save();ctx.translate(foot,8.05-kick);draw(ctx,sole,'#a29d96','#34343b',.55);ctx.restore();
  }
  ctx.translate(pulse*.7,-bounce*.78);ctx.rotate(pulse*.052);
  draw(ctx,coat,'#c58a45','#563e35',.65);
  line(ctx,[-.8,-6.75,.15,3.4],'#493c38',1.4);
  if (atlas.complete && atlas.naturalWidth) {
    const w=atlas.naturalWidth/5, h=atlas.naturalHeight/2;
    // Crop the actual family portrait above the shoulders. The arms and coat below move independently.
    ctx.drawImage(atlas,4*w,0,w,h*.379,-9.65,-17.4,19.3,12.2);
  } else {
    oval(ctx,-.5,-10.6,4.15,4.4,'#e4ac7d');oval(ctx,-.7,-13.4,4.45,2.6,'#503823');
    line(ctx,[-3.45,-10.85,1.8,-11.1],'#47515c',.7);
  }
  draw(ctx,strap,null,'#332e39',1.35);
  const wobble=pulse*.06+(1-entrance)*.21;
  ctx.translate(-.25,1.28);ctx.rotate(wobble);
  // Pasha’s fretting arm reaches behind the neck; only the fingers wrap over it.
  const fretX=5.6+stroke[1]*.84, fretY=-1-fretX*.46;
  sleeve(ctx,2.45,-6.2,4.8,-1.1,fretX,fretY+.5);
  guitar(ctx);
  line(ctx,[fretX-.45,fretY-.38,fretX+.2,fretY+.58],'#f5c595',1.12);
  const handX=-1.32+strum*.74,handY=.75+strum*2.15;
  sleeve(ctx,-3.55,-5.75,-5.05,-2.16+strum*.49,handX,handY);
  line(ctx,[handX+.16,handY+.3,handX+.57,handY+.5],'#fff2bc',.53);
  if(elapsed < .13){
    ctx.save();ctx.globalAlpha=(1-elapsed/.13)*.9;
    ctx.beginPath();ctx.arc(-1.6,.8,3.4,-.64,.49);
    ctx.strokeStyle='#d0fff0';ctx.lineWidth=.61;ctx.stroke();ctx.restore();
  }
  ctx.restore();
  for(let i=0;i<2;i++){
    const elapsed=age*1.5+i*.5, n=Math.floor(elapsed), rise=elapsed%1;
    const dir=(n+i)%2 ? -1:1;
    ctx.save();ctx.globalAlpha=Math.min(1,(1-rise)*6,rise*7+.05)*entrance;
    const nx=x+dir*(7+rise*5), ny=y-2-rise*13;
    if(i===0)note(ctx,nx,ny,.22*dir,.96,notePalette[n%3]);
    else {ctx.translate(nx,ny);draw(ctx,shine,'#ffe4a6','#834f6a',.38);}
    ctx.restore();
  }
}
