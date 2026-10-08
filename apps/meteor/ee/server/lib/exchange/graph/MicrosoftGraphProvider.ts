import type { ExtendedFetchOptions, Response } from '@rocket.chat/server-fetch';

import { DEFAULT_GRAPH_HOST, GraphTokenClient } from './GraphTokenClient';
import type { GraphTokenClientConfig } from './GraphTokenClient';
import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type { DateRange, EventPage, ExchangeEvent, ExchangeProviderCapabilities } from '../definition/types';
import { ExchangeError } from '../errors';
import { fetchWithRetry } from '../http/fetchWithRetry';
import { logger } from '../logger';

const GRAPH_API_VERSION = 'v1.0';
const REQUEST_TIMEOUT_MS = 30000;
const MASTER_FETCH_BATCH_SIZE = 5;

/** Without this, Graph answers in the mailbox's own timezone with the zone in a sibling field. */
const PREFER_UTC = 'outlook.timezone="UTC"';

type GraphDateTimeTimeZone = {
	dateTime?: unknown;
	timeZone?: unknown;
};

type GraphEvent = {
	'id'?: unknown;
	'type'?: unknown;
	'seriesMasterId'?: unknown;
	'subject'?: unknown;
	'bodyPreview'?: unknown;
	'body'?: { content?: unknown };
	'start'?: GraphDateTimeTimeZone;
	'end'?: GraphDateTimeTimeZone;
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

export class MicrosoftGraphProvider implements IExchangeProvider {
	public readonly id = 'graph' as const;

	public readonly capabilities: ExchangeProviderCapabilities = {
		supportsWebhooks: true,
	};

	private readonly tokenClient: GraphTokenClient;

	private readonly graphHost: string;

	constructor(config: GraphTokenClientConfig, tokenClient = new GraphTokenClient(config)) {
		this.tokenClient = tokenClient;
		this.graphHost = (config.graphHost || DEFAULT_GRAPH_HOST).replace(/\/+$/, '');
	}

	public async testConnection(): Promise<void> {
		await this.tokenClient.getAccessToken();
	}

	public async listEvents(mailbox: string, timeWindow: DateRange, cursor?: string): Promise<EventPage> {
		const payload = await this.requestJson<GraphDeltaResponse>(cursor ?? this.calendarViewDeltaUrl(mailbox, timeWindow), {
			headers: { Prefer: PREFER_UTC },
		});

		const raw = Array.isArray(payload.value) ? (payload.value as GraphEvent[]) : [];
		const nextLink = asString(payload['@odata.nextLink']);
		const events = await this.resolveSeries(mailbox, raw);

		return {
			items: events.map((event) => this.toExchangeEvent(event)).filter((event): event is ExchangeEvent => event !== undefined),
			// A `nextLink` resumes this round, a `deltaLink` opens the next one. Both come back as the cursor.
			cursor: nextLink ?? asString(payload['@odata.deltaLink']),
			hasMore: Boolean(nextLink),
			coverage: 'delta',
			resyncedSeries: this.resyncedSeries(raw),
		};
	}

	/**
	 * Turns a delta page into the events of the window. A recurring series arrives as its master plus one
	 * stub per occurrence: the stub carries the times and nothing else, so it is read on top of its master,
	 * and the master itself is dropped because the occurrences are what happens in the window.
	 */
	private async resolveSeries(mailbox: string, raw: GraphEvent[]): Promise<GraphEvent[]> {
		const masters = new Map<string, GraphEvent>();
		for (const event of raw) {
			const id = asString(event.id);
			if (id && event.type === 'seriesMaster') {
				masters.set(id, event);
			}
		}

		const missing = new Set<string>();
		for (const event of raw) {
			const masterId = asString(event.seriesMasterId);
			if (masterId && !event['@removed'] && !masters.has(masterId)) {
				missing.add(masterId);
			}
		}

		const ids = [...missing];
		for (let i = 0; i < ids.length; i += MASTER_FETCH_BATCH_SIZE) {
			const fetched = await Promise.all(
				ids.slice(i, i + MASTER_FETCH_BATCH_SIZE).map(async (id) => [id, await this.fetchSeriesMaster(mailbox, id)] as const),
			);

			for (const [id, master] of fetched) {
				if (master) {
					masters.set(id, master);
				}
			}
		}

		const resolved: GraphEvent[] = [];
		let unresolved = 0;

		for (const event of raw) {
			if (event.type === 'seriesMaster' && !event['@removed']) {
				continue;
			}

			const masterId = asString(event.seriesMasterId);

			if (!masterId || event['@removed']) {
				resolved.push(event);
				continue;
			}

			const master = masters.get(masterId);

			if (!master) {
				unresolved += 1;
				continue;
			}

			// Spread order is intended anything the occurrence states itself wins over the series
			resolved.push({ ...master, ...event });
		}

		if (unresolved) {
			logger.warn({ msg: 'Occurrences left out of this round, so the stored events keep what they have', mailbox, unresolved });
		}

		return resolved;
	}

	/**
	 * The series this page re-expanded. Only a master that came in the page itself counts: one we had to
	 * fetch means the page held occurrences without it, which says nothing about the ones it left out.
	 */
	private resyncedSeries(raw: GraphEvent[]): string[] {
		const ids = new Set<string>();

		for (const event of raw) {
			const id = asString(event.id);
			if (id && event.type === 'seriesMaster' && !event['@removed']) {
				ids.add(id);
			}
		}

		return [...ids];
	}

	private async fetchSeriesMaster(mailbox: string, id: string): Promise<GraphEvent | undefined> {
		const url = `${this.graphHost}/${GRAPH_API_VERSION}/users/${encodeURIComponent(mailbox)}/events/${encodeURIComponent(id)}`;

		try {
			return await this.requestJson<GraphEvent>(url, { headers: { Prefer: PREFER_UTC } });
		} catch (err) {
			logger.warn({ msg: 'Could not read the series master of a recurring event', mailbox, masterId: id, err });
			return undefined;
		}
	}

	private calendarViewDeltaUrl(mailbox: string, timeWindow: DateRange): string {
		const params = new URLSearchParams({
			startDateTime: timeWindow.start.toISOString(),
			endDateTime: timeWindow.end.toISOString(),
		});

		return `${this.graphHost}/${GRAPH_API_VERSION}/users/${encodeURIComponent(mailbox)}/calendarView/delta?${params.toString()}`;
	}

	private toExchangeEvent(event: GraphEvent): ExchangeEvent | undefined {
		const externalId = asString(event.id);
		if (!externalId) {
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

		const endTime = parseGraphDateTime(event.end);
		const description = asString(event.body?.content) ?? asString(event.bodyPreview) ?? '';
		const meetingUrl = asString(event.onlineMeeting?.joinUrl);

		return {
			kind: 'upsert',
			externalId,
			...(asString(event.seriesMasterId) && { seriesMasterId: asString(event.seriesMasterId) }),
			subject: asString(event.subject) ?? '',
			description,
			startTime,
			...(endTime && { endTime }),
			isCancelled: event.isCancelled === true,
			busy: event.showAs === 'busy',
			...(meetingUrl && { meetingUrl }),
			...(typeof event.reminderMinutesBeforeStart === 'number' && {
				reminderMinutesBeforeStart: event.reminderMinutesBeforeStart,
			}),
		};
	}

	private async requestJson<T>(url: string, init: Omit<ExtendedFetchOptions, 'ignoreSsrfValidation' | 'allowList'> = {}): Promise<T> {
		let response = await this.authorizedFetch(url, init);

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
