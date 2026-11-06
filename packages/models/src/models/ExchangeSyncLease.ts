import type { IExchangeSyncLease, IUser } from '@rocket.chat/core-typings';
import type { IExchangeSyncLeaseModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ExchangeSyncLeaseRaw extends BaseRaw<IExchangeSyncLease> implements IExchangeSyncLeaseModel {
	constructor(db: Db) {
		super(db, 'exchange_sync_lease');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, scope: 1 }, unique: true }];
	}

	public async acquireLease(
		scope: IExchangeSyncLease['scope'],
		uid: IUser['_id'],
		token: string,
		until: Date,
		now: Date,
	): Promise<UpdateResult> {
		return this.updateOne({ uid, scope, until: { $lte: now } }, { $set: { token, until } }, { upsert: true });
	}

	public async renewLease(scope: IExchangeSyncLease['scope'], uid: IUser['_id'], token: string, until: Date): Promise<UpdateResult> {
		return this.updateOne({ uid, scope, token }, { $set: { until } });
	}

	public async releaseLease(scope: IExchangeSyncLease['scope'], uid: IUser['_id'], token: string): Promise<DeleteResult> {
		return this.deleteOne({ uid, scope, token });
	}

	public countActiveLeases(scope: IExchangeSyncLease['scope'], now: Date): Promise<number> {
		return this.countDocuments({ scope, until: { $gt: now } });
	}
}
