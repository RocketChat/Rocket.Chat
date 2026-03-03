import { describe, it, expect } from 'vitest';
import { Matcher, isEqual, makeLookupFunction } from './matcher.ts';

describe('Matcher', () => {
  describe('isEqual (BSON-compliant equality)', () => {
    it('compares basic types and respects object key order', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('a', 'a')).toBe(true);
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);
      
      // Key order matters in MongoDB!
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(false);

      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });
  });

  describe('makeLookupFunction', () => {
    it('resolves paths correctly', () => {
      const lookupA = makeLookupFunction('a');
      expect(lookupA({})).toEqual([{ value: undefined }]);
      expect(lookupA({ a: 1 })).toEqual([{ value: 1 }]);
      expect(lookupA({ a: [1] })).toEqual([{ value: [1] }]);

      const lookupAX = makeLookupFunction('a.x');
      expect(lookupAX({ a: { x: 1 } })).toEqual([{ value: 1 }]);
      expect(lookupAX({ a: 5 })).toEqual([{ value: undefined }]);
      expect(lookupAX({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] })).toEqual([
        { value: 1, arrayIndices: [0] },
        { value: [2], arrayIndices: [1] },
        { value: undefined, arrayIndices: [2] }
      ]);
    });
  });

  describe('Selector Compiler', () => {
    const match = (selector: any, doc: any) => {
      const result = new Matcher(selector).documentMatches(doc).result;
      expect(result).toBe(true);
    };

    const nomatch = (selector: any, doc: any) => {
      const result = new Matcher(selector).documentMatches(doc).result;
      expect(result).toBe(false);
    };

    it('handles empty selectors', () => {
      match({}, {});
      match({}, { a: 12 });
    });

    it('handles scalars', () => {
      match('a', { _id: 'a', a: 'foo' });
      nomatch('a', { _id: 'b', a: 'foo' });
    });

    it('handles safety checks', () => {
      nomatch(undefined, { _id: 'foo' });
      nomatch(false, { _id: 'foo' });
      nomatch(null, { _id: 'foo' });
      nomatch({ _id: undefined }, { _id: 'foo' });
    });

    it('matches specific keys and objects', () => {
      nomatch({ a: 12 }, {});
      match({ a: 12 }, { a: 12 });
      match({ a: 12, b: 13 }, { a: 12, b: 13 });
      nomatch({ a: 12, b: 13 }, { b: 13, c: 14 });
      match({ a: { b: 12 } }, { a: { b: 12 } });
    });

    it('handles $gt, $lt, $gte, $lte', () => {
      match({ a: { $lt: 10 } }, { a: 9 });
      nomatch({ a: { $lt: 10 } }, { a: 10 });
      match({ a: { $gt: 10 } }, { a: 11 });
      match({ a: { $lte: 10 } }, { a: 10 });
      match({ a: { $gte: 10 } }, { a: 10 });
    });

    it('handles $in and $nin', () => {
      match({ a: { $in: [1, 2, 3] } }, { a: 2 });
      nomatch({ a: { $in: [1, 2, 3] } }, { a: 4 });
      match({ a: { $nin: [1, 2, 3] } }, { a: 4 });
      nomatch({ a: { $nin: [1, 2, 3] } }, { a: 2 });
    });

    it('handles $and, $or, $nor', () => {
      match({ $or: [{ a: 1 }, { b: 2 }] }, { a: 1 });
      match({ $or: [{ a: 1 }, { b: 2 }] }, { b: 2 });
      nomatch({ $or: [{ c: 3 }, { d: 4 }] }, { a: 1 });
      
      match({ $and: [{ a: 1 }, { b: 2 }] }, { a: 1, b: 2 });
      nomatch({ $and: [{ a: 1 }, { b: 2 }] }, { a: 1, c: 3 });

      match({ $nor: [{ a: 1 }, { b: 2 }] }, { c: 3 });
      nomatch({ $nor: [{ a: 1 }, { b: 2 }] }, { a: 1 });
    });
  });
});