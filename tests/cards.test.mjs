import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCards, restoreCards, cardsTurn as act, catalog, encounters, incoming } from '../cards.js';

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
  if (s.phase === 'reward') {
    const rewards = encounters[s.level].rewards;
    return { type: 'reward', id: rewards.includes('echo') ? 'echo' : rewards[0] };
  }
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
test('all heroes can win all seven distinct portals through legal plays and resume between turns', () => {
  assert.equal(new Set(encounters.map((room) => room.world)).size, 7);
  for (const hero of ['kirill', 'maxim', 'mom', 'dad', 'pasha']) {
    let s = createCards(hero, 27);
    const retries = new Set();
    const passed = [];
    for (let i = 0; i < 500 && s.phase !== 'won'; i++) {
      const action = autoAction(s);
      const before = s;
      s = act(s, action);
      conserved(s);
      if (action.type === 'reward') {
        passed.push(before.level);
        assert.ok(s.hand.includes(action.id));
        assert.equal(s.deck.length, before.deck.length + 1);
      }
      if (s.phase === 'lost') {
        assert.ok(!retries.has(s.level), hero + ' must be able to clear this room after retry');
        retries.add(s.level);
        s = act(s, { type: 'retry' });
      }
      assert.deepEqual(restoreCards(JSON.parse(JSON.stringify(s)), hero), s);
    }
    assert.equal(s.phase, 'won', hero);
    assert.deepEqual([...passed, s.level], [0, 1, 2, 3, 4, 5, 6]);
    assert.equal(s.deck.length, 15);
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

test('later portals show the actual effects of the carousel, shared aisle, lava lane and witch', () => {
  let s = createCards('pasha', 27);
  const openings = [];
  for (let step = 0; step < 450 && s.phase !== 'won'; step++) {
    if (!openings[s.level]) openings[s.level] = structuredClone(s);
    s = act(s, autoAction(s));
  }
  const [, , endRoom, carousel, shop, lava, castle] = openings;
  // Existing version-one third-room saves still contain eleven cards and the same foes.
  assert.equal(endRoom.deck.length, 11);
  assert.deepEqual(restoreCards(JSON.parse(JSON.stringify(endRoom)), 'pasha'), endRoom);
  assert.deepEqual(act(carousel, { type: 'end' }).foes.map((f) => f.lane), [1, 0, 0]);
  assert.deepEqual(shop.foes.map((f) => f.lane), [0, 0, 2]);
  const aisleHit = incoming(shop, 0);
  shop.foes[1].hp = 0;
  assert.equal(incoming(shop, 0), aisleHit - 1);
  assert.equal(incoming(lava, 0), encounters[lava.level].foes[0][3] + 2);
  const next = act(lava, { type: 'end' });
  assert.equal(incoming(next, 0), encounters[lava.level].foes[0][3]);
  const hauntedHit = incoming(castle, 1);
  castle.foes[0].hp = 0;
  assert.equal(incoming(castle, 1), hauntedHit - 1);
});
