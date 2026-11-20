import { puzzleSounds } from './sound-puzzles.js';
import { actionSounds } from './sound-action.js';
import { arcadeSounds } from './sound-arcades.js';

const sounds = { ...puzzleSounds, ...actionSounds, ...arcadeSounds };
const preference = 'family-games:block-playroom:sound:1';
const floor = 0.0001;
const maxVoices = 48;
const ui = globalThis.window;
const Audio = ui?.AudioContext || ui?.webkitAudioContext;
const listeners = new Set();
const active = new Set();
let enabled = false;
let context, compressor, bus, noise, waking;
try { enabled = Boolean(Audio && ui.localStorage.getItem(preference) === 'on'); } catch { /* Private browsing. */ }

function notify() {
  for (const fn of listeners) fn(enabled);
}
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function instrument() {
  if (!enabled || context?.state !== 'running' || document.hidden) return null;
  if (!bus) {
    bus = context.createGain();
    bus.gain.value = 0.72;
    bus.connect(compressor);
  }
  return { context, output: bus };
}
function silence() {
  if (!bus) return;
  const outgoing = bus;
  bus = null;
  const now = context.currentTime;
  outgoing.gain.cancelScheduledValues(now);
  outgoing.gain.setValueAtTime(outgoing.gain.value, now);
  outgoing.gain.linearRampToValueAtTime(0, now + 0.012);
  for (const source of active) source.stop(now + 0.015);
  active.clear();
  setTimeout(() => outgoing.disconnect(), 20);
}
function unlock() {
  if (!enabled || !Audio || document.hidden) return Promise.resolve(false);
  if (waking) return waking;
  try {
    if (!context) {
      context = new Audio({ latencyHint: 'interactive' });
      compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 5;
      compressor.connect(context.destination);
    } else if (context.state === 'running') {
      return Promise.resolve(true);
    }
    // Call resume from the gesture itself, including on iOS after an interruption.
    waking = Promise.resolve(context.resume()).then(() => {
      if (enabled && context.state === 'running' && !document.hidden) {
        notify();
        return true;
      }
      return false;
    }).catch(() => false).finally(() => { waking = null; });
    return waking;
  } catch { return Promise.resolve(false); }
}
function setEnabled(on) {
  enabled = Boolean(on && Audio);
  try { ui?.localStorage.setItem(preference, enabled ? 'on' : 'off'); } catch { /* Session preference still works. */ }
  if (!enabled) silence();
  notify();
  return enabled ? unlock() : Promise.resolve(false);
}
function bindButton(button) {
  const paint = () => {
    const action = enabled ? 'Выключить звук' : 'Включить звук';
    const caption = Audio ? action : 'Звук недоступен';
    button.disabled = !Audio;
    button.title = caption;
    button.setAttribute('aria-label', caption);
    button.setAttribute('aria-pressed', String(enabled));
    const label = button.querySelector('[data-label]');
    if (label) label.textContent = enabled ? 'Звук вкл.' : 'Звук выкл.';
    else if (!button.childElementCount) button.textContent = caption;
  };
  const toggle = () => { void setEnabled(!enabled); };
  paint();
  button.addEventListener('click', toggle);
  const off = subscribe(paint);
  return () => { off(); button.removeEventListener('click', toggle); };
}
function noiseBuffer() {
  if (noise) return noise;
  noise = context.createBuffer(1, Math.ceil(context.sampleRate / 2), context.sampleRate);
  const channel = noise.getChannelData(0);
  // Deterministic white noise; filtering each hit gives stone, paper and water different textures.
  let bits = 918273;
  for (let i = 0; i < channel.length; i++) {
    bits ^= bits << 13;
    bits ^= bits >>> 17;
    bits ^= bits << 5;
    channel[i] = bits / 2147483648;
  }
  return noise;
}
function playVoice(output, now, [type, delay, hz, endHz, duration, level]) {
  const start = now + delay, end = start + duration;
  const envelope = context.createGain();
  let source, pitch, filter;
  if (type === 'noise') {
    source = context.createBufferSource();
    source.buffer = noiseBuffer();
    source.loop = true;
    filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    pitch = filter.frequency;
    source.connect(filter).connect(envelope);
  } else {
    source = context.createOscillator();
    source.type = type;
    pitch = source.frequency;
    source.connect(envelope);
  }
  pitch.setValueAtTime(hz, start);
  pitch.exponentialRampToValueAtTime(endHz, end);
  envelope.gain.setValueAtTime(floor, start);
  envelope.gain.exponentialRampToValueAtTime(level, start + Math.min(0.007, duration / 4));
  envelope.gain.exponentialRampToValueAtTime(floor, end);
  envelope.connect(output);
  source.onended = () => {
    active.delete(source);
    source.disconnect();
    filter?.disconnect();
    envelope.disconnect();
  };
  active.add(source);
  source.start(start);
  source.stop(end + 0.003);
}
function cue(id) {
  const voices = sounds[id];
  const mix = instrument();
  if (!mix || !voices || active.size + voices.length > maxVoices) return;
  const now = context.currentTime;
  for (const voice of voices) playVoice(mix.output, now, voice);
}

if (ui) {
  const gesture = () => { if (enabled) void unlock(); };
  for (const event of ['pointerdown', 'touchend', 'keydown', 'click'])
    ui.addEventListener(event, gesture, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) silence(); });
  ui.addEventListener('pagehide', silence);
  ui.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== preference) return;
    enabled = Boolean(Audio && event.newValue === 'on');
    if (!enabled) silence();
    notify();
  });
}
export const gameAudio = { get enabled() { return enabled; }, cue, silence, unlock, setEnabled, bindButton, subscribe, instrument };
