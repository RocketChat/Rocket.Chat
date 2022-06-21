/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { IOmnichannelQueueStatus } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

const UNIQUE_QUEUE_ID = 'queue';
export class OmnichannelQueueRaw extends BaseRaw<IOmnichannelQueueStatus> {
	initQueue() {
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

	stopQueue() {
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

	async lockQueue() {
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

	async unlockQueue() {
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
