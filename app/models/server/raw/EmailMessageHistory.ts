/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
	ObjectId,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IEmailMessageHistory } from '../../../../definition/IEmailMessageHistory';

export class EmailMessageHistoryRaw extends BaseRaw<IEmailMessageHistory> {
	insertOne({ uid }: Omit<IEmailMessageHistory, '_id' | 'createdAt' >) {
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
			uid,
			createdAt: new Date(),
		});
	}
}
