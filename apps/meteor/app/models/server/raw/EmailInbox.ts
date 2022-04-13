import type { IEmailInbox } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class EmailInboxRaw extends BaseRaw<IEmailInbox> {
	protected indexes: IndexSpecification[] = [{ key: { email: 1 }, unique: true }];
}
