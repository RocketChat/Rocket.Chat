import { convertFromDaysToMilliseconds } from './converter';

describe('convertFromDaysToMilliseconds', () => {
	it('should throw an error when a non number is passed', () => {
		// @ts-expect-error - Testing
		expect(() => convertFromDaysToMilliseconds('90')).toThrow();
	});
	it('should return the value passed when its valid', () => {
		expect(convertFromDaysToMilliseconds(85)).toBe(85 * 24 * 60 * 60 * 1000);
	});
	it('should fail if anything but an integer is passed', () => {
		expect(() => convertFromDaysToMilliseconds(85.5)).toThrow();
		expect(() => convertFromDaysToMilliseconds(-2.3)).toThrow();
	});
});
