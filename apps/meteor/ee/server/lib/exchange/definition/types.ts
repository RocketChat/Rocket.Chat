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
	 * How much of the scope `items` covers, the scope being the time window for events and the folder for
	 * contacts. `full` is everything in it, so whatever is stored and absent from it has been removed.
	 * `delta` is only what changed, deletions included. `partial` is a `full` the provider could not finish,
	 * which is never safe to reconcile against.
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
	seriesMasterId?: string;
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

/**
 * Graph reports a recurring series as a whole: any change to it resends the master together with the
 * occurrences that survive, and never a deletion for the ones that went. `resyncedSeries` names the series
 * whose expansion this page carries in full, so whatever is stored for them and missing from it is gone.
 */
export type EventPage = Page<ExchangeEvent> & { resyncedSeries?: string[] };

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
