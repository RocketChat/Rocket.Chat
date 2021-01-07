import { Base } from './_Base';

export class EmailChannel extends Base {
	constructor() {
		super('email_channels');

		this.tryEnsureIndex({ email: 1 }, { unique: true });
	}

	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	create(data) {
		return this.insert(data);
	}

	updateById(_id, data) {
		return this.update({ _id }, data);
	}

	removeById(_id) {
		return this.remove(_id);
	}
}

export default new EmailChannel();
