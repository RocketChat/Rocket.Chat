import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

/**
 * One row per user and contact folder, because both providers scope the contact delta token to a folder.
 * Kept apart from `IExchangeSyncState`, which is one row per user for the calendar.
 */
export interface IExchangeContactSyncState extends IRocketChatRecord {
	uid: IUser['_id'];
	folderId: string;
	mailbox: string;
	provider: 'graph' | 'ews';
	cursor?: string;
	lastSyncAt?: Date;
	lastError?: string;
	lastErrorAt?: Date;
}
