/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
	ObjectId,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IEmailMessage } from '../../../../definition/IEmailMessage';

export class EmailMessageRaw extends BaseRaw<IEmailMessage> {
	removeByUid(uid: string) {
		return this.col.deleteOne({ uid });
	}

	insertOrUpdateOne(data: Omit<IEmailMessage, '_id'| 'locked' | 'createdAt' | 'lockLimitAt'>) {
		const now = new Date();

		const { uid, ...email } = data;
		const query = { uid };

		const update = {
			$set: email,
			$setOnInsert: {
				_id: new ObjectId().toHexString(),
				locked: false,
				createdAt: now,
				lockLimitAt: new Date(now.getTime() + 60000),
			},
		};
		const options = { upsert: true };

		return this.col.updateOne(
			query,
			update,
			options,
		);
	}

	async findNextInQueue(): Promise<IEmailMessage | undefined> {
		const now = new Date();

		const result = await this.col.findOneAndUpdate({
			$or: [
				{ locked: false },
				{ lockLimitAt: { $lte: now } },
			],
		}, {
			$set: {
				locked: true,
				lockLimitAt: new Date(now.getTime() + 60000),
			},
		}, {
			sort: {
				createdAt: 1,
			},
		});

		return result.value;
	}
}
