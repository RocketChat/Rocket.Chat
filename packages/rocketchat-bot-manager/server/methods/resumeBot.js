Meteor.methods({
	async resumeBot(bot) {
		check(bot, Object);

		await RocketChat.sendClientCommand(bot, { key: 'resumeMessageStream' });
		const update = RocketChat.models.Users.update({ _id: bot._id }, {
			$set: {
				'botData.paused': false
			}
		});
		if (update > 0) {
			Meteor.call('UserPresence:setDefaultStatus', bot._id, 'online');
		}
	}
});
