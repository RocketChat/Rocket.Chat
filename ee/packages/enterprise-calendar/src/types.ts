export type CalendarProviderType = 'microsoft-graph' | 'exchange-ews';

export type CalendarAvailability = 'free' | 'workingElsewhere' | 'tentative' | 'busy' | 'outOfOffice' | 'unknown';

export type MicrosoftCloud = 'global' | 'us-gov' | 'us-gov-dod' | 'china';

export type CalendarMailboxIdentity = {
	provider: CalendarProviderType;
	address: string;
	externalUserId?: string;
	tenantId?: string;
};

export type CalendarUserIdentity = {
	userId: string;
	active: boolean;
	trustedUpn?: string;
	verifiedEmails: string[];
	providerHint?: CalendarProviderType;
};

export type NormalizedCalendarEvent = {
	externalId: string;
	mailbox: CalendarMailboxIdentity;
	start: Date;
	end: Date;
	availability: CalendarAvailability;
	isCancelled: boolean;
	isAllDay: boolean;
	isPrivate: boolean;
	lastModifiedAt?: Date;
	changeKey?: string;
};

export type CalendarSyncCursor = {
	value: string;
	windowStart: Date;
	windowEnd: Date;
	expiresAt?: Date;
};

export type CalendarSyncResult = {
	events: NormalizedCalendarEvent[];
	deletedExternalIds: string[];
	nextCursor?: CalendarSyncCursor;
	requiresFullResync?: boolean;
};

export type CalendarSubscription = {
	id: string;
	mailbox: CalendarMailboxIdentity;
	expiresAt: Date;
	clientStateHash: string;
};

export type CalendarConfigurationValidation = {
	valid: boolean;
	code?: string;
	message?: string;
};

export interface IEnterpriseCalendarProvider {
	readonly type: CalendarProviderType;
	validateConfiguration(testMailbox?: CalendarMailboxIdentity): Promise<CalendarConfigurationValidation>;
	resolveMailbox(user: CalendarUserIdentity): Promise<CalendarMailboxIdentity | null>;
	getCalendarWindow(mailbox: CalendarMailboxIdentity, start: Date, end: Date): Promise<NormalizedCalendarEvent[]>;
	synchronizeChanges(mailbox: CalendarMailboxIdentity, cursor: CalendarSyncCursor): Promise<CalendarSyncResult>;
	createOrRenewSubscription?(mailbox: CalendarMailboxIdentity, existingSubscription?: CalendarSubscription): Promise<CalendarSubscription>;
	removeSubscription?(subscription: CalendarSubscription): Promise<void>;
}

export type GraphCredential =
	| { type: 'client-secret'; clientSecret: string }
	| { type: 'certificate'; certificate: string; privateKey: string };

export type GraphProviderConfiguration = {
	cloud: MicrosoftCloud;
	tenantId: string;
	clientId: string;
	credential: GraphCredential;
	webhookUrl?: string;
	webhookClientState?: string;
	requestTimeoutMs?: number;
};

export type EwsAuthentication =
	| { type: 'negotiate'; servicePrincipal?: string }
	| { type: 'ntlm'; domain: string; username: string; password: string }
	| { type: 'basic'; username: string; password: string; explicitlyAllowed: true };

export type EwsProviderConfiguration = {
	endpoint: string;
	authentication: EwsAuthentication;
	impersonation: true;
	exchangeVersion: 'Exchange2016' | 'Exchange2019' | 'ExchangeSE';
	customCa?: string;
};

export type HttpRequest = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	headers?: Record<string, string>;
	body?: string;
	timeoutMs?: number;
};

export type HttpResponse = {
	status: number;
	headers: { get(name: string): string | null };
	text(): Promise<string>;
};

export type HttpClient = (url: string, request: HttpRequest) => Promise<HttpResponse>;

export type CalendarProjection = {
	userId: string;
	provider: CalendarProviderType;
	mailboxHash: string;
	eventHash: string;
	start: Date;
	end: Date;
	availability: CalendarAvailability;
	isAllDay: boolean;
	isPrivate: boolean;
	lastModifiedAt?: Date;
};

export type CalendarSyncState = {
	userId: string;
	mailbox: CalendarMailboxIdentity;
	cursor?: CalendarSyncCursor;
	lastAttemptAt?: Date;
	lastSuccessAt?: Date;
	lastErrorCategory?: string;
	retryCount: number;
	backoffUntil?: Date;
	fullResyncRequired: boolean;
};

export interface ICalendarProjectionStore {
	upsert(events: CalendarProjection[]): Promise<void>;
	remove(userId: string, provider: CalendarProviderType, eventHashes: string[]): Promise<void>;
	replaceWindow(
		userId: string,
		provider: CalendarProviderType,
		windowStart: Date,
		windowEnd: Date,
		events: CalendarProjection[],
	): Promise<void>;
	findActive(userId: string, at: Date): Promise<CalendarProjection[]>;
	removeExpired(before: Date): Promise<number>;
}

export interface ICalendarSyncStateStore {
	get(userId: string): Promise<CalendarSyncState | null>;
	save(state: CalendarSyncState): Promise<void>;
}

export interface ICalendarPresenceAdapter {
	apply(userId: string, status: 'busy' | 'away', expiresAt: Date): Promise<void>;
	clear(userId: string): Promise<void>;
}
