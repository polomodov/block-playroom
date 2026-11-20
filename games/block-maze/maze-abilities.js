// Coordinates are in maze pixels, with (0, 0) at the centre of a cell.
const fullTurn = Math.PI * 2;
const heading = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

function spark(c, x, y, radius, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x, y - radius);
  c.quadraticCurveTo(x + radius * .12, y - radius * .12, x + radius * .78, y);
  c.quadraticCurveTo(x + radius * .12, y + radius * .12, x, y + radius);
  c.quadraticCurveTo(x - radius * .12, y + radius * .12, x - radius * .78, y);
  c.quadraticCurveTo(x - radius * .12, y - radius * .12, x, y - radius);
  c.fill();
}

function ribbon(c, start, end, offset, color, thickness) {
  c.beginPath();
  c.moveTo(start, offset);
  c.quadraticCurveTo((start + end) / 2, offset + 1.2, end, offset - 1);
  c.quadraticCurveTo((start + end) / 2, offset + thickness + 1.2, start, offset);
  c.fillStyle = color;
  c.fill();
}

function slipstream(c, s) {
  const moving = Boolean(s.player.target);
  const age = 4 - s.boost;
  const fade = Math.min(1, s.boost * 6);
  c.rotate(heading[s.player.dir] ?? 0);
  c.globalAlpha *= fade * (moving ? .94 : .6);
  for (let i = 0; i < 3; ++i) {
    const phase = (age * 2.6 + i * .37) % 1;
    const length = (moving ? 16 : 6) * (.56 + .44 * phase);
    const tip = -4 - phase * (moving ? 6 : 2);
    const offset = -5 + i * 5 + Math.sin(phase * fullTurn) * .85;
    ribbon(c, tip - length, tip, offset, i === 1 ? '#5ae9e4' : '#d3ffef', i === 1 ? 3 : 1.7);
  }
}

// The shout grows from the speaker. A quiet echo follows each half-beat.
function shoutRings(c, age) {
  for (let echo = 0; echo < 2; echo++) {
    const t = (age - echo * .13) % .85;
    if (t < 0 || t > .58) continue;
    const progress = t / .58;
    const radius = 8 + 24 * (1 - (1 - progress) ** 2);
    c.save();
    c.globalAlpha *= (1 - progress) * (age < .85 ? .84 : .5);
    c.lineWidth = (echo ? .9 : 1.8) * (1 - progress * .55);
    c.strokeStyle = echo ? '#ffe6a5' : '#ffb567';
    for (const side of [0, Math.PI]) {
      c.beginPath();
      c.ellipse(0, 0, radius, radius * .73, 0, side - .73, side + .73);
      c.stroke();
    }
    c.restore();
  }
}

function veil(c, age, remaining, front) {
  const transition = Math.max(0, 1 - Math.min(age, remaining) / .48);
  for (let i = 0; i < 2; i++) {
    const phase = (age * .76 + i * .5) % 1;
    const a = phase * fullTurn;
    const sway = Math.sin(a) * 2;
    const y = 1 - Math.cos(a) * 5;
    c.beginPath();
    c.moveTo(-8 - sway, y);
    c.bezierCurveTo(-5 - sway, y + (front ? 5 : -5), 5 - sway, y + (front ? 7 : -7), 9 - sway, y - 4);
    c.strokeStyle = i ? '#efd4ff' : '#91eee4';
    c.lineWidth = i ? .7 : 1.1;
    c.save();
    c.globalAlpha *= (.24 + transition * .48) * (front ? 1 : .72);
    c.stroke();
    c.restore();
  }
  if (!front) return;
  for (let i = 0; i < 5; i++) {
    const t = (age * .88 + i * .21) % 1;
    const origin = i % 2 ? 1 : -1;
    const x = origin * (6.4 + 4.2 * Math.sin(Math.PI * t));
    const y = 7 - t * 22 + Math.sin(i * 6.4) * 2;
    spark(c, x, y, (.45 + Math.sin(t * Math.PI) * 1.25) * (1 + transition * .4), i % 2 ? '#e5bdff' : '#d2fffa');
  }
}

export function invisibleOpacity(remaining) {
  const solid = 1 - Math.min(1, (4 - remaining) / .26, remaining / .28);
  return .41 + Math.max(0, solid) * .59;
}

export function drawPowerBehind(c, s, x, y) {
  if (!(s.boost || s.invisible || s.fear)) return;
  c.save();
  c.translate(x, y);
  c.lineCap = 'round';
  if (s.boost) slipstream(c, s);
  if (s.invisible) veil(c, 4 - s.invisible, s.invisible, false);
  if (s.fear) shoutRings(c, 3 - s.fear);
  c.restore();
}

