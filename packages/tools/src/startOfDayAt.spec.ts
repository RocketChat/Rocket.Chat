import { startOfDayAt } from './startOfDayAt';

describe('startOfDayAt', () => {
	const at = new Date('2026-08-31T09:47:31.250Z');

	it.each([
		['ahead of UTC', 9, '2026-08-30T15:00:00.000Z'],
		['behind it', -4, '2026-08-31T04:00:00.000Z'],
		['on it', 0, '2026-08-31T00:00:00.000Z'],
		['half an hour off the mark', 5.5, '2026-08-30T18:30:00.000Z'],
		['three quarters off it', 5.75, '2026-08-30T18:15:00.000Z'],
	])('finds the midnight of a caller %s', (_, utcOffset, expected) => {
		expect(startOfDayAt(at, utcOffset).toISOString()).toBe(expected);
	});

	it('turns the date over where the caller does and not where UTC does', () => {
		// Half an hour before UTC midnight: already tomorrow for anyone ahead, still today for anyone behind
		const lateUtc = new Date('2026-08-31T23:30:00.000Z');

		expect(startOfDayAt(lateUtc, 2).toISOString()).toBe('2026-08-31T22:00:00.000Z');
		expect(startOfDayAt(lateUtc, -2).toISOString()).toBe('2026-08-31T02:00:00.000Z');
	});

	it('leaves a midnight where it already is', () => {
		const midnightAtNine = new Date('2026-08-30T15:00:00.000Z');

		expect(startOfDayAt(midnightAtNine, 9).toISOString()).toBe(midnightAtNine.toISOString());
	});

	it('falls back to the day the process is in when the caller has no offset to give', () => {
		const fallback = startOfDayAt(at);

		expect([fallback.getHours(), fallback.getMinutes(), fallback.getSeconds(), fallback.getMilliseconds()]).toEqual([0, 0, 0, 0]);
		expect(fallback.toDateString()).toBe(at.toDateString());
	});
});
