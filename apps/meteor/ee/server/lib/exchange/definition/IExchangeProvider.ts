import type {
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
	 * `timeWindow` bounds the range, and is what EWS expands a changed recurring series over.
	 * `cursor` is an opaque delta token, omitted for an initial sync.
	 */
	listEvents(mailbox: string, timeWindow: DateRange, cursor?: string): Promise<Page<ExchangeEvent>>;

	listContactFolders?(mailbox: string): Promise<ContactFolder[]>;

	/** Per folder, because both providers scope the contact delta token to one. */
	listContacts?(mailbox: string, folderId: string, cursor?: string): Promise<Page<ExchangeContact>>;
}