function knuckle(c, extension) {
  c.save();
  const hand = 7.4 + 7 * extension;
  c.beginPath();
  c.moveTo(2.6, -1.8);
  c.quadraticCurveTo(4.6 + extension * 2, 2.7 - extension * 2, hand - 3, .7);
  c.lineCap = 'round'; c.lineWidth = 3.8; c.strokeStyle = '#2c2535'; c.stroke();
  c.lineWidth = 2.2; c.strokeStyle = '#605573'; c.stroke();
  c.translate(hand, .7);
  c.fillStyle = '#924b2a';
  c.strokeStyle = '#472e2a';
  c.lineWidth = .85;
  c.beginPath();
  c.roundRect(-6, -2, 5, 4.3, 1.15);
  c.fill(); c.stroke();
  c.beginPath();
  c.moveTo(-2, -2.5);
  c.quadraticCurveTo(0, -4.1, 2.25, -3.55);
  c.quadraticCurveTo(4.8, -3.65, 4.65, -1.9);
  c.quadraticCurveTo(5.8, -.75, 4.75, .55);
  c.quadraticCurveTo(4.8, 2.5, 2.1, 2.85);
  c.lineTo(-1.6, 2.45);
  c.quadraticCurveTo(-3.9, 1, -2, -2.5);
  c.fillStyle = '#ffc492';
  c.fill(); c.stroke();
  c.strokeStyle = '#c27654';
  c.lineWidth = .65;
  c.beginPath(); c.moveTo(1.2, -3.35); c.lineTo(1.5, -1.7);
  c.moveTo(3, -3.2); c.lineTo(3.25, -1.65); c.stroke();
  c.restore();
}

function strike(c, remaining, direction) {
  const t = Math.max(0, Math.min(1, 1 - remaining / .32));
  const reach = Math.sin(Math.min(1, t / .48) * Math.PI / 2) * (1 - Math.max(0, (t - .52) / .48));
  c.rotate(heading[direction] ?? 0);
  const radius = 8 + 11 * t;
  c.save();
  c.globalAlpha *= 1 - t;
  c.beginPath();
  c.arc(0, 0, radius, -1.82, 1.75);
  c.arc(-1.8, 0, radius - 1.8, 1.75, -1.82, true);
  c.closePath();
  c.fillStyle = '#ffbd63'; c.fill();
  c.restore();
  knuckle(c, reach);
  if (t > .27 && t < .9) {
    const flash = Math.sin((t - .27) / .63 * Math.PI);
    spark(c, 18 + t * 2, -.1, 4 * flash, '#fff0ba');
    spark(c, 15, -5.5, 1.9 * flash, '#ffb453');
  }
}

function speech(c, x, y, age, width) {
  // On the top row, point the tail upward so the lettering stays on the board.
  const below = y < 25;
  const cx = Math.max(14, Math.min(width - 14, x + 7));
  const cy = below ? y + 19 : y - 20;
  c.save();
  c.translate(cx, cy);
  const pop = age < .28 ? 1 + .13 * Math.sin(Math.PI * age / .28) : 1;
  c.scale(pop, pop);
  const tail = below ? -1 : 1;
  c.beginPath();
  c.moveTo(-7, tail * 5.5); c.lineTo(-8.5, tail * 9.5); c.lineTo(-2, tail * 5.5);
  c.bezierCurveTo(5, tail * 6.8, 12, tail * 5.4, 12, 0);
  c.bezierCurveTo(12, -tail * 8.6, -12.4, -tail * 8.6, -12.4, 0);
  c.quadraticCurveTo(-12.5, tail * 4.5, -7, tail * 5.5);
  c.closePath();
  c.lineWidth = 1.1; c.strokeStyle = '#442b37'; c.fillStyle = '#ffedb4'; c.fill(); c.stroke();
  c.fillStyle = '#633447'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = 'bold 9px system-ui, sans-serif';
  c.fillText('Бу!', 0, .2);
  c.restore();
}

export function drawPowerFront(c, s, x, y, width) {
  if (!(s.attack || s.invisible || s.fear)) return;
  if (s.fear) speech(c, x, y, 3 - s.fear, width);
  c.save();
  c.translate(x, y);
  if (s.attack) strike(c, s.attack, s.player.dir);
  if (s.invisible) veil(c, 4 - s.invisible, s.invisible, true);
  c.restore();
}

export function drawMonsterReaction(c, monster, fear, x, y, time) {
  if (fear) {
    const t = (time * 2.6 + (x + y) * .01) % 1;
    const side = monster.dir === 'left' ? 1 : -1;
    c.save();
    c.translate(x + side * (5.7 + t * 2), y - 7.2 - t * 3.4);
    c.rotate(side * .6);
    c.globalAlpha *= 1 - t * .68;
    c.fillStyle = '#a4f4ff'; c.strokeStyle = '#31506c'; c.lineWidth = .65;
    c.beginPath(); c.moveTo(0, -3); c.quadraticCurveTo(3.6, .8, .4, 1.7);
    c.quadraticCurveTo(-2.2, 1.2, 0, -3); c.fill(); c.stroke(); c.restore();
  }
  if (monster.stun > 0) {
    for (let i = 0; i < 3; i++) {
      const angle = (4 - monster.stun) * 4.8 + i * fullTurn / 3;
      spark(c, x + 5.6 * Math.cos(angle), y - 9.8 + 1.9 * Math.sin(angle),
        1.4 + (1 + Math.sin(angle)) * .45, i ? '#ffe498' : '#fff9cc');
    }
  }
}
