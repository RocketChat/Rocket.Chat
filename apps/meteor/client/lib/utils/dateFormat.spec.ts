import { formatDate, momentFormatToDateFns } from './dateFormat';

describe('momentFormatToDateFns', () => {
	it('maps locale tokens', () => {
		expect(momentFormatToDateFns('L')).toBe('P');
		expect(momentFormatToDateFns('LT')).toBe('p');
		expect(momentFormatToDateFns('LTS')).toBe('pp');
		expect(momentFormatToDateFns('LL')).toBe('PPP');
		expect(momentFormatToDateFns('LLL')).toBe('PPP p');
		expect(momentFormatToDateFns('LLLL')).toBe('EEEE, PPP p');
	});

	it('maps common tokens', () => {
		expect(momentFormatToDateFns('YYYY-MM-DD HH:mm:ss')).toBe('yyyy-MM-dd HH:mm:ss');
		expect(momentFormatToDateFns('MMMM Do YYYY, h:mm:ss a')).toBe('MMMM do yyyy, h:mm:ss a');
	});

	it('translates moment [literal] escape to date-fns single-quoted literal', () => {
		expect(momentFormatToDateFns('[Today at] LT')).toBe("'Today at' p");
		expect(momentFormatToDateFns('[Session started at] HH:mm [on] LL')).toBe("'Session started at' HH:mm 'on' PPP");
	});

	it("escapes embedded single quotes inside literals as ''", () => {
		expect(momentFormatToDateFns("[it's] LT")).toBe("'it''s' p");
	});

	it('drops empty literal blocks since date-fns has no empty-string syntax', () => {
		// In date-fns, '' represents a literal apostrophe, not an empty string.
		expect(momentFormatToDateFns('[] LT')).toBe(' p');
	});

	it('quotes letters that are not Moment tokens (T in ISO 8601 separator)', () => {
		// In Moment, T is a literal; in date-fns T = ms timestamp. Must quote.
		expect(momentFormatToDateFns('YYYY-MM-DDTHH:mm:ss')).toBe("yyyy-MM-dd'T'HH:mm:ss");
	});

	it('maps Moment timezone offset tokens to date-fns equivalents', () => {
		expect(momentFormatToDateFns('Z')).toBe('xxx');
		expect(momentFormatToDateFns('ZZ')).toBe('xx');
		expect(momentFormatToDateFns('Z ZZ')).toBe('xxx xx');
		expect(momentFormatToDateFns('LT Z')).toBe('p xxx');
		expect(momentFormatToDateFns('YYYY-MM-DDTHH:mm:ssZ')).toBe("yyyy-MM-dd'T'HH:mm:ssxxx");
	});
});

describe('formatDate', () => {
	const sample = new Date('2026-04-24T20:30:45');

	it('formats literal blocks with locale tokens without throwing', () => {
		expect(() => formatDate(sample, '[Today at] LT')).not.toThrow();
		expect(formatDate(sample, '[Today at] LT')).toMatch(/^Today at /);
	});

	it('formats date with year-month-day token string', () => {
		expect(formatDate(sample, 'YYYY-MM-DD')).toBe('2026-04-24');
	});

	it('keeps the ISO 8601 T as a literal instead of inserting a ms timestamp', () => {
		expect(formatDate(sample, 'YYYY-MM-DDTHH:mm:ss')).toBe('2026-04-24T20:30:45');
	});

	it('does not throw on Moment timezone tokens', () => {
		expect(() => formatDate(sample, 'LT Z')).not.toThrow();
		expect(() => formatDate(sample, 'Z ZZ')).not.toThrow();
		expect(() => formatDate(sample, 'YYYY-MM-DDTHH:mm:ssZ')).not.toThrow();
	});

	it('falls back instead of crashing on a malformed format', () => {
		// Unterminated bracket — translator buffers but date-fns may still refuse.
		expect(() => formatDate(sample, '[unterminated')).not.toThrow();
	});
});
