import { describe, it, expect } from 'vitest';
import { check, Match, MatchError } from 'meteor/check';

describe('check module', () => {
  const matches = (value: any, pattern: any) => {
    expect(() => check(value, pattern)).not.toThrow();
    expect(Match.test(value, pattern)).toBe(true);
  };

  const fails = (value: any, pattern: any) => {
    let error: any;
    try {
      check(value, pattern);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(MatchError);
    expect(Match.test(value, pattern)).toBe(false);
  };

  it('validates basic atoms correctly', () => {
    const pairs: [any, any][] = [
      ['foo', String],
      ['', String],
      [0, Number],
      [42.59, Number],
      [NaN, Number],
      [Infinity, Number],
      [true, Boolean],
      [false, Boolean],
      [() => {}, Function],
      [undefined, undefined],
      [null, null],
    ];

    pairs.forEach((pair) => {
      matches(pair[0], Match.Any);
      [String, Number, Boolean, undefined, null].forEach((type) => {
        if (type === pair[1]) {
          matches(pair[0], type);
          matches(pair[0], Match.Optional(type));
          matches(undefined, Match.Optional(type));
          matches(pair[0], Match.Maybe(type));
          matches(undefined, Match.Maybe(type));
          matches(null, Match.Maybe(type));
        } else {
          fails(pair[0], type);
          matches(pair[0], Match.OneOf(type, pair[1]));
        }
      });
    });

    fails(true, Match.OneOf(String, Number, undefined, null, [Boolean]));
  });

  it('validates arrays correctly', () => {
    matches([1, 2, 3], [Number]);
    matches([], [Number]);
    fails([1, 2, 3, '4'], [Number]);
    fails([1, 2, 3, [4]], [Number]);
    matches([1, 2, 3, '4'], [Match.OneOf(Number, String)]);
  });

  it('validates objects correctly', () => {
    matches({}, Object);
    matches({ foo: 42 }, Object);
    fails({ foo: 42 }, {});
    matches({ a: 1, b: 2 }, { b: Number, a: Number });
    fails({ a: 1, b: 2 }, { b: Number });
    matches({ a: 1, b: 2 }, Match.ObjectIncluding({ b: Number }));
    fails({ a: 1, b: 2 }, Match.ObjectIncluding({ c: String }));
  });

  it('handles optional and maybe correctly in objects', () => {
    matches({}, { a: Match.Optional(Number) });
    matches({ a: 1 }, { a: Match.Optional(Number) });
    fails({ a: true }, { a: Match.Optional(Number) });

    matches({}, { a: Match.Maybe(Number) });
    matches({ a: 1 }, { a: Match.Maybe(Number) });
    fails({ a: true }, { a: Match.Maybe(Number) });
  });

  it('validates literals and custom matchers correctly', () => {
    matches('asdf', 'asdf');
    fails('asdf', 'monkey');
    matches(123, 123);
    fails(123, 456);

    matches('xx', Match.NonEmptyString);
    fails('', Match.NonEmptyString);

    const isBinary = (x: any) => x instanceof Uint8Array;
    matches(new Uint8Array([1, 2, 3]), Match.Where(isBinary));
    fails([], Match.Where(isBinary));

    matches(42, Match.Where((x) => x % 2 === 0));
    fails(43, Match.Where((x) => x % 2 === 0));
  });

  it('validates Match.Integer', () => {
    matches(-1, Match.Integer);
    matches(0, Match.Integer);
    matches(2147483647, Match.Integer);
    fails(123.33, Match.Integer);
    fails(NaN, Match.Integer);
    fails(Infinity, Match.Integer);
  });

  it('formats error messages correctly', () => {
    const matchMsg = (value: any, pattern: any, expectedMessage: string) => {
      try {
        check(value, pattern);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toBe(`Match error: ${expectedMessage}`);
      }
    };

    matchMsg(2, String, 'Expected string, got number');
    matchMsg({ key: 0 }, Number, 'Expected number, got object');
    matchMsg(null, Boolean, 'Expected boolean, got null');
    matchMsg(false, [Boolean], 'Expected array, got false');
    matchMsg([null, null], [String], 'Expected string, got null in field [0]');
  });

  it('formats error paths correctly', () => {
    const matchPath = (value: any, pattern: any, expectedPath: string) => {
      try {
        check(value, pattern);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.path.replace(/\\u000a/, '\\n')).toBe(expectedPath);
      }
    };

    matchPath({ foo: [{ bar: 3 }, { bar: 'something' }] }, { foo: [{ bar: Number }] }, 'foo[1].bar');
    matchPath({ '1231': 123 }, { '1231': String }, '[1231]');
    matchPath([[['something', 'here'], []], [['string', 123]]], [[[String]]], '[1][0][1]');
  });

  it('supports throwAllErrors deeply nested', () => {
    const value = { embedded: { thing: '1' } };
    const pattern = { embedded: { thing: String, another: String }, missing1: String };
    
    let error: any;
    try {
      check(value, pattern, { throwAllErrors: true });
    } catch (e) {
      error = e;
    }

    expect(Array.isArray(error)).toBe(true);
    expect(error.length).toBe(2);
    expect(error[0].message).toBe("Match error: Missing key 'another' in field embedded");
    expect(error[1].message).toBe("Match error: Missing key 'missing1'");
  });
});