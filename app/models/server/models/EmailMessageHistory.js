import { Base } from './_Base';

export class EmailMessageHistory extends Base {
	constructor() {
		super('email_message_history');
		this.tryEnsureIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
	}
}

export default new EmailMessageHistory();
