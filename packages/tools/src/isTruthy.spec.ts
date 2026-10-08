import { isTruthy } from './isTruthy';

describe('isTruthy', () => {
	test.each([
		['undefined', undefined],
		['null', null],
		['false', false],
		['zero', 0],
		['empty string', ''],
		['NaN', Number.NaN],
	])('returns false for falsy values: %s', (_name, value) => {
		expect(isTruthy(value)).toBe(false);
	});

	test.each([
		['true', true],
		['number', 1],
		['string', 'value'],
		['symbol', Symbol('value')],
		['bigint', BigInt(1)],
		['array', []],
		['function', () => undefined],
		['object', {}],
	])('returns true for truthy values: %s', (_name, value) => {
		expect(isTruthy(value)).toBe(true);
	});
});
