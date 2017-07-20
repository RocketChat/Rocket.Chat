RocketChat.models.Subscriptions.updateGroupE2EKey = function(_id, key) {
	const query = { _id };
	const update = { $set: { E2EKey: key } };
	return this.update(query, update);
};