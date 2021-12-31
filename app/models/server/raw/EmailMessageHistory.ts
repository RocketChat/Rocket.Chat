import { IndexSpecification, InsertOneWriteOpResult, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IEmailMessageHistory as T } from '../../../../definition/IEmailMessageHistory';

export class EmailMessageHistoryRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [{ key: { createdAt: 1 }, expireAfterSeconds: 60 * 60 * 24 }];

	async create({ _id, email }: T): Promise<InsertOneWriteOpResult<WithId<T>>> {
		return this.insertOne({
			_id,
			email,
			createdAt: new Date(),
		});
	}
}
