import { evaluateArithmeticExpression, roundArithmeticResult } from './arithmetic-expression.js';

export const MIN_MODIFIER = -99;
export const MAX_MODIFIER = 99;

export function isValidModifier(value) {
  return Number.isInteger(value) && value >= MIN_MODIFIER && value <= MAX_MODIFIER;
}

export function clampModifier(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError('Modifier must be a safe integer');
  return Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, value));
}

export function parseModifier(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? clampModifier(value) : null;
  if (typeof value !== 'string') return null;

  const result = evaluateArithmeticExpression(value.trim().replaceAll('\u2212', '-'));
  if (result.status !== 'valid') return null;
  const rounded = roundArithmeticResult(result.value);
  return rounded === null ? null : clampModifier(rounded);
}

export function applyModifier(value, modifier = 0) {
  if (!Number.isSafeInteger(value)) throw new TypeError('Roll value must be a safe integer');
  if (!isValidModifier(modifier)) throw new RangeError(`Modifier must be between ${MIN_MODIFIER} and ${MAX_MODIFIER}`);
  return value + modifier;
}

export function formatModifier(modifier) {
  if (!isValidModifier(modifier)) throw new RangeError(`Modifier must be between ${MIN_MODIFIER} and ${MAX_MODIFIER}`);
  if (modifier > 0) return `+${modifier}`;
  if (modifier < 0) return `\u2212${Math.abs(modifier)}`;
  return '0';
}

export function formatModifierInput(modifier) {
  if (!isValidModifier(modifier)) throw new RangeError(`Modifier must be between ${MIN_MODIFIER} and ${MAX_MODIFIER}`);
  if (modifier > 0) return `+${modifier}`;
  return String(modifier);
}

export function formatModifiedTotal(value, modifier = 0) {
  const total = applyModifier(value, modifier);
  if (modifier > 0) return `${value} + ${modifier} = ${total}`;
  if (modifier < 0) return `${value} \u2212 ${Math.abs(modifier)} = ${total}`;
  return String(value);
}
