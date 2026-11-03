import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IExchangeCalendarSyncState extends IRocketChatRecord {
	uid: IUser['_id'];
	/** Absent until a sync of this user first completes, since taking the lease is what creates the document */
	mailbox?: string;
	provider?: 'graph' | 'ews';
	syncWindowDays?: number;
	windowStart?: Date;
	cursor?: string;
	lastSyncAt?: Date;
	lastError?: string;
	lastErrorAt?: Date;
	/** The sync holding this user's calendar on some instance, until `syncLeaseUntil` */
	syncLeaseToken?: string;
	syncLeaseUntil?: Date;
}
