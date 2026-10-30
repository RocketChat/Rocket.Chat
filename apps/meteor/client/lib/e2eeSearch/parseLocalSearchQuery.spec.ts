import { parseLocalSearchQuery } from './parseLocalSearchQuery';

const HOUR = 60 * 60 * 1000;
const midnight = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day);

describe('parseLocalSearchQuery', () => {
	it('reads day-month-year dates with inclusive bounds', () => {
		expect(parseLocalSearchQuery('needle after:26/10/2026 before:28-10-2026')).toEqual({
			text: 'needle',
			usernames: [],
			from: midnight(2026, 10, 27),
			to: midnight(2026, 10, 28),
		});
	});

	it.each([-12, -9.5, -3, 0, 5.5, 10, 14])('uses local midnight at UTC offset %p', (utcOffset) => {
		expect(parseLocalSearchQuery('on:26.10.2026', { utcOffset })).toEqual({
			text: '',
			usernames: [],
			from: midnight(2026, 10, 26) - utcOffset * HOUR,
			to: midnight(2026, 10, 27) - utcOffset * HOUR - 1,
		});
	});

	it('defaults the UTC offset to zero', () => {
		expect(parseLocalSearchQuery('on:26.10.2026')).toEqual(parseLocalSearchQuery('on:26.10.2026', { utcOffset: 0 }));
	});

	it('leaves ISO dates and unsupported filters in the text', () => {
		expect(parseLocalSearchQuery('from:me after:2026-10-26 has:star')).toEqual({
			text: 'after:2026-10-26 has:star',
			usernames: [],
			fromSelf: true,
		});
	});

	it('resolves only lowercase me as the self alias', () => {
		expect(parseLocalSearchQuery('from:Me from:ME')).toEqual({ text: '', usernames: ['me'] });
		expect(parseLocalSearchQuery('from:me from:Bob')).toEqual({ text: '', usernames: ['bob'], fromSelf: true });
	});

	it('deduplicates lowercase usernames and preserves supported username characters', () => {
		expect(parseLocalSearchQuery('  hello\n from:Bob from:bob from:a.b-c_d \tworld ')).toEqual({
			text: 'hello world',
			usernames: ['bob', 'a.b-c_d'],
		});
	});

	it('keeps the last before and after bounds and lets on replace both', () => {
		expect(parseLocalSearchQuery('before:10-03-2025 before:01-03-2025 after:01-01-2025 after:05-01-2025')).toMatchObject({
			from: midnight(2025, 1, 6),
			to: midnight(2025, 3, 1),
		});
		expect(parseLocalSearchQuery('before:10-03-2025 on:5.6.2024')).toMatchObject({
			from: midnight(2024, 6, 5),
			to: midnight(2024, 6, 6) - 1,
		});
	});

	it('applies filter precedence rather than source position', () => {
		expect(parseLocalSearchQuery('on:5.6.2024 after:01-01-2025 before:10-03-2025')).toMatchObject({
			from: midnight(2024, 6, 5),
			to: midnight(2024, 6, 6) - 1,
		});
	});

	it('preserves Date rollover for day-month-year input', () => {
		expect(parseLocalSearchQuery('on:31/02/2026')).toMatchObject({ from: midnight(2026, 3, 3), to: midnight(2026, 3, 4) - 1 });
	});

	it('accepts empty input', () => {
		expect(parseLocalSearchQuery('  \n ')).toEqual({ text: '', usernames: [] });
	});

	it.each([NaN, Infinity, -Infinity])('rejects a non-finite UTC offset %p', (utcOffset) => {
		expect(() => parseLocalSearchQuery('on:26.10.2026', { utcOffset })).toThrow(RangeError);
	});
});
