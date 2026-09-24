import type { ExtendedFetchOptions, Response } from '@rocket.chat/server-fetch';

import { DEFAULT_GRAPH_HOST, GraphTokenClient } from './GraphTokenClient';
import type { GraphTokenClientConfig } from './GraphTokenClient';
import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type {
	ContactFolder,
	DateRange,
	ExchangeContact,
	ExchangeContactEmail,
	ExchangeContactPhoto,
	ExchangeContactPhone,
	ExchangeEvent,
	ExchangeProviderCapabilities,
	Page,
} from '../definition/types';
import { ExchangeError } from '../errors';
import { fetchWithRetry } from '../http/fetchWithRetry';
import { logger } from '../logger';
import { MAX_CONTACT_PHOTO_BYTES } from '../sync/limits';

const GRAPH_API_VERSION = 'v1.0';
const REQUEST_TIMEOUT_MS = 30000;

/** Without this, Graph answers in the mailbox's own timezone with the zone in a sibling field. */
const PREFER_UTC = 'outlook.timezone="UTC"';

/** Pinned rather than left to Graph, so the page cap below is worth a number we know. Matches EWS. */
const CONTACT_FOLDER_PAGE_SIZE = 100;

/** At 100 folders a page, far past any real address book. A backstop, not a working limit. */
const MAX_FOLDER_PAGES = 50;

const DEFAULT_CONTACT_FOLDER_ID = 'default';

const CONTACT_FIELDS =
	'id,displayName,givenName,surname,companyName,emailAddresses,mobilePhone,businessPhones,homePhones,categories,officeLocation';

/** Graph's own ceiling, not a tuning knob: a `$batch` carrying more than 20 requests is rejected */
const GRAPH_BATCH_SIZE = 20;

type GraphDateTimeTimeZone = {
	dateTime?: unknown;
	timeZone?: unknown;
};

