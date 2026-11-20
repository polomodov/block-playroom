// Shared End dragon illustration. The body is drawn in local units with its chest at (0,0).
const TAU = Math.PI * 2;
const ink = '#20182e';
const mix = (a, b, t) => a + (b - a) * t;

function panel(c, color, points, outline) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) c.lineTo(...points[i]);
  c.closePath();
  c.fillStyle = color; c.fill();
  if (outline) { c.strokeStyle = outline; c.lineWidth = .85; c.stroke(); }
}

function line(c, color, width, points) {
  c.beginPath(); c.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) c.lineTo(...points[i]);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

// The shoulder drives the stroke. The wrist and wing tips follow with a delay,
// so the membrane opens on the downstroke and pleats against the back in a dive.
function wing(c, time, fold, far) {
  const beat = time * 5.1 - (far ? .17 : 0);
  const root = far ? [3, -2.4] : [-1, -2.8];
  const reach = far ? 1 : -1;
  const point = (x, baseY, swing, lag, tuckedX, tuckedY) => [
    mix(root[0] + reach * x, tuckedX, fold),
    mix(baseY + swing * Math.sin(beat - lag), tuckedY, fold),
  ];
  const elbow = point(7, -10, 4, 0, -5, -7);
  const wrist = point(far ? 13 : 20, -19, 13, .24, -13, far ? -10 : -12);
  const outer = point(far ? 24 : 36, -24, 23, .52, -30, -7);
  const mid = point(far ? 19 : 32, -7, 16, .59, -26, -2.6);
  const inner = point(far ? 10 : 22, 1.3, 9, .68, -21, .2);
  const heel = far ? [-2, 1] : [-8, 2.5];
  const hollow = (p, q, depth) => [mix(p[0],q[0],.5) + (wrist[0]-p[0])*.11, mix(p[1],q[1],.5)-depth*(1-fold)];
  const cut1 = hollow(outer,mid,3.8), cut2 = hollow(mid,inner,3.1), cut3 = hollow(inner,heel,2.1);
  panel(c,far?'#443852':'#624d78',[root,elbow,wrist,outer,cut1,mid,cut2,inner,cut3,heel],ink);
  panel(c,far?'#605065':'#976f9e',[wrist,outer,cut1,mid]);
  panel(c,far?'#3a304e':'#504065',[wrist,mid,cut2,inner]);
  panel(c,far?'#433950':'#70567e',[wrist,inner,cut3,heel,root]);
  line(c,far?'#94859c':'#d2bbcf',far?.85:1.15,[root,elbow,wrist,outer]);
  line(c,far?'#45394c':'#463747',1.05,[mid,wrist,inner]);
  line(c,far?'#917d96':'#b99bbd',.72,[mid,[wrist[0],wrist[1]+.5],inner]);
  line(c,ink,1.8,[root,elbow,wrist]);
  line(c,far?'#8a778f':'#d0bace',.82,[[root[0],root[1]-.55],[elbow[0],elbow[1]-.65],[wrist[0],wrist[1]-.7],[wrist[0]+reach*2,wrist[1]-2.2]]);
}

function tail(c, time, fold) {
  const spine = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const x = -6 - t * 38;
    const y = 1.6 + t * (Math.sin(time * 3.1 - t * 3.7) * (4 + 2*t) + fold * 4) - 2 * t*t;
    const h = 2.65 * (1-t) + .2;
    spine.push({x,y,h});
  }
  for (let i = 6; i >= 0; i--) {
    const a=spine[i], b=spine[i+1];
    panel(c,i%2 ? '#463c54' : '#55475f',[[a.x+1,a.y-a.h],[b.x,b.y-b.h],[b.x,b.y+b.h],[a.x+1,a.y+a.h]],ink);
    line(c,'#9884a5',.65,[[a.x+.4,a.y-a.h],[b.x,b.y-b.h]]);
    if (i < 5 && i%2 === 0) panel(c,'#bbabc3',[[a.x,a.y-a.h],[a.x-3.2,a.y-a.h-2.9+i*.25],[a.x-2.8,a.y-a.h+.4]]);
  }
}

function leg(c, x, y, time, fold, near) {
  const drift=Math.sin(time*5.1+(near?0:1))*.9;
  const knee=[x-2.6,y+3.3];
  const foot=[x-4.5-fold*2,y+6.3+drift-fold*4];
  line(c,ink,2.9,[[x,y],knee,foot]);
  line(c,near?'#71637b':'#4d425a',1.2,[[x-.5,y],knee,foot]);
  line(c,'#c3b3c6',.72,[foot,[foot[0]+1.7,foot[1]+.35],[foot[0]+2,foot[1]+1.1]]);
}

