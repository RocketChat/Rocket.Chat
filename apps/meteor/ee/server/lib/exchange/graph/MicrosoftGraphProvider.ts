import type { ExtendedFetchOptions, Response } from '@rocket.chat/server-fetch';

import { GraphTokenClient } from './GraphTokenClient';
import type { GraphTokenClientConfig } from './GraphTokenClient';
import type { IExchangeProvider, ExchangeProviderCapabilities } from '../definition/IExchangeProvider';
import type { BusyBlock, DateRange, ExchangeEvent, Page } from '../definition/types';
import { ExchangeError } from '../errors';
import { fetchWithRetry } from '../http/fetchWithRetry';
import { logger } from '../logger';

const GRAPH_API_VERSION = 'v1.0';
const REQUEST_TIMEOUT_MS = 30000;

/** Without this, Graph answers in the mailbox's own timezone with the zone in a sibling field. */
const PREFER_UTC = 'outlook.timezone="UTC"';

type GraphDateTimeTimeZone = {
	dateTime?: unknown;
	timeZone?: unknown;
};

type GraphEvent = {
	'id'?: unknown;
	'iCalUId'?: unknown;
	'subject'?: unknown;
	'bodyPreview'?: unknown;
	'body'?: { content?: unknown };
	'start'?: GraphDateTimeTimeZone;
	'end'?: GraphDateTimeTimeZone;
	'isAllDay'?: unknown;
	'isCancelled'?: unknown;
	'showAs'?: unknown;
	'onlineMeeting'?: { joinUrl?: unknown } | null;
	'reminderMinutesBeforeStart'?: unknown;
	'@removed'?: unknown;
};

type GraphDeltaResponse = {
	'value'?: unknown;
	'@odata.nextLink'?: unknown;
	'@odata.deltaLink'?: unknown;
};

type GraphScheduleResponse = {
	value?: {
		scheduleItems?: {
			start?: GraphDateTimeTimeZone;
			end?: GraphDateTimeTimeZone;
			status?: unknown;
		}[];
	}[];
};

/**
 * Graph sends `2026-08-21T10:00:00.0000000` with no zone suffix. Since we always request UTC, the marker
 * is appended rather than letting the runtime guess the server's local zone.
 */
export const parseGraphDateTime = (value: GraphDateTimeTimeZone | undefined): Date | undefined => {
	if (!value || typeof value.dateTime !== 'string' || !value.dateTime) {
		return undefined;
	}

	const raw = value.dateTime;
	const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw);
	const parsed = new Date(hasZone ? raw : `${raw}Z`);

	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

/** Only `busy` counts, matching the EWS `LegacyFreeBusyStatus` rule so presence behaves the same either way. */
const isBusy = (showAs: unknown): boolean => showAs === 'busy';

export class MicrosoftGraphProvider implements IExchangeProvider {
	public readonly id = 'graph' as const;

	public readonly capabilities: ExchangeProviderCapabilities = {
		supportsDelta: true,
		supportsWebhooks: true,
		supportsContacts: false,
	};

	private readonly tokenClient: GraphTokenClient;

	private readonly graphHost: string;

	constructor(config: GraphTokenClientConfig, tokenClient = new GraphTokenClient(config)) {
		this.tokenClient = tokenClient;
		this.graphHost = (config.graphHost ?? 'https://graph.microsoft.com').replace(/\/+$/, '');
	}

	/** Credentials and tenant only. Probing a mailbox needs an address and belongs to a separate action. */
	public async testConnection(): Promise<void> {
		await this.tokenClient.getAccessToken();
	}

	public async listEvents(mailbox: string, window: DateRange, cursor?: string): Promise<Page<ExchangeEvent>> {
		const url = cursor ?? this.calendarViewDeltaUrl(mailbox, window);

		const payload = await this.requestJson<GraphDeltaResponse>(url, { headers: { Prefer: PREFER_UTC } });

		const raw = Array.isArray(payload.value) ? (payload.value as GraphEvent[]) : [];
		const items = raw.map((event) => this.toExchangeEvent(event)).filter((event): event is ExchangeEvent => event !== undefined);

		const nextLink = asString(payload['@odata.nextLink']);
		const deltaLink = asString(payload['@odata.deltaLink']);

		return {
			items,
			// `nextLink` means more pages now; `deltaLink` is the resume point for the next run.
			cursor: nextLink ?? deltaLink,
			hasMore: Boolean(nextLink),
		};
	}

