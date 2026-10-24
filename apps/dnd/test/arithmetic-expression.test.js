import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateArithmeticExpression,
  normalizeArithmeticExpression,
  normalizeArithmeticInput,
  roundArithmeticResult,
} from '../src/arithmetic-expression.js';

test('arithmetic input keeps allowed symbols and canonicalizes operator aliases', () => {
  assert.equal(normalizeArithmeticExpression(' 12 x 3*/4\u00f7(2)+X. '), '12\u00d73\u00d7\u00f74\u00f7(2)+');
  assert.deepEqual(normalizeArithmeticInput('2ab*x 3', 6, 8), {
    value: '2\u00d7\u00d73',
    selectionStart: 3,
    selectionEnd: 4,
  });
});

test('arithmetic evaluation observes precedence, parentheses, unary signs, and associativity', () => {
  assert.deepEqual(evaluateArithmeticExpression('2+3\u00d74'), { status: 'valid', value: 14 });
  assert.deepEqual(evaluateArithmeticExpression('(2+3)*4'), { status: 'valid', value: 20 });
  assert.deepEqual(evaluateArithmeticExpression('-5+2'), { status: 'valid', value: -3 });
  assert.deepEqual(evaluateArithmeticExpression('8/2x3'), { status: 'valid', value: 12 });
  assert.deepEqual(evaluateArithmeticExpression('2\u00d7-3'), { status: 'valid', value: -6 });
});

test('arithmetic evaluation supports adjacent factors at multiplicative precedence', () => {
  assert.deepEqual(evaluateArithmeticExpression('4(4+4)'), { status: 'valid', value: 32 });
  assert.deepEqual(evaluateArithmeticExpression('(2+3)(4+5)'), { status: 'valid', value: 45 });
  assert.deepEqual(evaluateArithmeticExpression('(2+3)4'), { status: 'valid', value: 20 });
  assert.deepEqual(evaluateArithmeticExpression('2(-3)'), { status: 'valid', value: -6 });
  assert.deepEqual(evaluateArithmeticExpression('8\u00f72(2+2)'), { status: 'valid', value: 16 });
  assert.deepEqual(evaluateArithmeticExpression('44'), { status: 'valid', value: 44 });
});

test('arithmetic evaluation distinguishes incomplete and invalid expressions', () => {
  ['', '2+', '-', '(2+3', '4(2+'].forEach((expression) => {
    assert.deepEqual(evaluateArithmeticExpression(expression), { status: 'incomplete' });
  });
  ['2+)', '2)(3', '()', '1\u00f70', '1+*2', '2 3', '2X3', '9007199254740992'].forEach((expression) => {
    assert.deepEqual(evaluateArithmeticExpression(expression), { status: 'invalid' });
  });
});

test('arithmetic results use symmetric half-away-from-zero rounding', () => {
  assert.equal(roundArithmeticResult(2.5), 3);
  assert.equal(roundArithmeticResult(-2.5), -3);
  assert.equal(roundArithmeticResult(2.49), 2);
  assert.equal(roundArithmeticResult(-2.49), -2);
  assert.equal(roundArithmeticResult(Number.POSITIVE_INFINITY), null);
});
