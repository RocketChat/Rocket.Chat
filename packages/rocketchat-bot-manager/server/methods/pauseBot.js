Meteor.methods({
	pauseBot(bot) {
		check(bot, Object);

		Meteor.call('sendClientCommand', bot, { msg: 'pauseMessageStream' }, (err/*, fields*/) => {
			if (err) {
				throw err;
			}
			return RocketChat.models.Users.update({ _id: bot._id }, {
				$set: {
					'botData.paused': true
				}
			});
		});
	}
});
