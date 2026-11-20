// Draw in world pixels so cues follow the camera and projectiles share their collision position.
const tau = Math.PI*2;
const clamp = value => Math.max(0,Math.min(1,value));
const arrowHead = new Path2D('M0 0L-4.15 -1.8 -3.12 0 -4.15 1.8Z');
const fletching = new Path2D('M-8.15 0L-10.45 -1.85 -13.2 -1.9 -11.9 0 -13.2 1.9 -10.45 1.85Z');

export function drawArrow(c,x,y,dir,travelling=false) {
  c.save(); c.translate(x,y); c.scale(dir,1); c.lineJoin='round'; c.lineCap='round';
  if(travelling) {
    const trail=c.createLinearGradient(-24,0,-6,0);
    trail.addColorStop(0,'rgba(255,214,150,0)');trail.addColorStop(1,'rgba(255,218,148,.7)');
    c.fillStyle=trail;c.beginPath();c.moveTo(-24,0);c.lineTo(-8,-1.1);c.lineTo(-8,1.1);c.fill();
  }
  c.strokeStyle='#3f333a';c.lineWidth=1.6;
  c.beginPath();c.moveTo(-11.3,0);c.lineTo(-.9,0);c.stroke();
  c.strokeStyle='#fed697';c.lineWidth=.68;c.stroke();
  c.fillStyle='#f6e4bf';c.strokeStyle='#544451';c.lineWidth=.62;c.fill(fletching);c.stroke(fletching);
  c.strokeStyle='#c37762';c.beginPath();c.moveTo(-10.6,-1.35);c.lineTo(-9.3,0);c.lineTo(-10.6,1.35);c.stroke();
  c.fillStyle='#e7f4ec';c.strokeStyle='#40505e';c.fill(arrowHead);c.stroke(arrowHead);
  c.restore();
}

// A tall, split seam distinguishes the rift from the round effects of other abilities.
function rift(c,x,foot,open,age) {
  if(open<=.005) return;
  c.save();c.translate(x,foot);c.lineCap='round';c.lineJoin='round';
  const spread = 1.05 + open*7.5;
  const height = 7 + open*21;
  const sway = Math.sin(age*8)*1.4;
  c.globalAlpha*=clamp(open*2.7);
  c.fillStyle='rgba(75,27,100,.36)';c.beginPath();c.ellipse(0,-.25,spread+1.8,1.9,0,0,tau);c.fill();
  c.save(); c.translate(0,-height/2); c.scale(spread,height/2);
  c.beginPath();c.moveTo(0,-1);
  c.bezierCurveTo(.72,-.74,1.02,-.22,.83,.22);c.quadraticCurveTo(.68,.78,-.04,1);
  c.bezierCurveTo(-.8,.66,-1.02,.04,-.72,-.44);c.quadraticCurveTo(-.46,-.84,0,-1);
  c.fillStyle='rgba(59,25,84,.62)';c.fill();c.restore();
  for (const side of [-1,1]) {
    c.beginPath();c.moveTo(sway,-height);
    c.bezierCurveTo(side*spread*.87,-height*.78,side*spread*1.14,-height*.34,side*spread*.64,-height*.2);
    c.quadraticCurveTo(side*spread*.29,-height*.08,-.45,0);
    c.strokeStyle='#67469b';c.lineWidth=2.1;c.stroke();
    c.strokeStyle=side<0?'#f2a1fd':'#a393ff';c.lineWidth=1.03;c.stroke();
  }
  c.fillStyle='#eec3ff';
  for (let i=0;i<6;i++) {
    const t=(age*1.7+i*.173)%1, side=i%2?1:-1;
    const yy=-height*t, xx=side*(spread*(.65+.45*Math.sin(t*Math.PI))+(i%3)*1.25);
    c.save();c.translate(xx,yy);c.rotate(.78);c.fillRect(-.59,-.59,1.18,1.18);c.restore();
  }
  c.restore();
}

