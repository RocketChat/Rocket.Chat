import type {
	ContactFolder,
	DateRange,
	EventPage,
	ExchangeContact,
	ExchangeContactPhoto,
	Page,
	ExchangeProviderId,
	ExchangeProviderCapabilities,
} from './types';

export interface IExchangeProvider {
	readonly id: ExchangeProviderId;
	readonly capabilities: ExchangeProviderCapabilities;

	testConnection(): Promise<void>;

	/** `timeWindow` bounds the range, `cursor` is an opaque continuation/delta token, omitted for an initial sync. */
	listEvents(mailbox: string, timeWindow: DateRange, cursor?: string): Promise<EventPage>;

	listContactFolders(mailbox: string): Promise<ContactFolder[]>;

	/** Per folder, because both providers scope the contact delta token to one. */
	listContacts(mailbox: string, folderId: string, cursor?: string): Promise<Page<ExchangeContact>>;

	/** Streamed, because a folder's worth of images held at once runs to hundreds of megabytes. */
	getContactPhotos(mailbox: string, externalIds: string[]): AsyncIterable<ExchangeContactPhoto>;
}
