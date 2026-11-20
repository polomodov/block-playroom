import { gameAudio } from '../game-audio.js';

export function playSound(name) {
  gameAudio.cue('arcade-' + name);
}

export function bindArcadeSound(button, playGuitar, stopGuitar, soloAge) {
  let soloOutput;
  function playSolo(age = 0) {
    if (age == null) return;
    const instrument = gameAudio.instrument();
    if (!instrument) return;
    playGuitar(instrument.context, instrument.output, age);
    soloOutput = instrument.output;
  }

  function hush() {
    stopGuitar();
    soloOutput = undefined;
    gameAudio.silence();
  }
  gameAudio.bindButton(button);
  gameAudio.subscribe(enabled => {
    if (!enabled) {
      stopGuitar();
      soloOutput = undefined;
    } else {
      const age = soloAge();
      // Enabling and unlocking may both notify. Continue from the game clock once.
      if (age != null && gameAudio.instrument()?.output !== soloOutput) playSolo(age);
    }
  });
  return { playSolo, hush };
}

const mazeWarnings = { skeleton: 'bow', creeper: 'fuse', enderman: 'portal', ghast: 'ghast', magma_cube: 'cube' };
const platformWarnings = { draw: 'bow', fuse: 'fuse', blinkOut: 'portal', inhale: 'ghast', compress: 'cube' };

// Read the same warning phases as the renderers. A held pose or restored save stays quiet.
export function monsterAudio(emit = playSound) {
  let current;
  let previousDragon;
  const warnings = new WeakMap();
  const bursts = new WeakSet();
  function sample(state, announce) {
    if (announce && state.dragon?.phase === 'dive' && previousDragon !== 'dive') emit('dragon');
    previousDragon = state.dragon?.phase;
    for (const monster of state.monsters ?? state.enemies ?? []) {
      const cue = monster.windup > 0 ? mazeWarnings[monster.type] : platformWarnings[monster.action?.kind];
      if (cue && announce && cue !== warnings.get(monster)) emit(cue);
      warnings.set(monster, cue);
    }
    for (const fx of state.blastBursts ?? state.monsterEffects ?? []) {
      if (fx.kind && fx.kind !== 'blast') continue;
      if (announce && !bursts.has(fx)) emit('blast');
      bursts.add(fx);
    }
    // In the runner the fireball is an oncoming track obstacle, measured in metres.
    for (const object of state.objects ?? []) {
      if (object.type !== 'fireball' || object.z - state.distance > 18 || object.passed || bursts.has(object)) continue;
      if (announce) emit('ghast');
      bursts.add(object);
    }
  }
  return {
    reset(state) {
      current = state;
      sample(state, false);
    },
    update(state) {
      sample(state, current === state && state.status === 'playing');
      current = state;
    },
  };
}
