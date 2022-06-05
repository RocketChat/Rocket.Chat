import { IndexSpecification } from 'mongodb';
import type { IEmailInbox } from '@rocket.chat/core-typings';
import type { IEmailInboxModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class EmailInboxRaw extends BaseRaw<IEmailInbox> implements IEmailInboxModel {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { email: 1 }, unique: true }];
	}
}
