Meteor.methods({
	async resumeBot(bot) {
		check(bot, Object);

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'pauseBot'
			});
		}

		// if the send fails, throw will be catched by the caller of resumeBot
		await RocketChat.sendClientCommand(bot, { key: 'resumeMessageStream' });
		const update = RocketChat.models.Users.update({ _id: bot._id }, {
			$set: {
				'customClientData.pausedMsgStream': false,
				'customClientData.msgStreamLastActive': new Date()
			}
		});
		if (update > 0) {
			Meteor.call('UserPresence:setDefaultStatus', bot._id, 'online');
		}
	}
});
