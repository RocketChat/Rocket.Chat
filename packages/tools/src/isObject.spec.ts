import { isObject } from './isObject';

describe('isObject', () => {
	test.each([
		['undefined', undefined],
		['null', null],
		['boolean', true],
		['number', 1],
		['string', 'value'],
		['symbol', Symbol('value')],
		['bigint', BigInt(1)],
	])('returns false for primitives and nullish values: %s', (_name, value) => {
		expect(isObject(value)).toBe(false);
	});

	test.each([
		['object', {}],
		['array', []],
		['function', () => undefined],
		['date', new Date()],
	])('returns true for objects, arrays, and functions: %s', (_name, value) => {
		expect(isObject(value)).toBe(true);
	});
});
