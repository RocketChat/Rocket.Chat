import type { IExchangeCalendarSyncState, IUser } from '@rocket.chat/core-typings';
import type { ExchangeCalendarSyncIdentity, IExchangeCalendarSyncStateModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ExchangeCalendarSyncStateRaw extends BaseRaw<IExchangeCalendarSyncState> implements IExchangeCalendarSyncStateModel {
	constructor(db: Db) {
		super(db, 'exchange_calendar_sync_state');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1 }, unique: true }];
	}

	public async findOneByUserId(uid: IUser['_id']): Promise<IExchangeCalendarSyncState | null> {
		return this.findOne({ uid });
	}

	public async saveCursor(
		uid: IUser['_id'],
		identity: ExchangeCalendarSyncIdentity,
		cursor: string | undefined,
		lastSyncAt: Date,
	): Promise<UpdateResult> {
		return this.updateOne(
			{ uid },
			{
				$set: { ...identity, lastSyncAt, ...(cursor ? { cursor } : {}) },
				$unset: { lastError: 1, lastErrorAt: 1, ...(cursor ? {} : { cursor: 1 }) },
			},
			{ upsert: true },
		);
	}

	public async setLastError(uid: IUser['_id'], identity: ExchangeCalendarSyncIdentity, lastError: string): Promise<UpdateResult> {
		return this.updateOne({ uid }, { $set: { ...identity, lastError, lastErrorAt: new Date() } }, { upsert: true });
	}

	public async clearCursorByUserId(uid: IUser['_id']): Promise<UpdateResult> {
		return this.updateOne({ uid }, { $unset: { cursor: 1 } });
	}
}
