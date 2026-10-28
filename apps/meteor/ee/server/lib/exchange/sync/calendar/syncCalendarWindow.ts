import { Calendar } from '@rocket.chat/core-services';
import type { CalendarBatchResult } from '@rocket.chat/core-services';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { ExchangeCalendarSyncState } from '@rocket.chat/models';

import type { IExchangeProvider } from '../../definition/IExchangeProvider';
import type { DateRange, ExchangeEventUpsert } from '../../definition/types';
import { isExchangeError } from '../../errors';
import { logger } from '../../logger';
import { scrubForLog, scrubText } from '../../scrub';

export const MAX_EVENT_PAGES = 50;

const FATAL_CODES = new Set(['not-configured', 'host-not-allowed', 'authentication-failed', 'rate-limited']);

export type CalendarSyncOutcome = {
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	changed: boolean;
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
	failed: false,
	fatal: false,
};

const toCalendarEvent = (uid: IUser['_id'], event: ExchangeEventUpsert): Omit<InsertionModel<ICalendarEvent>, 'notificationSent'> => ({
	uid,
	externalId: event.externalId,
	source: 'outlook',
	seriesMasterId: event.seriesMasterId,
	subject: event.subject,
	description: event.description,
	startTime: event.startTime,
	endTime: event.endTime,
	meetingUrl: event.meetingUrl,
	reminderMinutesBeforeStart: event.reminderMinutesBeforeStart,
	busy: event.busy,
});

/**
 * Deletion works differently per provider and the difference cannot be flattened: Graph reports removals
 * explicitly, EWS reports them only by not returning an event in a complete window snapshot. `page`
 * carries `coverage` to say which it gave us, and only a full read may prune.
 */
type Collected = {
	upserts: Map<string, ExchangeEventUpsert>;
	removals: Set<string>;
	/** Present only when a provider handed over a complete set for the window. */
	keepExternalIds?: string[];
	/** Series whose whole expansion the run carried, so what is stored for them and missing has been removed. */
	resyncedSeries: string[];
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
	const resyncedSeries = new Set<string>();
	let keepExternalIds: string[] | undefined;
	let cursor = startCursor;
	let pages = 0;
	let partial = false;

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

		// A full page is the whole window, so it supersedes what earlier pages of this run collected rather
		// than adding to it
		if (page.coverage === 'full') {
			upserts.clear();
			pageUpserts.forEach((item) => upserts.set(item.externalId, item));
			keepExternalIds = pageUpserts.map(({ externalId }) => externalId);
		} else if (page.coverage === 'partial') {
			keepExternalIds = undefined;
		}

		page.resyncedSeries?.forEach((id) => resyncedSeries.add(id));

		partial = partial || page.coverage === 'partial';
		cursor = page.cursor;

		if (!page.hasMore) {
			const readEverything = !startCursor && !partial;

			return {
				upserts,
				removals,
				keepExternalIds: keepExternalIds ?? (readEverything ? [...upserts.keys()] : undefined),
				resyncedSeries: [...resyncedSeries],
				cursor,
			};
		}

		if (!page.cursor || pages >= MAX_EVENT_PAGES) {
			logger.warn({ msg: 'Exchange calendar read stopped before the provider was done', mailbox, pages, missingCursor: !page.cursor });

			return { upserts, removals, resyncedSeries: [] };
		}
	}
};

type RemovalResult = { changed: boolean; deleted: number; pruned: number };

/**
 * The three ways an event leaves: the provider named it, a series came back without it, or the window was
 * read completely enough to say what is no longer in it. Each is optional and they run in that order.
 */
const applyRemovals = async (
	uid: IUser['_id'],
	timeWindow: DateRange,
	{ upserts, removals, keepExternalIds, resyncedSeries }: Collected,
	removalResult: RemovalResult,
): Promise<void> => {
	const options = { deferSideEffects: true } as const;

	const record = (result: CalendarBatchResult): number => {
		removalResult.changed = removalResult.changed || result.changed;

		return result.deleted;
	};

	if (removals.size) {
		removalResult.deleted = record(await Calendar.deleteImported(uid, [...removals], timeWindow.start, options));
	}

	if (resyncedSeries.length) {
		removalResult.pruned += record(await Calendar.pruneImportedSeries(uid, timeWindow, resyncedSeries, [...upserts.keys()], options));
	}

	// Only from a complete set, and only after the upserts landed.
	if (keepExternalIds) {
		removalResult.pruned += record(await Calendar.pruneImportedWindow(uid, timeWindow, keepExternalIds, options));
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

	// Graph delta links have the time window hardcoded inside them. If the window changes, the cursor becomes invalid.
	// EWS sync states are tied only to the folder, not the dates. They remain valid even if the time window changes.
	// Discarding an EWS cursor just because the time window changed would force a useless and expensive full sync.
	const reusable = Boolean(state?.cursor) && sameSource && (sameWindow || provider.id !== 'graph');

	const removalResult: RemovalResult = { changed: false, deleted: 0, pruned: 0 };

	try {
		const collected = await collectPages(provider, mailbox, timeWindow, reusable ? state?.cursor : undefined);

		const imported = await Calendar.importMany(
			[...collected.upserts.values()].map((event) => toCalendarEvent(uid, event)),
			{ deferSideEffects: true },
		);
		removalResult.changed = imported.changed;

		await applyRemovals(uid, timeWindow, collected, removalResult);

		await ExchangeCalendarSyncState.saveCursor(uid, identity, collected.cursor, new Date());

		return {
			upserted: imported.upserted,
			modified: imported.modified,
			deleted: removalResult.deleted,
			pruned: removalResult.pruned,
			changed: removalResult.changed,
			failed: false,
			fatal: false,
		};
	} catch (err) {
		const code = isExchangeError(err) ? err.code : 'unknown';

		if (code === 'sync-state-invalid') {
			await ExchangeCalendarSyncState.clearCursorByUserId(uid);
		}

		await ExchangeCalendarSyncState.setLastError(uid, `${code}: ${scrubText(err instanceof Error ? err.message : String(err))}`);

		logger.warn({ msg: 'Exchange calendar sync failed for a mailbox', uid, code, err: scrubForLog(err) });

		return {
			...EMPTY,
			changed: removalResult.changed,
			failed: true,
			fatal: FATAL_CODES.has(code),
			error: err,
		};
	}
};
