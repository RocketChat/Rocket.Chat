import type { IEmailInbox, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IEmailInboxModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindCursor, IndexDescription, InsertOneResult, UpdateFilter, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class EmailInboxRaw extends BaseRaw<IEmailInbox> implements IEmailInboxModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IEmailInbox>>) {
		super(db, 'email_inbox', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { email: 1 }, unique: true }];
	}

	async setDisabledById(id: IEmailInbox['_id']): Promise<null | WithId<IEmailInbox>> {
		return this.findOneAndUpdate({ _id: id, active: true }, { $set: { active: false } }, { returnDocument: 'after' });
	}

	async create(emailInbox: IEmailInbox): Promise<InsertOneResult<IEmailInbox>> {
		return this.insertOne(emailInbox);
	}

	async updateById(id: IEmailInbox['_id'], data: UpdateFilter<IEmailInbox>): Promise<null | WithId<Pick<IEmailInbox, '_id'>>> {
		// findOneAndUpdate doesn't accept generics, so we had to type cast
		return this.findOneAndUpdate({ _id: id }, data, {
			returnDocument: 'after',
			projection: { _id: 1 },
		}) as unknown as Promise<null | WithId<Pick<IEmailInbox, '_id'>>>;
	}

	findActive(): FindCursor<IEmailInbox> {
		return this.find({ active: true });
	}

	async findByEmail(email: IEmailInbox['email']): Promise<IEmailInbox | null> {
		return this.findOne({ email });
	}
}
