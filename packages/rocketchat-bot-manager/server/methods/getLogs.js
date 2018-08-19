Meteor.methods({
	async getLogs(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getLogs',
			});
		}

		const response = await RocketChat.sendDdpRequest(bot, { key: 'getLogs' });
		if (!response.success) {
			throw new Meteor.Error('error-unsuccessful-ddp-request',
				'Client replied to DDP Request with an error', {
					method: 'getLogs',
					error: response.error,
				}
			);
		}
		return response.data;
	},
});
