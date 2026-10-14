/**
 * @jest-environment <rootDir>/tests/environments/timezone.ts
 * @jest-environment-options {"timezone": "America/Argentina/Buenos_Aires"}
 */
import * as tools from '@rocket.chat/tools';

import { formatDate, momentFormatToDateFns, toDate, toTimezoneDate } from './dateFormat';

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

describe('toDate', () => {
	it('parses a bare yyyy-MM-dd string at LOCAL midnight (not UTC midnight)', () => {
		const d = toDate('2026-07-02');
		// Pre-fix `new Date('2026-07-02')` (UTC midnight) is the previous day / 21:00 here.
		expect(d.getFullYear()).toBe(2026);
		expect(d.getMonth()).toBe(6); // July (0-indexed)
		expect(d.getDate()).toBe(2);
		expect(d.getHours()).toBe(0);
	});

	it('keeps full ISO datetimes as instants (UTC preserved)', () => {
		expect(toDate('2026-07-02T15:30:00.000Z').toISOString()).toBe('2026-07-02T15:30:00.000Z');
	});

	it('returns Date objects unchanged', () => {
		const d = new Date();
		expect(toDate(d)).toBe(d);
	});

	it('accepts epoch milliseconds', () => {
		const ms = Date.UTC(2026, 6, 2, 12);
		expect(toDate(ms).getTime()).toBe(ms);
	});
});

