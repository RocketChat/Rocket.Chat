import _ from 'underscore';

import { Base } from './_Base';

export class Reports extends Base {
	constructor() {
		super('reports');
	}

	createWithMessageDescriptionAndUserId(message, description, userId, extraData) {
		const record = {
			message,
			description,
			ts: new Date(),
			userId,
		};
		_.extend(record, extraData);
		record._id = this.insert(record);
		return record;
	}
}

export default new Reports();
