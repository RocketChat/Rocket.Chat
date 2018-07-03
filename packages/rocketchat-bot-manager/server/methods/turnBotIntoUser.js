Meteor.methods({
	async turnBotIntoUser(botId, email) {
		check(botId, String);
		// check(email, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'turnBotIntoUser' });
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'turnBotIntoUser'
			});
		}
		const bot = RocketChat.models.Users.findByIdOrUsername(botId);
		if (!bot.emails && !email) {
			throw new Meteor.Error('error-missing-email', 'Can\'t convert bot account to user account without an e-mail', {
				method: 'turnBotIntoUser'
			});
		}

		const userData = {
			_id: botId,
			email
		};

		RocketChat.saveUser(Meteor.userId(), userData);

		const update = RocketChat.models.Users.update({ _id: botId }, {
			$set: {
				type: 'user',
				roles: ['user']
			}
		});
		if (update <= 0) {
			throw new Meteor.Error('error-not-updated', 'Bot not updated', {
				method: 'turnBotIntoUser'
			});
		}

		return true;
	}
});
