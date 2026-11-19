import type { IExchangeSyncLease, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IExchangeSyncLeaseModel extends IBaseModel<IExchangeSyncLease> {
	acquireLease(scope: IExchangeSyncLease['scope'], uid: IUser['_id'], token: string, until: Date, now: Date): Promise<UpdateResult>;
	renewLease(scope: IExchangeSyncLease['scope'], uid: IUser['_id'], token: string, until: Date): Promise<UpdateResult>;
	releaseLease(scope: IExchangeSyncLease['scope'], uid: IUser['_id'], token: string): Promise<DeleteResult>;
	countActiveLeases(scope: IExchangeSyncLease['scope'], now: Date): Promise<number>;
}
