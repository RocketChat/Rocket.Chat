import { createHash, timingSafeEqual } from 'node:crypto';

import { getMicrosoftCloudEndpoints } from './clouds';
import { EnterpriseCalendarError, sanitizeGraphError } from './errors';
import { GraphTokenProvider } from './graphTokenProvider';
import { parseRetryAfterMs } from './retry';
import type {
	CalendarAvailability,
	CalendarConfigurationValidation,
	CalendarMailboxIdentity,
	CalendarSubscription,
	CalendarSyncCursor,
	CalendarSyncResult,
	CalendarUserIdentity,
	IEnterpriseCalendarProvider,
	GraphProviderConfiguration,
	HttpClient,
	NormalizedCalendarEvent,
} from './types';

type GraphDateTime = { dateTime?: string; timeZone?: string };
type GraphEvent = {
	'id'?: string;
	'start'?: GraphDateTime;
	'end'?: GraphDateTime;
	'showAs'?: string;
	'isCancelled'?: boolean;
	'isAllDay'?: boolean;
	'sensitivity'?: string;
	'lastModifiedDateTime'?: string;
	'seriesMasterId'?: string;
	'@removed'?: { reason?: string };
};
type GraphPage = {
	'value'?: GraphEvent[];
	'@odata.nextLink'?: string;
	'@odata.deltaLink'?: string;
};

const SELECT_FIELDS = 'id,start,end,showAs,isCancelled,isAllDay,sensitivity,lastModifiedDateTime,seriesMasterId,type';

