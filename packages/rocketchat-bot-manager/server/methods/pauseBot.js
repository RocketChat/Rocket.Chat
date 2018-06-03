Meteor.methods({
	pauseBot(bot) {
		check(bot, Object);

		Meteor.call('sendClientCommand', bot, { msg: 'pauseMessageStream' }, (err/*, fields*/) => {
			if (err) {
				throw err;
			}
			const update = RocketChat.models.Users.update({ _id: bot._id }, {
				$set: {
					'botData.paused': true
				}
			});
			if (update > 0) {
				return Meteor.call('UserPresence:setDefaultStatus', bot._id, 'busy');
			}
		});
	}
});
