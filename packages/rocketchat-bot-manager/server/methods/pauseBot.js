Meteor.methods({
	async pauseBot(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'pauseBot'
			});
		}

		// if the send fails, throw will be catched by the caller of pauseBot
		await RocketChat.sendClientCommand(bot, { key: 'pauseMessageStream' });
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
