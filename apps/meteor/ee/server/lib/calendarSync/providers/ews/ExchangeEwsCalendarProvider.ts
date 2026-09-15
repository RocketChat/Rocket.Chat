import { EwsHttpClient } from './ewsHttp';
import type { IEwsHttpResponse, IEwsHttpConfig } from './ewsHttp';
import type { IEwsCalendarItem } from './soap';
import {
	assertGetFolderSuccess,
	buildFindCalendarItemsRequest,
	buildGetCalendarFolderRequest,
	buildGetItemBodiesRequest,
	buildGetUserAvailabilityRequest,
	buildSyncFolderItemsRequest,
	mapEwsResponseCode,
	parseAvailabilityResponse,
	parseFindItemResponse,
	parseGetItemBodiesResponse,
	parseSyncFolderItemsResponse,
} from './soap';
import type {
	FreeBusyStatus,
	ICalendarSyncListResult,
	ICalendarSyncProvider,
	ICalendarSyncWindow,
	IConnectionTestResult,
	IExternalCalendarEvent,
	IFreeBusyResult,
} from '../../definition';
import { CalendarSyncError } from '../../definition';
import { sanitizeError } from '../../logSanitizer';

type SleepFn = (ms: number) => Promise<void>;

const defaultSleep: SleepFn = (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const THROTTLE_RETRY_MS = 5_000;
const AVAILABILITY_MAX_MAILBOXES = 50;
const BUSY_STATUSES = new Set(['Busy', 'OOF']);
/** Cap on SyncFolderItems round-trips per user per run (512 changes each) */
const SYNC_MAX_PAGES = 20;

function mapBusyType(busyType: string): FreeBusyStatus {
	if (busyType === 'OOF') {
		return 'oof';
	}
	if (busyType === 'Tentative') {
		return 'tentative';
	}
	return 'busy';
}

export interface IEwsProviderClient {
	post(soapXml: string): Promise<IEwsHttpResponse>;
}

/**
 * Calendar sync provider for on-premises Exchange Server (2016/2019/Subscription
 * Edition) over Exchange Web Services with a service account holding the
 * ApplicationImpersonation role. This module holds no Microsoft-cloud hostname:
 * every request goes to the admin-configured EWS endpoint only (air-gap safe).
 */
export class ExchangeEwsCalendarProvider implements ICalendarSyncProvider {
	public readonly type = 'exchange-ews' as const;

	public readonly supportsDelta = true;

	public readonly supportsWebhooks = false;

	private readonly client: IEwsProviderClient;

	constructor(
		config: IEwsHttpConfig,
		client?: IEwsProviderClient,
		private readonly sleep: SleepFn = defaultSleep,
	) {
		this.client = client ?? new EwsHttpClient(config);
	}

	public async testConnection(probeMailbox?: string): Promise<IConnectionTestResult> {
		try {
			// Without a probe mailbox this validates endpoint + credentials against the
			// service account's own calendar; with one it additionally proves impersonation
			const response = await this.post(buildGetCalendarFolderRequest(probeMailbox));
			assertGetFolderSuccess(response.body);
			return { ok: true };
		} catch (error) {
			return { ok: false, error: sanitizeError(error) };
		}
	}

	public async listEvents(mailbox: string, window: ICalendarSyncWindow, deltaToken?: string): Promise<ICalendarSyncListResult> {
		if (deltaToken) {
			try {
				return await this.listEventsIncremental(mailbox, window, deltaToken);
			} catch (error) {
				if (error instanceof CalendarSyncError && error.code === 'delta-token-expired') {
					// Stale/invalid SyncState: fall back to a full window snapshot
					return this.listEvents(mailbox, window);
				}
				throw error;
			}
		}

		// Establish the SyncState BEFORE the snapshot so nothing created in between
		// is missed — re-reported items are upserted idempotently anyway
		const nextDeltaToken = await this.establishSyncState(mailbox);

		const findResponse = await this.post(buildFindCalendarItemsRequest(mailbox, window));
		const items = parseFindItemResponse(findResponse.body);
		const events = await this.buildEvents(mailbox, items);

		return { events, deletedEventIds: [], full: true, ...(nextDeltaToken && { nextDeltaToken }) };
	}

	/** Incremental changes via SyncFolderItems; the folder is not window-scoped, so filtering happens here */
	private async listEventsIncremental(mailbox: string, window: ICalendarSyncWindow, syncState: string): Promise<ICalendarSyncListResult> {
		const changed: IEwsCalendarItem[] = [];
		const deletedEventIds: string[] = [];
		let state = syncState;

		for (let page = 0; page < SYNC_MAX_PAGES; page++) {
			const parsed = parseSyncFolderItemsResponse((await this.post(buildSyncFolderItemsRequest(mailbox, state))).body);
			state = parsed.syncState;
			changed.push(...parsed.items);
			deletedEventIds.push(...parsed.deletedItemIds);
			if (parsed.includesLastItemInRange) {
				break;
			}
		}

		const inWindow: IEwsCalendarItem[] = [];
		for (const item of changed) {
			if (item.start.getTime() < window.end.getTime() && item.end.getTime() > window.start.getTime()) {
				inWindow.push(item);
			} else {
				// The event may have been rescheduled out of the window; deleting is idempotent
				// and only ever touches events this integration owns
				deletedEventIds.push(item.itemId);
			}
		}

		return {
			events: await this.buildEvents(mailbox, inWindow),
			deletedEventIds,
			nextDeltaToken: state,
			full: false,
		};
	}

	/** Fast-forwards SyncFolderItems to the current state; undefined when the mailbox is too large to page through */
	private async establishSyncState(mailbox: string): Promise<string | undefined> {
		let state: string | undefined;
		for (let page = 0; page < SYNC_MAX_PAGES; page++) {
			const parsed = parseSyncFolderItemsResponse((await this.post(buildSyncFolderItemsRequest(mailbox, state))).body);
			state = parsed.syncState;
			if (parsed.includesLastItemInRange) {
				return state;
			}
		}
		return undefined;
	}

	private async buildEvents(mailbox: string, items: IEwsCalendarItem[]): Promise<IExternalCalendarEvent[]> {
		const activeItems = items.filter((item) => !item.isCancelled);
		const bodies = activeItems.length
			? parseGetItemBodiesResponse(
					(
						await this.post(
							buildGetItemBodiesRequest(
								mailbox,
								activeItems.map((item) => item.itemId),
							),
						)
					).body,
				)
			: new Map<string, string>();

		return items.map((item) => ({
			externalId: item.itemId,
			...(item.uid && { iCalUId: item.uid }),
			subject: item.subject,
			description: bodies.get(item.itemId) ?? '',
			startTime: item.start,
			endTime: item.end,
			busy: BUSY_STATUSES.has(item.legacyFreeBusyStatus),
			...(item.isCancelled && { isCancelled: true }),
		}));
	}

	public async getFreeBusy(mailboxes: string[], window: ICalendarSyncWindow): Promise<IFreeBusyResult[]> {
		const results: IFreeBusyResult[] = [];

		for (let offset = 0; offset < mailboxes.length; offset += AVAILABILITY_MAX_MAILBOXES) {
			const chunk = mailboxes.slice(offset, offset + AVAILABILITY_MAX_MAILBOXES);
			const response = await this.post(buildGetUserAvailabilityRequest(chunk, window));
			const parsed = parseAvailabilityResponse(response.body);

			chunk.forEach((mailbox, index) => {
				const entry = parsed[index];
				if (!entry || entry.errorCode) {
					results.push({
						mailbox,
						intervals: [],
						error: { code: 'schedule-unavailable', message: entry?.errorCode ?? 'missing response entry' },
					});
					return;
				}

				results.push({
					mailbox,
					intervals: entry.events
						.filter((event) => event.busyType !== 'Free' && event.busyType !== 'WorkingElsewhere' && event.busyType !== 'NoData')
						.map((event) => ({
							start: event.start,
							end: event.end,
							status: mapBusyType(event.busyType),
						})),
				});
			});
		}

		return results;
	}

	/** POSTs to the configured endpoint, mapping HTTP auth failures and retrying once on server-busy */
	private async post(soapXml: string, isRetry = false): Promise<IEwsHttpResponse> {
		const response = await this.client.post(soapXml);

		if (response.statusCode === 401 || response.statusCode === 403) {
			throw new CalendarSyncError(
				'invalid-credentials',
				`The EWS endpoint rejected the service account credentials (HTTP ${response.statusCode})`,
			);
		}

		if (response.statusCode === 503 && !isRetry) {
			await this.sleep(THROTTLE_RETRY_MS);
			return this.post(soapXml, true);
		}

		if (response.statusCode !== 200 && response.statusCode !== 500) {
			// 500 carries SOAP faults which the parsers map to precise error codes
			throw mapEwsResponseCode('HttpError', `EWS endpoint returned HTTP ${response.statusCode}`);
		}

		return response;
	}
}
