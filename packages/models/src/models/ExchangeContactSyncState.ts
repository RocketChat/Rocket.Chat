import type { IExchangeContactSyncState, IUser } from '@rocket.chat/core-typings';
import type { ExchangeContactSyncIdentity, IExchangeContactSyncStateModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ExchangeContactSyncStateRaw extends BaseRaw<IExchangeContactSyncState> implements IExchangeContactSyncStateModel {
	constructor(db: Db) {
		super(db, 'exchange_contact_sync_state');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, folderId: 1 }, unique: true }];
	}

	public async findOneByUserIdAndFolder(uid: IUser['_id'], folderId: string): Promise<IExchangeContactSyncState | null> {
		return this.findOne({ uid, folderId });
	}

	public async findFolderIdsByUserId(uid: IUser['_id']): Promise<string[]> {
		const states = await this.find({ uid }, { projection: { folderId: 1 } }).toArray();

		return states.map(({ folderId }) => folderId);
	}

	public async hasFolderSyncedSince(uid: IUser['_id'], since: Date): Promise<boolean> {
		return Boolean(await this.findOne({ uid, lastSyncAt: { $gte: since } }));
	}

	public async saveCursor(
		uid: IUser['_id'],
		folderId: string,
		identity: ExchangeContactSyncIdentity,
		cursor: string | undefined,
		lastSyncAt: Date,
	): Promise<UpdateResult> {
		return this.updateOne(
			{ uid, folderId },
			{
				$set: { ...identity, lastSyncAt, ...(cursor ? { cursor } : {}) },
				$unset: { lastError: 1, lastErrorAt: 1, ...(cursor ? {} : { cursor: 1 }) },
			},
			{ upsert: true },
		);
	}

	public async setLastError(
		uid: IUser['_id'],
		folderId: string,
		identity: ExchangeContactSyncIdentity,
		lastError: string,
	): Promise<UpdateResult> {
		return this.updateOne({ uid, folderId }, { $set: { ...identity, lastError, lastErrorAt: new Date() } }, { upsert: true });
	}

	public async clearCursor(uid: IUser['_id'], folderId: string): Promise<UpdateResult> {
		return this.updateOne({ uid, folderId }, { $unset: { cursor: 1 } });
	}

	public deleteByUserIdAndFolders(uid: IUser['_id'], folderIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ uid, folderId: { $in: folderIds } });
	}
}
