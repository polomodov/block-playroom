import { playGuitar, stopGuitar } from './guitar.js';

// Notes are scheduled in seconds. Tiny envelopes keep the chiptune pulses click-free.
const cues = {
  jump:       [[0, 290, 510, .10]],
  gem:        [[0, 740, 740, .055], [.065, 990, 990, .10]],
  ability:    [[0, 330, 390, .07], [.07, 494, 590, .08], [.15, 660, 740, .12]],
  hit:        [[0, 240, 105, .18], [.18, 120, 80, .09]],
  over:       [[0, 330, 294, .15], [.16, 262, 247, .16], [.34, 220, 165, .28]],
};
let context;
let master;
let enabled = false;
let guitarGain;

export function setSoundEnabled(value) {
  enabled = value;
  if (!enabled) stopGuitar();
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  if (enabled && !context) {
    context = new Audio();
    master = context.createGain();
    master.connect(context.destination);
    guitarGain = context.createGain();
    guitarGain.gain.value = 7.5;
    guitarGain.connect(master);
  }
  if (!context) return;
  master.gain.setTargetAtTime(enabled ? .10 : 0, context.currentTime, .008);
  if (enabled && context.state !== 'running') return context.resume().catch(() => {});
}

export { stopGuitar as stopSolo };

export function playSolo(age = 0) {
  if (enabled) playGuitar(context, guitarGain, age);
}

export function playSound(name) {
  if (!enabled || context?.state !== 'running') return;
  if (!cues[name]) return;
  const now = context.currentTime;
  for (const [offset, startHz, endHz, length] of cues[name]) {
    const start = now + offset;
    const tone = context.createOscillator();
    const envelope = context.createGain();
    tone.type = name === 'hit' ? 'sawtooth' : 'triangle';
    tone.frequency.setValueAtTime(startHz, start);
    tone.frequency.exponentialRampToValueAtTime(endHz, start + length);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(.65, start + .009);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + length);
    tone.connect(envelope);
    envelope.connect(master);
    tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
    tone.start(start);
    tone.stop(start + length + .01);
  }
}