describe('toTimezoneDate and timezone formatting', () => {
	// A message sent at 19:00:00 UTC:
	// - Before November 1, 2026: BC was winter UTC-8 (11:00 AM)
	// - In Summer 2026: BC was PDT UTC-7 (12:00 PM)
	// - After November 1, 2026: BC adopted permanent PDT UTC-7 (12:00 PM)
	const winterPre = new Date('2026-01-15T19:00:00.000Z');
	const summer = new Date('2026-07-15T19:00:00.000Z');
	const winterPost = new Date('2026-12-15T19:00:00.000Z');

	it('preserves historical British Columbia winter offset (UTC-8) before the transition', () => {
		const bcDate = toTimezoneDate(winterPre, 'Pacific Time (British Columbia)');
		expect(bcDate.getHours()).toBe(11);
		expect(bcDate.getMinutes()).toBe(0);
		expect(formatDate(winterPre, 'h:mm A', undefined, 'Pacific Time (British Columbia)')).toBe('11:00 AM');
		expect(formatDate(winterPre, 'h:mm A', undefined, 'America/Vancouver')).toBe('11:00 AM');
	});

	it('formats British Columbia summer dates with UTC-7', () => {
		const bcDate = toTimezoneDate(summer, 'Pacific Time (British Columbia)');
		expect(bcDate.getHours()).toBe(12);
		expect(bcDate.getMinutes()).toBe(0);
		expect(formatDate(summer, 'h:mm A', undefined, 'Pacific Time (British Columbia)')).toBe('12:00 PM');
		expect(formatDate(summer, 'h:mm A', undefined, 'America/Vancouver')).toBe('12:00 PM');
	});

	it('formats British Columbia dates after the November 2026 transition with permanent UTC-7', () => {
		const bcDate = toTimezoneDate(winterPost, 'Pacific Time (British Columbia)');
		expect(bcDate.getHours()).toBe(12);
		expect(bcDate.getMinutes()).toBe(0);
		expect(formatDate(winterPost, 'h:mm A', undefined, 'Pacific Time (British Columbia)')).toBe('12:00 PM');
		expect(formatDate(winterPost, 'h:mm A', undefined, 'America/Vancouver')).toBe('12:00 PM');
	});

	it('handles Alberta and Manitoba on both sides of each transition', () => {
		const abWinterPre = new Date('2026-01-15T18:00:00.000Z');
		const abWinterPost = new Date('2026-12-15T18:00:00.000Z');
		expect(formatDate(abWinterPre, 'h:mm A', undefined, 'Mountain Time (Alberta)')).toBe('11:00 AM');
		expect(formatDate(abWinterPost, 'h:mm A', undefined, 'Mountain Time (Alberta)')).toBe('12:00 PM');
		expect(formatDate(abWinterPre, 'h:mm A', undefined, 'America/Edmonton')).toBe('11:00 AM');
		expect(formatDate(abWinterPost, 'h:mm A', undefined, 'America/Edmonton')).toBe('12:00 PM');

		const mbWinterPre = new Date('2026-01-15T17:00:00.000Z');
		const mbWinterPost = new Date('2026-12-15T17:00:00.000Z');
		expect(formatDate(mbWinterPre, 'h:mm A', undefined, 'Manitoba')).toBe('11:00 AM');
		expect(formatDate(mbWinterPost, 'h:mm A', undefined, 'Manitoba')).toBe('12:00 PM');
		expect(formatDate(mbWinterPre, 'h:mm A', undefined, 'America/Winnipeg')).toBe('11:00 AM');
		expect(formatDate(mbWinterPost, 'h:mm A', undefined, 'America/Winnipeg')).toBe('12:00 PM');
	});

	it('formats at cutover boundaries just before and at the 2026-11-01 transition instants', () => {
		// British Columbia cutover: 2026-11-01T09:00:00.000Z (02:00 PDT)
		const bcJustBefore = new Date('2026-11-01T08:59:59.000Z');
		const bcAtCutover = new Date('2026-11-01T09:00:00.000Z');
		// Before cutover: PDT (UTC-7) -> 1:59:59 AM
		expect(formatDate(bcJustBefore, 'h:mm:ss A', undefined, 'Pacific Time (British Columbia)')).toBe('1:59:59 AM');
		expect(formatDate(bcJustBefore, 'h:mm:ss A', undefined, 'America/Vancouver')).toBe('1:59:59 AM');
		// At cutover: Permanent UTC-7 (America/Dawson_Creek) -> 2:00:00 AM
		expect(formatDate(bcAtCutover, 'h:mm:ss A', undefined, 'Pacific Time (British Columbia)')).toBe('2:00:00 AM');
		expect(formatDate(bcAtCutover, 'h:mm:ss A', undefined, 'America/Vancouver')).toBe('2:00:00 AM');

		// Alberta cutover: 2026-11-01T08:00:00.000Z (02:00 MDT)
		const abJustBefore = new Date('2026-11-01T07:59:59.000Z');
		const abAtCutover = new Date('2026-11-01T08:00:00.000Z');
		// Before cutover: MDT (UTC-6) -> 1:59:59 AM
		expect(formatDate(abJustBefore, 'h:mm:ss A', undefined, 'Mountain Time (Alberta)')).toBe('1:59:59 AM');
		expect(formatDate(abJustBefore, 'h:mm:ss A', undefined, 'America/Edmonton')).toBe('1:59:59 AM');
		// At cutover: Permanent UTC-6 (America/Regina) -> 2:00:00 AM
		expect(formatDate(abAtCutover, 'h:mm:ss A', undefined, 'Mountain Time (Alberta)')).toBe('2:00:00 AM');
		expect(formatDate(abAtCutover, 'h:mm:ss A', undefined, 'America/Edmonton')).toBe('2:00:00 AM');

		// Manitoba cutover: 2026-11-01T07:00:00.000Z (02:00 CDT)
		const mbJustBefore = new Date('2026-11-01T06:59:59.000Z');
		const mbAtCutover = new Date('2026-11-01T07:00:00.000Z');
		// Before cutover: CDT (UTC-5) -> 1:59:59 AM
		expect(formatDate(mbJustBefore, 'h:mm:ss A', undefined, 'Manitoba')).toBe('1:59:59 AM');
		expect(formatDate(mbJustBefore, 'h:mm:ss A', undefined, 'America/Winnipeg')).toBe('1:59:59 AM');
		// At cutover: Permanent UTC-5 (America/Atikokan) -> 2:00:00 AM
		expect(formatDate(mbAtCutover, 'h:mm:ss A', undefined, 'Manitoba')).toBe('2:00:00 AM');
		expect(formatDate(mbAtCutover, 'h:mm:ss A', undefined, 'America/Winnipeg')).toBe('2:00:00 AM');
	});

	it('preserves instant and epoch without host DST gap distortion', () => {
		const bcDate = toTimezoneDate(winterPost, 'America/Vancouver');
		expect(bcDate.getTime()).toBe(winterPost.getTime());
		expect(bcDate.getTimezoneOffset()).toBe(420); // UTC-7
	});

	it('routes "local" through local-zone resolution', () => {
		const formattedDefault = formatDate(winterPost, 'h:mm A');
		const formattedLocal = formatDate(winterPost, 'h:mm A', undefined, 'local');
		expect(formattedLocal).toBe(formattedDefault);
	});

	it('formats dates using browser-reported Canadian timezone via getLocalResolvedDate', () => {
		const spy = jest.spyOn(tools, 'guessTimezone').mockReturnValue('America/Vancouver');

		// Before transition (Jan 15, 2026): formats with historical winter UTC-8 (11:00 AM)
		expect(formatDate(winterPre, 'h:mm A')).toBe('11:00 AM');

		// After transition (Dec 15, 2026): formats with permanent UTC-7 (12:00 PM)
		expect(formatDate(winterPost, 'h:mm A')).toBe('12:00 PM');

		// Simulate Alberta (America/Edmonton)
		spy.mockReturnValue('America/Edmonton');
		expect(formatDate(new Date('2026-01-15T18:00:00.000Z'), 'h:mm A')).toBe('11:00 AM');
		expect(formatDate(new Date('2026-12-15T18:00:00.000Z'), 'h:mm A')).toBe('12:00 PM');

		// Simulate Manitoba (America/Winnipeg)
		spy.mockReturnValue('America/Winnipeg');
		expect(formatDate(new Date('2026-01-15T17:00:00.000Z'), 'h:mm A')).toBe('11:00 AM');
		expect(formatDate(new Date('2026-12-15T17:00:00.000Z'), 'h:mm A')).toBe('12:00 PM');

		// Simulate permanent zones America/Dawson_Creek and America/Regina directly
		spy.mockReturnValue('America/Dawson_Creek');
		expect(formatDate(winterPost, 'h:mm A')).toBe('12:00 PM');

		spy.mockReturnValue('America/Regina');
		expect(formatDate(new Date('2026-12-15T18:00:00.000Z'), 'h:mm A')).toBe('12:00 PM');

		spy.mockRestore();
	});

	it('formats dates with timezone "none" without any timezone conversions', () => {
		const rawDate = new Date('2026-01-15T19:00:00.000Z');
		expect(typeof formatDate(rawDate, 'h:mm A', undefined, 'none')).toBe('string');
	});
});


