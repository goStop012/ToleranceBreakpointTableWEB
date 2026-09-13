import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpression } from './expression';

describe('evaluateExpression - 数学算式解析测试', () => {
  it('支持基本四则运算与运算符优先级', () => {
    const res1 = evaluateExpression('10+5*2');
    assert.equal(res1.error, false);
    assert.equal(res1.value, 20);

    const res2 = evaluateExpression('(10+5)*2');
    assert.equal(res2.error, false);
    assert.equal(res2.value, 30);

    const res3 = evaluateExpression('100 - 25 / 5 + 4 * 3');
    assert.equal(res3.error, false);
    assert.equal(res3.value, 107);
  });

  it('支持浮点数及前导正负号', () => {
    const res1 = evaluateExpression('-15.5 + 20.25');
    assert.equal(res1.error, false);
    assert.equal(res1.value, 4.75);

    const res2 = evaluateExpression('+10.5 * 2');
    assert.equal(res2.error, false);
    assert.equal(res2.value, 21);
  });

  it('除以零与非法语法时妥善返回 error: true', () => {
    const resDivZero = evaluateExpression('10 / 0');
    assert.equal(resDivZero.error, true);

    const resSyntaxError = evaluateExpression('10 + * 5');
    assert.equal(resSyntaxError.error, true);

    const resUnclosed = evaluateExpression('(10 + 5');
    assert.equal(resUnclosed.error, true);
  });
});
