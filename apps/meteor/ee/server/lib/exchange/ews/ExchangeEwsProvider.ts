import type { IEwsTransport } from './IEwsTransport';
import { allByTag, firstByTag, MESSAGES_NS, parseEwsDateTime, parseEwsResponse, textOf, TYPES_NS } from './parseResponse';
import { findItemCalendarViewRequest, getItemRequest, resolveNamesRequest, syncFolderItemsRequest } from './templates';
import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type { DateRange, ExchangeEvent, ExchangeProviderCapabilities, Page } from '../definition/types';
import { ExchangeError } from '../errors';
import { logger } from '../logger';

/** The sync state answers about the calendar folder, not about the window, so the window it was issued for travels with it. */
const CURSOR_SEPARATOR = '|';

const windowKey = ({ start, end }: DateRange): string => `${start.toISOString()}${CURSOR_SEPARATOR}${end.toISOString()}`;

const encodeCursor = (syncState: string | undefined, timeWindow: DateRange): string | undefined =>
	syncState && `${windowKey(timeWindow)}${CURSOR_SEPARATOR}${syncState}`;

const decodeCursor = (cursor?: string): { window?: string; syncState?: string } => {
	const first = cursor?.indexOf(CURSOR_SEPARATOR) ?? -1;
	const second = first < 0 ? -1 : (cursor?.indexOf(CURSOR_SEPARATOR, first + 1) ?? -1);

	return second < 0 ? { syncState: cursor } : { window: cursor?.slice(0, second), syncState: cursor?.slice(second + 1) };
};

/** At 1000 occurrences a page, past any window a person can fill. An emergency guard, not a working limit. */
const MAX_CALENDAR_VIEW_PAGES = 50;

/** At 100 changes a page, enough to carry a first sync of a long-lived calendar in one run. */
const MAX_SYNC_BATCHES = 50;

/** How many items one `GetItem` is asked for, matching the delta's own page size. */
const EVENT_BATCH_SIZE = 100;

const isBusyStatus = (status: string | undefined): boolean => status === 'Busy';

export class ExchangeEwsProvider implements IExchangeProvider {
	public readonly id = 'ews' as const;

	public readonly capabilities: ExchangeProviderCapabilities = {
		supportsWebhooks: false,
	};

	private readonly transport: IEwsTransport;

	private readonly serviceAccountAddress: string;

	constructor(transport: IEwsTransport, serviceAccountAddress = '') {
		this.transport = transport;
		this.serviceAccountAddress = serviceAccountAddress;
	}

	/**
	 * Whether the name resolves is beside the point: a completed round trip already proves the endpoint,
	 * TLS and the credentials, so "not found" counts as success.	 */
	public async testConnection(): Promise<void> {
		try {
			parseEwsResponse(await this.transport.post(resolveNamesRequest(this.serviceAccountAddress)));
		} catch (err) {
			if (err instanceof ExchangeError && err.code === 'mailbox-not-found') {
				return;
			}

			throw err;
		}
	}

	/** Asks the folder whether anything moved */
	private async probeChanges(mailbox: string, from?: string): Promise<{ syncState?: string; changed: boolean }> {
		let syncState = from;
		let changed = false;

		for (let batch = 0; batch < MAX_SYNC_BATCHES; batch++) {
			const doc = parseEwsResponse(await this.transport.post(syncFolderItemsRequest(mailbox, syncState)));

			syncState = textOf(firstByTag(doc, MESSAGES_NS, 'SyncState')) || syncState;
			changed = changed || ['Create', 'Update', 'Delete'].some((tag) => allByTag(doc, TYPES_NS, tag).length > 0);

			if (textOf(firstByTag(doc, MESSAGES_NS, 'IncludesLastItemInRange')) !== 'false') {
				return { syncState, changed };
			}
		}

		logger.warn({ msg: 'Exchange calendar delta still had changes pending after the batch cap', mailbox });

		return { syncState, changed };
	}

	public async listEvents(mailbox: string, timeWindow: DateRange, cursor?: string): Promise<Page<ExchangeEvent>> {
		const previous = decodeCursor(cursor);
		const { syncState, changed } = await this.probeChanges(mailbox, previous.syncState);

		const nextCursor = encodeCursor(syncState, timeWindow);

		if (!changed && previous.window === windowKey(timeWindow)) {
			return { items: [], cursor: nextCursor, hasMore: false, coverage: 'delta' };
		}

		const { events, complete } = await this.snapshotWindow(mailbox, timeWindow);

		return {
			items: events,
			cursor: nextCursor,
			hasMore: false,
			coverage: complete ? 'full' : 'partial',
		};
	}

