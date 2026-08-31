import { getSyncWindow } from './ExchangeProviderRegistry';
import { settings } from '../../../../server/settings';

jest.mock('../../../../server/settings', () => ({
	settings: { get: jest.fn() },
}));

const setHours = (value: number | undefined) => jest.mocked(settings.get).mockReturnValue(value);

const HOUR = 60 * 60 * 1000;
const from = new Date('2026-08-31T09:00:00Z');

describe('getSyncWindow', () => {
	beforeEach(() => jest.clearAllMocks());

	it('runs from the given moment to that many hours ahead', () => {
		setHours(48);

		expect(getSyncWindow(from)).toEqual({ start: from, end: new Date('2026-09-02T09:00:00Z') });
	});

	it.each([
		['zero, which would sync nothing at all', 0, 48],
		['a fractional value the int field should not have allowed', 0.5, 48],
		['a negative value', -12, 1],
		['more than thirty days, past what a CalendarView will return', 5000, 720],
	])('clamps %s', (_label, configured, expectedHours) => {
		setHours(configured);

		expect(getSyncWindow(from).end).toEqual(new Date(from.getTime() + expectedHours * HOUR));
	});

	it('defaults when the setting is missing rather than producing an invalid range', () => {
		setHours(undefined);

		expect(getSyncWindow(from).end).toEqual(new Date(from.getTime() + 48 * HOUR));
	});
});
