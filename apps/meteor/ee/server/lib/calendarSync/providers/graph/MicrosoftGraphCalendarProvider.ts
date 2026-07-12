import type { IGraphTokenManagerConfig } from './GraphTokenManager';
import { GraphTokenManager } from './GraphTokenManager';
import type {
	CalendarSyncFetchFn,
	FreeBusyStatus,
	ICalendarSubscription,
	ICalendarSyncListResult,
	ICalendarSyncProvider,
	ICalendarSyncWindow,
	IConnectionTestResult,
	IExternalCalendarEvent,
	IFreeBusyResult,
	IMinimalFetchResponse,
} from '../../definition';
import { CalendarSyncError } from '../../definition';
import { sanitizeError } from '../../logSanitizer';

export interface IMicrosoftGraphProviderConfig extends IGraphTokenManagerConfig {
	/** Page size requested from Graph (odata.maxpagesize) */
	pageSize?: number;
}

type SleepFn = (ms: number) => Promise<void>;

const defaultSleep: SleepFn = (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

/** Calendar-event subscriptions are capped at 4230 minutes by Graph; stay just under */
const SUBSCRIPTION_TTL_MS = 4200 * 60 * 1000;

const MAX_THROTTLE_RETRIES = 3;
const MAX_RETRY_AFTER_MS = 30_000;
const DEFAULT_RETRY_AFTER_MS = 5_000;
const MAX_PAGES_PER_SYNC = 50;
const GET_SCHEDULE_MAX_MAILBOXES = 20;

const EVENT_SELECT_FIELDS = 'id,iCalUId,subject,bodyPreview,start,end,showAs,isCancelled,onlineMeeting,onlineMeetingUrl';

const BUSY_STATUSES = new Set(['busy', 'oof']);

function mapFreeBusyStatus(status: string): FreeBusyStatus {
	if (status === 'oof' || status === 'tentative') {
		return status;
	}
	return 'busy';
}

export class MicrosoftGraphCalendarProvider implements ICalendarSyncProvider {
	public readonly type = 'microsoft-graph' as const;

	public readonly supportsDelta = true;

	public readonly supportsWebhooks = true;

	private readonly tokens: GraphTokenManager;

	private readonly graphHost: string;

	private readonly pageSize: number;

	constructor(
		config: IMicrosoftGraphProviderConfig,
		private readonly fetchFn: CalendarSyncFetchFn,
		private readonly sleep: SleepFn = defaultSleep,
	) {
		this.tokens = new GraphTokenManager(config, fetchFn);
		this.graphHost = config.graphHost.replace(/\/+$/, '');
		this.pageSize = config.pageSize ?? 50;
	}

	public async testConnection(probeMailbox?: string): Promise<IConnectionTestResult> {
		try {
			await this.tokens.getToken();

			if (probeMailbox) {
				const now = new Date();
				const url = `${this.graphHost}/v1.0/users/${encodeURIComponent(probeMailbox)}/calendarView?startDateTime=${now.toISOString()}&endDateTime=${new Date(
					now.getTime() + 60_000,
				).toISOString()}&$top=1&$select=id`;
				await this.requestJson('GET', url);
			}

			return { ok: true };
		} catch (error) {
			return { ok: false, error: sanitizeError(error) };
		}
	}

	public async listEvents(mailbox: string, window: ICalendarSyncWindow, deltaToken?: string): Promise<ICalendarSyncListResult> {
		const baseUrl = `${this.graphHost}/v1.0/users/${encodeURIComponent(mailbox)}/calendarView/delta`;

		let url: string;
		if (deltaToken) {
			url = `${baseUrl}?$deltatoken=${encodeURIComponent(deltaToken)}`;
		} else {
			const params = new URLSearchParams({
				startDateTime: window.start.toISOString(),
				endDateTime: window.end.toISOString(),
				$select: EVENT_SELECT_FIELDS,
			});
			url = `${baseUrl}?${params.toString()}`;
		}

		const events: IExternalCalendarEvent[] = [];
		const deletedEventIds: string[] = [];
		let nextDeltaToken: string | undefined;

		for (let page = 0; page < MAX_PAGES_PER_SYNC; page++) {
			let payload;
			try {
				payload = await this.requestJson('GET', url, undefined, {
					Prefer: `odata.maxpagesize=${this.pageSize}, outlook.timezone="UTC"`,
				});
			} catch (error) {
				if (deltaToken && error instanceof CalendarSyncError && error.code === 'delta-token-expired') {
					// Token no longer valid (410 Gone): restart with a full window sync
					return this.listEvents(mailbox, window);
				}
				throw error;
			}

			for (const entry of payload.value ?? []) {
				if (entry['@removed']) {
					if (typeof entry.id === 'string') {
						deletedEventIds.push(entry.id);
					}
					continue;
				}

				const event = this.mapEvent(entry);
				if (event) {
					events.push(event);
				}
			}

			if (typeof payload['@odata.deltaLink'] === 'string') {
				nextDeltaToken = this.extractQueryParam(payload['@odata.deltaLink'], '$deltatoken');
				break;
			}

			if (typeof payload['@odata.nextLink'] === 'string') {
				url = this.assertGraphUrl(payload['@odata.nextLink']);
				continue;
			}

			break;
		}

		return {
			events,
			deletedEventIds,
			nextDeltaToken,
			full: !deltaToken,
		};
	}

	public async getFreeBusy(mailboxes: string[], window: ICalendarSyncWindow): Promise<IFreeBusyResult[]> {
		const results: IFreeBusyResult[] = [];

		for (let offset = 0; offset < mailboxes.length; offset += GET_SCHEDULE_MAX_MAILBOXES) {
			const chunk = mailboxes.slice(offset, offset + GET_SCHEDULE_MAX_MAILBOXES);
			const url = `${this.graphHost}/v1.0/users/${encodeURIComponent(chunk[0])}/calendar/getSchedule`;

			const payload = await this.requestJson(
				'POST',
				url,
				JSON.stringify({
					schedules: chunk,
					startTime: { dateTime: window.start.toISOString(), timeZone: 'UTC' },
					endTime: { dateTime: window.end.toISOString(), timeZone: 'UTC' },
					availabilityViewInterval: 15,
				}),
				{ 'Content-Type': 'application/json', 'Prefer': 'outlook.timezone="UTC"' },
			);

			for (const schedule of payload.value ?? []) {
				if (schedule.error) {
					results.push({
						mailbox: schedule.scheduleId,
						intervals: [],
						error: sanitizeError({ code: 'schedule-unavailable', message: schedule.error.message }),
					});
					continue;
				}

				const intervals = (schedule.scheduleItems ?? [])
					.filter((item: { status?: string }) => item.status && item.status !== 'free' && item.status !== 'workingElsewhere')
					.map((item: { status: string; start: { dateTime: string }; end: { dateTime: string } }) => ({
						start: this.parseGraphDate(item.start?.dateTime),
						end: this.parseGraphDate(item.end?.dateTime),
						status: mapFreeBusyStatus(item.status),
					}))
					.filter((interval: { start: Date | null; end: Date | null }) => interval.start && interval.end);

				results.push({ mailbox: schedule.scheduleId, intervals });
			}
		}

		return results;
	}

	public async createSubscription(mailbox: string, notificationUrl: string, clientState: string): Promise<ICalendarSubscription> {
		const payload = await this.requestJson(
			'POST',
			`${this.graphHost}/v1.0/subscriptions`,
			JSON.stringify({
				changeType: 'created,updated,deleted',
				notificationUrl,
				resource: `/users/${mailbox}/events`,
				expirationDateTime: new Date(Date.now() + SUBSCRIPTION_TTL_MS).toISOString(),
				clientState,
			}),
			{ 'Content-Type': 'application/json' },
		);
		return this.mapSubscription(payload);
	}

	public async renewSubscription(subscriptionId: string): Promise<ICalendarSubscription> {
		const payload = await this.requestJson(
			'PATCH',
			`${this.graphHost}/v1.0/subscriptions/${encodeURIComponent(subscriptionId)}`,
			JSON.stringify({ expirationDateTime: new Date(Date.now() + SUBSCRIPTION_TTL_MS).toISOString() }),
			{ 'Content-Type': 'application/json' },
		);
		return this.mapSubscription(payload);
	}

	public async deleteSubscription(subscriptionId: string): Promise<void> {
		await this.requestJson('DELETE', `${this.graphHost}/v1.0/subscriptions/${encodeURIComponent(subscriptionId)}`);
	}

	private mapSubscription(payload: Record<string, any>): ICalendarSubscription {
		const expiresAt = this.parseGraphDate(payload.expirationDateTime);
		if (typeof payload.id !== 'string' || !expiresAt) {
			throw new CalendarSyncError('provider-error', 'Unexpected subscription response from Microsoft Graph');
		}
		return { id: payload.id, expiresAt };
	}

	private mapEvent(entry: Record<string, any>): IExternalCalendarEvent | null {
		if (typeof entry.id !== 'string') {
			return null;
		}

		const startTime = this.parseGraphDate(entry.start?.dateTime);
		const endTime = this.parseGraphDate(entry.end?.dateTime);
		if (!startTime || !endTime) {
			return null;
		}

		return {
			externalId: entry.id,
			...(typeof entry.iCalUId === 'string' && { iCalUId: entry.iCalUId }),
			subject: typeof entry.subject === 'string' ? entry.subject : '',
			description: typeof entry.bodyPreview === 'string' ? entry.bodyPreview : '',
			startTime,
			endTime,
			busy: BUSY_STATUSES.has(entry.showAs),
			...(this.extractMeetingUrl(entry) && { meetingUrl: this.extractMeetingUrl(entry) }),
			...(entry.isCancelled === true && { isCancelled: true }),
		};
	}

	private extractMeetingUrl(entry: Record<string, any>): string | undefined {
		if (typeof entry.onlineMeeting?.joinUrl === 'string') {
			return entry.onlineMeeting.joinUrl;
		}
		if (typeof entry.onlineMeetingUrl === 'string' && entry.onlineMeetingUrl) {
			return entry.onlineMeetingUrl;
		}
		return undefined;
	}

	/** Graph returns e.g. `2026-07-11T10:00:00.0000000` in the requested (UTC) timezone, without a zone suffix */
	private parseGraphDate(value: unknown): Date | null {
		if (typeof value !== 'string' || !value) {
			return null;
		}
		const date = new Date(/[Zz]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	private extractQueryParam(link: string, param: string): string | undefined {
		try {
			return new URL(this.assertGraphUrl(link)).searchParams.get(param) ?? undefined;
		} catch (error) {
			if (error instanceof CalendarSyncError) {
				throw error;
			}
			return undefined;
		}
	}

	private assertGraphUrl(link: string): string {
		if (!link.startsWith(`${this.graphHost}/`)) {
			throw new CalendarSyncError('provider-error', 'Received a pagination link outside the configured Microsoft Graph host');
		}
		return link;
	}

	private async requestJson(method: string, url: string, body?: string, headers: Record<string, string> = {}): Promise<any> {
		let refreshedToken = false;

		for (let attempt = 0; ; attempt++) {
			const token = await this.tokens.getToken();

			let response: IMinimalFetchResponse;
			try {
				response = await this.fetchFn(url, {
					method,
					headers: {
						...headers,
						Authorization: `Bearer ${token}`,
						Accept: 'application/json',
					},
					...(body !== undefined && { body }),
				});
			} catch (error) {
				throw new CalendarSyncError('network-error', `Unable to reach Microsoft Graph: ${(error as Error).message}`);
			}

			if (response.status === 401 && !refreshedToken) {
				refreshedToken = true;
				this.tokens.invalidate();
				continue;
			}

			if ((response.status === 429 || response.status === 503 || response.status === 504) && attempt < MAX_THROTTLE_RETRIES) {
				const retryAfterSeconds = Number(response.headers.get('Retry-After'));
				const waitMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : DEFAULT_RETRY_AFTER_MS;
				await this.sleep(Math.min(waitMs, MAX_RETRY_AFTER_MS));
				continue;
			}

			if (response.status === 410) {
				throw new CalendarSyncError('delta-token-expired', 'The Microsoft Graph delta token is no longer valid');
			}

			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw this.mapGraphError(response.status, payload);
			}

			return payload;
		}
	}

	private mapGraphError(status: number, payload: { error?: { code?: string; message?: string } }): CalendarSyncError {
		const graphCode = payload.error?.code ?? '';
		const message = (payload.error?.message ?? `Microsoft Graph request failed with status ${status}`).split(/[\r\n]/)[0];

		if (status === 429) {
			return new CalendarSyncError('throttled', 'Microsoft Graph throttling limit reached');
		}
		if (status === 403 || graphCode === 'Authorization_RequestDenied' || graphCode === 'ErrorAccessDenied') {
			return new CalendarSyncError(
				'consent-missing',
				`Access denied by Microsoft Graph — check application permissions and admin consent (${message})`,
			);
		}
		if (
			status === 404 ||
			graphCode === 'ErrorItemNotFound' ||
			graphCode === 'ResourceNotFound' ||
			graphCode === 'MailboxNotEnabledForRESTAPI'
		) {
			return new CalendarSyncError('mailbox-not-found', message);
		}
		if (status === 401) {
			return new CalendarSyncError('auth-failed', message);
		}

		return new CalendarSyncError('provider-error', `${graphCode || status}: ${message}`);
	}
}
