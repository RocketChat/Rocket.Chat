import type { IEwsTransport } from './IEwsTransport';
import { allByTag, firstByTag, MESSAGES_NS, parseEwsDateTime, parseEwsResponse, textOf, TYPES_NS } from './parseResponse';
import { findItemCalendarViewRequest, getItemRequest, resolveNamesRequest, syncFolderItemsRequest } from './templates';
import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type { DateRange, ExchangeEvent, ExchangeProviderCapabilities, Page } from '../definition/types';
import { ExchangeError } from '../errors';
import { logger } from '../logger';

/** At 1000 occurrences a page, past any window a person can fill. An emergency guard, not a working limit. */
const MAX_CALENDAR_VIEW_PAGES = 50;

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

	public async listEvents(mailbox: string, timeWindow: DateRange, cursor?: string): Promise<Page<ExchangeEvent>> {
		const doc = parseEwsResponse(await this.transport.post(syncFolderItemsRequest(mailbox, cursor)));
		const syncState = textOf(firstByTag(doc, MESSAGES_NS, 'SyncState'));
		// EWS reports "true" when it handed over everything, which is the inverse of hasMore.
		const includesLastItem = textOf(firstByTag(doc, MESSAGES_NS, 'IncludesLastItemInRange')) === 'true';
		const changed = ['Create', 'Update', 'Delete'].some((tag) => allByTag(doc, TYPES_NS, tag).length > 0);

		if (!changed) {
			return { items: [], cursor: syncState, hasMore: !includesLastItem, coverage: 'delta' };
		}

		const { events, complete } = await this.snapshotWindow(mailbox, timeWindow);

		return {
			items: events,
			cursor: syncState,
			hasMore: !includesLastItem,
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
