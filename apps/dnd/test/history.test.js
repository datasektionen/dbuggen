import test from 'node:test';
import assert from 'node:assert/strict';
import { DICE_TYPES, getDiceDefinition } from '../src/dice-geometry.js';
import {
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  addHistoryEntry,
  clearHistory,
  isValidHistoryEntry,
  loadHistory,
  normalizeHistory,
  saveHistory,
} from '../src/history.js';

function createMemoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, HISTORY_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, HISTORY_STORAGE_KEY);
      value = nextValue;
    },
    removeItem(key) {
      assert.equal(key, HISTORY_STORAGE_KEY);
      value = null;
    },
    read() { return value; },
  };
}

test('history accepts valid results for every supported die', () => {
  DICE_TYPES.forEach((dieType, index) => {
    const sides = getDiceDefinition(dieType).sides;
    assert.equal(isValidHistoryEntry({ dieType, value: 1, rolledAt: 1000 + index }), true);
    assert.equal(isValidHistoryEntry({ dieType, value: sides, rolledAt: 2000 + index }), true);
    assert.equal(isValidHistoryEntry({ dieType, value: 0, rolledAt: 3000 + index }), false);
    assert.equal(isValidHistoryEntry({ dieType, value: sides + 1, rolledAt: 4000 + index }), false);
  });
});

test('history normalization rejects malformed entries, strips extra fields, and orders newest first', () => {
  assert.deepEqual(normalizeHistory([
    { dieType: 'd6', value: 3, rolledAt: 200, ignored: true },
    { dieType: 'd20', value: 18, rolledAt: 300 },
    { dieType: 'd8', value: 9, rolledAt: 400 },
    { dieType: 'd8', value: 4, rolledAt: Number.MAX_SAFE_INTEGER },
    null,
    { dieType: 'unknown', value: 1, rolledAt: 500 },
    { dieType: 'd4', value: 2, rolledAt: 100 },
  ]), [
    { dieType: 'd20', value: 18, rolledAt: 300, mode: 'normal', rolls: [18], modifier: 0, criticalsEnabled: true, difficulty: 15, difficultyEnabled: true },
    { dieType: 'd6', value: 3, rolledAt: 200, mode: 'normal', rolls: [3], modifier: 0, criticalsEnabled: true, difficulty: 15, difficultyEnabled: true },
    { dieType: 'd4', value: 2, rolledAt: 100, mode: 'normal', rolls: [2], modifier: 0, criticalsEnabled: true, difficulty: 15, difficultyEnabled: true },
  ]);
});

test('history loading recovers from missing, corrupt, and inaccessible storage', () => {
  assert.deepEqual(loadHistory(null), []);
  assert.deepEqual(loadHistory(createMemoryStorage('{broken json')), []);
  assert.deepEqual(loadHistory({ getItem() { throw new Error('blocked'); } }), []);
  assert.deepEqual(loadHistory(createMemoryStorage(JSON.stringify([
    { dieType: 'd12', value: 11, rolledAt: 150 },
  ]))), [{ dieType: 'd12', value: 11, rolledAt: 150, mode: 'normal', rolls: [11], modifier: 0, criticalsEnabled: true, difficulty: 15, difficultyEnabled: true }]);
});

test('history validates and preserves roll modes, modifiers, and critical settings', () => {
  const advantage = { dieType: 'd20', value: 18, rolledAt: 200, mode: 'advantage', rolls: [7, 18], modifier: 3, criticalsEnabled: false, difficulty: 18, difficultyEnabled: true };
  const disadvantage = { dieType: 'd8', value: 2, rolledAt: 100, mode: 'disadvantage', rolls: [6, 2], modifier: -2, criticalsEnabled: true, difficulty: 15, difficultyEnabled: false };
  assert.equal(isValidHistoryEntry(advantage), true);
  assert.equal(isValidHistoryEntry(disadvantage), true);
  assert.deepEqual(normalizeHistory([disadvantage, advantage]), [advantage, disadvantage]);

  assert.equal(isValidHistoryEntry({ ...advantage, value: 7 }), false);
  assert.equal(isValidHistoryEntry({ ...advantage, rolls: [18] }), false);
  assert.equal(isValidHistoryEntry({ ...advantage, rolls: [18, 21] }), false);
  assert.equal(isValidHistoryEntry({ ...advantage, mode: 'unknown' }), false);
  assert.equal(isValidHistoryEntry({ ...advantage, modifier: 100 }), false);
  assert.equal(isValidHistoryEntry({ ...advantage, criticalsEnabled: 'yes' }), false);
  assert.equal(isValidHistoryEntry({ ...advantage, difficulty: 0 }), false);
  assert.equal(isValidHistoryEntry({ ...advantage, difficultyEnabled: 'yes' }), false);
});

test('adding history persists the newest 100 valid rolls', () => {
  const storage = createMemoryStorage();
  let history = [];
  for (let index = 1; index <= HISTORY_LIMIT + 5; index += 1) {
    history = addHistoryEntry(storage, history, {
      dieType: 'd20',
      value: (index % 20) + 1,
      rolledAt: index,
    });
  }

  assert.equal(history.length, HISTORY_LIMIT);
  assert.equal(history[0].rolledAt, HISTORY_LIMIT + 5);
  assert.equal(history.at(-1).rolledAt, 6);
  assert.deepEqual(JSON.parse(storage.read()), history);
});

test('saving and clearing remain safe when persistence is unavailable', () => {
  const entry = { dieType: 'd4', value: 4, rolledAt: 1234 };
  const normalizedEntry = { ...entry, mode: 'normal', rolls: [4], modifier: 0, criticalsEnabled: true, difficulty: 15, difficultyEnabled: true };
  assert.deepEqual(saveHistory({ setItem() { throw new Error('quota'); } }, [entry]), [normalizedEntry]);
  assert.deepEqual(clearHistory({ removeItem() { throw new Error('blocked'); } }), []);

  const storage = createMemoryStorage(JSON.stringify([entry]));
  assert.deepEqual(clearHistory(storage), []);
  assert.equal(storage.read(), null);
});
