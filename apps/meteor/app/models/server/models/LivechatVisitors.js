import { Base } from './_Base';

export class LivechatVisitors extends Base {
	constructor() {
		super('livechat_visitor');
	}
	/**
	 * Find a visitor by their phone number
	 * @return {object} User from db
	 */

	getVisitorsBetweenDate(date) {
		const query = {
			_updatedAt: {
				$gte: date.gte, // ISO Date, ts >= date.gte
				$lt: date.lt, // ISODate, ts < date.lt
			},
		};

		return this.find(query, { fields: { _id: 1 } });
	}

	// REMOVE
}

export default new LivechatVisitors();
