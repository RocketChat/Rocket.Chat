import { getLoginExpiration } from './getLoginExpiration';

describe('getLoginExpiration', () => {
	it('should return 90 by default', () => {
		expect(getLoginExpiration()).toBe(90);
	});
	it('should return 90 when value is 0', () => {
		expect(getLoginExpiration(0)).toBe(90);
	});
	it('should return 90 when value is NaN', () => {
		expect(getLoginExpiration(NaN)).toBe(90);
	});
	it('should return 90 when value is negative', () => {
		expect(getLoginExpiration(-1)).toBe(90);
	});
	it('should return 90 when value is undefined', () => {
		expect(getLoginExpiration(undefined)).toBe(90);
	});
	it('should return 90 when value is not a number', () => {
		// @ts-expect-error - Testing
		expect(getLoginExpiration('90')).toBe(90);
	});
	it('should return the value passed when its valid', () => {
		expect(getLoginExpiration(85)).toBe(85);
	});
});
