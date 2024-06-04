import { getLoginExpirationInDays } from './getLoginExpiration';

describe('getLoginExpiration', () => {
	it('should return 90 by default', () => {
		expect(getLoginExpirationInDays()).toBe(90);
	});
	it('should return 90 when value is 0', () => {
		expect(getLoginExpirationInDays(0)).toBe(90);
	});
	it('should return 90 when value is NaN', () => {
		expect(getLoginExpirationInDays(NaN)).toBe(90);
	});
	it('should return 90 when value is negative', () => {
		expect(getLoginExpirationInDays(-1)).toBe(90);
	});
	it('should return 90 when value is undefined', () => {
		expect(getLoginExpirationInDays(undefined)).toBe(90);
	});
	it('should return 90 when value is not a number', () => {
		// @ts-expect-error - Testing
		expect(getLoginExpirationInDays('90')).toBe(90);
	});
	it('should return the value passed when its valid', () => {
		expect(getLoginExpirationInDays(85)).toBe(85);
	});
});
