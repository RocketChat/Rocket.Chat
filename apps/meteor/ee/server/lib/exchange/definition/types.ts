export type ExchangeProviderId = 'graph' | 'ews';

export type ExchangeProviderCapabilities = {
	/** True for both: Graph has `deltaLink`, EWS has `SyncFolderItems`. */
	supportsDelta: boolean;
	supportsWebhooks: boolean;
	supportsContacts: boolean;
	/**
	 * True when the cursor answers about one time window, so it stops being valid once the window moves. A
	 * Graph delta link bakes the window into itself; an EWS sync state is scoped to the folder and outlives
	 * any window, so it must persist across days.
	 */
	cursorIsWindowScoped: boolean;
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
	 * True when `items` is the complete set for the window, so anything stored inside that window and
	 * absent from it has been removed. False when `items` carries only what changed, deletions included.
	 */
	isCompleteForWindow: boolean;
};

export type ExchangeEventDeletion = {
	kind: 'deleted';
	externalId: string;
};

export type ExchangeEventUpsert = {
	kind: 'upsert';
	externalId: string;
	iCalUId?: string;
	subject: string;
	description: string;
	startTime: Date;
	endTime?: Date;
	isAllDay: boolean;
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
