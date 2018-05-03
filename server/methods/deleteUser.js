Meteor.methods({
	deleteUser(userId) {
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteUser'
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'delete-user') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteUser'
			});
		}

		const adminCount = Meteor.users.find({roles: 'admin'}).count();

		const userIsAdmin = user.roles.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteUser',
				action: 'Remove_last_admin'
			});
		}

		RocketChat.deleteUser(userId);

		return true;
	}
});
