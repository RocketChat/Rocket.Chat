import { IndexSpecification } from 'mongodb';
import type { IEmailInbox } from '@rocket.chat/core-typings';
import type { IEmailInboxModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class EmailInbox extends ModelClass<IEmailInbox> implements IEmailInboxModel {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { email: 1 }, unique: true }];
	}
}

const col = db.collection(`${prefix}email_inbox`);
registerModel('IEmailInboxModel', new EmailInbox(col, trashCollection) as IEmailInboxModel);