function blast(c,x,y,radius,p) {
  c.save();c.translate(x,y);c.lineCap='round';c.lineJoin='round';
  const expansion=1-(1-p)**3;
  const r=3+expansion*(radius-3);
  c.globalAlpha*=1-p;
  // Faceted shock front breaks into arcs; the centre clears immediately after impact.
  for(let i=0;i<6;i++) {
    const a=i*tau/6-.2;
    c.beginPath();c.arc(0,0,r,a,a+.78-p*.43);
    c.strokeStyle='#a5623d';c.lineWidth=2+.8*(1-p);c.stroke();
    c.strokeStyle='#ffdf90';c.lineWidth=1.17;c.stroke();
  }
  // Hot inner billows rise off the tile, then leave wisps spreading above the scorch.
  for (let i=0;i<7;i++) {
    const angle=(i+.38)*tau/7, travel=(.38+.53*p)*r;
    const cx=Math.cos(angle)*travel, cy=Math.sin(angle)*travel*.77-5*p;
    const size=(2.6+(i%3)*.74)*(1+Math.sin(Math.PI*p)*.38);
    c.save();c.translate(cx,cy);c.rotate(angle*.21);c.globalAlpha*=Math.min(1,p*13+.42);
    c.fillStyle=p<.37 ? '#ee9658' : '#9c837a';c.strokeStyle=p<.37 ? '#ba6544' : '#7d7178';
    c.lineWidth=.62;c.beginPath();
    c.moveTo(-size,.25*size);c.quadraticCurveTo(-1.1*size,-.66*size,-.45*size,-.64*size);
    c.quadraticCurveTo(.05*size,-1.28*size,.68*size,-.58*size);
    c.quadraticCurveTo(1.34*size,-.37*size,.92*size,.33*size);
    c.quadraticCurveTo(.64*size,.91*size,-.25*size,.65*size);
    c.quadraticCurveTo(-.85*size,.83*size,-size,.25*size);c.fill();c.stroke();
    c.fillStyle=p<.37 ? '#ffcf7d' : '#c8a991';c.beginPath();
    c.ellipse(-.06*size,-.53*size,.43*size,.22*size,-.19,0,tau);c.fill();
    c.restore();
  }
  if(p<.52) {
    c.save();c.globalAlpha*=1-p/.52;
    const core=4+Math.sin(Math.PI*Math.min(p/.48,1))*12.5;
    c.beginPath();
    for(let i=0;i<18;i++){const a=i*tau/18+.15,rr=core*(i%2?.53:1);if(i===0)c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);else c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}
    c.closePath();c.fillStyle='#fff2aa';c.fill();c.lineWidth=1.25;c.strokeStyle='#ff9658';c.stroke();c.restore();
  }
  for(let i=0;i<9;i++) {
    const a=-Math.PI+(i+.26)*tau/9;
    const drift=(.47+((i*7)%5)*.105)*r;
    c.save();c.translate(Math.cos(a)*drift,Math.sin(a)*drift+p*p*6);
    c.rotate(a+p*(i%2?3:-2));c.fillStyle=i%3===0?'#769657':i%3===1?'#f2b365':'#866f69';
    c.strokeStyle='#695146';c.lineWidth=.5;c.fillRect(-1.4,-1.05,2.8,2.1);c.strokeRect(-1.4,-1.05,2.8,2.1);c.restore();
  }
  c.restore();
}

export function drawWarnings(c,enemies,camera,width) {
  for(const actor of enemies) {
    const a=actor.action;
    if(!a || !actor.alive || actor.stun || actor.dance) continue;
    const x=actor.x+actor.w/2-camera, foot=actor.y+actor.h;
    const progress=clamp(a.age/a.duration);
    if(a.kind==='blinkOut'||a.kind==='blinkIn') {
      const departing=a.kind==='blinkOut';
      if(x>=-20 && x<=width+20) rift(c,x,foot,departing?progress:1-progress,a.age);
      if(departing && Number.isFinite(a.toX)){
        const destination=a.toX+actor.w/2-camera;
        if(destination>=-20 && destination<=width+20)
          rift(c,destination,foot,clamp((progress-.14)/.86)*.93,a.age+.35);
      }
    } else if(a.kind==='fuse' && x>=-28 && x<=width+28) {
      c.save();c.translate(x,foot-.25);
      const cycle=(1-Math.cos(progress*tau*2))*.5;
      const radius=11+15*progress;
      c.beginPath();c.ellipse(0,0,radius,2.05+progress*1.25,0,0,tau);
      c.fillStyle='rgba(244,133,67,.14)';c.fill();
      c.strokeStyle='rgba(253,181,100,'+(.4+cycle*.45)+')';c.lineWidth=.75;c.stroke();c.restore();
    }
  }
}

export function drawMonsterEffects(c,effects,camera,width) {
  for(const fx of effects) {
    const x=fx.x-camera;
    if(x < -36 || x>width+36) continue;
    const p=clamp(fx.age/fx.duration);
    if(fx.kind==='arrow') drawArrow(c,x,fx.y,fx.dir,true);
    else if(fx.kind==='blast') blast(c,x,fx.y,fx.radius,p);
    else if(fx.kind==='portal') {
      const foot=fx.y+10.5;
      rift(c,x,foot,1-p,fx.age+.52);
      // A fading echo of the eyes and shoulders reads at the origin while the body reforms.
      c.save();c.translate(x,foot);c.scale(fx.dir||1,1);
      c.globalAlpha*=.64*(1-p);
      c.fillStyle='#624980';c.fillRect(-3+p*2,-19.7,6.9,6);c.fillRect(-2.1-p,-12.4,4.7,5.4);
      c.fillStyle='#ecaeff';c.fillRect(-2.5+p*2,-16.8,2,.9);c.fillRect(1.6+p*2,-16.8,2,.9);
      c.restore();
    }
  }
}
