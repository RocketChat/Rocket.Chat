RocketChat.models.Subscriptions.updateGroupE2EKey = function(_id, key) {
	const query = { _id };
	const update = { $set: { E2EKey: key } };
	this.update(query, update);
	return this.findOne({ _id });
};
