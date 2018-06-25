Meteor.methods({
	deleteBot(userId) {
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteBot'
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'delete-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteBot'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);
		if (!user || user.type !== 'bot') {
			throw new Meteor.Error('error-invalid-bot', 'Invalid bot', {
				method: 'deleteBot'
			});
		}

		const adminCount = Meteor.users.find({roles: 'admin'}).count();

		const userIsAdmin = user.roles.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteBot',
				action: 'Remove_last_admin'
			});
		}

		RocketChat.deleteUser(userId);

		return true;
	}
});
