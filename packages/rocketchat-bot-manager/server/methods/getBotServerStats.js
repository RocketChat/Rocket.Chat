Meteor.methods({
	async getBotServerStats(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getBotServerStats'
			});
		}

		const server = {};
		server.totalMessages = RocketChat.models.Messages.find({'u.username': bot.username}).count();
		server.mentionCount = RocketChat.models.Messages.findByMention(bot.username).count();
		server.roomCount = RocketChat.models.Rooms.findWithUsername(bot.username).count();
		return { server };
	}
});
