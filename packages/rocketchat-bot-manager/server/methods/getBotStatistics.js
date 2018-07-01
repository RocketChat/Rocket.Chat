Meteor.methods({
	async getBotStatistics(username) {
		check(username, String);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-client') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getBotStatistics'
			});
		}

		const statistics = {};
		statistics.totalMessages = RocketChat.models.Messages.find({'u.username': username}).count();
		return statistics;
	}
});
