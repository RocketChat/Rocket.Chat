/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BaseRaw } from './BaseRaw';
import { IOmnichannelQueueStatus } from '../../../../definition/IOmnichannel';

const UNIQUE_QUEUE_ID = 'queue';
export class OmnichannelQueueRaw extends BaseRaw<IOmnichannelQueueStatus> {
	initQueue() {
		return this.col.updateOne({
			_id: UNIQUE_QUEUE_ID,
		}, {
			$unset: {
				stoppedAt: 1,
			},
			$set: {
				startedAt: new Date(),
				locked: false,
			},
		}, {
			upsert: true,
		});
	}

	stopQueue() {
		return this.col.updateOne({
			_id: UNIQUE_QUEUE_ID,
		}, {
			$set: {
				stoppedAt: new Date(),
				locked: false,
			},
		});
	}

	async lockQueue() {
		const date = new Date();
		const result = await this.col.findOneAndUpdate({
			_id: UNIQUE_QUEUE_ID,
			$or: [{
				locked: true,
				lockedUntil: {
					$lte: date,
				},
			}, {
				locked: false,
			}],
		}, {
			$set: {
				locked: true,
				// apply 5 secs lock lifetime
				lockedUntil: new Date(date.getTime() + 5000),
			},
		}, {
			sort: {
				_id: 1,
			},
		});

		return result.value;
	}

	async unlockQueue() {
		const result = await this.col.findOneAndUpdate({
			_id: UNIQUE_QUEUE_ID,
		}, {
			$set: {
				locked: false,
			},
			$unset: {
				lockedUntil: 1,
			},
		}, {
			sort: {
				_id: 1,
			},
		});

		return result.value;
	}
}
