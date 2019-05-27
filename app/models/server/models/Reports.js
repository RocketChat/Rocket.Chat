import _ from 'underscore';
import { Base } from './_Base';

export const ReportStatus = {
	UNREAD: 0,
	READ: 1,
	RESOLVED: 2,
};

export class Reports extends Base {
	constructor(...args) {
		super(...args);
		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ status: 1 });
	}

	createWithMessageDescriptionAndUserId(message, description, userId, extraData) {
		const record = {
			message,
			description,
			ts: new Date(),
			userId,
			status: ReportStatus.UNREAD,
		};
		_.extend(record, extraData);
		record._id = this.insert(record);
		return record;
	}
	findAll() {
		return this.find();
	}
	findUnresolved() {
		const query = {
			status: {
				$ne: ReportStatus.RESOLVED,
			},
		};

		return this.find(query);
	}
	findResolved() {
		const query = {
			status: ReportStatus.RESOLVED,
		};

		return this.find(query);
	}
}

export default new Reports('reports');
