import type { IOmnichannelQueueStatus, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOmnichannelQueueModel } from '@rocket.chat/model-typings';
import type { Collection, Db } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

const UNIQUE_QUEUE_ID = 'queue';
export class OmnichannelQueueRaw extends BaseRaw<IOmnichannelQueueStatus> implements IOmnichannelQueueModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOmnichannelQueueStatus>>) {
		super(db, getCollectionName('omnichannel_queue'), trash);
	}

	initQueue(): any {
		return this.col.updateOne(
			{
				_id: UNIQUE_QUEUE_ID,
			},
			{
				$unset: {
					stoppedAt: 1,
				},
				$set: {
					startedAt: new Date(),
					locked: false,
				},
			},
			{
				upsert: true,
			},
		);
	}

	stopQueue(): any {
		return this.col.updateOne(
			{
				_id: UNIQUE_QUEUE_ID,
			},
			{
				$set: {
					stoppedAt: new Date(),
					locked: false,
				},
			},
		);
	}

	async lockQueue(): Promise<any> {
		const date = new Date();
		const result = await this.col.findOneAndUpdate(
			{
				_id: UNIQUE_QUEUE_ID,
				$or: [
					{
						locked: true,
						lockedAt: {
							$lte: new Date(date.getTime() - 5000),
						},
					},
					{
						locked: false,
					},
				],
			},
			{
				$set: {
					locked: true,
					// apply 5 secs lock lifetime
					lockedAt: new Date(),
				},
			},
			{
				sort: {
					_id: 1,
				},
			},
		);

		return result.value;
	}

	async unlockQueue(): Promise<any> {
		const result = await this.col.findOneAndUpdate(
			{
				_id: UNIQUE_QUEUE_ID,
			},
			{
				$set: {
					locked: false,
				},
				$unset: {
					lockedAt: 1,
				},
			},
			{
				sort: {
					_id: 1,
				},
			},
		);

		return result.value;
	}
}
