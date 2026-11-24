import { startOfDayAt } from '@rocket.chat/tools';

import type { IExchangeProvider } from './definition/IExchangeProvider';
import type { DateRange } from './definition/types';
import { ExchangeError } from './errors';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 2;

let current: IExchangeProvider | undefined;
let resolveWindowDays: () => number = () => DEFAULT_WINDOW_DAYS;

export const setExchangeProvider = (provider: IExchangeProvider | undefined): void => {
	current = provider;
};

export const detachExchangeProvider = (): void => setExchangeProvider(undefined);

export const getExchangeProvider = (): IExchangeProvider => {
	if (!current) {
		throw new ExchangeError('not-configured', 'Server-to-server Exchange sync is not configured');
	}

	return current;
};

export const isServerSyncEnabled = (): boolean => current !== undefined;

export const setCalendarSyncWindowDays = (resolve: () => number): void => {
	resolveWindowDays = resolve;
};

/**
 * Starts at the mailbox owner's own midnight, the same day `calendar-events.list` reports on, so an event
 * that already happened today is still refreshed rather than left behind. Both bounds land on a day
 * boundary, so the window is identical for every run of the same day, which is what makes a Graph delta
 * link reusable.
 */
export const getCalendarSyncWindow = (from: Date = new Date(), utcOffset?: number): DateRange => {
	const start = startOfDayAt(from, utcOffset);

	return { start, end: new Date(start.getTime() + resolveWindowDays() * DAY_IN_MS) };
};
