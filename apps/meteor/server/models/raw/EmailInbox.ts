import type { IEmailInbox, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IEmailInboxModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexSpecification } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class EmailInboxRaw extends BaseRaw<IEmailInbox> implements IEmailInboxModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IEmailInbox>>) {
		super(db, getCollectionName('email_inbox'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { email: 1 }, unique: true }];
	}
}
