import type {
	BusyBlock,
	ContactFolder,
	DateRange,
	ExchangeContact,
	ExchangeEvent,
	Page,
	ExchangeProviderId,
	ExchangeProviderCapabilities,
} from './types';

export interface IExchangeProvider {
	readonly id: ExchangeProviderId;
	readonly capabilities: ExchangeProviderCapabilities;

	/** Fails closed, and never falls back to another endpoint: that would break the air gap. */
	testConnection(): Promise<void>;

	/**
	 * `window` is a bound, not a filter: EWS syncs a folder, not a range, so expect a superset.
	 * `cursor` is an opaque delta token, omitted for an initial sync.
	 */
	listEvents(mailbox: string, window: DateRange, cursor?: string): Promise<Page<ExchangeEvent>>;

	/** Times only, no subjects (privacy). For workspaces that want busy status without storing event content. */
	getFreeBusy(mailbox: string, window: DateRange): Promise<BusyBlock[]>;

	listContactFolders?(mailbox: string): Promise<ContactFolder[]>;

	/** Per folder, because both providers scope the contact delta token to one. */
	listContacts?(mailbox: string, folderId: string, cursor?: string): Promise<Page<ExchangeContact>>;
}