const parseGraphDate = (value?: GraphDateTime): Date | null => {
	if (!value?.dateTime) return null;
	const raw = /(?:Z|[+-]\d\d:\d\d)$/.test(value.dateTime) ? value.dateTime : `${value.dateTime}Z`;
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeGraphAvailability = (showAs?: string): CalendarAvailability => {
	switch (showAs) {
		case 'free':
		case 'workingElsewhere':
		case 'tentative':
		case 'busy':
		case 'outOfOffice':
			return showAs;
		default:
			return 'unknown';
	}
};

const normalizeEvent = (event: GraphEvent, mailbox: CalendarMailboxIdentity): NormalizedCalendarEvent | null => {
	if (!event.id || event['@removed']) return null;
	const start = parseGraphDate(event.start);
	const end = parseGraphDate(event.end);
	if (!start || !end || start >= end) return null;
	const lastModifiedAt = event.lastModifiedDateTime ? new Date(event.lastModifiedDateTime) : undefined;
	return {
		externalId: event.id,
		mailbox,
		start,
		end,
		availability: normalizeGraphAvailability(event.showAs),
		isCancelled: event.isCancelled === true,
		isAllDay: event.isAllDay === true,
		isPrivate: event.sensitivity === 'private',
		...(lastModifiedAt && !Number.isNaN(lastModifiedAt.getTime()) && { lastModifiedAt }),
		...(event.seriesMasterId && { changeKey: event.seriesMasterId }),
	};
};

export class MicrosoftGraphCalendarProvider implements IEnterpriseCalendarProvider {
	readonly type = 'microsoft-graph' as const;

	private readonly tokenProvider: GraphTokenProvider;

	private readonly graphRoot: string;

	constructor(
		private readonly configuration: GraphProviderConfiguration,
		private readonly http: HttpClient,
	) {
		this.tokenProvider = new GraphTokenProvider(configuration, http);
		this.graphRoot = getMicrosoftCloudEndpoints(configuration.cloud).graph;
	}

	async validateConfiguration(testMailbox?: CalendarMailboxIdentity): Promise<CalendarConfigurationValidation> {
		try {
			await this.tokenProvider.getToken();
			if (testMailbox) {
				const now = new Date();
				await this.getCalendarWindow(testMailbox, new Date(now.getTime() - 60_000), new Date(now.getTime() + 60_000));
			}
			if (this.configuration.webhookUrl) {
				const url = new URL(this.configuration.webhookUrl);
				if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
					return { valid: false, code: 'invalid-webhook-url', message: 'Webhook URL must be a public HTTPS URL without credentials' };
				}
				if (testMailbox) {
					const subscription = await this.createOrRenewSubscription(testMailbox);
					await this.removeSubscription(subscription);
				}
			}
			return { valid: true };
		} catch (error) {
			if (error instanceof EnterpriseCalendarError) return { valid: false, code: error.category, message: error.message };
			return { valid: false, code: 'configuration', message: 'Microsoft Graph configuration is invalid' };
		}
	}

	async resolveMailbox(user: CalendarUserIdentity): Promise<CalendarMailboxIdentity | null> {
		if (!user.active || user.providerHint === 'exchange-ews') return null;
		const address = user.trustedUpn ?? (user.verifiedEmails.length === 1 ? user.verifiedEmails[0] : undefined);
		if (!address) return null;
		return { provider: this.type, address, tenantId: this.configuration.tenantId };
	}

	async getCalendarWindow(mailbox: CalendarMailboxIdentity, start: Date, end: Date): Promise<NormalizedCalendarEvent[]> {
		this.assertWindow(start, end);
		const url = new URL(`${this.graphRoot}/v1.0/users/${encodeURIComponent(mailbox.externalUserId ?? mailbox.address)}/calendarView`);
		url.searchParams.set('startDateTime', start.toISOString());
		url.searchParams.set('endDateTime', end.toISOString());
		url.searchParams.set('$select', SELECT_FIELDS);
		const { events } = await this.readPages(url.toString(), mailbox);
		return events;
	}

	async synchronizeChanges(mailbox: CalendarMailboxIdentity, cursor: CalendarSyncCursor): Promise<CalendarSyncResult> {
		this.assertWindow(cursor.windowStart, cursor.windowEnd);
		this.assertTrustedGraphUrl(cursor.value);
		try {
			const result = await this.readPages(cursor.value, mailbox);
			return {
				events: result.events,
				deletedExternalIds: result.deletedExternalIds,
				...(result.nextLink && {
					nextCursor: { value: result.nextLink, windowStart: cursor.windowStart, windowEnd: cursor.windowEnd },
				}),
			};
		} catch (error) {
			if (error instanceof EnterpriseCalendarError && error.category === 'invalid-cursor') {
				return { events: [], deletedExternalIds: [], requiresFullResync: true };
			}
			throw error;
		}
	}

	async getInitialDelta(mailbox: CalendarMailboxIdentity, start: Date, end: Date): Promise<CalendarSyncResult> {
		this.assertWindow(start, end);
		const url = new URL(`${this.graphRoot}/v1.0/users/${encodeURIComponent(mailbox.externalUserId ?? mailbox.address)}/calendarView/delta`);
		url.searchParams.set('startDateTime', start.toISOString());
		url.searchParams.set('endDateTime', end.toISOString());
		url.searchParams.set('$select', SELECT_FIELDS);
		const result = await this.readPages(url.toString(), mailbox);
		return {
			events: result.events,
			deletedExternalIds: result.deletedExternalIds,
			...(result.nextLink && { nextCursor: { value: result.nextLink, windowStart: start, windowEnd: end } }),
		};
	}

	async createOrRenewSubscription(
		mailbox: CalendarMailboxIdentity,
		existingSubscription?: CalendarSubscription,
	): Promise<CalendarSubscription> {
		if (!this.configuration.webhookUrl || !this.configuration.webhookClientState) {
			throw new EnterpriseCalendarError('configuration', false, 'Webhook URL and client state are required');
		}
		const expiresAt = new Date(Date.now() + 6 * 24 * 60 * 60_000);
		const id = existingSubscription?.id;
		const url = id ? `${this.graphRoot}/v1.0/subscriptions/${encodeURIComponent(id)}` : `${this.graphRoot}/v1.0/subscriptions`;
		const body = id
			? { expirationDateTime: expiresAt.toISOString() }
			: {
					changeType: 'created,updated,deleted',
					notificationUrl: this.configuration.webhookUrl,
					lifecycleNotificationUrl: this.configuration.webhookUrl,
					resource: `/users/${mailbox.externalUserId ?? mailbox.address}/events`,
					expirationDateTime: expiresAt.toISOString(),
					clientState: this.configuration.webhookClientState,
				};
		const payload = await this.requestJson<{ id?: string; expirationDateTime?: string }>(url, id ? 'PATCH' : 'POST', body);
		if (!payload.id || !payload.expirationDateTime)
			throw new EnterpriseCalendarError('invalid-response', false, 'Invalid subscription response');
		return {
			id: payload.id,
			mailbox,
			expiresAt: new Date(payload.expirationDateTime),
			clientStateHash: createHash('sha256').update(this.configuration.webhookClientState).digest('hex'),
		};
	}

	async removeSubscription(subscription: CalendarSubscription): Promise<void> {
		await this.requestJson(`${this.graphRoot}/v1.0/subscriptions/${encodeURIComponent(subscription.id)}`, 'DELETE');
	}

	validateClientState(value: string): boolean {
		const expected = this.configuration.webhookClientState;
		if (!expected) return false;
		const actualBuffer = Buffer.from(value);
		const expectedBuffer = Buffer.from(expected);
		return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
	}

	private async readPages(url: string, mailbox: CalendarMailboxIdentity) {
		const events: NormalizedCalendarEvent[] = [];
		const deletedExternalIds: string[] = [];
		let next: string | undefined = url;
		let terminalLink: string | undefined;
		let pages = 0;
		while (next) {
			if (++pages > 100) throw new EnterpriseCalendarError('invalid-response', false, 'Calendar response exceeded pagination limit');
			this.assertTrustedGraphUrl(next);
			const page: GraphPage = await this.requestJson(next, 'GET');
			if (!Array.isArray(page.value))
				throw new EnterpriseCalendarError('invalid-response', false, 'Calendar response contains no event list');
			for (const graphEvent of page.value) {
				if (graphEvent['@removed'] && graphEvent.id) deletedExternalIds.push(graphEvent.id);
				else {
					const event = normalizeEvent(graphEvent, mailbox);
					if (event) events.push(event);
				}
			}
			next = page['@odata.nextLink'];
			terminalLink = page['@odata.deltaLink'] ?? next;
		}
		return { events, deletedExternalIds, nextLink: terminalLink };
	}

	private async requestJson<T = Record<string, never>>(
		url: string,
		method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
		body?: object,
	): Promise<T> {
		this.assertTrustedGraphUrl(url);
		const token = await this.tokenProvider.getToken();
		const response = await this.http(url, {
			method,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				Prefer: 'outlook.timezone="UTC"',
				...(body && { 'Content-Type': 'application/json' }),
			},
			...(body && { body: JSON.stringify(body) }),
			timeoutMs: this.configuration.requestTimeoutMs,
		});
		const text = await response.text();
		if (Buffer.byteLength(text) > 10 * 1024 * 1024) {
			throw new EnterpriseCalendarError('invalid-response', false, 'Microsoft Graph response exceeded the size limit');
		}
		if (response.status < 200 || response.status >= 300) {
			let code: string | undefined;
			try {
				code = (JSON.parse(text) as { error?: { code?: string } }).error?.code;
			} catch {
				// Error content is intentionally discarded.
			}
			throw sanitizeGraphError(response.status, code, parseRetryAfterMs(response.headers.get('retry-after')));
		}
		if (!text) return {} as T;
		try {
			return JSON.parse(text) as T;
		} catch {
			throw new EnterpriseCalendarError('invalid-response', false, 'Microsoft Graph returned invalid JSON');
		}
	}

	private assertTrustedGraphUrl(value: string): void {
		const url = new URL(value);
		const root = new URL(this.graphRoot);
		if (url.protocol !== 'https:' || url.origin !== root.origin || !url.pathname.startsWith('/v1.0/')) {
			throw new EnterpriseCalendarError('configuration', false, 'Untrusted Microsoft Graph cursor URL');
		}
	}

	private assertWindow(start: Date, end: Date): void {
		const length = end.getTime() - start.getTime();
		if (!Number.isFinite(length) || length <= 0 || length > 120 * 24 * 60 * 60_000) {
			throw new EnterpriseCalendarError('configuration', false, 'Calendar window must be between zero and 120 days');
		}
	}
}
