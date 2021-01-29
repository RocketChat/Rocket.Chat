import { Base } from './_Base';

export class EmailMessage extends Base {
	constructor() {
		super('email_message');
		this.tryEnsureIndex({ uid: 1 }, { unique: true });
		this.tryEnsureIndex({ locked: 1 });
		this.tryEnsureIndex({ lockLimitAt: 1 });
	}
}

export default new EmailMessage();
