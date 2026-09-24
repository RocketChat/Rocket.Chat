export type ExchangeProviderId = 'graph' | 'ews';

export type ExchangeProviderCapabilities = {
	supportsWebhooks: boolean;
};

export type DateRange = {
	start: Date;
	end: Date;
};

export type Page<T> = {
	items: T[];
	/** A Graph `deltaLink` or an EWS sync state. */
	cursor?: string;
	hasMore: boolean;
	/**
	 * How much of the window `items` covers. `full` is everything in it, so whatever is stored inside that
	 * window and absent from it has been removed. `delta` is only what changed, deletions included.
	 * `partial` is a `full` the provider could not finish, which is never safe to reconcile against.
	 */
	coverage: 'full' | 'delta' | 'partial';
};

export type ExchangeEventDeletion = {
	kind: 'deleted';
	externalId: string;
};

export type ExchangeEventUpsert = {
	kind: 'upsert';
	externalId: string;
	subject: string;
	description: string;
	startTime: Date;
	endTime?: Date;
	isCancelled: boolean;
	busy: boolean;
	meetingUrl?: string;
	reminderMinutesBeforeStart?: number;
};

export type ExchangeEvent = ExchangeEventUpsert | ExchangeEventDeletion;

export type ExchangeContactPhone = {
	/** As it came from Exchange, kept for display and audit. */
	raw: string;
	/** E.164 normalized, the reverse-lookup key. Absent when `raw` could not be parsed. */
	e164?: string;
	label?: string;
};

export type ExchangeContactEmail = {
	address: string;
	label?: string;
};

export type ExchangeContactUpsert = {
	kind: 'upsert';
	externalId: string;
	folderId: string;
	displayName: string;
	givenName?: string;
	surname?: string;
	companyName?: string;
	emails: ExchangeContactEmail[];
	phones: ExchangeContactPhone[];
};

export type ExchangeContactDeletion = {
	kind: 'deleted';
	externalId: string;
	folderId: string;
};

export type ExchangeContact = ExchangeContactUpsert | ExchangeContactDeletion;

export type ContactFolder = {
	id: string;
	displayName: string;
};
