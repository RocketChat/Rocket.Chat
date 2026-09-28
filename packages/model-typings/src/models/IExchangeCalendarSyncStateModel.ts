import type { IExchangeCalendarSyncState, IUser } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

/** The fields that, when any of them changes, make a stored cursor unusable. */
export type ExchangeCalendarSyncIdentity = Pick<IExchangeCalendarSyncState, 'mailbox' | 'provider' | 'syncWindowDays' | 'windowStart'>;

export interface IExchangeCalendarSyncStateModel extends IBaseModel<IExchangeCalendarSyncState> {
	findOneByUserId(uid: IUser['_id']): Promise<IExchangeCalendarSyncState | null>;
	saveCursor(
		uid: IUser['_id'],
		identity: ExchangeCalendarSyncIdentity,
		cursor: string | undefined,
		lastSyncAt: Date,
	): Promise<UpdateResult>;
	setLastError(uid: IUser['_id'], identity: ExchangeCalendarSyncIdentity, lastError: string): Promise<UpdateResult>;
	clearCursorByUserId(uid: IUser['_id']): Promise<UpdateResult>;
}
