Meteor.publish('fullUserData', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const result = RocketChat.getFullUserData({
		userId: this.userId,
		filter: filter,
		limit: limit
	});

	if (!result) {
		return this.ready();
	}

	return result;
});
