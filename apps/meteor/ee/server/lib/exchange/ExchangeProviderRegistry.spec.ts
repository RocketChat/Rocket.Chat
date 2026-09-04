import { getSyncWindow } from './ExchangeProviderRegistry';
import { settings } from '../../../../server/settings';

jest.mock('../../../../server/settings', () => ({
	settings: { get: jest.fn() },
}));

const setDays = (value: number | undefined) => jest.mocked(settings.get).mockReturnValue(value);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const midnight = new Date('2026-08-31T00:00:00Z');

describe('getSyncWindow', () => {
	beforeEach(() => jest.clearAllMocks());

	it('starts at midnight so an event earlier today is still inside the window', () => {
		setDays(2);

		expect(getSyncWindow(new Date('2026-08-31T09:47:31.250Z'))).toEqual({
			start: midnight,
			end: new Date('2026-09-02T00:00:00Z'),
		});
	});

	it('gives every moment of one day the identical window, which is what a delta link needs', () => {
		setDays(2);

		const first = getSyncWindow(midnight);

		for (const offset of [1, HOUR, DAY - 1]) {
			expect(getSyncWindow(new Date(midnight.getTime() + offset))).toEqual(first);
		}
	});

	it('moves to the next window once the day is over', () => {
		setDays(2);

		expect(getSyncWindow(new Date(midnight.getTime() + DAY)).start).toEqual(new Date(midnight.getTime() + DAY));
	});

	it.each([
		['zero, which would sync nothing at all', 0, 2],
		['a fractional value the int field should not have allowed', 0.5, 2],
		['a negative value', -12, 1],
		['more than thirty days, past what a CalendarView will return', 5000, 30],
	])('clamps %s', (_label, configured, expectedDays) => {
		setDays(configured);

		expect(getSyncWindow(midnight).end).toEqual(new Date(midnight.getTime() + expectedDays * DAY));
	});

	it('defaults when the setting is missing rather than producing an invalid range', () => {
		setDays(undefined);

		expect(getSyncWindow(midnight).end).toEqual(new Date(midnight.getTime() + 2 * DAY));
	});

	it('covers whole days, so the range never shrinks as the day goes on', () => {
		setDays(2);

		for (const offset of [0, HOUR, DAY - 1]) {
			const at = new Date(midnight.getTime() + offset);

			expect(getSyncWindow(at).end).toEqual(new Date(midnight.getTime() + 2 * DAY));
		}
	});
});
