import type { BusyBlock, ContactFolder, DateRange, ExchangeContact, ExchangeEvent, Page } from './types';

export type ExchangeProviderId = 'graph' | 'ews';

export type ExchangeProviderCapabilities = {
	/** True for both providers: Graph uses an opaque `deltaLink`, EWS uses `SyncFolderItems` with a sync state. */
	supportsDelta: boolean;
	/** Advertised only. Nothing branches on it while polling is the only supported mode. */
	supportsWebhooks: boolean;
	/** False until contact ingestion lands for that provider. */
	supportsContacts: boolean;
};

export interface IExchangeProvider {
	readonly id: ExchangeProviderId;
	readonly capabilities: ExchangeProviderCapabilities;

	/** Must fail closed, and must never fall back to a second endpoint: that would defeat the air-gap guarantee. */
	testConnection(): Promise<void>;

	/**
	 * `cursor` is a delta token from a previous page; omit it for an initial sync.
	 *
	 * `window` is a bound, not a filter. Graph scopes by it, EWS cannot, so a provider may return events
	 * outside it. Safe because ingestion upserts idempotently: a superset costs bandwidth, not correctness.
	 */
	listEvents(mailbox: string, window: DateRange, cursor?: string): Promise<Page<ExchangeEvent>>;

	/** Separate from `listEvents` because the two use different API calls with different permission scopes. */
	getFreeBusy(mailbox: string, window: DateRange): Promise<BusyBlock[]>;

	listContactFolders?(mailbox: string): Promise<ContactFolder[]>;

	/** Folder-scoped: Graph's contact delta token is per folder, and the root-level form is undocumented. */
	listContacts?(mailbox: string, folderId: string, cursor?: string): Promise<Page<ExchangeContact>>;
}
