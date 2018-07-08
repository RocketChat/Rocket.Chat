Meteor.methods({
	async pingBot(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'pauseBot'
			});
		}

		const start = process.hrtime();
		await RocketChat.sendClientCommand(bot, { key: 'heartbeat' });
		const diff = process.hrtime(start);
		return diff[1]/1000000;
	}
});
