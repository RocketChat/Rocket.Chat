import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IExchangeSyncState extends IRocketChatRecord {
	uid: IUser['_id'];
	mailbox: string;
	provider: 'graph' | 'ews';
	/** The window the cursor was created with. Graph bakes it into the delta link. */
	syncWindowDays: number;
	/** The anchored start the cursor was created with, the other half of the baked-in window. */
	windowStart: Date;
	cursor?: string;
	lastSyncAt?: Date;
	lastError?: string;
	lastErrorAt?: Date;
}
