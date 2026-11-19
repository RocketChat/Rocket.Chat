import { parseLocalSearchQuery } from './parseLocalSearchQuery';

const HOUR = 60 * 60 * 1000;
const utcMidnight = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day);

describe('parseLocalSearchQuery', () => {
	it('reads day-month-year dates, with the day boundaries at UTC midnight for a user with no utcOffset', () => {
		expect(parseLocalSearchQuery('needle after:26/10/2026 before:28-10-2026')).toEqual({
			text: 'needle',
			usernames: [],
			from: utcMidnight(2026, 10, 27),
			to: utcMidnight(2026, 10, 28),
		});
	});

	it('starts the day at midnight in the time zone of the user, like the server message search', () => {
		expect(parseLocalSearchQuery('on:26.10.2026', { utcOffset: -3 })).toEqual({
			text: '',
			usernames: [],
			from: utcMidnight(2026, 10, 26) + 3 * HOUR,
			to: utcMidnight(2026, 10, 27) + 3 * HOUR - 1,
		});
		expect(parseLocalSearchQuery('on:26.10.2026', { utcOffset: 5.5 })).toEqual({
			text: '',
			usernames: [],
			from: utcMidnight(2026, 10, 26) - 5.5 * HOUR,
			to: utcMidnight(2026, 10, 27) - 5.5 * HOUR - 1,
		});
	});

	it('does not read ISO dates, like the server message search: they stay in the text', () => {
		expect(parseLocalSearchQuery('from:me after:2026-10-26')).toEqual({ text: 'after:2026-10-26', usernames: [], fromSelf: true });
	});

	it('reads only a lowercase from:me as the logged-in user, like the server, and another spelling as a username', () => {
		expect(parseLocalSearchQuery('from:Me from:ME')).toEqual({ text: '', usernames: ['me'] });
		expect(parseLocalSearchQuery('from:me from:Bob')).toEqual({ text: '', usernames: ['bob'], fromSelf: true });
	});

	it('keeps the last before: and the last after:, and on: replaces both, like the server message search', () => {
		expect(parseLocalSearchQuery('before:10-03-2025 before:01-03-2025 after:01-01-2025 after:05-01-2025')).toMatchObject({
			from: utcMidnight(2025, 1, 6),
			to: utcMidnight(2025, 3, 1),
		});
		expect(parseLocalSearchQuery('before:10-03-2025 on:5.6.2024')).toMatchObject({
			from: utcMidnight(2024, 6, 5),
			to: utcMidnight(2024, 6, 6) - 1,
		});
	});
});