	public async getFreeBusy(mailbox: string, window: DateRange): Promise<BusyBlock[]> {
		const url = `${this.graphHost}/${GRAPH_API_VERSION}/users/${encodeURIComponent(mailbox)}/calendar/getSchedule`;

		const payload = await this.requestJson<GraphScheduleResponse>(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Prefer': PREFER_UTC },
			body: JSON.stringify({
				schedules: [mailbox],
				startTime: { dateTime: window.start.toISOString(), timeZone: 'UTC' },
				endTime: { dateTime: window.end.toISOString(), timeZone: 'UTC' },
				availabilityViewInterval: 15,
			}),
		});

		const scheduleItems = payload.value?.[0]?.scheduleItems ?? [];

		return scheduleItems
			.filter((item) => isBusy(item.status) || item.status === 'oof')
			.map((item) => {
				const start = parseGraphDateTime(item.start);
				const end = parseGraphDateTime(item.end);
				return start && end ? { start, end } : undefined;
			})
			.filter((block): block is BusyBlock => block !== undefined);
	}

	private calendarViewDeltaUrl(mailbox: string, window: DateRange): string {
		const params = new URLSearchParams({
			startDateTime: window.start.toISOString(),
			endDateTime: window.end.toISOString(),
		});

		return `${this.graphHost}/${GRAPH_API_VERSION}/users/${encodeURIComponent(mailbox)}/calendarView/delta?${params.toString()}`;
	}

	private toExchangeEvent(event: GraphEvent): ExchangeEvent | undefined {
		const externalId = asString(event.id);
		if (!externalId) {
			// No key means we could never update or delete it later.
			logger.warn({ msg: 'Skipping Graph event without an id' });
			return undefined;
		}

		if (event['@removed']) {
			return { kind: 'deleted', externalId };
		}

		const startTime = parseGraphDateTime(event.start);
		if (!startTime) {
			logger.warn({ msg: 'Skipping Graph event without a parseable start time', externalId });
			return undefined;
		}

		const description = asString(event.body?.content) ?? asString(event.bodyPreview) ?? '';

		return {
			kind: 'upsert',
			externalId,
			...(asString(event.iCalUId) && { iCalUId: asString(event.iCalUId) }),
			subject: asString(event.subject) ?? '',
			description,
			startTime,
			...(parseGraphDateTime(event.end) && { endTime: parseGraphDateTime(event.end) }),
			isAllDay: event.isAllDay === true,
			isCancelled: event.isCancelled === true,
			busy: isBusy(event.showAs),
			...(asString(event.onlineMeeting?.joinUrl) && { meetingUrl: asString(event.onlineMeeting?.joinUrl) }),
			...(typeof event.reminderMinutesBeforeStart === 'number' && {
				reminderMinutesBeforeStart: event.reminderMinutesBeforeStart,
			}),
		};
	}

	private async requestJson<T>(url: string, init: Omit<ExtendedFetchOptions, 'ignoreSsrfValidation' | 'allowList'> = {}): Promise<T> {
		let response = await this.authorizedFetch(url, init);

		// A cached token can still be rejected if the secret was rotated or the grant revoked.
		if (response.status === 401) {
			this.tokenClient.invalidate();
			response = await this.authorizedFetch(url, init);
		}

		if (!response.ok) {
			throw await this.toError(response, url);
		}

		const payload = (await response.json().catch(() => undefined)) as T | undefined;
		if (payload === undefined) {
			throw new ExchangeError('unexpected-response', 'Microsoft Graph returned a body that is not JSON');
		}

		return payload;
	}

	private async authorizedFetch(url: string, init: Omit<ExtendedFetchOptions, 'ignoreSsrfValidation' | 'allowList'>): Promise<Response> {
		const token = await this.tokenClient.getAccessToken();

		return fetchWithRetry(url, {
			...init,
			headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
			timeout: REQUEST_TIMEOUT_MS,
			// Air-gap invariant: SSRF validation stays on, and only the token client's hosts are reachable.
			ignoreSsrfValidation: false,
			allowList: this.tokenClient.allowList,
		});
	}

	private async toError(response: Response, url: string): Promise<ExchangeError> {
		const detail = (await response.text().catch(() => undefined))?.slice(0, 500);

		logger.warn({ msg: 'Microsoft Graph request failed', status: response.status, url });

		switch (response.status) {
			case 401:
				return new ExchangeError('authentication-failed', 'Microsoft Graph rejected the access token', { detail });
			case 403:
				return new ExchangeError('authorization-failed', 'The app registration is not allowed to read this mailbox', { detail });
			case 404:
				return new ExchangeError('mailbox-not-found', 'Microsoft Graph could not find the mailbox', { detail });
			default:
				return new ExchangeError('unexpected-response', `Microsoft Graph returned ${response.status}`, { detail });
		}
	}
}
