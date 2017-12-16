RocketChat.models.Subscriptions.updateGroupE2EKey = function(_id, key) {
	const query = { _id };
	const update = { $set: { E2EKey: key } };
	this.update(query, update);
	return this.findOne({ _id });
};

RocketChat.models.Subscriptions.fetchGroupE2EKey = function(_id) {
	return this.findOne({ _id }).E2EKey;
};
