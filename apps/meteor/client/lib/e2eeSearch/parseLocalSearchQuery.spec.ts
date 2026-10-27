import { parseLocalSearchQuery } from './parseLocalSearchQuery';

const midnight = (year: number, month: number, day: number) => new Date(year, month - 1, day).getTime();

describe('parseLocalSearchQuery', () => {
	it('reads day-month-year dates', () => {
		expect(parseLocalSearchQuery('needle after:26/10/2026 before:28-10-2026')).toEqual({
			text: 'needle',
			usernames: [],
			from: midnight(2026, 10, 27),
			to: midnight(2026, 10, 28),
		});
	});

	it('reads an ISO after: date like the day-month-year form', () => {
		expect(parseLocalSearchQuery('from:me after:2026-10-26')).toEqual(parseLocalSearchQuery('from:me after:26-10-2026'));
		expect(parseLocalSearchQuery('after:2026-10-26')).toEqual({ text: '', usernames: [], from: midnight(2026, 10, 27) });
	});

	it('reads ISO before: and on: dates', () => {
		expect(parseLocalSearchQuery('needle before:2026-10-28')).toEqual({ text: 'needle', usernames: [], to: midnight(2026, 10, 28) });
		expect(parseLocalSearchQuery('on:2026-10-26')).toEqual({
			text: '',
			usernames: [],
			from: midnight(2026, 10, 26),
			to: midnight(2026, 10, 27) - 1,
		});
	});

	it('reads year-month-day with slashes or dots', () => {
		expect(parseLocalSearchQuery('after:2026/10/26').from).toBe(midnight(2026, 10, 27));
		expect(parseLocalSearchQuery('after:2026.10.26').from).toBe(midnight(2026, 10, 27));
	});

	it('does not read a day-month-year date as year-month-day', () => {
		expect(parseLocalSearchQuery('on:01-02-2026')).toMatchObject({ from: midnight(2026, 2, 1) });
	});
});
