import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IEmailInbox } from '../../../../definition/IEmailInbox';

export class EmailInboxRaw extends BaseRaw<IEmailInbox> {
	protected indexes: IndexSpecification[] = [{ key: { email: 1 }, unique: true }];
}
