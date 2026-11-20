// Figure coordinates follow the facing direction, with (0,0) at the feet.
const circle = Math.PI * 2;
const progress = a => Math.min(1, a.age / a.duration);

function oval(c,x,y,rx,ry,color) {
  c.fillStyle = color;
  c.beginPath(); c.ellipse(x,y,rx,ry,0,0,circle); c.fill();
}

function line(c, ink, width, ...points) {
  c.beginPath(); c.moveTo(points[0],points[1]);
  for (let i=2; i<points.length; i+=2) c.lineTo(points[i],points[i+1]);
  c.strokeStyle=ink; c.lineWidth=width; c.stroke();
}

function polygon(c, ink, ...points) {
  c.beginPath(); c.moveTo(points[0],points[1]);
  for (let i=2; i<points.length; i+=2) c.lineTo(points[i],points[i+1]);
  c.closePath(); c.fillStyle=ink; c.fill();
}

function glow(c,x,y,r) {
  const halo=c.createRadialGradient(x,y,0,x,y,r);
  halo.addColorStop(0,'rgba(255,193,58,.64)');
  halo.addColorStop(.48,'rgba(255,104,34,.25)');
  halo.addColorStop(1,'rgba(255,94,22,0)');
  c.fillStyle=halo;
  c.fillRect(x-r,y-r,r*2,r*2);
}

function fire(c,x,y,r,time,flying) {
  glow(c,x,y,r*2.5);
  c.save(); c.translate(x,y); c.scale(r,r);
  const beat=Math.sin(time*19)*.12;
  if (flying) {
    polygon(c,'#be4335',.35,-.76,-.7,-.72,-2.55,-1.03,-1.9,-.37,-3.55,-.06,-1.7,.32,-2.48,.67,-.75,.82,.5,.59);
    polygon(c,'#ff902e',.4,-.55,-.8,-.53,-2.34,-.37,-1.36,-.03,-2.68,.19,-1,.52,.45,.53);
  }
  c.rotate(time*1.6);
  polygon(c,'#bc4932',-.8,-.57,-.22,-1.12,.61,-.94,1.08,-.24,.93,.61,.23,1,-.61,.92,-1.11,.24);
  polygon(c,'#ff972b',-.74,-.42,-.15,-.94,.69,-.76,.88,.11,.57,.8,-.23,.88,-.89,.31);
  polygon(c,'#ffe077',-.56,-.34,.12,-.77,.51,-.32,.69,.15,.22,.59,-.57,.42);
  oval(c,.1,-.03,.39+beat,.4,'#fff7bb');
  c.restore();
}

const ghastHead = new Path2D('M-9 -20L-5.9 -23.3 7.8 -22.8 10.1 -20.1 9.3 -7.8 7.2 -6.7 -7.3 -7.5 -9 -9.5Z');
function ghast(c, t, dancing, action) {
  const inhale=action?.kind==='inhale' ? progress(action) : 0;
  const recoil=action?.kind==='exhale' ? 1-progress(action) : 0;
  const bob=Math.sin(t*2)*.34;
  c.save(); c.translate(-recoil*1.2,bob);
  // The trailing limbs coil inward as the ember gathers. Dancers kick out in pairs.
  for (let i=0;i<6;i++) {
    const root=-7+i*2.7;
    const sway=Math.sin(t*(dancing?6.28:2.65)+i*1.5);
    const reach=(dancing?2.7:1.2)*sway-root*inhale*.32;
    const endY=-.7-(i%3)*.75-inhale*(1.8+Math.abs(root)*.27);
    const points=[root,-9.3,root+.42*reach,-5.3,root+reach,endY];
    line(c,'#70616f',2.05,...points); line(c,i%2?'#d5bcca':'#b5a4b3',1.35,...points);
  }
  c.scale(1+inhale*.08,1-recoil*.09);
  c.fillStyle='#e0d2cb'; c.fill(ghastHead);
  c.lineWidth=.8; c.strokeStyle='#685663'; c.stroke(ghastHead);
  polygon(c,'#fff2df',-8.6,-20.15,-5.6,-22.8,7.7,-22.4,9.5,-20.1);
  polygon(c,'#ac9dab',-8.6,-20.2,-5.5,-18.6,-5.45,-8.15,-7.2,-8,-8.6,-9.7);
  polygon(c,'#f2e2d4',-5.55,-19.5,9.32,-19.86,8.86,-14.13,-5.35,-14.55);
  line(c,'#b6a4ae',.6,-4.8,-13.4,-4.15,-11.2,-4.4,-10.2);
  line(c,'#b6a4ae',.65,7.25,-13.15,7.6,-11.95,7.13,-10.6);
  for (const eye of [-2.1,5.1]) {
    const low=inhale*.95;
    polygon(c,inhale||recoil?'#a8493e':'#665c6b',eye-1.6,-16,eye+1.6,-15.8+low*.35,eye+1.46,-14.5+low,eye-1.25,-14.7+low);
    if (inhale+recoil>.28) line(c,'#ffd994',.57,eye-.8,-14.57+low,eye+.85,-14.41+low);
  }
  oval(c,3.65,-10.6,1.6+inhale, .65+inhale*1.95+recoil*1.75,'#645062');
  if (inhale>0) {
    for(let i=0;i<6;i++) {
      const phase=(t*1.9+i/6)%1, angle=i*circle/6+t*.38;
      const radius=(1-phase)*8+3;
      oval(c,7.2+Math.cos(angle)*radius,-10+Math.sin(angle)*radius,.38+.33*phase,.42+.25*phase,'#ffe69c');
    }
    fire(c,7.2,-10,.8+4.1*inhale,t,false);
  }
  c.restore();
}