	/**
	 * The delta is used as a 'Has something changed?', not as a source of items. What it reports cannot be used
	 * directly: a changed series arrives as its master rather than as occurrences, and an occurrence deleted
	 * from a series is not reported at all. So once anything was modified, Exchange expands the whole window
	 * and the caller reconciles against a complete set, which is what the desktop integration has always done.
	 */
	private async snapshotWindow(mailbox: string, timeWindow: DateRange): Promise<{ events: ExchangeEvent[]; complete: boolean }> {
		const ids = new Set<string>();
		let { start } = timeWindow;
		let complete = false;

		for (let page = 0; page < MAX_CALENDAR_VIEW_PAGES; page++) {
			const doc = parseEwsResponse(await this.transport.post(findItemCalendarViewRequest(mailbox, start, timeWindow.end)));
			const root = firstByTag(doc, MESSAGES_NS, 'RootFolder');
			const nodes = allByTag(doc, TYPES_NS, 'CalendarItem');

			for (const node of nodes) {
				const id = firstByTag(node, TYPES_NS, 'ItemId')?.getAttribute('Id');

				if (id) {
					ids.add(id);
				}
			}

			if (root?.getAttribute('IncludesLastItemInRange') !== 'false') {
				complete = true;
				break;
			}

			const last = nodes[nodes.length - 1];
			const next = last && parseEwsDateTime(textOf(firstByTag(last, TYPES_NS, 'Start')));

			if (!next || next.getTime() <= start.getTime()) {
				break;
			}

			start = next;
		}

		if (!complete) {
			logger.warn({ msg: 'EWS calendar window was read only in part, so nothing will be pruned from it', mailbox });
		}

		return { events: await this.loadEvents(mailbox, [...ids]), complete };
	}

	private async loadEvents(mailbox: string, itemIds: string[]): Promise<ExchangeEvent[]> {
		const events: ExchangeEvent[] = [];

		for (let i = 0; i < itemIds.length; i += EVENT_BATCH_SIZE) {
			const doc = parseEwsResponse(await this.transport.post(getItemRequest(mailbox, itemIds.slice(i, i + EVENT_BATCH_SIZE))));

			events.push(
				...allByTag(doc, TYPES_NS, 'CalendarItem')
					.filter((node) => textOf(firstByTag(node, TYPES_NS, 'CalendarItemType')) !== 'RecurringMaster')
					.map((node) => this.toExchangeEvent(node))
					.filter((event): event is ExchangeEvent => event !== undefined),
			);
		}

		return events;
	}

	private toExchangeEvent(node: Element): ExchangeEvent | undefined {
		const externalId = firstByTag(node, TYPES_NS, 'ItemId')?.getAttribute('Id') ?? undefined;
		if (!externalId) {
			logger.warn({ msg: 'Skipping EWS calendar item without an id' });
			return undefined;
		}

		const startTime = parseEwsDateTime(textOf(firstByTag(node, TYPES_NS, 'Start')));
		if (!startTime) {
			logger.warn({ msg: 'Skipping EWS calendar item without a parseable start time', externalId });
			return undefined;
		}

		const endTime = parseEwsDateTime(textOf(firstByTag(node, TYPES_NS, 'End')));
		const reminder = textOf(firstByTag(node, TYPES_NS, 'ReminderMinutesBeforeStart'));
		const reminderMinutes = reminder ? Number.parseInt(reminder, 10) : undefined;

		return {
			kind: 'upsert',
			externalId,
			subject: textOf(firstByTag(node, TYPES_NS, 'Subject')) ?? '',
			description: textOf(firstByTag(node, TYPES_NS, 'Body')) ?? '',
			startTime,
			...(endTime && { endTime }),
			isCancelled: textOf(firstByTag(node, TYPES_NS, 'IsCancelled')) === 'true',
			busy: isBusyStatus(textOf(firstByTag(node, TYPES_NS, 'LegacyFreeBusyStatus'))),
			...(reminderMinutes !== undefined && Number.isFinite(reminderMinutes) && { reminderMinutesBeforeStart: reminderMinutes }),
		};
	}
}
