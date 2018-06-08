Meteor.methods({
	async pauseBot(bot) {
		check(bot, Object);

		await RocketChat.sendClientCommand(bot, { msg: 'pauseMessageStream' });
		const update = RocketChat.models.Users.update({ _id: bot._id }, {
			$set: {
				'botData.paused': true
			}
		});
		if (update > 0) {
			Meteor.call('UserPresence:setDefaultStatus', bot._id, 'busy');
		}
	}
});
