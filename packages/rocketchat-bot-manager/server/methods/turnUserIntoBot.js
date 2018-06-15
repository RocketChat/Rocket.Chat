Meteor.methods({
	async turnUserIntoBot(userId) {
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'insertOrUpdateBot' });
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'turnUserIntoBot'
			});
		}

		const update = RocketChat.models.Users.update({ _id: userId }, {
			$set: {
				type: 'bot',
				roles: ['bot']
			}
		});
		if (update <= 0) {
			throw new Meteor.Error('error-not-updated', 'User not updated', {
				method: 'turnUserIntoBot'
			});
		}

		return true;
	}
});
