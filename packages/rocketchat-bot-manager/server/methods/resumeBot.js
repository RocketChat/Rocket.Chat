Meteor.methods({
	resumeBot(bot) {
		check(bot, Object);

		Meteor.call('sendClientCommand', bot, { msg: 'resumeMessageStream' }, (err/*, fields*/) => {
			if (err) {
				throw err;
			}
			const update = RocketChat.models.Users.update({ _id: bot._id }, {
				$set: {
					'botData.paused': false
				}
			});
			if (update > 0) {
				return Meteor.call('UserPresence:setDefaultStatus', bot._id, 'online');
			}
		});
	}
});
