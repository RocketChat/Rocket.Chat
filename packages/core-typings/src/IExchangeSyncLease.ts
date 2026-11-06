import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

/** A sync of one user's mailbox running on some instance, which every other instance leaves alone until `until` */
export interface IExchangeSyncLease extends IRocketChatRecord {
	uid: IUser['_id'];
	scope: 'calendar' | 'contacts';
	token: string;
	until: Date;
}
