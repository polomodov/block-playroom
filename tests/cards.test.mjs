import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCards, restoreCards, cardsTurn as act, catalog, incoming } from '../cards.js';

const play = (s, id) => act(s, { type: 'play', index: s.hand.indexOf(id) });
const conserved = (s) =>
  assert.deepEqual([...s.hand, ...s.pile, ...s.discard, ...s.table].sort(), [...s.deck].sort());

test('Boo groups the guards, then guitar makes every guard on that trail dance', () => {
  let s = createCards('pasha', 42);
  s = act(s, { type: 'aim', index: 1 });
  s = play(s, 'boo');
  assert.equal(new Set(s.foes.map((f) => f.lane)).size, 1);
  s = play(s, 'guitar');
  assert.ok(s.foes.every((f) => f.dance));
  assert.deepEqual(
    s.foes.map((_, i) => incoming(s, i)),
    [0, 0],
  );
  assert.equal(s.energy, 1);
  conserved(s);
  const next = act(s, { type: 'end' });
  assert.equal(next.health, 16);
  assert.ok(next.foes.every((f) => !f.dance));
});
test('drawing, playing and reshuffling are deterministic after resuming', () => {
  let a = createCards('kirill', 711),
    b = restoreCards(JSON.parse(JSON.stringify(a)), 'kirill');
  for (let i = 0; i < 3; i++) {
    const actions = [
      { type: 'play', index: a.hand.indexOf('slide') },
      { type: 'play', index: 0 },
      { type: 'end' },
    ];
    for (const action of actions) {
      a = act(a, action);
      b = act(b, action);
      assert.deepEqual(a, b);
      conserved(a);
    }
    assert.deepEqual(restoreCards(JSON.parse(JSON.stringify(a)), 'kirill'), a);
  }
});
test('insufficient energy, unknown rewards and invalid saves are safe', () => {
  const s = createCards('mom', 13);
  s.energy = 0;
  assert.equal(play(s, 'veil'), s);
  assert.equal(act(s, { type: 'reward', id: 'printer' }), s);
  const bad = structuredClone(s);
  bad.hand.push('shield');
  assert.equal(restoreCards(bad, 'mom').energy, 3);
  assert.equal(restoreCards(s, 'pasha').hero, 'pasha');
});
function autoAction(s) {
  if (s.phase === 'reward') return { type: 'reward', id: 'echo' };
  const options = s.hand
    .map((id, index) => {
      if (catalog[id].cost > s.energy) return { value: -10 };
      let bestIndex = s.target,
        best = -1;
      for (let i = 0; i < s.foes.length; i++) {
        if (!s.foes[i].hp) continue;
        const after = act(act(s, { type: 'aim', index: i }), { type: 'play', index });
        const damage = s.foes.reduce((d, f, j) => d + f.hp - after.foes[j].hp, 0);
        const prevented = s.foes.reduce((d, _, j) => d + incoming(s, j) - incoming(after, j), 0);
        const value =
          damage +
          prevented * 0.5 +
          (after.hand.length - s.hand.length + 1) * 1.2 +
          (after.block - s.block) * 0.23 +
          (after.health - s.health) * 0.35;
        if (value > best) {
          best = value;
          bestIndex = i;
        }
      }
      return { value: best, index, target: bestIndex };
    })
    .sort((a, b) => b.value - a.value);
  const chosen = options[0];
  if (!chosen || chosen.value < 0) return { type: 'end' };
  return chosen.target !== s.target
    ? { type: 'aim', index: chosen.target }
    : { type: 'play', index: chosen.index };
}
test('all heroes can build a deck and finish three rooms through legal plays', () => {
  for (const hero of ['kirill', 'maxim', 'mom', 'dad', 'pasha']) {
    let s = createCards(hero, 27);
    for (let i = 0; i < 150 && s.phase !== 'won'; i++) {
      const action = autoAction(s);
      const before = s;
      s = act(s, action);
      conserved(s);
      if (action.type === 'reward') {
        assert.ok(s.hand.includes('echo'));
        assert.equal(s.deck.length, before.deck.length + 1);
      }
      assert.notEqual(s.phase, 'lost', hero);
      assert.deepEqual(restoreCards(JSON.parse(JSON.stringify(s)), hero), s);
    }
    assert.equal(s.phase, 'won', hero);
    assert.equal(s.deck.length, 11);
  }
});
test('losing a room offers a playable retry with the same hero and deck', () => {
  let s = createCards('maxim', 1);
  for (let i = 0; i < 10 && s.phase === 'battle'; i++) s = act(s, { type: 'end' });
  assert.equal(s.phase, 'lost');
  const resume = restoreCards(s, 'maxim');
  const retry = act(resume, { type: 'retry' });
  assert.equal(retry.health, 16);
  assert.deepEqual(retry.deck, s.deck);
});
