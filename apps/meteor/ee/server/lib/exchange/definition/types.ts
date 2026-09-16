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
	 * True when `items` is the complete set for whatever scope was asked about, so anything stored in that
	 * scope and absent from it has been removed. The scope is the time window for events and the folder for
	 * contacts. False when `items` carries only what changed, deletions included.
	 */
	isCompleteSnapshot: boolean;
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
};

export type ExchangeContactUpsert = {
	kind: 'upsert';
	externalId: string;
	folderId: string;
	displayName: string;
	givenName?: string;
	surname?: string;
	companyName?: string;
	officeLocation?: string;
	emails: ExchangeContactEmail[];
	phones: ExchangeContactPhone[];
	categories: string[];
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
