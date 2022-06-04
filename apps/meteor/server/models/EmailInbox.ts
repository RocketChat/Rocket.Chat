import { IndexSpecification } from 'mongodb';
import type { IEmailInbox } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class EmailInbox extends ModelClass<IEmailInbox> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { email: 1 }, unique: true }];
	}
}
