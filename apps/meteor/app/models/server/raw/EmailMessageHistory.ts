import { InsertOneWriteOpResult, WithId } from 'mongodb';
import { IEmailMessageHistory as T } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class EmailMessageHistoryRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { createdAt: 1 }, expireAfterSeconds: 60 * 60 * 24 }];
	}

	async create({ _id, email }: T): Promise<InsertOneWriteOpResult<WithId<T>>> {
		return this.insertOne({
			_id,
			email,
			createdAt: new Date(),
		});
	}
}
