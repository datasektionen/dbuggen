import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_MODIFIER,
  MIN_MODIFIER,
  applyModifier,
  clampModifier,
  formatModifiedTotal,
  formatModifier,
  formatModifierInput,
  isValidModifier,
  parseModifier,
} from '../src/modifier.js';
import { resolveRoll } from '../src/roll-mode.js';

test('modifier validation and clamping use the supported integer range', () => {
  assert.equal(MIN_MODIFIER, -99);
  assert.equal(MAX_MODIFIER, 99);
  assert.equal(isValidModifier(-99), true);
  assert.equal(isValidModifier(99), true);
  assert.equal(isValidModifier(-100), false);
  assert.equal(isValidModifier(100), false);
  assert.equal(isValidModifier(1.5), false);
  assert.equal(clampModifier(-120), -99);
  assert.equal(clampModifier(120), 99);
  assert.throws(() => clampModifier(1.5), TypeError);
});

test('typed modifiers accept arithmetic expressions, round, and clamp results', () => {
  assert.equal(parseModifier('+3'), 3);
  assert.equal(parseModifier('-12'), -12);
  assert.equal(parseModifier('\u22127'), -7);
  assert.equal(parseModifier('(2+3)*4'), 20);
  assert.equal(parseModifier('5/2'), 3);
  assert.equal(parseModifier('-5/2'), -3);
  assert.equal(parseModifier(' 101 '), 99);
  assert.equal(parseModifier('-100'), -99);
  assert.equal(parseModifier(''), null);
  assert.equal(parseModifier('-'), null);
  assert.equal(parseModifier('2.5'), null);
  assert.equal(parseModifier('2(3)'), 6);
  assert.equal(parseModifier('(2+3)4'), 20);
  assert.equal(parseModifier('1/0'), null);
});

test('modifier formatting keeps signed values and readable calculations', () => {
  assert.equal(formatModifier(0), '0');
  assert.equal(formatModifier(3), '+3');
  assert.equal(formatModifier(-3), '\u22123');
  assert.equal(formatModifierInput(3), '+3');
  assert.equal(formatModifierInput(-3), '-3');
  assert.equal(applyModifier(12, 3), 15);
  assert.equal(applyModifier(1, -3), -2);
  assert.equal(formatModifiedTotal(12, 3), '12 + 3 = 15');
  assert.equal(formatModifiedTotal(18, -2), '18 \u2212 2 = 16');
});

test('advantage and disadvantage select a natural roll before applying one modifier', () => {
  const advantage = resolveRoll('advantage', [7, 18]);
  const disadvantage = resolveRoll('disadvantage', [7, 18]);
  assert.equal(applyModifier(advantage.value, 3), 21);
  assert.equal(applyModifier(disadvantage.value, 3), 10);
});