function magma(c, t, dancing, a) {
  const compress = a?.kind==='compress' ? Math.sin(progress(a)*Math.PI/2) : 0;
  const flight = a?.kind==='vault' ? Math.sin(Math.PI*progress(a)) : 0;
  const impact = a?.kind==='land' ? Math.sin(Math.PI*progress(a)) : 0;
  const dance = dancing ? Math.cos(t*Math.PI*4)*.14 : 0;
  const idle = Math.sin(t*4)*.035;
  c.save();
  c.scale(1+compress*.43+impact*.32-flight*.11+dance+idle,1-compress*.48-impact*.36-dance-idle);
  c.rotate(flight*.11);
  const gap=flight*2.15;
  if (flight || compress) glow(c,0,-6,5+flight*5+compress*3);
  polygon(c,'#ffb130',-4.5,-2,5.8,-2,5.2,-12.6-gap*2,-4.4,-12.6-gap*2);
  for (let i=0;i<3;i++) {
    const y=-i*(4.15+gap);
    polygon(c,'#542e38',-5.7,y-3.95,-7.15,y-4.85,4.95,y-4.85,7.05,y-3.8,7.05,y-.3,-5.7,y-.3,-7.15,y-1.45,-7.15,y-4.85);
    polygon(c,'#b34c39',-5.6,y-3.7,6.81,y-3.7,6.81,y-.71,-5.6,y-.71);
    polygon(c,i===2?'#f4814a':'#d46840',-6.62,y-4.65,4.7,y-4.65,6.7,y-3.8,-5.5,y-3.8);
    polygon(c,'#763b3b',-6.82,y-4.4,-5.72,y-3.64,-5.72,y-.71,-6.82,y-1.55);
    if(i<2) line(c,flight||compress?'#ffe680':'#ff973e',.72,-4.8,y-4.91,-2.1,y-5.08,2.3,y-4.89,5.75,y-5.05);
    if(i===2) for(const eye of [-2.5,3.2]){
      c.fillStyle='#592e39';c.fillRect(eye-.5,y-3.42,2.8,1.94);
      c.fillStyle='#fff1a6';c.fillRect(eye,y-3.15,1.79,1.35);
    }
  }
  c.restore();
}

export function drawNetherCreature(c, type, time, dancing, action) {
  if(type==='ghast') ghast(c,time+(action?.age ?? 0),dancing,action);
  if(type==='magma_cube') magma(c,time,dancing,action);
}

export function drawNetherEffects(c,state,camera,width) {
  for (const cube of state.enemies) {
    const a=cube.action;
    if(!cube.alive || !a?.landing) continue;
    const x=a.landing.x+cube.w/2-camera, y=a.landing.y+cube.h;
    if(x < -14 || x>width+14) continue;
    c.save();c.globalAlpha=a.kind==='vault'?.68:.32+.48*progress(a);
    const radius=6.2+.75*Math.sin(state.time*9);
    oval(c,x,y-.6,radius,1.65,'#693540');
    c.beginPath();c.ellipse(x,y-.55,radius,1.65,0,0,circle);
    c.strokeStyle='#ffd078';c.lineWidth=.8;c.stroke();c.restore();
  }
  for(const fx of state.monsterEffects) {
    const x=fx.x-camera;
    if(x < -24 || x > width+24) continue;
    if(fx.kind==='fireball') {
      c.save();c.translate(x,fx.y);c.rotate(Math.atan2(fx.vy,fx.vx));
      fire(c,0,0,4.3,fx.age,true);c.restore();
    } else if(fx.kind==='cinders') {
      const p=progress(fx);
      c.save();c.globalAlpha*=1-p;
      for(let i=0;i<8;i++) {
        const dir=i%2?1:-1;
        const dx=dir*(2+(i%4)*1.7+p*(6+(i%3)*3));
        const dy=-1-Math.sin(p*Math.PI)*(2+(i%4)*1.85);
        oval(c,x+dx,fx.y+dy,1.1-p*.35,.86,i%3?'#ffd16d':'#ef8144');
      }
      c.restore();
    }
  }
}
