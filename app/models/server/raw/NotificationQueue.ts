/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
	Collection,
	ObjectId,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { INotification } from '../../../../definition/INotification';

export class NotificationQueueRaw extends BaseRaw {
	public readonly col!: Collection<INotification>;

	unsetSendingById(_id: string) {
		return this.col.updateOne({ _id }, {
			$unset: {
				sending: 1,
			},
		});
	}

	removeById(_id: string) {
		return this.col.deleteOne({ _id });
	}

	clearScheduleByUserId(uid: string) {
		return this.col.updateMany({
			uid,
			schedule: { $exists: true },
		}, {
			$unset: {
				schedule: 1,
			},
		});
	}

	async clearQueueByUserId(uid: string): Promise<number | undefined> {
		const op = await this.col.deleteMany({
			uid,
		});

		return op.deletedCount;
	}

	async findNextInQueueOrExpired(expired: Date): Promise<INotification | undefined> {
		const now = new Date();

		const result = await this.col.findOneAndUpdate({
			$and: [{
				$or: [
					{ sending: { $exists: false } },
					{ sending: { $lte: expired } },
				],
			}, {
				$or: [
					{ schedule: { $exists: false } },
					{ schedule: { $lte: now } },
				],
			}],
		}, {
			$set: {
				sending: now,
			},
		}, {
			sort: {
				ts: 1,
			},
		});

		return result.value;
	}

	insertOne(data: Omit<INotification, '_id'>) {
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
			...data,
		});
	}
}
