import { Base } from './_Base';
import _ from 'underscore';

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
