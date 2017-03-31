// var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
//   hasProp = {}.hasOwnProperty;

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
