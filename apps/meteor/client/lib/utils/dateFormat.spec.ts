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

	it('preserves empty literal blocks', () => {
		expect(momentFormatToDateFns('[] LT')).toBe("'' p");
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
});
