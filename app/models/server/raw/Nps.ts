import { UpdateWriteOpResult, Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { INps, NPSStatus } from '../../../../definition/INps';

type T = INps;
export class NpsRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndexes([
			{ key: { expireAt: 1, status: 1 } },
		]);
	}

	// get expired surveys still in progress
	async getOpenExpiredAndStartSending(): Promise<INps | undefined> {
		const today = new Date();

		const query = {
			expireAt: { $lte: today },
			status: NPSStatus.OPEN,
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
			expireAt: { $lte: today },
			status: NPSStatus.SENDING,
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

	save({ _id, startAt, expireAt, createdBy, status }: Pick<INps, '_id' | 'startAt' | 'expireAt' | 'createdBy' | 'status'>): Promise<UpdateWriteOpResult> {
		return this.col.updateOne({
			_id,
		}, {
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
		}, {
			upsert: true,
		});
	}
}
