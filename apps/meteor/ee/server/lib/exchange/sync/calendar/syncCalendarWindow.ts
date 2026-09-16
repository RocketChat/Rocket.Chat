import { Calendar } from '@rocket.chat/core-services';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { ExchangeCalendarSyncState } from '@rocket.chat/models';

import type { IExchangeProvider } from '../../definition/IExchangeProvider';
import type { DateRange, ExchangeEventUpsert } from '../../definition/types';
import { isExchangeError } from '../../errors';
import { logger } from '../../logger';
import { scrubForLog, scrubText } from '../../scrub';
import { MAX_PAGES } from '../limits';

const FATAL_CODES = new Set(['not-configured', 'host-not-allowed', 'authentication-failed', 'rate-limited']);

export type CalendarSyncOutcome = {
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	changed: boolean;
	removedEvents: boolean;
	failed: boolean;
	fatal: boolean;
	error?: unknown;
};

const EMPTY: CalendarSyncOutcome = {
	upserted: 0,
	modified: 0,
	deleted: 0,
	pruned: 0,
	changed: false,
	removedEvents: false,
	failed: false,
	fatal: false,
};

const toCalendarEvent = (uid: IUser['_id'], event: ExchangeEventUpsert): Omit<InsertionModel<ICalendarEvent>, 'notificationSent'> => ({
	uid,
	externalId: event.externalId,
	subject: event.subject,
	description: event.description,
	startTime: event.startTime,
	...(event.endTime && { endTime: event.endTime }),
	...(event.meetingUrl && { meetingUrl: event.meetingUrl }),
	...(event.reminderMinutesBeforeStart !== undefined && { reminderMinutesBeforeStart: event.reminderMinutesBeforeStart }),
	busy: event.busy,
});

/**
 * Deletion works differently per provider and the difference cannot be flattened: Graph reports removals
 * explicitly, EWS reports them only by not returning an event in a complete window snapshot. `page`
 * carries `isCompleteSnapshot` to say which it gave us, and only a complete set may prune.
 */
type Collected = {
	upserts: Map<string, ExchangeEventUpsert>;
	removals: Set<string>;
	/** Present only when a provider handed over a complete set for the window. */
	keepExternalIds?: string[];
	cursor?: string;
};

const collectPages = async (
	provider: IExchangeProvider,
	mailbox: string,
	timeWindow: DateRange,
	startCursor: string | undefined,
): Promise<Collected> => {
	const upserts = new Map<string, ExchangeEventUpsert>();
	const removals = new Set<string>();
	let keepExternalIds: string[] | undefined;
	let cursor = startCursor;
	let pages = 0;

	for (;;) {
		const page = await provider.listEvents(mailbox, timeWindow, cursor);
		pages++;
		const pageUpserts: ExchangeEventUpsert[] = [];

		for (const item of page.items) {
			if (item.kind === 'deleted' || item.isCancelled) {
				removals.add(item.externalId);
				upserts.delete(item.externalId);
				continue;
			}

			pageUpserts.push(item);
		}

		for (const item of pageUpserts) {
			removals.delete(item.externalId);
			upserts.set(item.externalId, item);
		}

		// Each complete page is an independent full-window snapshot, so the newest one supersedes any earlier one
		if (page.isCompleteSnapshot) {
			keepExternalIds = pageUpserts.map(({ externalId }) => externalId);
		}

		cursor = page.cursor;

		if (!page.hasMore || !page.cursor || pages >= MAX_PAGES) {
			return { upserts, removals, keepExternalIds, cursor };
		}
	}
};

export const syncCalendarWindow = async (
	provider: IExchangeProvider,
	uid: IUser['_id'],
	mailbox: string,
	timeWindow: DateRange,
): Promise<CalendarSyncOutcome> => {
	const syncWindowDays = Math.round((timeWindow.end.getTime() - timeWindow.start.getTime()) / 86_400_000);
	const identity = { mailbox, provider: provider.id, syncWindowDays, windowStart: timeWindow.start };

	const state = await ExchangeCalendarSyncState.findOneByUserId(uid);

	const sameSource = state?.mailbox === mailbox && state?.provider === provider.id;
	const sameWindow = state?.syncWindowDays === syncWindowDays && state?.windowStart?.getTime() === timeWindow.start.getTime();

	// The window only invalidates a cursor that answers about one, which is why the anchored start exists.
	// A Graph delta link bakes the window into itself, so a moved window makes it answer about the old one.
	// An EWS sync state is scoped to the folder and carries no dates, so it outlives any window: applying
	// the rule to it would throw away a valid cursor and pay a full window read for nothing.
	const reusable = Boolean(state?.cursor) && sameSource && (sameWindow || provider.id !== 'graph');

	let changed = false;
	let removedEvents = false;

	try {
		const { upserts, removals, keepExternalIds, cursor } = await collectPages(
			provider,
			mailbox,
			timeWindow,
			reusable ? state?.cursor : undefined,
		);

		const imported = await Calendar.importMany(
			[...upserts.values()].map((event) => toCalendarEvent(uid, event)),
			{ deferSideEffects: true },
		);
		changed = imported.changed;

		const deleted = removals.size
			? await Calendar.deleteImported(uid, [...removals], timeWindow.start, { deferSideEffects: true })
			: undefined;
		changed = changed || Boolean(deleted?.changed);
		removedEvents = Boolean(deleted?.deleted);

		// Only from a complete set, and only after the upserts landed.
		const pruned = keepExternalIds
			? await Calendar.pruneImportedWindow(uid, timeWindow, keepExternalIds, { deferSideEffects: true })
			: undefined;
		changed = changed || Boolean(pruned?.changed);
		removedEvents = removedEvents || Boolean(pruned?.deleted);

		await ExchangeCalendarSyncState.saveCursor(uid, identity, cursor, new Date());

		return {
			upserted: imported.upserted,
			modified: imported.modified,
			deleted: deleted?.deleted ?? 0,
			pruned: pruned?.deleted ?? 0,
			changed,
			removedEvents,
			failed: false,
			fatal: false,
		};
	} catch (err) {
		const code = isExchangeError(err) ? err.code : 'unknown';

		if (code === 'sync-state-invalid') {
			await ExchangeCalendarSyncState.clearCursorByUserId(uid);
		}

		await ExchangeCalendarSyncState.setLastError(uid, identity, `${code}: ${scrubText(err instanceof Error ? err.message : String(err))}`);

		logger.warn({ msg: 'Exchange calendar sync failed for a mailbox', uid, code, err: scrubForLog(err) });

		return { ...EMPTY, changed, removedEvents, failed: true, fatal: FATAL_CODES.has(code), error: err };
	}
};
