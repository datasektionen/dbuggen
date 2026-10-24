import { evaluateArithmeticExpression, roundArithmeticResult } from './arithmetic-expression.js';

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 99;
export const DEFAULT_DIFFICULTY = 15;

export function isValidDifficulty(value) {
  return Number.isInteger(value) && value >= MIN_DIFFICULTY && value <= MAX_DIFFICULTY;
}

export function clampDifficulty(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError('Difficulty must be a safe integer');
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, value));
}

export function parseDifficulty(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? clampDifficulty(value) : null;
  if (typeof value !== 'string') return null;

  const result = evaluateArithmeticExpression(value.trim());
  if (result.status !== 'valid') return null;
  const rounded = roundArithmeticResult(result.value);
  return rounded === null ? null : clampDifficulty(rounded);
}
