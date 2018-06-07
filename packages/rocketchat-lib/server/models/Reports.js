import _ from 'underscore';

RocketChat.models.Reports = new class extends RocketChat.models._Base {
	constructor() {
		super('reports');
	}
	createWithMessageDescriptionAndUserId(message, description, userId, extraData) {
		const record = {
			message,
			description,
			ts: new Date(),
			userId
		};
		_.extend(record, extraData);
		record._id = this.insert(record);
		return record;
	}
};
