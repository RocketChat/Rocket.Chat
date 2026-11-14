import { isTruthy } from './isTruthy';

describe('isTruthy', () => {
	describe('truthy values', () => {
		it('should return true for boolean true', () => {
			expect(isTruthy(true)).toBe(true);
		});

		test.each([
			['simple non-empty string', 'hello'],
			['whitespace-only string', ' '],
			['string containing "0"', '0'],
			['string containing "false"', 'false'],
		])('should return true for %s', (_desc, input) => {
			expect(isTruthy(input)).toBe(true);
		});

		test.each([
			['positive integer', 1],
			['large positive integer', 100],
			['positive float', 3.14],
			['negative integer', -1],
			['negative float', -0.5],
			['positive infinity', Infinity],
			['negative infinity', -Infinity],
		])('should return true for %s', (_desc, input) => {
			expect(isTruthy(input)).toBe(true);
		});

		test.each([
			['positive bigint', 1n],
			['negative bigint', -1n],
		])('should return true for %s', (_desc, input) => {
			expect(isTruthy(input)).toBe(true);
		});

		it('should return true for symbol', () => {
			expect(isTruthy(Symbol('test'))).toBe(true);
		});

		it('should return true for empty plain object', () => {
			expect(isTruthy({})).toBe(true);
		});

		it('should return true for non-empty object', () => {
			expect(isTruthy({ key: 'value' })).toBe(true);
		});

		it('should return true for object with falsy properties', () => {
			expect(isTruthy({ active: false, count: 0 })).toBe(true);
		});

		it('should return true for empty array', () => {
			expect(isTruthy([])).toBe(true);
		});

		it('should return true for non-empty array', () => {
			expect(isTruthy([1, 2, 3])).toBe(true);
		});

		it('should return true for array containing only falsy elements', () => {
			expect(isTruthy([false, 0, ''])).toBe(true);
		});

		it('should return true for functions', () => {
			expect(isTruthy(() => undefined)).toBe(true);
			expect(
				isTruthy(function () {
					return undefined;
				}),
			).toBe(true);
		});

		it('should return true for built-in instances', () => {
			expect(isTruthy(new Date())).toBe(true);
			expect(isTruthy(/regex/)).toBe(true);
			expect(isTruthy(new Map())).toBe(true);
			expect(isTruthy(new Set())).toBe(true);
		});
	});

	describe('falsy values', () => {
		it('should return false for boolean false', () => {
			expect(isTruthy(false)).toBe(false);
		});

		it('should return false for empty string', () => {
			expect(isTruthy('')).toBe(false);
		});

		it('should return false for zero (0)', () => {
			expect(isTruthy(0)).toBe(false);
		});

		it('should return false for negative zero (-0)', () => {
			expect(isTruthy(-0)).toBe(false);
		});

		it('should return false for null', () => {
			expect(isTruthy(null)).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isTruthy(undefined)).toBe(false);
		});

		it('should return false for NaN', () => {
			expect(isTruthy(NaN)).toBe(false);
		});
	});

	describe('type guard behavior', () => {
		it('should narrow types when filtering an array of strings and falsy values', () => {
			const mixed: (string | null | undefined | false | 0 | '')[] = ['alpha', null, 'beta', '', undefined, false, 0, 'gamma'];
			const filtered: string[] = mixed.filter(isTruthy);

			expect(filtered).toEqual(['alpha', 'beta', 'gamma']);
		});

		it('should filter out falsy numbers and nullish values', () => {
			const numbers: (number | null | undefined)[] = [1, 0, -1, null, 2.5, undefined, -0, NaN];
			const filtered: number[] = numbers.filter(isTruthy);

			expect(filtered).toEqual([1, -1, 2.5]);
		});

		it('should narrow nullable types in conditional expressions', () => {
			interface User {
				name: string;
			}
			const user: User | null = { name: 'Rocket.Chat' };
			const getName = (u: User | null): string => (isTruthy(u) ? u.name : 'anonymous');

			expect(getName(user)).toBe('Rocket.Chat');
			expect(getName(null)).toBe('anonymous');
		});
	});
});
