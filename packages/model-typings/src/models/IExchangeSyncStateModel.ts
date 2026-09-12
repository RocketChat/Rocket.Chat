import type { IExchangeSyncState, IUser } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

/** The fields that, when any of them changes, make a stored cursor unusable. */
export type ExchangeSyncIdentity = Pick<IExchangeSyncState, 'mailbox' | 'provider' | 'syncWindowDays' | 'windowStart'>;

export interface IExchangeSyncStateModel extends IBaseModel<IExchangeSyncState> {
	findOneByUserId(uid: IUser['_id']): Promise<IExchangeSyncState | null>;
	saveCursor(uid: IUser['_id'], identity: ExchangeSyncIdentity, cursor: string | undefined, lastSyncAt: Date): Promise<UpdateResult>;
	setLastError(uid: IUser['_id'], identity: ExchangeSyncIdentity, lastError: string): Promise<UpdateResult>;
	clearCursorByUserId(uid: IUser['_id']): Promise<UpdateResult>;
}
