Meteor.publish('fullUserData', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const result = RocketChat.getFullUserData({
		userId: this.userId,
		filter,
		limit
	});

	if (!result) {
		return this.ready();
	}

	return result;
});
