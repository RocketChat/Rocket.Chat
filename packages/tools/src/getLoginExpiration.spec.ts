import { getLoginExpirationInDays, getLoginExpirationInMs } from './getLoginExpiration';

describe('getLoginExpirationInDays', () => {
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
	it.each([0.5, 85.5, Infinity])('should return 90 for a non-integer expiration of %s', (expiry) => {
		expect(getLoginExpirationInDays(expiry)).toBe(90);
	});
});

describe('getLoginExpirationInMs', () => {
	it('should return 90 days in milliseconds when no value is passed', () => {
		expect(getLoginExpirationInMs()).toBe(90 * 24 * 60 * 60 * 1000);
	});
	it('should return the value passed when its valid', () => {
		expect(getLoginExpirationInMs(85)).toBe(85 * 24 * 60 * 60 * 1000);
	});
	it.each([0.5, 85.5, Infinity])('should use the default without throwing for an expiration of %s', (expiry) => {
		expect(getLoginExpirationInMs(expiry)).toBe(90 * 24 * 60 * 60 * 1000);
	});
});
