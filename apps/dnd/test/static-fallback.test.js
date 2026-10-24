import test from 'node:test';
import assert from 'node:assert/strict';
import { StaticDiceFallback } from '../src/static-dice-fallback.js';

function createClassList() {
  const values = new Set();
  return {
    remove(...names) { names.forEach((name) => values.delete(name)); },
    toggle(name, force) {
      if (force) values.add(name);
      else values.delete(name);
    },
    has(name) { return values.has(name); },
  };
}

test('static fallback previews, rolls, and highlights two dice as one result', () => {
  const diceElements = [0, 1].map(() => ({ classList: createClassList(), textContent: '' }));
  const states = [];
  const themed = [];
  let scheduled;
  let settledResults;
  const fallback = new StaticDiceFallback({
    diceElements,
    applyTheme: (_element, type) => themed.push(type),
    onStateChange: (state) => states.push(state),
    onSettled: (results) => { settledResults = results; },
    schedule: (callback, delay) => {
      assert.equal(delay, 180);
      scheduled = callback;
      return 42;
    },
    cancel: () => {},
  });

  assert.equal(fallback.setDiceCount(2), true);
  assert.equal(fallback.setDie('d8'), true);
  assert.deepEqual(themed, ['d8', 'd8']);
  assert.deepEqual(diceElements.map((element) => element.textContent), [8, 8]);
  assert.ok(diceElements.every((element) => element.classList.has('is-active')));
  assert.equal(fallback.setFps('30'), true);
  assert.equal(fallback.setFps('120'), true);
  assert.equal(fallback.setFps('144'), false);
  assert.equal(fallback.setDiceTheme('d8', {}), true);
  assert.deepEqual(themed, ['d8', 'd8', 'd8', 'd8']);

  assert.equal(fallback.roll({ attempts: [
    { seedWords: [1, 2, 3, 4], fallbackValue: 2 },
    { seedWords: [5, 6, 7, 8], fallbackValue: 7 },
  ] }), true);
  assert.deepEqual(diceElements.map((element) => element.textContent), [2, 7]);
  scheduled();
  assert.deepEqual(states, ['idle', 'settling', 'complete']);
  assert.deepEqual(settledResults, [2, 7]);

  fallback.highlightDice([1]);
  assert.equal(diceElements[0].classList.has('is-unselected'), true);
  assert.equal(diceElements[1].classList.has('is-selected'), true);
});

test('static fallback rejects attempt counts that do not match its preview', () => {
  const fallback = new StaticDiceFallback({
    diceElements: [0, 1].map(() => ({ classList: createClassList(), textContent: '' })),
    applyTheme: () => {},
    onStateChange: () => {},
    onSettled: () => {},
  });
  assert.equal(fallback.roll({ attempts: [{ fallbackValue: 1 }, { fallbackValue: 2 }] }), false);
  assert.equal(fallback.setDiceCount(3), false);
});
