Meteor.methods({
	async getBotServerStats(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getBotServerStats'
			});
		}

		const statistics = {};
		statistics.totalMessages = RocketChat.models.Messages.find({'u.username': bot.username}).count();
		statistics.mentionCount = RocketChat.models.Messages.findByMention(bot.username).count();
		return statistics;
	}
});
