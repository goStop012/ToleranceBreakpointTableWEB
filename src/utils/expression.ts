export interface ExpressionResult {
  value: number;
  error: boolean;
}

/**
 * 递归下降数学表达式求值器（无 eval，安全且健壮）
 */
export function evaluateExpression(expr: string): ExpressionResult {
  const s = String(expr || '').trim();
  if (s === '') {
    return { value: 0, error: false };
  }

  let pos = 0;

  function skip() {
    while (pos < s.length && (s[pos] === ' ' || s[pos] === '\t')) {
      pos++;
    }
  }

  function num(): number {
    skip();
    let str = '';
    while (pos < s.length && s[pos] >= '0' && s[pos] <= '9') {
      str += s[pos];
      pos++;
    }
    if (pos < s.length && s[pos] === '.') {
      str += s[pos];
      pos++;
      while (pos < s.length && s[pos] >= '0' && s[pos] <= '9') {
        str += s[pos];
        pos++;
      }
    }
    if (pos < s.length && (s[pos] === 'e' || s[pos] === 'E')) {
      str += s[pos];
      pos++;
      if (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
        str += s[pos];
        pos++;
      }
      while (pos < s.length && s[pos] >= '0' && s[pos] <= '9') {
        str += s[pos];
        pos++;
      }
    }
    if (str === '' || str === '.') {
      throw new Error('Invalid number');
    }
    const n = parseFloat(str);
    if (isNaN(n)) {
      throw new Error('NaN');
    }
    return n;
  }

  function factor(): number {
    skip();
    if (pos >= s.length) {
      throw new Error('Unexpected end');
    }
    if (s[pos] === '+') {
      pos++;
      return factor();
    }
    if (s[pos] === '-') {
      pos++;
      return -factor();
    }
    if (s[pos] === '(') {
      pos++;
      const v = expr0();
      skip();
      if (pos >= s.length || s[pos] !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      pos++;
      return v;
    }
    return num();
  }

  function term(): number {
    let v = factor();
    skip();
    while (pos < s.length && (s[pos] === '*' || s[pos] === '/')) {
      const op = s[pos];
      pos++;
      const r = factor();
      if (op === '*') {
        v = v * r;
      } else {
        if (r === 0) {
          throw new Error('Division by zero');
        }
        v = v / r;
      }
      skip();
    }
    return v;
  }

  function expr0(): number {
    let v = term();
    skip();
    while (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
      const op = s[pos];
      pos++;
      const r = term();
      if (op === '+') {
        v = v + r;
      } else {
        v = v - r;
      }
      skip();
    }
    return v;
  }

  try {
    const res = expr0();
    skip();
    if (pos < s.length) {
      return { value: NaN, error: true };
    }
    if (!isFinite(res) || isNaN(res)) {
      return { value: NaN, error: true };
    }
    return { value: res, error: false };
  } catch {
    return { value: NaN, error: true };
  }
}