type GraphEvent = {
	'id'?: unknown;
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

type GraphContactFolder = {
	id?: unknown;
	displayName?: unknown;
};

type GraphContact = {
	'id'?: unknown;
	'displayName'?: unknown;
	'givenName'?: unknown;
	'surname'?: unknown;
	'companyName'?: unknown;
	'emailAddresses'?: unknown;
	'mobilePhone'?: unknown;
	'businessPhones'?: unknown;
	'homePhones'?: unknown;
	'categories'?: unknown;
	'officeLocation'?: unknown;
	'@removed'?: unknown;
};

type GraphBatchResponse = {
	responses?: Array<{
		id: string;
		status: number;
		headers?: Record<string, string>;
		body?: string;
	}>;
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

// Graph gives one number as a bare string and the rest as arrays, so both arrive here.
const asStringArray = (value: unknown): string[] =>
	(Array.isArray(value) ? value : [value]).map((entry) => asString(entry)).filter((entry): entry is string => entry !== undefined);

const toPhones = (value: unknown, label: string): ExchangeContactPhone[] => asStringArray(value).map((raw) => ({ raw, label }));

const toEmails = (value: unknown): ExchangeContactEmail[] =>
	(Array.isArray(value) ? value : [])
		.map((entry) => asString((entry as { address?: unknown } | null)?.address))
		.filter((address): address is string => address !== undefined)
		.map((address) => ({ address }));

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

	public async listEvents(mailbox: string, timeWindow: DateRange, cursor?: string): Promise<Page<ExchangeEvent>> {
		const payload = await this.requestJson<GraphDeltaResponse>(cursor ?? this.calendarViewDeltaUrl(mailbox, timeWindow), {
			headers: { Prefer: PREFER_UTC },
		});

		const raw = Array.isArray(payload.value) ? (payload.value as GraphEvent[]) : [];
		const nextLink = asString(payload['@odata.nextLink']);

		return {
			items: raw.map((event) => this.toExchangeEvent(event)).filter((event): event is ExchangeEvent => event !== undefined),
			// A `nextLink` resumes this round, a `deltaLink` opens the next one. Both come back as the cursor.
			cursor: nextLink ?? asString(payload['@odata.deltaLink']),
			hasMore: Boolean(nextLink),
			coverage: 'delta',
		};
	}

	public async listContactFolders(mailbox: string): Promise<ContactFolder[]> {
		const folders: ContactFolder[] = [{ id: DEFAULT_CONTACT_FOLDER_ID, displayName: 'Contacts' }];

		let url = `${this.graphHost}/${GRAPH_API_VERSION}/users/${encodeURIComponent(
			mailbox,
		)}/contactFolders?$select=id,displayName&$top=${CONTACT_FOLDER_PAGE_SIZE}`;

		for (let page = 0; page < MAX_FOLDER_PAGES; page++) {
			const payload = await this.requestJson<GraphDeltaResponse>(url);
			const raw = Array.isArray(payload.value) ? (payload.value as GraphContactFolder[]) : [];

			for (const folder of raw) {
				const id = asString(folder.id);

				if (!id) {
					logger.warn({ msg: 'Skipping Graph contact folder without an id' });
					continue;
				}

				folders.push({ id, displayName: asString(folder.displayName) ?? '' });
			}

			const nextLink = asString(payload['@odata.nextLink']);

			if (!nextLink) {
				return folders;
			}

			url = nextLink;
		}

		logger.error({ msg: 'Graph contact folders paged out, the rest of them will not sync', mailbox, listed: folders.length });

		return folders;
	}

	public async listContacts(mailbox: string, folderId: string, cursor?: string): Promise<Page<ExchangeContact>> {
		const payload = await this.requestJson<GraphDeltaResponse>(cursor ?? this.contactsDeltaUrl(mailbox, folderId));

		const raw = Array.isArray(payload.value) ? (payload.value as GraphContact[]) : [];
		const nextLink = asString(payload['@odata.nextLink']);

		return {
			items: raw
				.map((contact) => this.toExchangeContact(contact, folderId))
				.filter((contact): contact is ExchangeContact => contact !== undefined),
			cursor: nextLink ?? asString(payload['@odata.deltaLink']),
			hasMore: Boolean(nextLink),
			coverage: 'delta',
		};
	}

	public async *getContactPhotos(mailbox: string, externalIds: string[]): AsyncIterable<ExchangeContactPhoto> {
		const batchUrl = `${this.graphHost}/${GRAPH_API_VERSION}/$batch`;

		for (let i = 0; i < externalIds.length; i += GRAPH_BATCH_SIZE) {
			const chunk = externalIds.slice(i, i + GRAPH_BATCH_SIZE);
			const batch: ExchangeContactPhoto[] = [];

			const batchPayload = {
				requests: chunk.map((externalId) => ({
					id: externalId,
					method: 'GET',
					url: `/users/${encodeURIComponent(mailbox)}/contacts/${encodeURIComponent(externalId)}/photo/$value`,
				})),
			};

			try {
				const batchResult = await this.requestJson<GraphBatchResponse>(batchUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(batchPayload),
				});

				for (const res of batchResult.responses ?? []) {
					if (res.status !== 200 || !res.body) {
						continue;
					}

					const data = new Uint8Array(Buffer.from(res.body, 'base64'));

					if (!data.byteLength) {
						continue;
					}

					if (data.byteLength > MAX_CONTACT_PHOTO_BYTES) {
						logger.warn({ msg: 'Skipping a Graph contact photo above the size cap', externalId: res.id, bytes: data.byteLength });
						continue;
					}

					const contentType = res.headers?.['Content-Type'] ?? res.headers?.['content-type'] ?? 'image/jpeg';

					batch.push({
						externalId: res.id,
						data,
						contentType,
					});
				}
			} catch (error) {
				logger.error({ msg: 'Failed to fetch contact photos batch from Graph', mailbox, error });
			}

			yield* batch;
		}
	}

	private contactsDeltaUrl(mailbox: string, folderId: string): string {
		const mailboxUrl = `${this.graphHost}/${GRAPH_API_VERSION}/users/${encodeURIComponent(mailbox)}`;
		const scope = folderId === DEFAULT_CONTACT_FOLDER_ID ? 'contacts' : `contactFolders/${encodeURIComponent(folderId)}/contacts`;

		return `${mailboxUrl}/${scope}/delta?$select=${CONTACT_FIELDS}`;
	}

	private toExchangeContact(contact: GraphContact, folderId: string): ExchangeContact | undefined {
		const externalId = asString(contact.id);
		if (!externalId) {
			logger.warn({ msg: 'Skipping Graph contact without an id' });
			return undefined;
		}

		if (contact['@removed']) {
			return { kind: 'deleted', externalId, folderId };
		}

		const emails = toEmails(contact.emailAddresses);
		const categories = asStringArray(contact.categories);
		const phones = [
			...toPhones(contact.mobilePhone, 'mobile'),
			...toPhones(contact.businessPhones, 'business'),
			...toPhones(contact.homePhones, 'home'),
		];

		const givenName = asString(contact.givenName);
		const surname = asString(contact.surname);
		const companyName = asString(contact.companyName);
		const officeLocation = asString(contact.officeLocation);

		const fullName = [givenName, surname].filter(Boolean).join(' ');
		const displayName = asString(contact.displayName) || fullName || emails[0]?.address || phones[0]?.raw;

		if (!displayName) {
			logger.warn({ msg: 'Skipping Graph contact with nothing to resolve it by', externalId });
			return undefined;
		}

		return {
			kind: 'upsert',
			externalId,
			folderId,
			displayName,
			...(givenName && { givenName }),
			...(surname && { surname }),
			...(companyName && { companyName }),
			...(officeLocation && { officeLocation }),
			emails,
			phones,
			categories,
		};
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

		const endTime = parseGraphDateTime(event.end);
		const description = asString(event.body?.content) ?? asString(event.bodyPreview) ?? '';
		const meetingUrl = asString(event.onlineMeeting?.joinUrl);

		return {
			kind: 'upsert',
			externalId,
			subject: asString(event.subject) ?? '',
			description,
			startTime,
			...(endTime && { endTime }),
			isCancelled: event.isCancelled === true,
			busy: isBusy(event.showAs),
			...(meetingUrl && { meetingUrl }),
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
