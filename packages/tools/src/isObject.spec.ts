import { isObject } from './isObject';

describe('isObject', () => {
	describe('plain and empty objects', () => {
		it('should return true for empty plain object', () => {
			expect(isObject({})).toBe(true);
		});

		it('should return true for object created with Object.create(null)', () => {
			expect(isObject(Object.create(null))).toBe(true);
		});

		it('should return true for object created with Object.fromEntries', () => {
			expect(isObject(Object.fromEntries([]))).toBe(true);
		});

		it('should return true for new Object() instance', () => {
			expect(isObject(new Object())).toBe(true);
		});
	});

	describe('objects with properties', () => {
		it('should return true for object with string keys', () => {
			expect(isObject({ key: 'value', count: 1 })).toBe(true);
		});

		it('should return true for object with numeric keys', () => {
			expect(isObject({ 0: 'zero', 1: 'one' })).toBe(true);
		});

		it('should return true for object with symbol keys', () => {
			expect(isObject({ [Symbol('key')]: 'value' })).toBe(true);
		});

		it('should return true for deeply nested object', () => {
			expect(isObject({ level1: { level2: { level3: true } } })).toBe(true);
		});

		it('should return true for object with nullish property values', () => {
			expect(isObject({ a: null, b: undefined })).toBe(true);
		});
	});

	describe('arrays', () => {
		it('should return true for empty array', () => {
			expect(isObject([])).toBe(true);
		});

		it('should return true for non-empty array of primitives', () => {
			expect(isObject([1, 'two', true])).toBe(true);
		});

		it('should return true for array of objects', () => {
			expect(isObject([{}, { a: 1 }])).toBe(true);
		});

		it('should return true for new Array() instance', () => {
			expect(isObject(new Array(5))).toBe(true);
		});
	});

	describe('functions (intentionally accepted per contract)', () => {
		it('should return true for arrow function', () => {
			expect(isObject(() => undefined)).toBe(true);
		});

		it('should return true for standard function expression', () => {
			expect(
				isObject(function () {
					return undefined;
				}),
			).toBe(true);
		});

		it('should return true for named function', () => {
			function namedFunction() {
				return 'named';
			}
			expect(isObject(namedFunction)).toBe(true);
		});

		it('should return true for async function', () => {
			expect(isObject(async () => undefined)).toBe(true);
		});

		it('should return true for generator function', () => {
			expect(
				isObject(function* () {
					yield 1;
				}),
			).toBe(true);
		});

		it('should return true for class constructor', () => {
			class CustomClass {}
			expect(isObject(CustomClass)).toBe(true);
		});

		it('should return true for class instance method', () => {
			const obj = {
				method() {
					return true;
				},
			};
			expect(isObject(obj.method)).toBe(true);
		});
	});

	describe('built-in objects', () => {
		it('should return true for Date instance', () => {
			expect(isObject(new Date())).toBe(true);
		});

		it('should return true for RegExp literal and instance', () => {
			expect(isObject(/test-regex/)).toBe(true);
			expect(isObject(new RegExp('test-regex'))).toBe(true);
		});

		it('should return true for Map and Set instances', () => {
			expect(isObject(new Map())).toBe(true);
			expect(isObject(new Set())).toBe(true);
		});

		it('should return true for WeakMap and WeakSet instances', () => {
			expect(isObject(new WeakMap())).toBe(true);
			expect(isObject(new WeakSet())).toBe(true);
		});

		it('should return true for Error instance', () => {
			expect(isObject(new Error('test error'))).toBe(true);
		});

		it('should return true for Promise instance', () => {
			expect(isObject(Promise.resolve(42))).toBe(true);
		});

		it('should return true for object wrappers', () => {
			// eslint-disable-next-line no-new-wrappers
			expect(isObject(new String('wrapped'))).toBe(true);
			// eslint-disable-next-line no-new-wrappers
			expect(isObject(new Number(123))).toBe(true);
			// eslint-disable-next-line no-new-wrappers
			expect(isObject(new Boolean(true))).toBe(true);
		});
	});

	describe('primitives and falsy values (should return false)', () => {
		it('should return false for null (rejection of typeof null === "object")', () => {
			expect(isObject(null)).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isObject(undefined)).toBe(false);
		});

		test.each([
			['empty string', ''],
			['non-empty string', 'hello'],
			['numeric string', '123'],
		])('should return false for string (%s)', (_desc, input) => {
			expect(isObject(input)).toBe(false);
		});

		test.each([
			['zero (0)', 0],
			['negative zero (-0)', -0],
			['positive integer', 42],
			['negative integer', -42],
			['decimal number', 3.14],
			['NaN', NaN],
			['positive Infinity', Infinity],
			['negative Infinity', -Infinity],
		])('should return false for number (%s)', (_desc, input) => {
			expect(isObject(input)).toBe(false);
		});

		test.each([
			['boolean true', true],
			['boolean false', false],
		])('should return false for %s', (_desc, input) => {
			expect(isObject(input)).toBe(false);
		});

		it('should return false for symbol', () => {
			expect(isObject(Symbol('test'))).toBe(false);
		});

		test.each([
			['bigint zero', 0n],
			['positive bigint', 42n],
			['negative bigint', -42n],
		])('should return false for %s', (_desc, input) => {
			expect(isObject(input)).toBe(false);
		});
	});

	describe('type guard behavior', () => {
		it('should narrow unknown type to object in conditional expressions', () => {
			const getKeys = (val: unknown): string[] => (isObject(val) ? Object.keys(val) : []);

			expect(getKeys({ framework: 'Rocket.Chat' })).toEqual(['framework']);
			expect(getKeys('primitive-string')).toEqual([]);
			expect(getKeys(null)).toEqual([]);
		});

		it('should narrow unknown array to object array when filtering', () => {
			const fn = () => 'test';
			const items: unknown[] = [{}, 'string', 123, null, fn, undefined, [1, 2]];
			const filtered: object[] = items.filter(isObject);

			expect(filtered).toEqual([{}, fn, [1, 2]]);
		});
	});
});
