import { Base } from './_Base';

export class EmailChannel extends Base {
	constructor() {
		super('email_channels');
	}
}

export default new EmailChannel();
