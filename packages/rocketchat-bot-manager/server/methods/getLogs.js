Meteor.methods({
	async getLogs(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getLogs'
			});
		}

		const response = await RocketChat.sendClientCommand(bot, { key: 'getLogs' });
		if (!response.success) {
			throw new Meteor.Error('error-getting-logs', 'Client did not send logs', {
				method: 'getLogs'
			});
		}
		return response.logs;
	}
});
