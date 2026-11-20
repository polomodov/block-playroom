const duration = 5;
export const beat = .5;

export function performanceAge(state) {
  if (state.guitarStartedAt == null) return null;
  const age = state.time - state.guitarStartedAt;
  return age >= 0 && age < duration ? age : null;
}

// One downstroke or upstroke every eighth note, with a short rest before the final chord.
const chords = [[40, 55, 59, 64], [43, 55, 59, 67], [38, 54, 57, 62], [45, 57, 60, 64]];
export const strokes = [
  [0,0,1], [1,0,.64], [1.5,0,.54], [2,1,.9], [3,1,.65], [3.5,1,.55],
  [4,2,.94], [4.5,2,.54], [5.5,2,.66], [6,3,.93], [7,3,.64], [7.5,3,.55], [8,0,1],
];

function recordRiff(context) {
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.ceil(duration * rate), rate);
  const samples = buffer.getChannelData(0);
  for (const [at, chord, accent] of strokes) {
    const upstroke = at % 1 !== 0;
    chords[chord].forEach((pitch, index) => {
      if (index === 0 && upstroke) return;
      const start = Math.round((at * beat + .012 * (upstroke ? 3 - index : index)) * rate);
      const length = Math.min(samples.length - start, Math.round((at === 8 ? 1 : .64) * rate));
      const frequency = 440 * 2 ** ((pitch - 69) / 12);
      const period = Math.max(2, Math.round(rate / frequency - .5));
      const string = Float32Array.from({ length: period }, () => Math.random() * 2 - 1);
      const attack = rate * .002, release = rate * .035;
      let pos = 0;
      for (let i = 0; i < length; i++) {
        const next = pos + 1 === period ? 0 : pos + 1;
        const envelope = Math.min(1, i / attack, (length - i) / release);
        samples[start + i] += accent * .19 * envelope * string[pos];
        string[pos] = .497 * (string[pos] + string[next]);
        pos = next;
      }
    });
  }
  return buffer;
}

let riff;
let voice;

export function stopGuitar() {
  if (voice) voice.stop();
  voice = undefined;
}

export function playGuitar(context, output, age) {
  if (context?.state !== 'running' || !output || age == null || age >= duration) return;
  stopGuitar();
  riff ??= recordRiff(context);
  const source = context.createBufferSource();
  source.buffer = riff;
  source.connect(output);
  source.onended = () => {
    source.disconnect();
    if (voice === source) voice = undefined;
  };
  voice = source;
  source.start(0, age);
}
