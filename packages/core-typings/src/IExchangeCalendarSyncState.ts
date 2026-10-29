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
}
