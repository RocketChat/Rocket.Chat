import { UpdateWriteOpResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { INps, NPSStatus } from '../../../../definition/INps';

export class NpsRaw extends BaseRaw<INps> {
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
