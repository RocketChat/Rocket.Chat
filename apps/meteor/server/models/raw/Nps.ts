import type { INps, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { INpsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, Document, IndexDescription, UpdateResult } from 'mongodb';
import { NPSStatus } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class NpsRaw extends BaseRaw<INps> implements INpsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<INps>>) {
		super(db, 'nps', trash);
	}

	modelIndexes(): IndexDescription[] {
		return [{ key: { status: 1, expireAt: 1 } }];
	}

	// get expired surveys still in progress
	async getOpenExpiredAndStartSending(): Promise<INps | null> {
		const today = new Date();

		const query = {
			status: NPSStatus.OPEN,
			expireAt: { $lte: today },
		};
		const update = {
			$set: {
				status: NPSStatus.SENDING,
			},
		};
		const { value } = await this.col.findOneAndUpdate(query, update, { sort: { expireAt: 1 } });

		return value;
	}

	// get expired surveys already sending results
	async getOpenExpiredAlreadySending(): Promise<INps | null> {
		const today = new Date();

		const query = {
			status: NPSStatus.SENDING,
			expireAt: { $lte: today },
		};

		return this.col.findOne(query);
	}

	updateStatusById(_id: INps['_id'], status: INps['status']): Promise<UpdateResult> {
		const update = {
			$set: {
				status,
			},
		};
		return this.col.updateOne({ _id }, update);
	}

	save({
		_id,
		startAt,
		expireAt,
		createdBy,
		status,
	}: Pick<INps, '_id' | 'startAt' | 'expireAt' | 'createdBy' | 'status'>): Promise<UpdateResult> {
		return this.col.updateOne(
			{
				_id,
			},
			{
				$set: {
					startAt,
					_updatedAt: new Date(),
				},
				$setOnInsert: {
					expireAt,
					createdBy,
					createdAt: new Date(),
					status,
				},
			},
			{
				upsert: true,
			},
		);
	}

	closeAllByStatus(status: NPSStatus): Promise<UpdateResult | Document> {
		const query = {
			status,
		};

		const update = {
			$set: {
				status: NPSStatus.CLOSED,
			},
		};

		return this.col.updateMany(query, update);
	}
}