function stream(c, mouth, target, power, time, scale) {
  const dx=target.x-mouth.x, dy=target.y-mouth.y, distance=Math.hypot(dx,dy);
  if (distance < .5) return;
  const nx=-dy/distance, ny=dx/distance;
  const peak=Math.min(distance*.18,3.6*scale)*power;
  c.save(); c.globalAlpha*=power;
  const widening = Math.min(distance*.16,2.9*scale)*power;
  panel(c,'rgba(235,110,255,.38)',[[mouth.x,mouth.y],
    [target.x+nx*widening,target.y+ny*widening],[target.x-nx*widening,target.y-ny*widening]]);
  for (const band of [-1,0,1]) {
    c.beginPath(); c.moveTo(mouth.x,mouth.y);
    for (let i=1;i<=12;i++) {
      const t=i/12;
      const offset=peak*Math.sin(t*Math.PI)*(.65*band+.45*Math.sin(t*8-time*15+band));
      c.lineTo(mix(mouth.x,target.x,t)+nx*offset,mix(mouth.y,target.y,t)+ny*offset);
    }
    c.strokeStyle=band===0?'#ffdaff':'#dc78f6';
    c.lineWidth=(band===0?1.35:.78)*scale; c.stroke();
  }
  c.restore();
}

export function drawDragon(c, {x,y,dir=1,pitch=0,dive=0,breath=0,time=0,scale=1}, breathTarget) {
  const fold=Math.min(1,Math.max(0,dive));
  const open=Math.min(1,Math.max(0,breath));
  const flap=Math.sin(time*5.1);
  const nod=(1-fold)*flap*.65;
  c.save(); c.translate(x,y); c.scale(dir*scale,scale); c.rotate(pitch);
  c.lineJoin='round'; c.lineCap='round';
  wing(c,time,fold,true);
  tail(c,time,fold);
  leg(c,3,2,time,fold,false); leg(c,-7,2.6,time,fold,false);
  panel(c,'#3a3448',[[-13,-1.2],[-9,-4.2],[1,-4.7],[8,-2.7],[8,1.1],[2,5.1],[-6,4.6],[-12,2.3]],ink);
  panel(c,'#63556f',[[-12,-1.5],[-9,-4.2],[1,-4.7],[7,-2.8],[0,-1.5],[-7,-.6]]);
  line(c,'#b29db9',.76,[[-12,-2.2],[-8.8,-4.1],[-4,-4.3]]);
  line(c,'#947e99',.65,[[-6,4.35],[2,4.85],[5.7,2.9]]);
  leg(c,-7.3,2.2,time+.08,fold,true); leg(c,3.8,1.4,time+.16,fold,true);
  wing(c,time,fold,false);
  c.translate(0,nod);
  // Raised nape, silver horns, cuboid muzzle and a hinged lower jaw.
  panel(c,'#4e435c',[[3,-3.4],[8,-5.8],[12,-7.7],[15,-6.6],[14,-2],[8,.4],[4,1]],ink);
  panel(c,'#94829d',[[6,-4.7],[9,-7.4],[8.8,-9.4],[12,-7.5],[14,-7],[11,-6.8]]);
  panel(c,'#9b8aa4',[[16,-7.4],[14.9,-11.1],[12,-13],[13.2,-9.1],[13.3,-7.5]],ink);
  c.save(); c.translate(15.4,-3.5); c.rotate(.07+open*.39);
  panel(c,'#4a3d53',[[0,-.5],[4,.2],[10,.8],[9.2,2.2],[2.6,2.2],[0,1.4]],ink);
  line(c,'#c783d5',.83,[[3,.1],[9.4,.8]]); c.restore();
  panel(c,'#403748',[[11.5,-7.3],[14.4,-9.5],[19.8,-8.2],[20.8,-5.8],[26.4,-5.4],[26,-2.85],[20.4,-3.1],[18.6,-2.2],[13.1,-3.1]],ink);
  panel(c,'#766882',[[11.5,-7.3],[14.4,-9.5],[19.8,-8.2],[17.6,-7.2]]);
  panel(c,'#b7a6bb',[[13.9,-8.3],[11.8,-8.9],[9.1,-12.3],[11.7,-11.2],[15.8,-8.7]],ink);
  line(c,'#b59ac0',.66,[[20.8,-5.85],[26.3,-5.4]]);
  line(c,'#ed70ff',2.1,[[16.2,-6.17],[19,-6.45]]);
  line(c,'#ffe2ff',.95,[[17.8,-6.32],[19,-6.45]]);
  c.fillStyle='#1f1828'; c.fillRect(24.6,-5,.85,.6);
  if (open>.03) {
    c.globalAlpha*=open;
    c.fillStyle='#e7a2fb'; c.beginPath(); c.ellipse(24.9,-2.65,2.1,.62+open*.52,0,0,TAU); c.fill();
    if (!breathTarget) {
      for (let i=0;i<3;i++) {
        const t=(time*1.55+i/3)%1, angle=(i-1)*.8;
        const mx=25.6+Math.cos(angle)*(1-t)*7, my=-2.4+Math.sin(angle)*(1-t)*7;
        c.fillStyle='#ffc7ff'; c.fillRect(mx-.45,my-.45,.9,.9);
      }
    }
  }
  c.restore();
  if (breathTarget && open>.03) {
    const lx=25.2, ly=-2.65+nod;
    const mouth={x:x+dir*scale*(Math.cos(pitch)*lx-Math.sin(pitch)*ly),y:y+scale*(Math.sin(pitch)*lx+Math.cos(pitch)*ly)};
    stream(c,mouth,breathTarget,open,time,scale);
  }
}

