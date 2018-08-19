Meteor.methods({
	async getBotLiveStats(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getBotLiveStats',
			});
		}

		// Only send the request if the bot will reply the request
		if (bot.customClientData && bot.customClientData.canGetStatistics) {
			const response = await RocketChat.sendDdpRequest(bot, { key: 'getStatistics' });
			if (!response.success) {
				throw new Meteor.Error('error-unsuccessful-ddp-request',
					'Client replied to DDP Request with an error', {
						method: 'getBotLiveStats',
						error: response.error,
					}
				);
			}
			return response.data;
		}
	},
});
