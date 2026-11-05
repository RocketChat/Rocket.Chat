import type { IRocketChatRecord } from './IRocketChatRecord.js';
import type { IUser } from './IUser.js';

/** A sync of one user's mailbox running on some instance, which every other instance leaves alone until `until` */
export interface IExchangeSyncLease extends IRocketChatRecord {
	uid: IUser['_id'];
	scope: 'calendar';
	token: string;
	until: Date;
}
