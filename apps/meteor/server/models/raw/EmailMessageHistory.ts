import type { IEmailMessageHistory, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IEmailMessageHistoryModel } from '@rocket.chat/model-typings';
import type { Collection, Db, InsertOneResult, WithId, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class EmailMessageHistoryRaw extends BaseRaw<IEmailMessageHistory> implements IEmailMessageHistoryModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IEmailMessageHistory>>) {
		super(db, 'email_message_history', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { createdAt: 1 }, expireAfterSeconds: 60 * 60 * 24 }];
	}

	async create({ _id, email }: IEmailMessageHistory): Promise<InsertOneResult<WithId<IEmailMessageHistory>>> {
		return this.insertOne({
			_id,
			email,
			createdAt: new Date(),
		});
	}
}
