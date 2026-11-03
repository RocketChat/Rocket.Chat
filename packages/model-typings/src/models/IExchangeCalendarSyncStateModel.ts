import type { IExchangeCalendarSyncState, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

/** What a stored cursor was obtained from, saved alongside it so a later run can tell whether it still applies. */
export type ExchangeCalendarSyncIdentity = Pick<IExchangeCalendarSyncState, 'mailbox' | 'provider' | 'syncWindowDays' | 'windowStart'>;

export interface IExchangeCalendarSyncStateModel extends IBaseModel<IExchangeCalendarSyncState> {
	findOneByUserId(uid: IUser['_id']): Promise<IExchangeCalendarSyncState | null>;
	saveCursor(
		uid: IUser['_id'],
		identity: ExchangeCalendarSyncIdentity,
		cursor: string | undefined,
		lastSyncAt: Date,
	): Promise<UpdateResult>;
	setLastError(uid: IUser['_id'], lastError: string): Promise<UpdateResult>;
	clearCursorByUserId(uid: IUser['_id']): Promise<UpdateResult>;
	acquireSyncLease(uid: IUser['_id'], token: string, until: Date, now: Date): Promise<UpdateResult>;
	releaseSyncLease(uid: IUser['_id'], token: string): Promise<UpdateResult>;
	countActiveSyncLeases(now: Date): Promise<number>;
	findAllUserIds(): Promise<IUser['_id'][]>;
	removeAll(): Promise<DeleteResult>;
}
