Meteor.methods({
	getUserRoles() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUserRoles' });
		}

		const options = {
			sort: {
				'username': 1
			},
			fields: {
				username: 1,
				roles: 1
			}
		};

		const roles = RocketChat.models.Roles.find({ scope: 'Users', description: { $exists: 1, $ne: '' } }).fetch();
		return RocketChat.models.Users.findUsersInRoles(_.pluck(roles, '_id'), null, options).fetch();
	}
});
