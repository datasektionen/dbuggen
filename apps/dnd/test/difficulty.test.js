import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DIFFICULTY,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  clampDifficulty,
  isValidDifficulty,
  parseDifficulty,
} from '../src/difficulty.js';

test('difficulty uses the supported D20 target range and default', () => {
  assert.equal(DEFAULT_DIFFICULTY, 15);
  assert.equal(MIN_DIFFICULTY, 1);
  assert.equal(MAX_DIFFICULTY, 99);
  assert.equal(isValidDifficulty(1), true);
  assert.equal(isValidDifficulty(99), true);
  assert.equal(isValidDifficulty(0), false);
  assert.equal(isValidDifficulty(100), false);
  assert.equal(isValidDifficulty(15.5), false);
});

test('typed difficulties accept arithmetic expressions, round, and clamp results', () => {
  assert.equal(parseDifficulty('18'), 18);
  assert.equal(parseDifficulty('+20'), 20);
  assert.equal(parseDifficulty('(2+3)*4'), 20);
  assert.equal(parseDifficulty('5/2'), 3);
  assert.equal(parseDifficulty('-5/2'), 1);
  assert.equal(parseDifficulty(' 101 '), 99);
  assert.equal(parseDifficulty('0'), 1);
  assert.equal(parseDifficulty(''), null);
  assert.equal(parseDifficulty('-1'), 1);
  assert.equal(parseDifficulty('2.5'), null);
  assert.equal(parseDifficulty('2(3)'), 6);
  assert.equal(parseDifficulty('(2+3)(4+5)'), 45);
  assert.equal(parseDifficulty('1/0'), null);
  assert.equal(clampDifficulty(-4), 1);
  assert.equal(clampDifficulty(120), 99);
  assert.throws(() => clampDifficulty(1.5), TypeError);
});
