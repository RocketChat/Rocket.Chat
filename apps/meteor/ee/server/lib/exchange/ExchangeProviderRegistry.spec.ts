import { SYNC_WINDOW_ANCHOR_MS, getSyncWindow } from './ExchangeProviderRegistry';
import { settings } from '../../../../server/settings';

jest.mock('../../../../server/settings', () => ({
	settings: { get: jest.fn() },
}));

const setHours = (value: number | undefined) => jest.mocked(settings.get).mockReturnValue(value);

const HOUR = 60 * 60 * 1000;
const from = new Date('2026-08-31T09:00:00Z');

describe('getSyncWindow', () => {
	beforeEach(() => jest.clearAllMocks());

	it('anchors the start to the step and adds one, so the end clears the configured hours', () => {
		setHours(48);

		expect(getSyncWindow(from)).toEqual({ start: from, end: new Date('2026-09-02T10:00:00Z') });
	});

	it('floors a start that falls mid step', () => {
		setHours(48);

		expect(getSyncWindow(new Date('2026-08-31T09:47:31.250Z'))).toEqual({
			start: from,
			end: new Date('2026-09-02T10:00:00Z'),
		});
	});

	it('gives every moment inside one step the identical window, which is what a delta link needs', () => {
		setHours(48);

		const first = getSyncWindow(from);

		for (const offset of [1, 60_000, HOUR - 1]) {
			expect(getSyncWindow(new Date(from.getTime() + offset))).toEqual(first);
		}
	});

	it('moves to the next window once the step is over', () => {
		setHours(48);

		expect(getSyncWindow(new Date(from.getTime() + HOUR)).start).toEqual(new Date(from.getTime() + HOUR));
	});

	it.each([
		['zero, which would sync nothing at all', 0, 48],
		['a fractional value the int field should not have allowed', 0.5, 48],
		['a negative value', -12, 1],
		['more than thirty days, past what a CalendarView will return', 5000, 720],
	])('clamps %s', (_label, configured, expectedHours) => {
		setHours(configured);

		expect(getSyncWindow(from).end).toEqual(new Date(from.getTime() + expectedHours * HOUR + SYNC_WINDOW_ANCHOR_MS));
	});

	it('defaults when the setting is missing rather than producing an invalid range', () => {
		setHours(undefined);

		expect(getSyncWindow(from).end).toEqual(new Date(from.getTime() + 48 * HOUR + SYNC_WINDOW_ANCHOR_MS));
	});

	it('never ends closer than the configured hours ahead of the moment asked about', () => {
		setHours(48);

		// The anchored start sits in the past, so this is the invariant the extra step exists to hold.
		for (const offset of [0, 1, HOUR - 1]) {
			const at = new Date(from.getTime() + offset);

			expect(getSyncWindow(at).end.getTime()).toBeGreaterThanOrEqual(at.getTime() + 48 * HOUR);
		}
	});
});
