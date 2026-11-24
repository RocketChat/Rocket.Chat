import type { IExchangeProvider } from './definition/IExchangeProvider';
import {
	detachExchangeProvider,
	getCalendarSyncWindow,
	getExchangeProvider,
	isServerSyncEnabled,
	setCalendarSyncWindowDays,
	setExchangeProvider,
} from './registry';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const midnight = new Date('2026-08-31T00:00:00Z');

describe('getCalendarSyncWindow', () => {
	beforeEach(() => setCalendarSyncWindowDays(() => 2));

	it('starts at midnight so an event earlier today is still inside the window', () => {
		expect(getCalendarSyncWindow(new Date('2026-08-31T09:47:31.250Z'))).toEqual({
			start: midnight,
			end: new Date('2026-09-02T00:00:00Z'),
		});
	});

	it.each([
		['hours ahead of the process', 9, '2026-08-30T15:00:00.000Z'],
		['hours behind it', -4, '2026-08-31T04:00:00.000Z'],
		['half an hour off the mark', 5.5, '2026-08-30T18:30:00.000Z'],
	])('starts at the midnight of a mailbox owner %s, not the one the process is in', (_, utcOffset, expected) => {
		expect(getCalendarSyncWindow(new Date('2026-08-31T09:47:31.250Z'), utcOffset).start).toEqual(new Date(expected));
	});

	it('gives every moment of one day the identical window, which is what a delta link needs', () => {
		const first = getCalendarSyncWindow(midnight);

		for (const offset of [1, HOUR, DAY - 1]) {
			expect(getCalendarSyncWindow(new Date(midnight.getTime() + offset))).toEqual(first);
		}
	});

	it('moves to the next window once the day is over', () => {
		expect(getCalendarSyncWindow(new Date(midnight.getTime() + DAY)).start).toEqual(new Date(midnight.getTime() + DAY));
	});

	it('reads the length at every call, so a changed setting applies to the next run', () => {
		setCalendarSyncWindowDays(() => 5);

		expect(getCalendarSyncWindow(midnight).end).toEqual(new Date(midnight.getTime() + 5 * DAY));
	});
});

describe('provider holder', () => {
	beforeEach(() => detachExchangeProvider());

	const providerFor = (id: IExchangeProvider['id']) => ({ id, cleanup: jest.fn() }) as unknown as IExchangeProvider;

	it('refuses to hand out a provider before one is set', () => {
		expect(isServerSyncEnabled()).toBe(false);
		expect(() => getExchangeProvider()).toThrow(expect.objectContaining({ code: 'not-configured' }));
	});

	it('hands out the provider that was set, until it is detached', () => {
		const provider = providerFor('ews');

		setExchangeProvider(provider);

		expect(isServerSyncEnabled()).toBe(true);
		expect(getExchangeProvider()).toBe(provider);

		detachExchangeProvider();

		expect(isServerSyncEnabled()).toBe(false);
	});

	it('closes the provider it replaces', () => {
		const previous = providerFor('ews');
		const next = providerFor('ews');

		setExchangeProvider(previous);
		setExchangeProvider(next);

		expect(previous.cleanup).toHaveBeenCalledTimes(1);
		expect(next.cleanup).not.toHaveBeenCalled();
	});

	it('keeps a provider that is set again', () => {
		const provider = providerFor('ews');

		setExchangeProvider(provider);
		setExchangeProvider(provider);

		expect(provider.cleanup).not.toHaveBeenCalled();
	});
});
