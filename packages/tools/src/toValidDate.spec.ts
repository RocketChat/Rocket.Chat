import { toValidDate } from './toValidDate';

describe('toValidDate', () => {
	it('should return the same Date when it is valid', () => {
		const date = new Date('2026-09-14T10:00:00.000Z');

		expect(toValidDate(date)).toBe(date);
	});

	it('should parse a valid date string', () => {
		expect(toValidDate('2026-09-14T10:00:00.000Z')?.toISOString()).toBe('2026-09-14T10:00:00.000Z');
	});

	it('should parse a timestamp', () => {
		expect(toValidDate(1_757_844_000_000)?.getTime()).toBe(1_757_844_000_000);
	});

	it('should accept the epoch', () => {
		expect(toValidDate(0)?.getTime()).toBe(0);
	});

	it('should return undefined for an absent value', () => {
		expect(toValidDate(undefined)).toBeUndefined();
		expect(toValidDate(null)).toBeUndefined();
		expect(toValidDate('')).toBeUndefined();
	});

	it('should return undefined for an invalid date string', () => {
		expect(toValidDate('not a date')).toBeUndefined();
		expect(toValidDate('2026-13-45')).toBeUndefined();
	});

	it('should return undefined for an Invalid Date', () => {
		expect(toValidDate(new Date('nonsense'))).toBeUndefined();
		expect(toValidDate(NaN)).toBeUndefined();
	});
});
