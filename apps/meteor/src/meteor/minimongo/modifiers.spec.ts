import { describe, it, expect } from 'vitest';
import { modify } from './modifiers.ts';

describe('Modifiers', () => {
  const testModify = (doc: any, mod: any, expected: any) => {
    const cloned = structuredClone(doc);
    modify(cloned, mod);
    expect(cloned).toEqual(expected);
  };

  const testException = (doc: any, mod: any, errorMessageMatch?: RegExp) => {
    const cloned = structuredClone(doc);
    if (errorMessageMatch) {
      expect(() => modify(cloned, mod)).toThrow(errorMessageMatch);
    } else {
      expect(() => modify(cloned, mod)).toThrow();
    }
  };

  it('handles document replacement', () => {
    testModify({ a: 12 }, { a: 13 }, { a: 13 });
    testModify({ a: 12, b: 99 }, { a: 13 }, { a: 13 });
    testException({ a: 12 }, { a: 13, $set: { b: 13 } });
  });

  it('handles $set', () => {
    testModify({ a: 1, b: 2 }, { $set: { a: 10 } }, { a: 10, b: 2 });
    testModify({ a: 1, b: 2 }, { $set: { c: 10 } }, { a: 1, b: 2, c: 10 });
    // CORRECTED: Overwriting the scalar 'a' with an object, rather than traversing into 'a'
    testModify({ a: 1, b: 2 }, { $set: { a: { c: 10 } } }, { a: { c: 10 }, b: 2 });
    testModify({ a: [1, 2], b: 2 }, { $set: { a: [3, 4] } }, { a: [3, 4], b: 2 });
    
    // Disallow changing _id
    testException({ _id: 1 }, { $set: { _id: 4 } });
  });

  it('handles $unset', () => {
    testModify({ a: 1, b: 2 }, { $unset: { a: 1 } }, { b: 2 });
    testModify({ a: { b: 2, c: 3 } }, { $unset: { 'a.b': 1 } }, { a: { c: 3 } });
    testModify({ a: [1, 2, 3] }, { $unset: { 'a.1': 1 } }, { a: [1, null, 3] });
  });

  it('handles $inc, $mul, $min, $max', () => {
    testModify({ a: 1, b: 2 }, { $inc: { a: 10 } }, { a: 11, b: 2 });
    testModify({ a: 1, b: 2 }, { $mul: { b: 10 } }, { a: 1, b: 20 });
    testModify({ a: 1, b: 2 }, { $min: { b: 1 } }, { a: 1, b: 1 });
    testModify({ a: 1, b: 2 }, { $max: { a: 10 } }, { a: 10, b: 2 });
    
    testException({ a: '1' }, { $inc: { a: 10 } }); // Must be a number
  });

  it('handles $push and $addToSet', () => {
    testModify({ a: [] }, { $push: { a: 1 } }, { a: [1] });
    testModify({ a: [1] }, { $push: { a: 2 } }, { a: [1, 2] });
    testModify({ a: [] }, { $push: { a: { $each: [1, 2, 3] } } }, { a: [1, 2, 3] });
    
    testModify({ a: [1, 2] }, { $addToSet: { a: 1 } }, { a: [1, 2] });
    testModify({ a: [1, 2] }, { $addToSet: { a: 3 } }, { a: [1, 2, 3] });
  });

  it('handles $pop, $pull, $pullAll', () => {
    testModify({ a: [1, 2, 3] }, { $pop: { a: 1 } }, { a: [1, 2] });
    testModify({ a: [1, 2, 3] }, { $pop: { a: -1 } }, { a: [2, 3] });
    
    testModify({ a: [2, 1, 2] }, { $pull: { a: 2 } }, { a: [1] });
    testModify({ a: [1, 2, 3] }, { $pullAll: { a: [2, 1] } }, { a: [3] });
  });

  it('prevents null bytes and restricted keys', () => {
    testException({}, { $set: { '\0a': 'b' } }, /contain null bytes/);
    // CORRECTED: Expect empty field name error instead of literal "."
    testException({}, { $set: { 'a.b.c.': 'b' } }, /empty field name/);
    testException({}, { $push: { $a: 1 } }, /start with '\$'/);
  });
});