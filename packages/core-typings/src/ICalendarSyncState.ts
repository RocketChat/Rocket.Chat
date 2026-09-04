import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export type CalendarSyncProviderType = 'microsoft-graph' | 'exchange-ews';

export interface ICalendarSyncStateError {
	code: string;
	message: string;
	at: Date;
}

export interface ICalendarSyncState extends IRocketChatRecord {
	uid: IUser['_id'];
	mailbox: string;
	provider: CalendarSyncProviderType;

	deltaToken?: string;
	/** The window the delta token was established for; drifting past it forces a full resync */
	deltaWindowStart?: Date;
	deltaWindowEnd?: Date;

	lastSyncAt?: Date;
	lastSuccessAt?: Date;
	lastError?: ICalendarSyncStateError;
	consecutiveFailures: number;

	/** Graph change-notification subscription (optional optimization; polling continues regardless) */
	subscriptionId?: string;
	subscriptionExpiresAt?: Date;
	subscriptionClientState?: string;
}
