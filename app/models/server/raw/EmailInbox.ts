import { BaseRaw } from './BaseRaw';
import { IEmailInbox } from '../../../../definition/IEmailInbox';

export class EmailInboxRaw extends BaseRaw<IEmailInbox> {
	protected modelIndexes() {
		return [{ key: { email: 1 }, unique: true }];
	}
}
