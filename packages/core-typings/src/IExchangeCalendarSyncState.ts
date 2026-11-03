import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IExchangeCalendarSyncState extends IRocketChatRecord {
	uid: IUser['_id'];
	mailbox: string;
	provider: 'graph' | 'ews';
	syncWindowDays: number;
	windowStart: Date;
	cursor?: string;
	lastSyncAt?: Date;
	lastError?: string;
	lastErrorAt?: Date;
	/** The sync holding this user's calendar on some instance, until `syncLeaseUntil` */
	syncLeaseToken?: string;
	syncLeaseUntil?: Date;
}
