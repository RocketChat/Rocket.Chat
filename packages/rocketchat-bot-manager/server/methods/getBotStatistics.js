import _ from 'underscore';

Meteor.methods({
	async getBotStatistics(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-client') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getBotStatistics'
			});
		}

		let statistics = {};
		statistics.totalMessages = RocketChat.models.Messages.find({'u.username': bot.username}).count();

		try {
			// Only send the command if the bot is online
			if (bot.statusConnection && bot.statusConnection !== 'offline'
				&& bot.customClientData && bot.customClientData.canGetStatistics) {
				const response = await RocketChat.sendClientCommand(bot, { key: 'getStatistics' });
				statistics = _.assign(statistics, response.statistics);
			}
		} catch (err) {
			// Timeout from command, ignore
		}
		return statistics;
	}
});
