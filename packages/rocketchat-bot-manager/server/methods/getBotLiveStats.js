Meteor.methods({
	async getBotLiveStats(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getBotLiveStats'
			});
		}

		// Only send the command if the bot will reply the command
		if (bot.customClientData && bot.customClientData.canGetStatistics) {
			const response = await RocketChat.sendClientCommand(bot, { key: 'getStatistics' });
			return response.statistics;
		}
	}
});
