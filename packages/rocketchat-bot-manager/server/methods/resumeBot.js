Meteor.methods({
	resumeBot(bot) {
		check(bot, Object);

		Meteor.call('sendClientCommand', bot, { msg: 'resumeSubscriptions' }, () => {
			return RocketChat.models.Users.update({ _id: bot._id }, {
				$set: {
					'botData.paused': false
				}
			});
		});
	}
});
