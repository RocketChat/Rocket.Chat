Meteor.publish('fullBotData', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const result = RocketChat.getFullBotData({
		userId: this.userId,
		filter,
		limit
	});

	if (!result) {
		return this.ready();
	}

	return result;
});
