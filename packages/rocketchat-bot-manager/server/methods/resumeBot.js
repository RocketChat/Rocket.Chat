Meteor.methods({
	resumeBot(bot) {
		check(bot, Object);
		const promise = new Promise((resolve, reject) => {
			Meteor.call('sendClientCommand', bot, { msg: 'resumeMessageStream' }, (err/*, fields*/) => {
				if (err) {
					return reject(err);
				}
				const update = RocketChat.models.Users.update({ _id: bot._id }, {
					$set: {
						'botData.paused': false
					}
				});
				if (update > 0) {
					Meteor.call('UserPresence:setDefaultStatus', bot._id, 'online');
				}
				resolve(true);
			});
		});

		return promise;
	}
});
