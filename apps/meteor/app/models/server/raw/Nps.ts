import { UpdateWriteOpResult } from 'mongodb';
import { INps, NPSStatus } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

type T = INps;
export class NpsRaw extends BaseRaw<T> {
	modelIndexes(): IndexSpecification[] {
		return [{ key: { status: 1, expireAt: 1 } }];
	}

	// get expired surveys still in progress
	async getOpenExpiredAndStartSending(): Promise<INps | undefined> {
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

	updateStatusById(_id: INps['_id'], status: INps['status']): Promise<UpdateWriteOpResult> {
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
	}: Pick<INps, '_id' | 'startAt' | 'expireAt' | 'createdBy' | 'status'>): Promise<UpdateWriteOpResult> {
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

	closeAllByStatus(status: NPSStatus): Promise<UpdateWriteOpResult> {
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