// Coordinates and radii describe the damaging footprint, not the extent of a decorative glow.
export function drawDragonWarning(c,x,y,rx,ry,progress,time) {
  const p=Math.min(1,Math.max(0,progress));
  c.save(); c.translate(x,y); c.scale(rx,ry);
  c.beginPath(); c.ellipse(0,0,.96,.91,0,0,TAU);
  c.fillStyle='rgba(109,38,138,.32)'; c.fill();
  c.lineCap='round';
  for (let i=0;i<4;i++) {
    const start=Math.PI/4+i*Math.PI/2;
    c.beginPath(); c.ellipse(0,0,.91,.86,0,start-.38,start+.38);
    c.strokeStyle='#f6c4ff'; c.lineWidth=.096; c.stroke();
  }
  // Inward-facing brackets converge on the marked spot before the first plume.
  const ay=.77-.28*p+.055*Math.sin(time*8);
  for (const sign of [-1,1]) {
    line(c,'#f0b5ff',.12,[[-.19,ay*sign],[0,(ay-.16)*sign],[.19,ay*sign]]);
  }
  c.restore();
}

export function drawDragonCloud(c,x,y,rx,ry,age,duration,seed=0) {
  if (!(age>=0 && age<duration && rx>0 && ry>0)) return;
  c.save(); c.translate(x,y); c.scale(rx,ry);
  // Start with an immediately legible rim and dissipate only at the very end.
  c.globalAlpha*=Math.min(1,.73+age*3,.46+(duration-age)*2.5);
  c.beginPath(); c.ellipse(0,.4,.96,.5,0,0,TAU);
  c.fillStyle='rgba(84,29,105,.78)'; c.fill();
  c.lineWidth=.065; c.strokeStyle='#e8a0f5'; c.stroke();
  const phase=age*3.4+seed;
  const centers=[[-.58,.19,.39,.48],[-.22,-.12,.42,.67],[.19,-.18,.46,.71],[.59,.16,.37,.47]];
  for (let i=0;i<centers.length;i++) {
    const [cx,cy,a,b]=centers[i];
    const bob=Math.sin(phase+i*1.9)*.085;
    c.beginPath(); c.ellipse(cx,cy+bob,a,b,0,0,TAU);
    c.fillStyle=i%2?'rgba(174,76,201,.88)':'rgba(134,52,171,.89)'; c.fill();
    c.beginPath(); c.ellipse(cx,cy+bob,a*.88,b*.89,0,3.63,5.47);
    c.lineWidth=.085; c.strokeStyle=i%2?'#f7b7fa':'#d996ec'; c.stroke();
  }
  c.lineWidth=.09; c.lineCap='round'; c.strokeStyle='#ed9ff4';
  c.beginPath(); c.moveTo(-.51,.35);
  c.bezierCurveTo(-.3,.54,-.03,.49,.07,.31); c.bezierCurveTo(.14,.14,.02,.04,-.1,.14); c.stroke();
  for(let i=0;i<3;i++){
    const cycle=(age*.64+i/3+seed*.019)%1, px=(-.63+i*.6)+Math.sin(phase+i)*.075, py=.24-cycle*1.18;
    panel(c,'#ffe1ff',[[px,py-.095],[px+.055,py],[px,py+.095],[px-.055,py]]);
  }
  if (age < .32) {
    const t=age/.32, span=.24+.63*t;
    c.globalAlpha*=1-t;
    line(c,'#ffe6ff',.12,[[-span,-.03],[-span*.53,.33],[-span*.30,-.25],[0,.33],[span*.37,-.47],[span*.53,.2],[span,-.04]]);
  }
  c.restore();
}
