import type { IEwsTransport } from './IEwsTransport';
import { allByTag, firstByTag, MESSAGES_NS, parseEwsResponse, textOf, TYPES_NS } from './parseResponse';
import { findItemCalendarViewRequest, getItemRequest, resolveNamesRequest, syncFolderItemsRequest } from './templates';
import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type { DateRange, ExchangeEvent, ExchangeProviderCapabilities, Page } from '../definition/types';
import { ExchangeError } from '../errors';
import { logger } from '../logger';

const isBusyStatus = (status: string | undefined): boolean => status === 'Busy';

export const parseEwsDateTime = (value: string | undefined): Date | undefined => {
	if (!value) {
		return undefined;
	}

	// We ask for UTC through `TimeZoneContext`, so a value arriving without a zone is still UTC. Reading it
	// as local time would shift the event by the host offset, silently
	const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
	const parsed = new Date(hasZone ? value : `${value}Z`);

	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export class ExchangeEwsProvider implements IExchangeProvider {
	public readonly id = 'ews' as const;

	public readonly capabilities: ExchangeProviderCapabilities = {
		supportsDelta: true,
		supportsWebhooks: false,
		supportsContacts: false,
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
			return { items: [], cursor: syncState, hasMore: !includesLastItem, isCompleteForWindow: false };
		}

		return {
			items: await this.snapshotWindow(mailbox, timeWindow),
			cursor: syncState,
			hasMore: !includesLastItem,
			isCompleteForWindow: true,
		};
	}

	/**
	 * The delta is used as a 'Has something changed?', not as a source of items. What it reports cannot be used
	 * directly: a changed series arrives as its master rather than as occurrences, and an occurrence deleted
	 * from a series is not reported at all. So once anything was modified, Exchange expands the whole window
	 * and the caller reconciles against a complete set, which is what the desktop integration has always done.
	 */
	private async snapshotWindow(mailbox: string, timeWindow: DateRange): Promise<ExchangeEvent[]> {
		const doc = parseEwsResponse(await this.transport.post(findItemCalendarViewRequest(mailbox, timeWindow.start, timeWindow.end)));

		const ids = allByTag(doc, TYPES_NS, 'CalendarItem')
			.map((node) => firstByTag(node, TYPES_NS, 'ItemId')?.getAttribute('Id') ?? undefined)
			.filter((id): id is string => Boolean(id));

		return ids.length ? this.loadItems(mailbox, ids) : [];
	}

	private async loadItems(mailbox: string, itemIds: string[]): Promise<ExchangeEvent[]> {
		const doc = parseEwsResponse(await this.transport.post(getItemRequest(mailbox, itemIds)));

		return allByTag(doc, TYPES_NS, 'CalendarItem')
			.filter((node) => textOf(firstByTag(node, TYPES_NS, 'CalendarItemType')) !== 'RecurringMaster')
			.map((node) => this.toExchangeEvent(node))
			.filter((event): event is ExchangeEvent => event !== undefined);
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
		// The iCalendar identifier, stable across mailboxes unlike ItemId.
		const iCalUId = textOf(firstByTag(node, TYPES_NS, 'UID'));

		return {
			kind: 'upsert',
			externalId,
			...(iCalUId && { iCalUId }),
			subject: textOf(firstByTag(node, TYPES_NS, 'Subject')) ?? '',
			description: textOf(firstByTag(node, TYPES_NS, 'Body')) ?? '',
			startTime,
			...(endTime && { endTime }),
			isAllDay: textOf(firstByTag(node, TYPES_NS, 'IsAllDayEvent')) === 'true',
			isCancelled: textOf(firstByTag(node, TYPES_NS, 'IsCancelled')) === 'true',
			busy: isBusyStatus(textOf(firstByTag(node, TYPES_NS, 'LegacyFreeBusyStatus'))),
			...(reminderMinutes !== undefined && Number.isFinite(reminderMinutes) && { reminderMinutesBeforeStart: reminderMinutes }),
		};
	}
}
