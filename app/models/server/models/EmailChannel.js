import { Base } from './_Base';

export class EmailChannel extends Base {
	constructor() {
		super('email_channels');
	}

	// FIND ONE
	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
}

export default new EmailChannel();
