import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRollModeDetails,
  nextRollMode,
  resolveRoll,
  ROLL_MODES,
} from '../src/roll-mode.js';

test('roll modes cycle in the visible control order', () => {
  assert.deepEqual(ROLL_MODES, ['normal', 'advantage', 'disadvantage']);
  assert.equal(nextRollMode('normal'), 'advantage');
  assert.equal(nextRollMode('advantage'), 'disadvantage');
  assert.equal(nextRollMode('disadvantage'), 'normal');
  assert.equal(getRollModeDetails('normal').rollCount, 1);
  assert.equal(getRollModeDetails('advantage').rollCount, 2);
  assert.equal(getRollModeDetails('disadvantage').rollCount, 2);
});

test('normal, advantage, and disadvantage resolve the intended values', () => {
  assert.deepEqual(resolveRoll('normal', [12]), { value: 12, selectedIndices: [0] });
  assert.deepEqual(resolveRoll('advantage', [7, 18]), { value: 18, selectedIndices: [1] });
  assert.deepEqual(resolveRoll('advantage', [18, 7]), { value: 18, selectedIndices: [0] });
  assert.deepEqual(resolveRoll('disadvantage', [7, 18]), { value: 7, selectedIndices: [0] });
  assert.deepEqual(resolveRoll('disadvantage', [18, 7]), { value: 7, selectedIndices: [1] });
});

test('ties select both physical dice', () => {
  assert.deepEqual(resolveRoll('advantage', [9, 9]), { value: 9, selectedIndices: [0, 1] });
  assert.deepEqual(resolveRoll('disadvantage', [4, 4]), { value: 4, selectedIndices: [0, 1] });
});

test('roll resolution rejects unknown modes and wrong roll shapes', () => {
  assert.throws(() => resolveRoll('unknown', [1]), RangeError);
  assert.throws(() => resolveRoll('normal', [1, 2]), TypeError);
  assert.throws(() => resolveRoll('advantage', [1]), TypeError);
  assert.throws(() => resolveRoll('disadvantage', [1, 2.5]), TypeError);
});
