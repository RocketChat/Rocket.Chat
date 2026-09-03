import { Calendar } from '@rocket.chat/core-services';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { ExchangeSyncState } from '@rocket.chat/models';

import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type { DateRange, ExchangeEventUpsert } from '../definition/types';
import { isExchangeError } from '../errors';
import { logger } from '../logger';
import { scrubForLog, scrubText } from '../scrub';

const MAX_PAGES = 50;

const FATAL_CODES = new Set(['not-configured', 'host-not-allowed', 'authentication-failed', 'rate-limited']);

export type MailboxSyncOutcome = {
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	changed: boolean;
	endedInProgressEvent: boolean;
	failed: boolean;
	fatal: boolean;
};

const EMPTY: MailboxSyncOutcome = {
	upserted: 0,
	modified: 0,
	deleted: 0,
	pruned: 0,
	changed: false,
	endedInProgressEvent: false,
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
 * carries `isCompleteForWindow` to say which it gave us, and only a complete set may prune.
 */
type Collected = {
	upserts: Map<string, ExchangeEventUpsert>;
	removals: Set<string>;
	/** Present only when a provider handed over a complete set for the window. */
	keep?: string[];
	cursor?: string;
};

const collectPages = async (
	provider: IExchangeProvider,
	mailbox: string,
	window: DateRange,
	startCursor: string | undefined,
): Promise<Collected> => {
	const upserts = new Map<string, ExchangeEventUpsert>();
	const removals = new Set<string>();
	let keep: string[] | undefined;
	let cursor = startCursor;
	let pages = 0;

	for (;;) {
		const page = await provider.listEvents(mailbox, window, cursor);
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
		if (page.isCompleteForWindow) {
			keep = pageUpserts.map(({ externalId }) => externalId);
		}

		cursor = page.cursor;

		if (!page.hasMore || !page.cursor || pages >= MAX_PAGES) {
			return { upserts, removals, keep, cursor };
		}
	}
};

export const syncMailbox = async (
	provider: IExchangeProvider,
	uid: IUser['_id'],
	mailbox: string,
	window: DateRange,
): Promise<MailboxSyncOutcome> => {
	const syncWindowHours = Math.round((window.end.getTime() - window.start.getTime()) / 3_600_000);
	const identity = { mailbox, provider: provider.id, syncWindowHours, windowStart: window.start };

	const state = await ExchangeSyncState.findOneByUserId(uid);

	// A Graph delta link has the window baked in and ignores the one we pass, so the cursor is only good
	// while the window is the same one it was made for. The anchored start is what makes that comparable
	// across runs; without it the link would keep answering for a window drifting into the past.
	const reusable =
		Boolean(state?.cursor) &&
		state?.mailbox === mailbox &&
		state?.provider === provider.id &&
		state?.syncWindowHours === syncWindowHours &&
		state?.windowStart?.getTime() === window.start.getTime();

	// Tracked outside the try so a later throw cannot discard work that already committed: the desktop path
	// applies presence in the same call as the write, so a written event always got its scheduling.
	let changed = false;
	let endedInProgressEvent = false;

	try {
		const { upserts, removals, keep, cursor } = await collectPages(provider, mailbox, window, reusable ? state?.cursor : undefined);

		const imported = await Calendar.importMany(
			[...upserts.values()].map((event) => toCalendarEvent(uid, event)),
			{ deferSideEffects: true },
		);
		changed = imported.changed;

		const deleted = removals.size ? await Calendar.deleteImported(uid, [...removals], { deferSideEffects: true }) : undefined;
		changed = changed || Boolean(deleted?.changed);
		endedInProgressEvent = Boolean(deleted?.endedInProgressEvent);

		// Only from a complete set, and only after the upserts landed.
		const pruned = keep ? await Calendar.pruneImportedWindow(uid, window, keep, { deferSideEffects: true }) : undefined;
		changed = changed || Boolean(pruned?.changed);
		endedInProgressEvent = endedInProgressEvent || Boolean(pruned?.endedInProgressEvent);

		await ExchangeSyncState.saveCursor(uid, identity, cursor, new Date());

		return {
			upserted: imported.upserted,
			modified: imported.modified,
			deleted: deleted?.deleted ?? 0,
			pruned: pruned?.deleted ?? 0,
			changed,
			endedInProgressEvent,
			failed: false,
			fatal: false,
		};
	} catch (err) {
		const code = isExchangeError(err) ? err.code : 'unknown';

		if (code === 'sync-state-invalid') {
			await ExchangeSyncState.clearCursorByUserId(uid);
		}

		await ExchangeSyncState.setLastError(uid, identity, `${code}: ${scrubText(err instanceof Error ? err.message : String(err))}`);

		logger.warn({ msg: 'Exchange mailbox sync failed', uid, code, err: scrubForLog(err) });

		return { ...EMPTY, changed, endedInProgressEvent, failed: true, fatal: FATAL_CODES.has(code) };
	}
};
