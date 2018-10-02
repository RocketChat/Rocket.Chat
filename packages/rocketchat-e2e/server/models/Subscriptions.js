import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Subscriptions.updateGroupE2EKey = function(_id, key) {
	const query = { _id };
	const update = { $set: { E2EKey: key } };
	this.update(query, update);
	return this.findOne({ _id });
};

RocketChat.models.Subscriptions.findByRidWithoutE2EKey = function(rid, options) {
	const query = {
		rid,
		E2EKey: {
			$exists: false,
		},
	};

	return this.find(query, options);
};
