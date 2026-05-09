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
		expect(momentFormatToDateFns('MMMM Do YYYY, h:mm:ss a')).toBe('MMMM do yyyy, h:mm:ss aaa');
	});

	it('preserves AM/PM casing (Moment A = uppercase, a = lowercase)', () => {
		// date-fns `a` is always uppercase; `aaa` is lowercase. So Moment `a` → `aaa`.
		expect(momentFormatToDateFns('A')).toBe('a');
		expect(momentFormatToDateFns('a')).toBe('aaa');
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

	it('maps day-of-year tokens (DDD, DDDo, DDDD)', () => {
		expect(momentFormatToDateFns('DDD')).toBe('D');
		expect(momentFormatToDateFns('DDDo')).toBe('Do');
		expect(momentFormatToDateFns('DDDD')).toBe('DDD');
	});

	it('maps day-of-week ordinal (do)', () => {
		expect(momentFormatToDateFns('do')).toBe('io');
	});

	it('maps the 6-digit padded year (YYYYYY)', () => {
		expect(momentFormatToDateFns('YYYYYY')).toBe('yyyyyy');
	});

	it('maps timezone abbreviation tokens (z, zz)', () => {
		expect(momentFormatToDateFns('z')).toBe('zzz');
		expect(momentFormatToDateFns('zz')).toBe('zzz');
	});

	it('maps extended fractional-second tokens (SSSS…SSSSSSSSS)', () => {
		expect(momentFormatToDateFns('SSSS')).toBe('SSSS');
		expect(momentFormatToDateFns('SSSSSSSSS')).toBe('SSSSSSSSS');
	});

	it('maps era year (y) and era name (N…NNNNN)', () => {
		expect(momentFormatToDateFns('y')).toBe('y');
		expect(momentFormatToDateFns('N')).toBe('G');
		expect(momentFormatToDateFns('NN')).toBe('GG');
		expect(momentFormatToDateFns('NNN')).toBe('GGG');
		expect(momentFormatToDateFns('NNNN')).toBe('GGGG');
		expect(momentFormatToDateFns('NNNNN')).toBe('GGGGG');
	});

	it('maps lowercase locale variants (l, ll, lll, llll)', () => {
		expect(momentFormatToDateFns('l')).toBe('P');
		expect(momentFormatToDateFns('ll')).toBe('PP');
		expect(momentFormatToDateFns('lll')).toBe('PP p');
		expect(momentFormatToDateFns('llll')).toBe('EEE, PP p');
	});

	it('preserves tokens that are identical between Moment and date-fns (kk, Q, ww)', () => {
		// Regression: these used to pass through unchanged; tokenizer now must list them
		// explicitly so they aren't quoted as literals.
		expect(momentFormatToDateFns('kk:mm')).toBe('kk:mm');
		expect(momentFormatToDateFns('k:mm')).toBe('k:mm');
		expect(momentFormatToDateFns('Q')).toBe('Q');
		expect(momentFormatToDateFns('ww')).toBe('ww');
	});

	it('maps ISO week-of-year tokens (W, WW, Wo)', () => {
		expect(momentFormatToDateFns('W')).toBe('I');
		expect(momentFormatToDateFns('WW')).toBe('II');
		expect(momentFormatToDateFns('Wo')).toBe('Io');
	});

	it('maps week-year tokens (gg/gggg locale, GG/GGGG ISO)', () => {
		expect(momentFormatToDateFns('gg')).toBe('YY');
		expect(momentFormatToDateFns('gggg')).toBe('YYYY');
		expect(momentFormatToDateFns('GG')).toBe('RR');
		expect(momentFormatToDateFns('GGGG')).toBe('RRRR');
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

	it('formats week-year tokens without throwing on date-fns Y warning', () => {
		// date-fns refuses Y/YY/YYYY without useAdditionalWeekYearTokens — verify the
		// option is wired through.
		expect(() => formatDate(sample, 'gggg')).not.toThrow();
		expect(formatDate(sample, 'gggg')).toMatch(/^\d{4}$/);
	});
});
