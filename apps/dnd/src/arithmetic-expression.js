const ALLOWED_EXPRESSION = /^[+\-\u00d7*x/\u00f7()0-9]*$/;
const DIGIT = /[0-9]/;

function canonicalizeOperators(value) {
  return value.replace(/[x*]/g, '\u00d7').replaceAll('/', '\u00f7');
}

export function normalizeArithmeticExpression(value) {
  if (typeof value !== 'string') return '';

  let normalized = '';
  for (const character of value) {
    if (character === 'x' || character === '*') normalized += '\u00d7';
    else if (character === '/') normalized += '\u00f7';
    else if (/[+\-\u00d7\u00f7()0-9]/.test(character)) normalized += character;
  }
  return normalized;
}

export function normalizeArithmeticInput(value, selectionStart = value.length, selectionEnd = selectionStart) {
  const safeStart = Number.isInteger(selectionStart) ? selectionStart : value.length;
  const safeEnd = Number.isInteger(selectionEnd) ? selectionEnd : safeStart;
  return {
    value: normalizeArithmeticExpression(value),
    selectionStart: normalizeArithmeticExpression(value.slice(0, safeStart)).length,
    selectionEnd: normalizeArithmeticExpression(value.slice(0, safeEnd)).length,
  };
}

export function roundArithmeticResult(value) {
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) return null;
  const rounded = Math.sign(value) * Math.floor(Math.abs(value) + 0.5);
  return Number.isSafeInteger(rounded) ? rounded : null;
}

export function evaluateArithmeticExpression(value) {
  if (typeof value !== 'string' || !ALLOWED_EXPRESSION.test(value)) {
    return { status: 'invalid' };
  }

  const expression = canonicalizeOperators(value);
  let cursor = 0;

  function valid(result) {
    if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER) {
      return { status: 'invalid' };
    }
    return { status: 'valid', value: result };
  }

  function parsePrimary() {
    const character = expression[cursor];
    if (character === undefined) return { status: 'incomplete' };

    if (DIGIT.test(character)) {
      const start = cursor;
      while (DIGIT.test(expression[cursor])) cursor += 1;
      const number = Number(expression.slice(start, cursor));
      return Number.isSafeInteger(number) ? valid(number) : { status: 'invalid' };
    }

    if (character !== '(') return { status: 'invalid' };
    cursor += 1;
    const result = parseAdditive();
    if (result.status !== 'valid') return result;
    if (expression[cursor] === ')') {
      cursor += 1;
      return result;
    }
    return expression[cursor] === undefined ? { status: 'incomplete' } : { status: 'invalid' };
  }

  function parseUnary() {
    const operator = expression[cursor];
    if (operator !== '+' && operator !== '-') return parsePrimary();
    cursor += 1;
    const result = parseUnary();
    if (result.status !== 'valid') return result;
    return operator === '-' ? valid(-result.value) : result;
  }

  function parseMultiplicative() {
    let result = parseUnary();
    if (result.status !== 'valid') return result;

    while (
      expression[cursor] === '\u00d7'
      || expression[cursor] === '\u00f7'
      || expression[cursor] === '('
      || DIGIT.test(expression[cursor])
    ) {
      const explicitOperator = expression[cursor] === '\u00d7' || expression[cursor] === '\u00f7';
      const operator = explicitOperator ? expression[cursor] : '\u00d7';
      if (explicitOperator) cursor += 1;
      const right = parseUnary();
      if (right.status !== 'valid') return right;
      if (operator === '\u00f7' && right.value === 0) return { status: 'invalid' };
      result = valid(operator === '\u00d7' ? result.value * right.value : result.value / right.value);
      if (result.status !== 'valid') return result;
    }
    return result;
  }

  function parseAdditive() {
    let result = parseMultiplicative();
    if (result.status !== 'valid') return result;

    while (expression[cursor] === '+' || expression[cursor] === '-') {
      const operator = expression[cursor];
      cursor += 1;
      const right = parseMultiplicative();
      if (right.status !== 'valid') return right;
      result = valid(operator === '+' ? result.value + right.value : result.value - right.value);
      if (result.status !== 'valid') return result;
    }
    return result;
  }

  const result = parseAdditive();
  if (result.status !== 'valid') return result;
  return cursor === expression.length ? result : { status: 'invalid' };
}
