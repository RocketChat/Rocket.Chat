Meteor.methods({
	async pauseBot(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'pauseBot'
			});
		}

		// if the send fails, throw will be catched by the caller of pauseBot
		const response = await RocketChat.sendClientCommand(bot, { key: 'pauseMessageStream' });
		if (!response.success) {
			throw new Meteor.Error('error-unsuccessful-client-command',
				'Client replied to ClientCommand with an error', {
					method: 'pauseBot',
					error: response.error
				}
			);
		}

		const update = RocketChat.models.Users.update({ _id: bot._id }, {
			$set: {
				'customClientData.pausedMsgStream': true
			}
		});
		if (update > 0) {
			Meteor.call('UserPresence:setDefaultStatus', bot._id, 'busy');
		}
	}
});
