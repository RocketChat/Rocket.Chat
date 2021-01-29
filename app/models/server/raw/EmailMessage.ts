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

	insertOne(data: Omit<IEmailMessage, '_id'>) {
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
			...data,
		});
	}

	async findNextInQueue(): Promise<IEmailMessage | undefined> {
		const now = new Date();

		const result = await this.col.findOneAndUpdate({
			locked: false,
			/* $or: [
				{ locked: false },
				{ lockLimitAt: { $lte: now } },
			 ],*/
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
