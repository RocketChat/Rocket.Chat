Meteor.methods({
	pauseBot(bot) {
		check(bot, Object);
		const promise = new Promise((resolve, reject) => {
			Meteor.call('sendClientCommand', bot, { msg: 'pauseMessageStream' }, (err/*, fields*/) => {
				if (err) {
					return reject(err);
				}
				const update = RocketChat.models.Users.update({ _id: bot._id }, {
					$set: {
						'botData.paused': true
					}
				});
				if (update > 0) {
					Meteor.call('UserPresence:setDefaultStatus', bot._id, 'busy');
				}
				resolve(true);
			});
		});

		return promise;
	}
});
