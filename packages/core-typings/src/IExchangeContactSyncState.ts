import type { IRocketChatRecord } from './IRocketChatRecord.js';
import type { IUser } from './IUser.js';

/**
 * One row per user and contact folder, because both providers scope the contact delta token to a folder.
 */
export interface IExchangeContactSyncState extends IRocketChatRecord {
	uid: IUser['_id'];
	folderId: string;
	mailbox: string;
	provider: 'graph' | 'ews';
	cursor?: string;
	lastSyncAt?: Date;
	/** Absent until a run fetches the folder's photos, which is what makes turning the setting on ask for all of them */
	avatarsSyncedAt?: Date;
	lastError?: string;
	lastErrorAt?: Date;
}
