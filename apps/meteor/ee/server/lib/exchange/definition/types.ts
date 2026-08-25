export type DateRange = {
	start: Date;
	end: Date;
};

export type Page<T> = {
	items: T[];
	/** Opaque: a Graph `deltaLink` or an EWS sync state. Callers store it and hand it back, never parse it. */
	cursor?: string;
	/** More pages ready now. With `false`, the cursor is the resume point for the next run. */
	hasMore: boolean;
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

export type BusyBlock = {
	start: Date;
	end: Date;
};

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
