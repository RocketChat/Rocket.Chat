import { EwsHttpClient } from './ewsHttp';
import type { IEwsHttpResponse, IEwsHttpConfig } from './ewsHttp';
import {
	assertGetFolderSuccess,
	buildFindCalendarItemsRequest,
	buildGetCalendarFolderRequest,
	buildGetItemBodiesRequest,
	buildGetUserAvailabilityRequest,
	mapEwsResponseCode,
	parseAvailabilityResponse,
	parseFindItemResponse,
	parseGetItemBodiesResponse,
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

	public readonly supportsDelta = false;

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

	public async listEvents(mailbox: string, window: ICalendarSyncWindow): Promise<ICalendarSyncListResult> {
		const findResponse = await this.post(buildFindCalendarItemsRequest(mailbox, window));
		const items = parseFindItemResponse(findResponse.body);

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

		const events: IExternalCalendarEvent[] = items.map((item) => ({
			externalId: item.itemId,
			...(item.uid && { iCalUId: item.uid }),
			subject: item.subject,
			description: bodies.get(item.itemId) ?? '',
			startTime: item.start,
			endTime: item.end,
			busy: BUSY_STATUSES.has(item.legacyFreeBusyStatus),
			...(item.isCancelled && { isCancelled: true }),
		}));

		// EWS has no delta in this integration: every result is a full window snapshot
		return { events, deletedEventIds: [], full: true };
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
