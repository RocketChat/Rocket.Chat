Meteor.methods({
	resumeBot(bot) {
		check(bot, Object);

		Meteor.call('sendClientCommand', bot, { msg: 'resumeMessageStream' }, (err/*, fields*/) => {
			if (err) {
				throw err;
			}
			return RocketChat.models.Users.update({ _id: bot._id }, {
				$set: {
					'botData.paused': false
				}
			});
		});
	}
});
